import { describe, expect, it } from 'vitest';
import {
  advancePatrolWaypointIndex,
  buildRaycastPatrolWaypoints,
  hashStringToSeed
} from '../game/raycast/RaycastPatrol';

describe('raycast patrol helpers', () => {
  it('builds a small route around home using a stable seed', () => {
    const wps = buildRaycastPatrolWaypoints(5, 8, 'enemy-a');
    expect(wps.length).toBeGreaterThanOrEqual(3);
    expect(wps[0]).toEqual({ x: 5, y: 8 });
    const wpsB = buildRaycastPatrolWaypoints(5, 8, 'enemy-b');
    expect(wpsB[1]).not.toEqual(wps[1]);
  });

  it('advances patrol index only when the current waypoint is reached', () => {
    expect(advancePatrolWaypointIndex(0, 4, false)).toBe(0);
    expect(advancePatrolWaypointIndex(0, 4, true)).toBe(1);
    expect(advancePatrolWaypointIndex(3, 4, true)).toBe(0);
    expect(advancePatrolWaypointIndex(0, 0, true)).toBe(0);
  });

  it('hashes ids deterministically', () => {
    expect(hashStringToSeed('a')).toBe(hashStringToSeed('a'));
    expect(hashStringToSeed('a')).not.toBe(hashStringToSeed('b'));
  });
});
