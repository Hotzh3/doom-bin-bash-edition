export interface RaycastEpisodeBannerInput {
  currentLevelNumber: number;
  totalLevels: number;
  levelName: string;
  /** World 2 arc banner (replaces EP 1 line when set). */
  worldTwoSector?: { index: number; total: number };
  /** World 3 arc banner — checked before World 2 when both could apply (mutually exclusive levels). */
  worldThreeSector?: { index: number; total: number };
}

export interface RaycastOverlayHintInput {
  currentLevelNumber: number;
  canAdvance: boolean;
  episodeComplete: boolean;
  /** Episode finale (boss) cleared — World 2 placeholder available. */
  finaleBossCleared?: boolean;
  /** True only when World 2 content is not shipped (W-key teaser). */
  worldTwoLocked?: boolean;
  /** Boss down and next sector is World 2 — emphasize N continue. */
  continueToWorldTwo?: boolean;
  /** World 2 finale cleared and next sector is World 3 — emphasize N continue. */
  continueToWorldThree?: boolean;
  masteryUnlocked?: boolean;
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
  worldTwoLocked?: boolean;
  fullArcClear?: boolean;
  /** When continuing from Episode 1 boss into World 2 — colder transition copy */
  worldTwoTransition?: boolean;
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

export interface RaycastLevelStartObjectiveInput {
  objective: string;
  hasBoss?: boolean;
  keyTotal?: number;
  livingEnemyCount?: number;
}

/** Strings and vertical placement for the boot MenuScene. */
export interface MainMenuCopy {
  title: string;
  press3d: string;
}

export interface MainMenuLayout {
  centerX: number;
  titleY: number;
  option3dY: number;
  /** Center Y for the decorative frame behind the title */
  titleFrameCenterY: number;
}

/** Death overlay — distinct voice from sector-clear screens (still terminal / horror). */
export function buildRaycastDeathOverlaySummary(levelDisplayLine: string): string[] {
  return [
    'ENLACE CAÍDO',
    'El corredor rompió tu ruta. Ajusta movimiento y prioridades para sobrevivir.',
    levelDisplayLine
  ];
}

export function buildRaycastDeathOverlayHint(): string {
  return 'R REINTENTAR SECTOR  |  ESC MENÚ PRINCIPAL';
}

export function buildRaycastEpisodeBanner(input: RaycastEpisodeBannerInput): string {
  if (input.worldThreeSector) {
    return `WORLD 3 // EMBER MERIDIAN — THIRD HELL  |  SECTOR ${input.worldThreeSector.index}/${input.worldThreeSector.total}  ${input.levelName.toUpperCase()}`;
  }
  if (input.worldTwoSector) {
    return `WORLD 2 // ABYSS STRATUM — GLASS ABYSS, NOT THE FORGE  |  SECTOR ${input.worldTwoSector.index}/${input.worldTwoSector.total}  ${input.levelName.toUpperCase()}`;
  }
  return `EP 1 // CINDER FORGE STRATUM  |  LVL ${input.currentLevelNumber}/${input.totalLevels} ${input.levelName.toUpperCase()}`;
}

export function buildRaycastOverlayHint(input: RaycastOverlayHintInput): string {
  if (input.episodeComplete && input.masteryUnlocked) {
    return 'SEÑAL VERDADERA DESBLOQUEADA  |  R REPETIR FINAL  |  ESC MENÚ';
  }
  if (input.episodeComplete && input.finaleBossCleared && input.worldTwoLocked) {
    return 'W MUNDO 2 (BLOQUEADO)  |  R REPETIR JEFE  |  ESC MENÚ';
  }
  if (!input.episodeComplete && input.finaleBossCleared && input.continueToWorldThree) {
    return 'N CONTINUAR A MUNDO 3 — MERIDIANA ASCUA  |  R REINICIAR SECTOR  |  ESC MENÚ';
  }
  if (!input.episodeComplete && input.finaleBossCleared && input.continueToWorldTwo) {
    return 'N CONTINUAR A MUNDO 2  |  R REPETIR JEFE  |  ESC MENÚ';
  }
  if (input.episodeComplete) return 'R REPETIR FINAL  |  ESC MENÚ';
  if (input.canAdvance) return `N CONTINUAR  |  R REINICIAR SECTOR  |  ESC MENÚ`;
  return `R REINICIAR SECTOR  |  ESC MENÚ`;
}

export function buildRaycastMasteryEndingLines(input: {
  episodeComplete: boolean;
  fullArcClear: boolean;
  masteryUnlocked: boolean;
  impossibleModeUnlocked: boolean;
  hiddenChallengeHookUnlocked: boolean;
}): string[] {
  if (!input.episodeComplete || !input.fullArcClear) return [];
  if (!input.masteryUnlocked) {
    return ['FINAL NORMAL // SEÑAL CONTENIDA', 'META DE MAESTRÍA // OBTÉN S O SS EN TODOS LOS SECTORES'];
  }
  const lines = [
    'FINAL SEÑAL VERDADERA // MALLA NÚCLEO ESTABILIZADA',
    'FINAL SECRETO // EL ECO CORRUPTO AÚN LLAMA DESDE ABAJO',
    'EXTRACCIÓN COMPLETA // NAVE REPARADA, SEÑAL RESTAURADA, COMPLEJO SOBREVIVIDO'
  ];
  if (input.impossibleModeUnlocked) lines.push('DESBLOQUEO // MODO IMPOSIBLE');
  if (input.hiddenChallengeHookUnlocked) lines.push('GANCHO // NODO DE DESAFÍO FINAL ACTIVADO');
  return lines;
}

export function buildRaycastStatusMessage(
  levelComplete: boolean,
  episodeComplete: boolean,
  playerAlive: boolean,
  finaleBossCleared = false,
  worldTwoLocked = true,
  fullArcClear = false,
  worldTwoTransition = false
): string {
  if (levelComplete) {
    if (fullArcClear) {
      return 'Arco completo despejado — Episodio 1 + Mundo 2 + Meridiana Ascua (Mundo 3). Presiona R para reintentar o ESC para menú.';
    }
    if (episodeComplete && finaleBossCleared && worldTwoLocked) {
      return 'Jefe neutralizado. W para señal de Mundo 2, R para repetir jefe, ESC para menú.';
    }
    if (!episodeComplete && finaleBossCleared && !worldTwoLocked) {
      return worldTwoTransition
        ? 'Archon cayó — el estrato abisal se abrió. Presiona N para descender, R para repetir jefe, ESC para menú.'
        : 'Jefe neutralizado. Presiona N para descender a Mundo 2, R para repetir jefe, ESC para menú.';
    }
    return episodeComplete
      ? 'Episodio completado. Presiona R para repetir final o ESC para menú.'
      : 'Sector despejado. Presiona N para continuar, R para repetir o ESC para menú.';
  }
  if (playerAlive) return 'Barre el sector. Mantente en movimiento.';
  return 'Señal perdida. Presiona R para reintentar o ESC para menú.';
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
    'MOVER // WASD',
    'GIRAR // MOUSE, QE, FLECHAS',
    'DISPARO // F, ESPACIO, CLICK',
    'ARMAS // 1, 2, 3',
    `MAPA // ${minimapToggleKey}`,
    'INTERACTUAR // CAMINA SOBRE PORTONES, CERRADURAS Y SALIDAS',
    'REINICIO / MENÚ // R REINICIAR, ESC MENÚ',
    'DEPURAR // TAB',
    difficultyLine,
    'MENÚ TÍTULO // A INICIAR OPERACIÓN',
    'H O ? // MOSTRAR/OCULTAR AYUDA'
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
      text: buildRaycastStatusMessage(
        true,
        input.episodeComplete,
        true,
        Boolean(input.finaleBossCleared),
        input.worldTwoLocked !== false,
        Boolean(input.fullArcClear),
        Boolean(input.worldTwoTransition)
      ),
      tone: 'info'
    };
  }

  if (input.playerHealth <= 25) {
    return {
      text:
        input.lowHealthHint ??
        (input.objective === 'REACH EXIT'
          ? 'VIDA CRÍTICA. LA SALIDA ESTÁ ABIERTA, EMPUJA EXTRACCIÓN YA.'
          : 'VIDA CRÍTICA. ROMPE CONTACTO O FUERZA EL OBJETIVO.'),
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
      text: input.lowHealthHint ?? 'VIDA BAJA. MUÉVETE Y EVITA INTERCAMBIAR DAÑO.',
      tone: 'warning'
    };
  }

  if (input.objective === 'REACH EXIT') {
    return {
      text: 'NODO DE SALIDA ACTIVO. CORTA RUTA A EXTRACCIÓN.',
      tone: 'info'
    };
  }

  return {
    text: input.hint,
    tone: 'routine'
  };
}

export function buildRaycastLevelStartObjectiveMessage(input: RaycastLevelStartObjectiveInput): string {
  const objective = input.objective.trim().toUpperCase();
  if (input.hasBoss) return 'OBJETIVO // DERROTA AL JEFE Y EXTRAE.';
  if (objective === 'FIND KEY' || objective === 'FIND TOKEN') return 'OBJETIVO // RECUPERA LA LLAVE Y ESCAPA.';
  if (objective === 'OPEN DOOR' || objective === 'OPEN GATE') return 'OBJETIVO // ABRE LA COMPUERTA Y AVANZA.';
  if (objective === 'SURVIVE AMBUSH') {
    return (input.livingEnemyCount ?? 0) > 0
      ? 'OBJETIVO // ELIMINA TODOS LOS HOSTILES.'
      : 'OBJETIVO // SOBREVIVE A LA EMBOSCADA Y EXTRAE.';
  }
  if (objective === 'REACH EXIT' || objective === 'EXIT READY') return 'OBJETIVO // LLEGA AL PUNTO DE EXTRACCIÓN.';
  return input.keyTotal && input.keyTotal > 0
    ? 'OBJETIVO // RECUPERA LA LLAVE Y ESCAPA.'
    : 'OBJETIVO // AVANZA A EXTRACCIÓN.';
}

export function getMainMenuCopy(): MainMenuCopy {
  return {
    title: 'DOOM BIN BASH EDITION',
    press3d: 'A / ENTER: INICIAR'
  };
}

export interface PrologueCopy {
  missionBlock: string;
  objectiveBlock: string;
  controlsBlock: string;
  continueLine: string;
  backLine: string;
}

/** Pantalla previa limpia para la corrida raycast. */
export function getPrologueCopy(): PrologueCopy {
  return {
    missionBlock: 'MISIÓN:\nRecupera la señal perdida dentro del complejo abandonado.',
    objectiveBlock: 'OBJETIVO:\nSobrevive y alcanza la extracción.',
    controlsBlock: 'CONTROLES:\nWASD mover\nMouse apuntar\n1/2/3 armas\nR recargar\nESC pausa',
    continueLine: '[ ENTER PARA INICIAR ]',
    backLine: '[ ESC PARA VOLVER AL MENÚ ]'
  };
}

export function buildMainMenuLayout(width: number, height: number): MainMenuLayout {
  const centerX = width * 0.5;
  const shortViewport = width <= 720 || height <= 405;
  const titleY = Math.round(height * (shortViewport ? 0.4 : 0.42));
  const titleToFirstLine = shortViewport ? 52 : 58;
  const option3dY = titleY + titleToFirstLine;
  const titleFrameCenterY = titleY - Math.round(titleToFirstLine * 0.22);

  return {
    centerX,
    titleY,
    option3dY,
    titleFrameCenterY
  };
}
