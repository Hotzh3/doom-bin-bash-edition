import { getEnemyConfig } from '../entities/enemyConfig';
import type { EnemyKind } from '../types/game';
import { RAYCAST_LEVEL, type RaycastEnemySpawn, type RaycastLevel } from './RaycastLevel';

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
  hitFlashUntil: number;
  deathBurstUntil: number;
}

export function cloneRaycastEnemies(level: RaycastLevel = RAYCAST_LEVEL): RaycastEnemy[] {
  return level.initialSpawns.map(createRaycastEnemy);
}

export function createRaycastEnemy(spawn: RaycastEnemySpawn): RaycastEnemy {
  const config = getEnemyConfig(spawn.kind, 'raycast');
  return {
    id: spawn.id,
    kind: spawn.kind,
    x: spawn.x,
    y: spawn.y,
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
    hitFlashUntil: 0,
    deathBurstUntil: 0
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
