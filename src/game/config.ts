import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene';
import { MenuScene } from './scenes/MenuScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#101015',
  parent: 'app',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [MenuScene, ArenaScene]
};
