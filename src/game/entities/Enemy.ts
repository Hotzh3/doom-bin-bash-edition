import Phaser from 'phaser';
import { EnemyFSM } from '../systems/EnemyFSM';
import type { EnemyKind } from '../types/game';
import { getEnemyConfig } from './enemyConfig';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind;
  health: number;
  alive = true;
  speed: number;
  damage: number;
  fsm = new EnemyFSM();
  lastAttack = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind = 'GRUNT') {
    super(scene, x, y, '__WHITE');
    const config = getEnemyConfig(kind);
    this.kind = kind;
    this.health = config.health;
    this.speed = config.speed;
    this.damage = config.damage;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(config.size, config.size);
    this.setTint(config.color);
    this.setAlpha(0.98);
  }
}
