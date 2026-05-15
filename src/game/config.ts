import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';
import { MenuScene } from './scenes/MenuScene';
import { PrologueScene } from './scenes/PrologueScene';
import { RaycastScene } from './scenes/RaycastScene';
import { RaycastWorldLockedScene } from './scenes/RaycastWorldLockedScene';
import { SettingsScene } from './scenes/SettingsScene';

export { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

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
