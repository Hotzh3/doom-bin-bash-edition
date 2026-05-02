export interface RaycastHudState {
  health: number;
  weaponLabel: string;
  keyCount: number;
  keyTotal: number;
  secretCount: number;
  secretTotal: number;
  objective: string;
  criticalMessage?: string;
}

export function formatRaycastObjectiveLabel(objective: string): string {
  const normalized = objective.trim().toUpperCase();
  if (normalized === 'FIND TOKEN') return 'TOKEN';
  if (normalized === 'OPEN GATE') return 'GATE';
  if (normalized === 'EXPECT AMBUSH') return 'AMBUSH';
  if (normalized === 'EXIT READY') return 'EXIT';
  return normalized;
}

export function buildRaycastHudLine(state: RaycastHudState): string {
  const healthLabel = state.health <= 30 ? `HP ${state.health} CRIT` : `HP ${state.health}`;
  return [
    healthLabel,
    `WPN ${state.weaponLabel}`,
    `TOK ${state.keyCount}/${state.keyTotal}`,
    `SEC ${state.secretCount}/${state.secretTotal}`,
    `OBJ ${formatRaycastObjectiveLabel(state.objective)}`,
    state.criticalMessage ? `MSG ${state.criticalMessage}` : null
  ]
    .filter((part): part is string => part !== null)
    .join(' | ');
}

export interface RaycastDebugHudState {
  position: string;
  directorLine: string;
  message: string;
}

export function buildRaycastDebugLine(state: RaycastDebugHudState): string {
  return [`POS ${state.position}`, state.directorLine, `MSG ${state.message}`].join(' | ');
}
