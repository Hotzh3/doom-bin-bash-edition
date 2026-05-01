import Phaser from 'phaser';
import type { Team } from '../types/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = 100;
  alive = true;
  kills = 0;
  team: Team;
  speed = 225;
  private readonly baseTint: number;
  private hitFlashEvent?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, team: Team) {
    super(scene, x, y, '__WHITE');
    this.team = team;
    this.baseTint = color;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(30, 30);
    this.setTint(this.baseTint);
    this.setAlpha(0.98);
    this.setCollideWorldBounds(true);
  }

  flashHit(): void {
    if (!this.alive) return;
    this.hitFlashEvent?.remove(false);
    this.setTint(0xffffff);
    this.hitFlashEvent = this.scene.time.delayedCall(90, () => {
      if (this.alive) this.setTint(this.baseTint);
    });
  }

  markDefeated(): void {
    this.hitFlashEvent?.remove(false);
    this.setTint(0x666666);
    this.setVelocity(0, 0);
  }
}
