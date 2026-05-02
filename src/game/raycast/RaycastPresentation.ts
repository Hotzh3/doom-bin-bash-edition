export interface RaycastEpisodeBannerInput {
  currentLevelNumber: number;
  totalLevels: number;
  levelName: string;
}

export interface RaycastOverlayHintInput {
  currentLevelNumber: number;
  canAdvance: boolean;
  episodeComplete: boolean;
}

export interface RaycastMenuCopy {
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
}

export function buildRaycastEpisodeBanner(input: RaycastEpisodeBannerInput): string {
  return [
    `EP 1 MINI EPISODE`,
    `LVL ${input.currentLevelNumber}/${input.totalLevels} ${input.levelName.toUpperCase()}`,
    'MOVE WASD',
    'TURN MOUSE/QE/ARROWS',
    'FIRE F/SPACE/CLICK',
    'WEAPONS 1/2/3',
    'M MAP',
    'R RESTART',
    'N NEXT WHEN CLEAR',
    'TAB DEBUG'
  ].join('  |  ');
}

export function buildRaycastOverlayHint(input: RaycastOverlayHintInput): string {
  if (input.episodeComplete) return 'R REPLAY FINALE  |  ESC MENU';
  if (input.canAdvance) return `N NEXT LEVEL  |  R RESTART L${input.currentLevelNumber}  |  ESC MENU`;
  return `R RESTART L${input.currentLevelNumber}  |  ESC MENU`;
}

export function buildRaycastStatusMessage(levelComplete: boolean, episodeComplete: boolean, playerAlive: boolean): string {
  if (levelComplete) {
    return episodeComplete
      ? 'Episode clear. Press R to replay the finale or ESC for menu.'
      : 'Level clear. Press N for next level, R to replay, or ESC for menu.';
  }
  if (playerAlive) return 'Sweep the sector. Keep moving.';
  return 'Signal lost. Press R to retry or ESC for menu.';
}

export function getRaycastMenuCopy(): RaycastMenuCopy {
  return {
    title: 'ORIGINAL RAYCAST FPS',
    subtitle: 'EP 1: TWO-LEVEL HORROR RUN  |  MOVE WASD  |  TURN MOUSE/QE/ARROWS  |  FIRE F/SPACE/CLICK',
    primaryAction: 'SPACE START EPISODE 1',
    secondaryAction: 'A OPEN 2D ARENA SANDBOX'
  };
}
