import Phaser from 'phaser';
import type { Team } from '../types/game';

const PROJECTILE_LIFETIME_MS = 1800;
const PROJECTILE_BOUNDS_PADDING = 24;

export class Projectile extends Phaser.Physics.Arcade.Image {
  damage = 10;
  ownerTeam: Team;
  private readonly createdAt: number;

  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number, ownerTeam: Team) {
    super(scene, x, y, '__WHITE');
    this.ownerTeam = ownerTeam;
    this.createdAt = scene.time.now;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(12, 6);
    this.setTint(0xfff29e);
    this.setAlpha(0.96);
    this.setVelocity(vx, vy);
  }

  update(time: number): void {
    if (time - this.createdAt > PROJECTILE_LIFETIME_MS || this.isOutsideArenaBounds()) {
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
