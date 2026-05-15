import { describe, expect, it } from 'vitest';
import { getRaycastBossLevelId, RAYCAST_BOSS_SHORTCUT_LEVEL_IDS } from '../game/raycast/RaycastBossShortcuts';

describe('raycast boss shortcuts', () => {
  it('maps slots 1–3 to stable boss arena ids', () => {
    expect(getRaycastBossLevelId(1)).toBe(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[0]);
    expect(getRaycastBossLevelId(2)).toBe(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[1]);
    expect(getRaycastBossLevelId(3)).toBe(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS[2]);
    expect(RAYCAST_BOSS_SHORTCUT_LEVEL_IDS).toEqual([
      'volt-archon-pit',
      'bloom-warden-pit',
      'ash-judge-seal'
    ]);
  });
});
