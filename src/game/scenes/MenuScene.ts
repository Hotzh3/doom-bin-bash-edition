import Phaser from 'phaser';
import { getRaycastMenuCopy } from '../raycast/RaycastPresentation';

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
    const copy = getRaycastMenuCopy();

    this.cameras.main.setBackgroundColor('#090d14');

    this.add
      .text(centerX, centerY - 132, copy.title, {
        fontSize: '54px',
        fontStyle: '700',
        color: '#9feee2',
        stroke: '#16080d',
        strokeThickness: 8
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 42, copy.subtitle, {
        fontSize: '18px',
        color: '#d2d9e6',
        align: 'center',
        wordWrap: { width: this.scale.width - 96 }
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 40, copy.primaryAction, {
        fontSize: '34px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#092c34',
        strokeThickness: 7
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 88, 'PRIMARY: ORIGINAL FPS MINI EPISODE', {
        fontSize: '18px',
        fontStyle: '700',
        color: '#9feee2',
        stroke: '#111317',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 134, copy.secondaryAction, {
        fontSize: '22px',
        fontStyle: '700',
        color: '#ff9aa8',
        stroke: '#111317',
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 174, 'SECONDARY: PRESERVED 2D SYSTEMS SANDBOX', {
        fontSize: '15px',
        color: '#d2d9e6',
        stroke: '#111317',
        strokeThickness: 3
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
