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

export interface RaycastDifficultyMenuCopyInput {
  label: string;
  summary: string;
}

export interface RaycastHelpOverlayInput {
  difficultyLabel?: string;
  difficultySummary?: string;
  minimapToggleKey?: string;
}

export interface RaycastPriorityMessageInput {
  levelComplete: boolean;
  episodeComplete: boolean;
  playerAlive: boolean;
  playerHealth: number;
  objective: string;
  hint: string;
  lowHealthHint?: string | null;
  combatMessage?: string;
  combatMessageActive: boolean;
  blockedHintActive: boolean;
}

export interface RaycastPriorityMessage {
  text: string;
  tone: 'critical' | 'warning' | 'info' | 'routine';
}

export interface RaycastMenuCopy {
  title: string;
  subtitle: string;
  episodeTagline: string;
  buildTagline: string;
  difficultyLabel: string;
  difficultyHint: string;
  primaryAction: RaycastMenuActionCopy;
  secondaryAction: RaycastMenuActionCopy;
  helpActions: string[];
  footerHint: string;
}

export interface RaycastMenuActionCopy {
  keyHint: string;
  label: string;
  detail: string;
}

export interface RaycastMenuLayout {
  centerX: number;
  titleY: number;
  subtitleY: number;
  titleArtY: number;
  episodeTagY: number;
  difficultyY: number;
  actionWidth: number;
  actionHeight: number;
  actionX: number;
  primaryActionY: number;
  secondaryActionY: number;
  helpTextY: number;
  footerY: number;
}

export const RAYCAST_MENU_ACTION_HEIGHT = 84;
export const RAYCAST_MENU_COMPACT_ACTION_HEIGHT = 68;
export const RAYCAST_MENU_SHORT_ACTION_HEIGHT = 56;
export const RAYCAST_MENU_ACTION_GAP = 20;
export const RAYCAST_MENU_COMPACT_ACTION_GAP = 16;
export const RAYCAST_MENU_SHORT_ACTION_GAP = 12;
export const RAYCAST_MENU_PANEL_TO_HELP_GAP = 18;
export const RAYCAST_MENU_COMPACT_PANEL_TO_HELP_GAP = 14;
export const RAYCAST_MENU_SHORT_PANEL_TO_HELP_GAP = 10;
export const RAYCAST_MENU_HELP_TO_FOOTER_GAP = 16;
export const RAYCAST_MENU_COMPACT_HELP_TO_FOOTER_GAP = 12;
export const RAYCAST_MENU_SHORT_HELP_TO_FOOTER_GAP = 10;
export const RAYCAST_MENU_FOOTER_BOTTOM_PADDING = 18;
export const RAYCAST_MENU_COMPACT_FOOTER_BOTTOM_PADDING = 16;
export const RAYCAST_MENU_SHORT_FOOTER_BOTTOM_PADDING = 12;
export const RAYCAST_MENU_HELP_LINE_HEIGHT = 16;
export const RAYCAST_MENU_FOOTER_HEIGHT = 14;
export const RAYCAST_MENU_DIFFICULTY_LABEL_OFFSET = -14;
export const RAYCAST_MENU_DIFFICULTY_VALUE_OFFSET = 2;
export const RAYCAST_MENU_DIFFICULTY_HINT_OFFSET = 24;

export function buildRaycastEpisodeBanner(input: RaycastEpisodeBannerInput): string {
  return `EP 1 MINI EPISODE  |  LVL ${input.currentLevelNumber}/${input.totalLevels} ${input.levelName.toUpperCase()}`;
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

export function buildRaycastDifficultyMenuLine(input: RaycastDifficultyMenuCopyInput): string {
  return `DIFFICULTY // ${input.label.toUpperCase()} // ${input.summary.toUpperCase()}`;
}

export function buildRaycastHelpOverlayText(input: RaycastHelpOverlayInput = {}): string {
  const minimapToggleKey = input.minimapToggleKey ?? 'M';
  const difficultyLine =
    input.difficultyLabel && input.difficultySummary
      ? `DIFFICULTY // ${input.difficultyLabel.toUpperCase()} // ${input.difficultySummary}`
      : null;

  return [
    'MOVE // WASD',
    'TURN // MOUSE, QE, ARROWS',
    'FIRE // F, SPACE, CLICK',
    'WEAPONS // 1, 2, 3',
    `MAP // ${minimapToggleKey}`,
    'INTERACT // WALK INTO GATES, LOCKS, AND EXIT NODES',
    'RESET / MENU // R RESTART, ESC MENU',
    'DEBUG // TAB',
    difficultyLine,
    'ARENA / 2D // AVAILABLE FROM THE MENU AS THE FALLBACK MODE',
    'H OR ? // TOGGLE THIS HELP'
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function buildRaycastPriorityMessage(input: RaycastPriorityMessageInput): RaycastPriorityMessage {
  if (!input.playerAlive) {
    return {
      text: buildRaycastStatusMessage(false, false, false),
      tone: 'critical'
    };
  }

  if (input.levelComplete) {
    return {
      text: buildRaycastStatusMessage(true, input.episodeComplete, true),
      tone: 'info'
    };
  }

  if (input.playerHealth <= 25) {
    return {
      text:
        input.lowHealthHint ??
        (input.objective === 'REACH EXIT'
          ? 'CRITICAL HEALTH. EXIT IS LIVE, PUSH EXTRACTION NOW.'
          : 'CRITICAL HEALTH. BREAK CONTACT OR FORCE THE OBJECTIVE.'),
      tone: 'critical'
    };
  }

  if (input.blockedHintActive) {
    return {
      text: input.hint,
      tone: 'warning'
    };
  }

  if (input.combatMessageActive && input.combatMessage) {
    return {
      text: input.combatMessage,
      tone: 'warning'
    };
  }

  if (input.playerHealth <= 50) {
    return {
      text: input.lowHealthHint ?? 'LOW HEALTH. STAY MOBILE AND AVOID TRADING DAMAGE.',
      tone: 'warning'
    };
  }

  if (input.objective === 'REACH EXIT') {
    return {
      text: 'EXIT NODE LIVE. CUT TO EXTRACTION.',
      tone: 'info'
    };
  }

  return {
    text: input.hint,
    tone: 'routine'
  };
}

export function getRaycastMenuCopy(): RaycastMenuCopy {
  return {
    title: 'BIN BASH EDITION',
    subtitle: 'TERMINAL CORRUPTION // ORIGINAL RAYCAST ASSAULT',
    episodeTagline: 'EPISODE 01 // BREACH THE RELAY, PURGE THE NOISE',
    buildTagline: 'RAYCAST PROTOTYPE // CLEAN-ROOM UI PASS 16A',
    difficultyLabel: 'DIFFICULTY',
    difficultyHint: 'LEFT / RIGHT OR CLICK TO CYCLE',
    primaryAction: {
      keyHint: 'SPACE / ENTER',
      label: 'START RAYCAST / FPS',
      detail: 'Primary mode. Launch the original first-person mini episode.'
    },
    secondaryAction: {
      keyHint: 'A',
      label: 'OPEN ARENA / 2D',
      detail: 'Preserved 2D sandbox. Keep the classic systems and combat loop.'
    },
    helpActions: [
      'MOVE // WASD',
      'TURN // MOUSE, QE, ARROWS',
      'FIRE // F, SPACE, CLICK',
      'WEAPONS // 1, 2, 3',
      'MAP // M',
      'MENU // ESC'
    ],
    footerHint: 'CLICK A PANEL OR PRESS A KEY TO DEPLOY'
  };
}

export function buildRaycastMenuLayout(width: number, height: number): RaycastMenuLayout {
  const compactLayout = width < 900 || height < 520;
  const shortLayout = width <= 720 || height <= 405;
  const centerX = width * 0.5;
  const actionWidth = Math.min(420, Math.max(320, Math.round(width * 0.42)));
  const actionHeight = shortLayout
    ? RAYCAST_MENU_SHORT_ACTION_HEIGHT
    : compactLayout
      ? RAYCAST_MENU_COMPACT_ACTION_HEIGHT
      : RAYCAST_MENU_ACTION_HEIGHT;
  const actionGap = shortLayout
    ? RAYCAST_MENU_SHORT_ACTION_GAP
    : compactLayout
      ? RAYCAST_MENU_COMPACT_ACTION_GAP
      : RAYCAST_MENU_ACTION_GAP;
  const panelToHelpGap = shortLayout
    ? RAYCAST_MENU_SHORT_PANEL_TO_HELP_GAP
    : compactLayout
      ? RAYCAST_MENU_COMPACT_PANEL_TO_HELP_GAP
      : RAYCAST_MENU_PANEL_TO_HELP_GAP;
  const helpToFooterGap = shortLayout
    ? RAYCAST_MENU_SHORT_HELP_TO_FOOTER_GAP
    : compactLayout
      ? RAYCAST_MENU_COMPACT_HELP_TO_FOOTER_GAP
      : RAYCAST_MENU_HELP_TO_FOOTER_GAP;
  const footerBottomPadding = shortLayout
    ? RAYCAST_MENU_SHORT_FOOTER_BOTTOM_PADDING
    : compactLayout
    ? RAYCAST_MENU_COMPACT_FOOTER_BOTTOM_PADDING
    : RAYCAST_MENU_FOOTER_BOTTOM_PADDING;
  const helpLineCount = getMenuHelpLineCount(width);
  const helpHalfHeight = (helpLineCount * RAYCAST_MENU_HELP_LINE_HEIGHT) * 0.5;
  const footerHalfHeight = RAYCAST_MENU_FOOTER_HEIGHT * 0.5;
  const footerY = height - footerBottomPadding - footerHalfHeight;
  const maxHelpTextY = footerY - footerHalfHeight - helpToFooterGap - helpHalfHeight;
  const unclampedPrimaryActionY = Math.round(height * (compactLayout ? 0.49 : 0.52));
  const unclampedSecondaryActionY = unclampedPrimaryActionY + actionHeight + actionGap;
  const unclampedHelpTextY = unclampedSecondaryActionY + actionHeight + panelToHelpGap + helpHalfHeight;
  const upwardShift = Math.max(0, unclampedHelpTextY - maxHelpTextY);
  const primaryActionY = unclampedPrimaryActionY - upwardShift;
  const secondaryActionY = primaryActionY + actionHeight + actionGap;
  const helpTextY = secondaryActionY + actionHeight + panelToHelpGap + helpHalfHeight;
  const episodeTagY = Math.round(height * (shortLayout ? 0.3 : compactLayout ? 0.38 : 0.39));
  const difficultyTopGap = shortLayout ? 2 : compactLayout ? 4 : 8;
  const difficultyBottomGap = shortLayout ? 8 : compactLayout ? 10 : 12;
  const minDifficultyY = episodeTagY - RAYCAST_MENU_DIFFICULTY_LABEL_OFFSET + difficultyTopGap;
  const maxDifficultyY = primaryActionY - RAYCAST_MENU_DIFFICULTY_HINT_OFFSET - difficultyBottomGap;
  const difficultyY = Math.max(minDifficultyY, maxDifficultyY);

  return {
    centerX,
    titleY: Math.round(height * (shortLayout ? 0.11 : compactLayout ? 0.13 : 0.15)),
    subtitleY: Math.round(height * (shortLayout ? 0.17 : compactLayout ? 0.2 : 0.22)),
    titleArtY: Math.round(height * (shortLayout ? 0.25 : compactLayout ? 0.29 : 0.32)),
    episodeTagY,
    difficultyY,
    actionWidth,
    actionHeight,
    actionX: centerX - actionWidth * 0.5,
    primaryActionY,
    secondaryActionY,
    helpTextY,
    footerY
  };
}

function getMenuHelpLineCount(width: number): number {
  if (width <= 720) return 2;
  return 1;
}
