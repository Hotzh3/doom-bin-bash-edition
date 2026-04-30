import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    const centerX = this.scale.width * 0.5;
    const centerY = this.scale.height * 0.5;

    this.cameras.main.setBackgroundColor('#090d14');

    this.add
      .text(centerX, centerY - 105, 'DOOM-INSPIRED ARENA', {
        fontSize: '54px',
        fontStyle: '700',
        color: '#ff5b6f',
        stroke: '#16080d',
        strokeThickness: 8
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 12, 'P1 WASD + F  |  P2 ARROWS + L  |  R RESTART', {
        fontSize: '20px',
        color: '#d2d9e6'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 82, 'PRESS SPACE TO START', {
        fontSize: '30px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#111317',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('ArenaScene'));
  }
}
