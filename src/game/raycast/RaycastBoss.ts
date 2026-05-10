import type { BalanceProfile } from '../types/BalanceProfile';
import type { WeaponKind } from '../systems/WeaponTypes';
import { createProjectileSpawns } from '../systems/WeaponSystem';
import { castRay, isWallAt, type RaycastMap } from './RaycastMap';
import type { RaycastEnemyProjectile } from './RaycastEnemySystem';
import type { RaycastPlayerState } from './RaycastPlayerController';
import { normalizeAngle } from './RaycastCombatSystem';

/** Original guardian — not derived from third-party games. */
export const RAYCAST_BOSS_DISPLAY_NAME = 'Volt Archon';
export const RAYCAST_BOSS_ID = 'volt-archon';

/** Volley + HUD tuning presets — extend via authored `bossConfig`, not ad-hoc forks. */
export type RaycastBossBehaviorId = 'volt-archon' | 'bloom-warden';

const GRID_SCALE = 100;
const BOSS_PROJECTILE_SPEED_GRID = 300;
const BOSS_PROJECTILE_DAMAGE = 13;
const BOSS_PROJECTILE_RADIUS = 0.1;
const BOSS_PROJECTILE_COLOR = 0xff8833;

export interface RaycastBossConfig {
  id: string;
  displayName: string;
  x: number;
  y: number;
  maxHealth: number;
  hitRadius: number;
  /** Defaults to Volt Archon sweep / bracket kit. */
  behavior?: RaycastBossBehaviorId;
}

export interface RaycastBossState {
  id: string;
  displayName: string;
  x: number;
  y: number;
  maxHealth: number;
  hitRadius: number;
  health: number;
  phase: 1 | 2;
  behavior: RaycastBossBehaviorId;
  telegraphUntil: number;
  nextVolleyReadyAt: number;
  pendingVolleyAt: number;
  hitFlashUntil: number;
  alive: boolean;
}

function telegraphMs(state: Pick<RaycastBossState, 'phase' | 'behavior'>): number {
  if (state.behavior === 'bloom-warden') {
    /* Bloom Warden: tight twin rails → faster cross bloom — telegraph stays readable */
    return state.phase === 1 ? 720 : 460;
  }
  /* Volt Archon — phase 1: longer read — phase 2: shorter pulse for panic pressure */
  if (state.phase === 1) return 860;
  return 480;
}

function cooldownMs(state: Pick<RaycastBossState, 'phase' | 'behavior'>): number {
  if (state.behavior === 'bloom-warden') {
    return state.phase === 1 ? 2100 : 1520;
  }
  if (state.phase === 1) return 2280;
  return 1580;
}

export function getRaycastBossPhaseLabel(boss: Pick<RaycastBossState, 'phase' | 'behavior'>): string {
  if (boss.behavior === 'bloom-warden') {
    return boss.phase === 1 ? 'PHASE 1: TWIN VEINS' : 'PHASE 2: BLOOM CROSS // PERPENDICULAR';
  }
  return boss.phase === 1 ? 'PHASE 1: TARGET SWEEP' : 'PHASE 2: CORE OVERDRIVE // ION BRACKET';
}

export function createRaycastBossState(config: RaycastBossConfig, time: number): RaycastBossState {
  return {
    id: config.id,
    displayName: config.displayName,
    x: config.x,
    y: config.y,
    maxHealth: config.maxHealth,
    hitRadius: config.hitRadius,
    health: config.maxHealth,
    phase: 1,
    behavior: config.behavior ?? 'volt-archon',
    telegraphUntil: 0,
    nextVolleyReadyAt: time + 1400,
    pendingVolleyAt: 0,
    hitFlashUntil: 0,
    alive: true
  };
}

export function syncRaycastBossPhase(state: RaycastBossState): void {
  const r = state.maxHealth <= 0 ? 0 : state.health / state.maxHealth;
  state.phase = r >= 0.5 ? 1 : 2;
}

export function damageRaycastBoss(state: RaycastBossState, amount: number, time: number): boolean {
  if (!state.alive || amount <= 0) return false;
  state.health = Math.max(0, state.health - amount);
  state.hitFlashUntil = time + 230;
  syncRaycastBossPhase(state);
  if (state.health <= 0) {
    state.alive = false;
    state.telegraphUntil = 0;
    state.pendingVolleyAt = 0;
    return true;
  }
  return false;
}

function rayIntersectsBossDisk(
  px: number,
  py: number,
  ux: number,
  uy: number,
  wallDist: number,
  bx: number,
  by: number,
  br: number
): boolean {
  const ocX = px - bx;
  const ocY = py - by;
  const bLin = 2 * (ocX * ux + ocY * uy);
  const c = ocX * ocX + ocY * ocY - br * br;
  const disc = bLin * bLin - 4 * c;
  if (disc < 0) return false;
  const s = Math.sqrt(disc);
  const t0 = (-bLin - s) / 2;
  const t1 = (-bLin + s) / 2;
  const tMin = Math.min(t0, t1);
  const tMax = Math.max(t0, t1);
  const tHit = tMin >= 0 ? tMin : tMax >= 0 ? tMax : -1;
  return tHit >= 0 && tHit <= wallDist + 0.03;
}

export function computeRaycastBossWeaponDamage(
  state: RaycastBossState,
  player: RaycastPlayerState,
  map: RaycastMap,
  weaponKind: WeaponKind,
  profile: BalanceProfile
): number {
  if (!state.alive) return 0;
  const projectiles = createProjectileSpawns(
    {
      ownerTeam: 'P1',
      origin: { x: player.x, y: player.y },
      direction: { x: Math.cos(player.angle), y: Math.sin(player.angle) },
      weaponKind
    },
    profile
  );

  let total = 0;
  for (const p of projectiles) {
    const ang = Math.atan2(p.vy, p.vx);
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const wallDist = castRay(map, player.x, player.y, ang, player.angle).distance;
    if (rayIntersectsBossDisk(player.x, player.y, ux, uy, wallDist, state.x, state.y, state.hitRadius)) {
      total += p.damage;
    }
  }
  return total;
}

/** Pellets whose rays intersect the boss hit disk — scoring / accuracy instrumentation (Phase 24). */
export function countRaycastBossConnectingPellets(
  state: RaycastBossState,
  player: RaycastPlayerState,
  map: RaycastMap,
  weaponKind: WeaponKind,
  profile: BalanceProfile
): number {
  if (!state.alive) return 0;
  const projectiles = createProjectileSpawns(
    {
      ownerTeam: 'P1',
      origin: { x: player.x, y: player.y },
      direction: { x: Math.cos(player.angle), y: Math.sin(player.angle) },
      weaponKind
    },
    profile
  );
  let n = 0;
  for (const p of projectiles) {
    const ang = Math.atan2(p.vy, p.vx);
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const wallDist = castRay(map, player.x, player.y, ang, player.angle).distance;
    if (rayIntersectsBossDisk(player.x, player.y, ux, uy, wallDist, state.x, state.y, state.hitRadius)) {
      n += 1;
    }
  }
  return n;
}

export function getRaycastBossCrosshairTarget(
  player: Pick<RaycastPlayerState, 'x' | 'y' | 'angle'>,
  wallDistance: number,
  boss: RaycastBossState | null,
  time: number
): import('./RaycastCombatSystem').RaycastCrosshairTargetInfo | null {
  if (!boss?.alive) return null;
  const dx = boss.x - player.x;
  const dy = boss.y - player.y;
  const dist = Math.hypot(dx, dy);
  const angleTo = Math.atan2(dy, dx);
  const delta = Math.abs(normalizeAngle(angleTo - player.angle));
  const tol = Math.max(0.11, boss.hitRadius / Math.max(dist, 0.001));
  if (dist >= wallDistance || delta > tol) return null;
  return {
    id: boss.id,
    kindLabel: boss.displayName.toUpperCase(),
    health: boss.health,
    maxHealth: boss.maxHealth,
    healthRatio: boss.maxHealth <= 0 ? 0 : boss.health / boss.maxHealth,
    isWindingUp: time < boss.telegraphUntil,
    isTelegraphing: time < boss.telegraphUntil
  };
}

function spawnBossProjectile(fromX: number, fromY: number, toX: number, toY: number, time: number): RaycastEnemyProjectile {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const speed = BOSS_PROJECTILE_SPEED_GRID / GRID_SCALE;
  return {
    x: fromX + (dx / len) * 0.35,
    y: fromY + (dy / len) * 0.35,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    damage: BOSS_PROJECTILE_DAMAGE,
    radius: BOSS_PROJECTILE_RADIUS,
    alive: true,
    color: BOSS_PROJECTILE_COLOR,
    createdAt: time
  };
}

function canOccupyBossSpace(map: RaycastMap, x: number, y: number, radius: number): boolean {
  if (isWallAt(map, x, y)) return false;
  const checks = [
    [radius, 0],
    [-radius, 0],
    [0, radius],
    [0, -radius],
    [radius * 0.72, radius * 0.72],
    [radius * 0.72, -radius * 0.72],
    [-radius * 0.72, radius * 0.72],
    [-radius * 0.72, -radius * 0.72]
  ] as const;
  return checks.every(([ox, oy]) => !isWallAt(map, x + ox, y + oy));
}

export function tickRaycastBossMovement(
  state: RaycastBossState,
  map: RaycastMap,
  player: { x: number; y: number; alive: boolean },
  deltaMs: number,
  time: number
): void {
  if (!state.alive || !player.alive || deltaMs <= 0) return;
  const toPlayerX = player.x - state.x;
  const toPlayerY = player.y - state.y;
  const distance = Math.hypot(toPlayerX, toPlayerY);
  if (distance <= 0.001) return;
  const ux = toPlayerX / distance;
  const uy = toPlayerY / distance;
  const strafeSign =
    state.behavior === 'bloom-warden' ? (Math.sin(time / 620) >= 0 ? 1 : -1) : Math.sin(time / 760) >= 0 ? 1 : -1;
  const strafeX = -uy * strafeSign;
  const strafeY = ux * strafeSign;

  const preferredRange =
    state.behavior === 'bloom-warden'
      ? state.phase === 1
        ? 4.15
        : 3.05
      : state.phase === 1
        ? 3.9
        : 2.9;
  const chaseWeight = distance > preferredRange ? 1 : 0.28;
  const strafeWeight =
    state.behavior === 'bloom-warden'
      ? state.phase === 2
        ? 1.02
        : 0.68
      : state.phase === 2
        ? 0.95
        : 0.62;
  const telegraphSlow = time < state.telegraphUntil ? 0.45 : 1;
  const speed =
    (state.behavior === 'bloom-warden'
      ? state.phase === 2
        ? 1.58
        : 1.22
      : state.phase === 2
        ? 1.65
        : 1.18) * telegraphSlow;
  const step = (deltaMs / 1000) * speed;
  const moveX = ux * chaseWeight + strafeX * strafeWeight;
  const moveY = uy * chaseWeight + strafeY * strafeWeight;
  const moveLen = Math.hypot(moveX, moveY) || 1;
  const nx = state.x + (moveX / moveLen) * step;
  const ny = state.y + (moveY / moveLen) * step;

  if (canOccupyBossSpace(map, nx, ny, state.hitRadius + 0.1)) {
    state.x = nx;
    state.y = ny;
    return;
  }
  const slideX = state.x + Math.sign(moveX) * step;
  if (canOccupyBossSpace(map, slideX, state.y, state.hitRadius + 0.1)) {
    state.x = slideX;
    return;
  }
  const slideY = state.y + Math.sign(moveY) * step;
  if (canOccupyBossSpace(map, state.x, slideY, state.hitRadius + 0.1)) {
    state.y = slideY;
  }
}

function fanAngles(base: number, count: number, spread: number): number[] {
  if (count <= 1) return [base];
  const out: number[] = [];
  const step = spread / (count - 1);
  const start = base - spread * 0.5;
  for (let i = 0; i < count; i += 1) out.push(start + step * i);
  return out;
}

export function tickRaycastBossVolleys(
  state: RaycastBossState,
  player: { x: number; y: number; alive: boolean; stationaryMs?: number },
  time: number
): RaycastEnemyProjectile[] {
  if (!state.alive || !player.alive) return [];

  if (state.pendingVolleyAt > 0) {
    if (time < state.pendingVolleyAt) return [];
    state.pendingVolleyAt = 0;
    state.telegraphUntil = 0;

    const base = Math.atan2(player.y - state.y, player.x - state.x);
    const volley: RaycastEnemyProjectile[] = [];
    const playerStationary = (player.stationaryMs ?? 0) >= 1000;

    if (state.behavior === 'bloom-warden') {
      /** Twin rails (phase 1) → fan + perpendicular “bloom” spikes — punishes standing in lane line */
      if (state.phase === 1) {
        for (const a of fanAngles(base, 2, 0.34)) {
          volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time));
        }
      } else {
        const spread = playerStationary ? 0.52 : 0.38;
        const fanCount = playerStationary ? 6 : 4;
        for (const a of fanAngles(base, fanCount, spread)) {
          volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time));
        }
        volley.push(
          spawnBossProjectile(
            state.x,
            state.y,
            state.x + Math.cos(base + Math.PI * 0.5) * 3,
            state.y + Math.sin(base + Math.PI * 0.5) * 3,
            time
          )
        );
        volley.push(
          spawnBossProjectile(
            state.x,
            state.y,
            state.x + Math.cos(base - Math.PI * 0.5) * 3,
            state.y + Math.sin(base - Math.PI * 0.5) * 3,
            time
          )
        );
      }
      return volley;
    }

    if (state.phase === 1) {
      const count = playerStationary ? 3 : 1;
      for (const a of fanAngles(base, count, 0.22)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time));
      }
    } else {
      /** Phase 2: fan + fixed “ion bracket” rails — same damage/speed, forces lateral cut vs hugging center. */
      const count = playerStationary ? 5 : 3;
      for (const a of fanAngles(base, count, playerStationary ? 0.54 : 0.36)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time));
      }
      const bracket = 0.52;
      volley.push(
        spawnBossProjectile(state.x, state.y, state.x + Math.cos(base - bracket) * 3, state.y + Math.sin(base - bracket) * 3, time)
      );
      volley.push(
        spawnBossProjectile(state.x, state.y, state.x + Math.cos(base + bracket) * 3, state.y + Math.sin(base + bracket) * 3, time)
      );
    }
    return volley;
  }

  if (time >= state.nextVolleyReadyAt) {
    state.telegraphUntil = time + telegraphMs(state);
    state.pendingVolleyAt = state.telegraphUntil;
    state.nextVolleyReadyAt = state.pendingVolleyAt + cooldownMs(state);
  }

  return [];
}
