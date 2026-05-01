import type { Enemy } from '../entities/Enemy';
import { getEnemyConfig } from '../entities/enemyConfig';
import type { Player } from '../entities/Player';
import type { ProjectileSpawn } from './WeaponTypes';
import { getDirection } from './EnemyBehaviorSystem';

const ENEMY_PROJECTILE_SIZE = {
  width: 13,
  height: 7
} as const;

export function canEnemyAttack(enemy: Enemy, target: Player, time: number): boolean {
  if (!enemy.alive || !target.alive) return false;

  const config = getEnemyConfig(enemy.kind);
  return time - enemy.lastAttack >= config.attackCooldownMs;
}

export function markEnemyAttack(enemy: Enemy, time: number): void {
  enemy.lastAttack = time;
}

export function createEnemyProjectile(enemy: Enemy, target: Player): ProjectileSpawn {
  const config = getEnemyConfig(enemy.kind);
  const direction = getDirection(enemy, target);
  const projectileSpeed = config.projectileSpeed ?? 320;

  return {
    ownerTeam: 'ENEMY',
    weaponKind: 'PISTOL',
    x: enemy.x + direction.x * 20,
    y: enemy.y + direction.y * 20,
    vx: direction.x * projectileSpeed,
    vy: direction.y * projectileSpeed,
    damage: config.damage,
    lifetimeMs: 1400,
    width: ENEMY_PROJECTILE_SIZE.width,
    height: ENEMY_PROJECTILE_SIZE.height,
    tint: config.color,
    explosionRadius: 0
  };
}
