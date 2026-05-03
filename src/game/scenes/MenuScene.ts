import Phaser from 'phaser';
import { AudioFeedbackSystem } from '../systems/AudioFeedbackSystem';
import { getRaycastFeedbackActions } from '../raycast/RaycastFeedback';
import {
  cycleRaycastDifficulty,
  getRaycastDifficultyPreset,
  RAYCAST_DIFFICULTY_REGISTRY_KEY,
  type RaycastDifficultyId
} from '../raycast/RaycastDifficulty';
import {
  buildRaycastDifficultyMenuLine,
  buildRaycastMenuLayout,
  getRaycastMenuCopy,
  RAYCAST_MENU_DIFFICULTY_HINT_OFFSET,
  RAYCAST_MENU_DIFFICULTY_LABEL_OFFSET,
  RAYCAST_MENU_DIFFICULTY_VALUE_OFFSET
} from '../raycast/RaycastPresentation';

const MENU_BACKGROUND = 0x070b11;
const MENU_PANEL = 0x0b1320;
const MENU_PANEL_ALT = 0x101823;
const MENU_CYAN = 0x9feee2;
const MENU_CYAN_SOFT = '#9feee2';
const MENU_EMBER = 0xffb347;
const MENU_ROSE = 0xff8f7a;
const MENU_TEXT = '#d7deea';
const OPTIONAL_TITLE_IMAGE_KEY = 'menuTitleImage';
const OPTIONAL_TITLE_IMAGE_REGISTRY_KEY = 'menuTitleImageKey';

export class MenuScene extends Phaser.Scene {
  private inputListenersRegistered = false;
  private selectedDifficultyId: RaycastDifficultyId = 'standard';
  private difficultyValueText?: Phaser.GameObjects.Text;
  private audioFeedback!: AudioFeedbackSystem;

  private readonly handleStartArena = (): void => {
    this.scene.start('ArenaScene');
  };

  private readonly handleStartRaycast = (): void => {
    this.playFeedbackEvent('difficultyStart');
    this.scene.start('RaycastScene', { difficultyId: this.selectedDifficultyId });
  };

  private readonly handleDifficultyPrevious = (): void => {
    this.setSelectedDifficulty(cycleRaycastDifficulty(this.selectedDifficultyId, -1).id);
  };

  private readonly handleDifficultyNext = (): void => {
    this.setSelectedDifficulty(cycleRaycastDifficulty(this.selectedDifficultyId, 1).id);
  };

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const copy = getRaycastMenuCopy();
    const layout = buildRaycastMenuLayout(width, height);
    this.selectedDifficultyId = getRaycastDifficultyPreset(this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY)).id;
    this.audioFeedback = new AudioFeedbackSystem();

    this.cameras.main.setBackgroundColor(MENU_BACKGROUND);

    this.drawBackdrop(width, height);
    this.drawTitleFrame(width, height, layout.titleArtY);

    const titleImageKey = this.resolveOptionalTitleImageKey();
    if (titleImageKey) {
      this.add
        .image(layout.centerX, layout.titleArtY, titleImageKey)
        .setOrigin(0.5)
        .setDisplaySize(Math.min(width * 0.52, 440), 140)
        .setAlpha(0.78)
        .setDepth(4);
    } else {
      this.drawProceduralTitleArt(layout.centerX, layout.titleArtY, width);
    }

    this.add
      .text(layout.centerX, layout.titleY, copy.title, {
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: '700',
        color: MENU_CYAN_SOFT,
        stroke: '#05070b',
        strokeThickness: 6,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.add
      .text(layout.centerX, layout.subtitleY, copy.subtitle, {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: '700',
        color: MENU_TEXT,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.add
      .text(layout.centerX, layout.episodeTagY, `${copy.episodeTagline}\n${copy.buildTagline}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: '700',
        color: '#f8d8a8',
        align: 'center',
        lineSpacing: 6
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.add
      .text(layout.centerX, layout.difficultyY + RAYCAST_MENU_DIFFICULTY_LABEL_OFFSET, copy.difficultyLabel, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: '700',
        color: '#7aa4ac',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.difficultyValueText = this.add
      .text(layout.centerX, layout.difficultyY + RAYCAST_MENU_DIFFICULTY_VALUE_OFFSET, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: '700',
        color: MENU_CYAN_SOFT,
        backgroundColor: '#07101acc',
        padding: { x: 8, y: 5 },
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(9)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, this.handleDifficultyNext);

    this.add
      .text(layout.centerX, layout.difficultyY + RAYCAST_MENU_DIFFICULTY_HINT_OFFSET, copy.difficultyHint, {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: '700',
        color: '#d7deea',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.refreshDifficultyText();

    this.createActionPanel({
      x: layout.actionX,
      y: layout.primaryActionY,
      width: layout.actionWidth,
      height: layout.actionHeight,
      keyHint: copy.primaryAction.keyHint,
      label: copy.primaryAction.label,
      detail: copy.primaryAction.detail,
      fillColor: MENU_PANEL,
      strokeColor: MENU_CYAN,
      accentColor: MENU_CYAN_SOFT,
      onActivate: this.handleStartRaycast
    });

    this.createActionPanel({
      x: layout.actionX,
      y: layout.secondaryActionY,
      width: layout.actionWidth,
      height: layout.actionHeight,
      keyHint: copy.secondaryAction.keyHint,
      label: copy.secondaryAction.label,
      detail: copy.secondaryAction.detail,
      fillColor: MENU_PANEL_ALT,
      strokeColor: MENU_EMBER,
      accentColor: '#ffd7a1',
      onActivate: this.handleStartArena
    });

    this.add
      .text(layout.centerX, layout.helpTextY, copy.helpActions.join('  |  '), {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: '700',
        color: MENU_TEXT,
        align: 'center',
        wordWrap: { width: width - 88 }
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.add
      .text(layout.centerX, layout.footerY, copy.footerHint, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: '700',
        color: '#7aa4ac',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(8);

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
    const frameHeight = Math.min(height * 0.23, 148);
    const frameX = width * 0.5 - frameWidth * 0.5;
    const frameY = centerY - frameHeight * 0.5;

    graphics.fillStyle(0x07101a, 0.9);
    graphics.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, 14);
    graphics.lineStyle(2, MENU_CYAN, 0.45);
    graphics.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, 14);
    graphics.lineStyle(1, MENU_EMBER, 0.25);
    graphics.strokeRoundedRect(frameX + 8, frameY + 8, frameWidth - 16, frameHeight - 16, 10);
  }

  private drawProceduralTitleArt(centerX: number, centerY: number, width: number): void {
    const graphics = this.add.graphics().setDepth(5);
    const stripWidth = Math.min(width * 0.44, 420);
    const stripHeight = 16;

    for (let i = 0; i < 6; i += 1) {
      const alpha = 0.1 + i * 0.04;
      graphics.fillStyle(i % 2 === 0 ? MENU_CYAN : MENU_EMBER, alpha);
      graphics.fillRoundedRect(centerX - stripWidth * 0.5, centerY - 42 + i * 16, stripWidth, stripHeight, 5);
    }

    graphics.fillStyle(0x04070b, 0.9);
    graphics.fillRoundedRect(centerX - stripWidth * 0.42, centerY - 34, stripWidth * 0.84, 70, 6);

    this.add
      .text(centerX, centerY - 4, 'SYS//BIN_BASH.EXE', {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: '700',
        color: '#f6f1d2',
        stroke: '#1d0f05',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.add
      .text(centerX, centerY + 28, 'SIGNAL JAMMED // READY TO BREACH', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: '700',
        color: '#7aa4ac'
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private createActionPanel(config: {
    x: number;
    y: number;
    width: number;
    height: number;
    keyHint: string;
    label: string;
    detail: string;
    fillColor: number;
    strokeColor: number;
    accentColor: string;
    onActivate: () => void;
  }): void {
    const container = this.add.container(0, 0).setDepth(9);
    const background = this.add
      .rectangle(config.x, config.y, config.width, config.height, config.fillColor, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(2, config.strokeColor, 0.85);
    const accent = this.add.rectangle(config.x, config.y, 10, config.height, config.strokeColor, 0.9).setOrigin(0, 0);
    const keyText = this.add
      .text(config.x + 22, config.y + 14, config.keyHint, {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: '700',
        color: config.accentColor
      })
      .setOrigin(0, 0);
    const labelText = this.add
      .text(config.x + 22, config.y + 32, config.label, {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: '700',
        color: '#ffffff'
      })
      .setOrigin(0, 0);
    const detailText = this.add
      .text(config.x + 22, config.y + 60, config.detail, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: MENU_TEXT,
        wordWrap: { width: config.width - 36 }
      })
      .setOrigin(0, 0);

    container.add([background, accent, keyText, labelText, detailText]);

    background
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        background.setFillStyle(config.fillColor, 1);
        accent.setFillStyle(config.strokeColor, 1);
        labelText.setColor(config.accentColor);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        background.setFillStyle(config.fillColor, 0.94);
        accent.setFillStyle(config.strokeColor, 0.9);
        labelText.setColor('#ffffff');
      })
      .on(Phaser.Input.Events.POINTER_DOWN, config.onActivate);
  }

  private resolveOptionalTitleImageKey(): string | null {
    const preferredKey = this.registry.get(OPTIONAL_TITLE_IMAGE_REGISTRY_KEY);
    if (typeof preferredKey === 'string' && preferredKey.length > 0 && this.textures.exists(preferredKey)) {
      return preferredKey;
    }
    return this.textures.exists(OPTIONAL_TITLE_IMAGE_KEY) ? OPTIONAL_TITLE_IMAGE_KEY : null;
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    this.input.keyboard?.once('keydown-SPACE', this.handleStartRaycast);
    this.input.keyboard?.once('keydown-ENTER', this.handleStartRaycast);
    this.input.keyboard?.once('keydown-A', this.handleStartArena);
    this.input.keyboard?.on('keydown-LEFT', this.handleDifficultyPrevious);
    this.input.keyboard?.on('keydown-RIGHT', this.handleDifficultyNext);
    this.inputListenersRegistered = true;
  }

  private cleanupInputListeners(): void {
    if (!this.inputListenersRegistered) return;
    this.input.keyboard?.off('keydown-SPACE', this.handleStartRaycast);
    this.input.keyboard?.off('keydown-ENTER', this.handleStartRaycast);
    this.input.keyboard?.off('keydown-A', this.handleStartArena);
    this.input.keyboard?.off('keydown-LEFT', this.handleDifficultyPrevious);
    this.input.keyboard?.off('keydown-RIGHT', this.handleDifficultyNext);
    this.inputListenersRegistered = false;
  }

  private setSelectedDifficulty(difficultyId: RaycastDifficultyId): void {
    if (difficultyId === this.selectedDifficultyId) return;
    this.selectedDifficultyId = difficultyId;
    this.registry.set(RAYCAST_DIFFICULTY_REGISTRY_KEY, difficultyId);
    this.playFeedbackEvent('difficultySelect');
    this.refreshDifficultyText();
  }

  private refreshDifficultyText(): void {
    const preset = getRaycastDifficultyPreset(this.selectedDifficultyId);
    this.difficultyValueText?.setText(
      buildRaycastDifficultyMenuLine({
        label: preset.label,
        summary: preset.menuSummary
      })
    );
  }

  private playFeedbackEvent(event: 'difficultySelect' | 'difficultyStart'): void {
    getRaycastFeedbackActions(event).forEach((action) => {
      this.audioFeedback.play(action.cue, action.intensity, this.time.now + (action.delayMs ?? 0));
    });
  }
}
