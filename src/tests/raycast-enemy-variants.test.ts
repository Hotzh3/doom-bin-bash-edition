import { describe, expect, it } from 'vitest';
import { getEnemyConfig } from '../game/entities/enemyConfig';
import {
  applyRaycastVariantToBaseHealth,
  getRaycastFlashDurationMs,
  getRaycastVariantModifiers
} from '../game/raycast/RaycastEnemyVariants';

describe('raycast enemy variants', () => {
  it('applies ELITE and BERSERK stat profiles in opposite directions', () => {
    const base = getEnemyConfig('GRUNT', 'raycast');
    const elite = getRaycastVariantModifiers('ELITE');
    const berserk = getRaycastVariantModifiers('BERSERK');

    expect(applyRaycastVariantToBaseHealth(base, elite)).toBeGreaterThan(base.health);
    expect(applyRaycastVariantToBaseHealth(base, berserk)).toBeLessThan(base.health);
    expect(elite.damageMultiplier).toBeGreaterThan(1);
    expect(berserk.speedMultiplier).toBeGreaterThan(1);
  });

  it('gives SHIELDED frontal reduction and EXPLODER burst damage', () => {
    const shielded = getRaycastVariantModifiers('SHIELDED');
    const exploder = getRaycastVariantModifiers('EXPLODER');

    expect(shielded.frontalDamageReduction).toBeGreaterThan(0.3);
    expect(exploder.exploderBurstDamage).toBeGreaterThan(0);
  });

  it('resolves CORRUPTED with event-influenced minor buffs', () => {
    const event = { effects: { enemySpeedMultiplier: 1.1 } };
    const buffA = getRaycastVariantModifiers('CORRUPTED', event, 0.12);
    const buffB = getRaycastVariantModifiers('CORRUPTED', event, 0.82);

    expect(buffA.speedMultiplier >= 1 || buffA.healthMultiplier >= 1 || buffA.damageMultiplier >= 1).toBe(true);
    expect(buffB.speedMultiplier >= 1 || buffB.healthMultiplier >= 1 || buffB.damageMultiplier >= 1).toBe(true);
  });

  it('scales flash blind duration by difficulty, director intensity, and events', () => {
    const baseEvent = { effects: {} };
    const jamEvent = { effects: { hudSignalJitter: 1, blackoutPulse: true } };

    const assist = getRaycastFlashDurationMs({
      difficultyId: 'assist',
      directorIntensity: 1,
      event: baseEvent
    });
    const hard = getRaycastFlashDurationMs({
      difficultyId: 'hard',
      directorIntensity: 5,
      event: jamEvent
    });

    expect(assist).toBeGreaterThanOrEqual(500);
    expect(hard).toBeGreaterThan(assist);
    expect(hard).toBeLessThanOrEqual(1800);
  });
});
