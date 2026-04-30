import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    this.add.text(240, 180, 'DOOM-INSPIRED ARENA', { fontSize: '42px', color: '#ff5555' });
    this.add.text(260, 260, 'Press SPACE to Start', { fontSize: '24px', color: '#ffffff' });
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('ArenaScene'));
  }
}
