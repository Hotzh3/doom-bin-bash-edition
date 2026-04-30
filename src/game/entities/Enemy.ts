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
  private readonly baseTint: number;
  private hitFlashEvent?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind = 'GRUNT') {
    super(scene, x, y, '__WHITE');
    const config = getEnemyConfig(kind);
    this.kind = kind;
    this.health = config.health;
    this.speed = config.speed;
    this.damage = config.damage;
    this.baseTint = config.color;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(config.size, config.size);
    this.setTint(this.baseTint);
    this.setAlpha(0.98);
  }

  flashHit(): void {
    if (!this.alive) return;
    this.hitFlashEvent?.remove(false);
    this.setTint(0xffffff);
    this.hitFlashEvent = this.scene.time.delayedCall(80, () => {
      if (this.alive) this.setTint(this.baseTint);
    });
  }

  markDefeated(): void {
    this.hitFlashEvent?.remove(false);
    this.setVisible(false);
    this.disableBody(true, true);
  }
}
