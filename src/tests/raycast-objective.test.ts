import { describe, expect, it } from 'vitest';
import {
  buildRaycastCurrentObjective,
  buildRaycastHintText,
  buildRaycastInstructionText,
  formatRaycastObjectiveHudLabel
} from '../game/raycast/RaycastObjective';

describe('raycast objective helpers', () => {
  it('maps canonical objectives to optional HUD copy without affecting logic strings', () => {
    expect(formatRaycastObjectiveHudLabel('FIND KEY', undefined)).toBe('FIND KEY');
    expect(
      formatRaycastObjectiveHudLabel('FIND KEY', {
        findKey: 'TRACE TOKEN // WEST'
      })
    ).toBe('TRACE TOKEN // WEST');
    expect(formatRaycastObjectiveHudLabel('REACH EXIT', { reachExit: 'CUT TO LIFT' })).toBe('CUT TO LIFT');
  });

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
    ).toContain('FALTA LA LLAVE');

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
    ).toContain('BRECHA FINAL');

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
    ).toContain('ELIMINA HOSTILES ACTIVOS');

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
    ).toContain('SALIDA');
  });

  it('keeps the onboarding instructions concise and actionable', () => {
    const instructions = buildRaycastInstructionText();

    expect(instructions).toContain('MOVER WASD');
    expect(instructions).toContain('DISPARAR F/ESPACIO/CLICK');
    expect(instructions).toContain('ARMAS 1/2/3');
    expect(instructions).toContain('MAPA M');
    expect(instructions).toContain('INTERACTUAR CAMINA A PUERTAS/SALIDAS');
    expect(instructions).toContain('H/? AYUDA');
  });
});
