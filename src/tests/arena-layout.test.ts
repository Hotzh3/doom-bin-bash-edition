import { describe, expect, it } from 'vitest';
import { canOpenDoor, DARK_FOUNDRY_LAYOUT, isPointInsideRect } from '../game/level/arenaLayout';

describe('arena layout', () => {
  it('defines a combat route with walls, spawns, key, trigger, and door', () => {
    expect(DARK_FOUNDRY_LAYOUT.walls.length).toBeGreaterThan(8);
    expect(DARK_FOUNDRY_LAYOUT.enemySpawns.length).toBeGreaterThanOrEqual(4);
    expect(DARK_FOUNDRY_LAYOUT.initialSpawns.length).toBeGreaterThan(0);
    expect(DARK_FOUNDRY_LAYOUT.keys.length).toBeGreaterThan(0);
    expect(DARK_FOUNDRY_LAYOUT.doors.length).toBeGreaterThan(0);
    expect(DARK_FOUNDRY_LAYOUT.triggers.length).toBeGreaterThanOrEqual(2);
    expect(DARK_FOUNDRY_LAYOUT.key.unlocksDoorId).toBe(DARK_FOUNDRY_LAYOUT.exitDoor.id);
    expect(DARK_FOUNDRY_LAYOUT.combatTrigger.doorId).toBe(DARK_FOUNDRY_LAYOUT.exitDoor.id);
  });

  it('detects when a player enters a rectangular trigger', () => {
    expect(isPointInsideRect({ x: 705, y: 356 }, DARK_FOUNDRY_LAYOUT.combatTrigger)).toBe(true);
    expect(isPointInsideRect({ x: 120, y: 270 }, DARK_FOUNDRY_LAYOUT.combatTrigger)).toBe(false);
  });

  it('requires the key and enough kills before opening the door', () => {
    expect(canOpenDoor(false, 99, DARK_FOUNDRY_LAYOUT.exitDoor)).toBe(false);
    expect(canOpenDoor(true, 0, DARK_FOUNDRY_LAYOUT.exitDoor)).toBe(true);
    expect(canOpenDoor(true, DARK_FOUNDRY_LAYOUT.exitDoor.killsRequired, DARK_FOUNDRY_LAYOUT.exitDoor)).toBe(true);
  });

  it('defines zone spawns with explicit enemy kinds', () => {
    DARK_FOUNDRY_LAYOUT.triggers.forEach((trigger) => {
      expect(trigger.once).toBe(true);
      expect(trigger.spawns.length).toBeGreaterThan(0);
      trigger.spawns.forEach((spawn) => {
        expect(spawn.kind).toBeTruthy();
      });
    });
  });
});
