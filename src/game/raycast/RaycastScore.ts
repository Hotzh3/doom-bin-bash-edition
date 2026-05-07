import type { EnemyKind } from '../types/game';

export const RAYCAST_HIGH_SCORE_STORAGE_KEY = 'raycast_high_score_v1';

export const RAYCAST_KILL_POINTS: Record<EnemyKind, number> = {
  GRUNT: 100,
  STALKER: 150,
  RANGED: 175,
  BRUTE: 250
};

export function raycastPointsForKill(kind: EnemyKind): number {
  return RAYCAST_KILL_POINTS[kind] ?? RAYCAST_KILL_POINTS.GRUNT;
}

export function addRaycastKillScore(currentScore: number, killedKinds: EnemyKind[]): number {
  let next = currentScore;
  for (const kind of killedKinds) {
    next += raycastPointsForKill(kind);
  }
  return next;
}

/** Episode boss clear bonus (flat points). */
export const RAYCAST_BOSS_CLEAR_POINTS = 2500;

export function addRaycastBossClearScore(currentScore: number): number {
  return currentScore + RAYCAST_BOSS_CLEAR_POINTS;
}

export function readRaycastHighScore(storage: Pick<Storage, 'getItem'> = typeof localStorage !== 'undefined'
  ? localStorage
  : { getItem: () => null }): number {
  try {
    const raw = storage.getItem(RAYCAST_HIGH_SCORE_STORAGE_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeRaycastHighScoreIfBetter(
  score: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> = typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {} }
): boolean {
  if (!Number.isFinite(score) || score < 0) return false;
  const prev = readRaycastHighScore(storage);
  if (score <= prev) return false;
  try {
    storage.setItem(RAYCAST_HIGH_SCORE_STORAGE_KEY, String(Math.floor(score)));
    return true;
  } catch {
    return false;
  }
}
