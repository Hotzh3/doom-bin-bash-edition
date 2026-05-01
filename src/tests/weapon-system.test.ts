import { describe, expect, it } from 'vitest';
import { WEAPON_CONFIG, WEAPON_ORDER } from '../game/systems/WeaponConfig';
import { createProjectileSpawns, WeaponSystem } from '../game/systems/WeaponSystem';

describe('WeaponSystem', () => {
  it('defines three distinct weapon roles', () => {
    expect(WEAPON_ORDER).toEqual(['PISTOL', 'SHOTGUN', 'LAUNCHER']);
    expect(WEAPON_CONFIG.PISTOL.cooldownMs).toBeLessThan(WEAPON_CONFIG.SHOTGUN.cooldownMs);
    expect(WEAPON_CONFIG.SHOTGUN.pelletCount).toBeGreaterThan(WEAPON_CONFIG.PISTOL.pelletCount);
    expect(WEAPON_CONFIG.LAUNCHER.damage).toBeGreaterThan(WEAPON_CONFIG.PISTOL.damage);
    expect(WEAPON_CONFIG.LAUNCHER.explosionRadius).toBeGreaterThan(0);
  });

  it('switches weapons by slot', () => {
    const weapons = new WeaponSystem();

    weapons.switchBySlot(2);
    expect(weapons.getCurrentWeapon()).toBe('SHOTGUN');

    weapons.switchBySlot(3);
    expect(weapons.getCurrentWeapon()).toBe('LAUNCHER');
  });

  it('enforces per-weapon cooldown', () => {
    const weapons = new WeaponSystem();
    const firstShot = weapons.fire({
      ownerTeam: 'P1',
      origin: { x: 100, y: 100 },
      direction: { x: 1, y: 0 },
      time: 1000
    });

    expect(firstShot).not.toBeNull();
    expect(
      weapons.fire({
        ownerTeam: 'P1',
        origin: { x: 100, y: 100 },
        direction: { x: 1, y: 0 },
        time: 1040
      })
    ).toBeNull();
  });

  it('creates shotgun spread projectiles', () => {
    const projectiles = createProjectileSpawns({
      ownerTeam: 'P1',
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      weaponKind: 'SHOTGUN'
    });

    expect(projectiles).toHaveLength(WEAPON_CONFIG.SHOTGUN.pelletCount);
    expect(projectiles[0].vy).toBeLessThan(0);
    expect(projectiles.at(-1)?.vy).toBeGreaterThan(0);
  });

  it('keeps pistol precise and launcher explosive', () => {
    const pistol = createProjectileSpawns({
      ownerTeam: 'P1',
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      weaponKind: 'PISTOL'
    });
    const launcher = createProjectileSpawns({
      ownerTeam: 'P1',
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      weaponKind: 'LAUNCHER'
    });

    expect(pistol).toHaveLength(1);
    expect(pistol[0].vy).toBe(0);
    expect(launcher[0].explosionRadius).toBe(WEAPON_CONFIG.LAUNCHER.explosionRadius);
  });
});
