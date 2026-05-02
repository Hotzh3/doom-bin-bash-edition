export type DirectorState = 'CALM' | 'WATCHING' | 'WARNING' | 'AMBUSH' | 'PRESSURE' | 'RECOVERY';

export const DIRECTOR_STATE_LABELS: Record<DirectorState, string> = {
  CALM: 'Calm',
  WATCHING: 'Watching',
  WARNING: 'Warning',
  AMBUSH: 'Ambush',
  PRESSURE: 'Pressure',
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
  antiCampMeterMs?: number;
}
