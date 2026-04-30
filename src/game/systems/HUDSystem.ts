import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class HUDSystem {
  private text: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(12, 8, '', { fontSize: '16px', color: '#ffffff' });
  }

  update(p1: Player, p2: Player, enemiesKilled: number): void {
    this.text.setText(
      `P1 HP: ${p1.health} K: ${p1.kills} | P2 HP: ${p2.health} K: ${p2.kills} | Enemies: ${enemiesKilled}`
    );
  }
}
