import { RAYCAST_PALETTE } from '../raycast/RaycastPalette';
import type { BalanceProfile } from '../types/BalanceProfile';
import type { WeaponConfig, WeaponKind } from './WeaponTypes';

export const WEAPON_ORDER: WeaponKind[] = ['PISTOL', 'SHOTGUN', 'LAUNCHER'];

const BASE_WEAPON_CONFIG: Record<WeaponKind, WeaponConfig> = {
  PISTOL: {
    kind: 'PISTOL',
    label: 'Pistol',
    cooldownMs: 120,
    damage: 14,
    projectileSpeed: 680,
    projectileLifetimeMs: 900,
    projectileSize: { width: 12, height: 5 },
    projectileTint: 0xfff29e,
    pelletCount: 1,
    spreadRadians: 0,
    aimToleranceRadians: 0.13,
    explosionRadius: 0,
    ammoCapacity: 10,
    reloadMs: 980
  },
  SHOTGUN: {
    kind: 'SHOTGUN',
    label: 'Shotgun',
    cooldownMs: 620,
    damage: 13,
    projectileSpeed: 590,
    projectileLifetimeMs: 320,
    projectileSize: { width: 10, height: 4 },
    projectileTint: 0xff8a3d,
    pelletCount: 9,
    spreadRadians: 0.76,
    aimToleranceRadians: 0.21,
    explosionRadius: 0,
    ammoCapacity: 2,
    reloadMs: 1360
  },
  LAUNCHER: {
    kind: 'LAUNCHER',
    label: 'Launcher',
    cooldownMs: 1050,
    damage: 58,
    projectileSpeed: 390,
    projectileLifetimeMs: 1200,
    projectileSize: { width: 20, height: 12 },
    projectileTint: 0x9feee2,
    pelletCount: 1,
    spreadRadians: 0,
    aimToleranceRadians: 0.12,
    explosionRadius: 110,
    ammoCapacity: 1,
    reloadMs: 1120
  }
};

function cloneWeaponConfigRecord(config: Record<WeaponKind, WeaponConfig>): Record<WeaponKind, WeaponConfig> {
  return {
    PISTOL: freezeWeaponConfig(config.PISTOL),
    SHOTGUN: freezeWeaponConfig(config.SHOTGUN),
    LAUNCHER: freezeWeaponConfig(config.LAUNCHER)
  };
}

function freezeWeaponConfig(config: WeaponConfig): WeaponConfig {
  return Object.freeze({
    ...config,
    projectileSize: Object.freeze({ ...config.projectileSize })
  });
}

export const ARENA_WEAPON_CONFIG = cloneWeaponConfigRecord(BASE_WEAPON_CONFIG);
export const RAYCAST_WEAPON_CONFIG = cloneWeaponConfigRecord({
  ...BASE_WEAPON_CONFIG,
  PISTOL: {
    ...BASE_WEAPON_CONFIG.PISTOL,
    cooldownMs: 108,
    damage: 15,
    aimToleranceRadians: 0.095
  },
  SHOTGUN: {
    ...BASE_WEAPON_CONFIG.SHOTGUN,
    cooldownMs: 680,
    damage: 22,
    pelletCount: 10,
    spreadRadians: 0.92,
    aimToleranceRadians: 0.24
  },
  LAUNCHER: {
    ...BASE_WEAPON_CONFIG.LAUNCHER,
    cooldownMs: 1120,
    damage: 87,
    projectileSpeed: 365,
    explosionRadius: 122,
    projectileTint: RAYCAST_PALETTE.plasmaBright
  }
});

export const WEAPON_CONFIG = ARENA_WEAPON_CONFIG;

const WEAPON_CONFIG_BY_PROFILE: Record<BalanceProfile, Record<WeaponKind, WeaponConfig>> = {
  arena: ARENA_WEAPON_CONFIG,
  raycast: RAYCAST_WEAPON_CONFIG
};

export function getWeaponConfig(kind: WeaponKind, profile: BalanceProfile = 'arena'): WeaponConfig {
  return WEAPON_CONFIG_BY_PROFILE[profile][kind];
}
