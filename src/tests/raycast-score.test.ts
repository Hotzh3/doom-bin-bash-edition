import { describe, expect, it } from 'vitest';
import {
  addRaycastKillScore,
  addRaycastSecretScore,
  addRaycastSectorPerformanceBonus,
  computeBossPelletEfficiency,
  computePelletAccuracyRatio,
  computeRaycastSectorMedals,
  RAYCAST_FULL_ARC_CLEAR_BONUS,
  RAYCAST_HIGH_SCORE_STORAGE_KEY,
  RAYCAST_SECTOR_PERFORMANCE_BONUS_CAP,
  RAYCAST_SECRET_DISCOVER_POINTS,
  RAYCAST_WORLD2_ENTRY_POINTS,
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
    ).toContain('ARCHON_STRIKE');
    expect(
      computeRaycastSectorMedals({
        ...baseSector(),
        secretsFound: 2,
        secretTotal: 2
      })
    ).toContain('FULL_INTEL');
  });
});
