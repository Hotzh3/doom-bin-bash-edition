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
  regenUsed?: boolean;
  deaths?: number;
  retries?: number;
}

/** Tier letter + subtitle — used for HUD-safe overlays and summary alignment (Phase 26). */
export interface RaycastRunRankParts {
  tierLetter: 'SS' | 'S' | 'A' | 'B' | 'C' | 'D';
  subtitle: string;
}

export type RaycastMasteryMark =
  | 'NO DAMAGE'
  | 'SPEED CLEAR'
  | 'FULL ACCURACY'
  | 'ALL SECRETS'
  | 'NO REGEN USED'
  | 'FULL INTEL'
  | 'BOSS BREAKER'
  | 'CLEAN RUN';

/**
 * Discrete tiers — tuned upward because campaign completion bonus raises typical clears.
 * Focus: reward full-run skill without requiring pacifist routing.
 */
export function computeRaycastRunRankParts(score: number): RaycastRunRankParts {
  const safe = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  if (safe >= 22_500) return { tierLetter: 'SS', subtitle: 'MYTHIC ROUTE' };
  if (safe >= 18_200) return { tierLetter: 'S', subtitle: 'STRATUM BREAKER' };
  if (safe >= 13_600) return { tierLetter: 'A', subtitle: 'CLEAN SIGNAL' };
  if (safe >= 9800) return { tierLetter: 'B', subtitle: 'HARD ROUTE' };
  if (safe >= 5200) return { tierLetter: 'C', subtitle: 'SCRAPE BY' };
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

function computeMasteryIndex(input: RaycastRunSummaryInput): number {
  const accuracyRatio =
    input.pelletsFired && input.pelletsFired > 0
      ? Math.max(0, Math.min(1, (input.pelletsHitHostile ?? 0) / input.pelletsFired))
      : 0;
  const secretsRatio = input.secretTotal > 0 ? Math.max(0, Math.min(1, input.secretsFound / input.secretTotal)) : 1;
  const tokensRatio = input.tokenTotal > 0 ? Math.max(0, Math.min(1, input.tokensFound / input.tokenTotal)) : 1;
  const damagePenalty = Math.max(0, Math.min(1, input.damageTaken / 140));
  const speedScore = Math.max(0, Math.min(1, (7 * 60 * 1000 - input.elapsedMs) / (7 * 60 * 1000)));
  const bossPenalty = input.bossArenaDamageTaken !== undefined ? Math.max(0, Math.min(1, input.bossArenaDamageTaken / 60)) : 0.25;
  const retryPenalty = Math.max(0, ((input.deaths ?? 0) * 0.3) + ((input.retries ?? 0) * 0.15));
  const regenPenalty = input.regenUsed ? 0.12 : 0;
  const weighted =
    speedScore * 0.18 +
    accuracyRatio * 0.2 +
    (1 - damagePenalty) * 0.2 +
    secretsRatio * 0.14 +
    tokensRatio * 0.08 +
    (1 - bossPenalty) * 0.14 +
    Math.max(0, 1 - retryPenalty - regenPenalty) * 0.06;
  return Math.max(0, Math.min(1, weighted));
}

export function computeRaycastRunMasteryMarks(input: RaycastRunSummaryInput): RaycastMasteryMark[] {
  const marks: RaycastMasteryMark[] = [];
  const pelletsFired = input.pelletsFired ?? 0;
  const accuracyRatio =
    pelletsFired > 0
      ? Math.max(0, Math.min(1, (input.pelletsHitHostile ?? 0) / pelletsFired))
      : null;
  if (input.damageTaken <= 0) marks.push('NO DAMAGE');
  if (input.elapsedMs <= 4 * 60 * 1000) marks.push('SPEED CLEAR');
  if (accuracyRatio !== null && pelletsFired >= 14 && accuracyRatio >= 0.98) marks.push('FULL ACCURACY');
  if (input.secretTotal > 0 && input.secretsFound === input.secretTotal) marks.push('ALL SECRETS');
  if (!input.regenUsed) marks.push('NO REGEN USED');
  if (input.secretTotal > 0 && input.tokenTotal > 0 && input.secretsFound === input.secretTotal && input.tokensFound === input.tokenTotal) {
    marks.push('FULL INTEL');
  }
  if (input.hadBoss && input.bossArenaDamageTaken !== undefined && input.bossArenaDamageTaken <= 24) {
    marks.push('BOSS BREAKER');
  }
  if ((input.deaths ?? 0) === 0 && (input.retries ?? 0) === 0) marks.push('CLEAN RUN');
  return marks;
}

function masteryToRankParts(mastery: number): RaycastRunRankParts {
  if (mastery >= 0.93) return { tierLetter: 'SS', subtitle: 'PERFECT EXECUTION' };
  if (mastery >= 0.84) return { tierLetter: 'S', subtitle: 'MASTER ROUTE' };
  if (mastery >= 0.72) return { tierLetter: 'A', subtitle: 'SHARP CLEAR' };
  if (mastery >= 0.57) return { tierLetter: 'B', subtitle: 'SOLID CONTROL' };
  if (mastery >= 0.4) return { tierLetter: 'C', subtitle: 'STABLE SURVIVAL' };
  return { tierLetter: 'D', subtitle: 'BARE EXIT' };
}

export function buildRaycastRunSummary(input: RaycastRunSummaryInput): string[] {
  const mastery = computeMasteryIndex(input);
  const rankParts = input.includeRank !== false ? masteryToRankParts(mastery) : null;
  const rankFormatted = rankParts ? `RANK ${rankParts.tierLetter} — ${rankParts.subtitle}` : null;
  const marks = computeRaycastRunMasteryMarks(input);

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
    `SECRETS ${input.secretsFound}/${input.secretTotal}`,
    `TOKENS ${input.tokensFound}/${input.tokenTotal}`,
    marks.length > 0 ? `MARKS ${marks.slice(0, 3).join(' | ')}` : null
  ].filter((line): line is string => line !== null);

  return coreBlock;
}
