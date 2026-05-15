import type { EnemyKind } from '../types/game';
import { ENEMY_TACTICAL_ROLE_ABBR, getEnemyConfig } from '../entities/enemyConfig';

export interface RaycastHudState {
  health: number;
  weaponLabel: string;
  difficultyLabel?: string;
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
    return { ratio, tone: 'critical', color: '#ff1f48', accentColor: 0xff2248 };
  }
  if (ratio <= 0.5) {
    return { ratio, tone: 'low', color: '#ff8f2e', accentColor: 0xff9420 };
  }
  return { ratio, tone: 'stable', color: '#58f2e4', accentColor: 0x58f2e4 };
}

export function buildRaycastPlayerHealthLine(state: RaycastPlayerHealthState): string {
  const maxHealth = state.maxHealth ?? 100;
  const visual = getRaycastHealthVisualState(state.health, maxHealth);
  const statusLabel = visual.tone === 'critical' ? 'CRITICAL' : visual.tone === 'low' ? 'LOW' : 'STABLE';
  const wholeHealth = Math.floor(Math.max(0, Math.min(state.health, maxHealth)));
  return `HP ${wholeHealth}/${maxHealth} ${statusLabel}`;
}

export function formatRaycastEnemyKindLabel(kind: EnemyKind): string {
  if (kind === 'GRUNT') return 'SCAV';
  if (kind === 'BRUTE') return 'BRUTE';
  if (kind === 'STALKER') return 'STALK';
  if (kind === 'SCRAMBLER') return 'SCRAM';
  if (kind === 'FLASHER') return 'FLASH';
  return 'TURRET';
}

/** Short codename + tactical role tag for focused HUD / crosshair (raycast balance profile). */
export function formatRaycastEnemyTargetLabel(kind: EnemyKind): string {
  const roleAbbr = ENEMY_TACTICAL_ROLE_ABBR[getEnemyConfig(kind, 'raycast').tacticalRole];
  return `${formatRaycastEnemyKindLabel(kind)}·${roleAbbr}`;
}

export function buildRaycastFocusedEnemyLine(state: RaycastFocusedEnemyState): string {
  const label =
    state.label ??
    (state.kind !== undefined ? formatRaycastEnemyTargetLabel(state.kind) : formatRaycastEnemyTargetLabel('GRUNT'));
  const posture = state.isTelegraphing ? 'EMERGE' : state.isWindingUp ? 'ARMED' : 'LOCKED';
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

/** Infinity glyph when no concrete ammo slice is injected into the status builder. */
export function formatRaycastHudAmmunitionCount(): string {
  return '∞';
}

export interface RaycastHudStatusAmmo {
  current: number;
  capacity: number;
  reloading: boolean;
}

export function buildRaycastHudLine(state: RaycastHudState): string {
  const healthLabel = buildRaycastPlayerHealthLine({ health: state.health })
    .replace(' CRITICAL', ' CRIT')
    .replace(' STABLE', '')
    .replace(' LOW', ' LOW');
  const ammo = formatRaycastHudAmmunitionCount();
  return [
    healthLabel,
    `MUNICIÓN ${ammo}/${ammo}`,
    `ARMA ${state.weaponLabel}`,
    state.difficultyLabel ? `MOD ${state.difficultyLabel}` : null,
    `FICHAS ${state.keyCount}/${state.keyTotal}`,
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
  difficultyLabel?: string;
  keyCount: number;
  keyTotal: number;
  secretCount: number;
  secretTotal: number;
  objective: string;
  criticalMessage?: string;
}

export function buildRaycastHudStatusLine(
  health: number,
  maxHealth: number,
  weaponLabel: string,
  difficultyLabel?: string,
  ammo?: RaycastHudStatusAmmo
): string {
  const ammoStr = ammo
    ? `${ammo.current}/${ammo.capacity}${ammo.reloading ? ' RECARGANDO' : ''}`
    : `${formatRaycastHudAmmunitionCount()}/${formatRaycastHudAmmunitionCount()}`;
  return [
    buildRaycastPlayerHealthLine({ health, maxHealth }),
    `MUNICIÓN ${ammoStr}`,
    weaponLabel.trim().length > 0 ? `ARMA ${weaponLabel}` : null,
    difficultyLabel ? `MOD ${difficultyLabel}` : null
  ]
    .filter((part): part is string => part !== null)
    .join('  |  ');
}

/** Secondary HUD strip (warm tone) — tokens/secrets only; objective lives in pause menu. */
export function buildRaycastHudProgressLine(keyCount: number, keyTotal: number, secretCount: number, secretTotal: number): string {
  return [`FICHAS ${keyCount}/${keyTotal}`, `SECRETOS ${secretCount}/${secretTotal}`].join('  |  ');
}

/** Hide center headline stack during gameplay; banners stay for overlays/menus elsewhere. */
export function shouldSuppressRaycastCenterHudBanner(input: {
  playerAlive: boolean;
  levelComplete: boolean;
  gamePaused: boolean;
  endScreenVisible: boolean;
}): boolean {
  if (input.gamePaused || input.endScreenVisible) return true;
  return Boolean(input.playerAlive && !input.levelComplete);
}

export function buildRaycastMinimapLegendLine(minimapToggleKey = 'M'): string {
  return `MAP ${minimapToggleKey}  |  KEY token  LOCK gate  OPEN gate  EXIT exfil  BOSS core  PURP flash`;
}

export function buildRaycastScoreHudLine(score: number, highScore: number): string {
  const safeScore = Math.max(0, Math.floor(score));
  const safeHi = Math.max(0, Math.floor(highScore));
  return `SCORE ${safeScore}  |  HI ${safeHi}`;
}

export function buildRaycastHudLayout(width: number, height: number): RaycastHudLayout {
  const compactTopRightCluster = width <= 960 || height <= 540;
  const hudRightX = width - 16;
  const healthBarWidth = 168;
  const healthBarTrackHeight = 10;
  const healthBarFillHeight = 6;
  const minimapFrameWidth = compactTopRightCluster ? 220 : 266;
  const minimapFrameHeight = compactTopRightCluster ? 172 : 212;
  const minimapPanelWidth = compactTopRightCluster ? 200 : 242;
  const minimapPanelHeight = compactTopRightCluster ? 150 : 184;
  const minimapFrameX = width - 16 - minimapFrameWidth * 0.5;
  const minimapFrameTop = compactTopRightCluster ? 126 : 114;
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
    minimapTitleWidth: compactTopRightCluster ? 108 : 122,
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
    buildRaycastHudStatusLine(state.health, 100, state.weaponLabel, state.difficultyLabel),
    buildRaycastHudProgressLine(state.keyCount, state.keyTotal, state.secretCount, state.secretTotal)
  ];

  if (state.criticalMessage) {
    lines.push(`ALERT ${state.criticalMessage}`);
  }

  return lines;
}
