import Phaser from 'phaser';
import type { Team } from '../types/game';
import type { WeaponKind } from '../systems/WeaponTypes';

const PROJECTILE_LIFETIME_MS = 1800;
const PROJECTILE_BOUNDS_PADDING = 24;

interface ProjectileOptions {
  ownerTeam: Team;
  damage: number;
  lifetimeMs?: number;
  width?: number;
  height?: number;
  tint?: number;
  explosionRadius?: number;
  weaponKind?: WeaponKind;
}

export class Projectile extends Phaser.Physics.Arcade.Image {
  damage = 10;
  ownerTeam: Team;
  weaponKind: WeaponKind = 'PISTOL';
  explosionRadius = 0;
  private readonly createdAt: number;
  private readonly lifetimeMs: number;

  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number, options: ProjectileOptions) {
    super(scene, x, y, '__WHITE');
    this.ownerTeam = options.ownerTeam;
    this.damage = options.damage;
    this.weaponKind = options.weaponKind ?? 'PISTOL';
    this.explosionRadius = options.explosionRadius ?? 0;
    this.lifetimeMs = options.lifetimeMs ?? PROJECTILE_LIFETIME_MS;
    this.createdAt = scene.time.now;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(options.width ?? 12, options.height ?? 6);
    this.setTint(options.tint ?? 0xfff29e);
    this.setAlpha(0.96);
    this.setVelocity(vx, vy);
    this.setRotation(Math.atan2(vy, vx));
  }

  update(time: number): void {
    if (time - this.createdAt > this.lifetimeMs || this.isOutsideArenaBounds()) {
      this.destroy();
    }
  }

  private isOutsideArenaBounds(): boolean {
    const bounds = this.scene.physics.world.bounds;
    return (
      this.x < bounds.x - PROJECTILE_BOUNDS_PADDING ||
      this.x > bounds.right + PROJECTILE_BOUNDS_PADDING ||
      this.y < bounds.y - PROJECTILE_BOUNDS_PADDING ||
      this.y > bounds.bottom + PROJECTILE_BOUNDS_PADDING
    );
  }
}
