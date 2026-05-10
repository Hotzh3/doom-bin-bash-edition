import {
  computeBossPelletEfficiency,
  computePelletAccuracyRatio,
  formatRaycastSectorMedalLabel
} from './RaycastScore';

export interface RaycastRunSummaryInput {
  difficultyLabel?: string;
  elapsedMs: number;
  enemiesKilled: number;
  score?: number;
  highScore?: number;
  secretsFound: number;
  secretTotal: number;
  tokensFound: number;
  tokenTotal: number;
  damageTaken: number;
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
}

/** Lightweight tier — tuned upward slightly vs baseline kills because sector performance bonuses add ~400–650 pts/clear. */
export function computeRaycastRunRank(score: number): string {
  const safe = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  if (safe >= 16_500) return 'RANK S — STRATUM BREAKER';
  if (safe >= 12_200) return 'RANK A — CLEAN SIGNAL';
  if (safe >= 8800) return 'RANK B — HARD ROUTE';
  if (safe >= 5200) return 'RANK C — SCRAPE BY';
  return 'RANK D — BARE EXIT';
}

export function formatRunDuration(elapsedMs: number): string {
  const safeMs = Math.max(0, Math.floor(elapsedMs));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safeMs % 1000) / 100);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

export function buildRaycastRunSummary(input: RaycastRunSummaryInput): string[] {
  const rankLine =
    input.includeRank !== false && input.score !== undefined ? computeRaycastRunRank(input.score) : null;

  const scoreBlock =
    input.score !== undefined && input.highScore !== undefined
      ? `SCORE ${input.score}  │  HIGH SCORE ${input.highScore}`
      : input.score !== undefined
        ? `SCORE ${input.score}`
        : null;
  const highOnly =
    input.score === undefined && input.highScore !== undefined ? `HIGH SCORE ${input.highScore}` : null;

  const accRatio =
    input.pelletsFired !== undefined && input.pelletsHitHostile !== undefined
      ? computePelletAccuracyRatio(input.pelletsFired, input.pelletsHitHostile)
      : null;
  const accuracyLine =
    accRatio !== null &&
    input.pelletsFired !== undefined &&
    input.pelletsHitHostile !== undefined &&
    input.pelletsFired > 0
      ? `ACCURACY ${Math.round(accRatio * 100)}% (${input.pelletsHitHostile}/${input.pelletsFired} pellets)`
      : null;

  const bossEff =
    input.hadBoss &&
    input.bossPelletsFired !== undefined &&
    input.bossPelletsHitHostile !== undefined
      ? computeBossPelletEfficiency(input.bossPelletsFired, input.bossPelletsHitHostile, true)
      : null;
  const bossLine =
    bossEff !== null &&
    input.bossPelletsFired !== undefined &&
    input.bossPelletsFired > 0 &&
    input.bossPelletsHitHostile !== undefined
      ? `BOSS EFF ${Math.round(bossEff * 100)}% (${input.bossPelletsHitHostile}/${input.bossPelletsFired})`
      : null;

  const medalLines: string[] =
    input.medals !== undefined && input.medals.length > 0
      ? [
          '── MARKS ──',
          ...input.medals.map((id) => `▸ ${formatRaycastSectorMedalLabel(id)}`)
        ]
      : [];

  return [
    '══ SECTOR REPORT ══',
    input.difficultyLabel ? `DIFFICULTY ${input.difficultyLabel.toUpperCase()}` : null,
    scoreBlock,
    highOnly,
    rankLine,
    input.fullArcClear ? 'FULL ARC — EPISODE 1 + WORLD 2 CLEAR' : null,
    '── TIME ──',
    `ELAPSED ${formatRunDuration(input.elapsedMs)}`,
    '── COMBAT ──',
    `HOSTILES TERMINATED ${input.enemiesKilled}`,
    accuracyLine,
    `DAMAGE TAKEN ${input.damageTaken}`,
    bossLine,
    '── INTEL ──',
    `SECRETS ${input.secretsFound}/${input.secretTotal}`,
    `TOKENS ${input.tokensFound}/${input.tokenTotal}`,
    ...medalLines
  ].filter((line): line is string => line !== null);
}
