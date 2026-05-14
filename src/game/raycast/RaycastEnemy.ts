import { getEnemyConfig } from '../entities/enemyConfig';
import type { EnemyKind } from '../types/game';
import type { RaycastEnemyVariant } from './RaycastEnemyVariants';
import { RAYCAST_LEVEL, type RaycastEnemySpawn, type RaycastLevel } from './RaycastLevel';
import { buildRaycastPatrolWaypoints, hashStringToSeed, type PatrolWaypoint } from './RaycastPatrol';

export interface RaycastEnemy {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  alive: boolean;
  radius: number;
  color: number;
  lastAttack: number;
  spawnTelegraphStartedAt: number;
  spawnTelegraphUntil: number;
  attackWindupStartedAt: number;
  attackWindupUntil: number;
  /** Brief combat disruption after impact — keeps encounters readable without new AI states. */
  staggerUntil: number;
  hitFlashUntil: number;
  deathBurstUntil: number;
  patrolWaypoints: PatrolWaypoint[];
  patrolWaypointIndex: number;
  /** While `time < alertUntilTime`, enemy searches toward last known player position. */
  alertUntilTime: number;
  lastKnownPlayerX: number;
  lastKnownPlayerY: number;
  /** Tracks prior tick combat (CHASE / ATTACK / RETREAT) for alert transition. */
  wasCombatActiveLastTick: boolean;
  /** Idle wander heading (radians). */
  roamHeadingRad: number;
  /** Next game time (ms) to pick a new roam heading even if not stuck. */
  roamNextRedirectAt: number;
  roamStuckMs: number;
  damageMultiplier?: number;
  speedMultiplier?: number;
  projectileSpeedMultiplier?: number;
  variant?: RaycastEnemyVariant;
  variantAccentColor?: number;
  frontalDamageReduction?: number;
  shieldPulseUntil?: number;
  exploderBurstDamage?: number;
  exploded?: boolean;
  flashCooldownUntil?: number;
}

export function cloneRaycastEnemies(level: RaycastLevel = RAYCAST_LEVEL): RaycastEnemy[] {
  return level.initialSpawns.map(createRaycastEnemy);
}

export function createRaycastEnemy(spawn: RaycastEnemySpawn): RaycastEnemy {
  const config = getEnemyConfig(spawn.kind, 'raycast');
  const homeX = spawn.x;
  const homeY = spawn.y;
  return {
    id: spawn.id,
    kind: spawn.kind,
    x: homeX,
    y: homeY,
    health: config.health,
    maxHealth: config.health,
    alive: true,
    radius: config.size / 100,
    color: config.color,
    lastAttack: 0,
    spawnTelegraphStartedAt: 0,
    spawnTelegraphUntil: 0,
    attackWindupStartedAt: 0,
    attackWindupUntil: 0,
    staggerUntil: 0,
    hitFlashUntil: 0,
    deathBurstUntil: 0,
    patrolWaypoints: buildRaycastPatrolWaypoints(homeX, homeY, spawn.id),
    patrolWaypointIndex: 0,
    alertUntilTime: 0,
    lastKnownPlayerX: homeX,
    lastKnownPlayerY: homeY,
    wasCombatActiveLastTick: false,
    roamHeadingRad: (hashStringToSeed(spawn.id) % 360) * (Math.PI / 180),
    roamNextRedirectAt: 0,
    roamStuckMs: 0,
    damageMultiplier: 1,
    speedMultiplier: 1,
    projectileSpeedMultiplier: 1,
    variant: 'BASE',
    frontalDamageReduction: 0,
    exploderBurstDamage: 0,
    exploded: false,
    flashCooldownUntil: 0
  };
}

export function createTelegraphedRaycastEnemy(
  spawn: RaycastEnemySpawn,
  options: {
    telegraphStartedAt: number;
    telegraphDurationMs: number;
  }
): RaycastEnemy {
  const enemy = createRaycastEnemy(spawn);
  enemy.spawnTelegraphStartedAt = options.telegraphStartedAt;
  enemy.spawnTelegraphUntil = options.telegraphStartedAt + Math.max(0, options.telegraphDurationMs);
  return enemy;
}

export function isRaycastEnemyTelegraphing(enemy: RaycastEnemy, time: number): boolean {
  return enemy.alive && enemy.spawnTelegraphUntil > time && enemy.spawnTelegraphStartedAt >= 0;
}

export function didRaycastEnemyFinishTelegraph(enemy: RaycastEnemy, previousTime: number, currentTime: number): boolean {
  if (!enemy.alive) return false;
  if (enemy.spawnTelegraphStartedAt < 0 || enemy.spawnTelegraphUntil <= 0) return false;
  return previousTime < enemy.spawnTelegraphUntil && currentTime >= enemy.spawnTelegraphUntil;
}

export function getRaycastEnemySpawnTelegraphProgress(enemy: RaycastEnemy, time: number): number {
  if (!isRaycastEnemyTelegraphing(enemy, time)) return 0;
  const totalDuration = enemy.spawnTelegraphUntil - enemy.spawnTelegraphStartedAt;
  if (totalDuration <= 0) return 1;
  return Math.min(1, Math.max(0, (time - enemy.spawnTelegraphStartedAt) / totalDuration));
}

export function isRaycastEnemyWindingUp(enemy: RaycastEnemy, time: number): boolean {
  return enemy.alive && enemy.attackWindupUntil > time && enemy.attackWindupStartedAt > 0;
}

export function getRaycastEnemyWindupProgress(enemy: RaycastEnemy, time: number): number {
  if (!isRaycastEnemyWindingUp(enemy, time)) return 0;
  const totalDuration = enemy.attackWindupUntil - enemy.attackWindupStartedAt;
  if (totalDuration <= 0) return 1;
  return Math.min(1, Math.max(0, (time - enemy.attackWindupStartedAt) / totalDuration));
}
