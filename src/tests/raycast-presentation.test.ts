import { describe, expect, it } from 'vitest';
import {
  buildRaycastDifficultyMenuLine,
  buildRaycastMenuLayout,
  buildRaycastEpisodeBanner,
  buildRaycastHelpOverlayText,
  buildRaycastOverlayHint,
  buildRaycastPriorityMessage,
  buildRaycastStatusMessage,
  getRaycastMenuCopy,
  RAYCAST_MENU_DIFFICULTY_HINT_OFFSET,
  RAYCAST_MENU_DIFFICULTY_LABEL_OFFSET,
  RAYCAST_MENU_DIFFICULTY_VALUE_OFFSET,
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

function expectDifficultyBlockSeparation(
  width: number,
  height: number,
  minimumGapAbovePrimaryAction: number
) {
  const layout = buildRaycastMenuLayout(width, height);
  const difficultyLabelY = layout.difficultyY + RAYCAST_MENU_DIFFICULTY_LABEL_OFFSET;
  const difficultyValueY = layout.difficultyY + RAYCAST_MENU_DIFFICULTY_VALUE_OFFSET;
  const difficultyHintY = layout.difficultyY + RAYCAST_MENU_DIFFICULTY_HINT_OFFSET;

  expect(difficultyLabelY).toBeGreaterThan(layout.episodeTagY);
  expect(difficultyValueY).toBeGreaterThan(difficultyLabelY);
  expect(difficultyHintY).toBeGreaterThan(difficultyValueY);
  expect(difficultyHintY).toBeLessThan(layout.primaryActionY);
  expect(layout.primaryActionY - difficultyHintY).toBeGreaterThanOrEqual(minimumGapAbovePrimaryAction);

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
    const help = buildRaycastHelpOverlayText({
      difficultyLabel: 'Assist',
      difficultySummary: 'SOFTER DAMAGE // SLOWER PRESSURE // STRONGER REPAIRS'
    });

    expect(help).toContain('MOVE // WASD');
    expect(help).toContain('FIRE // F, SPACE, CLICK');
    expect(help).toContain('WEAPONS // 1, 2, 3');
    expect(help).toContain('MAP // M');
    expect(help).toContain('INTERACT // WALK INTO GATES, LOCKS, AND EXIT NODES');
    expect(help).toContain('DIFFICULTY // ASSIST // SOFTER DAMAGE // SLOWER PRESSURE // STRONGER REPAIRS');
    expect(help).toContain('TITLE MENU // 2D: SPACE OR A');
    expect(help).toContain('H OR ? // TOGGLE THIS HELP');
  });

  it('builds compact difficulty selector copy for the menu', () => {
    expect(
      buildRaycastDifficultyMenuLine({
        label: 'Standard',
        summary: 'Baseline raycast tuning.'
      })
    ).toBe('DIFFICULTY // STANDARD // BASELINE RAYCAST TUNING.');
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
        lowHealthHint: 'CRITICAL HEALTH. REPAIR CELL NEARBY, TAKE IT NOW.',
        combatMessage: 'HOSTILE PROCESS HIT',
        combatMessageActive: true,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'CRITICAL HEALTH. REPAIR CELL NEARBY, TAKE IT NOW.',
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
        lowHealthHint: null,
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
        lowHealthHint: null,
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
        lowHealthHint: null,
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
      tone: 'routine'
    });
  });

  it('uses authored low-health hints before the generic warning copy', () => {
    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 42,
        objective: 'OPEN DOOR',
        hint: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
        lowHealthHint: 'LOW HEALTH. REPAIR CELL NEARBY, STABILIZE BEFORE THE NEXT PUSH.',
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'LOW HEALTH. REPAIR CELL NEARBY, STABILIZE BEFORE THE NEXT PUSH.',
      tone: 'warning'
    });
  });

  it('keeps the menu copy compact with explicit mode keys', () => {
    const copy = getRaycastMenuCopy();

    expect(copy.title).toBe('HELL ARENA TERMINAL');
    expect(copy.subtitle).toContain('BIN BASH');
    expect(copy.episodeTagline).toBe('');
    expect(copy.buildTagline).toBe('');
    expect(copy.difficultyLabel).toBe('DIFFICULTY');
    expect(copy.difficultyHint).toBe('LEFT / RIGHT');
    expect(copy.primaryAction.keyHint).toBe('SPACE / A');
    expect(copy.primaryAction.label).toBe('2D ARENA');
    expect(copy.secondaryAction.keyHint).toBe('R / ENTER');
    expect(copy.secondaryAction.label).toBe('RAYCAST (FPS)');
    expect(copy.helpActions).toContain('2D — SPACE OR A');
    expect(copy.helpActions).toContain('RAYCAST — R OR ENTER');
    expect(copy.footerHint).toBe('CLICK A MODE OR USE THE KEYS');
  });

  it('keeps the 960x540 menu layout clear between the secondary panel, help text, and footer', () => {
    const layout = expectLowerMenuContentSeparation(960, 540);

    expect(layout.centerX).toBe(480);
    expect(layout.actionWidth).toBeGreaterThanOrEqual(320);
    expect(layout.primaryActionY).toBeGreaterThan(layout.episodeTagY);
  });

  it('keeps the difficulty selector block between the episode tag and primary action on 960x540', () => {
    expectDifficultyBlockSeparation(960, 540, 12);
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

  it('keeps the difficulty selector block clear of the primary action on very short compact viewports', () => {
    const layouts = [
      { width: 640, height: 360, minimumGapAbovePrimaryAction: 8 },
      { width: 720, height: 405, minimumGapAbovePrimaryAction: 8 }
    ];

    for (const { width, height, minimumGapAbovePrimaryAction } of layouts) {
      expectDifficultyBlockSeparation(width, height, minimumGapAbovePrimaryAction);
    }
  });
});
