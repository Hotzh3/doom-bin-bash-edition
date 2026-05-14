import type { BalanceProfile } from '../types/BalanceProfile';
import type { EnemyKind } from '../types/game';

/** Tactical identity for HUD + director synergy docs — does not add new AI states. */
export type EnemyTacticalRole = 'PRESSURE' | 'DENIAL' | 'FLANK' | 'ZONE_DENIAL' | 'HARASS';

export const ENEMY_TACTICAL_ROLE_ABBR: Record<EnemyTacticalRole, string> = {
  PRESSURE: 'PRS',
  DENIAL: 'DEN',
  FLANK: 'FLK',
  ZONE_DENIAL: 'ZONE',
  HARASS: 'HR'
};

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
  tacticalRole: EnemyTacticalRole;
}

export const ENEMY_KINDS: EnemyKind[] = ['GRUNT', 'BRUTE', 'STALKER', 'RANGED', 'SCRAMBLER', 'FLASHER'];

const BASE_ENEMY_CONFIG: Record<EnemyKind, EnemyConfig> = {
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
    behaviorHint: 'MELEE_BASIC',
    tacticalRole: 'PRESSURE'
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
    behaviorHint: 'MELEE_HEAVY',
    tacticalRole: 'DENIAL'
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
    behaviorHint: 'MELEE_PRESSURE',
    tacticalRole: 'FLANK'
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
    behaviorHint: 'RANGED_PRESSURE',
    tacticalRole: 'ZONE_DENIAL'
  },
  SCRAMBLER: {
    kind: 'SCRAMBLER',
    health: 34,
    speed: 218,
    damage: 6,
    color: 0xff7844,
    size: 25,
    attackRange: 38,
    detectionRange: 1020,
    attackCooldownMs: 440,
    attackWindupMs: 88,
    behaviorHint: 'MELEE_PRESSURE',
    tacticalRole: 'HARASS'
  },
  FLASHER: {
    kind: 'FLASHER',
    health: 52,
    speed: 148,
    damage: 8,
    color: 0xb86dff,
    size: 27,
    attackRange: 40,
    detectionRange: 1020,
    attackCooldownMs: 780,
    attackWindupMs: 100,
    behaviorHint: 'MELEE_PRESSURE',
    tacticalRole: 'HARASS'
  }
};

function cloneEnemyConfigRecord(config: Record<EnemyKind, EnemyConfig>): Record<EnemyKind, EnemyConfig> {
  return {
    GRUNT: Object.freeze({ ...config.GRUNT }),
    BRUTE: Object.freeze({ ...config.BRUTE }),
    STALKER: Object.freeze({ ...config.STALKER }),
    RANGED: Object.freeze({ ...config.RANGED }),
    SCRAMBLER: Object.freeze({ ...config.SCRAMBLER }),
    FLASHER: Object.freeze({ ...config.FLASHER })
  };
}

export const ARENA_ENEMY_CONFIG = cloneEnemyConfigRecord(BASE_ENEMY_CONFIG);
export const RAYCAST_ENEMY_CONFIG = cloneEnemyConfigRecord({
  ...BASE_ENEMY_CONFIG,
  GRUNT: {
    ...BASE_ENEMY_CONFIG.GRUNT,
    color: 0xff5c42,
    speed: 152,
    attackCooldownMs: 560,
    size: 29
  },
  BRUTE: {
    ...BASE_ENEMY_CONFIG.BRUTE,
    color: 0xffa64d,
    speed: 78,
    attackCooldownMs: 1120,
    size: 40
  },
  STALKER: {
    ...BASE_ENEMY_CONFIG.STALKER,
    color: 0x54e898,
    speed: 268,
    attackCooldownMs: 410,
    size: 26,
    attackWindupMs: 100
  },
  RANGED: {
    ...BASE_ENEMY_CONFIG.RANGED,
    color: 0x5cefef,
    attackWindupMs: 430,
    projectileSpeed: 300,
    size: 27
  },
  SCRAMBLER: {
    ...BASE_ENEMY_CONFIG.SCRAMBLER,
    color: 0xff9058,
    speed: 242,
    attackCooldownMs: 400,
    attackWindupMs: 82,
    size: 26
  },
  FLASHER: {
    ...BASE_ENEMY_CONFIG.FLASHER,
    color: 0xc17cff,
    speed: 156,
    attackCooldownMs: 740,
    attackWindupMs: 96,
    size: 27
  }
});

export const ENEMY_CONFIG = ARENA_ENEMY_CONFIG;

const ENEMY_CONFIG_BY_PROFILE: Record<BalanceProfile, Record<EnemyKind, EnemyConfig>> = {
  arena: ARENA_ENEMY_CONFIG,
  raycast: RAYCAST_ENEMY_CONFIG
};

export function getEnemyConfig(kind: EnemyKind, profile: BalanceProfile = 'arena'): EnemyConfig {
  return ENEMY_CONFIG_BY_PROFILE[profile][kind];
}

export function getRaycastEnemyRoleAbbrev(kind: EnemyKind): string {
  return ENEMY_TACTICAL_ROLE_ABBR[getEnemyConfig(kind, 'raycast').tacticalRole];
}
