import Phaser from 'phaser';
import { EnemyFSM } from '../systems/EnemyFSM';
import type { EnemyKind } from '../types/game';
import { getEnemyConfig } from './enemyConfig';

interface EnemyVisualPart {
  shape: Phaser.GameObjects.Shape;
  offsetX: number;
  offsetY: number;
}

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
  private readonly visualParts: EnemyVisualPart[] = [];

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
    this.createSilhouetteParts();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.syncSilhouetteParts();
  }

  flashHit(): void {
    if (!this.alive) return;
    this.hitFlashEvent?.remove(false);
    this.setTint(0xffffff);
    this.setSilhouetteTint(0xffffff);
    this.hitFlashEvent = this.scene.time.delayedCall(80, () => {
      if (!this.alive) return;
      this.setTint(this.baseTint);
      this.setSilhouetteTint(this.baseTint);
    });
  }

  markDefeated(): void {
    this.hitFlashEvent?.remove(false);
    this.destroySilhouetteParts();
    this.setVisible(false);
    this.disableBody(true, true);
  }

  private createSilhouetteParts(): void {
    if (this.kind === 'BRUTE') {
      this.addVisualPart(this.scene.add.rectangle(this.x - 21, this.y, 8, 24, this.baseTint), -21, 0);
      this.addVisualPart(this.scene.add.rectangle(this.x + 21, this.y, 8, 24, this.baseTint), 21, 0);
    }

    if (this.kind === 'STALKER') {
      this.addVisualPart(this.scene.add.triangle(this.x, this.y - 17, 0, 8, 8, -7, -8, -7, this.baseTint), 0, -17);
      this.addVisualPart(this.scene.add.triangle(this.x, this.y + 17, 0, -8, 8, 7, -8, 7, this.baseTint), 0, 17);
    }

    if (this.kind === 'RANGED') {
      this.addVisualPart(this.scene.add.circle(this.x, this.y, 8, this.baseTint), 0, 0);
      this.addVisualPart(this.scene.add.rectangle(this.x, this.y, 36, 5, this.baseTint), 0, 0);
    }
  }

  private addVisualPart(shape: Phaser.GameObjects.Shape, offsetX: number, offsetY: number): void {
    shape.setAlpha(0.92);
    shape.setDepth(this.depth + 1);
    this.visualParts.push({ shape, offsetX, offsetY });
  }

  private syncSilhouetteParts(): void {
    this.visualParts.forEach((part) => {
      part.shape.setPosition(this.x + part.offsetX, this.y + part.offsetY);
      part.shape.setDepth(this.depth + 1);
    });
  }

  private setSilhouetteTint(color: number): void {
    this.visualParts.forEach((part) => part.shape.setFillStyle(color, 0.92));
  }

  private destroySilhouetteParts(): void {
    this.visualParts.forEach((part) => part.shape.destroy());
    this.visualParts.length = 0;
  }
}
