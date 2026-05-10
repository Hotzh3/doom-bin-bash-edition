import { describe, expect, it } from 'vitest';
import { buildRaycastMinimapModel, buildStaticRaycastMinimapCells } from '../game/raycast/RaycastMinimap';
import { RAYCAST_LEVEL, cloneRaycastMap, openRaycastDoor } from '../game/raycast/RaycastLevel';

describe('raycast minimap model', () => {
  it('includes walls, floor, doors, and player direction markers', () => {
    const model = buildRaycastMinimapModel({
      map: RAYCAST_LEVEL.map,
      level: RAYCAST_LEVEL,
      player: { x: 2.5, y: 12.5, angle: -Math.PI / 2 },
      collectedKeyIds: [],
      openDoorIds: [],
      collectedSecretIds: []
    });

    expect(model.width).toBe(RAYCAST_LEVEL.map.grid[0].length);
    expect(model.height).toBe(RAYCAST_LEVEL.map.grid.length);
    expect(model.cells.some((cell) => cell.kind === 'wall')).toBe(true);
    expect(model.cells.some((cell) => cell.kind === 'floor')).toBe(true);
    expect(model.cells.some((cell) => cell.kind === 'door')).toBe(true);
    expect(model.enemyBlips).toEqual([]);
    expect(model.markers).toContainEqual(
      expect.objectContaining({ kind: 'player', angle: -Math.PI / 2, label: 'YOU', active: true })
    );
  });

  it('lists live enemies as map blips without revealing secrets', () => {
    const model = buildRaycastMinimapModel({
      map: RAYCAST_LEVEL.map,
      level: RAYCAST_LEVEL,
      player: { x: 3.5, y: 10.5, angle: 0 },
      collectedKeyIds: [],
      openDoorIds: [],
      collectedSecretIds: [],
      enemies: [
        { id: 'a', kind: 'GRUNT', x: 4.2, y: 10.1 },
        { id: 'b', kind: 'BRUTE', x: 6.1, y: 11.4 }
      ]
    });

    expect(model.enemyBlips).toHaveLength(2);
    expect(model.enemyBlips.some((b) => b.kind === 'GRUNT')).toBe(true);
    expect(model.markers.some((m) => m.label === 'HIDDEN')).toBe(false);
  });

  it('matches full model cells when staticCells is precomputed', () => {
    const staticCells = buildStaticRaycastMinimapCells({ map: RAYCAST_LEVEL.map, level: RAYCAST_LEVEL });
    const withStatic = buildRaycastMinimapModel({
      map: RAYCAST_LEVEL.map,
      level: RAYCAST_LEVEL,
      player: { x: 2.5, y: 12.5, angle: 0 },
      collectedKeyIds: [],
      openDoorIds: [],
      collectedSecretIds: [],
      staticCells
    });
    const full = buildRaycastMinimapModel({
      map: RAYCAST_LEVEL.map,
      level: RAYCAST_LEVEL,
      player: { x: 2.5, y: 12.5, angle: 0 },
      collectedKeyIds: [],
      openDoorIds: [],
      collectedSecretIds: []
    });
    expect(withStatic.cells).toEqual(full.cells);
  });

  it('updates key and door markers from progression state without revealing secrets', () => {
    const lockedModel = buildRaycastMinimapModel({
      map: RAYCAST_LEVEL.map,
      level: RAYCAST_LEVEL,
      player: { x: 7.5, y: 7.5, angle: 0 },
      collectedKeyIds: [],
      openDoorIds: [],
      collectedSecretIds: []
    });

    expect(lockedModel.markers).toContainEqual(expect.objectContaining({ kind: 'door', label: 'LOCK', active: true }));

    const keyedModel = buildRaycastMinimapModel({
      map: RAYCAST_LEVEL.map,
      level: RAYCAST_LEVEL,
      player: { x: 7.5, y: 7.5, angle: 0 },
      collectedKeyIds: ['rust-key'],
      openDoorIds: [],
      collectedSecretIds: []
    });

    expect(keyedModel.markers).toContainEqual(expect.objectContaining({ kind: 'door', label: 'DOOR', active: true }));

    const openedMap = cloneRaycastMap(RAYCAST_LEVEL.map);
    RAYCAST_LEVEL.doors.forEach((door) => openRaycastDoor(openedMap, door));
    const openModel = buildRaycastMinimapModel({
      map: openedMap,
      level: RAYCAST_LEVEL,
      player: { x: 8.5, y: 7.5, angle: 0 },
      collectedKeyIds: ['rust-key'],
      openDoorIds: ['rust-gate', 'service-shutter'],
      collectedSecretIds: ['west-cache']
    });

    expect(openModel.markers).toContainEqual(expect.objectContaining({ kind: 'key', label: 'TOKEN', active: false }));
    expect(openModel.markers).toContainEqual(expect.objectContaining({ kind: 'door', label: 'OPEN', active: true }));
    expect(openModel.markers).toContainEqual(expect.objectContaining({ kind: 'exit', label: 'EXIT', active: true }));
    expect(openModel.markers.some((marker) => marker.label === 'HIDDEN')).toBe(false);
    expect(openModel.cells.some((cell) => cell.kind === 'door')).toBe(false);
    expect(openModel.enemyBlips).toEqual([]);
  });
});
