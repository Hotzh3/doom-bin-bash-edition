import type { EnemyKind } from '../types/game';

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

export interface RaycastPlayerHealthState {
  health: number;
  maxHealth?: number;
}

export interface RaycastHealthVisualState {
  ratio: number;
  tone: 'stable' | 'low' | 'critical';
  color: string;
  accentColor: number;
}

export interface RaycastFocusedEnemyState {
  kind?: EnemyKind;
  label?: string;
  health: number;
  maxHealth: number;
  isWindingUp: boolean;
  isTelegraphing?: boolean;
}

export function getRaycastHealthVisualState(
  health: number,
  maxHealth = 100
): RaycastHealthVisualState {
  const clampedHealth = Math.min(Math.max(health, 0), maxHealth);
  const ratio = maxHealth <= 0 ? 0 : clampedHealth / maxHealth;
  if (ratio <= 0.25) {
    return { ratio, tone: 'critical', color: '#ff7a8a', accentColor: 0xff5b6f };
  }
  if (ratio <= 0.5) {
    return { ratio, tone: 'low', color: '#ffcf7c', accentColor: 0xffb347 };
  }
  return { ratio, tone: 'stable', color: '#9feee2', accentColor: 0x9feee2 };
}

export function buildRaycastPlayerHealthLine(state: RaycastPlayerHealthState): string {
  const maxHealth = state.maxHealth ?? 100;
  const visual = getRaycastHealthVisualState(state.health, maxHealth);
  const statusLabel = visual.tone === 'critical' ? 'CRITICAL' : visual.tone === 'low' ? 'LOW' : 'STABLE';
  return `HP ${Math.max(0, Math.min(state.health, maxHealth))}/${maxHealth} ${statusLabel}`;
}

export function formatRaycastEnemyKindLabel(kind: EnemyKind): string {
  if (kind === 'GRUNT') return 'SCAV';
  if (kind === 'BRUTE') return 'BRUTE';
  if (kind === 'STALKER') return 'STALK';
  return 'TURRET';
}

export function buildRaycastFocusedEnemyLine(state: RaycastFocusedEnemyState): string {
  const label = state.label ?? formatRaycastEnemyKindLabel(state.kind ?? 'GRUNT');
  const posture = state.isTelegraphing ? 'BREACH' : state.isWindingUp ? 'WINDUP' : 'LOCKED';
  return `TARGET ${label} ${state.health}/${state.maxHealth} ${posture}`;
}

export function formatRaycastObjectiveLabel(objective: string): string {
  const normalized = objective.trim().toUpperCase();
  if (normalized === 'FIND KEY') return 'KEY';
  if (normalized === 'OPEN DOOR') return 'DOOR';
  if (normalized === 'SURVIVE AMBUSH') return 'AMBUSH';
  if (normalized === 'REACH EXIT') return 'EXIT';
  if (normalized === 'FIND TOKEN') return 'TOKEN';
  if (normalized === 'OPEN GATE') return 'GATE';
  if (normalized === 'EXPECT AMBUSH') return 'AMBUSH';
  if (normalized === 'EXIT READY') return 'EXIT';
  return normalized;
}

export function buildRaycastHudLine(state: RaycastHudState): string {
  const healthLabel = buildRaycastPlayerHealthLine({ health: state.health })
    .replace(' CRITICAL', ' CRIT')
    .replace(' STABLE', '')
    .replace(' LOW', ' LOW');
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
