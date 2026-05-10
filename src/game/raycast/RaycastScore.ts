import type { EnemyKind } from '../types/game';

export const RAYCAST_HIGH_SCORE_STORAGE_KEY = 'raycast_high_score_v1';

/** One-time score bump when crossing from World 2 finale into World 3 (Phase 34). */
export const RAYCAST_WORLD3_ENTRY_POINTS = 480;

export const RAYCAST_KILL_POINTS: Record<EnemyKind, number> = {
  GRUNT: 100,
  STALKER: 150,
  RANGED: 175,
  BRUTE: 250,
  SCRAMBLER: 130
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

/** Cumulative run stats across continued sectors (carried between maps). */
export interface RaycastCampaignMetrics {
  sectorsCleared: number;
  cumulativeElapsedMs: number;
  cumulativePelletsFired: number;
  cumulativePelletsHitHostile: number;
  cumulativeDamageTaken: number;
  cumulativeSecretsFound: number;
  /** Sum of each sector’s `secretTotal` — vault sweep compares found vs this. */
  cumulativeSecretSlots: number;
  cumulativeBossPelletsFired: number;
  cumulativeBossPelletsHitHostile: number;
  cumulativeBossDamageTaken: number;
  bossSectorsPlayed: number;
}

export function createEmptyCampaignMetrics(): RaycastCampaignMetrics {
  return {
    sectorsCleared: 0,
    cumulativeElapsedMs: 0,
    cumulativePelletsFired: 0,
    cumulativePelletsHitHostile: 0,
    cumulativeDamageTaken: 0,
    cumulativeSecretsFound: 0,
    cumulativeSecretSlots: 0,
    cumulativeBossPelletsFired: 0,
    cumulativeBossPelletsHitHostile: 0,
    cumulativeBossDamageTaken: 0,
    bossSectorsPlayed: 0
  };
}

export function mergeCampaignMetrics(prev: RaycastCampaignMetrics, sector: RaycastSectorMetrics): RaycastCampaignMetrics {
  return {
    sectorsCleared: prev.sectorsCleared + 1,
    cumulativeElapsedMs: prev.cumulativeElapsedMs + sector.elapsedMs,
    cumulativePelletsFired: prev.cumulativePelletsFired + sector.pelletsFired,
    cumulativePelletsHitHostile: prev.cumulativePelletsHitHostile + sector.pelletsHitHostile,
    cumulativeDamageTaken: prev.cumulativeDamageTaken + sector.damageTaken,
    cumulativeSecretsFound: prev.cumulativeSecretsFound + sector.secretsFound,
    cumulativeSecretSlots: prev.cumulativeSecretSlots + sector.secretTotal,
    cumulativeBossPelletsFired: prev.cumulativeBossPelletsFired + sector.bossPelletsFired,
    cumulativeBossPelletsHitHostile: prev.cumulativeBossPelletsHitHostile + sector.bossPelletsHitHostile,
    cumulativeBossDamageTaken: prev.cumulativeBossDamageTaken + sector.bossDamageTaken,
    bossSectorsPlayed: prev.bossSectorsPlayed + (sector.hadBoss ? 1 : 0)
  };
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

/** Weights — skill-adjacent; kills/secrets remain primary elsewhere. */
const PERFORMANCE_ACCURACY_CAP = 280;
const PERFORMANCE_SURVIVAL_CAP = 220;
const PERFORMANCE_BOSS_CAP = 180;
const PERFORMANCE_ACCURACY_RATIO_SCALE = 320;
const PERFORMANCE_SURVIVAL_DAMAGE_SOFT_CAP = 90;
const PERFORMANCE_SURVIVAL_PER_DAMAGE = 2.5;
const PERFORMANCE_BOSS_EFF_SCALE = 200;
/** Bonus for taking little damage during boss fights (instrumented in scene while `bossState.alive`). */
const PERFORMANCE_BOSS_CLEAN_CAP = 95;
const PERFORMANCE_BOSS_CLEAN_SLOPE = 2.15;
const PERFORMANCE_BOSS_CLEAN_SOFT_CEILING = 52;
const PERFORMANCE_MIN_PELLETS_FOR_ACCURACY = 8;
const PERFORMANCE_MIN_BOSS_PELLETS = 5;

/** Hard cap so skill bonus stays secondary to kills/secrets/boss flat bonuses. */
export const RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP = 600;

/** One-shot bonus when the final sector resolves (`episodeComplete`). */
export const RAYCAST_CAMPAIGN_COMPLETION_BONUS_CAP = 1200;

/** Generous full-run par — rewards routing without mandating speedrun tech. */
const CAMPAIGN_PACE_PAR_MS = 48 * 60 * 1000;
const CAMPAIGN_PACE_BONUS_CAP = 420;
const CAMPAIGN_VAULT_INTEL_BONUS = 480;
const CAMPAIGN_LOW_PROFILE_BONUS = 220;
const CAMPAIGN_LOW_PROFILE_AVG_DAMAGE_MAX = 28;
const CAMPAIGN_STEADY_AIM_BONUS = 200;
const CAMPAIGN_STEADY_AIM_MIN_PELLETS = 64;
const CAMPAIGN_STEADY_AIM_RATIO = 0.4;

/**
 * Sector-clear performance bonus (accuracy + low damage + boss pellet efficiency).
 * Shotgun counts many pellets per trigger — ratio is clamped to 1 so splash doesn’t explode math.
 */
export function computeSectorPerformanceBonus(m: RaycastSectorMetrics): number {
  const ratio = computePelletAccuracyRatio(m.pelletsFired, m.pelletsHitHostile) ?? 0;
  const accuracyPart =
    m.pelletsFired < PERFORMANCE_MIN_PELLETS_FOR_ACCURACY
      ? 0
      : Math.min(PERFORMANCE_ACCURACY_CAP, Math.floor(ratio * PERFORMANCE_ACCURACY_RATIO_SCALE));
  const survivalPart = Math.min(
    PERFORMANCE_SURVIVAL_CAP,
    Math.max(0, PERFORMANCE_SURVIVAL_DAMAGE_SOFT_CAP - Math.max(0, m.damageTaken)) * PERFORMANCE_SURVIVAL_PER_DAMAGE
  );

  let bossPart = 0;
  const bossRatio = computeBossPelletEfficiency(m.bossPelletsFired, m.bossPelletsHitHostile, m.hadBoss);
  if (bossRatio !== null && m.bossPelletsFired >= PERFORMANCE_MIN_BOSS_PELLETS) {
    bossPart = Math.min(PERFORMANCE_BOSS_CAP, Math.floor(bossRatio * PERFORMANCE_BOSS_EFF_SCALE));
  }

  let bossCleanPart = 0;
  if (m.hadBoss) {
    bossCleanPart = Math.min(
      PERFORMANCE_BOSS_CLEAN_CAP,
      Math.floor(
        Math.max(0, PERFORMANCE_BOSS_CLEAN_SOFT_CEILING - Math.max(0, m.bossDamageTaken)) *
          PERFORMANCE_BOSS_CLEAN_SLOPE
      )
    );
  }

  const raw = accuracyPart + survivalPart + bossPart + bossCleanPart;
  return Math.min(RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP, Math.floor(raw));
}

export function addRaycastSectorPerformanceBonus(score: number, m: RaycastSectorMetrics): number {
  const safe = Number.isFinite(score) ? score : 0;
  return safe + computeSectorPerformanceBonus(m);
}

/**
 * Campaign closure bonus — pace + intel sweep + survivorship + steady aim (capped).
 * Applied once when the run ends (no further maps).
 */
export function computeRaycastCampaignCompletionBonus(c: RaycastCampaignMetrics): number {
  const paceRatio = Math.max(0, (CAMPAIGN_PACE_PAR_MS - c.cumulativeElapsedMs) / CAMPAIGN_PACE_PAR_MS);
  const pacePart = Math.min(CAMPAIGN_PACE_BONUS_CAP, Math.floor(paceRatio * CAMPAIGN_PACE_BONUS_CAP));

  let bonus = pacePart;
  if (c.cumulativeSecretSlots > 0 && c.cumulativeSecretsFound === c.cumulativeSecretSlots) {
    bonus += CAMPAIGN_VAULT_INTEL_BONUS;
  }

  const avgDamage = c.sectorsCleared > 0 ? c.cumulativeDamageTaken / c.sectorsCleared : 999;
  if (avgDamage <= CAMPAIGN_LOW_PROFILE_AVG_DAMAGE_MAX) {
    bonus += CAMPAIGN_LOW_PROFILE_BONUS;
  }

  const runAcc = computePelletAccuracyRatio(c.cumulativePelletsFired, c.cumulativePelletsHitHostile);
  if (
    runAcc !== null &&
    c.cumulativePelletsFired >= CAMPAIGN_STEADY_AIM_MIN_PELLETS &&
    runAcc >= CAMPAIGN_STEADY_AIM_RATIO
  ) {
    bonus += CAMPAIGN_STEADY_AIM_BONUS;
  }

  return Math.min(RAYCAST_CAMPAIGN_COMPLETION_BONUS_CAP, bonus);
}

export function addRaycastCampaignCompletionBonus(score: number, c: RaycastCampaignMetrics): number {
  const safe = Number.isFinite(score) ? score : 0;
  return safe + computeRaycastCampaignCompletionBonus(c);
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
    medals.push('BOSS_STRIKE');
  }
  if (m.hadBoss && m.bossPelletsFired >= 4 && m.bossDamageTaken <= 34) {
    medals.push('BOSS_GRACE');
  }
  if (m.secretTotal > 0 && m.secretsFound === m.secretTotal) {
    medals.push('FULL_INTEL');
  }
  return medals;
}

/** Finale-only medals — requires merged campaign metrics. */
export function computeRaycastCampaignMedals(c: RaycastCampaignMetrics): string[] {
  const medals: string[] = [];
  if (c.sectorsCleared >= 4 && c.cumulativeElapsedMs <= 40 * 60 * 1000) {
    medals.push('STRATUM_PACE');
  }
  if (c.cumulativeSecretSlots > 0 && c.cumulativeSecretsFound === c.cumulativeSecretSlots) {
    medals.push('VAULT_SYNC');
  }
  if (c.sectorsCleared > 0 && c.cumulativeDamageTaken <= c.sectorsCleared * 22) {
    medals.push('IRON_ROUTE');
  }
  const runBossEff = computeBossPelletEfficiency(
    c.cumulativeBossPelletsFired,
    c.cumulativeBossPelletsHitHostile,
    c.bossSectorsPlayed > 0
  );
  if (
    runBossEff !== null &&
    c.cumulativeBossPelletsFired >= 14 &&
    runBossEff >= 0.34 &&
    c.bossSectorsPlayed >= 1
  ) {
    medals.push('BOSS_LAYER_CLEAR');
  }
  return medals;
}

export function formatRaycastSectorMedalLabel(id: string): string {
  switch (id) {
    case 'FLAWLESS_SIGNAL':
      return 'FLAWLESS SIGNAL';
    case 'MARKSMAN':
      return 'MARKSMAN';
    case 'BOSS_STRIKE':
      return 'BOSS STRIKE';
    case 'FULL_INTEL':
      return 'FULL INTEL';
    case 'STRATUM_PACE':
      return 'STRATUM PACE';
    case 'VAULT_SYNC':
      return 'VAULT SYNC';
    case 'IRON_ROUTE':
      return 'IRON ROUTE';
    case 'BOSS_LAYER_CLEAR':
      return 'BOSS LAYER CLEAR';
    case 'BOSS_GRACE':
      return 'BOSS GRACE';
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
