import type { BalanceProfile } from '../types/BalanceProfile';
import type { WeaponKind } from '../systems/WeaponTypes';
import { createProjectileSpawns } from '../systems/WeaponSystem';
import { castRay, type RaycastMap } from './RaycastMap';
import type { RaycastEnemyProjectile } from './RaycastEnemySystem';
import type { RaycastPlayerState } from './RaycastPlayerController';
import { normalizeAngle } from './RaycastCombatSystem';

/** Original guardian — not derived from third-party games. */
export const RAYCAST_BOSS_DISPLAY_NAME = 'Volt Archon';
export const RAYCAST_BOSS_ID = 'volt-archon';

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
  telegraphUntil: number;
  nextVolleyReadyAt: number;
  pendingVolleyAt: number;
  hitFlashUntil: number;
  alive: boolean;
}

function telegraphMs(phase: 1 | 2): number {
  if (phase === 1) return 780;
  return 520;
}

function cooldownMs(phase: 1 | 2): number {
  if (phase === 1) return 2500;
  return 1750;
}

export function getRaycastBossPhaseLabel(phase: 1 | 2): string {
  return phase === 1 ? 'PHASE 1: TARGET SWEEP' : 'PHASE 2: CORE OVERDRIVE';
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
  state.hitFlashUntil = time + 180;
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
  player: { x: number; y: number; alive: boolean },
  time: number
): RaycastEnemyProjectile[] {
  if (!state.alive || !player.alive) return [];

  if (state.pendingVolleyAt > 0) {
    if (time < state.pendingVolleyAt) return [];
    state.pendingVolleyAt = 0;
    state.telegraphUntil = 0;

    const base = Math.atan2(player.y - state.y, player.x - state.x);
    const volley: RaycastEnemyProjectile[] = [];
    if (state.phase === 1) {
      volley.push(spawnBossProjectile(state.x, state.y, player.x, player.y, time));
    } else {
      for (const a of fanAngles(base, 3, 0.36)) {
        volley.push(spawnBossProjectile(state.x, state.y, state.x + Math.cos(a) * 3, state.y + Math.sin(a) * 3, time));
      }
    }
    return volley;
  }

  if (time >= state.nextVolleyReadyAt) {
    state.telegraphUntil = time + telegraphMs(state.phase);
    state.pendingVolleyAt = state.telegraphUntil;
    state.nextVolleyReadyAt = state.pendingVolleyAt + cooldownMs(state.phase);
  }

  return [];
}
