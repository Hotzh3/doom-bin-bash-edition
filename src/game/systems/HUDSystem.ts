import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class HUDSystem {
  private text: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(14, 12, '', {
      fontSize: '18px',
      fontStyle: '700',
      color: '#f7fbff',
      backgroundColor: '#09111acc',
      stroke: '#06080c',
      strokeThickness: 3,
      padding: { x: 10, y: 6 }
    });
    this.text.setDepth(20);
  }

  update(p1: Player, p2: Player, enemiesKilled: number): void {
    this.text.setText(
      `P1 HP: ${p1.health} K: ${p1.kills} | P2 HP: ${p2.health} K: ${p2.kills} | Enemies: ${enemiesKilled}`
    );
  }
}
