import { RAYCAST_LEVEL_CATALOG, RAYCAST_WORLD_THREE_CATALOG, RAYCAST_WORLD_TWO_CATALOG } from './RaycastLevel';
import type { RaycastRunRankParts } from './RaycastRunSummary';

export const RAYCAST_MASTERY_UNLOCK_STORAGE_KEY = 'raycast_mastery_unlock_v1';

export interface RaycastMasteryUnlockState {
  trueSignalUnlocked: boolean;
  corruptedSecretEndingUnlocked: boolean;
  impossibleModeUnlocked: boolean;
  hiddenFinalChallengeHookUnlocked: boolean;
  unlockedAtIso: string | null;
}

export interface RaycastMasteryEvaluationInput {
  terminalArcCleared: boolean;
  clearedLevelIds: string[];
  levelRankById: Record<string, RaycastRunRankParts['tierLetter']>;
}

export interface RaycastMasteryEvaluationResult {
  qualifiesForTrueEnding: boolean;
  missingLevelIds: string[];
}

function createDefaultState(): RaycastMasteryUnlockState {
  return {
    trueSignalUnlocked: false,
    corruptedSecretEndingUnlocked: false,
    impossibleModeUnlocked: false,
    hiddenFinalChallengeHookUnlocked: false,
    unlockedAtIso: null
  };
}

function isRankSOrHigher(rank: RaycastRunRankParts['tierLetter'] | undefined): boolean {
  return rank === 'S' || rank === 'SS';
}

export function evaluateRaycastMasteryEnding(input: RaycastMasteryEvaluationInput): RaycastMasteryEvaluationResult {
  const requiredIds = [...RAYCAST_LEVEL_CATALOG, ...RAYCAST_WORLD_TWO_CATALOG, ...RAYCAST_WORLD_THREE_CATALOG].map((l) => l.id);
  if (!input.terminalArcCleared) {
    return { qualifiesForTrueEnding: false, missingLevelIds: requiredIds };
  }
  const cleared = new Set(input.clearedLevelIds);
  const missingLevelIds = requiredIds.filter((id) => !cleared.has(id) || !isRankSOrHigher(input.levelRankById[id]));
  return {
    qualifiesForTrueEnding: missingLevelIds.length === 0,
    missingLevelIds
  };
}

export function readRaycastMasteryUnlockState(
  storage: Pick<Storage, 'getItem'> = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null }
): RaycastMasteryUnlockState {
  try {
    const raw = storage.getItem(RAYCAST_MASTERY_UNLOCK_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<RaycastMasteryUnlockState>;
    return {
      trueSignalUnlocked: Boolean(parsed.trueSignalUnlocked),
      corruptedSecretEndingUnlocked: Boolean(parsed.corruptedSecretEndingUnlocked),
      impossibleModeUnlocked: Boolean(parsed.impossibleModeUnlocked),
      hiddenFinalChallengeHookUnlocked: Boolean(parsed.hiddenFinalChallengeHookUnlocked),
      unlockedAtIso: typeof parsed.unlockedAtIso === 'string' ? parsed.unlockedAtIso : null
    };
  } catch {
    return createDefaultState();
  }
}

export function writeRaycastMasteryUnlockState(
  state: RaycastMasteryUnlockState,
  storage: Pick<Storage, 'setItem'> = typeof localStorage !== 'undefined' ? localStorage : { setItem: () => {} }
): void {
  try {
    storage.setItem(RAYCAST_MASTERY_UNLOCK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Intentionally no-op: unlock persistence is best effort.
  }
}

export function applyRaycastMasteryUnlock(
  evaluation: RaycastMasteryEvaluationResult,
  previous: RaycastMasteryUnlockState,
  nowIso: string
): RaycastMasteryUnlockState {
  if (!evaluation.qualifiesForTrueEnding) return previous;
  return {
    trueSignalUnlocked: true,
    corruptedSecretEndingUnlocked: true,
    impossibleModeUnlocked: true,
    hiddenFinalChallengeHookUnlocked: true,
    unlockedAtIso: previous.unlockedAtIso ?? nowIso
  };
}
