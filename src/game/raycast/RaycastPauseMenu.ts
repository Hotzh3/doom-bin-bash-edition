/** Pause menu labels shared by RaycastScene — keeps the gameplay scene slimmer. */

export const RAYCAST_PAUSE_MENU_LABELS = [
  'Resume',
  'Restart Level',
  'Main Menu',
  'Volume Up',
  'Volume Down',
  'Toggle Minimap',
  'Toggle Debug HUD'
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
    '// SYSTEM HALT — INPUT LOCKED',
    `MASTER VOLUME ${volumePct}%`,
    '',
    ...lines,
    '',
    '// UP/DOWN select · ENTER confirm · ESC resume'
  ].join('\n');
}
