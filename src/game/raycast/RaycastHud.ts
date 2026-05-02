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

export interface RaycastHudLayout {
  healthTextX: number;
  healthTextY: number;
  weaponTextX: number;
  weaponTextY: number;
  healthBarX: number;
  healthBarY: number;
  healthBarWidth: number;
  healthBarTrackHeight: number;
  healthBarFillHeight: number;
  minimapTitleX: number;
  minimapTitleY: number;
  minimapTitleWidth: number;
  minimapTitleHeight: number;
  minimapFrameX: number;
  minimapFrameY: number;
  minimapFrameWidth: number;
  minimapFrameHeight: number;
  minimapPanelX: number;
  minimapPanelY: number;
  minimapPanelWidth: number;
  minimapPanelHeight: number;
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

export interface RaycastHudSummaryState {
  health: number;
  weaponLabel: string;
  keyCount: number;
  keyTotal: number;
  secretCount: number;
  secretTotal: number;
  objective: string;
  criticalMessage?: string;
}

export function buildRaycastHudStatusLine(health: number, weaponLabel: string): string {
  return `${buildRaycastPlayerHealthLine({ health })}  |  WPN ${weaponLabel}`;
}

export function buildRaycastHudProgressLine(
  keyCount: number,
  keyTotal: number,
  secretCount: number,
  secretTotal: number,
  objective: string
): string {
  return [
    `TOKENS ${keyCount}/${keyTotal}`,
    `SECRETS ${secretCount}/${secretTotal}`,
    `OBJECTIVE ${formatRaycastObjectiveLabel(objective)}`
  ].join('  |  ');
}

export function buildRaycastMinimapLegendLine(minimapToggleKey = 'M'): string {
  return `MAP ${minimapToggleKey}  |  KEY token  LOCK closed gate  OPEN clear gate  EXIT exfil`;
}

export function buildRaycastHudLayout(width: number, height: number): RaycastHudLayout {
  const compactTopRightCluster = width <= 960 || height <= 540;
  const hudRightX = width - 16;
  const healthBarWidth = 168;
  const healthBarTrackHeight = 10;
  const healthBarFillHeight = 6;
  const minimapFrameWidth = compactTopRightCluster ? 128 : 144;
  const minimapFrameHeight = compactTopRightCluster ? 100 : 116;
  const minimapPanelWidth = compactTopRightCluster ? 116 : 132;
  const minimapPanelHeight = compactTopRightCluster ? 82 : 98;
  const minimapFrameX = width - 16 - minimapFrameWidth * 0.5;
  const minimapFrameTop = compactTopRightCluster ? 114 : 66;
  const minimapTitleHeight = 20;
  const minimapTitleGap = compactTopRightCluster ? 12 : 6;

  return {
    healthTextX: hudRightX,
    healthTextY: 14,
    weaponTextX: hudRightX,
    weaponTextY: 40,
    healthBarX: hudRightX - healthBarWidth,
    healthBarY: 74,
    healthBarWidth,
    healthBarTrackHeight,
    healthBarFillHeight,
    minimapTitleX: minimapFrameX,
    minimapTitleY: minimapFrameTop - minimapTitleGap - minimapTitleHeight * 0.5,
    minimapTitleWidth: compactTopRightCluster ? 88 : 96,
    minimapTitleHeight,
    minimapFrameX,
    minimapFrameY: minimapFrameTop + minimapFrameHeight * 0.5,
    minimapFrameWidth,
    minimapFrameHeight,
    minimapPanelX: minimapFrameX - minimapPanelWidth * 0.5,
    minimapPanelY: minimapFrameTop + 8,
    minimapPanelWidth,
    minimapPanelHeight
  };
}

export function buildRaycastDebugLine(state: RaycastDebugHudState): string {
  return [`POS ${state.position}`, state.directorLine, `MSG ${state.message}`].join(' | ');
}

export function buildRaycastHudSummary(state: RaycastHudSummaryState): string[] {
  const lines = [
    buildRaycastHudStatusLine(state.health, state.weaponLabel),
    buildRaycastHudProgressLine(
      state.keyCount,
      state.keyTotal,
      state.secretCount,
      state.secretTotal,
      state.objective
    )
  ];

  if (state.criticalMessage) {
    lines.push(`ALERT ${state.criticalMessage}`);
  }

  return lines;
}
