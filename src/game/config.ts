import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene';
import { MenuScene } from './scenes/MenuScene';
import { RaycastScene } from './scenes/RaycastScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101015',
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [MenuScene, ArenaScene, RaycastScene]
};
