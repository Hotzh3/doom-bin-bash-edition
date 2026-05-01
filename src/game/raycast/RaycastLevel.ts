import { isPointInsideRect, type KeyPickup, type LevelTrigger, type LockedDoor, type RectArea, type SecretPickup } from '../level/arenaLayout';
import type { DirectorConfig } from '../systems/DirectorConfig';
import type { SpawnPoint } from '../systems/GameDirector';
import type { EnemyKind } from '../types/game';
import { RAYCAST_TILE, type RaycastMap } from './RaycastMap';

export interface RaycastEnemySpawn {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
}

export interface RaycastDoor extends LockedDoor {
  tileX: number;
  tileY: number;
}

export interface RaycastExit {
  id: string;
  x: number;
  y: number;
  radius: number;
  objectiveText: string;
}

export interface RaycastDirectorSpawnPoint extends SpawnPoint {
  id: string;
  zoneId: string;
  minPlayerDistance: number;
}

export interface RaycastLevel {
  name: string;
  zones: RectArea[];
  keys: KeyPickup[];
  doors: RaycastDoor[];
  triggers: LevelTrigger[];
  secrets: SecretPickup[];
  exits: RaycastExit[];
  initialSpawns: RaycastEnemySpawn[];
  director: {
    enabled: boolean;
    config: Partial<DirectorConfig>;
    spawnPoints: RaycastDirectorSpawnPoint[];
  };
}

export const RAYCAST_LEVEL: RaycastLevel = {
  name: 'Foundry Gate FPS',
  zones: [
    { id: 'start', x: 2.7, y: 9.6, width: 3.4, height: 3.2 },
    { id: 'key-room', x: 2.6, y: 7.4, width: 3.2, height: 2.4 },
    { id: 'spine', x: 5.4, y: 5.2, width: 2.6, height: 7.2 },
    { id: 'north-hall', x: 8.5, y: 2.4, width: 5.0, height: 3.0 },
    { id: 'gate-hall', x: 8.5, y: 10.1, width: 5.0, height: 2.0 }
  ],
  keys: [
    {
      id: 'rust-key',
      label: 'Rust Key',
      x: 2.45,
      y: 8.45,
      radius: 0.28,
      unlocksDoorId: 'rust-gate'
    }
  ],
  doors: [
    {
      id: 'rust-gate',
      tileX: 5,
      tileY: 10,
      x: 5.5,
      y: 10.5,
      width: 1,
      height: 1,
      keyId: 'rust-key',
      killsRequired: 0,
      openObjectiveText: 'Rust gate open: push through and survive the ambush',
      lockedObjectiveText: 'Rust gate locked: find the key in the west room'
    }
  ],
  triggers: [
    {
      id: 'gate-ambush',
      x: 6.65,
      y: 10.5,
      width: 1.4,
      height: 1.1,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Ambush triggered: clear the gate hall',
      spawns: [
        { x: 7.45, y: 10.45, kind: 'STALKER' },
        { x: 8.45, y: 9.45, kind: 'GRUNT' },
        { x: 10.45, y: 10.45, kind: 'RANGED' }
      ]
    }
  ],
  secrets: [
    {
      id: 'west-cache',
      label: 'Hidden Cache',
      x: 1.45,
      y: 10.45,
      radius: 0.24,
      objectiveText: 'Secret found: cache restored 25 HP'
    }
  ],
  exits: [
    {
      id: 'foundry-exit',
      x: 8.45,
      y: 10.45,
      radius: 0.35,
      objectiveText: 'Level complete: Foundry Gate cleared'
    }
  ],
  initialSpawns: [
    { id: 'entry-grunt', kind: 'GRUNT', x: 4.45, y: 9.45 },
    { id: 'key-guard', kind: 'STALKER', x: 2.45, y: 7.45 },
    { id: 'hall-brute', kind: 'BRUTE', x: 6.55, y: 5.45 },
    { id: 'north-ranged', kind: 'RANGED', x: 8.6, y: 1.55 }
  ],
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 5,
      maxTotalSpawns: 10,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 5200,
      buildUpSpawnCooldownMs: 4200,
      ambushSpawnCooldownMs: 1800,
      highIntensitySpawnCooldownMs: 3200,
      recoveryDurationMs: 6000,
      ambushDurationMs: 7000,
      buildUpAfterMs: 6500,
      idlePressureMs: 1800,
      dominanceNoDamageMs: 8500,
      lowHealthThreshold: 30,
      debugEnabled: true
    },
    spawnPoints: [
      { id: 'start-pressure', zoneId: 'start', x: 4.45, y: 9.45, minPlayerDistance: 1.6 },
      { id: 'key-room-rear', zoneId: 'key-room', x: 1.45, y: 7.45, minPlayerDistance: 1.4 },
      { id: 'spine-corner', zoneId: 'spine', x: 6.55, y: 5.45, minPlayerDistance: 1.8 },
      { id: 'north-hall-ranged', zoneId: 'north-hall', x: 8.6, y: 1.55, minPlayerDistance: 2.0 },
      { id: 'gate-left', zoneId: 'gate-hall', x: 7.45, y: 10.45, minPlayerDistance: 1.7 },
      { id: 'gate-right', zoneId: 'gate-hall', x: 10.45, y: 10.45, minPlayerDistance: 2.0 }
    ]
  }
};

export function cloneRaycastMap(map: RaycastMap): RaycastMap {
  return {
    tileSize: map.tileSize,
    grid: map.grid.map((row) => [...row])
  };
}

export function openRaycastDoor(map: RaycastMap, door: RaycastDoor): void {
  map.grid[door.tileY][door.tileX] = RAYCAST_TILE.EMPTY;
}

export function isNearPoint(x: number, y: number, point: { x: number; y: number; radius: number }): boolean {
  return Math.hypot(point.x - x, point.y - y) <= point.radius;
}

export function findRaycastZoneId(level: RaycastLevel, x: number, y: number): string | null {
  return level.zones.find((zone) => isPointInsideRect({ x, y }, zone))?.id ?? null;
}

export function getSafeDirectorSpawnPoints(
  level: RaycastLevel,
  player: { x: number; y: number },
  activeZoneId: string | null
): SpawnPoint[] {
  const zoneMatches = level.director.spawnPoints.filter((point) => !activeZoneId || point.zoneId === activeZoneId);
  const candidates = zoneMatches.length > 0 ? zoneMatches : level.director.spawnPoints;
  const safeCandidates = candidates.filter(
    (point) => Math.hypot(point.x - player.x, point.y - player.y) >= point.minPlayerDistance
  );

  return safeCandidates.length > 0 ? safeCandidates : level.director.spawnPoints;
}
