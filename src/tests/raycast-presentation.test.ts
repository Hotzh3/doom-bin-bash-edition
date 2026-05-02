import { describe, expect, it } from 'vitest';
import {
  buildRaycastEpisodeBanner,
  buildRaycastOverlayHint,
  buildRaycastStatusMessage,
  getRaycastMenuCopy
} from '../game/raycast/RaycastPresentation';

describe('raycast presentation helpers', () => {
  it('builds a banner that presents the mini episode and controls', () => {
    const banner = buildRaycastEpisodeBanner({
      currentLevelNumber: 2,
      totalLevels: 2,
      levelName: 'Lower Relay'
    });

    expect(banner).toContain('EP 1 MINI EPISODE');
    expect(banner).toContain('LVL 2/2 LOWER RELAY');
    expect(banner).toContain('MOVE WASD');
    expect(banner).toContain('N NEXT WHEN CLEAR');
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

  it('marks the raycast episode as primary and arena as secondary in the menu copy', () => {
    const copy = getRaycastMenuCopy();

    expect(copy.title).toBe('ORIGINAL RAYCAST FPS');
    expect(copy.subtitle).toContain('EP 1: TWO-LEVEL HORROR RUN');
    expect(copy.primaryAction).toBe('SPACE START EPISODE 1');
    expect(copy.secondaryAction).toBe('A OPEN 2D ARENA SANDBOX');
  });
});
