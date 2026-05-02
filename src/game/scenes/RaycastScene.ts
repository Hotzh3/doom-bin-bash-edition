import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DoorSystem } from '../systems/DoorSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import { KeySystem } from '../systems/KeySystem';
import { TriggerSystem } from '../systems/TriggerSystem';
import {
  AudioFeedbackSystem,
  getDirectorEventAudioPlan,
  getWeaponAudioPlan
} from '../systems/AudioFeedbackSystem';
import type { DirectorEvent } from '../systems/DirectorEvents';
import { DIRECTOR_STATE_LABELS, type DirectorDebugInfo, type DirectorState } from '../systems/DirectorState';
import { getRaycastCrosshairTargetInfo, RaycastCombatSystem } from '../raycast/RaycastCombatSystem';
import {
  cloneRaycastEnemies,
  createTelegraphedRaycastEnemy,
  didRaycastEnemyFinishTelegraph,
  type RaycastEnemy
} from '../raycast/RaycastEnemy';
import {
  updateRaycastEnemies,
  updateRaycastEnemyProjectiles,
  type RaycastEnemyProjectile
} from '../raycast/RaycastEnemySystem';
import {
  cloneRaycastMap,
  findRaycastZoneId,
  getRaycastExitAccess,
  getRaycastLevelById,
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor,
  registerRaycastSecret,
  RAYCAST_LEVEL,
  type RaycastDoor,
  type RaycastEncounterBeat,
  type RaycastLevel
} from '../raycast/RaycastLevel';
import { getRaycastEpisodeState } from '../raycast/RaycastEpisode';
import { buildRaycastMinimapModel } from '../raycast/RaycastMinimap';
import { castRay, RAYCAST_PLAYER_START, type RaycastMap } from '../raycast/RaycastMap';
import {
  buildRaycastCurrentObjective,
  buildRaycastHintText,
  buildRaycastInstructionText,
  type RaycastBlockedReason,
  type RaycastObjectiveState
} from '../raycast/RaycastObjective';
import { RAYCAST_ATMOSPHERE, getAtmosphereForDirector } from '../raycast/RaycastAtmosphere';
import {
  buildRaycastDebugLine,
  buildRaycastFocusedEnemyLine,
  buildRaycastHudLine,
  buildRaycastPlayerHealthLine,
  getRaycastHealthVisualState
} from '../raycast/RaycastHud';
import {
  buildRaycastEpisodeBanner,
  buildRaycastOverlayHint,
  buildRaycastStatusMessage
} from '../raycast/RaycastPresentation';
import { RaycastPlayerController, type RaycastPlayerState } from '../raycast/RaycastPlayerController';
import { RaycastRenderer, type RaycastBillboard } from '../raycast/RaycastRenderer';
import { buildRaycastRunSummary } from '../raycast/RaycastRunSummary';
import { getBillboardColor } from '../raycast/RaycastVisualTheme';
import { palette } from '../theme/palette';

interface RaycastSceneData {
  levelId?: string;
}

const DIRECTOR_SPAWN_TELEGRAPH_MS = 820;
const ENCOUNTER_SPAWN_TELEGRAPH_MS = 980;
const VISIBLE_SPAWN_TELEGRAPH_BONUS_MS = 260;
const CLOSE_SPAWN_TELEGRAPH_BONUS_MS = 180;

export class RaycastScene extends Phaser.Scene {
  private raycastRenderer!: RaycastRenderer;
  private controller!: RaycastPlayerController;
  private combat!: RaycastCombatSystem;
  private audioFeedback!: AudioFeedbackSystem;
  private gameDirector!: GameDirector;
  private keySystem!: KeySystem;
  private doorSystem!: DoorSystem;
  private triggerSystem!: TriggerSystem;
  private currentLevel: RaycastLevel = RAYCAST_LEVEL;
  private map!: RaycastMap;
  private enemies: RaycastEnemy[] = [];
  private enemyProjectiles: RaycastEnemyProjectile[] = [];
  private player: RaycastPlayerState = { ...RAYCAST_PLAYER_START };
  private playerHealth = 100;
  private damageTaken = 0;
  private runStartedAt = 0;
  private playerAlive = true;
  private levelComplete = false;
  private episodeComplete = false;
  private nextLevelId: string | null = null;
  private readonly collectedSecrets = new Set<string>();
  private readonly completedEncounterBeats = new Set<string>();
  private enemiesKilled = 0;
  private playerStationaryMs = 0;
  private lastPlayerDamageAt = 0;
  private lastPlayerPosition: { x: number; y: number } = { x: RAYCAST_PLAYER_START.x, y: RAYCAST_PLAYER_START.y };
  private activeZoneId: string | null = null;
  private directorDebug: DirectorDebugInfo | null = null;
  private lastDirectorState: DirectorState | null = null;
  private directorIntensity = 0;
  private directorSpawnCounter = 0;
  private debugHudVisible = false;
  private minimapVisible = true;
  private debugText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private healthBarTrack!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private targetBarTrack!: Phaser.GameObjects.Rectangle;
  private targetBarFill!: Phaser.GameObjects.Rectangle;
  private objectiveText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private minimapFrame!: Phaser.GameObjects.Rectangle;
  private minimapTitleText!: Phaser.GameObjects.Text;
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private minimapMarkerLabels: Phaser.GameObjects.Text[] = [];
  private muzzleFlash!: Phaser.GameObjects.Rectangle;
  private wallImpactFlash!: Phaser.GameObjects.Arc;
  private damageFlash!: Phaser.GameObjects.Rectangle;
  private damageFrameTop!: Phaser.GameObjects.Rectangle;
  private damageFrameBottom!: Phaser.GameObjects.Rectangle;
  private damageFrameLeft!: Phaser.GameObjects.Rectangle;
  private damageFrameRight!: Phaser.GameObjects.Rectangle;
  private feedbackPulse!: Phaser.GameObjects.Rectangle;
  private corruptionVeil!: Phaser.GameObjects.Rectangle;
  private systemText!: Phaser.GameObjects.Text;
  private crosshair!: Phaser.GameObjects.Text;
  private hitMarker!: Phaser.GameObjects.Text;
  private finalOverlay!: Phaser.GameObjects.Rectangle;
  private finalTitleText!: Phaser.GameObjects.Text;
  private finalSummaryText!: Phaser.GameObjects.Text;
  private finalHintText!: Phaser.GameObjects.Text;
  private weaponOverlayFlashUntil = 0;
  private lastCombatMessage: string = RAYCAST_ATMOSPHERE.messages.intro;
  private combatMessageUntil = 0;
  private blockedHintReason: RaycastBlockedReason | null = null;
  private blockedHintUntil = 0;
  private nextAmbientCueAt = 0;
  private sceneReady = false;
  private inputListenersRegistered = false;

  private readonly handleExitToMenu = (): void => {
    if (!this.isRaycastSceneActive()) return;
    this.scene.start('MenuScene');
  };

  private readonly handleRetry = (): void => {
    if (!this.isRaycastSceneActive()) return;
    this.scene.restart({ levelId: this.currentLevel.id });
  };

  private readonly handleAdvanceLevel = (): void => {
    if (!this.isRaycastSceneActive()) return;
    if (!this.levelComplete || this.episodeComplete || this.nextLevelId === null) return;
    this.scene.restart({ levelId: this.nextLevelId });
  };

  private readonly handleFireInput = (): void => {
    this.fireWeapon();
  };

  private readonly handleWeaponSlotOne = (): void => {
    this.switchWeapon(1);
  };

  private readonly handleWeaponSlotTwo = (): void => {
    this.switchWeapon(2);
  };

  private readonly handleWeaponSlotThree = (): void => {
    this.switchWeapon(3);
  };

  private readonly handleToggleDebug = (): void => {
    this.debugHudVisible = !this.debugHudVisible;
    this.debugText?.setVisible(this.debugHudVisible);
  };

  private readonly handleToggleMinimap = (): void => {
    this.minimapVisible = !this.minimapVisible;
    this.minimapFrame?.setVisible(this.minimapVisible);
    this.minimapTitleText?.setVisible(this.minimapVisible);
    this.minimapGraphics?.setVisible(this.minimapVisible);
    this.minimapMarkerLabels.forEach((label) => label.setVisible(false));
  };

  constructor() {
    super('RaycastScene');
  }

  init(data: RaycastSceneData = {}): void {
    this.currentLevel = getRaycastLevelById(data.levelId);
    this.nextLevelId = getRaycastEpisodeState(this.currentLevel.id).nextLevelId;
  }

  create(): void {
    this.resetRuntimeState();
    this.cameras.main.setBackgroundColor('#05070c');
    this.map = cloneRaycastMap(this.currentLevel.map);
    this.keySystem = new KeySystem();
    this.doorSystem = new DoorSystem(this.keySystem);
    this.triggerSystem = new TriggerSystem();
    this.raycastRenderer = new RaycastRenderer(this, this.map, this.currentLevel);
    this.controller = new RaycastPlayerController(this, this.map, this.player);
    this.controller.create();
    this.combat = new RaycastCombatSystem();
    this.audioFeedback = new AudioFeedbackSystem();
    this.gameDirector = new GameDirector({
      config: this.currentLevel.director.config,
      spawnPoints: this.currentLevel.director.spawnPoints
    });
    this.enemies = cloneRaycastEnemies(this.currentLevel);

    const episodeState = getRaycastEpisodeState(this.currentLevel.id);
    this.add
      .text(
        16,
        14,
        buildRaycastEpisodeBanner({
          currentLevelNumber: episodeState.currentLevelNumber,
          totalLevels: episodeState.totalLevels,
          levelName: this.currentLevel.name
        }),
        {
          fontSize: '13px',
          fontStyle: '700',
          color: palette.background.panelText,
          backgroundColor: RAYCAST_ATMOSPHERE.hudPanel,
          padding: { x: 8, y: 5 }
        }
      )
      .setDepth(10);

    this.crosshair = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, '+', {
        fontSize: '26px',
        fontStyle: '700',
        color: '#fff0c2',
        stroke: '#05070c',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.healthText = this.add
      .text(GAME_WIDTH - 16, 14, '', {
        fontSize: '15px',
        fontStyle: '700',
        color: '#9feee2',
        backgroundColor: RAYCAST_ATMOSPHERE.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setOrigin(1, 0)
      .setDepth(12);
    this.healthBarTrack = this.add
      .rectangle(GAME_WIDTH - 108, 46, 168, 10, 0x020408, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(12);
    this.healthBarFill = this.add
      .rectangle(GAME_WIDTH - 108, 46, 168, 6, 0x9feee2, 1)
      .setOrigin(0, 0.5)
      .setDepth(13);

    this.weaponText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT - 88, '', {
        fontSize: '19px',
        fontStyle: '700',
        color: palette.accent.warmText,
        backgroundColor: RAYCAST_ATMOSPHERE.hudPanel,
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.targetText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5 + 34, '', {
        fontSize: '14px',
        fontStyle: '700',
        color: '#fff0c2',
        backgroundColor: '#020408cc',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(14)
      .setVisible(false);
    this.targetBarTrack = this.add
      .rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5 + 58, 118, 8, 0x020408, 0.88)
      .setDepth(14)
      .setVisible(false);
    this.targetBarFill = this.add
      .rectangle(GAME_WIDTH * 0.5 - 59, GAME_HEIGHT * 0.5 + 58, 118, 4, 0xfff29e, 1)
      .setOrigin(0, 0.5)
      .setDepth(15)
      .setVisible(false);

    this.objectiveText = this.add
      .text(16, GAME_HEIGHT - 118, '', {
        fontSize: '16px',
        fontStyle: '700',
        color: palette.accent.warmText,
        backgroundColor: RAYCAST_ATMOSPHERE.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setDepth(12);
    this.hintText = this.add
      .text(16, GAME_HEIGHT - 90, '', {
        fontSize: '14px',
        fontStyle: '700',
        color: RAYCAST_ATMOSPHERE.systemText,
        backgroundColor: '#020408cc',
        padding: { x: 8, y: 5 },
        wordWrap: { width: 330 }
      })
      .setDepth(12);
    this.instructionText = this.add
      .text(16, GAME_HEIGHT - 52, buildRaycastInstructionText(), {
        fontSize: '12px',
        color: RAYCAST_ATMOSPHERE.debugText,
        backgroundColor: '#020408c8',
        padding: { x: 8, y: 5 }
      })
      .setAlpha(0.82)
      .setDepth(11);
    this.minimapFrame = this.add
      .rectangle(GAME_WIDTH - 84, 124, 144, 116, 0x020408, 0.76)
      .setStrokeStyle(2, 0x9feee2, 0.55)
      .setDepth(11);
    this.minimapTitleText = this.add
      .text(GAME_WIDTH - 84, 70, 'AUTOMAP M', {
        fontSize: '12px',
        fontStyle: '700',
        color: '#9feee2',
        backgroundColor: '#020408cc',
        padding: { x: 6, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.minimapGraphics = this.add.graphics().setDepth(12);
    this.minimapMarkerLabels = Array.from({ length: 8 }, () =>
      this.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '8px',
          fontStyle: '700',
          color: '#f4f7d0',
          stroke: '#020408',
          strokeThickness: 2
        })
        .setDepth(13)
        .setVisible(false)
    );

    this.muzzleFlash = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT - 54, 96, 34, palette.accent.projectile, 0);
    this.muzzleFlash.setDepth(11);
    this.wallImpactFlash = this.add.circle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, 18, 0xffffff, 0);
    this.wallImpactFlash.setDepth(12);
    this.damageFlash = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_ATMOSPHERE.damageFlash, 0);
    this.damageFlash.setDepth(13);
    this.damageFrameTop = this.add.rectangle(GAME_WIDTH * 0.5, 10, GAME_WIDTH, 20, 0xff5b6f, 0).setDepth(14);
    this.damageFrameBottom = this.add
      .rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT - 10, GAME_WIDTH, 20, 0xff5b6f, 0)
      .setDepth(14);
    this.damageFrameLeft = this.add.rectangle(10, GAME_HEIGHT * 0.5, 20, GAME_HEIGHT, 0xff5b6f, 0).setDepth(14);
    this.damageFrameRight = this.add
      .rectangle(GAME_WIDTH - 10, GAME_HEIGHT * 0.5, 20, GAME_HEIGHT, 0xff5b6f, 0)
      .setDepth(14);
    this.feedbackPulse = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, 0x9feee2, 0);
    this.feedbackPulse.setDepth(11);
    this.corruptionVeil = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_ATMOSPHERE.corruptionTint, 0);
    this.corruptionVeil.setDepth(9);
    this.systemText = this.add
      .text(GAME_WIDTH * 0.5, 58, RAYCAST_ATMOSPHERE.messages.intro, {
        fontSize: '20px',
        fontStyle: '700',
        color: RAYCAST_ATMOSPHERE.systemText,
        stroke: '#020408',
        strokeThickness: 5,
        wordWrap: { width: GAME_WIDTH - 96 }
      })
      .setOrigin(0.5)
      .setDepth(14);
    this.hitMarker = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, 'x', {
        fontSize: '34px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#05070c',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setAlpha(0);

    this.finalOverlay = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, 0x020408, 0.82);
    this.finalOverlay.setDepth(30).setVisible(false);
    this.finalTitleText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.34, '', {
        fontSize: '46px',
        fontStyle: '700',
        color: RAYCAST_ATMOSPHERE.warningText,
        stroke: '#020408',
        strokeThickness: 7
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setVisible(false);
    this.finalSummaryText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, '', {
        fontSize: '20px',
        fontStyle: '700',
        color: RAYCAST_ATMOSPHERE.systemText,
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setVisible(false);
    this.finalHintText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.72, 'R RESTART LEVEL  |  ESC MENU', {
        fontSize: '18px',
        fontStyle: '700',
        color: RAYCAST_ATMOSPHERE.keyText,
        stroke: '#020408',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setVisible(false);

    this.debugText = this.add
      .text(16, GAME_HEIGHT - 38, '', {
        fontSize: '12px',
        color: RAYCAST_ATMOSPHERE.debugText,
        backgroundColor: RAYCAST_ATMOSPHERE.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setAlpha(0.68)
      .setVisible(false)
      .setDepth(10);

    this.sceneReady = true;
    this.registerInputListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSceneLifecycle, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupSceneLifecycle, this);
  }

  update(_time: number, delta: number): void {
    if (this.playerAlive && !this.levelComplete) {
      this.controller.update(delta);
      this.updatePlayerMetrics(delta);
      this.updateLevelState();
      this.updateEnemies(delta);
      this.updateGameDirector();
      this.updateAtmospherePulse();
    }
    const atmosphere = this.getAtmosphereOptions();
    this.raycastRenderer.render(this.player, GAME_WIDTH, GAME_HEIGHT, atmosphere);
    this.raycastRenderer.renderBillboards(this.player, this.createLevelBillboards(), GAME_WIDTH, GAME_HEIGHT);
    this.raycastRenderer.renderEnemies(this.player, this.enemies, GAME_WIDTH, GAME_HEIGHT, this.time.now, atmosphere);
    this.raycastRenderer.renderEnemyProjectiles(this.player, this.enemyProjectiles, GAME_WIDTH, GAME_HEIGHT);
    this.raycastRenderer.renderWeaponOverlay(
      this.combat.getCurrentWeapon(),
      GAME_WIDTH,
      GAME_HEIGHT,
      this.getWeaponOverlayFlashAlpha()
    );
    this.corruptionVeil.setAlpha(atmosphere.corruptionAlpha);
    const objectiveState = this.getObjectiveState();
    this.weaponText.setText(
      buildRaycastHudLine({
        health: this.playerHealth,
        weaponLabel: this.combat.getWeaponLabel(),
        keyCount: this.getKeyCount(),
        keyTotal: this.currentLevel.keys.length,
        secretCount: this.collectedSecrets.size,
        secretTotal: this.currentLevel.secrets.length,
        objective: buildRaycastCurrentObjective(objectiveState),
        criticalMessage: this.getHudCriticalMessage()
      })
    );
    this.objectiveText.setText(`OBJECTIVE // ${buildRaycastCurrentObjective(objectiveState)}`);
    this.hintText.setText(`PISTA // ${buildRaycastHintText(objectiveState)}`);
    this.updateHealthHud();
    this.updateFocusedEnemyHud();
    this.renderMinimap();
    if (this.debugHudVisible) {
      this.debugText.setText(
        buildRaycastDebugLine({
          position: `${this.player.x.toFixed(1)},${this.player.y.toFixed(1)}`,
          directorLine: this.getDirectorDebugLine(),
          message: this.getCurrentStatusMessage()
        })
      );
    }
  }

  private resetRuntimeState(): void {
    this.player = {
      x: this.currentLevel.playerStart.x,
      y: this.currentLevel.playerStart.y,
      angle: this.currentLevel.playerStart.angle,
      velocity: { ...this.currentLevel.playerStart.velocity }
    };
    this.playerHealth = 100;
    this.damageTaken = 0;
    this.runStartedAt = this.time.now;
    this.playerAlive = true;
    this.levelComplete = false;
    this.episodeComplete = false;
    this.collectedSecrets.clear();
    this.completedEncounterBeats.clear();
    this.enemiesKilled = 0;
    this.playerStationaryMs = 0;
    this.lastPlayerDamageAt = this.time.now;
    this.lastPlayerPosition = { x: this.currentLevel.playerStart.x, y: this.currentLevel.playerStart.y };
    this.activeZoneId = null;
    this.directorDebug = null;
    this.lastDirectorState = null;
    this.directorIntensity = 0;
    this.directorSpawnCounter = 0;
    this.debugHudVisible = false;
    this.minimapVisible = true;
    this.enemyProjectiles = [];
    this.lastCombatMessage = RAYCAST_ATMOSPHERE.messages.intro;
    this.combatMessageUntil = 0;
    this.blockedHintReason = null;
    this.blockedHintUntil = 0;
    this.weaponOverlayFlashUntil = 0;
    this.nextAmbientCueAt = 0;
    this.sceneReady = false;
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ESC', this.handleExitToMenu);
    keyboard?.on('keydown-R', this.handleRetry);
    keyboard?.on('keydown-N', this.handleAdvanceLevel);
    keyboard?.on('keydown-F', this.handleFireInput);
    keyboard?.on('keydown-SPACE', this.handleFireInput);
    keyboard?.on('keydown-ONE', this.handleWeaponSlotOne);
    keyboard?.on('keydown-TWO', this.handleWeaponSlotTwo);
    keyboard?.on('keydown-THREE', this.handleWeaponSlotThree);
    keyboard?.on('keydown-M', this.handleToggleMinimap);
    keyboard?.on('keydown-TAB', this.handleToggleDebug);
    keyboard?.on('keydown-BACKTICK', this.handleToggleDebug);
    this.input.on('pointerdown', this.handleFireInput);
    this.inputListenersRegistered = true;
  }

  private cleanupSceneLifecycle(): void {
    if (!this.sceneReady && !this.inputListenersRegistered) return;
    this.sceneReady = false;
    this.controller?.destroy();
    this.cleanupInputListeners();
    this.killUiTweens();
  }

  private cleanupInputListeners(): void {
    if (!this.inputListenersRegistered) return;
    const keyboard = this.input.keyboard;
    keyboard?.off('keydown-ESC', this.handleExitToMenu);
    keyboard?.off('keydown-R', this.handleRetry);
    keyboard?.off('keydown-N', this.handleAdvanceLevel);
    keyboard?.off('keydown-F', this.handleFireInput);
    keyboard?.off('keydown-SPACE', this.handleFireInput);
    keyboard?.off('keydown-ONE', this.handleWeaponSlotOne);
    keyboard?.off('keydown-TWO', this.handleWeaponSlotTwo);
    keyboard?.off('keydown-THREE', this.handleWeaponSlotThree);
    keyboard?.off('keydown-M', this.handleToggleMinimap);
    keyboard?.off('keydown-TAB', this.handleToggleDebug);
    keyboard?.off('keydown-BACKTICK', this.handleToggleDebug);
    this.input.off('pointerdown', this.handleFireInput);
    this.inputListenersRegistered = false;
  }

  private killUiTweens(): void {
    const tweenTargets = [
      this.muzzleFlash,
      this.wallImpactFlash,
      this.damageFlash,
      this.damageFrameTop,
      this.damageFrameBottom,
      this.damageFrameLeft,
      this.damageFrameRight,
      this.feedbackPulse,
      this.corruptionVeil,
      this.systemText,
      this.crosshair,
      this.hitMarker,
      this.finalOverlay,
      this.finalTitleText,
      this.finalSummaryText,
      this.finalHintText
    ].filter((target): target is Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc | Phaser.GameObjects.Text => target !== undefined);
    if (tweenTargets.length > 0) this.tweens.killTweensOf(tweenTargets);
  }

  private canHandleRaycastInput(): boolean {
    return this.sceneReady && this.isRaycastSceneActive() && this.combat !== undefined && this.audioFeedback !== undefined;
  }

  private isRaycastSceneActive(): boolean {
    return this.scene.isActive('RaycastScene');
  }

  private fireWeapon(): void {
    if (!this.canHandleRaycastInput()) return;
    if (!this.playerAlive || this.levelComplete) return;
    const result = this.combat.fire(this.player, this.enemies, this.map, this.time.now);
    if (!result.fired) return;

    this.flashMuzzle();
    const weaponAudio = getWeaponAudioPlan(result.weaponKind);
    this.audioFeedback.play(weaponAudio.cue, weaponAudio.intensity, this.time.now);
    if (!result.hitEnemy) {
      this.flashWallImpact();
      this.pulseCrosshair('#9feee2', 72);
      this.pulseFeedback(0x9feee2, 0.06, 78);
      this.audioFeedback.play('wallImpact', 0.95, this.time.now);
      this.setCombatMessage('WALL IMPACT');
      return;
    }

    this.enemiesKilled += result.killCount;
    const splashImpact = result.weaponKind === 'LAUNCHER' && result.splashHitCount > 0;
    if (splashImpact) {
      this.audioFeedback.play('splash', 1, this.time.now);
      this.cameras.main.shake(90, 0.0025);
      this.pulseFeedback(0xff8a3d, 0.08, 110);
    }
    this.audioFeedback.play(result.killed ? 'kill' : 'hit', result.killed ? 1 : 0.9, this.time.now);
    this.pulseCrosshair(result.killed ? '#ff5b6f' : '#ffffff', result.killed ? 118 : 92);
    this.flashHitMarker(result.killed, splashImpact);
    this.cameras.main.shake(result.killed ? 75 : 42, result.killed ? 0.0018 : 0.0011);
    this.setCombatMessage(
      result.killed
        ? RAYCAST_ATMOSPHERE.messages.kill
        : splashImpact
          ? `SPLASH HIT x${Math.max(1, result.splashHitCount)}`
        : result.hitCount > 1
          ? `HOSTILE PROCESS HIT x${result.hitCount}`
          : `HOSTILE PROCESS HIT -${result.totalDamage}`
    );
  }

  private flashMuzzle(): void {
    const weapon = this.combat.getCurrentWeapon();
    const width = weapon === 'SHOTGUN' ? 156 : weapon === 'LAUNCHER' ? 126 : 84;
    const height = weapon === 'SHOTGUN' ? 50 : weapon === 'LAUNCHER' ? 48 : 24;
    const alpha = weapon === 'SHOTGUN' ? 1 : weapon === 'LAUNCHER' ? 0.9 : 0.78;
    const flashDuration = weapon === 'LAUNCHER' ? 135 : weapon === 'SHOTGUN' ? 98 : 68;
    this.muzzleFlash.setSize(width, height);
    this.muzzleFlash.setFillStyle(weapon === 'LAUNCHER' ? 0x9feee2 : weapon === 'SHOTGUN' ? 0xff8a3d : RAYCAST_ATMOSPHERE.muzzleFlash);
    this.muzzleFlash.setAlpha(alpha);
    this.weaponOverlayFlashUntil = this.time.now + flashDuration;
    this.tweens.killTweensOf(this.muzzleFlash);
    this.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      duration: Math.max(48, Math.round(flashDuration * 0.72)),
      ease: 'Quad.easeOut'
    });
  }

  private flashWallImpact(): void {
    this.wallImpactFlash.setScale(0.65);
    this.wallImpactFlash.setAlpha(0.72);
    this.tweens.killTweensOf(this.wallImpactFlash);
    this.tweens.add({
      targets: this.wallImpactFlash,
      alpha: 0,
      scale: 1.8,
      duration: 105,
      ease: 'Quad.easeOut'
    });
  }

  private flashHitMarker(killed: boolean, splash: boolean): void {
    this.hitMarker.setText(splash ? 'xx' : 'x');
    this.hitMarker.setColor(killed ? '#ff5b6f' : splash ? '#ffb36b' : '#ffffff');
    this.hitMarker.setScale(killed ? 1.24 : 1.08);
    this.hitMarker.setAlpha(0.94);
    this.tweens.killTweensOf(this.hitMarker);
    this.tweens.add({
      targets: this.hitMarker,
      alpha: 0,
      scale: 1.5,
      duration: killed ? 130 : 96,
      ease: 'Quad.easeOut'
    });
  }

  private pulseCrosshair(color: string, duration: number): void {
    this.crosshair.setColor(color);
    this.crosshair.setScale(1.22);
    this.tweens.killTweensOf(this.crosshair);
    this.tweens.add({
      targets: this.crosshair,
      scale: 1,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => this.crosshair.setColor('#fff0c2')
    });
  }

  private pulseFeedback(color: number, alpha: number, duration: number): void {
    this.feedbackPulse.setFillStyle(color, alpha);
    this.feedbackPulse.setAlpha(alpha);
    this.tweens.killTweensOf(this.feedbackPulse);
    this.tweens.add({
      targets: this.feedbackPulse,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut'
    });
  }

  private getWeaponOverlayFlashAlpha(): number {
    if (this.time.now >= this.weaponOverlayFlashUntil) return 0;
    const weapon = this.combat.getCurrentWeapon();
    const decayWindow = weapon === 'LAUNCHER' ? 135 : weapon === 'SHOTGUN' ? 98 : 68;
    return Phaser.Math.Clamp((this.weaponOverlayFlashUntil - this.time.now) / decayWindow, 0, 1);
  }

  private setCombatMessage(message: string): void {
    this.lastCombatMessage = message.toUpperCase();
    this.combatMessageUntil = this.time.now + 1100;
    this.systemText.setText(this.lastCombatMessage);
    this.systemText.setAlpha(1);
    this.tweens.killTweensOf(this.systemText);
    this.tweens.add({
      targets: this.systemText,
      alpha: 0.14,
      delay: 700,
      duration: 560,
      ease: 'Quad.easeOut'
    });
  }

  private switchWeapon(slot: number): void {
    if (!this.canHandleRaycastInput()) return;
    if (!this.playerAlive || this.levelComplete) return;
    this.combat.switchWeaponSlot(slot);
    this.setCombatMessage(`WEAPON ROUTED: ${this.combat.getWeaponLabel()}`);
  }

  private countLivingEnemies(): number {
    return this.enemies.filter((enemy) => enemy.alive).length;
  }

  private updateEnemies(delta: number): void {
    const previousTime = this.time.now - delta;
    const activatedTelegraphs = this.enemies
      .filter((enemy) => didRaycastEnemyFinishTelegraph(enemy, previousTime, this.time.now))
      .map((enemy) => enemy.id);
    const enemyResult = updateRaycastEnemies(
      this.map,
      this.enemies,
      { x: this.player.x, y: this.player.y, alive: this.playerAlive },
      this.time.now,
      delta
    );
    if (activatedTelegraphs.length > 0) {
      this.audioFeedback.play('spawn', 0.84, this.time.now);
      this.pulseFeedback(0xffb347, 0.04, 120);
      this.setCombatMessage(activatedTelegraphs.length > 1 ? 'HOSTILES MATERIALIZED' : 'HOSTILE BREACH FORMED');
    }
    if (enemyResult.spawnedProjectiles.length > 0) {
      this.enemyProjectiles.push(...enemyResult.spawnedProjectiles);
      this.setCombatMessage('INCOMING HOSTILE PACKET');
      this.audioFeedback.play('spawn', 0.92, this.time.now);
      this.pulseFeedback(0xff5b6f, 0.04, 120);
    }
    if (enemyResult.meleeDamage > 0) this.damagePlayer(enemyResult.meleeDamage);

    const projectileDamage = updateRaycastEnemyProjectiles(
      this.map,
      this.enemyProjectiles,
      { x: this.player.x, y: this.player.y, alive: this.playerAlive },
      this.time.now,
      delta
    );
    if (projectileDamage > 0) this.damagePlayer(projectileDamage);
    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => projectile.alive);
  }

  private damagePlayer(amount: number): void {
    if (!this.playerAlive || this.levelComplete) return;
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.damageTaken += amount;
    this.lastPlayerDamageAt = this.time.now;
    this.cameras.main.shake(95, 0.003);
    this.flashDamage(amount);
    this.audioFeedback.play('damage', 1, this.time.now);
    this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.damage} -${amount}`);
    if (this.playerHealth === 0) {
      this.playerAlive = false;
      this.setCombatMessage('SIGNAL LOST');
      this.showRunCompleteOverlay('SIGNAL LOST', RAYCAST_ATMOSPHERE.warningText, false);
    }
  }

  private updateLevelState(): void {
    const previousZoneId = this.activeZoneId;
    this.activeZoneId = findRaycastZoneId(this.currentLevel, this.player.x, this.player.y);
    if (this.activeZoneId && this.activeZoneId !== previousZoneId) {
      this.tryTriggerEncounterBeat((beat) => beat.zoneId === this.activeZoneId);
    }

    this.currentLevel.keys.forEach((key) => {
      if (!this.keySystem.hasKey(key.id) && isNearPoint(this.player.x, this.player.y, key)) {
        this.keySystem.collect(key);
        this.blockedHintReason = null;
        this.audioFeedback.play('pickupKey', 1, this.time.now);
        this.pulseFeedback(0x9feee2, 0.09, 140);
        this.cameras.main.shake(55, 0.0014);
        this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.key}: ${key.pickupObjectiveText}`);
      }
    });

    this.currentLevel.doors.forEach((door) => {
      if (!this.doorSystem.isOpen(door.id) && isNearPoint(this.player.x, this.player.y, { ...door, radius: 0.78 })) {
        this.tryOpenDoor(door);
      }
    });

    this.currentLevel.triggers.forEach((trigger) => {
      const activated = this.triggerSystem.activateIfEntered(trigger, [{ x: this.player.x, y: this.player.y }], {
        isDoorOpen: (doorId) => this.doorSystem.isOpen(doorId)
      });
      if (!activated) return;

      this.gameDirector.notifyZoneTrigger(trigger.id, this.time.now);
      this.tryTriggerEncounterBeat((beat) => beat.triggerId === trigger.id);
      this.audioFeedback.play('directorAmbush', 1, this.time.now);
      this.pulseCorruption();
      this.pulseFeedback(0xff5b6f, 0.06, 170);
      this.setCombatMessage(`CORRUPTION BREACH: ${trigger.activationText}`);
      this.enemies.push(
        ...trigger.spawns.map((spawn, index) =>
          this.createTelegraphedSpawnEnemy(
            { id: `${trigger.id}-${index}`, kind: spawn.kind, x: spawn.x, y: spawn.y },
            'encounter'
          )
        )
      );
    });

    this.currentLevel.secrets.forEach((secret) => {
      if (this.collectedSecrets.has(secret.id)) return;
      if (!isNearPoint(this.player.x, this.player.y, secret)) return;
      this.playerHealth = Math.min(100, this.playerHealth + 25);
      registerRaycastSecret(this.collectedSecrets, secret);
      this.audioFeedback.play('secret', 1, this.time.now);
      this.pulseFeedback(0x9feee2, 0.11, 180);
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.secret}: ${secret.objectiveText}`);
    });

    this.currentLevel.exits.forEach((exit) => {
      if (this.levelComplete) return;
      if (!isNearPoint(this.player.x, this.player.y, exit)) return;
      const exitAccess = getRaycastExitAccess(this.currentLevel, {
        collectedKeyIds: this.currentLevel.keys.filter((key) => this.keySystem.hasKey(key.id)).map((key) => key.id),
        openDoorIds: this.currentLevel.doors.filter((door) => this.doorSystem.isOpen(door.id)).map((door) => door.id),
        activatedTriggerIds: this.currentLevel.triggers.filter((trigger) => this.triggerSystem.hasActivated(trigger.id)).map((trigger) => trigger.id),
        livingEnemyCount: this.countLivingEnemies()
      });
      if (!exitAccess.allowed) {
        this.audioFeedback.play('uiDeny', 1, this.time.now);
        this.pulseFeedback(0xff5b6f, 0.06, 110);
        this.blockedHintReason =
          exitAccess.reason === 'TOKEN_REQUIRED'
            ? 'exit-key'
            : exitAccess.reason === 'TRIGGER_REQUIRED'
              ? 'exit-trigger'
              : exitAccess.reason === 'SIGNAL_LOCKED'
                ? 'exit-combat'
                : 'exit-door';
        this.blockedHintUntil = this.time.now + 2600;
        this.setCombatMessage(exitAccess.message ?? RAYCAST_ATMOSPHERE.messages.locked);
        return;
      }
      this.levelComplete = true;
      this.episodeComplete = this.nextLevelId === null;
      this.audioFeedback.play(this.episodeComplete ? 'episodeComplete' : 'levelComplete', 1, this.time.now);
      this.pulseFeedback(this.episodeComplete ? 0xffc36b : 0x9feee2, this.episodeComplete ? 0.12 : 0.09, 260);
      this.cameras.main.shake(this.episodeComplete ? 180 : 120, this.episodeComplete ? 0.0022 : 0.0017);
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.exit}: ${exit.objectiveText}`);
      this.showRunCompleteOverlay(
        this.episodeComplete ? 'EPISODE CLEAR' : 'LEVEL CLEAR',
        RAYCAST_ATMOSPHERE.systemText,
        this.episodeComplete
      );
    });
  }

  private showRunCompleteOverlay(title: string, titleColor: string, episodeComplete = false): void {
    const episodeState = getRaycastEpisodeState(this.currentLevel.id);
    const summary = buildRaycastRunSummary({
      elapsedMs: this.time.now - this.runStartedAt,
      enemiesKilled: this.enemiesKilled,
      secretsFound: this.collectedSecrets.size,
      secretTotal: this.currentLevel.secrets.length,
      tokensFound: this.getKeyCount(),
      tokenTotal: this.currentLevel.keys.length,
      damageTaken: this.damageTaken
    });
    const levelLine = `LEVEL ${episodeState.currentLevelNumber}/${episodeState.totalLevels} ${this.currentLevel.name.toUpperCase()}`;
    const overlaySummary = episodeComplete
      ? ['EPISODE CLEAR', 'Mini episode complete. Arena remains available as a secondary sandbox.', levelLine, ...summary]
      : ['SECTOR CLEAR', 'Proceed to the next level or replay this one.', levelLine, ...summary];
    const hint = buildRaycastOverlayHint({
      currentLevelNumber: episodeState.currentLevelNumber,
      canAdvance: !episodeComplete && this.nextLevelId !== null,
      episodeComplete
    });

    this.finalTitleText.setText(title).setColor(titleColor);
    this.finalSummaryText.setText(overlaySummary.join('\n'));
    this.finalHintText.setText(hint);
    this.finalOverlay.setVisible(true).setAlpha(0.82);
    this.finalTitleText.setVisible(true);
    this.finalSummaryText.setVisible(true);
    this.finalHintText.setVisible(true);
  }

  private tryOpenDoor(door: RaycastDoor): void {
    const result = this.doorSystem.attemptOpen(door, 0);
    if (result.reason === 'MISSING_KEY') {
      this.audioFeedback.play('uiDeny', 1, this.time.now);
      this.pulseFeedback(0xff5b6f, 0.05, 100);
      this.blockedHintReason = 'door-key';
      this.blockedHintUntil = this.time.now + 2600;
      this.setCombatMessage(`TOKEN REQUIRED: ${door.lockedObjectiveText.toUpperCase()}`);
      return;
    }
    if (!result.opened) return;

    openRaycastDoor(this.map, door);
    this.blockedHintReason = null;
    this.tryTriggerEncounterBeat((beat) => beat.doorId === door.id);
    this.audioFeedback.play('door', 1, this.time.now);
    this.audioFeedback.play('uiConfirm', 0.85, this.time.now + 24);
    this.pulseFeedback(0x9feee2, 0.06, 140);
    this.cameras.main.shake(70, 0.0014);
    this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.doorOpen}: ${door.openObjectiveText}`);
  }

  private createLevelBillboards(): RaycastBillboard[] {
    const keyBillboards = this.currentLevel.keys
      .filter((key) => !this.keySystem.hasKey(key.id))
      .map((key) => ({
        x: key.x,
        y: key.y,
        color: getBillboardColor('token'),
        radius: key.radius,
        label: key.billboardLabel,
        style: 'token' as const
      }));
    const doorBillboards = this.currentLevel.doors
      .map((door) => ({
        x: door.x,
        y: door.y,
        color: getBillboardColor(this.doorSystem.isOpen(door.id) ? 'gate-open' : 'gate', this.doorSystem.isOpen(door.id)),
        radius: this.doorSystem.isOpen(door.id) ? 0.22 : 0.18,
        label: this.doorSystem.isOpen(door.id) ? 'OPEN' : 'LOCK',
        style: this.doorSystem.isOpen(door.id) ? ('gate-open' as const) : ('gate' as const)
      }));
    const secretBillboards = this.currentLevel.secrets
      .filter((secret) => !this.collectedSecrets.has(secret.id))
      .map((secret) => ({
        x: secret.x,
        y: secret.y,
        color: getBillboardColor('secret'),
        radius: secret.radius,
        label: secret.billboardLabel,
        style: 'secret' as const
      }));
    const exitBillboards = this.currentLevel.exits.map((exit) => ({
      x: exit.x,
      y: exit.y,
      color: getBillboardColor('exit', this.levelComplete),
      radius: exit.radius,
      label: this.getObjectiveHint() === 'REACH EXIT' || this.levelComplete ? 'PORTAL' : exit.billboardLabel,
      style: 'exit' as const
    }));

    return [...keyBillboards, ...doorBillboards, ...secretBillboards, ...exitBillboards];
  }

  private updatePlayerMetrics(delta: number): void {
    const movement = Math.hypot(this.player.x - this.lastPlayerPosition.x, this.player.y - this.lastPlayerPosition.y);
    this.playerStationaryMs = movement < 0.01 ? this.playerStationaryMs + delta : 0;
    this.lastPlayerPosition = { x: this.player.x, y: this.player.y };
  }

  private updateGameDirector(): void {
    if (!this.currentLevel.director.enabled) return;

    const decision = this.gameDirector.update({
      elapsedTime: this.time.now,
      totalKills: this.enemiesKilled,
      enemiesAlive: this.countLivingEnemies(),
      p1Health: this.playerHealth,
      p2Health: this.playerHealth,
      p1Alive: this.playerAlive,
      p2Alive: this.playerAlive,
      currentWave: this.getActivatedTriggerCount() + 1,
      timeSincePlayerDamagedMs: Math.max(0, this.time.now - this.lastPlayerDamageAt),
      playerStationaryMs: this.playerStationaryMs,
      equippedWeapons: [this.combat.getCurrentWeapon()],
      activeZoneId: this.activeZoneId,
      activatedTriggerCount: this.getActivatedTriggerCount(),
      distanceToImportantPickup: this.getDistanceToImportantPickup(),
      spawnPoints: getSafeDirectorSpawnPoints(this.currentLevel, this.player, this.activeZoneId, {
        map: this.map,
        enemies: this.enemies,
        allowVisibleFrontSpawns: false
      })
    });

    const previousState = this.lastDirectorState;
    this.directorIntensity = decision.intensity;
    this.directorDebug = decision.debug;
    this.lastDirectorState = decision.state;
    this.announceDirectorStateChange(previousState, decision.state);
    this.handleDirectorEvents(decision.events, decision.spawn);
  }

  private handleDirectorEvents(events: DirectorEvent[], spawn: SpawnRequest | null): void {
    let spawnedFromEvent = false;

    events.forEach((event) => {
      const audioPlan = getDirectorEventAudioPlan(event.type);
      if (event.type === 'AMBIENT_PULSE') {
        this.audioFeedback.play(audioPlan.cue, audioPlan.intensity, this.time.now);
        return;
      }

      if (event.type === 'WARNING_MESSAGE') {
        this.audioFeedback.play(audioPlan.cue, audioPlan.intensity, this.time.now);
        this.pulseFeedback(0xff5b6f, 0.045, 130);
        this.pulseCorruption();
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'PREPARE_AMBUSH') {
        this.audioFeedback.play(audioPlan.cue, audioPlan.intensity, this.time.now);
        this.pulseFeedback(0xff5b6f, 0.065, 180);
        this.pulseCorruption();
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'RECOVERY_SIGNAL') {
        this.audioFeedback.play(audioPlan.cue, audioPlan.intensity, this.time.now);
        this.pulseFeedback(0x9feee2, 0.05, 150);
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'PUNISH_STATIONARY') {
        this.audioFeedback.play(audioPlan.cue, audioPlan.intensity, this.time.now);
        this.pulseFeedback(0xff5b6f, 0.07, 130);
        this.pulseCorruption();
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'SPAWN_PRESSURE' && spawn) {
        spawnedFromEvent = true;
        this.spawnDirectorEnemy(spawn);
      }
    });

    if (spawn && !spawnedFromEvent) this.spawnDirectorEnemy(spawn);
  }

  private announceDirectorStateChange(previousState: DirectorState | null, nextState: DirectorState): void {
    if (previousState === null || previousState === nextState) return;
    if (nextState === 'WARNING') this.setCombatMessage(RAYCAST_ATMOSPHERE.messages.pressure);
    if (nextState === 'PRESSURE' || nextState === 'AMBUSH') this.setCombatMessage(RAYCAST_ATMOSPHERE.messages.surge);
    if (nextState === 'RECOVERY') {
      const triggered = this.tryTriggerEncounterBeat((beat) => beat.directorState === 'RECOVERY');
      if (!triggered) this.setCombatMessage(RAYCAST_ATMOSPHERE.messages.recovery);
    }
  }

  private spawnDirectorEnemy(spawn: SpawnRequest): void {
    this.enemies.push(
      this.createTelegraphedSpawnEnemy(
        {
          id: `director-${this.directorSpawnCounter}`,
          kind: spawn.kind,
          x: spawn.x,
          y: spawn.y
        },
        'director'
      )
    );
    this.directorSpawnCounter += 1;
    this.audioFeedback.play('directorAmbush', 1, this.time.now);
    this.pulseCorruption();
    this.pulseFeedback(0xff5b6f, 0.06, 160);
    this.setCombatMessage(`HOSTILE SIGNAL DETECTED: ${spawn.kind}`);
  }

  private createTelegraphedSpawnEnemy(
    spawn: { id: string; kind: SpawnRequest['kind']; x: number; y: number },
    source: 'director' | 'encounter'
  ): RaycastEnemy {
    const visibleToPlayer = this.hasLineOfSightToPoint(spawn.x, spawn.y);
    const distanceToPlayer = Math.hypot(spawn.x - this.player.x, spawn.y - this.player.y);
    const baseDuration = source === 'director' ? DIRECTOR_SPAWN_TELEGRAPH_MS : ENCOUNTER_SPAWN_TELEGRAPH_MS;
    const telegraphDurationMs =
      baseDuration +
      (visibleToPlayer ? VISIBLE_SPAWN_TELEGRAPH_BONUS_MS : 0) +
      (distanceToPlayer <= 5.5 ? CLOSE_SPAWN_TELEGRAPH_BONUS_MS : 0);

    return createTelegraphedRaycastEnemy(spawn, {
      telegraphStartedAt: this.time.now,
      telegraphDurationMs
    });
  }

  private hasLineOfSightToPoint(x: number, y: number): boolean {
    const angle = Math.atan2(y - this.player.y, x - this.player.x);
    const distance = Math.hypot(x - this.player.x, y - this.player.y);
    const hit = castRay(this.map, this.player.x, this.player.y, angle, angle);
    return hit.distance + 0.08 >= distance;
  }

  private getActivatedTriggerCount(): number {
    return this.currentLevel.triggers.filter((trigger) => this.triggerSystem.hasActivated(trigger.id)).length;
  }

  private getDistanceToImportantPickup(): number | null {
    const uncollectedKeyDistances = this.currentLevel.keys
      .filter((key) => !this.keySystem.hasKey(key.id))
      .map((key) => Math.hypot(key.x - this.player.x, key.y - this.player.y));
    return uncollectedKeyDistances.length > 0 ? Math.min(...uncollectedKeyDistances) : null;
  }

  private getHudCriticalMessage(): string | undefined {
    if (this.playerHealth <= 30) return RAYCAST_ATMOSPHERE.messages.critical;
    if (this.time.now < this.combatMessageUntil) return this.lastCombatMessage;
    return undefined;
  }

  private getCurrentStatusMessage(): string {
    if (this.time.now < this.combatMessageUntil) return this.lastCombatMessage;
    return buildRaycastStatusMessage(this.levelComplete, this.episodeComplete, this.playerAlive);
  }

  private getDirectorDebugLine(): string {
    if (!this.currentLevel.director.enabled) return 'director off';
    if (!this.directorDebug) return 'director warming up';
    return [
      `AI ${DIRECTOR_STATE_LABELS[this.directorDebug.state]}`,
      `int ${this.directorDebug.intensity}`,
      `alive ${this.directorDebug.enemiesAlive}/${this.directorDebug.maxEnemiesAlive ?? '?'}`,
      `cd ${Math.ceil(this.directorDebug.spawnCooldownRemainingMs / 1000)}s`,
      `budget ${this.directorDebug.spawnBudgetRemaining ?? '?'}`,
      `camp ${Math.ceil((this.directorDebug.antiCampMeterMs ?? 0) / 100) / 10}s`,
      this.directorDebug.lastDecisionReason
    ].join(' | ');
  }

  private getAtmosphereOptions() {
    return getAtmosphereForDirector(this.directorDebug?.state ?? null, this.directorIntensity);
  }

  private getKeyCount(): number {
    return this.currentLevel.keys.filter((key) => this.keySystem.hasKey(key.id)).length;
  }

  private getObjectiveState(): RaycastObjectiveState {
    if (this.blockedHintReason && this.time.now >= this.blockedHintUntil) {
      this.blockedHintReason = null;
    }

    return {
      levelComplete: this.levelComplete,
      keyCount: this.getKeyCount(),
      keyTotal: this.currentLevel.keys.length,
      closedDoorCount: this.currentLevel.doors.filter((door) => !this.doorSystem.isOpen(door.id)).length,
      activatedTriggerCount: this.getActivatedTriggerCount(),
      requiredTriggerCount: this.currentLevel.progression.requiredExitTriggerIds.length,
      livingEnemyCount: this.countLivingEnemies(),
      playerStationaryMs: this.playerStationaryMs,
      recentBlockedReason: this.blockedHintReason
    };
  }

  private getObjectiveHint(): string {
    return buildRaycastCurrentObjective(this.getObjectiveState());
  }

  private renderMinimap(): void {
    this.minimapGraphics.clear();
    this.minimapMarkerLabels.forEach((label) => label.setVisible(false));
    if (!this.minimapVisible) return;

    const model = buildRaycastMinimapModel({
      map: this.map,
      level: this.currentLevel,
      player: this.player,
      collectedKeyIds: this.currentLevel.keys.filter((key) => this.keySystem.hasKey(key.id)).map((key) => key.id),
      openDoorIds: this.currentLevel.doors.filter((door) => this.doorSystem.isOpen(door.id)).map((door) => door.id),
      collectedSecretIds: this.collectedSecrets
    });
    const panelWidth = 132;
    const panelHeight = 98;
    const originX = GAME_WIDTH - 150;
    const originY = 84;
    const tileSize = Math.max(4, Math.floor(Math.min(panelWidth / model.width, panelHeight / model.height)));
    const offsetX = originX + Math.floor((panelWidth - model.width * tileSize) / 2);
    const offsetY = originY + Math.floor((panelHeight - model.height * tileSize) / 2);

    model.cells.forEach((cell) => {
      const color = cell.kind === 'wall' ? 0x47606d : cell.kind === 'door' ? 0xffb347 : 0x142129;
      const alpha = cell.kind === 'floor' ? 0.88 : 1;
      this.minimapGraphics.fillStyle(color, alpha);
      this.minimapGraphics.fillRect(offsetX + cell.x * tileSize, offsetY + cell.y * tileSize, tileSize - 1, tileSize - 1);
    });

    model.markers
      .filter((marker) => marker.active)
      .forEach((marker) => {
        const px = offsetX + marker.x * tileSize;
        const py = offsetY + marker.y * tileSize;
        if (marker.kind === 'player') {
          this.minimapGraphics.fillStyle(0xfff29e, 1);
          this.minimapGraphics.fillCircle(px, py, Math.max(2, tileSize * 0.3));
          const dirX = Math.cos(marker.angle ?? 0) * tileSize * 0.7;
          const dirY = Math.sin(marker.angle ?? 0) * tileSize * 0.7;
          this.minimapGraphics.lineStyle(2, 0xfff29e, 0.95);
          this.minimapGraphics.beginPath();
          this.minimapGraphics.moveTo(px, py);
          this.minimapGraphics.lineTo(px + dirX, py + dirY);
          this.minimapGraphics.strokePath();
          return;
        }

        const color =
          marker.kind === 'key'
            ? 0x9feee2
            : marker.kind === 'exit'
              ? 0x6fd8ff
              : 0xffb347;
        this.minimapGraphics.fillStyle(color, 0.95);
        this.minimapGraphics.fillRect(px - 2, py - 2, Math.max(4, tileSize - 2), Math.max(4, tileSize - 2));
      });

    const labeledMarkers = model.markers.filter((marker) => this.shouldRenderMinimapMarkerLabel(marker));
    labeledMarkers.slice(0, this.minimapMarkerLabels.length).forEach((marker, index) => {
      const label = this.minimapMarkerLabels[index];
      const markerX = offsetX + marker.x * tileSize;
      const markerY = offsetY + marker.y * tileSize;
      label.setText(marker.label);
      const textX = Phaser.Math.Clamp(markerX + 4, originX + 6, originX + panelWidth - label.width - 4);
      const textY = Phaser.Math.Clamp(markerY - 6, originY + 3, originY + panelHeight - label.height - 3);
      label.setPosition(textX, textY).setVisible(true);
    });
  }

  private shouldRenderMinimapMarkerLabel(marker: { kind: string; label: string; active: boolean }): boolean {
    if (!marker.active) return false;
    if (marker.kind === 'door') return marker.label === 'LOCK' || marker.label === 'OPEN';
    if (marker.kind === 'exit') return marker.label === 'EXIT';
    return false;
  }

  private updateHealthHud(): void {
    const visual = getRaycastHealthVisualState(this.playerHealth);
    this.healthText.setText(buildRaycastPlayerHealthLine({ health: this.playerHealth })).setColor(visual.color);
    this.healthBarFill.setFillStyle(visual.accentColor, 1);
    this.healthBarFill.setSize(168 * visual.ratio, 6);
  }

  private updateFocusedEnemyHud(): void {
    const target = getRaycastCrosshairTargetInfo(
      this.player,
      this.enemies,
      castRay(this.map, this.player.x, this.player.y, this.player.angle, this.player.angle).distance,
      this.time.now
    );
    if (!target) {
      this.targetText.setVisible(false);
      this.targetBarTrack.setVisible(false);
      this.targetBarFill.setVisible(false);
      return;
    }

    const targetColor = target.isTelegraphing ? '#ffcf7c' : target.isWindingUp ? '#ff9ca8' : '#fff0c2';
    this.targetText
      .setText(
        buildRaycastFocusedEnemyLine({
          label: target.kindLabel,
          health: target.health,
          maxHealth: target.maxHealth,
          isWindingUp: target.isWindingUp,
          isTelegraphing: target.isTelegraphing
        })
      )
      .setColor(targetColor)
      .setVisible(true);
    this.targetBarTrack.setVisible(true);
    this.targetBarFill
      .setVisible(true)
      .setFillStyle(target.isTelegraphing ? 0xffb347 : target.isWindingUp ? 0xff5b6f : 0xfff29e, 1);
    this.targetBarFill.setSize(118 * Phaser.Math.Clamp(target.healthRatio, 0, 1), 4);
  }

  private flashDamage(amount: number): void {
    const frameAlpha = Phaser.Math.Clamp(0.42 + amount / 22, 0.42, 0.9);
    const flashAlpha = Phaser.Math.Clamp(0.16 + amount / 60, 0.16, 0.32);
    this.damageFlash.setAlpha(flashAlpha);
    this.damageFrameTop.setAlpha(frameAlpha);
    this.damageFrameBottom.setAlpha(frameAlpha);
    this.damageFrameLeft.setAlpha(frameAlpha);
    this.damageFrameRight.setAlpha(frameAlpha);
    this.tweens.killTweensOf([
      this.damageFlash,
      this.damageFrameTop,
      this.damageFrameBottom,
      this.damageFrameLeft,
      this.damageFrameRight
    ]);
    this.tweens.add({
      targets: [
        this.damageFlash,
        this.damageFrameTop,
        this.damageFrameBottom,
        this.damageFrameLeft,
        this.damageFrameRight
      ],
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut'
    });
  }

  private pulseCorruption(): void {
    this.corruptionVeil.setAlpha(0.18);
    this.tweens.killTweensOf(this.corruptionVeil);
    this.tweens.add({
      targets: this.corruptionVeil,
      alpha: this.getAtmosphereOptions().corruptionAlpha,
      duration: 360,
      ease: 'Quad.easeOut'
    });
  }

  private updateAtmospherePulse(): void {
    if (this.time.now < this.nextAmbientCueAt) return;
    this.audioFeedback.play('ambient', 0.75, this.time.now);
    const interval = this.directorDebug?.state === 'AMBUSH' || this.directorDebug?.state === 'PRESSURE' ? 4200 : 7600;
    this.nextAmbientCueAt = this.time.now + interval;
  }

  private tryTriggerEncounterBeat(predicate: (beat: RaycastEncounterBeat) => boolean): boolean {
    const beat = this.currentLevel.encounterBeats.find((candidate) => {
      if (this.completedEncounterBeats.has(candidate.id)) return false;
      if (candidate.requiresTriggerId && !this.triggerSystem.hasActivated(candidate.requiresTriggerId)) return false;
      return predicate(candidate);
    });
    if (!beat) return false;

    this.completedEncounterBeats.add(beat.id);
    this.audioFeedback.play(beat.directorState === 'RECOVERY' ? 'directorRecovery' : 'directorWarning', 0.8, this.time.now);
    if (beat.directorState === 'RECOVERY') this.pulseFeedback(0x9feee2, 0.04, 140);
    else this.pulseFeedback(0xff5b6f, 0.04, 130);
    if (beat.directorState !== 'RECOVERY') this.pulseCorruption();
    this.setCombatMessage(beat.message);
    return true;
  }
}
