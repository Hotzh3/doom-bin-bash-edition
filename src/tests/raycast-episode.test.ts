import { describe, expect, it } from 'vitest';
import {
  getRaycastEpisodeState,
  resolveRaycastNextLevelId,
  RAYCAST_WORLD_TWO_CATALOG
} from '../game/raycast/RaycastEpisode';
import {
  RAYCAST_LEVEL,
  RAYCAST_LEVEL_2,
  RAYCAST_LEVEL_3,
  RAYCAST_LEVEL_4,
  RAYCAST_LEVEL_5,
  RAYCAST_LEVEL_BOSS
} from '../game/raycast/RaycastLevel';

describe('raycast episode progression', () => {
  it('ships a two-sector World 2 arc without affecting Episode 1 ordering', () => {
    expect(RAYCAST_WORLD_TWO_CATALOG).toHaveLength(2);
    expect(RAYCAST_WORLD_TWO_CATALOG.map((l) => l.worldSegment)).toEqual(['world2', 'world2']);
    expect(resolveRaycastNextLevelId(RAYCAST_LEVEL_BOSS.id)).toBe(RAYCAST_WORLD_TWO_CATALOG[0].id);
    expect(resolveRaycastNextLevelId(RAYCAST_WORLD_TWO_CATALOG[0].id)).toBe(RAYCAST_WORLD_TWO_CATALOG[1].id);
    expect(resolveRaycastNextLevelId(RAYCAST_WORLD_TWO_CATALOG[1].id)).toBeNull();
  });

  it('advances through five story sectors into the boss map', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL.id,
      currentLevelNumber: 1,
      totalLevels: 6,
      nextLevelId: RAYCAST_LEVEL_2.id,
      isFinalLevel: false
    });

    expect(getRaycastEpisodeState(RAYCAST_LEVEL_2.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_2.id,
      currentLevelNumber: 2,
      totalLevels: 6,
      nextLevelId: RAYCAST_LEVEL_3.id,
      isFinalLevel: false
    });

    expect(getRaycastEpisodeState(RAYCAST_LEVEL_3.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_3.id,
      currentLevelNumber: 3,
      totalLevels: 6,
      nextLevelId: RAYCAST_LEVEL_4.id,
      isFinalLevel: false
    });

    expect(getRaycastEpisodeState(RAYCAST_LEVEL_4.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_4.id,
      currentLevelNumber: 4,
      totalLevels: 6,
      nextLevelId: RAYCAST_LEVEL_5.id,
      isFinalLevel: false
    });

    expect(getRaycastEpisodeState(RAYCAST_LEVEL_5.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_5.id,
      currentLevelNumber: 5,
      totalLevels: 6,
      nextLevelId: RAYCAST_LEVEL_BOSS.id,
      isFinalLevel: false
    });
  });

  it('marks the boss arena as the finale with no further catalog entry', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL_BOSS.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_BOSS.id,
      currentLevelNumber: 6,
      totalLevels: 6,
      nextLevelId: null,
      isFinalLevel: true
    });
  });
});
