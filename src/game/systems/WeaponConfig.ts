import type { WeaponConfig, WeaponKind } from './WeaponTypes';

export const WEAPON_ORDER: WeaponKind[] = ['PISTOL', 'SHOTGUN', 'LAUNCHER'];

export const WEAPON_CONFIG: Record<WeaponKind, WeaponConfig> = {
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
    explosionRadius: 0
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
    explosionRadius: 0
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
    explosionRadius: 110
  }
};

export function getWeaponConfig(kind: WeaponKind): WeaponConfig {
  return WEAPON_CONFIG[kind];
}
