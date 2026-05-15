import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { RAYCAST_CSS_WORLD2, RAYCAST_PALETTE } from '../raycast/RaycastPalette';

/** Pantalla de bloqueo cuando no está disponible el arco del Mundo 2. */
export class RaycastWorldLockedScene extends Phaser.Scene {
  constructor() {
    super('RaycastWorldLockedScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(RAYCAST_PALETTE.voidBlack);

    this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.38, 'ESTRATO ABISAL — SEÑAL AUSENTE', {
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
        'EL ARCO DE GRIETA DEL MUNDO 2 NO ESTÁ EN ESTA VERSIÓN — LLEGARÁ CUANDO SE INTEGRE EL PAQUETE DEL ESTRATO',
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
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.72, 'Pulsa ESC o ENTER para ir al menú principal', {
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
