import { describe, expect, it } from 'vitest';
import { ENEMY_CONFIG } from '../game/entities/enemyConfig';
import { decideEnemyBehavior, getDirection } from '../game/systems/EnemyBehaviorSystem';

describe('EnemyBehaviorSystem', () => {
  it('keeps melee enemies chasing until attack range', () => {
    expect(
      decideEnemyBehavior({
        distanceToTarget: 200,
        enemyAlive: true,
        targetAlive: true,
        config: ENEMY_CONFIG.GRUNT
      }).action
    ).toBe('CHASE');

    expect(
      decideEnemyBehavior({
        distanceToTarget: ENEMY_CONFIG.GRUNT.attackRange,
        enemyAlive: true,
        targetAlive: true,
        config: ENEMY_CONFIG.GRUNT
      }).action
    ).toBe('MELEE_ATTACK');
  });

  it('makes stalkers chase slightly harder than basic melee enemies', () => {
    const decision = decideEnemyBehavior({
      distanceToTarget: 200,
      enemyAlive: true,
      targetAlive: true,
      config: ENEMY_CONFIG.STALKER
    });

    expect(decision.action).toBe('CHASE');
    expect(decision.speedMultiplier).toBeGreaterThan(1);
  });

  it('lets ranged enemies hold firing distance and retreat when crowded', () => {
    expect(
      decideEnemyBehavior({
        distanceToTarget: ENEMY_CONFIG.RANGED.attackRange - 10,
        enemyAlive: true,
        targetAlive: true,
        config: ENEMY_CONFIG.RANGED
      }).action
    ).toBe('RANGED_ATTACK');

    expect(
      decideEnemyBehavior({
        distanceToTarget: 40,
        enemyAlive: true,
        targetAlive: true,
        config: ENEMY_CONFIG.RANGED
      }).action
    ).toBe('RETREAT');
  });

  it('does nothing when enemy or target is dead', () => {
    expect(
      decideEnemyBehavior({
        distanceToTarget: 10,
        enemyAlive: false,
        targetAlive: true,
        config: ENEMY_CONFIG.GRUNT
      }).action
    ).toBe('IDLE');

    expect(
      decideEnemyBehavior({
        distanceToTarget: 10,
        enemyAlive: true,
        targetAlive: false,
        config: ENEMY_CONFIG.GRUNT
      }).action
    ).toBe('IDLE');
  });

  it('calculates normalized directions', () => {
    const direction = getDirection({ x: 0, y: 0 }, { x: 3, y: 4 });

    expect(direction.x).toBeCloseTo(0.6);
    expect(direction.y).toBeCloseTo(0.8);
  });
});
