import { describe, expect, it } from 'vitest';
import { RAYCAST_ATMOSPHERE, calculateEnemyVisibility, calculateFogShade, getAtmosphereForDirector } from '../game/raycast/RaycastAtmosphere';

describe('raycast atmosphere', () => {
  it('darkens distant geometry with fog', () => {
    const atmosphere = getAtmosphereForDirector('EXPLORATION', 1);

    expect(calculateFogShade(2, atmosphere)).toBeGreaterThan(calculateFogShade(9, atmosphere));
    expect(calculateFogShade(30, atmosphere)).toBe(atmosphere.ambientDarkness);
  });

  it('raises corruption tint during intense director states', () => {
    const exploration = getAtmosphereForDirector('EXPLORATION', 1);
    const buildUp = getAtmosphereForDirector('BUILD_UP', 3);
    const ambush = getAtmosphereForDirector('AMBUSH', 5);
    const highIntensity = getAtmosphereForDirector('HIGH_INTENSITY', 5);

    expect(buildUp.corruptionAlpha).toBeGreaterThan(exploration.corruptionAlpha);
    expect(ambush.corruptionAlpha).toBeGreaterThan(exploration.corruptionAlpha);
    expect(highIntensity.pulseAlpha).toBeGreaterThan(buildUp.pulseAlpha);
    expect(ambush.fogEnd).toBeGreaterThan(ambush.fogStart);
  });

  it('softens atmosphere during recovery', () => {
    const highIntensity = getAtmosphereForDirector('HIGH_INTENSITY', 4);
    const recovery = getAtmosphereForDirector('RECOVERY', 1);

    expect(recovery.corruptionAlpha).toBeLessThan(highIntensity.corruptionAlpha);
    expect(recovery.fogStart).toBeGreaterThan(highIntensity.fogStart);
  });

  it('keeps fog and brightness within playable ranges', () => {
    const states = [null, 'EXPLORATION', 'BUILD_UP', 'AMBUSH', 'HIGH_INTENSITY', 'RECOVERY'] as const;

    states.forEach((state) => {
      const atmosphere = getAtmosphereForDirector(state, 5);
      expect(atmosphere.ambientDarkness).toBeGreaterThanOrEqual(0.23);
      expect(atmosphere.ambientDarkness).toBeLessThanOrEqual(0.35);
      expect(atmosphere.fogStart).toBeGreaterThanOrEqual(3.2);
      expect(atmosphere.fogEnd).toBeGreaterThan(atmosphere.fogStart);
      expect(atmosphere.fogEnd).toBeLessThanOrEqual(12);
      expect(atmosphere.corruptionAlpha).toBeGreaterThanOrEqual(0.026);
      expect(atmosphere.corruptionAlpha).toBeLessThanOrEqual(0.18);
      expect(atmosphere.enemyMinVisibility).toBeGreaterThanOrEqual(0.58);
      expect(calculateFogShade(30, atmosphere)).toBe(atmosphere.ambientDarkness);
    });
  });

  it('keeps enemies visible within a fair minimum despite heavy fog', () => {
    const highIntensity = getAtmosphereForDirector('HIGH_INTENSITY', 5);
    const recovery = getAtmosphereForDirector('RECOVERY', 1);

    expect(calculateEnemyVisibility(12, highIntensity)).toBeGreaterThanOrEqual(0.66);
    expect(calculateEnemyVisibility(12, recovery)).toBeGreaterThanOrEqual(0.58);
  });

  it('centralizes readable terminal corruption messages and feedback colors', () => {
    expect(RAYCAST_ATMOSPHERE.messages.key).toBe('ACCESS TOKEN CAPTURED');
    expect(RAYCAST_ATMOSPHERE.messages.spawn).toBe('HOSTILE PROCESS SPAWNED');
    expect(RAYCAST_ATMOSPHERE.messages.secret).toBe('HIDDEN NODE DISCOVERED');
    expect(RAYCAST_ATMOSPHERE.messages.damage).toBe('SIGNAL DEGRADED');
    expect(RAYCAST_ATMOSPHERE.projectileHalo).toBeGreaterThan(0);
    expect(RAYCAST_ATMOSPHERE.pickupHalo).toBeGreaterThan(0);
    expect(RAYCAST_ATMOSPHERE.wallColors[4]).not.toBe(RAYCAST_ATMOSPHERE.wallColors[1]);
    expect(RAYCAST_ATMOSPHERE.wallPatternColors[3]).not.toBe(RAYCAST_ATMOSPHERE.wallPatternColors[1]);
  });
});
