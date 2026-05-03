import { DEFAULT_DIRECTOR_CONFIG, type DirectorConfig } from '../systems/DirectorConfig';
import type { RaycastHealthPickup } from './RaycastItems';

export type RaycastDifficultyId = 'assist' | 'standard' | 'hard';

export interface RaycastDifficultyPreset {
  id: RaycastDifficultyId;
  label: string;
  shortLabel: string;
  menuSummary: string;
  inGameSummary: string;
  damageMultiplier: number;
  healthPickupMultiplier: number;
  directorEnemyCapMultiplier: number;
  directorSpawnBudgetMultiplier: number;
  directorSpawnCooldownMultiplier: number;
  directorOpeningSpawnOffset: number;
}

export const RAYCAST_DIFFICULTY_PRESETS: RaycastDifficultyPreset[] = [
  {
    id: 'assist',
    label: 'Assist',
    shortLabel: 'AST',
    menuSummary: 'Lower damage, slower pressure, stronger repairs.',
    inGameSummary: 'SOFTER DAMAGE // SLOWER PRESSURE // STRONGER REPAIRS',
    damageMultiplier: 0.75,
    healthPickupMultiplier: 1.25,
    directorEnemyCapMultiplier: 0.8,
    directorSpawnBudgetMultiplier: 0.85,
    directorSpawnCooldownMultiplier: 1.2,
    directorOpeningSpawnOffset: -1
  },
  {
    id: 'standard',
    label: 'Standard',
    shortLabel: 'STD',
    menuSummary: 'Baseline raycast tuning.',
    inGameSummary: 'BASELINE DAMAGE // BASELINE PRESSURE',
    damageMultiplier: 1,
    healthPickupMultiplier: 1,
    directorEnemyCapMultiplier: 1,
    directorSpawnBudgetMultiplier: 1,
    directorSpawnCooldownMultiplier: 1,
    directorOpeningSpawnOffset: 0
  },
  {
    id: 'hard',
    label: 'Hard',
    shortLabel: 'HRD',
    menuSummary: 'Higher damage, tighter pressure, leaner repairs.',
    inGameSummary: 'HIGHER DAMAGE // TIGHTER PRESSURE // LEANER REPAIRS',
    damageMultiplier: 1.2,
    healthPickupMultiplier: 0.9,
    directorEnemyCapMultiplier: 1.15,
    directorSpawnBudgetMultiplier: 1.15,
    directorSpawnCooldownMultiplier: 0.88,
    directorOpeningSpawnOffset: 0
  }
];

const RAYCAST_DIFFICULTY_BY_ID = new Map(
  RAYCAST_DIFFICULTY_PRESETS.map((preset) => [preset.id, preset] satisfies [RaycastDifficultyId, RaycastDifficultyPreset])
);

export const DEFAULT_RAYCAST_DIFFICULTY_ID: RaycastDifficultyId = 'standard';
export const RAYCAST_DIFFICULTY_REGISTRY_KEY = 'raycastDifficulty';

export function getRaycastDifficultyPreset(difficultyId: string | null | undefined): RaycastDifficultyPreset {
  return RAYCAST_DIFFICULTY_BY_ID.get((difficultyId ?? DEFAULT_RAYCAST_DIFFICULTY_ID) as RaycastDifficultyId)
    ?? RAYCAST_DIFFICULTY_BY_ID.get(DEFAULT_RAYCAST_DIFFICULTY_ID)!;
}

export function cycleRaycastDifficulty(
  currentDifficultyId: string | null | undefined,
  direction: 1 | -1 = 1
): RaycastDifficultyPreset {
  const currentPreset = getRaycastDifficultyPreset(currentDifficultyId);
  const currentIndex = RAYCAST_DIFFICULTY_PRESETS.findIndex((preset) => preset.id === currentPreset.id);
  const nextIndex = (currentIndex + direction + RAYCAST_DIFFICULTY_PRESETS.length) % RAYCAST_DIFFICULTY_PRESETS.length;
  return RAYCAST_DIFFICULTY_PRESETS[nextIndex];
}

export function scaleRaycastIncomingDamage(amount: number, difficultyId: string | null | undefined): number {
  const preset = getRaycastDifficultyPreset(difficultyId);
  const scaled = Math.round(Math.max(0, amount) * preset.damageMultiplier);
  if (amount > 0) return clampInt(scaled, 1, 999);
  return 0;
}

export function getRaycastDifficultyHealthPickup(
  pickup: Pick<RaycastHealthPickup, 'restoreAmount'>,
  difficultyId: string | null | undefined
): Pick<RaycastHealthPickup, 'restoreAmount'> {
  const preset = getRaycastDifficultyPreset(difficultyId);
  return {
    restoreAmount: clampInt(Math.round(Math.max(0, pickup.restoreAmount) * preset.healthPickupMultiplier), 1, 100)
  };
}

export function createRaycastDifficultyDirectorConfig(
  config: Partial<DirectorConfig>,
  difficultyId: string | null | undefined
): Partial<DirectorConfig> {
  const preset = getRaycastDifficultyPreset(difficultyId);
  const merged = { ...DEFAULT_DIRECTOR_CONFIG, ...config };

  return {
    ...config,
    maxEnemiesAlive: clampInt(Math.round(merged.maxEnemiesAlive * preset.directorEnemyCapMultiplier), 3, 10),
    maxTotalSpawns: clampInt(Math.round(merged.maxTotalSpawns * preset.directorSpawnBudgetMultiplier), 8, 40),
    openingSpawnCount: clampInt(merged.openingSpawnCount + preset.directorOpeningSpawnOffset, 1, 6),
    baseSpawnCooldownMs: clampInt(
      Math.round(merged.baseSpawnCooldownMs * preset.directorSpawnCooldownMultiplier),
      800,
      15_000
    ),
    buildUpSpawnCooldownMs: clampInt(
      Math.round(merged.buildUpSpawnCooldownMs * preset.directorSpawnCooldownMultiplier),
      800,
      15_000
    ),
    ambushSpawnCooldownMs: clampInt(
      Math.round(merged.ambushSpawnCooldownMs * preset.directorSpawnCooldownMultiplier),
      600,
      10_000
    ),
    highIntensitySpawnCooldownMs: clampInt(
      Math.round(merged.highIntensitySpawnCooldownMs * preset.directorSpawnCooldownMultiplier),
      600,
      12_000
    )
  };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
