import type { Team } from '../types/game';
import type { MovementVector } from './MovementSystem';

export type WeaponKind = 'PISTOL' | 'SHOTGUN' | 'LAUNCHER';

export interface WeaponConfig {
  kind: WeaponKind;
  label: string;
  cooldownMs: number;
  damage: number;
  projectileSpeed: number;
  projectileLifetimeMs: number;
  projectileSize: {
    width: number;
    height: number;
  };
  projectileTint: number;
  pelletCount: number;
  spreadRadians: number;
  aimToleranceRadians: number;
  explosionRadius: number;
}

export interface WeaponFireInput {
  ownerTeam: Team;
  origin: MovementVector;
  direction: MovementVector;
  time: number;
}

export interface ProjectileSpawn {
  ownerTeam: Team;
  weaponKind: WeaponKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  lifetimeMs: number;
  width: number;
  height: number;
  tint: number;
  explosionRadius: number;
}

export interface WeaponFireResult {
  weapon: WeaponConfig;
  projectiles: ProjectileSpawn[];
}
