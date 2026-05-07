export interface RaycastEpisodeBannerInput {
  currentLevelNumber: number;
  totalLevels: number;
  levelName: string;
}

export interface RaycastOverlayHintInput {
  currentLevelNumber: number;
  canAdvance: boolean;
  episodeComplete: boolean;
  /** Episode finale (boss) cleared — World 2 placeholder available. */
  finaleBossCleared?: boolean;
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
  finaleBossCleared?: boolean;
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

/** Strings and vertical placement for the boot MenuScene (title + two mode lines). */
export interface MainMenuCopy {
  title: string;
  press3d: string;
  press2d: string;
}

export interface MainMenuLayout {
  centerX: number;
  titleY: number;
  option3dY: number;
  option2dY: number;
  /** Center Y for the decorative frame behind the title */
  titleFrameCenterY: number;
}

export function buildRaycastEpisodeBanner(input: RaycastEpisodeBannerInput): string {
  return `EP 1 MINI EPISODE  |  LVL ${input.currentLevelNumber}/${input.totalLevels} ${input.levelName.toUpperCase()}`;
}

export function buildRaycastOverlayHint(input: RaycastOverlayHintInput): string {
  if (input.episodeComplete && input.finaleBossCleared) {
    return 'W WORLD 2 (LOCKED)  |  R REPLAY BOSS  |  ESC MENU';
  }
  if (input.episodeComplete) return 'R REPLAY FINALE  |  ESC MENU';
  if (input.canAdvance) return `N CONTINUE  |  R RESTART SECTOR  |  ESC MENU`;
  return `R RESTART SECTOR  |  ESC MENU`;
}

export function buildRaycastStatusMessage(
  levelComplete: boolean,
  episodeComplete: boolean,
  playerAlive: boolean,
  finaleBossCleared = false
): string {
  if (levelComplete) {
    if (episodeComplete && finaleBossCleared) {
      return 'Boss purged. W for World 2 signal, R to replay boss, ESC for menu.';
    }
    return episodeComplete
      ? 'Episode clear. Press R to replay the finale or ESC for menu.'
      : 'Sector clear. Press N to continue, R to replay, or ESC for menu.';
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
    'TITLE MENU // A 3D MODE  |  B 2D MODE',
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
      text: buildRaycastStatusMessage(true, input.episodeComplete, true, Boolean(input.finaleBossCleared)),
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

export function getMainMenuCopy(): MainMenuCopy {
  return {
    title: 'DOOM BIN BASH EDITION',
    press3d: 'Press A: 3D Mode',
    press2d: 'Press B: 2D Mode'
  };
}

export type PrologueGameMode = 'raycast' | 'arena';

export interface PrologueCopy {
  lines: string[];
  continueLine: string;
  backLine: string;
}

/** Terminal-style prologue shown after choosing 3D or 2D from the boot menu. */
export function getPrologueCopy(mode: PrologueGameMode): PrologueCopy {
  if (mode === 'raycast') {
    return {
      lines: [
        'You were sent to recover a dead signal under an abandoned terminal complex.',
        'Extraction failed. The buried system woke up and tagged your uplink as hostile.',
        'Five sectors now rewrite themselves between you and the core access channel.',
        'Advance fast: every loop the system learns your path and hunts harder.'
      ],
      continueLine: '// CONTINUE // SPACE  |  ENTER  |  A',
      backLine: '// BACK // ESC'
    };
  }

  return {
    lines: [
      'Simulation uplink restored.',
      'Two operators enter a corrupted combat sandbox.',
      'Survive the pressure protocol and hold signal lock.'
    ],
    continueLine: '// CONTINUE // SPACE  |  ENTER  |  B',
    backLine: '// BACK // ESC'
  };
}

export function buildMainMenuLayout(width: number, height: number): MainMenuLayout {
  const centerX = width * 0.5;
  const shortViewport = width <= 720 || height <= 405;
  const titleY = Math.round(height * (shortViewport ? 0.4 : 0.42));
  const titleToFirstLine = shortViewport ? 52 : 58;
  const lineGap = shortViewport ? 30 : 34;
  const option3dY = titleY + titleToFirstLine;
  const option2dY = option3dY + lineGap;
  const titleFrameCenterY = titleY - Math.round(titleToFirstLine * 0.22);

  return {
    centerX,
    titleY,
    option3dY,
    option2dY,
    titleFrameCenterY
  };
}
