import { RAYCAST_LEVEL_CATALOG, getRaycastLevelById } from './RaycastLevel';

export interface RaycastEpisodeState {
  currentLevelId: string;
  currentLevelNumber: number;
  totalLevels: number;
  nextLevelId: string | null;
  isFinalLevel: boolean;
}

export function getRaycastEpisodeState(levelId: string): RaycastEpisodeState {
  const level = getRaycastLevelById(levelId);
  const currentIndex = RAYCAST_LEVEL_CATALOG.findIndex((entry) => entry.id === level.id);
  const nextLevel = RAYCAST_LEVEL_CATALOG[currentIndex + 1] ?? null;

  return {
    currentLevelId: level.id,
    currentLevelNumber: currentIndex + 1,
    totalLevels: RAYCAST_LEVEL_CATALOG.length,
    nextLevelId: nextLevel?.id ?? null,
    isFinalLevel: nextLevel === null
  };
}
