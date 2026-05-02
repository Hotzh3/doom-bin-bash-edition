import { describe, expect, it } from 'vitest';
import { shouldMatureWarning, updateAntiCampState } from '../game/systems/DirectorPacing';

describe('director pacing helpers', () => {
  it('builds anti-camp pressure gradually and decays it when the player re-engages', () => {
    const config = { idlePressureMs: 2000, stationaryPressureGraceMs: 1200, warningLeadMs: 600 };
    const watching = updateAntiCampState(
      { meterMs: 0, phase: 'none' },
      { stationaryMs: 1500, deltaMs: 400, recentKill: false },
      config
    );
    const warning = updateAntiCampState(watching, { stationaryMs: 2200, deltaMs: 600, recentKill: false }, config);
    const pressure = updateAntiCampState(warning, { stationaryMs: 3200, deltaMs: 700, recentKill: false }, config);
    const decayed = updateAntiCampState(pressure, { stationaryMs: 0, deltaMs: 700, recentKill: true }, config);

    expect(watching.phase).toBe('watching');
    expect(warning.phase).toBe('warning');
    expect(pressure.phase).toBe('pressure');
    expect(decayed.meterMs).toBeLessThan(pressure.meterMs);
  });

  it('keeps warning maturation gated by both time and anti-camp severity', () => {
    const config = { warningLeadMs: 800 };

    expect(shouldMatureWarning('zone-ambush', 1000, 1500, config, { meterMs: 0, phase: 'warning' })).toBe(false);
    expect(shouldMatureWarning('zone-ambush', 1000, 1800, config, { meterMs: 0, phase: 'warning' })).toBe(true);
    expect(shouldMatureWarning('anti-camp', 1000, 1800, config, { meterMs: 500, phase: 'warning' })).toBe(false);
    expect(shouldMatureWarning('anti-camp', 1000, 1800, config, { meterMs: 1200, phase: 'pressure' })).toBe(true);
  });
});
