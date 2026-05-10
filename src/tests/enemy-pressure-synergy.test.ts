import { describe, expect, it } from 'vitest';
import { pickPressureEnsembleKind } from '../game/systems/enemyPressureSynergy';

describe('pickPressureEnsembleKind', () => {
  it('adds ranged support when a brute already anchors the fight', () => {
    expect(pickPressureEnsembleKind({ BRUTE: 1 })).toBe('RANGED');
    expect(pickPressureEnsembleKind({ BRUTE: 1, RANGED: 1 })).toBeNull();
  });

  it('adds a brute when multiple stalkers stack without an anchor', () => {
    expect(pickPressureEnsembleKind({ STALKER: 2 })).toBe('BRUTE');
    expect(pickPressureEnsembleKind({ STALKER: 1 })).toBeNull();
  });

  it('returns null when counts are empty', () => {
    expect(pickPressureEnsembleKind({})).toBeNull();
  });
});
