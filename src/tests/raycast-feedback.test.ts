import { describe, expect, it } from 'vitest';
import {
  buildRaycastLowHealthWarningMessage,
  getRaycastFeedbackActions,
  shouldPlayRaycastLowHealthWarning
} from '../game/raycast/RaycastFeedback';

describe('raycast feedback helpers', () => {
  it('maps authored events to concise procedural cue sequences', () => {
    expect(getRaycastFeedbackActions('healthPickup')).toEqual([
      { cue: 'pickupHealth', intensity: 1 },
      { cue: 'uiConfirm', intensity: 0.78, delayMs: 18 }
    ]);
    expect(getRaycastFeedbackActions('healthPickupDenied')).toEqual([{ cue: 'uiSoftDeny', intensity: 0.72 }]);
    expect(getRaycastFeedbackActions('difficultySelect')).toEqual([{ cue: 'difficultySelect', intensity: 0.92 }]);
    expect(getRaycastFeedbackActions('difficultyStart')).toEqual([{ cue: 'difficultyStart', intensity: 1 }]);
    expect(getRaycastFeedbackActions('doorDenied')).toEqual([{ cue: 'uiDeny', intensity: 1 }]);
    expect(getRaycastFeedbackActions('doorOpened')).toEqual([
      { cue: 'door', intensity: 1 },
      { cue: 'uiConfirm', intensity: 0.85, delayMs: 24 }
    ]);
    expect(getRaycastFeedbackActions('levelComplete')).toEqual([{ cue: 'levelComplete', intensity: 1 }]);
    expect(getRaycastFeedbackActions('episodeComplete')).toEqual([{ cue: 'episodeComplete', intensity: 1 }]);
  });

  it('warns on low-health threshold crossings and critical drops without spamming', () => {
    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 61,
        nextHealth: 47,
        nowMs: 1000,
        lastWarningAtMs: null,
        playerAlive: true,
        levelComplete: false
      })
    ).toBe(true);

    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 41,
        nextHealth: 21,
        nowMs: 1400,
        lastWarningAtMs: 1100,
        playerAlive: true,
        levelComplete: false
      })
    ).toBe(true);

    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 24,
        nextHealth: 22,
        nowMs: 2400,
        lastWarningAtMs: 1100,
        playerAlive: true,
        levelComplete: false
      })
    ).toBe(false);

    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 24,
        nextHealth: 22,
        nowMs: 10_500,
        lastWarningAtMs: 1000,
        playerAlive: true,
        levelComplete: false
      })
    ).toBe(true);
  });

  it('suppresses warnings for safe or terminal states and builds matching messages', () => {
    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 52,
        nextHealth: 51,
        nowMs: 1000,
        lastWarningAtMs: null,
        playerAlive: true,
        levelComplete: false
      })
    ).toBe(false);
    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 20,
        nextHealth: 0,
        nowMs: 1000,
        lastWarningAtMs: null,
        playerAlive: true,
        levelComplete: false
      })
    ).toBe(false);
    expect(
      shouldPlayRaycastLowHealthWarning({
        previousHealth: 20,
        nextHealth: 18,
        nowMs: 1000,
        lastWarningAtMs: null,
        playerAlive: false,
        levelComplete: false
      })
    ).toBe(false);
    expect(buildRaycastLowHealthWarningMessage(40)).toBe('INTEGRITY LOW. STABILIZE BEFORE THE NEXT PUSH.');
    expect(buildRaycastLowHealthWarningMessage(20)).toBe('CRITICAL INTEGRITY. FIND A REPAIR CELL.');
  });
});
