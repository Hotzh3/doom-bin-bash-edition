import type { EnemyKind } from '../types/game';
import type { DirectorState } from './DirectorState';

export type DirectorEventType =
  | 'AMBIENT_PULSE'
  | 'WARNING_MESSAGE'
  | 'PREPARE_AMBUSH'
  | 'SPAWN_PRESSURE'
  | 'RECOVERY_SIGNAL'
  | 'PUNISH_STATIONARY';

export interface DirectorEvent {
  type: DirectorEventType;
  state: DirectorState;
  message: string;
  time: number;
  spawnKind?: EnemyKind;
}
