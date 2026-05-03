import type { AudioFeedbackCue } from '../systems/AudioFeedbackSystem';
import {
  RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD,
  RAYCAST_LOW_HEALTH_HINT_THRESHOLD
} from './RaycastItems';

export type RaycastFeedbackEvent =
  | 'healthPickup'
  | 'healthPickupDenied'
  | 'lowHealthWarning'
  | 'difficultySelect'
  | 'difficultyStart'
  | 'doorDenied'
  | 'doorOpened'
  | 'levelComplete'
  | 'episodeComplete';

export interface RaycastFeedbackAction {
  cue: AudioFeedbackCue;
  intensity: number;
  delayMs?: number;
}

export interface RaycastLowHealthWarningInput {
  previousHealth: number;
  nextHealth: number;
  nowMs: number;
  lastWarningAtMs: number | null;
  playerAlive: boolean;
  levelComplete: boolean;
}

const RAYCAST_FEEDBACK_ACTIONS: Record<RaycastFeedbackEvent, readonly RaycastFeedbackAction[]> = {
  healthPickup: [
    { cue: 'pickupHealth', intensity: 1 },
    { cue: 'uiConfirm', intensity: 0.78, delayMs: 18 }
  ],
  healthPickupDenied: [{ cue: 'uiSoftDeny', intensity: 0.72 }],
  lowHealthWarning: [{ cue: 'lowHealthWarning', intensity: 1 }],
  difficultySelect: [{ cue: 'difficultySelect', intensity: 0.92 }],
  difficultyStart: [{ cue: 'difficultyStart', intensity: 1 }],
  doorDenied: [{ cue: 'uiDeny', intensity: 1 }],
  doorOpened: [
    { cue: 'door', intensity: 1 },
    { cue: 'uiConfirm', intensity: 0.85, delayMs: 24 }
  ],
  levelComplete: [{ cue: 'levelComplete', intensity: 1 }],
  episodeComplete: [{ cue: 'episodeComplete', intensity: 1 }]
};

const RAYCAST_LOW_HEALTH_WARNING_REPEAT_MS = 9_000;

export function getRaycastFeedbackActions(event: RaycastFeedbackEvent): readonly RaycastFeedbackAction[] {
  return RAYCAST_FEEDBACK_ACTIONS[event];
}

export function shouldPlayRaycastLowHealthWarning(input: RaycastLowHealthWarningInput): boolean {
  if (!input.playerAlive || input.levelComplete || input.nextHealth <= 0) return false;
  if (input.nextHealth > RAYCAST_LOW_HEALTH_HINT_THRESHOLD) return false;

  const crossedIntoLow = input.previousHealth > RAYCAST_LOW_HEALTH_HINT_THRESHOLD;
  const crossedIntoCritical =
    input.nextHealth <= RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD &&
    input.previousHealth > RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD;

  if (crossedIntoLow || crossedIntoCritical) return true;
  if (input.lastWarningAtMs === null) return true;
  return input.nowMs - input.lastWarningAtMs >= RAYCAST_LOW_HEALTH_WARNING_REPEAT_MS;
}

export function buildRaycastLowHealthWarningMessage(health: number): string {
  return health <= RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD
    ? 'CRITICAL INTEGRITY. FIND A REPAIR CELL.'
    : 'INTEGRITY LOW. STABILIZE BEFORE THE NEXT PUSH.';
}
