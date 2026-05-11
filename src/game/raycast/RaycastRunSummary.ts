import {
  computeBossPelletEfficiency,
  computePelletAccuracyRatio,
  formatRaycastSectorMedalLabel,
  type RaycastCampaignMetrics
} from './RaycastScore';

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

function padStat(label: string, value: string, labelWidth = 15): string {
  return ` ${label.padEnd(labelWidth)} ${value}`;
}

function formatScoreInt(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US');
}

function buildCampaignCompositeLines(c: RaycastCampaignMetrics): string[] {
  const runAcc = computePelletAccuracyRatio(c.cumulativePelletsFired, c.cumulativePelletsHitHostile);
  const runAccPct = runAcc !== null ? `${Math.round(runAcc * 100)}%` : '—';
  const runAccDetail =
    c.cumulativePelletsFired > 0
      ? `${runAccPct} (${c.cumulativePelletsHitHostile}/${c.cumulativePelletsFired})`
      : '—';

  const runBossEff = computeBossPelletEfficiency(
    c.cumulativeBossPelletsFired,
    c.cumulativeBossPelletsHitHostile,
    c.bossSectorsPlayed > 0
  );
  const bossEffLine =
    runBossEff !== null && c.cumulativeBossPelletsFired > 0
      ? padStat('BOSS EFF (RUN)', `${Math.round(runBossEff * 100)}% (${c.cumulativeBossPelletsHitHostile}/${c.cumulativeBossPelletsFired})`)
      : null;

  const bossDmgRun =
    c.bossSectorsPlayed > 0
      ? padStat('BOSS DMG (RUN)', String(Math.round(c.cumulativeBossDamageTaken)))
      : null;

  return [
    '▓ RUN LOCK // COMPOSITE ▓',
    padStat('WALL TIME', formatRunDuration(c.cumulativeElapsedMs)),
    padStat('SECTORS', String(c.sectorsCleared)),
    padStat('ACC (RUN)', runAccDetail),
    padStat('DMG (RUN)', String(Math.round(c.cumulativeDamageTaken))),
    padStat('SECRETS (RUN)', `${c.cumulativeSecretsFound}/${c.cumulativeSecretSlots}`),
    ...(bossEffLine ? [bossEffLine] : []),
    ...(bossDmgRun ? [bossDmgRun] : [])
  ];
}

export function buildRaycastRunSummary(input: RaycastRunSummaryInput): string[] {
  const rankParts =
    input.includeRank !== false && input.score !== undefined ? computeRaycastRunRankParts(input.score) : null;
  const rankFormatted = rankParts ? padStat('RANK', `${rankParts.tierLetter} — ${rankParts.subtitle}`) : null;

  const scoreBlock =
    input.score !== undefined && input.highScore !== undefined
      ? padStat('SCORE │ BEST', `${formatScoreInt(input.score)} │ ${formatScoreInt(input.highScore)}`)
      : input.score !== undefined
        ? padStat('SCORE', formatScoreInt(input.score))
        : null;
  const highOnly =
    input.score === undefined && input.highScore !== undefined
      ? padStat('BEST RUN', formatScoreInt(input.highScore))
      : null;

  const accRatio =
    input.pelletsFired !== undefined && input.pelletsHitHostile !== undefined
      ? computePelletAccuracyRatio(input.pelletsFired, input.pelletsHitHostile)
      : null;
  const accuracyLine =
    accRatio !== null &&
    input.pelletsFired !== undefined &&
    input.pelletsHitHostile !== undefined &&
    input.pelletsFired > 0
      ? padStat('ACC (SECTOR)', `${Math.round(accRatio * 100)}% (${input.pelletsHitHostile}/${input.pelletsFired})`)
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
      ? padStat('BOSS EFF', `${Math.round(bossEff * 100)}% (${input.bossPelletsHitHostile}/${input.bossPelletsFired})`)
      : null;

  const bossSurvLine =
    input.hadBoss && input.bossArenaDamageTaken !== undefined
      ? padStat('BOSS DMG', `${Math.round(input.bossArenaDamageTaken)} (arena)`)
      : null;
  const playstyleLine = padStat('PLAYSTYLE', buildRaycastPlaystyleTag(input, accRatio));

  const campaignLines =
    input.episodeComplete && input.campaign ? buildCampaignCompositeLines(input.campaign) : [];

  const medalLines: string[] =
    input.medals !== undefined && input.medals.length > 0
      ? [
          ' ▒ MARKS ▒',
          ...input.medals.map((id) => `  ▸ ${formatRaycastSectorMedalLabel(id)}`)
        ]
      : [];

  const hintLine =
    input.episodeComplete && input.score !== undefined && input.includeRank !== false
      ? ' PUSH // Higher ACC, lower DMG, faster wall time → higher tier'
      : null;

  const header = input.episodeComplete ? '══ SIGNAL REPORT // RUN COMPLETE ══' : '══ SECTOR REPORT ══';

  const coreBlock = [
    header,
    input.difficultyLabel ? padStat('DIFFICULTY', input.difficultyLabel.toUpperCase()) : null,
    scoreBlock,
    highOnly,
    rankFormatted,
    hintLine,
    input.fullArcClear ? ' FULL ARC — EPISODE 1 + WORLD 2 CLEAR' : null,
    ...campaignLines,
    campaignLines.length > 0 ? ' ─────────────────────' : null,
    ' ◆ TIME ◆',
    input.episodeComplete && input.campaign
      ? padStat('SECTOR TIME', formatRunDuration(input.elapsedMs))
      : padStat('ELAPSED', formatRunDuration(input.elapsedMs)),
    ' ◆ COMBAT ◆',
    padStat('HOSTILES', String(input.enemiesKilled)),
    accuracyLine,
    padStat('DMG (YOU)', String(Math.round(input.damageTaken))),
    bossLine,
    bossSurvLine,
    playstyleLine,
    ' ◆ INTEL ◆',
    padStat('SECRETS', `${input.secretsFound}/${input.secretTotal}`),
    padStat('TOKENS', `${input.tokensFound}/${input.tokenTotal}`),
    ...medalLines
  ].filter((line): line is string => line !== null);

  return coreBlock;
}

function buildRaycastPlaystyleTag(input: RaycastRunSummaryInput, accRatio: number | null): string {
  const fast = input.elapsedMs <= 4 * 60 * 1000;
  const explorer = input.secretTotal > 0 && input.secretsFound >= Math.min(1, input.secretTotal);
  const precise = accRatio !== null && accRatio >= 0.42;
  const clean = input.damageTaken <= 28;

  if (fast && precise && clean) return 'STRIKE RUN';
  if (explorer && precise) return 'HUNTER SCOUT';
  if (explorer) return 'ROUTE SCOUT';
  if (fast) return 'BREACH RUSH';
  if (clean) return 'LOW PROFILE';
  return 'STEADY PUSH';
}
