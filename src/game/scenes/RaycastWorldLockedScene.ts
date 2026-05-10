import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { RAYCAST_CSS_WORLD2, RAYCAST_PALETTE } from '../raycast/RaycastPalette';

/** Placeholder when Episode 2 / World 2 is not built yet. */
export class RaycastWorldLockedScene extends Phaser.Scene {
  constructor() {
    super('RaycastWorldLockedScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(RAYCAST_PALETTE.voidBlack);

    this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.38, 'ABYSS STRATUM — SIGNAL ABSENT', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: '700',
        color: RAYCAST_CSS_WORLD2.accentText,
        align: 'center'
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH * 0.5,
        GAME_HEIGHT * 0.52,
        'WORLD 2 RIFT ARC NOT PRESENT IN THIS BUILD — SHIPS WHEN STRATUM DATA IS BUNDLED',
        {
          fontFamily: 'monospace',
          fontSize: '15px',
          fontStyle: '700',
          color: RAYCAST_CSS_WORLD2.bodyText,
          align: 'center',
          wordWrap: { width: GAME_WIDTH - 48 }
        }
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.72, 'Press ESC or ENTER for main menu', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: RAYCAST_CSS_WORLD2.mutedText,
        align: 'center'
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    const back = (): void => {
      this.scene.start('MenuScene');
    };
    kb?.once('keydown-ESC', back);
    kb?.once('keydown-ENTER', back);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
