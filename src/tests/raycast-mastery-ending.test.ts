import { describe, expect, it } from 'vitest';
import {
  applyRaycastMasteryUnlock,
  evaluateRaycastMasteryEnding,
  RAYCAST_MASTERY_UNLOCK_STORAGE_KEY,
  readRaycastMasteryUnlockState,
  writeRaycastMasteryUnlockState
} from '../game/raycast/RaycastMasteryEnding';
import { RAYCAST_LEVEL_CATALOG, RAYCAST_WORLD_THREE_CATALOG, RAYCAST_WORLD_TWO_CATALOG } from '../game/raycast/RaycastLevel';

describe('raycast mastery ending', () => {
  const allIds = [...RAYCAST_LEVEL_CATALOG, ...RAYCAST_WORLD_TWO_CATALOG, ...RAYCAST_WORLD_THREE_CATALOG].map((l) => l.id);

  it('fails mastery when any required sector rank is below S', () => {
    const levelRankById = Object.fromEntries(allIds.map((id) => [id, 'S'])) as Record<string, 'S' | 'SS' | 'A' | 'B' | 'C' | 'D'>;
    levelRankById[allIds[0]] = 'A';
    const result = evaluateRaycastMasteryEnding({
      terminalArcCleared: true,
      clearedLevelIds: allIds,
      levelRankById
    });
    expect(result.qualifiesForTrueEnding).toBe(false);
    expect(result.missingLevelIds).toContain(allIds[0]);
  });

  it('unlocks mastery when all required sectors are S or SS and arc is complete', () => {
    const levelRankById = Object.fromEntries(allIds.map((id) => [id, id === allIds[0] ? 'SS' : 'S'])) as Record<
      string,
      'S' | 'SS' | 'A' | 'B' | 'C' | 'D'
    >;
    const result = evaluateRaycastMasteryEnding({
      terminalArcCleared: true,
      clearedLevelIds: allIds,
      levelRankById
    });
    expect(result.qualifiesForTrueEnding).toBe(true);
    const unlocked = applyRaycastMasteryUnlock(
      result,
      {
        trueSignalUnlocked: false,
        corruptedSecretEndingUnlocked: false,
        impossibleModeUnlocked: false,
        hiddenFinalChallengeHookUnlocked: false,
        unlockedAtIso: null
      },
      '2026-05-14T00:00:00.000Z'
    );
    expect(unlocked.trueSignalUnlocked).toBe(true);
    expect(unlocked.corruptedSecretEndingUnlocked).toBe(true);
    expect(unlocked.impossibleModeUnlocked).toBe(true);
  });

  it('persists mastery unlock state with stable localStorage key', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v)
    };
    writeRaycastMasteryUnlockState(
      {
        trueSignalUnlocked: true,
        corruptedSecretEndingUnlocked: true,
        impossibleModeUnlocked: true,
        hiddenFinalChallengeHookUnlocked: true,
        unlockedAtIso: '2026-05-14T00:00:00.000Z'
      },
      storage
    );
    expect(RAYCAST_MASTERY_UNLOCK_STORAGE_KEY).toBe('raycast_mastery_unlock_v1');
    const loaded = readRaycastMasteryUnlockState(storage);
    expect(loaded.trueSignalUnlocked).toBe(true);
    expect(loaded.impossibleModeUnlocked).toBe(true);
  });
});
