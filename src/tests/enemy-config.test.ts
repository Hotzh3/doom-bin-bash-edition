import { describe, expect, it } from 'vitest';
import { ARENA_ENEMY_CONFIG, ENEMY_CONFIG, ENEMY_KINDS, getEnemyConfig, RAYCAST_ENEMY_CONFIG } from '../game/entities/enemyConfig';

describe('enemy config', () => {
  it('defines stats for every enemy kind', () => {
    expect(ENEMY_KINDS).toEqual(['GRUNT', 'BRUTE', 'STALKER', 'RANGED', 'SCRAMBLER', 'FLASHER']);
    expect(Object.keys(ENEMY_CONFIG)).toEqual(ENEMY_KINDS);

    ENEMY_KINDS.forEach((kind) => {
      const config = getEnemyConfig(kind);
      expect(config.kind).toBe(kind);
      expect(config.health).toBeGreaterThan(0);
      expect(config.speed).toBeGreaterThan(0);
      expect(config.damage).toBeGreaterThan(0);
      expect(config.size).toBeGreaterThan(0);
      expect(config.attackRange).toBeGreaterThan(0);
      expect(config.detectionRange).toBeGreaterThan(0);
      expect(config.attackCooldownMs).toBeGreaterThan(0);
      expect(config.attackWindupMs).toBeGreaterThanOrEqual(0);
      expect(config.tacticalRole).toMatch(/PRESSURE|DENIAL|FLANK|ZONE_DENIAL|HARASS/);
    });
  });

  it('keeps GRUNT aligned with the basic pressure profile', () => {
    expect(ENEMY_CONFIG.GRUNT).toMatchObject({
      health: 52,
      speed: 142,
      damage: 8,
      color: 0xff4f5f,
      size: 28
    });
  });

  it('adds FLASHER as a purple harassment enemy with base-grunt damage', () => {
    expect(ENEMY_CONFIG.FLASHER.damage).toBe(ENEMY_CONFIG.GRUNT.damage);
    expect(ENEMY_CONFIG.FLASHER.color).not.toBe(ENEMY_CONFIG.GRUNT.color);
    expect(ENEMY_CONFIG.FLASHER.color).toBe(0xb86dff);
  });

  it('creates distinct archetype stat profiles', () => {
    expect(ENEMY_CONFIG.BRUTE.health).toBeGreaterThan(ENEMY_CONFIG.GRUNT.health);
    expect(ENEMY_CONFIG.BRUTE.speed).toBeLessThan(ENEMY_CONFIG.GRUNT.speed);
    expect(ENEMY_CONFIG.BRUTE.damage).toBeGreaterThan(ENEMY_CONFIG.GRUNT.damage);

    expect(ENEMY_CONFIG.STALKER.health).toBeLessThan(ENEMY_CONFIG.GRUNT.health);
    expect(ENEMY_CONFIG.STALKER.speed).toBeGreaterThan(ENEMY_CONFIG.GRUNT.speed);

    expect(ENEMY_CONFIG.RANGED.attackRange).toBeGreaterThan(ENEMY_CONFIG.GRUNT.attackRange);
    expect(ENEMY_CONFIG.RANGED.projectileSpeed).toBeGreaterThan(0);
    expect(ENEMY_CONFIG.RANGED.attackWindupMs).toBeGreaterThan(ENEMY_CONFIG.GRUNT.attackWindupMs);
  });

  it('keeps ranged pressure dodgeable and stalkers fragile', () => {
    expect(ENEMY_CONFIG.STALKER.health).toBeLessThan(ENEMY_CONFIG.RANGED.health);
    expect(ENEMY_CONFIG.STALKER.attackCooldownMs).toBeLessThan(ENEMY_CONFIG.GRUNT.attackCooldownMs);
    expect(ENEMY_CONFIG.RANGED.projectileSpeed).toBeLessThan(ENEMY_CONFIG.STALKER.speed * 1.5);
    expect(ENEMY_CONFIG.BRUTE.attackCooldownMs).toBeGreaterThan(ENEMY_CONFIG.GRUNT.attackCooldownMs);
    expect(ENEMY_CONFIG.BRUTE.health).toBeGreaterThan(ENEMY_CONFIG.GRUNT.health * 3);
  });

  it('isolates arena and raycast enemy config records', () => {
    expect(ENEMY_CONFIG).toBe(ARENA_ENEMY_CONFIG);
    expect(getEnemyConfig('STALKER', 'arena')).toBe(ARENA_ENEMY_CONFIG.STALKER);
    expect(getEnemyConfig('STALKER', 'raycast')).toBe(RAYCAST_ENEMY_CONFIG.STALKER);
    expect(RAYCAST_ENEMY_CONFIG.STALKER).not.toBe(ARENA_ENEMY_CONFIG.STALKER);
    expect(RAYCAST_ENEMY_CONFIG.STALKER).toMatchObject({
      ...ARENA_ENEMY_CONFIG.STALKER,
      color: 0x54e898,
      speed: 268,
      attackCooldownMs: 410,
      size: 26,
      attackWindupMs: 100
    });
  });
});
