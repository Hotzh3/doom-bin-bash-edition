export type DirectorState = 'EXPLORATION' | 'BUILD_UP' | 'AMBUSH' | 'HIGH_INTENSITY' | 'RECOVERY';

export const DIRECTOR_STATE_LABELS: Record<DirectorState, string> = {
  EXPLORATION: 'Exploration',
  BUILD_UP: 'Tension',
  AMBUSH: 'Ambush',
  HIGH_INTENSITY: 'HighIntensity',
  RECOVERY: 'Recovery'
};

export interface DirectorDebugInfo {
  enabled: boolean;
  state: DirectorState;
  intensity: number;
  enemiesAlive: number;
  maxEnemiesAlive?: number;
  spawnCooldownRemainingMs: number;
  lastDecisionReason: string;
  spawnBudgetRemaining?: number;
}
