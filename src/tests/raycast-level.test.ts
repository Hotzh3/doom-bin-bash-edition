import { describe, expect, it } from 'vitest';
import { KeySystem } from '../game/systems/KeySystem';
import { DoorSystem } from '../game/systems/DoorSystem';
import { TriggerSystem } from '../game/systems/TriggerSystem';
import {
  RAYCAST_LEVEL,
  RAYCAST_LEVEL_2,
  RAYCAST_LEVEL_3,
  RAYCAST_LEVEL_4,
  RAYCAST_LEVEL_5,
  RAYCAST_LEVEL_BOSS,
  RAYCAST_LEVEL_CATALOG,
  RAYCAST_WORLD_TWO_CATALOG,
  RAYCAST_WORLD_THREE_CATALOG,
  cloneRaycastMap,
  findRaycastZoneId,
  getRaycastExitAccess,
  getRaycastLevelIndex,
  getSafeDirectorSpawnPoints,
  isRaycastSpawnPlacementValid,
  isNearPoint,
  openRaycastDoor,
  registerRaycastPickup,
  registerRaycastSecret,
  getRaycastDoorRequiredKeyIds,
  isRaycastPointReachable,
  type RaycastLevel,
  type RaycastTrigger
} from '../game/raycast/RaycastLevel';
import { RAYCAST_ATMOSPHERE } from '../game/raycast/RaycastAtmosphere';
import { RAYCAST_TILE, type RaycastMap } from '../game/raycast/RaycastMap';
import { getEnemyConfig } from '../game/entities/enemyConfig';

const ALL_RAYCAST_LEVELS = [
  ...RAYCAST_LEVEL_CATALOG,
  ...RAYCAST_WORLD_TWO_CATALOG,
  ...RAYCAST_WORLD_THREE_CATALOG
];

describe('raycast level catalog', () => {
  it('includes six episode maps (five sectors + boss) with unique ids and stable ordering', () => {
    expect(RAYCAST_LEVEL_CATALOG).toHaveLength(6);
    expect(new Set(RAYCAST_LEVEL_CATALOG.map((level) => level.id)).size).toBe(6);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL.id)).toBe(0);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL_2.id)).toBe(1);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL_3.id)).toBe(2);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL_4.id)).toBe(3);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL_5.id)).toBe(4);
    expect(getRaycastLevelIndex(RAYCAST_LEVEL_BOSS.id)).toBe(5);
  });

  it('keeps World 2 continuation sectors ordered and boss-gated where authored', () => {
    expect(RAYCAST_WORLD_TWO_CATALOG).toHaveLength(4);
    expect(new Set(RAYCAST_WORLD_TWO_CATALOG.map((level) => level.id)).size).toBe(4);
    RAYCAST_WORLD_TWO_CATALOG.forEach((level) => {
      expect(level.worldSegment).toBe('world2');
    });
    const pit = RAYCAST_WORLD_TWO_CATALOG.find((level) => level.id === 'bloom-warden-pit');
    expect(pit?.bossConfig?.behavior).toBe('bloom-warden');
    expect(pit?.progression.requireBossDefeated).toBe(true);
    expect(pit?.director.enabled).toBe(false);
    expect(
      RAYCAST_WORLD_TWO_CATALOG.some((level) =>
        [...level.initialSpawns, ...level.triggers.flatMap((trigger) => trigger.spawns)].some(
          (spawn) => spawn.kind === 'SCRAMBLER'
        )
      )
    ).toBe(true);
  });

  it('keeps World 3 Ember Meridian sectors ordered with Ash Judge finale', () => {
    expect(RAYCAST_WORLD_THREE_CATALOG).toHaveLength(3);
    expect(RAYCAST_WORLD_THREE_CATALOG.every((l) => l.worldSegment === 'world3')).toBe(true);
    const judge = RAYCAST_WORLD_THREE_CATALOG.find((l) => l.id === 'ash-judge-seal');
    expect(judge?.bossConfig?.behavior).toBe('ash-judge');
    expect(judge?.progression.requireBossDefeated).toBe(true);
  });

  it('defines required route objects and valid map references for each level', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      if (level.bossConfig) {
        expect(level.keys).toHaveLength(0);
        expect(level.doors).toHaveLength(0);
        expect(level.triggers).toHaveLength(0);
        expect(level.secrets).toHaveLength(0);
        expect(level.healthPickups.length).toBeGreaterThanOrEqual(1);
        expect(level.exits.length).toBeGreaterThanOrEqual(1);
        expect(level.initialSpawns).toHaveLength(0);
        expect(level.director.enabled).toBe(false);
        expect(level.progression.requireBossDefeated).toBe(true);
        expect(['Volt Archon', 'Bloom Warden']).toContain(level.bossConfig.displayName);
        return;
      }
      expect(level.keys).toHaveLength(1);
      expect(level.doors.length).toBeGreaterThanOrEqual(1);
      expect(level.triggers.length).toBeGreaterThanOrEqual(3);
      expect(level.healthPickups.length).toBeGreaterThanOrEqual(2);
      expect(level.secrets.length).toBeGreaterThanOrEqual(1);
      expect(level.exits.length).toBeGreaterThanOrEqual(1);
      expect(level.initialSpawns.length).toBeGreaterThanOrEqual(4);
      expect(level.director.enabled).toBe(true);
      expect(level.director.spawnPoints.length).toBeGreaterThan(0);
      expect(level.progression.requiredExitTriggerIds.length).toBeGreaterThanOrEqual(1);

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
        expect(level.keys.some((key) => key.id === door.keyId)).toBe(true);
      });
    });
  });

  it('keeps player starts, objectives, spawns, and director points on walkable cells for each level', () => {
    ALL_RAYCAST_LEVELS.forEach((level) => {
      const points = [
        level.playerStart,
        ...level.keys,
        ...level.healthPickups,
        ...level.secrets,
        ...level.exits,
        ...level.initialSpawns,
        ...level.triggers.flatMap((trigger) => trigger.spawns),
        ...level.director.spawnPoints,
        ...(level.bossConfig ? [{ x: level.bossConfig.x, y: level.bossConfig.y }] : [])
      ];

      points.forEach((point) => {
        const tile = level.map.grid[Math.floor(point.y)]?.[Math.floor(point.x)];
        expect(tile, `${level.id} @ (${point.x},${point.y})`).toBe(RAYCAST_TILE.EMPTY);
      });
    });
  });

  it('keeps every authored enemy spawn clear of walls and reachable once authored gates are open', () => {
    ALL_RAYCAST_LEVELS.forEach((level) => {
      const openDoorIds = level.doors.map((door) => door.id);
      const enemySpawns = [
        ...level.initialSpawns.map((spawn) => ({ ...spawn, source: 'initial' })),
        ...level.triggers.flatMap((trigger) =>
          trigger.spawns.map((spawn) => ({ ...spawn, source: `trigger:${trigger.id}` }))
        )
      ];

      enemySpawns.forEach((spawn) => {
        const radius = getEnemyConfig(spawn.kind, 'raycast').size / 100;
        const label = `${level.id} ${spawn.source} ${'id' in spawn ? spawn.id : spawn.kind} @ (${spawn.x},${spawn.y})`;
        expect(isRaycastSpawnPlacementValid(level.map, spawn, radius), label).toBe(true);
        expect(isRaycastPointReachable(level, spawn, { openDoorIds }), label).toBe(true);
      });

      level.director.spawnPoints.forEach((spawn) => {
        const label = `${level.id} director ${spawn.id} @ (${spawn.x},${spawn.y})`;
        expect(isRaycastSpawnPlacementValid(level.map, spawn), label).toBe(true);
        expect(isRaycastPointReachable(level, spawn, { openDoorIds }), label).toBe(true);
      });

      if (level.bossConfig) {
        const boss = level.bossConfig;
        const label = `${level.id} boss ${boss.id} @ (${boss.x},${boss.y})`;
        expect(isRaycastSpawnPlacementValid(level.map, boss, boss.hitRadius), label).toBe(true);
        expect(isRaycastPointReachable(level, boss, { openDoorIds }), label).toBe(true);
      }
    });
  });

  it('keeps initial spawns fair relative to each level start', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      level.initialSpawns.forEach((spawn) => {
        expect(Math.hypot(spawn.x - level.playerStart.x, spawn.y - level.playerStart.y)).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it('authors dual exits on the Episode 1 hub when a shortcut / decoy grammar is used', () => {
    expect(RAYCAST_LEVEL.id).toBe('access-node');
    expect(RAYCAST_LEVEL.exits.map((e) => e.billboardLabel)).toEqual(expect.arrayContaining(['EXIT', 'EXIT?']));
  });

  it('authors distinct late-episode encounter mixes for the spiral climb and finale lockdown', () => {
    const level4SpiralBreak = RAYCAST_LEVEL_4.triggers.find((trigger) => trigger.id === 'spiral-break');
    const level4CrownCrossfire = RAYCAST_LEVEL_4.triggers.find((trigger) => trigger.id === 'crown-crossfire');
    const level5HeartBreach = RAYCAST_LEVEL_5.triggers.find((trigger) => trigger.id === 'heart-breach');
    const level5BossLockdown = RAYCAST_LEVEL_5.triggers.find((trigger) => trigger.id === 'boss-lockdown');

    expect(RAYCAST_LEVEL_4.initialSpawns.filter((spawn) => spawn.kind === 'RANGED')).toHaveLength(2);
    expect(RAYCAST_LEVEL_4.initialSpawns.filter((spawn) => spawn.kind === 'BRUTE')).toHaveLength(1);
    expect(level4SpiralBreak?.spawns.filter((spawn) => spawn.kind === 'RANGED')).toHaveLength(1);
    expect(level4CrownCrossfire?.spawns.filter((spawn) => spawn.kind === 'STALKER')).toHaveLength(1);

    expect(RAYCAST_LEVEL_5.initialSpawns.filter((spawn) => spawn.kind === 'BRUTE')).toHaveLength(2);
    expect(RAYCAST_LEVEL_5.initialSpawns.filter((spawn) => spawn.kind === 'RANGED')).toHaveLength(2);
    expect(level5HeartBreach?.spawns.map((spawn) => spawn.kind)).toEqual(['RANGED', 'BRUTE', 'GRUNT']);
    expect(level5BossLockdown?.spawns.filter((spawn) => spawn.kind === 'BRUTE')).toHaveLength(2);
  });

  it('keeps authored health pickups reachable without blocking progression', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      level.healthPickups.forEach((pickup) => {
        expect(pickup.restoreAmount).toBeGreaterThan(0);
        expect(pickup.restoreAmount).toBeLessThanOrEqual(35);
        expect(
          isRaycastPointReachable(level, pickup, {
            openDoorIds: pickup.requiredOpenDoorIds ?? []
          })
        ).toBe(true);
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
    const level3Blocked = getRaycastExitAccess(RAYCAST_LEVEL_3, {
      collectedKeyIds: [],
      openDoorIds: [],
      activatedTriggerIds: [],
      livingEnemyCount: 0
    });
    const level4Blocked = getRaycastExitAccess(RAYCAST_LEVEL_4, {
      collectedKeyIds: [],
      openDoorIds: [],
      activatedTriggerIds: [],
      livingEnemyCount: 0
    });
    const level5Blocked = getRaycastExitAccess(RAYCAST_LEVEL_5, {
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
    expect(level3Blocked).toEqual({
      allowed: false,
      reason: 'TOKEN_REQUIRED',
      message: 'TOKEN REQUIRED',
      missingKeyIds: ['amber-core']
    });
    expect(level4Blocked).toEqual({
      allowed: false,
      reason: 'TOKEN_REQUIRED',
      message: 'TOKEN REQUIRED',
      missingKeyIds: ['prism-shard']
    });
    expect(level5Blocked).toEqual({
      allowed: false,
      reason: 'TOKEN_REQUIRED',
      message: 'TOKEN REQUIRED',
      missingKeyIds: ['heart-sigil']
    });
  });

  it('allows level exits after progression requirements are met', () => {
    expect(
      getRaycastExitAccess(RAYCAST_LEVEL, {
        collectedKeyIds: ['rust-key'],
        openDoorIds: ['rust-gate', 'service-shutter'],
        activatedTriggerIds: ['gate-ambush', 'lateral-pressure', 'east-overlook'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_2, {
        collectedKeyIds: ['glass-sigil'],
        openDoorIds: ['cistern-gate'],
        activatedTriggerIds: ['furnace-ambush', 'exit-lockdown'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_3, {
        collectedKeyIds: ['amber-core'],
        openDoorIds: ['relay-seal'],
        activatedTriggerIds: ['conduit-surge', 'relay-lockdown'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_4, {
        collectedKeyIds: ['prism-shard'],
        openDoorIds: ['vault-seal'],
        activatedTriggerIds: ['spiral-break', 'crown-crossfire'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_5, {
        collectedKeyIds: ['heart-sigil'],
        openDoorIds: ['heart-seal-door'],
        activatedTriggerIds: ['heart-breach', 'boss-lockdown'],
        livingEnemyCount: 0
      }).allowed
    ).toBe(true);

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_BOSS, {
        collectedKeyIds: [],
        openDoorIds: [],
        activatedTriggerIds: [],
        livingEnemyCount: 0,
        bossDefeated: false
      })
    ).toEqual({
      allowed: false,
      reason: 'SIGNAL_LOCKED',
      message: RAYCAST_LEVEL_BOSS.progression.blockedExitMessage
    });

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_BOSS, {
        collectedKeyIds: [],
        openDoorIds: [],
        activatedTriggerIds: [],
        livingEnemyCount: 0,
        bossDefeated: true
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
      missingDoorIds: ['rust-gate', 'service-shutter']
    });

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL, {
        collectedKeyIds: ['rust-key'],
        openDoorIds: ['rust-gate', 'service-shutter'],
        activatedTriggerIds: ['gate-ambush'],
        livingEnemyCount: 0
      })
    ).toEqual({
      allowed: false,
      reason: 'TRIGGER_REQUIRED',
      message: 'TRIGGER REQUIRED',
      missingTriggerIds: ['lateral-pressure', 'east-overlook']
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
        openDoorIds: ['rust-gate', 'service-shutter'],
        activatedTriggerIds: ['gate-ambush', 'lateral-pressure', 'east-overlook'],
        livingEnemyCount: 2
      })
    ).toEqual({
      allowed: false,
      reason: 'SIGNAL_LOCKED',
      message: 'SIGNAL LOCKED'
    });

    expect(
      getRaycastExitAccess(RAYCAST_LEVEL_5, {
        collectedKeyIds: ['heart-sigil'],
        openDoorIds: ['heart-seal-door'],
        activatedTriggerIds: ['heart-breach', 'boss-lockdown'],
        livingEnemyCount: 1
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

  it('consumes health pickups only once in the shared pickup registry', () => {
    const collected = new Set<string>();
    const pickup = RAYCAST_LEVEL.healthPickups[0];

    expect(registerRaycastPickup(collected, pickup)).toBe(true);
    expect(registerRaycastPickup(collected, pickup)).toBe(false);
    expect(collected.has(pickup.id)).toBe(true);
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
    expect(findRaycastZoneId(RAYCAST_LEVEL_3, RAYCAST_LEVEL_3.playerStart.x, RAYCAST_LEVEL_3.playerStart.y)).toBe('start');
    expect(findRaycastZoneId(RAYCAST_LEVEL_4, RAYCAST_LEVEL_4.playerStart.x, RAYCAST_LEVEL_4.playerStart.y)).toBe('start');
    expect(findRaycastZoneId(RAYCAST_LEVEL_5, RAYCAST_LEVEL_5.playerStart.x, RAYCAST_LEVEL_5.playerStart.y)).toBe('start');

    const level1Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL, RAYCAST_LEVEL.playerStart, 'start');
    const level2Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL_2, RAYCAST_LEVEL_2.playerStart, 'start');
    const level3Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL_3, RAYCAST_LEVEL_3.playerStart, 'start');
    const level4Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL_4, RAYCAST_LEVEL_4.playerStart, 'start');
    const level5Spawns = getSafeDirectorSpawnPoints(RAYCAST_LEVEL_5, RAYCAST_LEVEL_5.playerStart, 'start');

    expect(level1Spawns.length).toBeGreaterThan(0);
    expect(level2Spawns.length).toBeGreaterThan(0);
    expect(level3Spawns.length).toBeGreaterThan(0);
    expect(level4Spawns.length).toBeGreaterThan(0);
    expect(level5Spawns.length).toBeGreaterThan(0);
  });

  it('keeps level 1 critical route and arena behind the gate', () => {
    const key = RAYCAST_LEVEL.keys[0];
    const exit = RAYCAST_LEVEL.exits[0];
    const arena = { x: 14.5, y: 9.5 };
    const openedMap = cloneRaycastMap(RAYCAST_LEVEL.map);
    RAYCAST_LEVEL.doors.forEach((door) => openRaycastDoor(openedMap, door));

    expect(hasGridPath(RAYCAST_LEVEL.map, RAYCAST_LEVEL.playerStart, key)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL.map, RAYCAST_LEVEL.playerStart, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL.playerStart, arena)).toBe(true);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL.playerStart, exit)).toBe(true);
  });

  it('expands episode 1 footprint without breaking spawn anchors', () => {
    expect(RAYCAST_LEVEL.map.grid[0].length).toBeGreaterThanOrEqual(26);
    expect(RAYCAST_LEVEL.map.grid.length).toBeGreaterThanOrEqual(16);
    expect(RAYCAST_LEVEL.doors.map((d) => d.id)).toEqual(['rust-gate', 'service-shutter']);
    expect(RAYCAST_LEVEL.triggers.some((t) => t.id === 'east-overlook')).toBe(true);
    expect(RAYCAST_LEVEL.secrets.some((s) => s.id === 'shard-overlook')).toBe(true);
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

  it('keeps level 3 key reachable early and exit locked behind the relay seal', () => {
    const key = RAYCAST_LEVEL_3.keys[0];
    const exit = RAYCAST_LEVEL_3.exits[0];
    const openedMap = cloneRaycastMap(RAYCAST_LEVEL_3.map);
    openRaycastDoor(openedMap, RAYCAST_LEVEL_3.doors[0]);

    expect(hasGridPath(RAYCAST_LEVEL_3.map, RAYCAST_LEVEL_3.playerStart, key)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_3.map, RAYCAST_LEVEL_3.playerStart, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL_3.playerStart, exit)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_3.map, RAYCAST_LEVEL_3.playerStart, RAYCAST_LEVEL_3.secrets[0])).toBe(true);
  });

  it('keeps level 4 key reachable early and exit locked behind the vault seal', () => {
    const key = RAYCAST_LEVEL_4.keys[0];
    const exit = RAYCAST_LEVEL_4.exits[0];
    const openedMap = cloneRaycastMap(RAYCAST_LEVEL_4.map);
    openRaycastDoor(openedMap, RAYCAST_LEVEL_4.doors[0]);

    expect(hasGridPath(RAYCAST_LEVEL_4.map, RAYCAST_LEVEL_4.playerStart, key)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_4.map, RAYCAST_LEVEL_4.playerStart, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL_4.playerStart, exit)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_4.map, RAYCAST_LEVEL_4.playerStart, RAYCAST_LEVEL_4.secrets[0])).toBe(true);
  });

  it('keeps level 5 key reachable early and exit locked behind the heart seal', () => {
    const key = RAYCAST_LEVEL_5.keys[0];
    const exit = RAYCAST_LEVEL_5.exits[0];
    const openedMap = cloneRaycastMap(RAYCAST_LEVEL_5.map);
    openRaycastDoor(openedMap, RAYCAST_LEVEL_5.doors[0]);

    expect(hasGridPath(RAYCAST_LEVEL_5.map, RAYCAST_LEVEL_5.playerStart, key)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_5.map, RAYCAST_LEVEL_5.playerStart, exit)).toBe(false);
    expect(hasGridPath(openedMap, RAYCAST_LEVEL_5.playerStart, exit)).toBe(true);
    expect(hasGridPath(RAYCAST_LEVEL_5.map, RAYCAST_LEVEL_5.playerStart, RAYCAST_LEVEL_5.secrets[0])).toBe(true);
  });

  it('validates catalog progression metadata for exits, keys, doors, triggers, and secrets', () => {
    RAYCAST_LEVEL_CATALOG.forEach((level) => {
      const openedMap = cloneRaycastMap(level.map);
      level.doors.forEach((door) => openRaycastDoor(openedMap, door));

      level.exits.forEach((exit) => {
        expect(hasGridPath(openedMap, level.playerStart, exit)).toBe(true);
      });

      level.progression.requiredExitKeyIds.forEach((keyId) => {
        const key = level.keys.find((candidate) => candidate.id === keyId);
        expect(key).toBeDefined();
        expect(hasGridPath(level.map, level.playerStart, key!)).toBe(true);
      });

      level.progression.requiredExitDoorIds.forEach((doorId) => {
        const door = level.doors.find((candidate) => candidate.id === doorId);
        expect(door).toBeDefined();
        const keyIds = getRaycastDoorRequiredKeyIds(door!);
        expect(keyIds.some((keyId) => level.keys.some((key) => key.id === keyId))).toBe(true);
        expect(hasGridPath(openedMap, level.playerStart, door!)).toBe(true);
      });

      level.progression.requiredExitTriggerIds.forEach((triggerId) => {
        const trigger = level.triggers.find((candidate) => candidate.id === triggerId);
        expect(trigger).toBeDefined();
        expect(hasGridPathToTrigger(openedMap, level.playerStart, trigger!)).toBe(true);
      });

      level.secrets.forEach((secret) => {
        expect(level.progression.requiredExitKeyIds).not.toContain(secret.id);
        expect(level.progression.requiredExitDoorIds).not.toContain(secret.id);
        expect(level.progression.requiredExitTriggerIds).not.toContain(secret.id);
        expect(hasGridPath(openedMap, level.playerStart, secret)).toBe(true);
      });
    });
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
    expect(RAYCAST_LEVEL_3.keys[0].pickupObjectiveText).toContain('break the relay seal');
    expect(RAYCAST_LEVEL_4.keys[0].pickupObjectiveText).toContain('crimson gate');
    expect(RAYCAST_LEVEL_5.keys[0].pickupObjectiveText.toLowerCase()).toContain('black gate');
  });

  it('keeps escalating director pressure across the episode', () => {
    expect(RAYCAST_LEVEL.director.config.maxEnemiesAlive).toBe(5);
    expect(RAYCAST_LEVEL.director.config.maxTotalSpawns).toBe(10);
    expect(RAYCAST_LEVEL.director.config.highIntensityDurationMs).toBe(9200);

    expect(RAYCAST_LEVEL_2.director.config.maxEnemiesAlive).toBe(5);
    expect(RAYCAST_LEVEL_2.director.config.maxTotalSpawns).toBe(10);
    expect(RAYCAST_LEVEL_2.director.config.buildUpSpawnCooldownMs).toBeLessThan(RAYCAST_LEVEL_2.director.config.baseSpawnCooldownMs ?? 0);

    expect(RAYCAST_LEVEL_3.director.config.maxEnemiesAlive).toBe(5);
    expect(RAYCAST_LEVEL_3.director.config.maxTotalSpawns).toBe(11);
    expect(RAYCAST_LEVEL_3.director.config.buildUpSpawnCooldownMs).toBeLessThan(RAYCAST_LEVEL_3.director.config.baseSpawnCooldownMs ?? 0);

    expect(RAYCAST_LEVEL_4.director.config.maxEnemiesAlive).toBe(6);
    expect(RAYCAST_LEVEL_4.director.config.maxTotalSpawns).toBe(12);
    expect(RAYCAST_LEVEL_4.director.config.buildUpSpawnCooldownMs).toBeLessThan(RAYCAST_LEVEL_4.director.config.baseSpawnCooldownMs ?? 0);

    expect(RAYCAST_LEVEL_5.director.config.maxEnemiesAlive).toBe(6);
    expect(RAYCAST_LEVEL_5.director.config.maxTotalSpawns).toBe(14);
    expect(RAYCAST_LEVEL_5.progression.requireCombatClear).toBe(true);
    expect(RAYCAST_LEVEL_5.director.config.buildUpSpawnCooldownMs).toBeLessThan(RAYCAST_LEVEL_5.director.config.baseSpawnCooldownMs ?? 0);
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

function hasGridPathToTrigger(map: RaycastMap, from: { x: number; y: number }, trigger: RaycastTrigger): boolean {
  const halfWidth = trigger.width * 0.5;
  const halfHeight = trigger.height * 0.5;
  const minX = Math.floor(trigger.x - halfWidth);
  const maxX = Math.floor(trigger.x + halfWidth);
  const minY = Math.floor(trigger.y - halfHeight);
  const maxY = Math.floor(trigger.y + halfHeight);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (map.grid[y]?.[x] !== RAYCAST_TILE.EMPTY) continue;
      if (hasGridPath(map, from, { x: x + 0.5, y: y + 0.5 })) return true;
    }
  }

  return false;
}

function gridKey(point: { x: number; y: number }): string {
  return `${Math.floor(point.x)},${Math.floor(point.y)}`;
}
