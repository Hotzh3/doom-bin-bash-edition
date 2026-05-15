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

export function formatRaycastPauseMenuBody(volumePct: number, selectionIndex: number): string {
  const lines = RAYCAST_PAUSE_MENU_LABELS.map((label, i) => {
    const prefix = i === selectionIndex ? '> ' : '  ';
    return `${prefix}${label}`;
  });
  return [
    '// SISTEMA EN PAUSA — ENTRADA BLOQUEADA',
    `VOLUMEN MAESTRO ${volumePct}%`,
    '',
    ...lines,
    '',
    '// ARRIBA/ABAJO seleccionar · ENTER confirmar · ESC reanudar'
  ].join('\n');
}
