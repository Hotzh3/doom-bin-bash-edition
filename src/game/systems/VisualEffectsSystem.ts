import { Enemy } from '../entities/Enemy';
import { palette } from '../theme/palette';
import type { SpawnRequest } from './GameDirector';

type CombatShakeKind = 'PLAYER_HIT' | 'ENEMY_DEATH';

interface MuzzleFlashOptions {
  color?: number;
  width?: number;
  height?: number;
}

export class VisualEffectsSystem {
  private lastCombatShakeAt = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  createMuzzleFlash(x: number, y: number, directionX: number, options: MuzzleFlashOptions = {}): void {
    const flash = this.scene.add.rectangle(
      x + directionX * 8,
      y,
      options.width ?? 14,
      options.height ?? 8,
      options.color ?? palette.accent.projectile
    );
    flash.setAlpha(0.86);
    flash.setDepth(8);
    this.scene.time.delayedCall(45, () => flash.destroy());
  }

  createImpactSpark(x: number, y: number, color: number = palette.accent.projectile): void {
    const spark = this.scene.add.circle(x, y, 6, color, 0.82);
    spark.setDepth(9);
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 0.35,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy()
    });
  }

  createExplosion(x: number, y: number, radius: number): void {
    const blast = this.scene.add.circle(x, y, radius, palette.accent.ember, 0.18);
    blast.setStrokeStyle(2, palette.accent.projectile, 0.75);
    blast.setDepth(9);
    this.scene.tweens.add({
      targets: blast,
      alpha: 0,
      scale: 1.35,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => blast.destroy()
    });
  }

  telegraphEnemySpawn(spawn: SpawnRequest, onComplete: () => void): void {
    const marker = this.scene.add.circle(spawn.x, spawn.y, 18, palette.accent.infernal, 0.18);
    marker.setStrokeStyle(2, palette.accent.ember, 0.9);
    marker.setDepth(7);

    this.scene.tweens.add({
      targets: marker,
      alpha: 0.62,
      scale: 1.35,
      yoyo: true,
      repeat: 2,
      duration: 120,
      ease: 'Sine.easeInOut'
    });

    this.scene.time.delayedCall(720, () => {
      marker.destroy();
      onComplete();
    });
  }

  triggerCombatShake(kind: CombatShakeKind): void {
    const now = this.scene.time.now;
    if (now - this.lastCombatShakeAt < 120) return;

    this.lastCombatShakeAt = now;
    const duration = kind === 'PLAYER_HIT' ? 90 : 70;
    const intensity = kind === 'PLAYER_HIT' ? 0.0024 : 0.0018;
    this.scene.cameras.main.shake(duration, intensity);
  }

  createEnemyDeathBurst(enemy: Enemy): void {
    const burstColor = this.getEnemyBurstColor(enemy);

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const particle = this.scene.add.circle(enemy.x, enemy.y, 3, burstColor);
      particle.setAlpha(0.88);
      particle.setDepth(9);

      this.scene.tweens.add({
        targets: particle,
        x: enemy.x + Math.cos(angle) * 22,
        y: enemy.y + Math.sin(angle) * 22,
        alpha: 0,
        scale: 0.35,
        duration: 180,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private getEnemyBurstColor(enemy: Enemy): number {
    if (enemy.kind === 'BRUTE') return palette.enemy.brute;
    if (enemy.kind === 'STALKER') return palette.enemy.stalker;
    return palette.enemy.grunt;
  }
}
