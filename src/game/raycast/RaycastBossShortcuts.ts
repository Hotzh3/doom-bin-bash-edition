/** Boss arena jump targets — keys 4 / 5 / 6 (always available in menu + gameplay). */
export const RAYCAST_BOSS_SHORTCUT_LEVEL_IDS = ['volt-archon-pit', 'bloom-warden-pit', 'ash-judge-seal'] as const;

export type RaycastBossShortcutSlot = 1 | 2 | 3;

export function getRaycastBossLevelId(slot: RaycastBossShortcutSlot): string {
  return RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[slot - 1];
}

export function resolveRaycastBossShortcutLevelId(event: Pick<KeyboardEvent, 'code' | 'key' | 'repeat'>): string | null {
  if (event.repeat) return null;
  const code = event.code;
  const key = event.key;

  if (code === 'Digit4' || code === 'Numpad4' || key === '4') {
    return getRaycastBossLevelId(1);
  }

  if (code === 'Digit5' || code === 'Numpad5' || key === '5') {
    return getRaycastBossLevelId(2);
  }

  if (code === 'Digit6' || code === 'Numpad6' || key === '6') {
    return getRaycastBossLevelId(3);
  }

  return null;
}
