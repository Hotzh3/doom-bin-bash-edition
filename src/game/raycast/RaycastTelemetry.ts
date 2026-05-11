import type { RaycastCampaignMetrics } from './RaycastScore';

export const RAYCAST_PLAYTEST_TELEMETRY_STORAGE_KEY = 'raycast_playtest_telemetry_v1';
const RAYCAST_PLAYTEST_TELEMETRY_MAX_RECORDS = 64;

export interface RaycastPlaytestTelemetryRecord {
  timestampIso: string;
  levelId: string;
  levelName: string;
  worldSegment: 'world1' | 'world2' | 'world3';
  difficulty: string;
  outcome: 'clear' | 'death';
  elapsedMs: number;
  score: number;
  enemiesKilled: number;
  damageTaken: number;
  secretsFound: number;
  secretTotal: number;
  tokensFound: number;
  tokenTotal: number;
  pelletsFired: number;
  pelletsHitHostile: number;
  bossPelletsFired: number;
  bossPelletsHitHostile: number;
  bossDamageTaken: number;
  campaign?: RaycastCampaignMetrics;
}

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): MinimalStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readRaycastPlaytestTelemetry(storage: MinimalStorage | null = defaultStorage()): RaycastPlaytestTelemetryRecord[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(RAYCAST_PLAYTEST_TELEMETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendRaycastPlaytestTelemetry(
  record: RaycastPlaytestTelemetryRecord,
  storage: MinimalStorage | null = defaultStorage()
): boolean {
  if (!storage) return false;
  try {
    const prev = readRaycastPlaytestTelemetry(storage);
    const next = [...prev, record].slice(-RAYCAST_PLAYTEST_TELEMETRY_MAX_RECORDS);
    storage.setItem(RAYCAST_PLAYTEST_TELEMETRY_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function exportRaycastPlaytestTelemetryJson(records: RaycastPlaytestTelemetryRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function exportRaycastPlaytestTelemetryCsv(records: RaycastPlaytestTelemetryRecord[]): string {
  const header = [
    'timestampIso',
    'levelId',
    'levelName',
    'worldSegment',
    'difficulty',
    'outcome',
    'elapsedMs',
    'score',
    'enemiesKilled',
    'damageTaken',
    'secretsFound',
    'secretTotal',
    'tokensFound',
    'tokenTotal',
    'pelletsFired',
    'pelletsHitHostile',
    'bossPelletsFired',
    'bossPelletsHitHostile',
    'bossDamageTaken'
  ];
  const rows = records.map((r) =>
    [
      r.timestampIso,
      r.levelId,
      sanitizeCsvField(r.levelName),
      r.worldSegment,
      sanitizeCsvField(r.difficulty),
      r.outcome,
      r.elapsedMs,
      r.score,
      r.enemiesKilled,
      r.damageTaken,
      r.secretsFound,
      r.secretTotal,
      r.tokensFound,
      r.tokenTotal,
      r.pelletsFired,
      r.pelletsHitHostile,
      r.bossPelletsFired,
      r.bossPelletsHitHostile,
      r.bossDamageTaken
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

function sanitizeCsvField(value: string): string {
  if (!value.includes(',') && !value.includes('"') && !value.includes('\n')) return value;
  return `"${value.split('"').join('""')}"`;
}
