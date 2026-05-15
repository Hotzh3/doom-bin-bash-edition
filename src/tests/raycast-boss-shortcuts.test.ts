import { describe, expect, it } from 'vitest';
import { RAYCAST_LEVEL_BOSS, RAYCAST_WORLD_THREE_CATALOG, RAYCAST_WORLD_TWO_CATALOG } from '../game/raycast/RaycastLevel';
import { resolveRaycastBossShortcutLevelId } from '../game/raycast/RaycastBossShortcuts';

describe('raycast boss shortcuts', () => {
  it('maps 4/5/6 to boss levels reliably', () => {
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit4', key: '4', repeat: false })).toBe(RAYCAST_LEVEL_BOSS.id);
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit5', key: '5', repeat: false })).toBe(
      RAYCAST_WORLD_TWO_CATALOG.find((level) => level.id === 'bloom-warden-pit')?.id ?? null
    );
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit6', key: '6', repeat: false })).toBe(
      RAYCAST_WORLD_THREE_CATALOG[RAYCAST_WORLD_THREE_CATALOG.length - 1]?.id ?? null
    );
  });

  it('ignores repeats and unrelated keys', () => {
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit4', key: '4', repeat: true })).toBeNull();
    expect(resolveRaycastBossShortcutLevelId({ code: 'Digit1', key: '1', repeat: false })).toBeNull();
  });
});
