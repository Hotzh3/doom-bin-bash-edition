import { describe, expect, it } from 'vitest';
import {
  getRaycastBossLevelId,
  RAYCAST_BOSS_SHORTCUT_LEVEL_IDS,
  resolveRaycastBossShortcutLevelId
} from '../game/raycast/RaycastBossShortcuts';

describe('raycast boss shortcuts', () => {
  it('maps slots 1–3 to stable boss arena ids', () => {
    expect(getRaycastBossLevelId(1)).toBe(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[0]);
    expect(getRaycastBossLevelId(2)).toBe(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[1]);
    expect(getRaycastBossLevelId(3)).toBe(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[2]);
    expect(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS).toEqual(['volt-archon-pit', 'bloom-warden-pit', 'ash-judge-seal']);
  });

  it('maps 4/5/6 keyboard codes to the same boss arenas', () => {
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit4', key: '4', repeat: false })).toBe(getRaycastBossLevelId(1));
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit5', key: '5', repeat: false })).toBe(getRaycastBossLevelId(2));
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit6', key: '6', repeat: false })).toBe(getRaycastBossLevelId(3));
    expect(resolveRaycastBossShortcutLevelId({ code: 'Numpad4', key: '4', repeat: false })).toBe(getRaycastBossLevelId(1));
  });

  it('ignores repeats and unrelated keys', () => {
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit4', key: '4', repeat: true })).toBeNull();
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit1', key: '1', repeat: false })).toBeNull();
  });
});
