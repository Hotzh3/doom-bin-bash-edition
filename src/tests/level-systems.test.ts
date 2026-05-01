import { describe, expect, it } from 'vitest';
import { DARK_FOUNDRY_LAYOUT } from '../game/level/arenaLayout';
import { DoorSystem } from '../game/systems/DoorSystem';
import { KeySystem } from '../game/systems/KeySystem';
import { LevelSystem } from '../game/systems/LevelSystem';
import { TriggerSystem } from '../game/systems/TriggerSystem';

describe('level systems', () => {
  it('tracks keys and opens matching doors', () => {
    const keys = new KeySystem();
    const doors = new DoorSystem(keys);
    const key = DARK_FOUNDRY_LAYOUT.key;
    const door = DARK_FOUNDRY_LAYOUT.exitDoor;

    expect(doors.attemptOpen(door, 0).reason).toBe('MISSING_KEY');
    expect(keys.collect(key)).toBe(true);
    expect(keys.collect(key)).toBe(false);
    expect(doors.attemptOpen(door, 0).reason).toBe('OPENED');
    expect(doors.isOpen(door.id)).toBe(true);
    expect(doors.attemptOpen(door, 0).reason).toBe('ALREADY_OPEN');
  });

  it('activates one-shot triggers only once when entered', () => {
    const triggers = new TriggerSystem();
    const trigger = DARK_FOUNDRY_LAYOUT.combatTrigger;

    expect(triggers.activateIfEntered(trigger, [{ x: 0, y: 0 }])).toBe(false);
    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => true })).toBe(true);
    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => true })).toBe(false);
    expect(triggers.hasActivated(trigger.id)).toBe(true);
  });

  it('requires ArenaScene to pass door state for foundry triggers', () => {
    const keys = new KeySystem();
    const doors = new DoorSystem(keys);
    const triggers = new TriggerSystem();
    const trigger = DARK_FOUNDRY_LAYOUT.combatTrigger;
    const triggerPoint = [{ x: trigger.x, y: trigger.y }];

    expect(triggers.activateIfEntered(trigger, triggerPoint)).toBe(false);
    expect(
      triggers.activateIfEntered(trigger, triggerPoint, {
        isDoorOpen: (doorId) => doors.isOpen(doorId)
      })
    ).toBe(false);

    keys.collect(DARK_FOUNDRY_LAYOUT.key);
    expect(doors.attemptOpen(DARK_FOUNDRY_LAYOUT.exitDoor, 0).reason).toBe('OPENED');
    expect(
      triggers.activateIfEntered(trigger, triggerPoint, {
        isDoorOpen: (doorId) => doors.isOpen(doorId)
      })
    ).toBe(true);
  });

  it('exposes level data for the director and door lookups', () => {
    const level = new LevelSystem(DARK_FOUNDRY_LAYOUT);

    expect(level.getDirectorSpawnPoints()).toEqual(DARK_FOUNDRY_LAYOUT.enemySpawns);
    expect(level.findDoor(DARK_FOUNDRY_LAYOUT.exitDoor.id)).toBe(DARK_FOUNDRY_LAYOUT.exitDoor);
    expect(level.getOpeningObjective()).toContain('corruption key');
  });
});
