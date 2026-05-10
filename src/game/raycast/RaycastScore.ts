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

/** Entering World 2 after Episode 1 boss — one-time carry bonus per run transition. */
export const RAYCAST_WORLD2_ENTRY_POINTS = 520;

/** Clearing the final World 2 sector (full mini-arc). */
export const RAYCAST_FULL_ARC_CLEAR_BONUS = 1100;

/** Discovering a hidden sector node — meaningful but bounded vs kill farming. */
export const RAYCAST_SECRET_DISCOVER_POINTS = 380;

export function addRaycastBossClearScore(currentScore: number): number {
  return currentScore + RAYCAST_BOSS_CLEAR_POINTS;
}

export function addRaycastSecretScore(currentScore: number): number {
  return currentScore + RAYCAST_SECRET_DISCOVER_POINTS;
}

/** Per-sector snapshot for scoring medals and performance bonus (pellets reset each sector load). */
export interface RaycastSectorMetrics {
  pelletsFired: number;
  pelletsHitHostile: number;
  damageTaken: number;
  secretsFound: number;
  secretTotal: number;
  elapsedMs: number;
  enemiesKilled: number;
  bossPelletsFired: number;
  bossPelletsHitHostile: number;
  bossDamageTaken: number;
  /** Level script included a boss arena (even if skipped). */
  hadBoss: boolean;
}

/** Ratio of hostile-connecting pellets to pellets fired; capped at 1 (splash / multi-hit can inflate hits). */
export function computePelletAccuracyRatio(pelletsFired: number, pelletsHitHostile: number): number | null {
  if (pelletsFired <= 0) return null;
  return Math.min(1, pelletsHitHostile / pelletsFired);
}

/** Boss-arena pellet efficiency while the Archon is active (null if no boss level or no boss shots). */
export function computeBossPelletEfficiency(
  bossPelletsFired: number,
  bossPelletsHitHostile: number,
  hadBoss: boolean
): number | null {
  if (!hadBoss || bossPelletsFired <= 0) return null;
  return Math.min(1, bossPelletsHitHostile / bossPelletsFired);
}

const PERFORMANCE_ACCURACY_CAP = 280;
const PERFORMANCE_SURVIVAL_CAP = 220;
const PERFORMANCE_BOSS_CAP = 180;
/** Hard cap so skill bonus stays secondary to kills/secrets/boss flat bonuses. */
export const RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP = 600;

/**
 * Sector-clear performance bonus (accuracy + low damage + boss pellet efficiency).
 * Dubious edge cases: shotgun counts many pellets per trigger; splash can raise hits above fired conceptually but ratio is clamped.
 */
export function addRaycastSectorPerformanceBonus(score: number, m: RaycastSectorMetrics): number {
  const safe = Number.isFinite(score) ? score : 0;
  const ratio = computePelletAccuracyRatio(m.pelletsFired, m.pelletsHitHostile) ?? 0;
  const accuracyPart =
    m.pelletsFired < 8 ? 0 : Math.min(PERFORMANCE_ACCURACY_CAP, Math.floor(ratio * 320));
  const survivalPart = Math.min(
    PERFORMANCE_SURVIVAL_CAP,
    Math.max(0, 90 - Math.max(0, m.damageTaken)) * 2.5
  );

  let bossPart = 0;
  const bossRatio = computeBossPelletEfficiency(m.bossPelletsFired, m.bossPelletsHitHostile, m.hadBoss);
  if (bossRatio !== null && m.bossPelletsFired >= 5) {
    bossPart = Math.min(PERFORMANCE_BOSS_CAP, Math.floor(bossRatio * 200));
  }

  const raw = accuracyPart + survivalPart + bossPart;
  const bonus = Math.min(RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP, Math.floor(raw));
  return safe + bonus;
}

export function computeRaycastSectorMedals(m: RaycastSectorMetrics): string[] {
  const medals: string[] = [];
  if (m.damageTaken === 0) medals.push('FLAWLESS_SIGNAL');
  const acc = computePelletAccuracyRatio(m.pelletsFired, m.pelletsHitHostile);
  if (acc !== null && m.pelletsFired >= 12 && acc >= 0.38) {
    medals.push('MARKSMAN');
  }
  const be = computeBossPelletEfficiency(m.bossPelletsFired, m.bossPelletsHitHostile, m.hadBoss);
  if (be !== null && m.bossPelletsFired >= 6 && be >= 0.3) {
    medals.push('ARCHON_STRIKE');
  }
  if (m.secretTotal > 0 && m.secretsFound === m.secretTotal) {
    medals.push('FULL_INTEL');
  }
  return medals;
}

export function formatRaycastSectorMedalLabel(id: string): string {
  switch (id) {
    case 'FLAWLESS_SIGNAL':
      return 'FLAWLESS SIGNAL';
    case 'MARKSMAN':
      return 'MARKSMAN';
    case 'ARCHON_STRIKE':
      return 'ARCHON STRIKE';
    case 'FULL_INTEL':
      return 'FULL INTEL';
    default:
      return id;
  }
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
