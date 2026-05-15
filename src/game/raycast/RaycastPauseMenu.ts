/** Pause menu labels shared by RaycastScene — keeps the gameplay scene slimmer. */

export const RAYCAST_PAUSE_MENU_LABELS = [
  'Reanudar',
  'Reiniciar nivel',
  'Menú principal',
  'Subir volumen',
  'Bajar volumen',
  'Alternar minimapa',
  'Alternar HUD debug'
] as const;

export type RaycastPauseMenuAction =
  | 'resume'
  | 'restart'
  | 'menu'
  | 'vol_up'
  | 'vol_down'
  | 'minimap'
  | 'debug';

export const RAYCAST_PAUSE_MENU_ACTIONS: RaycastPauseMenuAction[] = [
  'resume',
  'restart',
  'menu',
  'vol_up',
  'vol_down',
  'minimap',
  'debug'
];

const COL_W = 28;

function padCol(text: string, width: number): string {
  const t = text.length > width ? `${text.slice(0, width - 1)}…` : text;
  return t + ' '.repeat(Math.max(0, width - t.length));
}

export interface RaycastPauseMenuMxModel {
  volumePct: number;
  selectionIndex: number;
  worldLine: string;
  difficultyLabel: string;
  score: number;
  highScore: number;
  missionLine: string;
  objectiveLine: string;
  hintLine: string;
  tokensLine: string;
  secretsLine: string;
  modifiersLine: string;
}

export function formatRaycastPauseMenuMxBody(model: RaycastPauseMenuMxModel): string {
  const cRun = [
    'RUN',
    `Mundo / Nivel · ${model.worldLine}`,
    `Dificultad · ${model.difficultyLabel}`,
    `Puntaje · ${model.score}`,
    `Mejor puntaje · ${model.highScore}`,
    ''
  ];
  const cObj = ['OBJETIVO', `Misión · ${model.missionLine}`, `Objetivo · ${model.objectiveLine}`, `Pista · ${model.hintLine}`, '', ''];
  const cPro = ['PROGRESO', model.tokensLine, model.secretsLine, model.modifiersLine, '', ''];
  const cCtl = [
    'CONTROLES',
    'WASD · mover',
    'Mouse · mirar',
    '1 / 2 / 3 · armas',
    'R · recargar',
    'T · reiniciar nivel',
    'ESC · pausa'
  ];

  const rowCount = 6;
  const grid: string[] = [];
  for (let i = 0; i < rowCount; i += 1) {
    grid.push(
      [
        padCol(cRun[i] ?? '', COL_W),
        padCol(cObj[i] ?? '', COL_W),
        padCol(cPro[i] ?? '', COL_W),
        padCol(cCtl[i] ?? '', COL_W)
      ].join('  ')
    );
  }

  const menuLines = RAYCAST_PAUSE_MENU_LABELS.map((label, i) => {
    const prefix = i === model.selectionIndex ? '> ' : '  ';
    return `${prefix}${label}`;
  });

  return [
    '// PAUSA — ENTRADA BLOQUEADA',
    `VOLUMEN MAESTRO ${model.volumePct}%`,
    '',
    ...grid,
    '',
    '// MENÚ',
    ...menuLines,
    '',
    '// ↑/↓ elegir · ENTER confirmar · ESC continuar'
  ].join('\n');
}
