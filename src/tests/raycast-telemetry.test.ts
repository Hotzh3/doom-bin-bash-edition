import { describe, expect, it } from 'vitest';
import {
  appendRaycastPlaytestTelemetry,
  exportRaycastPlaytestTelemetryCsv,
  exportRaycastPlaytestTelemetryJson,
  RAYCAST_PLAYTEST_TELEMETRY_STORAGE_KEY,
  readRaycastPlaytestTelemetry,
  type RaycastPlaytestTelemetryRecord
} from '../game/raycast/RaycastTelemetry';

function makeRecord(overrides: Partial<RaycastPlaytestTelemetryRecord> = {}): RaycastPlaytestTelemetryRecord {
  return {
    timestampIso: '2026-05-11T00:00:00.000Z',
    levelId: 'access-node',
    levelName: 'Slag Foundry — Cinder Annex',
    worldSegment: 'world1',
    difficulty: 'STANDARD',
    outcome: 'clear',
    elapsedMs: 120_000,
    score: 4200,
    enemiesKilled: 18,
    damageTaken: 26,
    secretsFound: 1,
    secretTotal: 2,
    tokensFound: 1,
    tokenTotal: 1,
    pelletsFired: 85,
    pelletsHitHostile: 36,
    bossPelletsFired: 0,
    bossPelletsHitHostile: 0,
    bossDamageTaken: 0,
    ...overrides
  };
}

describe('raycast telemetry', () => {
  it('stores and reads telemetry records from local storage adapter', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      }
    };
    expect(readRaycastPlaytestTelemetry(storage)).toEqual([]);
    expect(appendRaycastPlaytestTelemetry(makeRecord(), storage)).toBe(true);
    const rows = readRaycastPlaytestTelemetry(storage);
    expect(rows).toHaveLength(1);
    expect(rows[0].levelId).toBe('access-node');
    expect(mem.has(RAYCAST_PLAYTEST_TELEMETRY_STORAGE_KEY)).toBe(true);
  });

  it('exports deterministic csv/json payloads for offline tuning', () => {
    const rows = [makeRecord(), makeRecord({ levelId: 'rift-fracture', worldSegment: 'world2' })];
    const csv = exportRaycastPlaytestTelemetryCsv(rows);
    const json = exportRaycastPlaytestTelemetryJson(rows);
    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('levelId');
    expect(csv).toContain('rift-fracture');
    expect(json).toContain('"worldSegment": "world2"');
  });
});
