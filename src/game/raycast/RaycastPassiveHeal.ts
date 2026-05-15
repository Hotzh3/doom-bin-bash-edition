import type { DirectorState } from '../systems/DirectorState';

export interface RaycastPassiveHealConfig {
  /** No healing until this long after the last hit (ms). */
  delayAfterDamageMs: number;
  /** Base HP per second (before combat scaling). */
  healPerSecond: number;
  maxHealth: number;
}

export const DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG: RaycastPassiveHealConfig = {
  delayAfterDamageMs: 5000,
  healPerSecond: 2,
  maxHealth: 100
};

/**
 * Scales passive healing down (or off) while the director is hot or many enemies are near.
 * Returns 0..1.
 */
export function computePassiveHealCombatScale(
  directorState: DirectorState | null,
  directorIntensity: number
): number {
  if (!directorState) return 1;
  if (directorState === 'PRESSURE' || directorState === 'AMBUSH') return 0;
  if (directorState === 'WARNING') return 0.32;
  if (directorState === 'WATCHING') {
    const pressure = Math.max(0, Math.min(1, directorIntensity / 5));
    return 0.42 + (1 - pressure) * 0.38;
  }
  if (directorState === 'RECOVERY') return 1;
  return 0.92;
}

/** Fewer living enemies => closer to 1; swarm fights suppress regeneration. */
export function computeEnemySwarmHealScale(livingEnemyCount: number): number {
  if (livingEnemyCount <= 1) return 1;
  if (livingEnemyCount === 2) return 0.55;
  if (livingEnemyCount === 3) return 0.28;
  return 0;
}

export interface TickRaycastPassiveHealInput {
  health: number;
  nowMs: number;
  lastDamageAtMs: number;
  deltaMs: number;
  config: RaycastPassiveHealConfig;
  /** Combined director + swarm multiplier in 0..1 */
  combatScale: number;
  /** Internal fractional carry for whole-number healing ticks. */
  fractionalCarry?: number;
}

export interface TickRaycastPassiveHealResult {
  nextHealth: number;
  healingThisTick: number;
  isRegenerating: boolean;
  nextFractionalCarry: number;
}

export type RaycastPassiveRegenHudState = 'hidden' | 'waiting' | 'blocked' | 'active';

export function getRaycastPassiveRegenHudState(input: {
  health: number;
  nowMs: number;
  lastDamageAtMs: number;
  config: RaycastPassiveHealConfig;
  combatScale: number;
  isRegenerating: boolean;
}): RaycastPassiveRegenHudState {
  const maxH = Math.max(1, input.config.maxHealth);
  if (input.health >= maxH) return 'hidden';
  if (input.nowMs - input.lastDamageAtMs < input.config.delayAfterDamageMs) return 'waiting';
  if (input.combatScale <= 0) return 'blocked';
  return input.isRegenerating ? 'active' : 'waiting';
}

export function formatRaycastPassiveRegenHudLabel(state: RaycastPassiveRegenHudState): string | null {
  if (state === 'active') return 'REGEN +';
  if (state === 'blocked') return 'REGEN LOCK';
  if (state === 'waiting') return 'REGEN WAIT';
  return null;
}

export function tickRaycastPassiveHeal(input: TickRaycastPassiveHealInput): TickRaycastPassiveHealResult {
  const { health, nowMs, lastDamageAtMs, deltaMs, config, combatScale } = input;
  const maxH = Math.max(1, config.maxHealth);
  const clampedHealth = Math.max(0, Math.min(health, maxH));
  const carry = Math.max(0, input.fractionalCarry ?? 0);

  if (clampedHealth >= maxH || deltaMs <= 0 || combatScale <= 0) {
    return {
      nextHealth: clampedHealth,
      healingThisTick: 0,
      isRegenerating: false,
      nextFractionalCarry: 0
    };
  }

  const sinceDamage = nowMs - lastDamageAtMs;
  if (sinceDamage < config.delayAfterDamageMs) {
    return { nextHealth: clampedHealth, healingThisTick: 0, isRegenerating: false, nextFractionalCarry: carry };
  }

  const heal = (deltaMs / 1000) * config.healPerSecond * combatScale;
  const totalHealing = carry + heal;
  const wholeHealing = Math.floor(totalHealing);
  const nextHealth = Math.min(maxH, clampedHealth + wholeHealing);
  const healingThisTick = nextHealth - clampedHealth;
  const nextFractionalCarry = nextHealth >= maxH ? 0 : Math.max(0, totalHealing - wholeHealing);

  return {
    nextHealth,
    healingThisTick,
    isRegenerating: heal > 0.0005,
    nextFractionalCarry
  };
}
