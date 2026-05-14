import { describe, expect, it } from 'vitest';
import {
  buildRaycastRunSummary,
  computeRaycastRunMasteryMarks,
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
      'RANK B — SOLID CONTROL',
      'TIME 2:05.9',
      'SECRETS 1/2',
      'TOKENS 1/1',
      'MARKS SPEED CLEAR | NO REGEN USED | CLEAN RUN'
    ]);
  });

  it('computes discrete rank tiers from score', () => {
    expect(computeRaycastRunRank(3000)).toContain('RANK D');
    expect(computeRaycastRunRank(6200)).toContain('RANK C');
    expect(computeRaycastRunRank(10_500)).toContain('RANK B');
    expect(computeRaycastRunRank(14_500)).toContain('RANK A');
    expect(computeRaycastRunRank(19_000)).toContain('RANK S');
    expect(computeRaycastRunRank(23_000)).toContain('RANK SS');
    expect(computeRaycastRunRankParts(6200).tierLetter).toBe('C');
    expect(computeRaycastRunRankParts(10_500).tierLetter).toBe('B');
    expect(computeRaycastRunRankParts(19_000).tierLetter).toBe('S');
    expect(computeRaycastRunRankParts(23_000).tierLetter).toBe('SS');
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
    expect(summary).toHaveLength(7);
    expect(summary.some((line) => line.includes('ACCURACY'))).toBe(true);
    expect(summary.some((line) => line.includes('TOKENS 0/1'))).toBe(true);
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

  it('awards requested mastery marks from run conditions', () => {
    const marks = computeRaycastRunMasteryMarks({
      elapsedMs: 3 * 60 * 1000,
      enemiesKilled: 9,
      secretsFound: 2,
      secretTotal: 2,
      tokensFound: 1,
      tokenTotal: 1,
      damageTaken: 0,
      pelletsFired: 40,
      pelletsHitHostile: 40,
      hadBoss: true,
      bossArenaDamageTaken: 12,
      regenUsed: false,
      deaths: 0,
      retries: 0
    });
    expect(marks).toContain('NO DAMAGE');
    expect(marks).toContain('SPEED CLEAR');
    expect(marks).toContain('FULL ACCURACY');
    expect(marks).toContain('ALL SECRETS');
    expect(marks).toContain('NO REGEN USED');
    expect(marks).toContain('FULL INTEL');
    expect(marks).toContain('BOSS BREAKER');
    expect(marks).toContain('CLEAN RUN');
  });
});
