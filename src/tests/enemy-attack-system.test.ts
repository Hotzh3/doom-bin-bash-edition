import { describe, expect, it } from 'vitest';
import type { Enemy } from '../game/entities/Enemy';
import type { Player } from '../game/entities/Player';
import { canEnemyAttack, createEnemyProjectile, markEnemyAttack } from '../game/systems/EnemyAttackSystem';
import type { EnemyKind } from '../game/types/game';

const createEnemyLike = (kind: EnemyKind, lastAttack = 0, alive = true) =>
  ({
    kind,
    alive,
    lastAttack,
    x: 0,
    y: 0
  }) as Enemy;

const createTargetLike = (alive = true) =>
  ({
    alive,
    x: 100,
    y: 0
  }) as Player;

describe('EnemyAttackSystem', () => {
  it('respects attack cooldowns', () => {
    const enemy = createEnemyLike('GRUNT', 1000);
    const target = createTargetLike();

    expect(canEnemyAttack(enemy, target, 1100)).toBe(false);
    expect(canEnemyAttack(enemy, target, 1700)).toBe(true);
  });

  it('blocks dead enemies or dead targets from attacking', () => {
    const enemy = createEnemyLike('GRUNT', 0);
    const target = createTargetLike();

    expect(canEnemyAttack(createEnemyLike('GRUNT', 0, false), target, 2000)).toBe(false);
    expect(canEnemyAttack(enemy, createTargetLike(false), 2000)).toBe(false);
  });

  it('marks the last attack time', () => {
    const enemy = createEnemyLike('GRUNT', 0);

    markEnemyAttack(enemy, 2500);

    expect(enemy.lastAttack).toBe(2500);
  });

  it('creates enemy projectiles aimed at the target', () => {
    const projectile = createEnemyProjectile(createEnemyLike('RANGED'), createTargetLike());

    expect(projectile.ownerTeam).toBe('ENEMY');
    expect(projectile.damage).toBeGreaterThan(0);
    expect(projectile.vx).toBeGreaterThan(0);
    expect(projectile.vy).toBe(0);
  });
});
