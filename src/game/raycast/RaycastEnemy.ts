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
  attackWindupUntil: number;
  hitFlashUntil: number;
  deathBurstUntil: number;
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
    lastAttack: 0,
    attackWindupUntil: 0,
    hitFlashUntil: 0,
    deathBurstUntil: 0
  };
}
