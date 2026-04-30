import Phaser from 'phaser';
import type { Team } from '../types/game';

export class Projectile extends Phaser.Physics.Arcade.Image {
  damage = 10;
  ownerTeam: Team;
  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number, ownerTeam: Team) {
    super(scene, x, y, '__WHITE');
    this.ownerTeam = ownerTeam;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(10, 10);
    this.setTint(0xfff29e);
    this.setAlpha(0.96);
    this.setVelocity(vx, vy);
  }
}
