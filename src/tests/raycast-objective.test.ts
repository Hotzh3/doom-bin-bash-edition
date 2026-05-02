import { describe, expect, it } from 'vitest';
import {
  buildRaycastCurrentObjective,
  buildRaycastHintText,
  buildRaycastInstructionText
} from '../game/raycast/RaycastObjective';

describe('raycast objective helpers', () => {
  it('builds clear objective labels for each progression stage', () => {
    expect(
      buildRaycastCurrentObjective({
        levelComplete: false,
        keyCount: 0,
        keyTotal: 1,
        closedDoorCount: 1,
        activatedTriggerCount: 0,
        requiredTriggerCount: 1,
        livingEnemyCount: 0,
        playerStationaryMs: 0
      })
    ).toBe('FIND KEY');

    expect(
      buildRaycastCurrentObjective({
        levelComplete: false,
        keyCount: 1,
        keyTotal: 1,
        closedDoorCount: 1,
        activatedTriggerCount: 0,
        requiredTriggerCount: 1,
        livingEnemyCount: 0,
        playerStationaryMs: 0
      })
    ).toBe('OPEN DOOR');

    expect(
      buildRaycastCurrentObjective({
        levelComplete: false,
        keyCount: 1,
        keyTotal: 1,
        closedDoorCount: 0,
        activatedTriggerCount: 0,
        requiredTriggerCount: 1,
        livingEnemyCount: 2,
        playerStationaryMs: 0
      })
    ).toBe('SURVIVE AMBUSH');

    expect(
      buildRaycastCurrentObjective({
        levelComplete: false,
        keyCount: 1,
        keyTotal: 1,
        closedDoorCount: 0,
        activatedTriggerCount: 1,
        requiredTriggerCount: 1,
        livingEnemyCount: 0,
        playerStationaryMs: 0
      })
    ).toBe('REACH EXIT');
  });

  it('builds contextual blocked and anti-stall hints', () => {
    expect(
      buildRaycastHintText({
        levelComplete: false,
        keyCount: 0,
        keyTotal: 1,
        closedDoorCount: 1,
        activatedTriggerCount: 0,
        requiredTriggerCount: 1,
        livingEnemyCount: 0,
        playerStationaryMs: 0,
        recentBlockedReason: 'door-key'
      })
    ).toContain('MISSING SIGNAL');

    expect(
      buildRaycastHintText({
        levelComplete: false,
        keyCount: 1,
        keyTotal: 1,
        closedDoorCount: 0,
        activatedTriggerCount: 0,
        requiredTriggerCount: 1,
        livingEnemyCount: 0,
        playerStationaryMs: 0,
        recentBlockedReason: 'exit-trigger'
      })
    ).toContain('FINAL BREACH');

    expect(
      buildRaycastHintText({
        levelComplete: false,
        keyCount: 1,
        keyTotal: 1,
        closedDoorCount: 0,
        activatedTriggerCount: 1,
        requiredTriggerCount: 1,
        livingEnemyCount: 2,
        playerStationaryMs: 0,
        recentBlockedReason: 'exit-combat'
      })
    ).toContain('CLEAR THE ACTIVE HOSTILES');

    expect(
      buildRaycastHintText({
        levelComplete: false,
        keyCount: 1,
        keyTotal: 1,
        closedDoorCount: 0,
        activatedTriggerCount: 1,
        requiredTriggerCount: 1,
        livingEnemyCount: 0,
        playerStationaryMs: 9500
      })
    ).toContain('CUT FOR THE EXIT');
  });

  it('keeps the onboarding instructions concise and actionable', () => {
    const instructions = buildRaycastInstructionText();

    expect(instructions).toContain('MOVE WASD');
    expect(instructions).toContain('FIRE F/SPACE/CLICK');
    expect(instructions).toContain('SWITCH 1/2/3');
    expect(instructions).toContain('MAP M');
  });
});
