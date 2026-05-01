import type { EnemyKind } from '../types/game';
import type { DirectorState } from './DirectorState';

export type DirectorEventType = 'STATE_CHANGED' | 'SPAWN_REQUESTED' | 'SPAWN_BLOCKED' | 'TRIGGER_NOTIFIED';

export interface DirectorEvent {
  type: DirectorEventType;
  state: DirectorState;
  message: string;
  time: number;
  spawnKind?: EnemyKind;
}
