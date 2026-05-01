import { describe, expect, it } from 'vitest';
import { calculateFogShade, getAtmosphereForDirector } from '../game/raycast/RaycastAtmosphere';

describe('raycast atmosphere', () => {
  it('darkens distant geometry with fog', () => {
    const atmosphere = getAtmosphereForDirector('EXPLORATION', 1);

    expect(calculateFogShade(2, atmosphere)).toBeGreaterThan(calculateFogShade(9, atmosphere));
    expect(calculateFogShade(30, atmosphere)).toBe(atmosphere.ambientDarkness);
  });

  it('raises corruption tint during intense director states', () => {
    const exploration = getAtmosphereForDirector('EXPLORATION', 1);
    const ambush = getAtmosphereForDirector('AMBUSH', 5);

    expect(ambush.corruptionAlpha).toBeGreaterThan(exploration.corruptionAlpha);
    expect(ambush.fogEnd).toBeGreaterThan(ambush.fogStart);
  });

  it('softens atmosphere during recovery', () => {
    const highIntensity = getAtmosphereForDirector('HIGH_INTENSITY', 4);
    const recovery = getAtmosphereForDirector('RECOVERY', 1);

    expect(recovery.corruptionAlpha).toBeLessThan(highIntensity.corruptionAlpha);
    expect(recovery.fogStart).toBeGreaterThan(highIntensity.fogStart);
  });
});
