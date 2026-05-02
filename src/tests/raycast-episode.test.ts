import { describe, expect, it } from 'vitest';
import { getRaycastEpisodeState } from '../game/raycast/RaycastEpisode';
import { RAYCAST_LEVEL, RAYCAST_LEVEL_2 } from '../game/raycast/RaycastLevel';

describe('raycast episode progression', () => {
  it('advances level 1 into level 2', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL.id,
      currentLevelNumber: 1,
      totalLevels: 2,
      nextLevelId: RAYCAST_LEVEL_2.id,
      isFinalLevel: false
    });
  });

  it('marks level 2 as the final level', () => {
    expect(getRaycastEpisodeState(RAYCAST_LEVEL_2.id)).toEqual({
      currentLevelId: RAYCAST_LEVEL_2.id,
      currentLevelNumber: 2,
      totalLevels: 2,
      nextLevelId: null,
      isFinalLevel: true
    });
  });
});
