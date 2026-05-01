export type DirectorState = 'EXPLORATION' | 'BUILD_UP' | 'AMBUSH' | 'HIGH_INTENSITY' | 'RECOVERY';

export interface DirectorDebugInfo {
  enabled: boolean;
  state: DirectorState;
  intensity: number;
  enemiesAlive: number;
  spawnCooldownRemainingMs: number;
  lastDecisionReason: string;
}
