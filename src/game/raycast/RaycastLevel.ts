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

export interface RaycastKey extends KeyPickup {
  pickupObjectiveText: string;
  billboardLabel: string;
}

export interface RaycastDoor extends LockedDoor {
  tileX: number;
  tileY: number;
  billboardLabel: string;
}

export interface RaycastTrigger extends LevelTrigger {
  activationText: string;
}

export interface RaycastSecret extends SecretPickup {
  billboardLabel: string;
}

export interface RaycastExit {
  id: string;
  x: number;
  y: number;
  radius: number;
  objectiveText: string;
  billboardLabel: string;
}

export interface RaycastDirectorSpawnPoint extends SpawnPoint {
  id: string;
  zoneId: string;
  minPlayerDistance: number;
}

export interface RaycastLevel {
  name: string;
  zones: RectArea[];
  keys: RaycastKey[];
  doors: RaycastDoor[];
  triggers: RaycastTrigger[];
  secrets: RaycastSecret[];
  exits: RaycastExit[];
  initialSpawns: RaycastEnemySpawn[];
  director: {
    enabled: boolean;
    config: Partial<DirectorConfig>;
    spawnPoints: RaycastDirectorSpawnPoint[];
  };
}

export const RAYCAST_LEVEL: RaycastLevel = {
  name: 'Corrupt Access Node',
  zones: [
    { id: 'start', x: 2.5, y: 12.3, width: 3.2, height: 1.4 },
    { id: 'narrow-hall', x: 3.0, y: 9.2, width: 4.8, height: 4.8 },
    { id: 'first-contact', x: 3.8, y: 7.5, width: 3.8, height: 1.8 },
    { id: 'key-area', x: 4.5, y: 3.8, width: 3.4, height: 2.8 },
    { id: 'locked-door', x: 8.0, y: 7.5, width: 2.0, height: 1.8 },
    { id: 'ambush', x: 10.4, y: 7.8, width: 3.2, height: 2.0 },
    { id: 'combat-arena', x: 14.8, y: 9.6, width: 4.2, height: 5.2 },
    { id: 'side-pressure', x: 11.8, y: 10.5, width: 5.2, height: 3.0 },
    { id: 'secret', x: 6.1, y: 12.3, width: 2.6, height: 1.4 },
    { id: 'exit', x: 16.2, y: 2.2, width: 1.8, height: 2.4 }
  ],
  keys: [
    {
      id: 'rust-key',
      label: 'Access Token',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'rust-gate',
      pickupObjectiveText: 'Token routed: return to gateway',
      billboardLabel: 'TOKEN'
    }
  ],
  doors: [
    {
      id: 'rust-gate',
      tileX: 8,
      tileY: 7,
      x: 8.5,
      y: 7.5,
      width: 1,
      height: 1,
      keyId: 'rust-key',
      killsRequired: 0,
      openObjectiveText: 'Gateway open: combat node exposed',
      lockedObjectiveText: 'Firewall sealed: access token required',
      billboardLabel: 'SEALED'
    }
  ],
  triggers: [
    {
      id: 'gate-ambush',
      x: 10.4,
      y: 7.9,
      width: 2.6,
      height: 1.6,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Ambush protocol: clear the node',
      activationText: 'Corruption spike: ambush active',
      spawns: [
        { x: 10.5, y: 7.5, kind: 'STALKER' },
        { x: 13.5, y: 9.5, kind: 'GRUNT' },
        { x: 16.5, y: 7.5, kind: 'RANGED' }
      ]
    },
    {
      id: 'lateral-pressure',
      x: 14.8,
      y: 9.8,
      width: 3.2,
      height: 2.4,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Side pressure: keep moving',
      activationText: 'Side channel breach: lateral pressure',
      spawns: [
        { x: 9.5, y: 11.5, kind: 'GRUNT' },
        { x: 14.5, y: 11.5, kind: 'STALKER' },
        { x: 16.5, y: 11.5, kind: 'GRUNT' }
      ]
    },
    {
      id: 'secret-cache-pressure',
      x: 6.1,
      y: 12.3,
      width: 2.0,
      height: 1.0,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Hidden node disturbed',
      activationText: 'Hidden cache ping: response inbound',
      spawns: [
        { x: 3.5, y: 9.5, kind: 'STALKER' },
        { x: 7.5, y: 11.5, kind: 'GRUNT' }
      ]
    }
  ],
  secrets: [
    {
      id: 'west-cache',
      label: 'Hidden Cache',
      x: 5.5,
      y: 12.5,
      radius: 0.24,
      objectiveText: 'Hidden node: 25 HP restored',
      billboardLabel: 'HIDDEN'
    }
  ],
  exits: [
    {
      id: 'foundry-exit',
      x: 16.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Access node purged',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'first-contact-grunt', kind: 'GRUNT', x: 3.5, y: 7.5 },
    { id: 'key-guard-stalker', kind: 'STALKER', x: 5.5, y: 3.5 },
    { id: 'arena-sleeper-brute', kind: 'BRUTE', x: 14.5, y: 9.5 },
    { id: 'exit-ranged-lookout', kind: 'RANGED', x: 16.5, y: 5.5 }
  ],
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 4,
      maxTotalSpawns: 9,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 5600,
      buildUpSpawnCooldownMs: 4600,
      ambushSpawnCooldownMs: 2200,
      highIntensitySpawnCooldownMs: 3800,
      recoveryDurationMs: 5200,
      ambushDurationMs: 6000,
      highIntensityDurationMs: 9000,
      buildUpAfterMs: 7200,
      idlePressureMs: 2000,
      dominanceNoDamageMs: 9500,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: true
    },
    spawnPoints: [
      { id: 'first-contact-rear', zoneId: 'first-contact', x: 3.5, y: 7.5, minPlayerDistance: 1.6 },
      { id: 'key-area-terminal', zoneId: 'key-area', x: 5.5, y: 3.5, minPlayerDistance: 1.8 },
      { id: 'locked-door-pressure', zoneId: 'locked-door', x: 7.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'ambush-threshold', zoneId: 'ambush', x: 10.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'arena-left', zoneId: 'combat-arena', x: 13.5, y: 9.5, minPlayerDistance: 1.8 },
      { id: 'arena-lower', zoneId: 'combat-arena', x: 14.5, y: 11.5, minPlayerDistance: 1.8 },
      { id: 'arena-ranged-perch', zoneId: 'combat-arena', x: 16.5, y: 7.5, minPlayerDistance: 2.2 },
      { id: 'side-loop-pressure', zoneId: 'side-pressure', x: 9.5, y: 11.5, minPlayerDistance: 2.0 },
      { id: 'exit-pressure', zoneId: 'exit', x: 16.5, y: 3.5, minPlayerDistance: 2.0 }
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

export function registerRaycastSecret(collectedSecrets: Set<string>, secret: Pick<RaycastSecret, 'id'>): boolean {
  if (collectedSecrets.has(secret.id)) return false;
  collectedSecrets.add(secret.id);
  return true;
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
