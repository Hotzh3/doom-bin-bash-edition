import { describe, expect, it } from 'vitest';
import { castRay, isWallAt, RAYCAST_MAP, RAYCAST_PLAYER_START } from '../game/raycast/RaycastMap';
import { cloneRaycastMap, openRaycastDoor, RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';

describe('raycast map', () => {
  it('treats map boundaries and wall tiles as solid', () => {
    expect(isWallAt(RAYCAST_MAP, 0.2, 0.2)).toBe(true);
    expect(isWallAt(RAYCAST_MAP, -1, 2)).toBe(true);
    expect(isWallAt(RAYCAST_MAP, RAYCAST_PLAYER_START.x, RAYCAST_PLAYER_START.y)).toBe(false);
  });

  it('treats closed doors as solid and opened doors as floor', () => {
    const map = cloneRaycastMap(RAYCAST_MAP);
    const door = RAYCAST_LEVEL.doors[0];

    expect(isWallAt(map, door.x, door.y)).toBe(true);

    openRaycastDoor(map, door);

    expect(isWallAt(map, door.x, door.y)).toBe(false);
  });

  it('casts rays until hitting a wall', () => {
    const hit = castRay(RAYCAST_MAP, RAYCAST_PLAYER_START.x, RAYCAST_PLAYER_START.y, RAYCAST_PLAYER_START.angle, RAYCAST_PLAYER_START.angle);

    expect(hit.distance).toBeGreaterThan(0);
    expect(hit.wallType).toBeGreaterThan(0);
    expect(hit.correctedDistance).toBeCloseTo(hit.distance);
  });

  it('places the locked door on the map where level data expects it', () => {
    const door = RAYCAST_LEVEL.doors[0];

    expect(RAYCAST_MAP.grid[door.tileY][door.tileX]).toBe(4);
  });

  it('corrects fish-eye distance when ray angle differs from camera angle', () => {
    const hit = castRay(
      RAYCAST_MAP,
      RAYCAST_PLAYER_START.x,
      RAYCAST_PLAYER_START.y,
      RAYCAST_PLAYER_START.angle + Math.PI / 6,
      RAYCAST_PLAYER_START.angle
    );

    expect(hit.correctedDistance).toBeLessThanOrEqual(hit.distance);
  });
});
