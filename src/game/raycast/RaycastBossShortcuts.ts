/** Boss arena jump targets — keys 4 / 5 / 6 (always available in menu + gameplay). */
export const RAYCAST_BOSS_SHORTCUT_LEVEL_IDS = ['volt-archon-pit', 'bloom-warden-pit', 'ash-judge-seal'] as const;

export type RaycastBossShortcutSlot = 1 | 2 | 3;

export function getRaycastBossLevelId(slot: RaycastBossShortcutSlot): string {
  return RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[slot - 1];
}
