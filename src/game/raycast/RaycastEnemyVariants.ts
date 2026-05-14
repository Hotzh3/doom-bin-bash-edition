import type { EnemyConfig } from '../entities/enemyConfig';
import type { RaycastDifficultyId } from './RaycastDifficulty';
import type { RaycastLevelEventDefinition } from './RaycastLevelEventDirector';

export type RaycastEnemyVariant = 'BASE' | 'ELITE' | 'BERSERK' | 'SHIELDED' | 'EXPLODER' | 'SNIPER' | 'CORRUPTED';

export interface RaycastEnemyVariantModifiers {
  healthMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  projectileSpeedMultiplier: number;
  frontalDamageReduction: number;
  exploderBurstDamage: number;
  outlineAccent?: number;
}

const VARIANT_MODIFIERS: Record<Exclude<RaycastEnemyVariant, 'CORRUPTED'>, RaycastEnemyVariantModifiers> = {
  BASE: {
    healthMultiplier: 1,
    damageMultiplier: 1,
    speedMultiplier: 1,
    projectileSpeedMultiplier: 1,
    frontalDamageReduction: 0,
    exploderBurstDamage: 0
  },
  ELITE: {
    healthMultiplier: 1.45,
    damageMultiplier: 1.2,
    speedMultiplier: 1.06,
    projectileSpeedMultiplier: 1.08,
    frontalDamageReduction: 0,
    exploderBurstDamage: 0,
    outlineAccent: 0xffe39c
  },
  BERSERK: {
    healthMultiplier: 0.76,
    damageMultiplier: 1.08,
    speedMultiplier: 1.26,
    projectileSpeedMultiplier: 1.12,
    frontalDamageReduction: 0,
    exploderBurstDamage: 0,
    outlineAccent: 0xff6a85
  },
  SHIELDED: {
    healthMultiplier: 1.12,
    damageMultiplier: 1,
    speedMultiplier: 0.92,
    projectileSpeedMultiplier: 1,
    frontalDamageReduction: 0.42,
    exploderBurstDamage: 0,
    outlineAccent: 0x93d9ff
  },
  EXPLODER: {
    healthMultiplier: 0.78,
    damageMultiplier: 1,
    speedMultiplier: 1.22,
    projectileSpeedMultiplier: 1,
    frontalDamageReduction: 0,
    exploderBurstDamage: 14,
    outlineAccent: 0xffb778
  },
  SNIPER: {
    healthMultiplier: 0.92,
    damageMultiplier: 1.35,
    speedMultiplier: 0.78,
    projectileSpeedMultiplier: 1.2,
    frontalDamageReduction: 0,
    exploderBurstDamage: 0,
    outlineAccent: 0x9de9ff
  }
};

export function getRaycastVariantModifiers(
  variant: RaycastEnemyVariant,
  event?: Pick<RaycastLevelEventDefinition, 'effects'>,
  roll = 0.5
): RaycastEnemyVariantModifiers {
  if (variant !== 'CORRUPTED') return VARIANT_MODIFIERS[variant];

  const seed = (Math.max(0, Math.min(0.9999, roll)) + (event?.effects.enemySpeedMultiplier ?? 1) * 0.07) % 1;
  if (seed < 0.34) {
    return {
      ...VARIANT_MODIFIERS.BASE,
      speedMultiplier: 1.1,
      outlineAccent: 0xaa7dff
    };
  }
  if (seed < 0.67) {
    return {
      ...VARIANT_MODIFIERS.BASE,
      healthMultiplier: 1.18,
      outlineAccent: 0xae8dff
    };
  }
  return {
    ...VARIANT_MODIFIERS.BASE,
    damageMultiplier: 1.14,
    projectileSpeedMultiplier: 1.08,
    outlineAccent: 0xc795ff
  };
}

export function applyRaycastVariantToBaseHealth(base: EnemyConfig, variantMods: RaycastEnemyVariantModifiers): number {
  return Math.max(1, Math.round(base.health * variantMods.healthMultiplier));
}

export function getRaycastFlashDurationMs(input: {
  baseMs?: number;
  difficultyId: RaycastDifficultyId;
  directorIntensity: number;
  event: Pick<RaycastLevelEventDefinition, 'effects'>;
}): number {
  const base = input.baseMs ?? 1000;
  const difficultyMul = input.difficultyId === 'assist' ? 0.82 : input.difficultyId === 'hard' ? 1.18 : 1;
  const directorMul = 1 + Math.max(0, Math.min(6, input.directorIntensity)) * 0.045;
  const eventMul =
    1 +
    (input.event.effects.hudSignalJitter ?? 0) * 0.12 +
    (input.event.effects.blackoutPulse ? 0.08 : 0);

  return Math.max(500, Math.min(1800, Math.round(base * difficultyMul * directorMul * eventMul)));
}
