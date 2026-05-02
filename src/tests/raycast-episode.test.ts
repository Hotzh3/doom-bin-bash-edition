import { describe, expect, it } from 'vitest';
import { getRaycastEpisodeState } from '../game/raycast/RaycastEpisode';
import { RAYCAST_LEVEL, RAYCAST_LEVEL_2, RAYCAST_LEVEL_3 } from '../game/raycast/RaycastLevel';

describe('raycast episode progression', () => {
  it('advances level 1 into level 2', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL.id,
      currentLevelNumber: 1,
      totalLevels: 3,
      nextLevelId: RAYCAST_LEVEL_2.id,
      isFinalLevel: false
    });
  });

  it('advances level 2 into level 3', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL_2.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_2.id,
      currentLevelNumber: 2,
      totalLevels: 3,
      nextLevelId: RAYCAST_LEVEL_3.id,
      isFinalLevel: false
    });
  });

  it('marks level 3 as the final level', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL_3.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_3.id,
      currentLevelNumber: 3,
      totalLevels: 3,
      nextLevelId: null,
      isFinalLevel: true
    });
  });
});
