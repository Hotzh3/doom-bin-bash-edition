import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private inputListenersRegistered = false;

  private readonly handleStartArena = (): void => {
    this.scene.start('ArenaScene');
  };

  private readonly handleStartRaycast = (): void => {
    this.scene.start('RaycastScene');
  };

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const centerX = this.scale.width * 0.5;
    const centerY = this.scale.height * 0.5;

    this.cameras.main.setBackgroundColor('#090d14');

    this.add
      .text(centerX, centerY - 118, 'ORIGINAL RAYCAST FPS', {
        fontSize: '54px',
        fontStyle: '700',
        color: '#9feee2',
        stroke: '#16080d',
        strokeThickness: 8
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 38, 'WASD STRAFE  |  Q/E OR ARROWS TURN  |  FIRE F/SPACE/CLICK', {
        fontSize: '20px',
        color: '#d2d9e6'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 48, 'PRESS SPACE FOR RAYCAST FPS', {
        fontSize: '34px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#092c34',
        strokeThickness: 7
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 104, 'PRESS A FOR 2D ARENA SANDBOX', {
        fontSize: '22px',
        fontStyle: '700',
        color: '#ff9aa8',
        stroke: '#111317',
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.registerInputListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupInputListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupInputListeners, this);
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    this.input.keyboard?.once('keydown-SPACE', this.handleStartRaycast);
    this.input.keyboard?.once('keydown-A', this.handleStartArena);
    this.inputListenersRegistered = true;
  }

  private cleanupInputListeners(): void {
    if (!this.inputListenersRegistered) return;
    this.input.keyboard?.off('keydown-SPACE', this.handleStartRaycast);
    this.input.keyboard?.off('keydown-A', this.handleStartArena);
    this.inputListenersRegistered = false;
  }
}
