import type { RaycastCampaignMetrics } from './RaycastScore';

export interface RaycastRunSummaryInput {
  difficultyLabel?: string;
  /** Last cleared sector — wall time for that map only. */
  elapsedMs: number;
  enemiesKilled: number;
  score?: number;
  highScore?: number;
  secretsFound: number;
  secretTotal: number;
  tokensFound: number;
  tokenTotal: number;
  /** Total scaled damage taken this sector (all sources). */
  damageTaken: number;
  /** Damage taken while the sector boss was alive — skill read for arena maps. */
  bossArenaDamageTaken?: number;
  /** Replay incentive — derived from score bands when score present. */
  includeRank?: boolean;
  /** Campaign beat both Episode 1 + World 2 (shown when applicable). */
  fullArcClear?: boolean;
  /** Instrumentation — optional display lines (sector pellets reset each load). */
  pelletsFired?: number;
  pelletsHitHostile?: number;
  bossPelletsFired?: number;
  bossPelletsHitHostile?: number;
  hadBoss?: boolean;
  medals?: string[];
  /** Merged cumulative metrics — finale overlay only. */
  campaign?: RaycastCampaignMetrics;
  /** When true, show run composite block + recalibrated copy. */
  episodeComplete?: boolean;
}

/** Tier letter + subtitle — used for HUD-safe overlays and summary alignment (Phase 26). */
export interface RaycastRunRankParts {
  tierLetter: 'S' | 'A' | 'B' | 'C' | 'D';
  subtitle: string;
}

/**
 * Discrete tiers — tuned upward because campaign completion bonus raises typical clears.
 * Focus: reward full-run skill without requiring pacifist routing.
 */
export function computeRaycastRunRankParts(score: number): RaycastRunRankParts {
  const safe = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  if (safe >= 18_800) return { tierLetter: 'S', subtitle: 'STRATUM BREAKER' };
  if (safe >= 14_000) return { tierLetter: 'A', subtitle: 'CLEAN SIGNAL' };
  if (safe >= 10_200) return { tierLetter: 'B', subtitle: 'HARD ROUTE' };
  if (safe >= 6000) return { tierLetter: 'C', subtitle: 'SCRAPE BY' };
  return { tierLetter: 'D', subtitle: 'BARE EXIT' };
}

export function computeRaycastRunRank(score: number): string {
  const p = computeRaycastRunRankParts(score);
  return `RANK ${p.tierLetter} — ${p.subtitle}`;
}

export function formatRunDuration(elapsedMs: number): string {
  const safeMs = Math.max(0, Math.floor(elapsedMs));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safeMs % 1000) / 100);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

function formatScoreInt(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US');
}

export function buildRaycastRunSummary(input: RaycastRunSummaryInput): string[] {
  const rankParts =
    input.includeRank !== false && input.score !== undefined ? computeRaycastRunRankParts(input.score) : null;
  const rankFormatted = rankParts ? `RANK ${rankParts.tierLetter} — ${rankParts.subtitle}` : null;

  const scoreBlock =
    input.score !== undefined && input.highScore !== undefined
      ? `SCORE ${formatScoreInt(input.score)}  |  BEST ${formatScoreInt(input.highScore)}`
      : input.score !== undefined
        ? `SCORE ${formatScoreInt(input.score)}`
        : null;
  const highOnly =
    input.score === undefined && input.highScore !== undefined
      ? `BEST ${formatScoreInt(input.highScore)}`
      : null;

  const sectorAccuracy =
    input.pelletsFired && input.pelletsFired > 0
      ? Math.round((Math.max(0, input.pelletsHitHostile ?? 0) / input.pelletsFired) * 100)
      : null;

  const coreBlock = [
    scoreBlock,
    highOnly,
    rankFormatted,
    `TIME ${formatRunDuration(input.elapsedMs)}`,
    sectorAccuracy !== null ? `ACCURACY ${sectorAccuracy}%` : null,
    `SECRETS ${input.secretsFound}/${input.secretTotal}`
  ].filter((line): line is string => line !== null);

  return coreBlock;
}
