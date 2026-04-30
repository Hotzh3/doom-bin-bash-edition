import Phaser from 'phaser';
import type { Team } from '../types/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = 100;
  alive = true;
  kills = 0;
  team: Team;
  speed = 180;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, team: Team) {
    super(scene, x, y, '__WHITE');
    this.team = team;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(26, 26);
    this.setTint(color);
    this.setCollideWorldBounds(true);
  }
}
