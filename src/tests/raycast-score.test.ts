import { describe, expect, it } from 'vitest';
import {
  addRaycastKillScore,
  addRaycastSecretScore,
  RAYCAST_FULL_ARC_CLEAR_BONUS,
  RAYCAST_HIGH_SCORE_STORAGE_KEY,
  RAYCAST_SECRET_DISCOVER_POINTS,
  RAYCAST_WORLD2_ENTRY_POINTS,
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
});
