import { describe, expect, it } from 'vitest';
import {
  buildRaycastRunSummary,
  computeRaycastRunRank,
  formatRunDuration
} from '../game/raycast/RaycastRunSummary';

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
      '══ SECTOR REPORT ══',
      'DIFFICULTY HARD',
      '── TIME ──',
      'ELAPSED 2:05.9',
      '── COMBAT ──',
      'HOSTILES TERMINATED 8',
      'DAMAGE TAKEN 47',
      '── INTEL ──',
      'SECRETS 1/2',
      'TOKENS 1/1'
    ]);
  });

  it('computes discrete rank tiers from score', () => {
    expect(computeRaycastRunRank(5300)).toContain('RANK C');
    expect(computeRaycastRunRank(12_500)).toContain('RANK A');
    expect(computeRaycastRunRank(17_000)).toContain('RANK S');
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

    expect(summary).toContain('SCORE 350  │  HIGH SCORE 1200');
    expect(summary.some((line) => line.startsWith('RANK '))).toBe(true);
    expect(summary).toContain('ACCURACY 45% (9/20 pellets)');
  });
});
