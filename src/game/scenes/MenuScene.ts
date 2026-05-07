import Phaser from 'phaser';
import { AudioFeedbackSystem } from '../systems/AudioFeedbackSystem';
import { getRaycastFeedbackActions } from '../raycast/RaycastFeedback';
import { getRaycastDifficultyPreset, RAYCAST_DIFFICULTY_REGISTRY_KEY } from '../raycast/RaycastDifficulty';
import { buildMainMenuLayout, getMainMenuCopy } from '../raycast/RaycastPresentation';

const MENU_BACKGROUND = 0x070b11;
const MENU_CYAN = 0x9feee2;
const MENU_CYAN_SOFT = '#9feee2';
const MENU_EMBER = 0xffb347;
const MENU_ROSE = 0xff8f7a;
const MENU_TEXT = '#d7deea';

export class MenuScene extends Phaser.Scene {
  private inputListenersRegistered = false;
  private audioFeedback!: AudioFeedbackSystem;

  private readonly handleStartArena = (): void => {
    this.scene.start('ArenaScene');
  };

  private readonly handleStartRaycast = (): void => {
    this.playFeedbackEvent('difficultyStart');
    const difficultyId = getRaycastDifficultyPreset(this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY)).id;
    this.scene.start('RaycastScene', { difficultyId });
  };

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const copy = getMainMenuCopy();
    const layout = buildMainMenuLayout(width, height);
    this.audioFeedback = new AudioFeedbackSystem();

    this.cameras.main.setBackgroundColor(MENU_BACKGROUND);

    this.drawBackdrop(width, height);
    this.drawTitleFrame(width, height, layout.titleFrameCenterY);

    this.add
      .text(layout.centerX, layout.titleY, copy.title, {
        fontFamily: 'monospace',
        fontSize: width <= 720 ? '22px' : '34px',
        fontStyle: '700',
        color: MENU_CYAN_SOFT,
        stroke: '#05070b',
        strokeThickness: 6,
        align: 'center',
        wordWrap: { width: width - 48 }
      })
      .setOrigin(0.5)
      .setDepth(8);

    const line3d = this.add
      .text(layout.centerX, layout.option3dY, copy.press3d, {
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: '700',
        color: MENU_CYAN_SOFT,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, this.handleStartRaycast);

    const line2d = this.add
      .text(layout.centerX, layout.option2dY, copy.press2d, {
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: '700',
        color: MENU_TEXT,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, this.handleStartArena);

    line3d.on(Phaser.Input.Events.POINTER_OVER, () => line3d.setColor('#ffffff'));
    line3d.on(Phaser.Input.Events.POINTER_OUT, () => line3d.setColor(MENU_CYAN_SOFT));
    line2d.on(Phaser.Input.Events.POINTER_OVER, () => line2d.setColor(MENU_CYAN_SOFT));
    line2d.on(Phaser.Input.Events.POINTER_OUT, () => line2d.setColor(MENU_TEXT));

    this.registerInputListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupInputListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupInputListeners, this);
  }

  private drawBackdrop(width: number, height: number): void {
    const graphics = this.add.graphics().setDepth(0);
    graphics.fillGradientStyle(0x04070b, 0x04070b, 0x131922, 0x080d13, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(1, 0x16202b, 0.3);
    for (let y = 0; y < height; y += 5) {
      graphics.lineBetween(0, y, width, y);
    }

    for (let i = 0; i < 14; i += 1) {
      const barY = 26 + i * 34;
      const barWidth = Math.round(width * (0.2 + (i % 4) * 0.13));
      const barX = i % 2 === 0 ? 0 : width - barWidth;
      const color = i % 3 === 0 ? MENU_CYAN : i % 3 === 1 ? MENU_EMBER : MENU_ROSE;
      graphics.fillStyle(color, 0.08);
      graphics.fillRect(barX, barY, barWidth, 6);
    }

    for (let i = 0; i < 28; i += 1) {
      const x = 24 + ((i * 73) % (width - 48));
      const y = 42 + ((i * 47) % (height - 84));
      const radius = i % 3 === 0 ? 2 : 1;
      const color = i % 4 < 2 ? MENU_EMBER : MENU_CYAN;
      graphics.fillStyle(color, i % 4 === 0 ? 0.34 : 0.18);
      graphics.fillCircle(x, y, radius);
    }
  }

  private drawTitleFrame(width: number, height: number, centerY: number): void {
    const graphics = this.add.graphics().setDepth(2);
    const frameWidth = Math.min(width - 120, 620);
    const frameHeight = Math.min(height * 0.2, 132);
    const frameX = width * 0.5 - frameWidth * 0.5;
    const frameY = centerY - frameHeight * 0.5;

    graphics.fillStyle(0x07101a, 0.9);
    graphics.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, 14);
    graphics.lineStyle(2, MENU_CYAN, 0.45);
    graphics.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, 14);
    graphics.lineStyle(1, MENU_EMBER, 0.25);
    graphics.strokeRoundedRect(frameX + 8, frameY + 8, frameWidth - 16, frameHeight - 16, 10);
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    const kb = this.input.keyboard;
    kb?.once('keydown-A', this.handleStartRaycast);
    kb?.once('keydown-a', this.handleStartRaycast);
    kb?.once('keydown-B', this.handleStartArena);
    kb?.once('keydown-b', this.handleStartArena);
    this.inputListenersRegistered = true;
  }

  private cleanupInputListeners(): void {
    if (!this.inputListenersRegistered) return;
    const kb = this.input.keyboard;
    kb?.off('keydown-A', this.handleStartRaycast);
    kb?.off('keydown-a', this.handleStartRaycast);
    kb?.off('keydown-B', this.handleStartArena);
    kb?.off('keydown-b', this.handleStartArena);
    this.inputListenersRegistered = false;
  }

  private playFeedbackEvent(event: 'difficultySelect' | 'difficultyStart'): void {
    getRaycastFeedbackActions(event).forEach((action) => {
      this.audioFeedback.play(action.cue, action.intensity, this.time.now + (action.delayMs ?? 0));
    });
  }
}
