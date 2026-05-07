import { describe, expect, it } from 'vitest';
import {
  RAYCAST_HEARING_RANGE_FACTOR,
  computeRaycastEnemyPlayerAwareness
} from '../game/raycast/RaycastEnemySystem';

describe('raycast enemy awareness', () => {
  it('requires LOS to see but can hear closer targets without LOS', () => {
    const det = 1000;
    const hearDistWorld = (det * RAYCAST_HEARING_RANGE_FACTOR) / 100 - 0.05;
    const farWorld = (det * 1.01) / 100;

    expect(computeRaycastEnemyPlayerAwareness(true, hearDistWorld, det).sees).toBe(true);
    expect(computeRaycastEnemyPlayerAwareness(false, hearDistWorld, det).hears).toBe(true);
    expect(computeRaycastEnemyPlayerAwareness(false, hearDistWorld, det).aware).toBe(true);
    expect(computeRaycastEnemyPlayerAwareness(false, farWorld, det).aware).toBe(false);
  });

  it('does not count hearing when LOS is clear (sight takes precedence)', () => {
    const det = 1000;
    const d = 2;
    const a = computeRaycastEnemyPlayerAwareness(true, d, det);
    expect(a.sees).toBe(true);
    expect(a.hears).toBe(false);
    expect(a.aware).toBe(true);
  });
});
