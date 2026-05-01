import { describe, expect, it } from 'vitest';
import { KeySystem } from '../game/systems/KeySystem';
import { DoorSystem } from '../game/systems/DoorSystem';
import {
  RAYCAST_LEVEL,
  cloneRaycastMap,
  findRaycastZoneId,
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor
} from '../game/raycast/RaycastLevel';
import { RAYCAST_MAP, isWallAt } from '../game/raycast/RaycastMap';

describe('raycast level', () => {
  it('defines a complete FPS level route', () => {
    expect(RAYCAST_LEVEL.keys).toHaveLength(1);
    expect(RAYCAST_LEVEL.doors).toHaveLength(1);
    expect(RAYCAST_LEVEL.triggers.length).toBeGreaterThan(0);
    expect(RAYCAST_LEVEL.secrets).toHaveLength(1);
    expect(RAYCAST_LEVEL.exits).toHaveLength(1);
    expect(RAYCAST_LEVEL.initialSpawns.length).toBeGreaterThanOrEqual(4);
    expect(RAYCAST_LEVEL.director.enabled).toBe(true);
    expect(RAYCAST_LEVEL.director.spawnPoints.length).toBeGreaterThan(0);
  });

  it('opens a locked raycast door by mutating only the cloned map', () => {
    const map = cloneRaycastMap(RAYCAST_MAP);
    const door = RAYCAST_LEVEL.doors[0];

    expect(isWallAt(RAYCAST_MAP, door.x, door.y)).toBe(true);
    expect(isWallAt(map, door.x, door.y)).toBe(true);

    openRaycastDoor(map, door);

    expect(isWallAt(map, door.x, door.y)).toBe(false);
    expect(isWallAt(RAYCAST_MAP, door.x, door.y)).toBe(true);
  });

  it('uses the shared key and door systems for access rules', () => {
    const keys = new KeySystem();
    const doors = new DoorSystem(keys);
    const key = RAYCAST_LEVEL.keys[0];
    const door = RAYCAST_LEVEL.doors[0];

    expect(doors.attemptOpen(door, 0).reason).toBe('MISSING_KEY');
    expect(keys.collect(key)).toBe(true);
    expect(doors.attemptOpen(door, 0).reason).toBe('OPENED');
  });

  it('detects pickups and exit by radius', () => {
    const key = RAYCAST_LEVEL.keys[0];
    const exit = RAYCAST_LEVEL.exits[0];

    expect(isNearPoint(key.x, key.y, key)).toBe(true);
    expect(isNearPoint(exit.x + exit.radius + 1, exit.y, exit)).toBe(false);
  });

  it('finds the current FPS zone and safe director spawns', () => {
    expect(findRaycastZoneId(RAYCAST_LEVEL, 2.4, 9.4)).toBe('start');

    const spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL, { x: 2.4, y: 9.4 }, 'start');

    expect(spawns.length).toBeGreaterThan(0);
    expect(spawns.every((spawn) => Math.hypot(spawn.x - 2.4, spawn.y - 9.4) >= 1.6)).toBe(true);
  });
});
