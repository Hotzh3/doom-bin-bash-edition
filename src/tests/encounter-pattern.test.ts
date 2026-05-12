import { describe, expect, it } from 'vitest';
import {
  buildEncounterPatternSpawns,
  capPatternSpawnsToLimits,
  ENCOUNTER_PATTERN_IDS,
  getEncounterPatternKinds
} from '../game/systems/EncounterPattern';

describe('encounter patterns', () => {
  it('covers seven authored pattern ids', () => {
    expect(ENCOUNTER_PATTERN_IDS).toHaveLength(7);
  });

  it('maps every pattern to at least one enemy kind', () => {
    ENCOUNTER_PATTERN_IDS.forEach((id) => {
      expect(getEncounterPatternKinds(id).length).toBeGreaterThan(0);
    });
  });

  it('pincer selects two distinct safe points when available', () => {
    const kinds = getEncounterPatternKinds('pincer');
    const points = [
      { x: 1, y: 0, zoneId: 'z' },
      { x: 0, y: 1, zoneId: 'z' },
      { x: -1, y: 0, zoneId: 'z' }
    ];
    const spawns = buildEncounterPatternSpawns('pincer', kinds, points, { x: 0, y: 0, angle: 0 });
    expect(spawns).toHaveLength(2);
    expect(spawns[0].x === spawns[1].x && spawns[0].y === spawns[1].y).toBe(false);
  });

  it('never returns more spawns than kinds or safe points', () => {
    const kinds: import('../game/types/game').EnemyKind[] = ['GRUNT', 'STALKER', 'BRUTE'];
    const onePoint = [{ x: 5, y: 5, zoneId: 'a' }];
    const spawns = buildEncounterPatternSpawns('pressure_wave', kinds, onePoint, { x: 0, y: 0, angle: 0 });
    expect(spawns.length).toBeLessThanOrEqual(1);
  });

  it('caps pattern batch to alive headroom and spawn budget', () => {
    const spawns = [
      { kind: 'GRUNT' as const, x: 1, y: 1 },
      { kind: 'GRUNT' as const, x: 2, y: 2 },
      { kind: 'GRUNT' as const, x: 3, y: 3 }
    ];
    expect(capPatternSpawnsToLimits(spawns, 4, 5, 8, 10)).toHaveLength(1);
    expect(capPatternSpawnsToLimits(spawns, 4, 5, 9, 10)).toHaveLength(1);
    expect(capPatternSpawnsToLimits(spawns, 4, 5, 8, 9)).toHaveLength(1);
    expect(capPatternSpawnsToLimits(spawns, 5, 5, 8, 10)).toHaveLength(0);
  });

  it('pressure_wave uses up to three distinct points', () => {
    const kinds = getEncounterPatternKinds('pressure_wave');
    const pts = [
      { x: 10, y: 0, zoneId: 'z' },
      { x: 9, y: 0, zoneId: 'z' },
      { x: 8, y: 0, zoneId: 'z' },
      { x: 7, y: 0, zoneId: 'z' }
    ];
    const spawns = buildEncounterPatternSpawns('pressure_wave', kinds, pts, { x: 0, y: 0, angle: 0 });
    expect(spawns.length).toBe(3);
    const coords = new Set(spawns.map((s) => `${s.x},${s.y}`));
    expect(coords.size).toBe(3);
  });
});
