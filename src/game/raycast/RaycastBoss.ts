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
export type RaycastBossBehaviorId = 'volt-archon' | 'bloom-warden' | 'ash-judge';

const GRID_SCALE = 100;
const BOSS_PROJECTILE_SPEED_GRID = 300;
const BOSS_PROJECTILE_DAMAGE = 13;
const BOSS_PROJECTILE_RADIUS = 0.1;
const BOSS_PROJECTILE_COLOR = 0xff8833;
/** Bloom Warden volleys — toxic yellow-green read vs Volt Archon ion orange (Phase 30). */
const BLOOM_WARDEN_PROJECTILE_COLOR = 0xa8dd58;
const ASH_JUDGE_PROJECTILE_COLOR = 0xff5522;
const PHASE_TWO_DAMAGE_MUL = 1.05;
const PHASE_THREE_DAMAGE_MUL = 1.15;

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

export type RaycastBossArenaTwist = 'none' | 'ion_veil' | 'lateral_lane' | 'retreat_cut';

export interface RaycastBossState {
  id: string;
  displayName: string;
  x: number;
  y: number;
  maxHealth: number;
  hitRadius: number;
  health: number;
  phase: 1 | 2 | 3;
  behavior: RaycastBossBehaviorId;
  telegraphUntil: number;
  nextVolleyReadyAt: number;
  pendingVolleyAt: number;
  hitFlashUntil: number;
  alive: boolean;
  /** Telegraphed arena read — atmosphere / director hints only (no silent grid edits). */
  arenaTwist: RaycastBossArenaTwist;
  arenaTwistUntil: number;
}

function telegraphMs(state: Pick<RaycastBossState, 'phase' | 'behavior'>): number {
  if (state.behavior === 'ash-judge') {
    return state.phase === 1 ? 800 : state.phase === 2 ? 600 : 500;
  }
  if (state.behavior === 'bloom-warden') {
    return state.phase === 1 ? 740 : state.phase === 2 ? 560 : 460;
  }
  /* Volt Archon scales pressure by phase while preserving readable telegraphs. */
  if (state.phase === 1) return 860;
  if (state.phase === 2) return 620;
  return 500;
}

function cooldownMs(state: Pick<RaycastBossState, 'phase' | 'behavior'>): number {
  if (state.behavior === 'ash-judge') {
    return state.phase === 1 ? 2080 : state.phase === 2 ? 1720 : 1420;
  }
  if (state.behavior === 'bloom-warden') {
    return state.phase === 1 ? 2100 : state.phase === 2 ? 1720 : 1320;
  }
  if (state.phase === 1) return 2280;
  if (state.phase === 2) return 1760;
  return 1400;
}

export function getRaycastBossPhaseLabel(boss: Pick<RaycastBossState, 'phase' | 'behavior'>): string {
  if (boss.behavior === 'ash-judge') {
    if (boss.phase === 1) return 'PHASE 1: CINDER SPIRES';
    if (boss.phase === 2) return 'PHASE 2: MERIDIAN HALO // SPLIT CUT';
    return 'PHASE 3: VERDICT MAELSTROM // EMBER SHEAR';
  }
  if (boss.behavior === 'bloom-warden') {
    if (boss.phase === 1) return 'PHASE 1: TWIN VEINS';
    if (boss.phase === 2) return 'PHASE 2: BLOOM CROSS // PERPENDICULAR';
    return 'PHASE 3: THORN MAELSTROM // LATTICE SWARM';
  }
  if (boss.phase === 1) return 'PHASE 1: TARGET SWEEP';
  if (boss.phase === 2) return 'PHASE 2: CORE OVERDRIVE // ION BRACKET';
  return 'PHASE 3: ARC STORM // HALO COLLAPSE';
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
    alive: true,
    arenaTwist: 'none',
    arenaTwistUntil: 0
  };
}

function applyBossPhaseArenaTwist(state: RaycastBossState, time: number): void {
  if (state.behavior === 'bloom-warden') {
    state.arenaTwist = 'lateral_lane';
  } else if (state.behavior === 'ash-judge') {
    state.arenaTwist = 'retreat_cut';
  } else {
    state.arenaTwist = 'ion_veil';
  }
  state.arenaTwistUntil = time + 5400;
}

export function tickRaycastBossArenaTwist(state: RaycastBossState, time: number): void {
  if (state.arenaTwist !== 'none' && state.arenaTwistUntil > 0 && time >= state.arenaTwistUntil) {
    state.arenaTwist = 'none';
    state.arenaTwistUntil = 0;
  }
}

export function syncRaycastBossPhase(state: RaycastBossState): void {
  const r = state.maxHealth <= 0 ? 0 : state.health / state.maxHealth;
  state.phase = r > 2 / 3 ? 1 : r > 1 / 3 ? 2 : 3;
}

export interface RaycastBossDamageKnockback {
  fromX: number;
  fromY: number;
  map: RaycastMap;
}

export function damageRaycastBoss(
  state: RaycastBossState,
  amount: number,
  time: number,
  knockback?: RaycastBossDamageKnockback
): boolean {
  if (!state.alive || amount <= 0) return false;
  const phaseBefore = state.phase;
  state.health = Math.max(0, state.health - amount);
  state.hitFlashUntil = time + 230;
  syncRaycastBossPhase(state);
  if (knockback && state.health > 0) {
    const resist = 0.27;
    const push = Math.min(0.048, 0.008 + amount * 0.00032) * resist;
    const dx = state.x - knockback.fromX;
    const dy = state.y - knockback.fromY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = state.x + (dx / len) * push;
    const ny = state.y + (dy / len) * push;
    if (canOccupyBossSpace(knockback.map, nx, state.y, state.hitRadius + 0.1)) state.x = nx;
    else if (canOccupyBossSpace(knockback.map, state.x + Math.sign(dx) * push * 0.62, state.y, state.hitRadius + 0.1)) {
      state.x += Math.sign(dx) * push * 0.62;
    }
    if (canOccupyBossSpace(knockback.map, state.x, ny, state.hitRadius + 0.1)) state.y = ny;
    else if (canOccupyBossSpace(knockback.map, state.x, state.y + Math.sign(dy) * push * 0.62, state.hitRadius + 0.1)) {
      state.y += Math.sign(dy) * push * 0.62;
    }
  }
  if (state.health <= 0) {
    state.alive = false;
    state.telegraphUntil = 0;
    state.pendingVolleyAt = 0;
    state.arenaTwist = 'none';
    state.arenaTwistUntil = 0;
    return true;
  }
  if (phaseBefore === 1 && state.phase === 2) {
    applyBossPhaseArenaTwist(state, time);
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

function spawnBossProjectile(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  time: number,
  color: number = BOSS_PROJECTILE_COLOR,
  damage: number = BOSS_PROJECTILE_DAMAGE
): RaycastEnemyProjectile {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const speed = BOSS_PROJECTILE_SPEED_GRID / GRID_SCALE;
  return {
    x: fromX + (dx / len) * 0.35,
    y: fromY + (dy / len) * 0.35,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    damage,
    radius: BOSS_PROJECTILE_RADIUS,
    alive: true,
    color,
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
    state.behavior === 'ash-judge'
      ? Math.sin(time / 540) >= 0
        ? 1
        : -1
      : state.behavior === 'bloom-warden'
        ? Math.sin(time / 620) >= 0
          ? 1
          : -1
        : Math.sin(time / 760) >= 0
          ? 1
          : -1;
  const strafeX = -uy * strafeSign;
  const strafeY = ux * strafeSign;

  const preferredRange =
    state.behavior === 'ash-judge'
      ? state.phase === 1
        ? 4.0
        : state.phase === 2
          ? 3.42
          : 3.1
      : state.behavior === 'bloom-warden'
        ? state.phase === 1
          ? 4.15
          : state.phase === 2
            ? 3.38
            : 2.95
        : state.phase === 1
          ? 3.9
          : state.phase === 2
            ? 3.3
            : 2.85;
  const chaseWeight = distance > preferredRange ? 1 : 0.28;
  const strafeWeight =
    state.behavior === 'ash-judge'
      ? state.phase === 3
        ? 1.18
        : state.phase === 2
          ? 0.96
          : 0.72
      : state.behavior === 'bloom-warden'
        ? state.phase === 3
          ? 1.2
          : state.phase === 2
            ? 0.92
            : 0.68
        : state.phase === 3
          ? 1.12
          : state.phase === 2
            ? 0.84
            : 0.62;
  const telegraphSlow = time < state.telegraphUntil ? 0.45 : 1;
  const speed =
    (state.behavior === 'ash-judge'
      ? state.phase === 3
        ? 1.72
        : state.phase === 2
          ? 1.48
          : 1.2
      : state.behavior === 'bloom-warden'
        ? state.phase === 3
          ? 1.88
          : state.phase === 2
            ? 1.58
            : 1.22
        : state.phase === 3
          ? 1.82
          : state.phase === 2
            ? 1.56
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
    const pelletColor =
      state.behavior === 'bloom-warden'
        ? BLOOM_WARDEN_PROJECTILE_COLOR
        : state.behavior === 'ash-judge'
          ? ASH_JUDGE_PROJECTILE_COLOR
          : BOSS_PROJECTILE_COLOR;
    const phaseDamageMul = state.phase === 3 ? PHASE_THREE_DAMAGE_MUL : state.phase === 2 ? PHASE_TWO_DAMAGE_MUL : 1;
    const projectileDamage = Math.max(1, Math.round(BOSS_PROJECTILE_DAMAGE * phaseDamageMul));

    if (state.behavior === 'ash-judge') {
      if (state.phase === 1) {
        const spin = time * 0.00105;
        for (let i = 0; i < 3; i += 1) {
          const a = spin + (i * Math.PI * 2) / 3;
          volley.push(
            spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor, projectileDamage)
          );
        }
      } else if (state.phase === 2) {
        const spread = playerStationary ? 0.58 : 0.42;
        const fanCount = playerStationary ? 6 : 4;
        for (const a of fanAngles(base, fanCount, spread)) {
          volley.push(
            spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor, projectileDamage)
          );
        }
        volley.push(
          spawnBossProjectile(
            state.x,
            state.y,
            state.x + Math.cos(base + Math.PI * 0.5) * 3,
            state.y + Math.sin(base + Math.PI * 0.5) * 3,
            time,
            pelletColor,
            projectileDamage
          )
        );
        volley.push(
          spawnBossProjectile(
            state.x,
            state.y,
            state.x + Math.cos(base - Math.PI * 0.5) * 3,
            state.y + Math.sin(base - Math.PI * 0.5) * 3,
            time,
            pelletColor,
            projectileDamage
          )
        );
      } else {
        const spread = playerStationary ? 0.84 : 0.7;
        const fanCount = playerStationary ? 8 : 6;
        for (const a of fanAngles(base, fanCount, spread)) {
          volley.push(
            spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor, projectileDamage)
          );
        }
        const spin = time * 0.00122;
        for (let i = 0; i < 4; i += 1) {
          const a = spin + (i * Math.PI * 2) / 4;
          volley.push(
            spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor, projectileDamage)
          );
        }
      }
      return volley;
    }

    if (state.behavior === 'bloom-warden') {
      if (state.phase === 1) {
        for (const a of fanAngles(base, 2, 0.34)) {
          volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
        }
      } else if (state.phase === 2) {
        const spread = playerStationary ? 0.52 : 0.38;
        const fanCount = playerStationary ? 6 : 4;
        for (const a of fanAngles(base, fanCount, spread)) {
          volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
        }
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(base + Math.PI * 0.5) * 3, state.y + Math.sin(base + Math.PI * 0.5) * 3, time, pelletColor));
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(base - Math.PI * 0.5) * 3, state.y + Math.sin(base - Math.PI * 0.5) * 3, time, pelletColor));
      } else {
        const spread = playerStationary ? 0.82 : 0.62;
        const fanCount = playerStationary ? 7 : 5;
        for (const a of fanAngles(base, fanCount, spread)) {
          volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
        }
        for (let i = 0; i < 4; i += 1) {
          const a = (i * Math.PI) / 2 + time * 0.00085;
          volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
        }
      }
      return volley;
    }

    if (state.phase === 1) {
      const count = playerStationary ? 3 : 1;
      for (const a of fanAngles(base, count, 0.22)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
      }
    } else if (state.phase === 2) {
      /** Phase 2: fan + fixed “ion bracket” rails — same damage/speed, forces lateral cut vs hugging center. */
      const count = playerStationary ? 5 : 3;
      for (const a of fanAngles(base, count, playerStationary ? 0.54 : 0.36)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
      }
      const bracket = 0.52;
      volley.push(
        spawnBossProjectile(
          state.x,
          state.y,
          state.x + Math.cos(base - bracket) * 3,
          state.y + Math.sin(base - bracket) * 3,
          time,
          pelletColor
        )
      );
      volley.push(
        spawnBossProjectile(
          state.x,
          state.y,
          state.x + Math.cos(base + bracket) * 3,
          state.y + Math.sin(base + bracket) * 3,
          time,
          pelletColor
        )
      );
    } else {
      const count = playerStationary ? 7 : 5;
      for (const a of fanAngles(base, count, playerStationary ? 0.92 : 0.68)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
      }
      for (const a of fanAngles(base + Math.PI * 0.5, 3, 0.54)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time, pelletColor));
      }
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
