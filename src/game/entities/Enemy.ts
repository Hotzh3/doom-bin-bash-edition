import Phaser from 'phaser';
import { EnemyFSM } from '../systems/EnemyFSM';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  health = 60;
  alive = true;
  speed = 95;
  fsm = new EnemyFSM();
  lastAttack = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '__WHITE');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(24, 24);
    this.setTint(0xff4444);
  }
}
