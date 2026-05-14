import { describe, expect, it } from 'vitest';
import {
  buildRaycastRunSummary,
  computeRaycastRunRank,
  computeRaycastRunRankParts,
  formatRunDuration
} from '../game/raycast/RaycastRunSummary';
import { createEmptyCampaignMetrics, mergeCampaignMetrics } from '../game/raycast/RaycastScore';

describe('raycast run summary', () => {
  it('formats run duration as minutes, seconds, and tenths', () => {
    expect(formatRunDuration(0)).toBe('0:00.0');
    expect(formatRunDuration(65_432)).toBe('1:05.4');
    expect(formatRunDuration(-100)).toBe('0:00.0');
  });

  it('builds final summary lines for victory and retry screens', () => {
    const summary = buildRaycastRunSummary({
      difficultyLabel: 'Hard',
      elapsedMs: 125_900,
      enemiesKilled: 8,
      secretsFound: 1,
      secretTotal: 2,
      tokensFound: 1,
      tokenTotal: 1,
      damageTaken: 47
    });

    expect(summary).toEqual([
      'TIME 2:05.9',
      'SECRETS 1/2'
    ]);
  });

  it('computes discrete rank tiers from score', () => {
    expect(computeRaycastRunRank(6200)).toContain('RANK C');
    expect(computeRaycastRunRank(14_500)).toContain('RANK A');
    expect(computeRaycastRunRank(19_000)).toContain('RANK S');
    expect(computeRaycastRunRankParts(6200).tierLetter).toBe('C');
    expect(computeRaycastRunRankParts(19_000).tierLetter).toBe('S');
  });

  it('includes score lines when provided', () => {
    const summary = buildRaycastRunSummary({
      elapsedMs: 10_000,
      enemiesKilled: 2,
      score: 350,
      highScore: 1200,
      secretsFound: 0,
      secretTotal: 1,
      tokensFound: 0,
      tokenTotal: 1,
      damageTaken: 10,
      pelletsFired: 20,
      pelletsHitHostile: 9
    });

    expect(summary.some((line) => line.includes('350') && line.includes('1,200'))).toBe(true);
    expect(summary.some((line) => line.includes('RANK'))).toBe(true);
    expect(summary).toHaveLength(5);
    expect(summary.some((line) => line.includes('ACCURACY'))).toBe(true);
    expect(summary.some((line) => line.includes('ACC (SECTOR)'))).toBe(false);
    expect(summary.some((line) => line.includes('PLAYSTYLE'))).toBe(false);
  });

  it('prepends run composite when finale campaign metrics are provided', () => {
    let c = createEmptyCampaignMetrics();
    c = mergeCampaignMetrics(c, {
      pelletsFired: 30,
      pelletsHitHostile: 12,
      damageTaken: 20,
      secretsFound: 1,
      secretTotal: 1,
      elapsedMs: 120_000,
      enemiesKilled: 4,
      bossPelletsFired: 10,
      bossPelletsHitHostile: 4,
      bossDamageTaken: 15,
      hadBoss: true
    });
    const summary = buildRaycastRunSummary({
      elapsedMs: 120_000,
      enemiesKilled: 4,
      score: 9000,
      secretsFound: 1,
      secretTotal: 1,
      tokensFound: 0,
      tokenTotal: 1,
      damageTaken: 20,
      pelletsFired: 30,
      pelletsHitHostile: 12,
      episodeComplete: true,
      campaign: c
    });
    expect(summary[0]).toBe('SCORE 9,000');
    expect(summary.some((line) => line.includes('RUN LOCK // COMPOSITE'))).toBe(false);
    expect(summary.some((line) => line.includes('TIME 2:00.0'))).toBe(true);
  });
});
