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
  preferredRange?: number;
  projectileSpeed?: number;
  behaviorHint: 'MELEE_BASIC' | 'MELEE_HEAVY' | 'MELEE_PRESSURE' | 'RANGED_PRESSURE';
}

export const ENEMY_KINDS: EnemyKind[] = ['GRUNT', 'BRUTE', 'STALKER', 'RANGED'];

export const ENEMY_CONFIG: Record<EnemyKind, EnemyConfig> = {
  GRUNT: {
    kind: 'GRUNT',
    health: 60,
    speed: 112,
    damage: 8,
    color: 0xff4f5f,
    size: 28,
    attackRange: 38,
    detectionRange: 900,
    attackCooldownMs: 620,
    behaviorHint: 'MELEE_BASIC'
  },
  BRUTE: {
    kind: 'BRUTE',
    health: 145,
    speed: 82,
    damage: 18,
    color: 0xd5793f,
    size: 34,
    attackRange: 46,
    detectionRange: 900,
    attackCooldownMs: 900,
    behaviorHint: 'MELEE_HEAVY'
  },
  STALKER: {
    kind: 'STALKER',
    health: 38,
    speed: 205,
    damage: 7,
    color: 0xb865ff,
    size: 24,
    attackRange: 34,
    detectionRange: 900,
    attackCooldownMs: 430,
    behaviorHint: 'MELEE_PRESSURE'
  },
  RANGED: {
    kind: 'RANGED',
    health: 48,
    speed: 92,
    damage: 9,
    color: 0x48d6c9,
    size: 26,
    attackRange: 270,
    detectionRange: 900,
    attackCooldownMs: 1150,
    preferredRange: 190,
    projectileSpeed: 360,
    behaviorHint: 'RANGED_PRESSURE'
  }
};

export function getEnemyConfig(kind: EnemyKind): EnemyConfig {
  return ENEMY_CONFIG[kind];
}
