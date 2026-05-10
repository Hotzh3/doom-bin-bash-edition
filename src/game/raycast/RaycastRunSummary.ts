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
}

/** Lightweight tier — encourages cleaner runs without heavy meta systems. */
export function computeRaycastRunRank(score: number): string {
  const safe = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  if (safe >= 14_000) return 'RANK S — STRATUM BREAKER';
  if (safe >= 10_000) return 'RANK A — CLEAN SIGNAL';
  if (safe >= 7000) return 'RANK B — HARD ROUTE';
  if (safe >= 4000) return 'RANK C — SCRAPE BY';
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

  return [
    input.difficultyLabel ? `DIFFICULTY ${input.difficultyLabel.toUpperCase()}` : null,
    input.score !== undefined ? `SCORE ${input.score}` : null,
    input.highScore !== undefined ? `HIGH SCORE ${input.highScore}` : null,
    rankLine,
    input.fullArcClear ? 'FULL ARC — EPISODE 1 + WORLD 2 CLEAR' : null,
    `TIME ${formatRunDuration(input.elapsedMs)}`,
    `ENEMIES KILLED ${input.enemiesKilled}`,
    `SECRETS ${input.secretsFound}/${input.secretTotal}`,
    `TOKENS ${input.tokensFound}/${input.tokenTotal}`,
    `DAMAGE TAKEN ${input.damageTaken}`
  ].filter((line): line is string => line !== null);
}
