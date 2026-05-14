import { describe, expect, it } from 'vitest';
import {
  applyWorldSegmentToAtmosphere,
  getAtmosphereForDirector,
  getRaycastCombatMessageForSegment,
  getRaycastIntroMessageForSegment,
  getRaycastBossHudLines,
  RAYCAST_ATMOSPHERE,
  RAYCAST_ATMOSPHERE_WORLD2,
  RAYCAST_ATMOSPHERE_WORLD3,
  RAYCAST_WORLD1_SEGMENT_LAYER,
  RAYCAST_WORLD2_SEGMENT_LAYER,
  RAYCAST_WORLD3_SEGMENT_LAYER,
  calculateEnemyVisibility,
  calculateFogShade
} from '../game/raycast/RaycastAtmosphere';

describe('raycast atmosphere', () => {
  it('darkens distant geometry with fog', () => {
    const atmosphere = getAtmosphereForDirector('CALM', 1);

    expect(calculateFogShade(2, atmosphere)).toBeGreaterThan(calculateFogShade(9, atmosphere));
    expect(calculateFogShade(30, atmosphere)).toBe(atmosphere.ambientDarkness);
  });

  it('eases fog falloff so mid-range depth reads clearly', () => {
    const atmosphere = getAtmosphereForDirector('CALM', 2);
    expect(calculateFogShade(4, atmosphere)).toBeGreaterThan(calculateFogShade(8, atmosphere));
    expect(calculateFogShade(8, atmosphere)).toBeGreaterThan(calculateFogShade(30, atmosphere));
  });

  it('raises corruption tint during intense director states', () => {
    const exploration = getAtmosphereForDirector('CALM', 1);
    const buildUp = getAtmosphereForDirector('WATCHING', 3);
    const warning = getAtmosphereForDirector('WARNING', 4);
    const ambush = getAtmosphereForDirector('AMBUSH', 5);
    const highIntensity = getAtmosphereForDirector('PRESSURE', 5);

    expect(buildUp.corruptionAlpha).toBeGreaterThan(exploration.corruptionAlpha);
    expect(warning.pulseAlpha).toBeGreaterThan(buildUp.pulseAlpha);
    expect(ambush.corruptionAlpha).toBeGreaterThan(exploration.corruptionAlpha);
    expect(highIntensity.pulseAlpha).toBeGreaterThan(buildUp.pulseAlpha);
    expect(ambush.fogEnd).toBeGreaterThan(ambush.fogStart);
  });

  it('softens atmosphere during recovery', () => {
    const highIntensity = getAtmosphereForDirector('PRESSURE', 4);
    const recovery = getAtmosphereForDirector('RECOVERY', 1);

    expect(recovery.corruptionAlpha).toBeLessThan(highIntensity.corruptionAlpha);
    expect(recovery.fogStart).toBeGreaterThan(highIntensity.fogStart);
  });

  it('keeps fog and brightness within playable ranges', () => {
    const states = [null, 'CALM', 'WATCHING', 'WARNING', 'AMBUSH', 'PRESSURE', 'RECOVERY'] as const;

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
    const highIntensity = getAtmosphereForDirector('PRESSURE', 5);
    const recovery = getAtmosphereForDirector('RECOVERY', 1);

    expect(calculateEnemyVisibility(12, highIntensity)).toBeGreaterThanOrEqual(0.66);
    expect(calculateEnemyVisibility(12, recovery)).toBeGreaterThanOrEqual(0.58);
  });

  it('layers ion-stratum atmosphere for World 2 without breaking fog ordering or caps', () => {
    const states = [null, 'CALM', 'WATCHING', 'WARNING', 'AMBUSH', 'PRESSURE', 'RECOVERY'] as const;
    states.forEach((state) => {
      const base = getAtmosphereForDirector(state, 4);
      const w2 = applyWorldSegmentToAtmosphere(base, 'world2');
      expect(w2.fogColor).toBe(RAYCAST_ATMOSPHERE_WORLD2.fogColor);
      expect(w2.fogEnd).toBeLessThanOrEqual(RAYCAST_WORLD2_SEGMENT_LAYER.fogEndCap);
      expect(w2.fogStart).toBeLessThan(w2.fogEnd);
      expect(w2.corruptionAlpha).toBeCloseTo(base.corruptionAlpha * RAYCAST_WORLD2_SEGMENT_LAYER.corruptionAlphaScale, 6);
      expect(w2.pulseAlpha).toBeCloseTo(base.pulseAlpha * RAYCAST_WORLD2_SEGMENT_LAYER.pulseAlphaScale, 6);
      expect(w2.enemyMinVisibility).toBeGreaterThanOrEqual(base.enemyMinVisibility);
      expect(w2.enemyMinVisibility).toBeLessThanOrEqual(RAYCAST_WORLD2_SEGMENT_LAYER.enemyMinVisibilityCap);
    });
  });

  it('layers ember atmosphere for World 3 without breaking fog ordering or caps', () => {
    const base = getAtmosphereForDirector('PRESSURE', 4);
    const w3 = applyWorldSegmentToAtmosphere(base, 'world3');
    expect(w3.fogColor).toBe(RAYCAST_ATMOSPHERE_WORLD3.fogColor);
    expect(w3.fogEnd).toBeLessThanOrEqual(RAYCAST_WORLD3_SEGMENT_LAYER.fogEndCap);
    expect(w3.corruptionAlpha).toBeCloseTo(base.corruptionAlpha * RAYCAST_WORLD3_SEGMENT_LAYER.corruptionAlphaScale, 6);
  });

  it('layers forge-stratum atmosphere for World 1 (tighter envelope vs abyss cold)', () => {
    const states = [null, 'CALM', 'WATCHING', 'WARNING', 'AMBUSH', 'PRESSURE', 'RECOVERY'] as const;
    states.forEach((state) => {
      const base = getAtmosphereForDirector(state, 4);
      const w1 = applyWorldSegmentToAtmosphere(base, 'world1');
      expect(w1).not.toBe(base);
      expect(w1.fogEnd).toBeGreaterThanOrEqual(RAYCAST_WORLD1_SEGMENT_LAYER.fogEndFloor);
      expect(w1.fogStart).toBeLessThan(w1.fogEnd);
      expect(w1.corruptionAlpha).toBeCloseTo(base.corruptionAlpha * RAYCAST_WORLD1_SEGMENT_LAYER.corruptionAlphaScale, 6);
      expect(w1.pulseAlpha).toBeCloseTo(base.pulseAlpha * RAYCAST_WORLD1_SEGMENT_LAYER.pulseAlphaScale, 6);
      expect(w1.enemyMinVisibility).toBeGreaterThanOrEqual(base.enemyMinVisibility);
      expect(w1.enemyMinVisibility).toBeLessThanOrEqual(RAYCAST_WORLD1_SEGMENT_LAYER.enemyMinVisibilityCap);
    });
  });

  it('keeps a stable top intro lockup across world segments', () => {
    expect(getRaycastIntroMessageForSegment('world1')).toBe('DOOM BIN BASH EDITION');
    expect(getRaycastIntroMessageForSegment('world2')).toBe('DOOM BIN BASH EDITION');
    expect(getRaycastIntroMessageForSegment('world3')).toBe('DOOM BIN BASH EDITION');
  });

  it('layers stratified combat copy for World 2 while preserving World 1 strings', () => {
    expect(getRaycastCombatMessageForSegment('world2', 'pressure')).toContain('ION SHEAR');
    expect(getRaycastCombatMessageForSegment('world1', 'pressure')).toContain('SHAFT PRESSURE');
    expect(getRaycastCombatMessageForSegment('world1', 'kill')).toBe(RAYCAST_ATMOSPHERE.messages.kill);
  });

  it('tailors boss strip copy to Archon vs Bloom Warden display names', () => {
    const archon = getRaycastBossHudLines('Volt Archon');
    const bloom = getRaycastBossHudLines('Bloom Warden');
    const ash = getRaycastBossHudLines('Ash Judge');
    expect(archon.phase2Overdrive).toContain('ARCHON');
    expect(archon.coreShattered).toContain('ARCHON');
    expect(bloom.phase2Overdrive).toContain('BLOOM');
    expect(bloom.coreShattered).toContain('WARDEN');
    expect(ash.phase2Overdrive).toContain('ASH HALO');
    expect(ash.coreShattered).toContain('VERDICT');
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
