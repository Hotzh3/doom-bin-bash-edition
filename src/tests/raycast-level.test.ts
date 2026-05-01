import { describe, expect, it } from 'vitest';
import { KeySystem } from '../game/systems/KeySystem';
import { DoorSystem } from '../game/systems/DoorSystem';
import { TriggerSystem } from '../game/systems/TriggerSystem';
import {
  RAYCAST_LEVEL,
  cloneRaycastMap,
  findRaycastZoneId,
  getRaycastExitAccess,
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor,
  registerRaycastSecret
} from '../game/raycast/RaycastLevel';
import { RAYCAST_ATMOSPHERE } from '../game/raycast/RaycastAtmosphere';
import { RAYCAST_MAP, RAYCAST_PLAYER_START, RAYCAST_TILE, isWallAt } from '../game/raycast/RaycastMap';

describe('raycast level', () => {
  it('defines a complete FPS level route', () => {
    expect(RAYCAST_LEVEL.keys).toHaveLength(1);
    expect(RAYCAST_LEVEL.doors).toHaveLength(1);
    expect(RAYCAST_LEVEL.triggers.length).toBeGreaterThanOrEqual(3);
    expect(RAYCAST_LEVEL.secrets).toHaveLength(1);
    expect(RAYCAST_LEVEL.exits).toHaveLength(1);
    expect(RAYCAST_LEVEL.initialSpawns.length).toBeGreaterThanOrEqual(4);
    expect(RAYCAST_LEVEL.director.enabled).toBe(true);
    expect(RAYCAST_LEVEL.director.spawnPoints.length).toBeGreaterThan(0);
  });

  it('links every key to a valid locked door tile inside the map', () => {
    RAYCAST_LEVEL.keys.forEach((key) => {
      const door = RAYCAST_LEVEL.doors.find((candidate) => candidate.id === key.unlocksDoorId);

      expect(door).toBeDefined();
      expect(door?.keyId).toBe(key.id);
      expect(RAYCAST_MAP.grid[door!.tileY]?.[door!.tileX]).toBe(RAYCAST_TILE.LOCKED_DOOR);
    });
  });

  it('places every door tile inside the map bounds', () => {
    RAYCAST_LEVEL.doors.forEach((door) => {
      expect(door.tileY).toBeGreaterThanOrEqual(0);
      expect(door.tileY).toBeLessThan(RAYCAST_MAP.grid.length);
      expect(door.tileX).toBeGreaterThanOrEqual(0);
      expect(door.tileX).toBeLessThan(RAYCAST_MAP.grid[door.tileY].length);
      expect(RAYCAST_MAP.grid[door.tileY][door.tileX]).toBe(RAYCAST_TILE.LOCKED_DOOR);
    });
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
    expect(keys.collect(key)).toBe(false);
    expect(keys.hasKey(key.id)).toBe(true);
    expect(doors.attemptOpen(door, 0).reason).toBe('OPENED');
    expect(doors.isOpen(door.id)).toBe(true);
    expect(doors.attemptOpen(door, 0).reason).toBe('ALREADY_OPEN');
  });

  it('detects pickups and exit by radius', () => {
    const key = RAYCAST_LEVEL.keys[0];
    const exit = RAYCAST_LEVEL.exits[0];

    expect(isNearPoint(key.x, key.y, key)).toBe(true);
    expect(isNearPoint(exit.x + exit.radius + 1, exit.y, exit)).toBe(false);
  });

  it('finds the current FPS zone and safe director spawns', () => {
    expect(findRaycastZoneId(RAYCAST_LEVEL, RAYCAST_PLAYER_START.x, RAYCAST_PLAYER_START.y)).toBe('start');

    const spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL, RAYCAST_PLAYER_START, 'start');

    expect(spawns.length).toBeGreaterThan(0);
    expect(spawns.every((spawn) => Math.hypot(spawn.x - RAYCAST_PLAYER_START.x, spawn.y - RAYCAST_PLAYER_START.y) >= 1.6)).toBe(true);
  });

  it('blocks the exit until the token, gate, and main ambush are complete enough', () => {
    const blocked = getRaycastExitAccess(RAYCAST_LEVEL, {
      collectedKeyIds: [],
      openDoorIds: [],
      activatedTriggerIds: []
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.message).toBe('ACCESS DENIED: NODE INCOMPLETE');
  });

  it('allows the exit after the token, gate, and main ambush requirements are met', () => {
    const allowed = getRaycastExitAccess(RAYCAST_LEVEL, {
      collectedKeyIds: ['rust-key'],
      openDoorIds: ['rust-gate'],
      activatedTriggerIds: ['gate-ambush']
    });

    expect(allowed.allowed).toBe(true);
  });

  it('places start, key, secret, spawns, and exit on walkable tiles', () => {
    const points = [
      RAYCAST_PLAYER_START,
      ...RAYCAST_LEVEL.keys,
      ...RAYCAST_LEVEL.secrets,
      ...RAYCAST_LEVEL.exits,
      ...RAYCAST_LEVEL.initialSpawns,
      ...RAYCAST_LEVEL.triggers.flatMap((trigger) => trigger.spawns),
      ...RAYCAST_LEVEL.director.spawnPoints
    ];

    points.forEach((point) => {
      expect(isWallAt(RAYCAST_MAP, point.x, point.y)).toBe(false);
    });
  });

  it('places trigger spawns and director spawn points on empty cells', () => {
    const triggerSpawns = RAYCAST_LEVEL.triggers.flatMap((trigger) => trigger.spawns);
    const directorSpawns = RAYCAST_LEVEL.director.spawnPoints;

    [...triggerSpawns, ...directorSpawns].forEach((point) => {
      expect(RAYCAST_MAP.grid[Math.floor(point.y)]?.[Math.floor(point.x)]).toBe(RAYCAST_TILE.EMPTY);
      expect(isWallAt(RAYCAST_MAP, point.x, point.y)).toBe(false);
    });
  });

  it('keeps key and door reachable before opening, then arena and exit reachable after opening', () => {
    const key = RAYCAST_LEVEL.keys[0];
    const exit = RAYCAST_LEVEL.exits[0];
    const doorApproach = { x: 7.5, y: 7.5 };
    const arena = { x: 14.5, y: 9.5 };
    const openedMap = cloneRaycastMap(RAYCAST_MAP);
    openRaycastDoor(openedMap, RAYCAST_LEVEL.doors[0]);

    expect(hasGridPath(RAYCAST_MAP, RAYCAST_PLAYER_START, key)).toBe(true);
    expect(hasGridPath(RAYCAST_MAP, RAYCAST_PLAYER_START, doorApproach)).toBe(true);
    expect(hasGridPath(RAYCAST_MAP, RAYCAST_PLAYER_START, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_PLAYER_START, arena)).toBe(true);
    expect(hasGridPath(openedMap, RAYCAST_PLAYER_START, exit)).toBe(true);
  });

  it('keeps a readable loopback or secondary route after the arena opens', () => {
    const openedMap = cloneRaycastMap(RAYCAST_MAP);
    openRaycastDoor(openedMap, RAYCAST_LEVEL.doors[0]);

    expect(hasGridPath(openedMap, { x: 10.5, y: 7.5 }, RAYCAST_LEVEL.exits[0])).toBe(true);
    expect(hasGridPath(openedMap, { x: 14.5, y: 11.5 }, RAYCAST_LEVEL.exits[0])).toBe(true);
  });

  it('keeps the secret optional and away from the critical path', () => {
    const secret = RAYCAST_LEVEL.secrets[0];
    const door = RAYCAST_LEVEL.doors[0];
    const exit = RAYCAST_LEVEL.exits[0];

    expect(hasGridPath(RAYCAST_MAP, RAYCAST_PLAYER_START, secret)).toBe(true);
    expect(gridKey(secret)).not.toBe(gridKey(door));
    expect(gridKey(secret)).not.toBe(gridKey(exit));
  });

  it('keeps initial spawns away from the player start', () => {
    RAYCAST_LEVEL.initialSpawns.forEach((spawn) => {
      expect(Math.hypot(spawn.x - RAYCAST_PLAYER_START.x, spawn.y - RAYCAST_PLAYER_START.y)).toBeGreaterThanOrEqual(2);
    });
  });

  it('activates the raycast ambush trigger once', () => {
    const triggers = new TriggerSystem();
    const trigger = RAYCAST_LEVEL.triggers[0];

    expect(triggers.activateIfEntered(trigger, [{ x: 0, y: 0 }])).toBe(false);
    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => true })).toBe(true);
    expect(triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], { isDoorOpen: () => true })).toBe(false);
    expect(triggers.hasActivated(trigger.id)).toBe(true);
  });

  it('does not activate a door-bound trigger until its door is open', () => {
    const triggers = new TriggerSystem();
    const trigger = RAYCAST_LEVEL.triggers[0];

    expect(
      triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], {
        isDoorOpen: () => false
      })
    ).toBe(false);
    expect(
      triggers.activateIfEntered(trigger, [{ x: trigger.x, y: trigger.y }], {
        isDoorOpen: (doorId) => doorId === trigger.doorId
      })
    ).toBe(true);
  });

  it('keeps doorless triggers working normally', () => {
    const triggers = new TriggerSystem();

    expect(
      triggers.activateIfEntered(
        {
          id: 'free-trigger',
          x: 2,
          y: 2,
          width: 1,
          height: 1,
          once: true,
          objectiveText: 'Free trigger',
          spawns: []
        },
        [{ x: 2, y: 2 }]
      )
    ).toBe(true);
  });

  it('filters unsafe director spawns that are occupied or directly in front of the player', () => {
    const customLevel = {
      ...RAYCAST_LEVEL,
      director: {
        ...RAYCAST_LEVEL.director,
        spawnPoints: [
          { id: 'front-visible', zoneId: 'test', x: 4.5, y: 2.5, minPlayerDistance: 1.5 },
          { id: 'occupied-safe', zoneId: 'test', x: 1.5, y: 3.5, minPlayerDistance: 1.5 },
          { id: 'rear-safe', zoneId: 'test', x: 1.5, y: 4.5, minPlayerDistance: 1.5 }
        ]
      }
    };
    const openMap = {
      tileSize: 64,
      grid: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
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
    expect(spawns).toEqual([expect.objectContaining({ x: 1.5, y: 4.5 })]);
  });

  it('registers raycast secrets once without blocking progress', () => {
    const collectedSecrets = new Set<string>();
    const secret = RAYCAST_LEVEL.secrets[0];

    expect(registerRaycastSecret(collectedSecrets, secret)).toBe(true);
    expect(registerRaycastSecret(collectedSecrets, secret)).toBe(false);
    expect(collectedSecrets.has(secret.id)).toBe(true);
    expect(hasGridPath(RAYCAST_MAP, RAYCAST_PLAYER_START, RAYCAST_LEVEL.keys[0])).toBe(true);
  });

  it('uses readable terminal corruption progression messages', () => {
    const key = RAYCAST_LEVEL.keys[0];
    const door = RAYCAST_LEVEL.doors[0];
    const trigger = RAYCAST_LEVEL.triggers[0];
    const secret = RAYCAST_LEVEL.secrets[0];

    expect(RAYCAST_ATMOSPHERE.messages.key).toBe('ACCESS TOKEN CAPTURED');
    expect(RAYCAST_ATMOSPHERE.messages.locked).toBe('ACCESS DENIED');
    expect(RAYCAST_ATMOSPHERE.messages.doorOpen).toBe('GATEWAY DECRYPTED');
    expect(RAYCAST_ATMOSPHERE.messages.trigger).toBe('AMBUSH PROTOCOL RELEASED');
    expect(RAYCAST_ATMOSPHERE.messages.secret).toBe('HIDDEN NODE DISCOVERED');
    expect(key.pickupObjectiveText).toContain('return to gateway');
    expect(door.lockedObjectiveText).toContain('access token required');
    expect(trigger.activationText).toContain('Corruption spike');
    expect(secret.objectiveText).toContain('Hidden node');
  });

  it('uses a constrained FPS director budget for combat rhythm', () => {
    expect(RAYCAST_LEVEL.director.config.maxEnemiesAlive).toBe(4);
    expect(RAYCAST_LEVEL.director.config.maxTotalSpawns).toBe(9);
    expect(RAYCAST_LEVEL.director.config.openingSpawnCount).toBe(0);
    expect(RAYCAST_LEVEL.director.config.buildUpSpawnCooldownMs).toBeLessThan(RAYCAST_LEVEL.director.config.baseSpawnCooldownMs ?? 0);
    expect(RAYCAST_LEVEL.director.config.ambushSpawnCooldownMs).toBeGreaterThanOrEqual(2000);
    expect(RAYCAST_LEVEL.director.config.highIntensityDurationMs).toBe(9000);
    expect(RAYCAST_LEVEL.director.config.idlePressureMs).toBeLessThanOrEqual(2000);
    expect(RAYCAST_LEVEL.director.config.lowHealthThreshold).toBe(35);
    expect(RAYCAST_LEVEL.director.config.comfortableHealthThreshold).toBe(65);
  });
});

function hasGridPath(map: typeof RAYCAST_MAP, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
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
