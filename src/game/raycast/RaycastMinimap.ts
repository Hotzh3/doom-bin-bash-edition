import type { EnemyKind } from '../types/game';
import { getRaycastDoorRequiredKeyIds, type RaycastLevel } from './RaycastLevel';
import { RAYCAST_TILE, type RaycastMap } from './RaycastMap';

export interface RaycastMinimapDoorState {
  id: string;
  tileX: number;
  tileY: number;
  isOpen: boolean;
}

export interface RaycastMinimapEnemyBlip {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
}

export interface RaycastMinimapState {
  map: RaycastMap;
  level: RaycastLevel;
  player: {
    x: number;
    y: number;
    angle: number;
  };
  collectedKeyIds: Iterable<string>;
  openDoorIds: Iterable<string>;
  collectedSecretIds: Iterable<string>;
  /** Live enemies only; omit or pass empty to omit blips. */
  enemies?: Iterable<RaycastMinimapEnemyBlip>;
  /**
   * Precomputed static grid from {@link buildStaticRaycastMinimapCells} — avoids reallocating
   * wall/floor/door cells every minimap draw when the caller caches per layout revision.
   */
  staticCells?: RaycastMinimapCell[];
}

export interface RaycastMinimapCell {
  x: number;
  y: number;
  kind: 'floor' | 'wall' | 'door';
}

export interface RaycastMinimapMarker {
  kind: 'player' | 'key' | 'door' | 'exit' | 'landmark';
  x: number;
  y: number;
  angle?: number;
  label: string;
  active: boolean;
}

export interface RaycastMinimapModel {
  width: number;
  height: number;
  cells: RaycastMinimapCell[];
  markers: RaycastMinimapMarker[];
  enemyBlips: RaycastMinimapEnemyBlip[];
}

/** Wall / floor / door cells derived only from map topology — safe to cache until the grid mutates. */
export function buildStaticRaycastMinimapCells(state: Pick<RaycastMinimapState, 'map' | 'level'>): RaycastMinimapCell[] {
  const cells: RaycastMinimapCell[] = [];

  state.map.grid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === RAYCAST_TILE.EMPTY) {
        cells.push({ x, y, kind: 'floor' });
        return;
      }

      if (tile === RAYCAST_TILE.LOCKED_DOOR && state.level.doors.some((door) => door.tileX === x && door.tileY === y)) {
        cells.push({ x, y, kind: 'door' });
        return;
      }

      cells.push({ x, y, kind: 'wall' });
    });
  });

  return cells;
}

function isSecretZoneRevealed(
  level: RaycastLevel,
  zone: { x: number; y: number; width: number; height: number },
  collectedSecretIds: Set<string>
): boolean {
  const cx = zone.x + zone.width * 0.5;
  const cy = zone.y + zone.height * 0.5;
  const gate = Math.hypot(zone.width, zone.height) * 0.55 + 1.35;
  return level.secrets.some((secret) => {
    if (!collectedSecretIds.has(secret.id)) return false;
    const dx = secret.x - cx;
    const dy = secret.y - cy;
    return Math.hypot(dx, dy) <= gate + (secret.radius ?? 0);
  });
}

export function buildRaycastMinimapModel(state: RaycastMinimapState): RaycastMinimapModel {
  const collectedKeyIds = new Set(state.collectedKeyIds);
  const openDoorIds = new Set(state.openDoorIds);
  const collectedSecretIds = new Set(state.collectedSecretIds);
  const cells = state.staticCells ?? buildStaticRaycastMinimapCells(state);
  const landmarkMarkers: RaycastMinimapMarker[] = state.level.zones
    .filter((zone) => zone.landmark)
    .filter((zone) => {
      if (zone.landmark !== 'secret') return true;
      return isSecretZoneRevealed(state.level, zone, collectedSecretIds);
    })
    .map((zone) => ({
      kind: 'landmark' as const,
      x: zone.x + zone.width * 0.5,
      y: zone.y + zone.height * 0.5,
      label: buildRaycastLandmarkMarkerLabel(zone.id, zone.landmark!),
      active: true
    }));

  const markers: RaycastMinimapMarker[] = [
    {
      kind: 'player',
      x: state.player.x,
      y: state.player.y,
      angle: state.player.angle,
      label: 'YOU',
      active: true
    },
    ...state.level.keys.map((key) => ({
      kind: 'key' as const,
      x: key.x,
      y: key.y,
      label: key.billboardLabel,
      active: !collectedKeyIds.has(key.id)
    })),
    ...state.level.doors.map((door) => ({
      kind: 'door' as const,
      x: door.x,
      y: door.y,
      label: openDoorIds.has(door.id)
        ? 'OPEN'
        : getRaycastDoorRequiredKeyIds(door).every((keyId) => collectedKeyIds.has(keyId))
          ? 'DOOR'
          : 'LOCK',
      active: true
    })),
    ...state.level.exits.map((exit) => ({
      kind: 'exit' as const,
      x: exit.x,
      y: exit.y,
      label: exit.billboardLabel,
      active: true
    })),
    ...landmarkMarkers
  ];

  const enemyBlips = state.enemies
    ? Array.isArray(state.enemies)
      ? state.enemies
      : Array.from(state.enemies)
    : [];

  return {
    width: state.map.grid[0]?.length ?? 0,
    height: state.map.grid.length,
    cells,
    markers,
    enemyBlips
  };
}

function buildRaycastLandmarkMarkerLabel(zoneId: string, landmark: NonNullable<RaycastLevel['zones'][number]['landmark']>): string {
  if (landmark === 'key') return 'KEYNODE';
  if (landmark === 'gate') return 'GATE';
  if (landmark === 'ambush') return `KILL-${buildZoneTag(zoneId)}`;
  if (landmark === 'exit') return 'EXFIL';
  if (landmark === 'secret') return `CACHE-${buildZoneTag(zoneId)}`;
  return buildZoneTag(zoneId);
}

function buildZoneTag(zoneId: string): string {
  return zoneId
    .split('-')
    .map((token) => token[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();
}

/** Red-family markers for minimap differentiation (enemy dots). */
export function getRaycastMinimapEnemyDotStyle(kind: EnemyKind): { fill: number; radiusMul: number; ring: number } {
  if (kind === 'BRUTE') return { fill: 0xffa64d, radiusMul: 1.35, ring: 0xffd090 };
  if (kind === 'STALKER') return { fill: 0x54e898, radiusMul: 0.82, ring: 0xa8f0c8 };
  if (kind === 'RANGED') return { fill: 0x5cefef, radiusMul: 1.0, ring: 0x9ffbff };
  if (kind === 'SCRAMBLER') return { fill: 0xff8844, radiusMul: 0.88, ring: 0xffc090 };
  return { fill: 0xff5c42, radiusMul: 0.92, ring: 0xff9a80 };
}
