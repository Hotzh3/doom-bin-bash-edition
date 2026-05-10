import { RAYCAST_LEVEL_CATALOG, RAYCAST_WORLD_TWO_CATALOG, getRaycastLevelById } from './RaycastLevel';

export { RAYCAST_WORLD_TWO_CATALOG } from './RaycastLevel';

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

/** Full-run continuation: Episode 1 boss may chain into World 2 catalog. */
export function resolveRaycastNextLevelId(levelId: string): string | null {
  const w1Index = RAYCAST_LEVEL_CATALOG.findIndex((entry) => entry.id === levelId);
  if (w1Index >= 0) {
    if (w1Index + 1 < RAYCAST_LEVEL_CATALOG.length) {
      return RAYCAST_LEVEL_CATALOG[w1Index + 1].id;
    }
    return RAYCAST_WORLD_TWO_CATALOG[0]?.id ?? null;
  }

  const w2Index = RAYCAST_WORLD_TWO_CATALOG.findIndex((entry) => entry.id === levelId);
  if (w2Index >= 0) {
    return RAYCAST_WORLD_TWO_CATALOG[w2Index + 1]?.id ?? null;
  }

  return null;
}
