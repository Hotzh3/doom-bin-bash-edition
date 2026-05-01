import { getEnemyConfig } from '../entities/enemyConfig';
import type { EnemyKind } from '../types/game';
import { RAYCAST_LEVEL, type RaycastEnemySpawn } from './RaycastLevel';

export interface RaycastEnemy {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  health: number;
  alive: boolean;
  radius: number;
  color: number;
  lastAttack: number;
  hitFlashUntil: number;
}

export function cloneRaycastEnemies(): RaycastEnemy[] {
  return RAYCAST_LEVEL.initialSpawns.map(createRaycastEnemy);
}

export function createRaycastEnemy(spawn: RaycastEnemySpawn): RaycastEnemy {
  const config = getEnemyConfig(spawn.kind);
  return {
    id: spawn.id,
    kind: spawn.kind,
    x: spawn.x,
    y: spawn.y,
    health: config.health,
    alive: true,
    radius: config.size / 100,
    color: config.color,
    lastAttack: Number.NEGATIVE_INFINITY,
    hitFlashUntil: 0
  };
}
