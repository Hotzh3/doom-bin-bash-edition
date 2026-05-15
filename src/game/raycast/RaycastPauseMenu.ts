/** Pause menu labels shared by RaycastScene — keeps the gameplay scene slimmer. */

export const RAYCAST_PAUSE_MENU_LABELS = [
  'Reanudar',
  'Reiniciar Nivel',
  'Menú Principal',
  'Subir Volumen',
  'Bajar Volumen',
  'Mostrar/Ocultar Minimap',
  'Mostrar/Ocultar HUD Debug'
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

export interface RaycastPauseMenuRunInfo {
  mission: string;
  objective: string;
  hint: string;
  difficulty: string;
  levelWorld: string;
  score: number;
  highScore: number;
  tokens: string;
  secrets: string;
  modifiers: string;
}

export function formatRaycastPauseMenuBody(volumePct: number, selectionIndex: number, info: RaycastPauseMenuRunInfo): string {
  const lines = RAYCAST_PAUSE_MENU_LABELS.map((label, i) => {
    const prefix = i === selectionIndex ? '> ' : '  ';
    return `${prefix}${label}`;
  });
  return [
    '// SISTEMA EN PAUSA — ENTRADA BLOQUEADA',
    `MISIÓN: ${info.mission}`,
    `OBJETIVO ACTUAL: ${info.objective}`,
    `PISTA: ${info.hint}`,
    `DIFICULTAD: ${info.difficulty}`,
    `NIVEL/MUNDO: ${info.levelWorld}`,
    `PUNTAJE: ${Math.max(0, Math.floor(info.score))}`,
    `MEJOR PUNTAJE: ${Math.max(0, Math.floor(info.highScore))}`,
    `TOKENS: ${info.tokens}`,
    `SECRETOS: ${info.secrets}`,
    `MODIFICADORES ACTIVOS: ${info.modifiers}`,
    'CONTROLES: WASD MOVER | MOUSE MIRAR | 1/2/3 ARMAS | R RECARGAR | ESC PAUSA',
    `VOLUMEN MAESTRO ${volumePct}%`,
    '',
    ...lines,
    '',
    '// ARRIBA/ABAJO seleccionar · ENTER confirmar · ESC reanudar'
  ].join('\n');
}
