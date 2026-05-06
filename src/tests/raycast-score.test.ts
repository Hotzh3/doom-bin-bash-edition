import { describe, expect, it } from 'vitest';
import {
  addRaycastKillScore,
  RAYCAST_HIGH_SCORE_STORAGE_KEY,
  raycastPointsForKill,
  readRaycastHighScore,
  writeRaycastHighScoreIfBetter
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
});
