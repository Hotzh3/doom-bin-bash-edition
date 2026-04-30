import type { EnemyKind } from '../types/game';

export interface EnemyConfig {
  kind: EnemyKind;
  health: number;
  speed: number;
  damage: number;
  color: number;
  size: number;
  behaviorHint: 'MELEE_BASIC' | 'MELEE_HEAVY' | 'MELEE_PRESSURE';
}

export const ENEMY_KINDS: EnemyKind[] = ['GRUNT', 'BRUTE', 'STALKER'];

export const ENEMY_CONFIG: Record<EnemyKind, EnemyConfig> = {
  GRUNT: {
    kind: 'GRUNT',
    health: 60,
    speed: 95,
    damage: 7,
    color: 0xff4f5f,
    size: 28,
    behaviorHint: 'MELEE_BASIC'
  },
  BRUTE: {
    kind: 'BRUTE',
    health: 110,
    speed: 65,
    damage: 12,
    color: 0xd5793f,
    size: 34,
    behaviorHint: 'MELEE_HEAVY'
  },
  STALKER: {
    kind: 'STALKER',
    health: 35,
    speed: 140,
    damage: 5,
    color: 0xb865ff,
    size: 24,
    behaviorHint: 'MELEE_PRESSURE'
  }
};

export function getEnemyConfig(kind: EnemyKind): EnemyConfig {
  return ENEMY_CONFIG[kind];
}
