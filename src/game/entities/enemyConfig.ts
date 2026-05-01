import type { EnemyKind } from '../types/game';

export interface EnemyConfig {
  kind: EnemyKind;
  health: number;
  speed: number;
  damage: number;
  color: number;
  size: number;
  attackRange: number;
  detectionRange: number;
  attackCooldownMs: number;
  attackWindupMs: number;
  preferredRange?: number;
  projectileSpeed?: number;
  behaviorHint: 'MELEE_BASIC' | 'MELEE_HEAVY' | 'MELEE_PRESSURE' | 'RANGED_PRESSURE';
}

export const ENEMY_KINDS: EnemyKind[] = ['GRUNT', 'BRUTE', 'STALKER', 'RANGED'];

export const ENEMY_CONFIG: Record<EnemyKind, EnemyConfig> = {
  GRUNT: {
    kind: 'GRUNT',
    health: 52,
    speed: 142,
    damage: 8,
    color: 0xff4f5f,
    size: 28,
    attackRange: 42,
    detectionRange: 1000,
    attackCooldownMs: 620,
    attackWindupMs: 110,
    behaviorHint: 'MELEE_BASIC'
  },
  BRUTE: {
    kind: 'BRUTE',
    health: 190,
    speed: 74,
    damage: 20,
    color: 0xd5793f,
    size: 38,
    attackRange: 52,
    detectionRange: 950,
    attackCooldownMs: 1180,
    attackWindupMs: 210,
    behaviorHint: 'MELEE_HEAVY'
  },
  STALKER: {
    kind: 'STALKER',
    health: 30,
    speed: 255,
    damage: 7,
    color: 0xb865ff,
    size: 24,
    attackRange: 36,
    detectionRange: 1050,
    attackCooldownMs: 430,
    attackWindupMs: 80,
    behaviorHint: 'MELEE_PRESSURE'
  },
  RANGED: {
    kind: 'RANGED',
    health: 48,
    speed: 112,
    damage: 10,
    color: 0x48d6c9,
    size: 26,
    attackRange: 300,
    detectionRange: 1050,
    attackCooldownMs: 1120,
    attackWindupMs: 360,
    preferredRange: 235,
    projectileSpeed: 300,
    behaviorHint: 'RANGED_PRESSURE'
  }
};

export function getEnemyConfig(kind: EnemyKind): EnemyConfig {
  return ENEMY_CONFIG[kind];
}
