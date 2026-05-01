import { describe, expect, it } from 'vitest';
import { buildRaycastRunSummary, formatRunDuration } from '../game/raycast/RaycastRunSummary';

describe('raycast run summary', () => {
  it('formats run duration as minutes, seconds, and tenths', () => {
    expect(formatRunDuration(0)).toBe('0:00.0');
    expect(formatRunDuration(65_432)).toBe('1:05.4');
    expect(formatRunDuration(-100)).toBe('0:00.0');
  });

  it('builds final summary lines for victory and retry screens', () => {
    const summary = buildRaycastRunSummary({
      elapsedMs: 125_900,
      enemiesKilled: 8,
      secretsFound: 1,
      secretTotal: 2,
      tokensFound: 1,
      tokenTotal: 1,
      damageTaken: 47
    });

    expect(summary).toEqual(['TIME 2:05.9', 'ENEMIES KILLED 8', 'SECRETS 1/2', 'TOKENS 1/1', 'DAMAGE TAKEN 47']);
  });
});
