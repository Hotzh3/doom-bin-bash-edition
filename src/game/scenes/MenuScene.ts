import Phaser from 'phaser';
import { AudioFeedbackSystem } from '../systems/AudioFeedbackSystem';
import { getRaycastFeedbackActions } from '../raycast/RaycastFeedback';
import {
  cycleRaycastDifficulty,
  getRaycastDifficultyPreset,
  RAYCAST_DIFFICULTY_REGISTRY_KEY
} from '../raycast/RaycastDifficulty';
import { buildMainMenuLayout, getMainMenuCopy } from '../raycast/RaycastPresentation';
import { RAYCAST_CSS, RAYCAST_PALETTE } from '../raycast/RaycastPalette';
import { createEmptyCampaignMetrics } from '../raycast/RaycastScore';
import { getRaycastBossLevelId, type RaycastBossShortcutSlot } from '../raycast/RaycastBossShortcuts';

const MENU_BACKGROUND = RAYCAST_PALETTE.voidBlack;
const MENU_CYAN = RAYCAST_PALETTE.plasmaBright;
const MENU_CYAN_SOFT = RAYCAST_CSS.accentText;
const MENU_EMBER = RAYCAST_PALETTE.amberWarn;
const MENU_ROSE = RAYCAST_PALETTE.telegraphRose;
const MENU_TEXT = RAYCAST_CSS.bodyText;

export class MenuScene extends Phaser.Scene {
  private inputListenersRegistered = false;
  private audioFeedback!: AudioFeedbackSystem;
  private difficultyHintText!: Phaser.GameObjects.Text;

  private readonly handleStartArena = (): void => {
    this.scene.start('PrologueScene', { mode: 'arena' });
  };

  private readonly handleStartRaycast = (): void => {
    this.playFeedbackEvent('difficultyStart');
    const difficultyId = getRaycastDifficultyPreset(this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY)).id;
    this.scene.start('PrologueScene', { mode: 'raycast', difficultyId });
  };

  private startRaycastBoss(slot: RaycastBossShortcutSlot): void {
    const difficultyId = getRaycastDifficultyPreset(this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY)).id;
    this.scene.start('RaycastScene', {
      levelId: getRaycastBossLevelId(slot),
      difficultyId,
      carryScore: 0,
      carryCampaignMetrics: createEmptyCampaignMetrics()
    });
  }

  private readonly handleBossMenuOne = (): void => {
    this.startRaycastBoss(1);
  };

  private readonly handleBossMenuTwo = (): void => {
    this.startRaycastBoss(2);
  };

  private readonly handleBossMenuThree = (): void => {
    this.startRaycastBoss(3);
  };

  private readonly handleCycleDifficulty = (): void => {
    const next = cycleRaycastDifficulty(this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY));
    this.registry.set(RAYCAST_DIFFICULTY_REGISTRY_KEY, next.id);
    this.difficultyHintText.setText(this.buildDifficultyMenuLine());
    this.playFeedbackEvent('difficultySelect');
  };

  private buildDifficultyMenuLine(): string {
    const preset = getRaycastDifficultyPreset(this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY));
    return `DIFFICULTY · ${preset.label.toUpperCase()}  ·  [D] CYCLE`;
  }

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

    this.difficultyHintText = this.add
      .text(layout.centerX, layout.option2dY + 46, this.buildDifficultyMenuLine(), {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: '700',
        color: '#ff9a38',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8)
      .setAlpha(0.92);

    this.cameras.main.fadeIn(420, 0, 0, 0);

    this.registerInputListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupInputListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupInputListeners, this);
  }

  private drawBackdrop(width: number, height: number): void {
    const graphics = this.add.graphics().setDepth(0);
    graphics.fillGradientStyle(0x030508, 0x030508, 0x0c1018, 0x06080c, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(1, 0x1a2430, 0.3);
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

    graphics.fillStyle(0x050810, 0.9);
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
    kb?.on('keydown-D', this.handleCycleDifficulty);
    kb?.on('keydown-d', this.handleCycleDifficulty);
    kb?.on('keydown-FOUR', this.handleBossMenuOne);
    kb?.on('keydown-FIVE', this.handleBossMenuTwo);
    kb?.on('keydown-SIX', this.handleBossMenuThree);
    this.inputListenersRegistered = true;
  }

  private cleanupInputListeners(): void {
    if (!this.inputListenersRegistered) return;
    const kb = this.input.keyboard;
    kb?.off('keydown-A', this.handleStartRaycast);
    kb?.off('keydown-a', this.handleStartRaycast);
    kb?.off('keydown-B', this.handleStartArena);
    kb?.off('keydown-b', this.handleStartArena);
    kb?.off('keydown-D', this.handleCycleDifficulty);
    kb?.off('keydown-d', this.handleCycleDifficulty);
    kb?.off('keydown-FOUR', this.handleBossMenuOne);
    kb?.off('keydown-FIVE', this.handleBossMenuTwo);
    kb?.off('keydown-SIX', this.handleBossMenuThree);
    this.inputListenersRegistered = false;
  }

  private playFeedbackEvent(event: 'difficultySelect' | 'difficultyStart'): void {
    getRaycastFeedbackActions(event).forEach((action) => {
      this.audioFeedback.play(action.cue, action.intensity, this.time.now + (action.delayMs ?? 0));
    });
  }
}
