import { describe, expect, it } from 'vitest';
import { KeySystem } from '../game/systems/KeySystem';
import { DoorSystem } from '../game/systems/DoorSystem';
import { TriggerSystem } from '../game/systems/TriggerSystem';
import {
  RAYCAST_LEVEL,
  RAYCAST_LEVEL_2,
  RAYCAST_LEVEL_CATALOG,
  cloneRaycastMap,
  findRaycastZoneId,
  getRaycastExitAccess,
  getRaycastLevelIndex,
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor,
  registerRaycastSecret,
  getRaycastDoorRequiredKeyIds,
  type RaycastLevel,
  type RaycastTrigger
} from '../game/raycast/RaycastLevel';
import { RAYCAST_ATMOSPHERE } from '../game/raycast/RaycastAtmosphere';
import { RAYCAST_TILE, type RaycastMap } from '../game/raycast/RaycastMap';

describe('raycast level catalog', () => {
  it('includes two levels with unique ids and stable ordering', () => {
    expect(RAYCAST_LEVEL_CATALOG).toHaveLength(2);
    expect(new Set(RAYCAST_LEVEL_CATALOG.map((level) => level.id)).size).toBe(2);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL.id)).toBe(0);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL_2.id)).toBe(1);
  });

  it('defines required route objects and valid map references for each level', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      expect(level.keys).toHaveLength(1);
      expect(level.doors).toHaveLength(1);
      expect(level.triggers.length).toBeGreaterThanOrEqual(3);
      expect(level.secrets).toHaveLength(1);
      expect(level.exits).toHaveLength(1);
      expect(level.initialSpawns.length).toBeGreaterThanOrEqual(4);
      expect(level.director.enabled).toBe(true);
      expect(level.director.spawnPoints.length).toBeGreaterThan(0);

      level.keys.forEach((key) => {
        const door = level.doors.find((candidate) => candidate.id === key.unlocksDoorId);

        expect(door).toBeDefined();
        expect(door?.keyId).toBe(key.id);
        expect(level.map.grid[door!.tileY]?.[door!.tileX]).toBe(RAYCAST_TILE.LOCKED_DOOR);
      });

      level.doors.forEach((door) => {
        expect(door.tileY).toBeGreaterThanOrEqual(0);
        expect(door.tileY).toBeLessThan(level.map.grid.length);
        expect(door.tileX).toBeGreaterThanOrEqual(0);
        expect(door.tileX).toBeLessThan(level.map.grid[door.tileY].length);
        expect(level.map.grid[door.tileY][door.tileX]).toBe(RAYCAST_TILE.LOCKED_DOOR);
      });
    });
  });

  it('keeps player starts, objectives, spawns, and director points on walkable cells for each level', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      const points = [
        level.playerStart,
        ...level.keys,
        ...level.secrets,
        ...level.exits,
        ...level.initialSpawns,
        ...level.triggers.flatMap((trigger) => trigger.spawns),
        ...level.director.spawnPoints
      ];

      points.forEach((point) => {
        expect(level.map.grid[Math.floor(point.y)]?.[Math.floor(point.x)]).toBe(RAYCAST_TILE.EMPTY);
      });
    });
  });

  it('keeps initial spawns fair relative to each level start', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      level.initialSpawns.forEach((spawn) => {
        expect(Math.hypot(spawn.x - level.playerStart.x, spawn.y - level.playerStart.y)).toBeGreaterThanOrEqual(2);
      });
    });
  });
});

describe('raycast level progression', () => {
  it('uses the shared key and door systems for access rules', () => {
    const keys = new KeySystem();
    const doors = new DoorSystem(keys);
    const key = RAYCAST_LEVEL.keys[0];
    const door = RAYCAST_LEVEL.doors[0];

    expect(doors.attemptOpen(door, 0).reason).toBe('MISSING_KEY');
    expect(keys.collect(key)).toBe(true);
    expect(keys.collect(key)).toBe(false);
    expect(keys.hasKey(key.id)).toBe(true);
    expect(doors.attemptOpen(door, 0).reason).toBe('OPENED');
    expect(doors.isOpen(door.id)).toBe(true);
    expect(doors.attemptOpen(door, 0).reason).toBe('ALREADY_OPEN');
  });

  it('blocks level exits until keys, doors, and main triggers are complete', () => {
    const level1Blocked = getRaycastExitAccess(RAYCAST_LEVEL, {
      collectedKeyIds: [],
      openDoorIds: [],
      activatedTriggerIds: [],
      livingEnemyCount: 0
    });
    const level2Blocked = getRaycastExitAccess(RAYCAST_LEVEL_2, {
      collectedKeyIds: [],
      openDoorIds: [],
      activatedTriggerIds: [],
      livingEnemyCount: 0
    });

    expect(level1Blocked).toEqual({
      allowed: false,
      reason: 'TOKEN_REQUIRED',
      message: 'TOKEN REQUIRED',
      missingKeyIds: ['rust-key']
    });
    expect(level2Blocked).toEqual({
      allowed: false,
      reason: 'TOKEN_REQUIRED',
      message: 'TOKEN REQUIRED',
      missingKeyIds: ['glass-sigil']
    });
  });

  it('allows level exits after progression requirements are met', () => {
    expect(
      getRaycastExitAccess(RAYCAST_LEVEL, {
        collectedKeyIds: ['rust-key'],
        openDoorIds: ['rust-gate'],
        activatedTriggerIds: ['gate-ambush'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_2, {
        collectedKeyIds: ['glass-sigil'],
        openDoorIds: ['cistern-gate'],
        activatedTriggerIds: ['furnace-ambush'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);
  });

  it('returns specific exit block reasons for route, trigger, and combat locks', () => {
    expect(
      getRaycastExitAccess(RAYCAST_LEVEL, {
        collectedKeyIds: ['rust-key'],
        openDoorIds: [],
        activatedTriggerIds: [],
        livingEnemyCount: 0
      })
    ).toEqual({
      allowed: false,
      reason: 'ACCESS_DENIED',
      message: 'ACCESS DENIED: NODE INCOMPLETE',
      missingDoorIds: ['rust-gate']
    });

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL, {
        collectedKeyIds: ['rust-key'],
        openDoorIds: ['rust-gate'],
        activatedTriggerIds: [],
        livingEnemyCount: 0
      })
    ).toEqual({
      allowed: false,
      reason: 'TRIGGER_REQUIRED',
      message: 'TRIGGER REQUIRED',
      missingTriggerIds: ['gate-ambush']
    });

    const combatLockedLevel: RaycastLevel = {
      ...RAYCAST_LEVEL,
      progression: {
        ...RAYCAST_LEVEL.progression,
        requireCombatClear: true
      }
    };

    expect(
      getRaycastExitAccess(combatLockedLevel, {
        collectedKeyIds: ['rust-key'],
        openDoorIds: ['rust-gate'],
        activatedTriggerIds: ['gate-ambush'],
        livingEnemyCount: 2
      })
    ).toEqual({
      allowed: false,
      reason: 'SIGNAL_LOCKED',
      message: 'SIGNAL LOCKED'
    });
  });

  it('normalizes multi-token door metadata without changing existing single-token doors', () => {
    expect(getRaycastDoorRequiredKeyIds(RAYCAST_LEVEL.doors[0])).toEqual(['rust-key']);
    expect(
      getRaycastDoorRequiredKeyIds({
        ...RAYCAST_LEVEL.doors[0],
        requiredKeyIds: ['rust-key', 'backup-token']
      })
    ).toEqual(['rust-key', 'backup-token']);
  });

  it('activates door-bound ambush triggers only once', () => {
    const triggers = new TriggerSystem();
    const trigger = RAYCAST_LEVEL_2.triggers[0];

    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => false })).toBe(false);
    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => true })).toBe(true);
    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => true })).toBe(false);
  });

  it('keeps doorless triggers working normally', () => {
    const triggers = new TriggerSystem();
    const freeTrigger: RaycastTrigger = {
      id: 'free-trigger',
      x: 2,
      y: 2,
      width: 1,
      height: 1,
      once: true,
      objectiveText: 'Free trigger',
      activationText: 'Free activation',
      spawns: []
    };

    expect(
      triggers.activateIfEntered(freeTrigger, [{ x: 2, y: 2 }])
    ).toBe(true);
  });
});

describe('raycast level route safety', () => {
  it('opens a locked raycast door by mutating only the cloned map', () => {
    const map = cloneRaycastMap(RAYCAST_LEVEL.map);
    const door = RAYCAST_LEVEL.doors[0];

    expect(RAYCAST_LEVEL.map.grid[door.tileY][door.tileX]).toBe(RAYCAST_TILE.LOCKED_DOOR);

    openRaycastDoor(map, door);

    expect(map.grid[door.tileY][door.tileX]).toBe(RAYCAST_TILE.EMPTY);
    expect(RAYCAST_LEVEL.map.grid[door.tileY][door.tileX]).toBe(RAYCAST_TILE.LOCKED_DOOR);
  });

  it('detects pickups and exits by radius', () => {
    const key = RAYCAST_LEVEL_2.keys[0];
    const exit = RAYCAST_LEVEL_2.exits[0];

    expect(isNearPoint(key.x, key.y, key)).toBe(true);
    expect(isNearPoint(exit.x + exit.radius + 1, exit.y, exit)).toBe(false);
  });

  it('finds the current zone and safe director spawns for both starts', () => {
    expect(findRaycastZoneId(RAYCAST_LEVEL, RAYCAST_LEVEL.playerStart.x, RAYCAST_LEVEL.playerStart.y)).toBe('start');
    expect(findRaycastZoneId(RAYCAST_LEVEL_2, RAYCAST_LEVEL_2.playerStart.x, RAYCAST_LEVEL_2.playerStart.y)).toBe('start');

    const level1Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL, RAYCAST_LEVEL.playerStart, 'start');
    const level2Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL_2, RAYCAST_LEVEL_2.playerStart, 'start');

    expect(level1Spawns.length).toBeGreaterThan(0);
    expect(level2Spawns.length).toBeGreaterThan(0);
  });

  it('keeps level 1 critical route and arena behind the gate', () => {
    const key = RAYCAST_LEVEL.keys[0];
    const exit = RAYCAST_LEVEL.exits[0];
    const arena = { x: 14.5, y: 9.5 };
    const openedMap = cloneRaycastMap(RAYCAST_LEVEL.map);
    openRaycastDoor(openedMap, RAYCAST_LEVEL.doors[0]);

    expect(hasGridPath(RAYCAST_LEVEL.map, RAYCAST_LEVEL.playerStart, key)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL.map, RAYCAST_LEVEL.playerStart, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL.playerStart, arena)).toBe(true);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL.playerStart, exit)).toBe(true);
  });

  it('keeps level 2 key reachable early and exit locked behind the breach gate', () => {
    const key = RAYCAST_LEVEL_2.keys[0];
    const exit = RAYCAST_LEVEL_2.exits[0];
    const openedMap = cloneRaycastMap(RAYCAST_LEVEL_2.map);
    openRaycastDoor(openedMap, RAYCAST_LEVEL_2.doors[0]);

    expect(hasGridPath(RAYCAST_LEVEL_2.map, RAYCAST_LEVEL_2.playerStart, key)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_2.map, RAYCAST_LEVEL_2.playerStart, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL_2.playerStart, exit)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_2.map, RAYCAST_LEVEL_2.playerStart, RAYCAST_LEVEL_2.secrets[0])).toBe(true);
  });

  it('filters unsafe director spawns that are occupied or directly in front of the player', () => {
    const customLevel: RaycastLevel = {
      ...RAYCAST_LEVEL,
      director: {
        ...RAYCAST_LEVEL.director,
        spawnPoints: [
          { id: 'front-visible', zoneId: 'test', x: 4.5, y: 2.5, minPlayerDistance: 1.5 },
          { id: 'occupied-safe', zoneId: 'test', x: 1.5, y: 3.5, minPlayerDistance: 1.5 },
          { id: 'rear-safe', zoneId: 'test', x: 4.5, y: 4.5, minPlayerDistance: 1.5 }
        ]
      }
    };
    const openMap: RaycastMap = {
      tileSize: 1,
      grid: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
      ]
    };
    const spawns = getSafeDirectorSpawnPoints(customLevel, { x: 1.5, y: 2.5, angle: 0 }, 'test', {
      map: openMap,
      enemies: [{ x: 1.5, y: 3.5, radius: 0.38, alive: true }]
    });

    expect(spawns.some((spawn) => spawn.x === 4.5 && spawn.y === 2.5)).toBe(false);
    expect(spawns.some((spawn) => spawn.x === 1.5 && spawn.y === 3.5)).toBe(false);
    expect(spawns).toEqual([expect.objectContaining({ x: 4.5, y: 4.5 })]);
  });

  it('rejects visible close-range director spawns even when they are not dead ahead', () => {
    const customLevel: RaycastLevel = {
      ...RAYCAST_LEVEL,
      director: {
        ...RAYCAST_LEVEL.director,
        spawnPoints: [
          { id: 'visible-close', zoneId: 'test', x: 3.5, y: 1.5, minPlayerDistance: 1.5 },
          { id: 'hidden-far', zoneId: 'test', x: 5.5, y: 4.5, minPlayerDistance: 1.5 }
        ]
      }
    };
    const openMap: RaycastMap = {
      tileSize: 1,
      grid: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
      ]
    };

    const spawns = getSafeDirectorSpawnPoints(customLevel, { x: 1.5, y: 2.5, angle: Math.PI / 4 }, 'test', {
      map: openMap
    });

    expect(spawns.some((spawn) => spawn.x === 3.5 && spawn.y === 1.5)).toBe(false);
    expect(spawns).toEqual([expect.objectContaining({ x: 5.5, y: 4.5 })]);
  });

  it('registers secrets once without blocking progress', () => {
    const collectedSecrets = new Set<string>();
    const secret = RAYCAST_LEVEL_2.secrets[0];

    expect(registerRaycastSecret(collectedSecrets, secret)).toBe(true);
    expect(registerRaycastSecret(collectedSecrets, secret)).toBe(false);
    expect(collectedSecrets.has(secret.id)).toBe(true);
  });

  it('keeps readable progression and atmosphere messaging', () => {
    expect(RAYCAST_ATMOSPHERE.messages.key).toBe('ACCESS TOKEN CAPTURED');
    expect(RAYCAST_ATMOSPHERE.messages.locked).toBe('ACCESS DENIED');
    expect(RAYCAST_ATMOSPHERE.messages.doorOpen).toBe('GATEWAY DECRYPTED');
    expect(RAYCAST_ATMOSPHERE.messages.trigger).toBe('AMBUSH PROTOCOL RELEASED');
    expect(RAYCAST_ATMOSPHERE.messages.secret).toBe('HIDDEN NODE DISCOVERED');
    expect(RAYCAST_LEVEL.keys[0].pickupObjectiveText).toContain('return to gateway');
    expect(RAYCAST_LEVEL_2.keys[0].pickupObjectiveText).toContain('breach the furnace gate');
  });

  it('keeps the original level 1 director budget and a tighter level 2 pressure profile', () => {
    expect(RAYCAST_LEVEL.director.config.maxEnemiesAlive).toBe(4);
    expect(RAYCAST_LEVEL.director.config.maxTotalSpawns).toBe(9);
    expect(RAYCAST_LEVEL.director.config.highIntensityDurationMs).toBe(9000);

    expect(RAYCAST_LEVEL_2.director.config.maxEnemiesAlive).toBe(5);
    expect(RAYCAST_LEVEL_2.director.config.maxTotalSpawns).toBe(10);
    expect(RAYCAST_LEVEL_2.director.config.buildUpSpawnCooldownMs).toBeLessThan(RAYCAST_LEVEL_2.director.config.baseSpawnCooldownMs ?? 0);
  });
});

function hasGridPath(map: RaycastMap, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const start = gridKey(from);
  const target = gridKey(to);
  const queue = [start];
  const visited = new Set(queue);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === target) return true;
    const [x, y] = current.split(',').map(Number);
    [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ].forEach(([nextX, nextY]) => {
      const key = `${nextX},${nextY}`;
      if (visited.has(key)) return;
      if (map.grid[nextY]?.[nextX] !== RAYCAST_TILE.EMPTY) return;
      visited.add(key);
      queue.push(key);
    });
  }

  return false;
}

function gridKey(point: { x: number; y: number }): string {
  return `${Math.floor(point.x)},${Math.floor(point.y)}`;
}
