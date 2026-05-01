import { Enemy } from '../entities/Enemy';
import type { SpawnRequest } from './GameDirector';

type CombatShakeKind = 'PLAYER_HIT' | 'ENEMY_DEATH';

export class VisualEffectsSystem {
  private lastCombatShakeAt = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  createMuzzleFlash(x: number, y: number, directionX: number): void {
    const flash = this.scene.add.rectangle(x + directionX * 8, y, 14, 8, 0xfff29e);
    flash.setAlpha(0.86);
    flash.setDepth(8);
    this.scene.time.delayedCall(45, () => flash.destroy());
  }

  telegraphEnemySpawn(spawn: SpawnRequest, onComplete: () => void): void {
    const marker = this.scene.add.circle(spawn.x, spawn.y, 18, 0x9e2f3e, 0.18);
    marker.setStrokeStyle(2, 0xff8a3d, 0.9);
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
    if (enemy.kind === 'BRUTE') return 0xff8a3d;
    if (enemy.kind === 'STALKER') return 0xc17bff;
    return 0xff4f5f;
  }
}
