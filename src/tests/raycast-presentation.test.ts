import { describe, expect, it } from 'vitest';
import {
  buildRaycastMenuLayout,
  buildRaycastEpisodeBanner,
  buildRaycastHelpOverlayText,
  buildRaycastOverlayHint,
  buildRaycastPriorityMessage,
  buildRaycastStatusMessage,
  getRaycastMenuCopy,
  RAYCAST_MENU_FOOTER_HEIGHT,
  RAYCAST_MENU_HELP_LINE_HEIGHT
} from '../game/raycast/RaycastPresentation';

function expectLowerMenuContentSeparation(width: number, height: number) {
  const layout = buildRaycastMenuLayout(width, height);
  const helpLineCount = width <= 720 ? 2 : 1;
  const helpHalfHeight = (helpLineCount * RAYCAST_MENU_HELP_LINE_HEIGHT) * 0.5;
  const secondaryBottom = layout.secondaryActionY + layout.actionHeight;
  const helpTop = layout.helpTextY - helpHalfHeight;
  const helpBottom = layout.helpTextY + helpHalfHeight;
  const footerTop = layout.footerY - RAYCAST_MENU_FOOTER_HEIGHT * 0.5;

  expect(layout.secondaryActionY).toBeGreaterThan(layout.primaryActionY + layout.actionHeight);
  expect(secondaryBottom).toBeLessThan(helpTop);
  expect(helpBottom).toBeLessThan(footerTop);

  return layout;
}

describe('raycast presentation helpers', () => {
  it('builds a banner that presents the mini episode and controls', () => {
    const banner = buildRaycastEpisodeBanner({
      currentLevelNumber: 2,
      totalLevels: 2,
      levelName: 'Lower Relay'
    });

    expect(banner).toContain('EP 1 MINI EPISODE');
    expect(banner).toContain('LVL 2/2 LOWER RELAY');
    expect(banner).not.toContain('MOVE WASD');
  });

  it('builds clear overlay hints for both next-level and finale states', () => {
    expect(
      buildRaycastOverlayHint({
        currentLevelNumber: 1,
        canAdvance: true,
        episodeComplete: false
      })
    ).toBe('N NEXT LEVEL  |  R RESTART L1  |  ESC MENU');

    expect(
      buildRaycastOverlayHint({
        currentLevelNumber: 2,
        canAdvance: false,
        episodeComplete: true
      })
    ).toBe('R REPLAY FINALE  |  ESC MENU');
  });

  it('builds status copy for play, clear, and death states', () => {
    expect(buildRaycastStatusMessage(false, false, true)).toBe('Sweep the sector. Keep moving.');
    expect(buildRaycastStatusMessage(true, false, true)).toBe('Level clear. Press N for next level, R to replay, or ESC for menu.');
    expect(buildRaycastStatusMessage(true, true, true)).toBe('Episode clear. Press R to replay the finale or ESC for menu.');
    expect(buildRaycastStatusMessage(false, false, false)).toBe('Signal lost. Press R to retry or ESC for menu.');
  });

  it('builds a quick help overlay with the expected control reminders', () => {
    const help = buildRaycastHelpOverlayText();

    expect(help).toContain('MOVE // WASD');
    expect(help).toContain('FIRE // F, SPACE, CLICK');
    expect(help).toContain('WEAPONS // 1, 2, 3');
    expect(help).toContain('MAP // M');
    expect(help).toContain('INTERACT // WALK INTO GATES, LOCKS, AND EXIT NODES');
    expect(help).toContain('ARENA / 2D // AVAILABLE FROM THE MENU AS THE FALLBACK MODE');
    expect(help).toContain('H OR ? // TOGGLE THIS HELP');
  });

  it('prioritizes critical health and blocked objective warnings over routine hints', () => {
    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 18,
        objective: 'FIND KEY',
        hint: 'FOLLOW THE OFF-PATH SIGNAL.',
        combatMessage: 'HOSTILE PROCESS HIT',
        combatMessageActive: true,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'CRITICAL HEALTH. BREAK CONTACT OR FORCE THE OBJECTIVE.',
      tone: 'critical'
    });

    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 72,
        objective: 'FIND KEY',
        hint: 'TOKEN LOCKED. SWEEP THE SIDE ROUTE.',
        combatMessage: 'HOSTILE PROCESS HIT',
        combatMessageActive: true,
        blockedHintActive: true
      })
    ).toEqual({
      text: 'TOKEN LOCKED. SWEEP THE SIDE ROUTE.',
      tone: 'warning'
    });
  });

  it('falls back from combat alerts to exit and routine guidance when pressure is low', () => {
    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 80,
        objective: 'REACH EXIT',
        hint: 'EXIT NODE IS LIVE. FINISH THE ROUTE.',
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'EXIT NODE LIVE. CUT TO EXTRACTION.',
      tone: 'info'
    });

    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 80,
        objective: 'OPEN DOOR',
        hint: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
      tone: 'routine'
    });
  });

  it('marks the raycast episode as primary and arena as secondary in the menu copy', () => {
    const copy = getRaycastMenuCopy();

    expect(copy.title).toBe('BIN BASH EDITION');
    expect(copy.subtitle).toContain('TERMINAL CORRUPTION');
    expect(copy.episodeTagline).toContain('EPISODE 01');
    expect(copy.primaryAction.keyHint).toBe('SPACE / ENTER');
    expect(copy.primaryAction.label).toBe('START RAYCAST / FPS');
    expect(copy.secondaryAction.keyHint).toBe('A');
    expect(copy.secondaryAction.label).toBe('OPEN ARENA / 2D');
    expect(copy.helpActions).toContain('FIRE // F, SPACE, CLICK');
    expect(copy.footerHint).toBe('CLICK A PANEL OR PRESS A KEY TO DEPLOY');
  });

  it('keeps the 960x540 menu layout clear between the secondary panel, help text, and footer', () => {
    const layout = expectLowerMenuContentSeparation(960, 540);

    expect(layout.centerX).toBe(480);
    expect(layout.actionWidth).toBeGreaterThanOrEqual(320);
    expect(layout.primaryActionY).toBeGreaterThan(layout.episodeTagY);
  });

  it('keeps lower menu content separated on nearby compact and large viewports', () => {
    const layouts = [
      { width: 854, height: 480 },
      { width: 1280, height: 720 }
    ];

    for (const { width, height } of layouts) {
      const layout = expectLowerMenuContentSeparation(width, height);

      expect(layout.primaryActionY).toBeGreaterThan(layout.episodeTagY);
    }
  });

  it('keeps compact lower menu content separated on very short <=720 wide viewports', () => {
    const layouts = [
      { width: 640, height: 360 },
      { width: 720, height: 405 }
    ];

    for (const { width, height } of layouts) {
      expectLowerMenuContentSeparation(width, height);
    }
  });
});
