import { describe, expect, it } from 'vitest';
import {
  createRaycastDifficultyDirectorConfig,
  cycleRaycastDifficulty,
  getRaycastDifficultyHealthPickup,
  getRaycastDifficultyPassiveHealConfig,
  getRaycastDifficultyPreset,
  scaleRaycastIncomingDamage
} from '../game/raycast/RaycastDifficulty';

describe('raycast difficulty helpers', () => {
  it('resolves known presets and falls back to standard', () => {
    expect(getRaycastDifficultyPreset('assist')).toMatchObject({
      id: 'assist',
      label: 'Assist'
    });
    expect(getRaycastDifficultyPreset('unknown')).toMatchObject({
      id: 'standard',
      label: 'Standard'
    });
  });

  it('cycles forward and backward through the available presets', () => {
    expect(cycleRaycastDifficulty('assist', 1).id).toBe('standard');
    expect(cycleRaycastDifficulty('standard', 1).id).toBe('hard');
    expect(cycleRaycastDifficulty('assist', -1).id).toBe('hard');
  });

  it('scales incoming damage with safe rounding and minimum chip damage', () => {
    expect(scaleRaycastIncomingDamage(8, 'assist')).toBe(6);
    expect(scaleRaycastIncomingDamage(1, 'assist')).toBe(1);
    expect(scaleRaycastIncomingDamage(10, 'hard')).toBe(12);
    expect(scaleRaycastIncomingDamage(0, 'hard')).toBe(0);
  });

  it('adjusts repair values without making pickups useless', () => {
    expect(getRaycastDifficultyHealthPickup({ restoreAmount: 20 }, 'assist')).toEqual({ restoreAmount: 25 });
    expect(getRaycastDifficultyHealthPickup({ restoreAmount: 20 }, 'standard')).toEqual({ restoreAmount: 20 });
    expect(getRaycastDifficultyHealthPickup({ restoreAmount: 20 }, 'hard')).toEqual({ restoreAmount: 18 });
  });

  it('tunes passive regen conservatively by difficulty', () => {
    expect(getRaycastDifficultyPassiveHealConfig('assist')).toMatchObject({
      delayAfterDamageMs: 4200,
      healPerSecond: 2.4,
      maxHealth: 75
    });
    expect(getRaycastDifficultyPassiveHealConfig('standard')).toMatchObject({
      delayAfterDamageMs: 3000,
      healPerSecond: 2.2,
      maxHealth: 75
    });
    expect(getRaycastDifficultyPassiveHealConfig('hard')).toMatchObject({
      delayAfterDamageMs: 7200,
      healPerSecond: 1.1,
      maxHealth: 55
    });
  });

  it('scales director caps, budget, and cooldowns conservatively', () => {
    expect(
      createRaycastDifficultyDirectorConfig(
        {
          maxEnemiesAlive: 5,
          maxTotalSpawns: 20,
          openingSpawnCount: 2,
          baseSpawnCooldownMs: 5000,
          buildUpSpawnCooldownMs: 4200,
          ambushSpawnCooldownMs: 1600,
          highIntensitySpawnCooldownMs: 2600
        },
        'assist'
      )
    ).toMatchObject({
      maxEnemiesAlive: 4,
      maxTotalSpawns: 17,
      openingSpawnCount: 1,
      baseSpawnCooldownMs: 6000
    });

    expect(
      createRaycastDifficultyDirectorConfig(
        {
          maxEnemiesAlive: 5,
          maxTotalSpawns: 20,
          openingSpawnCount: 2,
          baseSpawnCooldownMs: 5000,
          buildUpSpawnCooldownMs: 4200,
          ambushSpawnCooldownMs: 1600,
          highIntensitySpawnCooldownMs: 2600
        },
        'hard'
      )
    ).toMatchObject({
      maxEnemiesAlive: 6,
      maxTotalSpawns: 23,
      openingSpawnCount: 2,
      baseSpawnCooldownMs: 4400
    });
  });
});
