import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { PrologueScene } from './scenes/PrologueScene';
import { RaycastScene } from './scenes/RaycastScene';
import { RaycastWorldLockedScene } from './scenes/RaycastWorldLockedScene';
import { SettingsScene } from './scenes/SettingsScene';

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
  scene: [MenuScene, SettingsScene, PrologueScene, RaycastScene, RaycastWorldLockedScene]
};
