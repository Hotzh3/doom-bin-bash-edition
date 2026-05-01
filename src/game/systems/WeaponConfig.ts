import type { WeaponConfig, WeaponKind } from './WeaponTypes';

export const WEAPON_ORDER: WeaponKind[] = ['PISTOL', 'SHOTGUN', 'LAUNCHER'];

export const WEAPON_CONFIG: Record<WeaponKind, WeaponConfig> = {
  PISTOL: {
    kind: 'PISTOL',
    label: 'Pistol',
    cooldownMs: 150,
    damage: 13,
    projectileSpeed: 620,
    projectileLifetimeMs: 900,
    projectileSize: { width: 12, height: 5 },
    projectileTint: 0xfff29e,
    pelletCount: 1,
    spreadRadians: 0,
    explosionRadius: 0
  },
  SHOTGUN: {
    kind: 'SHOTGUN',
    label: 'Shotgun',
    cooldownMs: 620,
    damage: 10,
    projectileSpeed: 560,
    projectileLifetimeMs: 360,
    projectileSize: { width: 10, height: 4 },
    projectileTint: 0xff8a3d,
    pelletCount: 7,
    spreadRadians: 0.58,
    explosionRadius: 0
  },
  LAUNCHER: {
    kind: 'LAUNCHER',
    label: 'Launcher',
    cooldownMs: 880,
    damage: 48,
    projectileSpeed: 360,
    projectileLifetimeMs: 1200,
    projectileSize: { width: 20, height: 12 },
    projectileTint: 0x9feee2,
    pelletCount: 1,
    spreadRadians: 0,
    explosionRadius: 64
  }
};

export function getWeaponConfig(kind: WeaponKind): WeaponConfig {
  return WEAPON_CONFIG[kind];
}
