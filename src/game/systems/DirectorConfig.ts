export interface DirectorConfig {
  debugEnabled: boolean;
  maxEnemiesAlive: number;
  maxTotalSpawns: number;
  openingSpawnCount: number;
  baseSpawnCooldownMs: number;
  buildUpSpawnCooldownMs: number;
  ambushSpawnCooldownMs: number;
  highIntensitySpawnCooldownMs: number;
  recoveryDurationMs: number;
  ambushDurationMs: number;
  buildUpAfterMs: number;
  idlePressureMs: number;
  dominanceNoDamageMs: number;
  lowHealthThreshold: number;
  comfortableHealthThreshold: number;
}

export const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
  debugEnabled: true,
  maxEnemiesAlive: 6,
  maxTotalSpawns: 22,
  openingSpawnCount: 2,
  baseSpawnCooldownMs: 5200,
  buildUpSpawnCooldownMs: 4200,
  ambushSpawnCooldownMs: 1500,
  highIntensitySpawnCooldownMs: 2600,
  recoveryDurationMs: 6500,
  ambushDurationMs: 8500,
  buildUpAfterMs: 7000,
  idlePressureMs: 1700,
  dominanceNoDamageMs: 9000,
  lowHealthThreshold: 32,
  comfortableHealthThreshold: 68
};
