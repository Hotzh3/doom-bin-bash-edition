import { RAYCAST_LEVEL_BOSS, RAYCAST_WORLD_THREE_CATALOG, RAYCAST_WORLD_TWO_CATALOG } from './RaycastLevel';

export function resolveRaycastBossShortcutLevelId(event: Pick<KeyboardEvent, 'code' | 'key' | 'repeat'>): string | null {
  if (event.repeat) return null;

  const code = event.code;
  const key = event.key;

  if (code === 'Digit4' || key === '4') {
    return RAYCAST_LEVEL_BOSS.id;
  }

  if (code === 'Digit5' || key === '5') {
    const world2Boss = RAYCAST_WORLD_TWO_CATALOG.find((level) => level.id === 'bloom-warden-pit');
    return world2Boss?.id ?? null;
  }

  if (code === 'Digit6' || key === '6') {
    const world3Boss = RAYCAST_WORLD_THREE_CATALOG[RAYCAST_WORLD_THREE_CATALOG.length - 1];
    return world3Boss?.id ?? null;
  }

  return null;
}
