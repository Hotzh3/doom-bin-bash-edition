import Phaser from 'phaser';
import { getRaycastDifficultyPreset, RAYCAST_DIFFICULTY_REGISTRY_KEY, type RaycastDifficultyId } from '../raycast/RaycastDifficulty';
import { getPrologueCopy, type PrologueGameMode } from '../raycast/RaycastPresentation';
import { RAYCAST_CSS, RAYCAST_PALETTE } from '../raycast/RaycastPalette';
import { createEmptyCampaignMetrics } from '../raycast/RaycastScore';
import { getRaycastBossLevelId, type RaycastBossShortcutSlot } from '../raycast/RaycastBossShortcuts';

const BG = RAYCAST_PALETTE.voidBlack;
const BODY_COLOR = RAYCAST_CSS.bodyText;
const MUTED_COLOR = RAYCAST_CSS.mutedText;
const ACCENT_COLOR = RAYCAST_CSS.accentText;

export interface PrologueSceneData {
  mode: PrologueGameMode;
  difficultyId?: RaycastDifficultyId;
}

export class PrologueScene extends Phaser.Scene {
  private mode: PrologueGameMode = 'raycast';
  private difficultyId!: RaycastDifficultyId;
  private inputListenersRegistered = false;

  private readonly handleContinueRaycast = (): void => {
    this.cleanupInputListeners();
    this.scene.start('RaycastScene', { difficultyId: this.difficultyId });
  };

  private readonly handleContinueArena = (): void => {
    this.cleanupInputListeners();
    this.scene.start('ArenaScene');
  };

  private readonly handleBackToMenu = (): void => {
    this.cleanupInputListeners();
    this.scene.start('MenuScene');
  };

  private jumpToBossFromPrologue(slot: RaycastBossShortcutSlot): void {
    this.cleanupInputListeners();
    this.scene.start('RaycastScene', {
      levelId: getRaycastBossLevelId(slot),
      difficultyId: this.difficultyId,
      carryScore: 0,
      carryCampaignMetrics: createEmptyCampaignMetrics()
    });
  }

  private readonly handlePrologueBossOne = (): void => {
    if (this.mode !== 'raycast') return;
    this.jumpToBossFromPrologue(1);
  };

  private readonly handlePrologueBossTwo = (): void => {
    if (this.mode !== 'raycast') return;
    this.jumpToBossFromPrologue(2);
  };

  private readonly handlePrologueBossThree = (): void => {
    if (this.mode !== 'raycast') return;
    this.jumpToBossFromPrologue(3);
  };

  constructor() {
    super('PrologueScene');
  }

  init(data: PrologueSceneData = { mode: 'raycast' }): void {
    this.mode = data.mode ?? 'raycast';
    this.difficultyId = getRaycastDifficultyPreset(data.difficultyId ?? this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY)).id;
    this.registry.set(RAYCAST_DIFFICULTY_REGISTRY_KEY, this.difficultyId);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor(BG);

    const backdrop = this.add.graphics().setDepth(0);
    backdrop.fillGradientStyle(0x020408, 0x020408, 0x080c14, 0x04060c, 1);
    backdrop.fillRect(0, 0, width, height);
    backdrop.lineStyle(1, 0x1e2a38, 0.28);
    for (let y = 0; y < height; y += 6) {
      backdrop.lineBetween(0, y, width, y);
    }

    const copy = getPrologueCopy(this.mode);
    const story = copy.lines.join('\n\n');
    const block = `${story}\n\n${copy.continueLine}\n${copy.backLine}`;

    this.add
      .text(width * 0.5, height * 0.5, block, {
        fontFamily: 'monospace',
        fontSize: width <= 720 ? '13px' : '15px',
        fontStyle: '700',
        color: BODY_COLOR,
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: Math.min(width - 48, 520) }
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.add
      .text(width * 0.5, height * 0.08, 'DOOM BIN BASH EDITION', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: MUTED_COLOR,
        align: 'center'
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.85)
      .setDepth(4);

    this.add
      .text(width * 0.5, height - 22, '// SIGNAL FRAGMENT', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: ACCENT_COLOR,
        align: 'center'
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.55)
      .setDepth(4);

    this.cameras.main.fadeIn(380, 0, 0, 0);

    this.registerInputListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupInputListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupInputListeners, this);
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    const kb = this.input.keyboard;

    if (this.mode === 'raycast') {
      kb?.once('keydown-SPACE', this.handleContinueRaycast);
      kb?.once('keydown-ENTER', this.handleContinueRaycast);
      kb?.once('keydown-A', this.handleContinueRaycast);
      kb?.once('keydown-a', this.handleContinueRaycast);
    } else {
      kb?.once('keydown-SPACE', this.handleContinueArena);
      kb?.once('keydown-ENTER', this.handleContinueArena);
      kb?.once('keydown-B', this.handleContinueArena);
      kb?.once('keydown-b', this.handleContinueArena);
    }

    kb?.once('keydown-ESC', this.handleBackToMenu);

    kb?.on('keydown-FOUR', this.handlePrologueBossOne);
    kb?.on('keydown-FIVE', this.handlePrologueBossTwo);
    kb?.on('keydown-SIX', this.handlePrologueBossThree);

    this.inputListenersRegistered = true;
  }

  private cleanupInputListeners(): void {
    if (!this.inputListenersRegistered) return;
    const kb = this.input.keyboard;

    kb?.off('keydown-SPACE', this.handleContinueRaycast);
    kb?.off('keydown-ENTER', this.handleContinueRaycast);
    kb?.off('keydown-A', this.handleContinueRaycast);
    kb?.off('keydown-a', this.handleContinueRaycast);
    kb?.off('keydown-SPACE', this.handleContinueArena);
    kb?.off('keydown-ENTER', this.handleContinueArena);
    kb?.off('keydown-B', this.handleContinueArena);
    kb?.off('keydown-b', this.handleContinueArena);
    kb?.off('keydown-ESC', this.handleBackToMenu);

    kb?.off('keydown-FOUR', this.handlePrologueBossOne);
    kb?.off('keydown-FIVE', this.handlePrologueBossTwo);
    kb?.off('keydown-SIX', this.handlePrologueBossThree);

    this.inputListenersRegistered = false;
  }
}
