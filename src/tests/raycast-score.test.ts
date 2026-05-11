import { describe, expect, it } from 'vitest';
import {
  addRaycastKillScore,
  addRaycastSecretScore,
  addRaycastSectorPerformanceBonus,
  computeBossPelletEfficiency,
  computeRaycastCampaignMedals,
  computePelletAccuracyRatio,
  computeRaycastCampaignCompletionBonus,
  computeRaycastSectorMedals,
  createEmptyCampaignMetrics,
  mergeCampaignMetrics,
  RAYCAST_FULL_ARC_CLEAR_BONUS,
  RAYCAST_HIGH_SCORE_STORAGE_KEY,
  RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP,
  RAYCAST_SECRET_DISCOVER_POINTS,
  RAYCAST_WORLD2_ENTRY_POINTS,
  RAYCAST_WORLD3_ENTRY_POINTS,
  raycastPointsForKill,
  readRaycastHighScore,
  writeRaycastHighScoreIfBetter,
  type RaycastSectorMetrics
} from '../game/raycast/RaycastScore';

describe('raycast score', () => {
  it('assigns kill points by enemy kind', () => {
    expect(raycastPointsForKill('GRUNT')).toBe(100);
    expect(raycastPointsForKill('STALKER')).toBe(150);
    expect(raycastPointsForKill('RANGED')).toBe(175);
    expect(raycastPointsForKill('BRUTE')).toBe(250);
    expect(raycastPointsForKill('SCRAMBLER')).toBe(130);
  });

  it('accumulates score from kill kinds', () => {
    expect(addRaycastKillScore(0, ['GRUNT', 'BRUTE'])).toBe(350);
    expect(addRaycastKillScore(100, ['STALKER', 'RANGED'])).toBe(425);
  });

  it('adds a bounded bonus when discovering a hidden sector node', () => {
    expect(RAYCAST_SECRET_DISCOVER_POINTS).toBe(380);
    expect(addRaycastSecretScore(100)).toBe(480);
  });

  it('reads and writes high score with in-memory storage', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      }
    };
    expect(readRaycastHighScore(storage)).toBe(0);
    expect(writeRaycastHighScoreIfBetter(120, storage)).toBe(true);
    expect(readRaycastHighScore(storage)).toBe(120);
    expect(writeRaycastHighScoreIfBetter(80, storage)).toBe(false);
    expect(readRaycastHighScore(storage)).toBe(120);
    expect(writeRaycastHighScoreIfBetter(200, storage)).toBe(true);
    expect(readRaycastHighScore(storage)).toBe(200);
  });

  it('uses stable localStorage key', () => {
    expect(RAYCAST_HIGH_SCORE_STORAGE_KEY).toBe('raycast_high_score_v1');
  });

  it('exposes World 2 run bonuses for campaign continuation', () => {
    expect(RAYCAST_WORLD2_ENTRY_POINTS).toBe(520);
    expect(RAYCAST_WORLD3_ENTRY_POINTS).toBe(480);
    expect(RAYCAST_FULL_ARC_CLEAR_BONUS).toBe(1100);
  });

  it('computes pellet ratios with an upper clamp', () => {
    expect(computePelletAccuracyRatio(0, 5)).toBeNull();
    expect(computePelletAccuracyRatio(10, 12)).toBe(1);
    expect(computePelletAccuracyRatio(10, 5)).toBe(0.5);
  });

  it('computes boss pellet efficiency only when applicable', () => {
    expect(computeBossPelletEfficiency(10, 4, false)).toBeNull();
    expect(computeBossPelletEfficiency(0, 0, true)).toBeNull();
    expect(computeBossPelletEfficiency(10, 5, true)).toBe(0.5);
  });

  const baseSector = (): RaycastSectorMetrics => ({
    pelletsFired: 0,
    pelletsHitHostile: 0,
    damageTaken: 0,
    secretsFound: 0,
    secretTotal: 0,
    elapsedMs: 0,
    enemiesKilled: 0,
    bossPelletsFired: 0,
    bossPelletsHitHostile: 0,
    bossDamageTaken: 0,
    hadBoss: false
  });

  it('adds bounded sector performance bonus', () => {
    const rich: RaycastSectorMetrics = {
      ...baseSector(),
      pelletsFired: 40,
      pelletsHitHostile: 36,
      damageTaken: 0,
      bossPelletsFired: 30,
      bossPelletsHitHostile: 24,
      hadBoss: true
    };
    const bonus = addRaycastSectorPerformanceBonus(1000, rich) - 1000;
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP);
  });

  it('awards medals from sector metrics', () => {
    expect(computeRaycastSectorMedals({ ...baseSector(), damageTaken: 0 })).toContain('FLAWLESS_SIGNAL');
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        pelletsFired: 14,
        pelletsHitHostile: 6,
        damageTaken: 10
      })
    ).toContain('MARKSMAN');
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        hadBoss: true,
        bossPelletsFired: 10,
        bossPelletsHitHostile: 4,
        damageTaken: 30
      })
    ).toContain('BOSS_STRIKE');
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        secretsFound: 2,
        secretTotal: 2
      })
    ).toContain('FULL_INTEL');
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        secretsFound: 1,
        secretTotal: 2,
        elapsedMs: 5 * 60 * 1000
      })
    ).toContain('PATHFINDER');
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        elapsedMs: 3 * 60 * 1000,
        enemiesKilled: 7,
        damageTaken: 30
      })
    ).toContain('SPEED_SURGE');
  });

  it('merges sector snapshots into campaign totals deterministically', () => {
    let c = createEmptyCampaignMetrics();
    const s1: RaycastSectorMetrics = {
      pelletsFired: 10,
      pelletsHitHostile: 5,
      damageTaken: 12,
      secretsFound: 1,
      secretTotal: 2,
      elapsedMs: 60_000,
      enemiesKilled: 3,
      bossPelletsFired: 8,
      bossPelletsHitHostile: 3,
      bossDamageTaken: 20,
      hadBoss: true
    };
    c = mergeCampaignMetrics(c, s1);
    expect(c.sectorsCleared).toBe(1);
    expect(c.cumulativeElapsedMs).toBe(60_000);
    expect(c.cumulativePelletsFired).toBe(10);
    expect(c.bossSectorsPlayed).toBe(1);
    const s2: RaycastSectorMetrics = { ...s1, elapsedMs: 30_000, hadBoss: false, bossPelletsFired: 0, bossPelletsHitHostile: 0 };
    c = mergeCampaignMetrics(c, s2);
    expect(c.sectorsCleared).toBe(2);
    expect(c.cumulativeElapsedMs).toBe(90_000);
    expect(c.bossSectorsPlayed).toBe(1);
  });

  it('tilts sector performance bonus toward low boss-arena damage when a boss is present', () => {
    const shared = {
      ...baseSector(),
      pelletsFired: 24,
      pelletsHitHostile: 14,
      bossPelletsFired: 12,
      bossPelletsHitHostile: 6,
      hadBoss: true
    };
    const lowBossDmg = addRaycastSectorPerformanceBonus(1000, { ...shared, bossDamageTaken: 12 }) - 1000;
    const highBossDmg = addRaycastSectorPerformanceBonus(1000, { ...shared, bossDamageTaken: 70 }) - 1000;
    expect(lowBossDmg).toBeGreaterThan(highBossDmg);
  });

  it('awards BOSS_GRACE when boss arena damage stays controlled', () => {
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        hadBoss: true,
        bossPelletsFired: 8,
        bossDamageTaken: 28
      })
    ).toContain('BOSS_GRACE');
  });

  it('adds a bounded campaign completion bonus', () => {
    const c = mergeCampaignMetrics(createEmptyCampaignMetrics(), {
      pelletsFired: 80,
      pelletsHitHostile: 40,
      damageTaken: 40,
      secretsFound: 2,
      secretTotal: 2,
      elapsedMs: 30 * 60 * 1000,
      enemiesKilled: 10,
      bossPelletsFired: 20,
      bossPelletsHitHostile: 10,
      bossDamageTaken: 30,
      hadBoss: true
    });
    const bonus = computeRaycastCampaignCompletionBonus(c);
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(1200);
  });

  it('awards DEEP_SCOUT campaign medal for strong but not full secret routing', () => {
    let c = createEmptyCampaignMetrics();
    c = mergeCampaignMetrics(c, {
      ...baseSector(),
      secretTotal: 5,
      secretsFound: 3,
      elapsedMs: 8 * 60 * 1000,
      enemiesKilled: 6
    });
    expect(computeRaycastCampaignMedals(c)).toContain('DEEP_SCOUT');
  });
});
