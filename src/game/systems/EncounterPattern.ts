import type { EnemyKind } from '../types/game';
import type { SpawnPoint, SpawnRequest } from './GameDirector';

/** Authored tactical spawn shapes — resolved to concrete points in RaycastScene. */
export type EncounterPatternId =
  | 'pincer'
  | 'flank_pressure'
  | 'arena_lockdown'
  | 'fake_safety_ambush'
  | 'pressure_wave'
  | 'support_brute_push'
  | 'corridor_hunt';

export const ENCOUNTER_PATTERN_IDS: readonly EncounterPatternId[] = [
  'pincer',
  'flank_pressure',
  'arena_lockdown',
  'fake_safety_ambush',
  'pressure_wave',
  'support_brute_push',
  'corridor_hunt'
];

/** Enemy kinds per pattern — short authored lists, capped when spawning. */
export const ENCOUNTER_PATTERN_KINDS: Record<EncounterPatternId, EnemyKind[]> = {
  pincer: ['STALKER', 'STALKER'],
  flank_pressure: ['RANGED', 'GRUNT'],
  arena_lockdown: ['BRUTE', 'RANGED'],
  fake_safety_ambush: ['GRUNT', 'STALKER'],
  pressure_wave: ['GRUNT', 'GRUNT', 'GRUNT'],
  support_brute_push: ['SCRAMBLER', 'BRUTE'],
  corridor_hunt: ['STALKER', 'STALKER']
};

export function getEncounterPatternKinds(id: EncounterPatternId): EnemyKind[] {
  return [...ENCOUNTER_PATTERN_KINDS[id]];
}

function angleKey(
  px: number,
  py: number,
  player: { x: number; y: number },
  forwardX: number,
  forwardY: number
): { angle: number; lateral: number; dist: number; forward: number } {
  const dx = px - player.x;
  const dy = py - player.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  const lateral = (-forwardY * dx + forwardX * dy) / dist;
  const forward = (forwardX * dx + forwardY * dy) / dist;
  return { angle: Math.atan2(dy, dx), lateral: Math.abs(lateral), dist, forward };
}

function withKeys(points: SpawnPoint[], player: { x: number; y: number; angle?: number }) {
  const fx = Math.cos(player.angle ?? 0);
  const fy = Math.sin(player.angle ?? 0);
  return points.map((p) => ({
    point: p,
    ...angleKey(p.x, p.y, player, fx, fy)
  }));
}

/**
 * Maps pattern kinds to safe spawn points — prefers angular / lateral separation; never invents points.
 */
export function buildEncounterPatternSpawns(
  patternId: EncounterPatternId,
  kinds: EnemyKind[],
  safePoints: SpawnPoint[],
  player: { x: number; y: number; angle?: number }
): SpawnRequest[] {
  if (kinds.length === 0 || safePoints.length === 0) return [];

  const keyed = withKeys(safePoints, player);
  const sortedAngle = [...keyed].sort((a, b) => a.angle - b.angle);
  const sortedLat = [...keyed].sort((a, b) => b.lateral - a.lateral);
  const sortedBack = [...keyed].sort((a, b) => a.forward - b.forward);
  const sortedFar = [...keyed].sort((a, b) => b.dist - a.dist);

  const pick = (entries: typeof keyed, indices: number[]): SpawnPoint[] => {
    const out: SpawnPoint[] = [];
    for (const i of indices) {
      const e = entries[i];
      if (e && !out.some((p) => p.x === e.point.x && p.y === e.point.y)) out.push(e.point);
    }
    return out;
  };

  let chosen: SpawnPoint[] = [];

  switch (patternId) {
    case 'pincer':
      if (sortedAngle.length >= 2) chosen = pick(sortedAngle, [0, sortedAngle.length - 1]);
      else chosen = [sortedAngle[0]?.point].filter(Boolean) as SpawnPoint[];
      break;
    case 'flank_pressure':
      chosen = pick(sortedLat, [0, Math.min(1, sortedLat.length - 1)]);
      break;
    case 'arena_lockdown':
      chosen = pick(sortedFar, [0, Math.min(1, sortedFar.length - 1)]);
      break;
    case 'fake_safety_ambush':
      chosen = pick(sortedBack, [0, Math.min(1, sortedBack.length - 1)]);
      break;
    case 'pressure_wave':
      chosen = sortedFar.slice(0, Math.min(3, kinds.length, sortedFar.length)).map((k) => k.point);
      break;
    case 'support_brute_push':
      if (sortedFar.length >= 2) chosen = pick(sortedFar, [0, 1]);
      else chosen = [sortedFar[0]?.point].filter(Boolean) as SpawnPoint[];
      break;
    case 'corridor_hunt':
      chosen = pick(sortedAngle, [0, Math.min(2, sortedAngle.length - 1)]);
      break;
    default:
      chosen = [keyed[0].point];
  }

  const n = Math.min(kinds.length, chosen.length);
  const out: SpawnRequest[] = [];
  for (let i = 0; i < n; i += 1) {
    const pt = chosen[i];
    out.push({ kind: kinds[i], x: pt.x, y: pt.y });
  }
  return out;
}

export function capPatternSpawnsToLimits(
  spawns: SpawnRequest[],
  enemiesAlive: number,
  maxEnemiesAlive: number,
  spawnedSoFar: number,
  maxTotalSpawns: number
): SpawnRequest[] {
  const roomAlive = Math.max(0, maxEnemiesAlive - enemiesAlive);
  const roomBudget = Math.max(0, maxTotalSpawns - spawnedSoFar);
  const cap = Math.min(spawns.length, roomAlive, roomBudget);
  return spawns.slice(0, cap);
}
