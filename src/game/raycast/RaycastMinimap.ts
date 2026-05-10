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
}

export interface RaycastMinimapCell {
  x: number;
  y: number;
  kind: 'floor' | 'wall' | 'door';
}

export interface RaycastMinimapMarker {
  kind: 'player' | 'key' | 'door' | 'exit';
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

export function buildRaycastMinimapModel(state: RaycastMinimapState): RaycastMinimapModel {
  const collectedKeyIds = new Set(state.collectedKeyIds);
  const openDoorIds = new Set(state.openDoorIds);
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
    }))
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

/** Red-family markers for minimap differentiation (enemy dots). */
export function getRaycastMinimapEnemyDotStyle(kind: EnemyKind): { fill: number; radiusMul: number; ring: number } {
  if (kind === 'BRUTE') return { fill: 0xffa64d, radiusMul: 1.35, ring: 0xffd090 };
  if (kind === 'STALKER') return { fill: 0x54e898, radiusMul: 0.82, ring: 0xa8f0c8 };
  if (kind === 'RANGED') return { fill: 0x5cefef, radiusMul: 1.0, ring: 0x9ffbff };
  return { fill: 0xff5c42, radiusMul: 0.92, ring: 0xff9a80 };
}
