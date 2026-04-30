import { describe, expect, it } from 'vitest';
import { ENEMY_CONFIG, ENEMY_KINDS, getEnemyConfig } from '../game/entities/enemyConfig';

describe('enemy config', () => {
  it('defines stats for every enemy kind', () => {
    expect(ENEMY_KINDS).toEqual(['GRUNT', 'BRUTE', 'STALKER']);
    expect(Object.keys(ENEMY_CONFIG)).toEqual(ENEMY_KINDS);

    ENEMY_KINDS.forEach((kind) => {
      const config = getEnemyConfig(kind);
      expect(config.kind).toBe(kind);
      expect(config.health).toBeGreaterThan(0);
      expect(config.speed).toBeGreaterThan(0);
      expect(config.damage).toBeGreaterThan(0);
      expect(config.size).toBeGreaterThan(0);
    });
  });

  it('keeps GRUNT aligned with the original enemy profile', () => {
    expect(ENEMY_CONFIG.GRUNT).toMatchObject({
      health: 60,
      speed: 95,
      damage: 7,
      color: 0xff4f5f,
      size: 28
    });
  });

  it('creates distinct archetype stat profiles', () => {
    expect(ENEMY_CONFIG.BRUTE.health).toBeGreaterThan(ENEMY_CONFIG.GRUNT.health);
    expect(ENEMY_CONFIG.BRUTE.speed).toBeLessThan(ENEMY_CONFIG.GRUNT.speed);
    expect(ENEMY_CONFIG.BRUTE.damage).toBeGreaterThan(ENEMY_CONFIG.GRUNT.damage);

    expect(ENEMY_CONFIG.STALKER.health).toBeLessThan(ENEMY_CONFIG.GRUNT.health);
    expect(ENEMY_CONFIG.STALKER.speed).toBeGreaterThan(ENEMY_CONFIG.GRUNT.speed);
  });
});
