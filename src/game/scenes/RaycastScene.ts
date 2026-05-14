import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DoorSystem } from '../systems/DoorSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import {
  buildEncounterPatternSpawns,
  getEncounterPatternKinds,
  type EncounterPatternId
} from '../systems/EncounterPattern';
import { KeySystem } from '../systems/KeySystem';
import { TriggerSystem } from '../systems/TriggerSystem';
import { getEnemyConfig, getRaycastEnemyRoleAbbrev } from '../entities/enemyConfig';
import type { EnemyKind } from '../types/game';
import {
  AudioFeedbackSystem,
  getDirectorEventAudioPlan,
  getWeaponAudioPlan,
  type AudioFeedbackCue
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
  RAYCAST_WORLD_TWO_CATALOG,
  RAYCAST_WORLD_THREE_CATALOG,
  isRaycastPointReachable,
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor,
  registerRaycastPickup,
  registerRaycastSecret,
  RAYCAST_LEVEL,
  isRaycastSpawnPlacementValid,
  type RaycastDoor,
  type RaycastEncounterBeat,
  type RaycastEncounterPatternBinding,
  type RaycastLevel,
  isRaycastMapPointReachable
} from '../raycast/RaycastLevel';
import {
  buildSyntheticBossLateralBinding,
  selectRaycastEncounterPatternBinding
} from '../raycast/RaycastEncounterDirector';
import { getRaycastEpisodeState, resolveRaycastNextLevelId } from '../raycast/RaycastEpisode';
import {
  buildRaycastMinimapModel,
  buildStaticRaycastMinimapCells,
  getRaycastMinimapEnemyDotStyle,
  type RaycastMinimapCell,
  type RaycastMinimapEnemyBlip,
  type RaycastMinimapMarker
} from '../raycast/RaycastMinimap';
import { registerRaycastOptionalAssets } from '../raycast/raycastAssetHooks';
import {
  addRaycastBossClearScore,
  addRaycastCampaignCompletionBonus,
  addRaycastKillScore,
  addRaycastSecretScore,
  addRaycastSectorPerformanceBonus,
  computeRaycastCampaignMedals,
  computeRaycastSectorMedals,
  createEmptyCampaignMetrics,
  mergeCampaignMetrics,
  RAYCAST_FULL_ARC_CLEAR_BONUS,
  RAYCAST_WORLD2_ENTRY_POINTS,
  RAYCAST_WORLD3_ENTRY_POINTS,
  readRaycastHighScore,
  writeRaycastHighScoreIfBetter,
  type RaycastCampaignMetrics,
  type RaycastSectorMetrics
} from '../raycast/RaycastScore';
import {
  computeRaycastBossWeaponDamage,
  countRaycastBossConnectingPellets,
  createRaycastBossState,
  damageRaycastBoss,
  getRaycastBossPhaseLabel,
  getRaycastBossCrosshairTarget,
  tickRaycastBossArenaTwist,
  tickRaycastBossMovement,
  tickRaycastBossVolleys,
  type RaycastBossState
} from '../raycast/RaycastBoss';
import { castRay, RAYCAST_PLAYER_START, type RaycastMap } from '../raycast/RaycastMap';
import { getRaycastHudCss, RAYCAST_PALETTE, type RaycastHudCssBundle } from '../raycast/RaycastPalette';
import {
  buildRaycastCurrentObjective,
  buildRaycastHintText,
  formatRaycastObjectiveHudLabel,
  type RaycastBlockedReason,
  type RaycastObjectiveState
} from '../raycast/RaycastObjective';
import {
  applyWorldSegmentToAtmosphere,
  getAtmosphereForDirector,
  getRaycastBossHudLines,
  getRaycastCombatMessageForSegment,
  getRaycastExitMessageForSegment,
  getRaycastIntroMessageForSegment,
  RAYCAST_ATMOSPHERE,
  type RaycastWorldSegmentId
} from '../raycast/RaycastAtmosphere';
import type { RaycastSetpieceCue } from '../raycast/RaycastSetpiece';
import {
  buildRaycastHudLayout,
  buildRaycastDebugLine,
  buildRaycastFocusedEnemyLine,
  buildRaycastHudProgressLine,
  buildRaycastHudStatusLine,
  buildRaycastMinimapLegendLine,
  buildRaycastScoreHudLine,
  getRaycastHealthVisualState
} from '../raycast/RaycastHud';
import {
  createRaycastDifficultyDirectorConfig,
  DEFAULT_RAYCAST_DIFFICULTY_ID,
  getRaycastDifficultyHealthPickup,
  getRaycastDifficultyPassiveHealConfig,
  getRaycastDifficultyPreset,
  RAYCAST_DIFFICULTY_REGISTRY_KEY,
  scaleRaycastIncomingDamage,
  type RaycastDifficultyId
} from '../raycast/RaycastDifficulty';
import {
  buildRaycastDeathOverlayHint,
  buildRaycastDeathOverlaySummary,
  buildRaycastEpisodeBanner,
  buildRaycastHelpOverlayText,
  buildRaycastLevelStartObjectiveMessage,
  buildRaycastOverlayHint,
  buildRaycastPriorityMessage,
  buildRaycastStatusMessage
} from '../raycast/RaycastPresentation';
import { RaycastPlayerController, type RaycastPlayerState } from '../raycast/RaycastPlayerController';
import { RaycastRenderer, type RaycastBillboard } from '../raycast/RaycastRenderer';
import { buildRaycastRunSummary } from '../raycast/RaycastRunSummary';
import { appendRaycastPlaytestTelemetry } from '../raycast/RaycastTelemetry';
import {
  buildRaycastLowHealthWarningMessage,
  getRaycastFeedbackActions,
  shouldPlayRaycastLowHealthWarning,
  type RaycastFeedbackEvent
} from '../raycast/RaycastFeedback';
import {
  applyRaycastHealthPickup,
  buildRaycastLowHealthHint,
  RAYCAST_LOW_HEALTH_HINT_THRESHOLD,
  RAYCAST_PLAYER_MAX_HEALTH
} from '../raycast/RaycastItems';
import {
  computeEnemySwarmHealScale,
  computePassiveHealCombatScale,
  formatRaycastPassiveRegenHudLabel,
  getRaycastPassiveRegenHudState,
  tickRaycastPassiveHeal
} from '../raycast/RaycastPassiveHeal';
import {
  formatRaycastPauseMenuBody,
  RAYCAST_PAUSE_MENU_ACTIONS,
  RAYCAST_PAUSE_MENU_LABELS
} from '../raycast/RaycastPauseMenu';
import { getBillboardColor } from '../raycast/RaycastVisualTheme';
import { palette } from '../theme/palette';

interface RaycastSceneData {
  levelId?: string;
  difficultyId?: RaycastDifficultyId;
  /** Carry cumulative score when advancing to the next map in an episode. */
  carryScore?: number;
  /** Carry merged campaign metrics (pellets, damage, secrets, wall time). */
  carryCampaignMetrics?: RaycastCampaignMetrics;
  /** First World 2 map after Episode 1 boss — applies one-time breach bonus. */
  breachWorldTwo?: boolean;
  /** First World 3 map after World 2 finale — applies one-time breach bonus. */
  breachWorldThree?: boolean;
}

const DIRECTOR_SPAWN_TELEGRAPH_MS = 820;
const ENCOUNTER_SPAWN_TELEGRAPH_MS = 980;
const VISIBLE_SPAWN_TELEGRAPH_BONUS_MS = 260;
const CLOSE_SPAWN_TELEGRAPH_BONUS_MS = 180;
const DEV_SHORTCUT_ENABLED = import.meta.env.DEV;

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
  private readonly collectedHealthPickups = new Set<string>();
  private readonly completedEncounterBeats = new Set<string>();
  private readonly deferredPickupHints = new Map<string, number>();
  private enemiesKilled = 0;
  /** Pellets fired / hostile-connecting hits — Phase 24 instrumentation for future scoring (not yet shown in HUD overlay). */
  private runPelletsFired = 0;
  private runPelletsHitHostile = 0;
  /** Boss arena only — while Archon lives (efficiency / damage splits). */
  private runBossPelletsFired = 0;
  private runBossPelletsHitHostile = 0;
  private runBossDamageTaken = 0;
  private runScore = 0;
  /** Cross-sector aggregate for finale scoring + summary (Phase 26). */
  private campaignMetrics!: RaycastCampaignMetrics;
  private carriedScoreFromEpisode = 0;
  private levelStartScore = 0;
  private levelStartCampaignMetrics: RaycastCampaignMetrics = createEmptyCampaignMetrics();
  private pendingWorldTwoBreachBonus = false;
  private pendingWorldThreeBreachBonus = false;
  private bossState: RaycastBossState | null = null;
  private playerStationaryMs = 0;
  private lastPlayerDamageAt = 0;
  private lastPlayerPosition: { x: number; y: number } = { x: RAYCAST_PLAYER_START.x, y: RAYCAST_PLAYER_START.y };
  private activeZoneId: string | null = null;
  private directorDebug: DirectorDebugInfo | null = null;
  private lastDirectorState: DirectorState | null = null;
  private directorIntensity = 0;
  private directorSpawnCounter = 0;
  private readonly encounterPatternCooldownUntil = new Map<string, number>();
  private debugHudVisible = false;
  private minimapVisible = true;
  private helpOverlayVisible = false;
  private gamePaused = false;
  private pauseSelectionIndex = 0;
  private passiveRegenHudActive = false;
  private passiveRegenHudLabel: string | null = null;
  private passiveHealFractionalCarry = 0;
  private audioMasterVolume = 1;
  private billboardSig = '';
  private cachedBillboards: RaycastBillboard[] = [];
  private minimapFrameCounter = 0;
  private readonly minimapKeyIdScratch: string[] = [];
  private readonly minimapDoorIdScratch: string[] = [];
  private readonly minimapEnemyBlipScratch: RaycastMinimapEnemyBlip[] = [];
  /** Invalidated when a door mutates the map grid (`openRaycastDoor`). */
  private mapLayoutRevision = 0;
  private minimapStaticCellsCacheKey = '';
  private minimapStaticCells: RaycastMinimapCell[] | null = null;
  private readonly minimapLabeledMarkerScratch: RaycastMinimapMarker[] = [];
  private pauseBackdrop!: Phaser.GameObjects.Rectangle;
  private pauseTitleText!: Phaser.GameObjects.Text;
  private pauseMenuBodyText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private healthBarTrack!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private targetBarTrack!: Phaser.GameObjects.Rectangle;
  private targetBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossPhaseText!: Phaser.GameObjects.Text;
  private bossBarTrack!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private objectiveText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private scoreHudText!: Phaser.GameObjects.Text;
  private minimapFrame!: Phaser.GameObjects.Rectangle;
  private minimapTitleText!: Phaser.GameObjects.Text;
  private helpOverlayFrame!: Phaser.GameObjects.Rectangle;
  private helpOverlayTitleText!: Phaser.GameObjects.Text;
  private helpOverlayText!: Phaser.GameObjects.Text;
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
  private bossTelegraphActive = false;
  private lastBossPhase: 1 | 2 | 3 | null = null;
  private lastCombatMessage: string = RAYCAST_ATMOSPHERE.messages.intro;
  private hudCss!: RaycastHudCssBundle;
  private combatMessageUntil = 0;
  private blockedHintReason: RaycastBlockedReason | null = null;
  private blockedHintUntil = 0;
  private lastLowHealthWarningAt: number | null = null;
  private nextAmbientCueAt = 0;
  private sceneReady = false;
  private inputListenersRegistered = false;
  private difficultyId: RaycastDifficultyId = DEFAULT_RAYCAST_DIFFICULTY_ID;

  private readonly handleExitToMenu = (): void => {
    if (!this.isRaycastSceneActive()) return;
    this.gamePaused = false;
    this.scene.start('MenuScene');
  };

  private readonly handleRetry = (): void => {
    if (!this.isRaycastSceneActive()) return;
    if (this.gamePaused) return;
    this.scene.restart({
      levelId: this.currentLevel.id,
      difficultyId: this.difficultyId,
      carryScore: this.levelStartScore,
      carryCampaignMetrics: this.levelStartCampaignMetrics
    });
  };

  private readonly handleAdvanceLevel = (): void => {
    if (!this.isRaycastSceneActive()) return;
    if (this.gamePaused) return;
    if (!this.levelComplete || this.episodeComplete || this.nextLevelId === null) return;
    const nextId = this.nextLevelId;
    const breachWorldTwo =
      Boolean(this.currentLevel.bossConfig) && nextId === RAYCAST_WORLD_TWO_CATALOG[0]?.id;
    const breachWorldThree =
      this.currentLevel.id === RAYCAST_WORLD_TWO_CATALOG[RAYCAST_WORLD_TWO_CATALOG.length - 1]?.id &&
      nextId === RAYCAST_WORLD_THREE_CATALOG[0]?.id;
    this.scene.restart({
      levelId: nextId,
      difficultyId: this.difficultyId,
      carryScore: this.runScore,
      carryCampaignMetrics: this.campaignMetrics,
      breachWorldTwo,
      breachWorldThree
    });
  };

  private readonly handleWorldTwoPlaceholder = (): void => {
    if (!this.isRaycastSceneActive()) return;
    if (this.gamePaused) return;
    if (!this.levelComplete || !this.episodeComplete || !this.currentLevel.bossConfig) return;
    if (RAYCAST_WORLD_TWO_CATALOG.length > 0) return;
    this.scene.start('RaycastWorldLockedScene');
  };

  private readonly handleFireInput = (): void => {
    if (this.gamePaused) return;
    this.fireWeapon();
  };

  private readonly handleWeaponSlotOne = (): void => {
    if (this.gamePaused) return;
    this.switchWeapon(1);
  };

  private readonly handleWeaponSlotTwo = (): void => {
    if (this.gamePaused) return;
    this.switchWeapon(2);
  };

  private readonly handleWeaponSlotThree = (): void => {
    if (this.gamePaused) return;
    this.switchWeapon(3);
  };

  private readonly handleToggleDebug = (): void => {
    if (this.gamePaused) return;
    this.applyDebugHudToggle();
  };

  private readonly handleToggleMinimap = (): void => {
    if (this.gamePaused) return;
    this.applyMinimapToggle();
  };

  private readonly handleToggleHelp = (): void => {
    if (this.gamePaused) return;
    this.helpOverlayVisible = !this.helpOverlayVisible;
    this.helpOverlayFrame?.setVisible(this.helpOverlayVisible);
    this.helpOverlayTitleText?.setVisible(this.helpOverlayVisible);
    this.helpOverlayText?.setVisible(this.helpOverlayVisible);
  };

  private readonly handleHelpShortcut = (event: KeyboardEvent): void => {
    if (this.gamePaused) return;
    if (event.shiftKey) this.handleToggleHelp();
  };

  private readonly handleDevJumpWorld3Final = (): void => {
    if (!DEV_SHORTCUT_ENABLED) return;
    if (this.gamePaused || !this.isRaycastSceneActive()) return;
    const finalWorld3Level = RAYCAST_WORLD_THREE_CATALOG[RAYCAST_WORLD_THREE_CATALOG.length - 1];
    if (!finalWorld3Level) return;
    console.info(`[DEV SHORTCUT] Jumping to World 3 final encounter: ${finalWorld3Level.id}`);
    this.setCombatMessage(`DEV JUMP // ${finalWorld3Level.name.toUpperCase()}`, 2600);
    this.scene.restart({
      levelId: finalWorld3Level.id,
      difficultyId: this.difficultyId,
      carryScore: this.runScore,
      carryCampaignMetrics: this.campaignMetrics
    });
  };

  private readonly handleDevShiftThree = (event: KeyboardEvent): void => {
    if (!DEV_SHORTCUT_ENABLED) return;
    if (!event.shiftKey) return;
    this.handleDevJumpWorld3Final();
  };

  private readonly handleEscKey = (): void => {
    if (!this.isRaycastSceneActive()) return;
    if (this.gamePaused) {
      this.closePauseMenu();
      return;
    }
    if (this.playerAlive && !this.levelComplete) {
      this.openPauseMenu();
      return;
    }
    this.handleExitToMenu();
  };

  private readonly handlePauseMenuUp = (): void => {
    if (!this.gamePaused) return;
    this.pauseSelectionIndex =
      (this.pauseSelectionIndex + RAYCAST_PAUSE_MENU_LABELS.length - 1) % RAYCAST_PAUSE_MENU_LABELS.length;
    this.refreshPauseMenuBody();
  };

  private readonly handlePauseMenuDown = (): void => {
    if (!this.gamePaused) return;
    this.pauseSelectionIndex = (this.pauseSelectionIndex + 1) % RAYCAST_PAUSE_MENU_LABELS.length;
    this.refreshPauseMenuBody();
  };

  private readonly handlePauseMenuConfirm = (): void => {
    if (!this.gamePaused) return;
    const action = RAYCAST_PAUSE_MENU_ACTIONS[this.pauseSelectionIndex];
    switch (action) {
      case 'resume':
        this.closePauseMenu();
        break;
      case 'restart':
        this.closePauseMenu();
        this.scene.restart({
          levelId: this.currentLevel.id,
          difficultyId: this.difficultyId,
          carryScore: this.levelStartScore,
          carryCampaignMetrics: this.levelStartCampaignMetrics
        });
        break;
      case 'menu':
        this.closePauseMenu();
        this.handleExitToMenu();
        break;
      case 'vol_up':
        this.adjustAudioMasterVolume(0.1);
        break;
      case 'vol_down':
        this.adjustAudioMasterVolume(-0.1);
        break;
      case 'minimap':
        this.applyMinimapToggle();
        break;
      case 'debug':
        this.applyDebugHudToggle();
        break;
      default:
        break;
    }
    this.refreshPauseMenuBody();
  };

  constructor() {
    super('RaycastScene');
  }

  init(data: RaycastSceneData = {}): void {
    this.currentLevel = getRaycastLevelById(data.levelId);
    this.nextLevelId = resolveRaycastNextLevelId(this.currentLevel.id);
    this.difficultyId = getRaycastDifficultyPreset(data.difficultyId ?? this.registry.get(RAYCAST_DIFFICULTY_REGISTRY_KEY)).id;
    this.registry.set(RAYCAST_DIFFICULTY_REGISTRY_KEY, this.difficultyId);
    this.carriedScoreFromEpisode = data.carryScore ?? 0;
    this.pendingWorldTwoBreachBonus = Boolean(data.breachWorldTwo);
    this.pendingWorldThreeBreachBonus = Boolean(data.breachWorldThree);
    this.campaignMetrics = data.carryCampaignMetrics ?? createEmptyCampaignMetrics();
  }

  create(): void {
    registerRaycastOptionalAssets(this);
    this.resetRuntimeState();
    this.cameras.main.setBackgroundColor(
      this.getWorldSegment() === 'world2' ? '#030612' : this.getWorldSegment() === 'world3' ? '#0c0604' : '#05070c'
    );
    this.map = cloneRaycastMap(this.currentLevel.map);
    this.keySystem = new KeySystem();
    this.doorSystem = new DoorSystem(this.keySystem);
    this.triggerSystem = new TriggerSystem();
    this.raycastRenderer = new RaycastRenderer(this, this.map, this.currentLevel);
    this.controller = new RaycastPlayerController(this, this.map, this.player);
    this.controller.create();
    this.combat = new RaycastCombatSystem();
    this.audioFeedback = new AudioFeedbackSystem();
    this.audioFeedback.setMasterVolume(this.audioMasterVolume);
    this.gameDirector = new GameDirector({
      config: createRaycastDifficultyDirectorConfig(this.currentLevel.director.config, this.difficultyId),
      spawnPoints: this.currentLevel.director.spawnPoints
    });
    this.enemies = cloneRaycastEnemies(this.currentLevel);
    const hudLayout = buildRaycastHudLayout(GAME_WIDTH, GAME_HEIGHT);
    const difficultyPreset = getRaycastDifficultyPreset(this.difficultyId);
    this.hudCss = getRaycastHudCss(this.getWorldSegment());
    const segment = this.getWorldSegment();
    const ionHudAccent =
      segment === 'world2' ? RAYCAST_PALETTE.riftIon : segment === 'world3' ? RAYCAST_PALETTE.amberWarn : RAYCAST_PALETTE.plasmaBright;

    const episodeState = getRaycastEpisodeState(this.currentLevel.id);
    const worldTwoIndex = RAYCAST_WORLD_TWO_CATALOG.findIndex((entry) => entry.id === this.currentLevel.id);
    const worldThreeIndex = RAYCAST_WORLD_THREE_CATALOG.findIndex((entry) => entry.id === this.currentLevel.id);
    const bannerPayload =
      worldThreeIndex >= 0
        ? buildRaycastEpisodeBanner({
            currentLevelNumber: episodeState.currentLevelNumber,
            totalLevels: episodeState.totalLevels,
            levelName: this.currentLevel.name,
            worldThreeSector: { index: worldThreeIndex + 1, total: RAYCAST_WORLD_THREE_CATALOG.length }
          })
        : worldTwoIndex >= 0
          ? buildRaycastEpisodeBanner({
              currentLevelNumber: episodeState.currentLevelNumber,
              totalLevels: episodeState.totalLevels,
              levelName: this.currentLevel.name,
              worldTwoSector: { index: worldTwoIndex + 1, total: RAYCAST_WORLD_TWO_CATALOG.length }
            })
          : buildRaycastEpisodeBanner({
              currentLevelNumber: episodeState.currentLevelNumber,
              totalLevels: episodeState.totalLevels,
              levelName: this.currentLevel.name
            });
    this.add
      .text(
        16,
        14,
        bannerPayload,
        {
          fontSize: '13px',
          fontStyle: '700',
          color: palette.background.panelText,
          backgroundColor: this.hudCss.hudPanel,
          padding: { x: 8, y: 5 }
        }
      )
      .setDepth(10);

    this.scoreHudText = this.add
      .text(16, 34, buildRaycastScoreHudLine(this.runScore, readRaycastHighScore()), {
        fontSize: '12px',
        fontStyle: '700',
        color: palette.accent.terminalText,
        backgroundColor: this.hudCss.hudPanel,
        padding: { x: 8, y: 4 }
      })
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
      .text(hudLayout.healthTextX, hudLayout.healthTextY, '', {
        fontSize: '14px',
        fontStyle: '700',
        color: this.hudCss.accentText,
        backgroundColor: this.hudCss.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setOrigin(1, 0)
      .setDepth(12);
    this.healthBarTrack = this.add
      .rectangle(
        hudLayout.healthBarX,
        hudLayout.healthBarY,
        hudLayout.healthBarWidth,
        hudLayout.healthBarTrackHeight,
        0x020408,
        0.9
      )
      .setOrigin(0, 0.5)
      .setDepth(12);
    this.healthBarFill = this.add
      .rectangle(
        hudLayout.healthBarX,
        hudLayout.healthBarY,
        hudLayout.healthBarWidth,
        hudLayout.healthBarFillHeight,
        ionHudAccent,
        1
      )
      .setOrigin(0, 0.5)
      .setDepth(13);

    this.weaponText = this.add
      .text(hudLayout.weaponTextX, hudLayout.weaponTextY, '', {
        fontSize: '13px',
        fontStyle: '700',
        color: palette.accent.warmText,
        backgroundColor: this.hudCss.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setOrigin(1, 0)
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
    this.bossNameText = this.add
      .text(GAME_WIDTH * 0.5, 44, '', {
        fontSize: '18px',
        fontStyle: '700',
        color: '#ffd07a',
        stroke: '#020408',
        strokeThickness: 5
      })
      .setOrigin(0.5, 0.5)
      .setDepth(16)
      .setVisible(false);
    this.bossPhaseText = this.add
      .text(GAME_WIDTH * 0.5, 66, '', {
        fontSize: '12px',
        fontStyle: '700',
        color: '#ffe7b8',
        stroke: '#020408',
        strokeThickness: 4
      })
      .setOrigin(0.5, 0.5)
      .setDepth(16)
      .setVisible(false);
    this.bossBarTrack = this.add
      .rectangle(GAME_WIDTH * 0.5, 86, 430, 16, 0x020408, 0.92)
      .setDepth(16)
      .setVisible(false);
    this.bossBarFill = this.add
      .rectangle(GAME_WIDTH * 0.5 - 215, 86, 430, 10, 0xb84fff, 1)
      .setOrigin(0, 0.5)
      .setDepth(17)
      .setVisible(false);

    this.objectiveText = this.add
      .text(16, GAME_HEIGHT - 108, '', {
        fontSize: '16px',
        fontStyle: '700',
        color: palette.accent.warmText,
        backgroundColor: this.hudCss.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setDepth(12);
    this.hintText = this.add
      .text(16, GAME_HEIGHT - 76, '', {
        fontSize: '13px',
        fontStyle: '700',
        color: this.hudCss.systemText,
        backgroundColor: '#020408cc',
        padding: { x: 8, y: 5 },
        wordWrap: { width: 380 }
      })
      .setDepth(12);
    this.instructionText = this.add
      .text(16, GAME_HEIGHT - 44, `${buildRaycastMinimapLegendLine()}  |  H/? HELP`, {
        fontSize: '11px',
        color: this.hudCss.debugText,
        backgroundColor: '#020408c8',
        padding: { x: 8, y: 5 }
      })
      .setAlpha(0.82)
      .setDepth(11);
    this.minimapFrame = this.add
      .rectangle(
        hudLayout.minimapFrameX,
        hudLayout.minimapFrameY,
        hudLayout.minimapFrameWidth,
        hudLayout.minimapFrameHeight,
        0x020408,
        0.76
      )
      .setStrokeStyle(2, ionHudAccent, 0.55)
      .setDepth(11);
    this.minimapTitleText = this.add
      .text(hudLayout.minimapTitleX, hudLayout.minimapTitleY, 'AUTOMAP M', {
        fontSize: '12px',
        fontStyle: '700',
        color: this.hudCss.accentText,
        backgroundColor: '#020408cc',
        padding: { x: 6, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.helpOverlayFrame = this.add
      .rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.53, 428, 250, 0x020408, 0.92)
      .setStrokeStyle(2, ionHudAccent, 0.6)
      .setDepth(24)
      .setVisible(false);
    this.helpOverlayTitleText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.34, 'RAYCAST QUICK HELP', {
        fontSize: '18px',
        fontStyle: '700',
        color: this.hudCss.accentText,
        backgroundColor: '#020408cc',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setVisible(false);
    this.helpOverlayText = this.add
      .text(
        GAME_WIDTH * 0.5,
        GAME_HEIGHT * 0.55,
        buildRaycastHelpOverlayText({
          difficultyLabel: difficultyPreset.label,
          difficultySummary: difficultyPreset.inGameSummary
        }),
        {
          fontSize: '14px',
          fontStyle: '700',
          color: '#f4f7d0',
          align: 'left',
          lineSpacing: 4,
          wordWrap: { width: 360 }
        }
      )
      .setOrigin(0.5)
      .setDepth(25)
      .setVisible(false);
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
    this.feedbackPulse = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_PALETTE.plasmaBright, 0);
    this.feedbackPulse.setDepth(11);
    this.corruptionVeil = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_ATMOSPHERE.corruptionTint, 0);
    this.corruptionVeil.setDepth(9);
    this.systemText = this.add
      .text(GAME_WIDTH * 0.5, 58, getRaycastIntroMessageForSegment(this.getWorldSegment()), {
        fontSize: '20px',
        fontStyle: '700',
        color: this.hudCss.systemText,
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
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.3, '', {
        fontSize: '28px',
        fontStyle: '700',
        color: this.hudCss.warningText,
        stroke: '#020408',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setVisible(false);
    this.finalSummaryText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, '', {
        fontSize: '13px',
        fontStyle: '700',
        color: this.hudCss.systemText,
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setVisible(false);
    this.finalHintText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.73, 'R RESTART LEVEL  |  ESC MENU', {
        fontSize: '12px',
        fontStyle: '700',
        color: this.hudCss.keyText,
        stroke: '#020408',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setVisible(false);

    this.pauseBackdrop = this.add
      .rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, 0x020408, 0.84)
      .setDepth(40)
      .setVisible(false);
    this.pauseTitleText = this.add
      .text(GAME_WIDTH * 0.5, 72, 'SYSTEM HALT', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: '700',
        color: this.hudCss.systemText,
        stroke: '#020408',
        strokeThickness: 6
      })
      .setOrigin(0.5, 0)
      .setDepth(41)
      .setVisible(false);
    this.pauseMenuBodyText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: '700',
        color: this.hudCss.keyText,
        align: 'center',
        lineSpacing: 10
      })
      .setOrigin(0.5, 0.5)
      .setDepth(41)
      .setVisible(false);

    this.debugText = this.add
      .text(16, GAME_HEIGHT - 38, '', {
        fontSize: '12px',
        color: this.hudCss.debugText,
        backgroundColor: this.hudCss.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setAlpha(0.68)
      .setVisible(false)
      .setDepth(10);

    this.sceneReady = true;
    this.cameras.main.fadeIn(380, 0, 0, 0);
    this.setCombatMessage(this.buildLevelStartObjectiveMessage(), 3600);
    this.registerInputListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSceneLifecycle, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupSceneLifecycle, this);
  }

  update(_time: number, delta: number): void {
    if (this.playerAlive && !this.levelComplete && !this.gamePaused) {
      this.controller.update(delta);
      this.updatePlayerMetrics(delta);
      this.updateLevelState();
      this.updateEnemies(delta);
      this.updateGameDirector();
      this.updateAtmospherePulse();
      this.applyPassiveHeal(delta);
    }
    const atmosphere = this.getAtmosphereOptions();
    this.raycastRenderer.render(this.player, GAME_WIDTH, GAME_HEIGHT, atmosphere);
    this.refreshBillboardCache();
    this.raycastRenderer.renderBillboards(this.player, this.cachedBillboards, GAME_WIDTH, GAME_HEIGHT);
    this.raycastRenderer.renderEnemies(this.player, this.enemies, GAME_WIDTH, GAME_HEIGHT, this.time.now, atmosphere);
    this.raycastRenderer.renderBoss(this.player, this.bossState, GAME_WIDTH, GAME_HEIGHT, this.time.now, atmosphere);
    this.raycastRenderer.renderEnemyProjectiles(this.player, this.enemyProjectiles, GAME_WIDTH, GAME_HEIGHT);
    this.raycastRenderer.renderWeaponOverlay(
      this.combat.getCurrentWeapon(),
      GAME_WIDTH,
      GAME_HEIGHT,
      this.getWeaponOverlayFlashAlpha()
    );
    this.corruptionVeil.setAlpha(atmosphere.corruptionAlpha);
    const objectiveState = this.getObjectiveState();
    const objective = buildRaycastCurrentObjective(objectiveState);
    const objectiveHud = formatRaycastObjectiveHudLabel(objective, this.currentLevel.hudObjectiveLabels);
    const hint = buildRaycastHintText(objectiveState);
    let statusLine = buildRaycastHudStatusLine(
      this.playerHealth,
      this.combat.getWeaponLabel(),
      getRaycastDifficultyPreset(this.difficultyId).shortLabel
    );
    if (this.passiveRegenHudActive) {
      statusLine += `  |  ${this.passiveRegenHudLabel ?? 'REGEN'}`;
    } else if (this.passiveRegenHudLabel) {
      statusLine += `  |  ${this.passiveRegenHudLabel}`;
    }
    this.healthText.setText(statusLine);
    this.weaponText.setText(
      buildRaycastHudProgressLine(
        this.getKeyCount(),
        this.currentLevel.keys.length,
        this.collectedSecrets.size,
        this.currentLevel.secrets.length,
        objective
      )
    );
    this.scoreHudText.setText(buildRaycastScoreHudLine(this.runScore, readRaycastHighScore()));
    this.objectiveText.setText(`OBJECTIVE // ${objectiveHud}`);
    this.hintText.setText(`HINT // ${hint}`);
    this.instructionText.setText(
      this.gamePaused
        ? 'HALT // UP/DOWN  SELECT  |  ENTER CONFIRM  |  ESC RESUME'
        : `${buildRaycastMinimapLegendLine()}  |  H/? HELP`
    );
    this.updateHealthHud();
    this.updateBossHud();
    this.updateFocusedEnemyHud();
    this.updatePriorityMessage(objective, hint, objectiveState.recentBlockedReason !== undefined && objectiveState.recentBlockedReason !== null);
    this.renderMinimapThrottled();
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
    this.collectedHealthPickups.clear();
    this.deferredPickupHints.clear();
    this.completedEncounterBeats.clear();
    this.enemiesKilled = 0;
    this.runPelletsFired = 0;
    this.runPelletsHitHostile = 0;
    this.runBossPelletsFired = 0;
    this.runBossPelletsHitHostile = 0;
    this.runBossDamageTaken = 0;
    this.runScore = this.carriedScoreFromEpisode;
    if (this.pendingWorldTwoBreachBonus) {
      this.runScore += RAYCAST_WORLD2_ENTRY_POINTS;
      this.pendingWorldTwoBreachBonus = false;
    }
    if (this.pendingWorldThreeBreachBonus) {
      this.runScore += RAYCAST_WORLD3_ENTRY_POINTS;
      this.pendingWorldThreeBreachBonus = false;
    }
    this.levelStartScore = this.runScore;
    this.levelStartCampaignMetrics = { ...this.campaignMetrics };
    this.carriedScoreFromEpisode = 0;
    this.playerStationaryMs = 0;
    this.lastPlayerDamageAt = this.time.now;
    this.lastPlayerPosition.x = this.currentLevel.playerStart.x;
    this.lastPlayerPosition.y = this.currentLevel.playerStart.y;
    this.activeZoneId = null;
    this.directorDebug = null;
    this.lastDirectorState = null;
    this.directorIntensity = 0;
    this.directorSpawnCounter = 0;
    this.encounterPatternCooldownUntil.clear();
    this.debugHudVisible = false;
    this.minimapVisible = true;
    this.helpOverlayVisible = false;
    this.enemyProjectiles = [];
    this.lastCombatMessage = getRaycastIntroMessageForSegment(this.getWorldSegment());
    this.combatMessageUntil = 0;
    this.blockedHintReason = null;
    this.blockedHintUntil = 0;
    this.lastLowHealthWarningAt = null;
    this.weaponOverlayFlashUntil = 0;
    this.nextAmbientCueAt = 0;
    this.sceneReady = false;
    this.gamePaused = false;
    this.pauseSelectionIndex = 0;
    this.passiveRegenHudActive = false;
    this.passiveRegenHudLabel = null;
    this.passiveHealFractionalCarry = 0;
    this.billboardSig = '';
    this.cachedBillboards = [];
    this.minimapFrameCounter = 0;
    this.mapLayoutRevision = 0;
    this.minimapStaticCellsCacheKey = '';
    this.minimapStaticCells = null;
    this.bossTelegraphActive = false;
    this.bossState = this.currentLevel.bossConfig
      ? createRaycastBossState(this.currentLevel.bossConfig, this.time.now)
      : null;
    this.lastBossPhase = this.bossState?.phase ?? null;
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-ESC', this.handleEscKey);
    keyboard?.on('keydown-R', this.handleRetry);
    keyboard?.on('keydown-N', this.handleAdvanceLevel);
    keyboard?.on('keydown-W', this.handleWorldTwoPlaceholder);
    keyboard?.on('keydown-F', this.handleFireInput);
    keyboard?.on('keydown-SPACE', this.handleFireInput);
    keyboard?.on('keydown-ONE', this.handleWeaponSlotOne);
    keyboard?.on('keydown-TWO', this.handleWeaponSlotTwo);
    keyboard?.on('keydown-THREE', this.handleWeaponSlotThree);
    keyboard?.on('keydown-M', this.handleToggleMinimap);
    keyboard?.on('keydown-H', this.handleToggleHelp);
    keyboard?.on('keydown-SLASH', this.handleHelpShortcut);
    if (DEV_SHORTCUT_ENABLED) {
      keyboard?.on('keydown-F9', this.handleDevJumpWorld3Final);
      keyboard?.on('keydown-THREE', this.handleDevShiftThree);
    }
    keyboard?.on('keydown-TAB', this.handleToggleDebug);
    keyboard?.on('keydown-BACKTICK', this.handleToggleDebug);
    keyboard?.on('keydown-UP', this.handlePauseMenuUp);
    keyboard?.on('keydown-DOWN', this.handlePauseMenuDown);
    keyboard?.on('keydown-ENTER', this.handlePauseMenuConfirm);
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
    keyboard?.off('keydown-ESC', this.handleEscKey);
    keyboard?.off('keydown-R', this.handleRetry);
    keyboard?.off('keydown-N', this.handleAdvanceLevel);
    keyboard?.off('keydown-W', this.handleWorldTwoPlaceholder);
    keyboard?.off('keydown-F', this.handleFireInput);
    keyboard?.off('keydown-SPACE', this.handleFireInput);
    keyboard?.off('keydown-ONE', this.handleWeaponSlotOne);
    keyboard?.off('keydown-TWO', this.handleWeaponSlotTwo);
    keyboard?.off('keydown-THREE', this.handleWeaponSlotThree);
    keyboard?.off('keydown-M', this.handleToggleMinimap);
    keyboard?.off('keydown-H', this.handleToggleHelp);
    keyboard?.off('keydown-SLASH', this.handleHelpShortcut);
    if (DEV_SHORTCUT_ENABLED) {
      keyboard?.off('keydown-F9', this.handleDevJumpWorld3Final);
      keyboard?.off('keydown-THREE', this.handleDevShiftThree);
    }
    keyboard?.off('keydown-TAB', this.handleToggleDebug);
    keyboard?.off('keydown-BACKTICK', this.handleToggleDebug);
    keyboard?.off('keydown-UP', this.handlePauseMenuUp);
    keyboard?.off('keydown-DOWN', this.handlePauseMenuDown);
    keyboard?.off('keydown-ENTER', this.handlePauseMenuConfirm);
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
    return (
      this.sceneReady &&
      !this.gamePaused &&
      this.isRaycastSceneActive() &&
      this.combat !== undefined &&
      this.audioFeedback !== undefined
    );
  }

  private isRaycastSceneActive(): boolean {
    return this.scene.isActive('RaycastScene');
  }

  private fireWeapon(): void {
    if (!this.canHandleRaycastInput()) return;
    if (!this.playerAlive || this.levelComplete) return;
    const result = this.combat.fire(this.player, this.enemies, this.map, this.time.now);
    if (!result.fired) return;

    this.runPelletsFired += result.pelletCount;
    if (this.bossState?.alive) {
      this.runBossPelletsFired += result.pelletCount;
    }

    this.flashMuzzle();
    const weaponAudio = getWeaponAudioPlan(result.weaponKind);
    this.audioFeedback.play(weaponAudio.cue, weaponAudio.intensity, this.time.now);

    if (this.bossState?.alive) {
      const bossHud = getRaycastBossHudLines(this.currentLevel.bossConfig?.displayName ?? 'Volt Archon');
      const bossDamage = computeRaycastBossWeaponDamage(this.bossState, this.player, this.map, result.weaponKind, 'raycast');
      if (bossDamage > 0) {
        const bossPellets = countRaycastBossConnectingPellets(
          this.bossState,
          this.player,
          this.map,
          result.weaponKind,
          'raycast'
        );
        this.runPelletsHitHostile += bossPellets;
        this.runBossPelletsHitHostile += bossPellets;
        const killed = damageRaycastBoss(this.bossState, bossDamage, this.time.now, {
          fromX: this.player.x,
          fromY: this.player.y,
          map: this.map
        });
        if (killed) {
          this.runScore = addRaycastBossClearScore(this.runScore);
          this.enemiesKilled += 1;
          this.audioFeedback.play('episodeComplete', 1, this.time.now);
          this.pulseFeedback(0xffc36b, 0.16, 260);
          this.cameras.main.flash(160, 255, 214, 120);
        }
        this.audioFeedback.play(killed ? 'kill' : 'hit', killed ? 1 : 0.9, this.time.now);
        this.pulseCrosshair(killed ? '#ff5b6f' : '#ffffff', killed ? 118 : 92);
        this.flashHitMarker(killed, false);
        this.cameras.main.shake(killed ? 96 : 54, killed ? 0.00225 : 0.00135);
        this.setCombatMessage(killed ? bossHud.coreShattered : bossHud.hullStressed);
        return;
      }
    }

    if (!result.hitEnemy) {
      this.flashWallImpact();
      this.pulseCrosshair(this.hudCss.accentText, 72);
      this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.06, 78);
      this.audioFeedback.play('wallImpact', 0.95, this.time.now);
      this.setCombatMessage('WALL IMPACT');
      return;
    }

    this.runPelletsHitHostile += result.hitCount + result.splashHitCount;
    this.enemiesKilled += result.killCount;
    if (result.killedEnemyKinds.length > 0) {
      this.runScore = addRaycastKillScore(this.runScore, result.killedEnemyKinds);
    }
    const splashImpact = result.weaponKind === 'LAUNCHER' && result.splashHitCount > 0;
    if (splashImpact) {
      this.audioFeedback.play('splash', 1, this.time.now);
      this.cameras.main.shake(102, 0.00285);
      this.pulseFeedback(0xff8a3d, 0.08, 110);
    }
    this.audioFeedback.play(result.killed ? 'kill' : 'hit', result.killed ? 1 : 0.9, this.time.now);
    if (result.killed) {
      this.cameras.main.flash(48, 255, 236, 210, false);
      this.pulseFeedback(0xffe2c4, 0.095, 150);
    }
    this.pulseCrosshair(result.killed ? '#ff5b6f' : '#ffffff', result.killed ? 148 : 92);
    this.flashHitMarker(result.killed, splashImpact);
    const weapon = result.weaponKind;
    const killShake = weapon === 'SHOTGUN' ? { d: 102, i: 0.00218 } : weapon === 'LAUNCHER' ? { d: 98, i: 0.00258 } : { d: 88, i: 0.00195 };
    const hitShake = weapon === 'SHOTGUN' ? { d: 52, i: 0.00128 } : weapon === 'LAUNCHER' ? { d: 48, i: 0.00138 } : { d: 46, i: 0.00118 };
    const s = result.killed ? killShake : hitShake;
    this.cameras.main.shake(s.d, s.i);
    this.setCombatMessage(
      result.killed
        ? getRaycastCombatMessageForSegment(this.getWorldSegment(), 'kill')
        : splashImpact
          ? `SPLASH HIT x${Math.max(1, result.splashHitCount)}`
        : result.hitCount > 1
          ? `HOSTILE PROCESS HIT x${result.hitCount}`
          : `HOSTILE PROCESS HIT -${result.totalDamage}`,
      result.killed ? 1720 : splashImpact ? 1320 : 1200
    );
  }

  private flashMuzzle(): void {
    const weapon = this.combat.getCurrentWeapon();
    const width = weapon === 'SHOTGUN' ? 182 : weapon === 'LAUNCHER' ? 148 : 94;
    const height = weapon === 'SHOTGUN' ? 58 : weapon === 'LAUNCHER' ? 54 : 30;
    const alpha = weapon === 'SHOTGUN' ? 1 : weapon === 'LAUNCHER' ? 0.96 : 0.9;
    const flashDuration = weapon === 'LAUNCHER' ? 226 : weapon === 'SHOTGUN' ? 136 : 70;
    this.muzzleFlash.setSize(width, height);
    this.muzzleFlash.setFillStyle(weapon === 'LAUNCHER' ? RAYCAST_PALETTE.plasmaBright : weapon === 'SHOTGUN' ? 0xff8a3d : RAYCAST_ATMOSPHERE.muzzleFlash);
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
    this.hitMarker.setText(killed ? '*' : splash ? 'xx' : 'x');
    this.hitMarker.setColor(killed ? '#ff3358' : splash ? '#ffb36b' : '#ffffff');
    this.hitMarker.setScale(killed ? 1.58 : 1.08);
    this.hitMarker.setAlpha(0.97);
    this.tweens.killTweensOf(this.hitMarker);
    this.tweens.add({
      targets: this.hitMarker,
      alpha: 0,
      scale: killed ? 2.05 : 1.5,
      duration: killed ? 178 : 96,
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
    const decayWindow = weapon === 'LAUNCHER' ? 226 : weapon === 'SHOTGUN' ? 136 : 70;
    return Phaser.Math.Clamp((this.weaponOverlayFlashUntil - this.time.now) / decayWindow, 0, 1);
  }

  private setCombatMessage(message: string, holdMs = 1100): void {
    this.lastCombatMessage = message.toUpperCase();
    this.combatMessageUntil = this.time.now + holdMs;
    this.tweens.killTweensOf(this.systemText);
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

  private countReachableLivingEnemies(): number {
    return this.enemies.filter((enemy) => enemy.alive && isRaycastMapPointReachable(this.map, this.player, enemy)).length;
  }

  private countLivingEnemyKinds(): Partial<Record<EnemyKind, number>> {
    const tally: Partial<Record<EnemyKind, number>> = {};
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      tally[enemy.kind] = (tally[enemy.kind] ?? 0) + 1;
    }
    return tally;
  }

  private applyMinimapToggle(): void {
    this.minimapVisible = !this.minimapVisible;
    this.minimapFrame?.setVisible(this.minimapVisible);
    this.minimapTitleText?.setVisible(this.minimapVisible);
    this.minimapGraphics?.setVisible(this.minimapVisible);
    this.minimapMarkerLabels.forEach((label) => label.setVisible(false));
  }

  private applyDebugHudToggle(): void {
    this.debugHudVisible = !this.debugHudVisible;
    this.debugText?.setVisible(this.debugHudVisible);
  }

  private openPauseMenu(): void {
    this.gamePaused = true;
    this.pauseSelectionIndex = 0;
    this.pauseBackdrop.setVisible(true);
    this.pauseTitleText.setVisible(true);
    this.pauseMenuBodyText.setVisible(true);
    this.refreshPauseMenuBody();
    this.audioFeedback.play('uiSoftDeny', 0.62, this.time.now);
  }

  private closePauseMenu(): void {
    this.gamePaused = false;
    this.pauseBackdrop.setVisible(false);
    this.pauseTitleText.setVisible(false);
    this.pauseMenuBodyText.setVisible(false);
    this.audioFeedback.play('uiConfirm', 0.72, this.time.now);
  }

  private refreshPauseMenuBody(): void {
    const volPct = Math.round(this.audioMasterVolume * 100);
    this.pauseMenuBodyText.setText(formatRaycastPauseMenuBody(volPct, this.pauseSelectionIndex));
  }

  private adjustAudioMasterVolume(delta: number): void {
    this.audioMasterVolume = Math.max(0, Math.min(1, this.audioMasterVolume + delta));
    this.audioFeedback.setMasterVolume(this.audioMasterVolume);
  }

  private applyPassiveHeal(delta: number): void {
    if (!this.playerAlive || this.levelComplete) return;
    const directorScale = computePassiveHealCombatScale(this.lastDirectorState, this.directorIntensity);
    const swarm = computeEnemySwarmHealScale(this.countLivingEnemies());
    const bossScale = this.bossState?.alive ? 0.45 : 1;
    const combatScale = directorScale * swarm * bossScale;
    const config = getRaycastDifficultyPassiveHealConfig(this.difficultyId);
    const result = tickRaycastPassiveHeal({
      health: this.playerHealth,
      nowMs: this.time.now,
      lastDamageAtMs: this.lastPlayerDamageAt,
      deltaMs: delta,
      config,
      combatScale,
      fractionalCarry: this.passiveHealFractionalCarry
    });
    this.playerHealth = result.nextHealth;
    this.passiveRegenHudActive = result.isRegenerating;
    this.passiveRegenHudLabel = formatRaycastPassiveRegenHudLabel(
      getRaycastPassiveRegenHudState({
        health: this.playerHealth,
        nowMs: this.time.now,
        lastDamageAtMs: this.lastPlayerDamageAt,
        config,
        combatScale,
        isRegenerating: result.isRegenerating
      })
    );
    this.passiveHealFractionalCarry = result.nextFractionalCarry;
  }

  private updateEnemies(delta: number): void {
    if (this.bossState?.alive) {
      tickRaycastBossMovement(
        this.bossState,
        this.map,
        { x: this.player.x, y: this.player.y, alive: this.playerAlive },
        delta,
        this.time.now
      );
      const bossHud = getRaycastBossHudLines(this.currentLevel.bossConfig?.displayName ?? 'Volt Archon');
      if (this.lastBossPhase !== this.bossState.phase) {
        if (this.bossState.phase >= 2) {
          this.audioFeedback.play('bossPhaseShift', 1, this.time.now);
          this.pulseFeedback(this.bossState.phase === 3 ? 0xff2f41 : 0xff5b6f, this.bossState.phase === 3 ? 0.13 : 0.11, 220);
          this.cameras.main.shake(this.bossState.phase === 3 ? 160 : 132, this.bossState.phase === 3 ? 0.0022 : 0.00195);
          this.setCombatMessage(this.bossState.phase === 3 ? `${bossHud.phase3Overdrive} // FINAL` : bossHud.phase2Overdrive);
        }
        this.lastBossPhase = this.bossState.phase;
      }
      const telegraphActive = this.time.now < this.bossState.telegraphUntil;
      if (telegraphActive && !this.bossTelegraphActive) {
        this.audioFeedback.play('directorWarning', 0.95, this.time.now);
        this.audioFeedback.play('stingerDread', 0.44, this.time.now + 42);
        this.pulseFeedback(0xffb347, 0.08, 170);
        this.setCombatMessage(bossHud.telegraphLocked);
        if (
          this.bossState.arenaTwist === 'retreat_cut' &&
          this.time.now < this.bossState.arenaTwistUntil
        ) {
          this.cameras.main.shake(82, 0.00152);
        }
      }
      this.bossTelegraphActive = telegraphActive;
      const bossShots = tickRaycastBossVolleys(
        this.bossState,
        { x: this.player.x, y: this.player.y, alive: this.playerAlive, stationaryMs: this.playerStationaryMs },
        this.time.now
      );
      if (bossShots.length > 0) {
        this.enemyProjectiles.push(...bossShots);
        this.setCombatMessage(bossHud.volleyInbound);
        this.audioFeedback.play('spawn', 0.9, this.time.now);
        this.pulseFeedback(0xff8833, 0.065, 150);
      }
    } else {
      this.bossTelegraphActive = false;
    }
    if (this.bossState) tickRaycastBossArenaTwist(this.bossState, this.time.now);

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
    const previousHealth = this.playerHealth;
    const appliedDamage = scaleRaycastIncomingDamage(amount, this.difficultyId);
    this.playerHealth = Math.max(0, this.playerHealth - appliedDamage);
    this.damageTaken += appliedDamage;
    if (this.bossState?.alive) {
      this.runBossDamageTaken += appliedDamage;
    }
    this.lastPlayerDamageAt = this.time.now;
    this.passiveHealFractionalCarry = 0;
    const shakeDur = Phaser.Math.Clamp(88 + appliedDamage * 2.4, 96, 168);
    const shakeMag = Phaser.Math.Clamp(0.00275 + appliedDamage * 0.000065, 0.00275, 0.0045);
    this.cameras.main.shake(shakeDur, shakeMag);
    this.flashDamage(appliedDamage);
    let damageIntensity = Phaser.Math.Clamp(0.58 + appliedDamage * 0.019, 0.58, 1.05);
    if (this.bossState?.alive) damageIntensity = Math.min(1.08, damageIntensity + 0.065);
    if (this.playerHealth > 0) {
      if (this.playerHealth <= 18) damageIntensity = Math.min(1.16, damageIntensity + 0.12);
      else if (this.playerHealth <= 35) damageIntensity = Math.min(1.1, damageIntensity + 0.06);
    }
    this.audioFeedback.play('damage', damageIntensity, this.time.now);
    this.setCombatMessage(`${getRaycastCombatMessageForSegment(this.getWorldSegment(), 'damage')} -${appliedDamage}`);
    if (this.playerHealth === 0) {
      this.playerAlive = false;
      this.setCombatMessage('SIGNAL TERMINATED');
      this.cameras.main.shake(200, 0.0042);
      this.pulseFeedback(0xff1a3a, 0.14, 400);
      this.audioFeedback.play('death', 1, this.time.now);
      this.audioFeedback.play('uiDeny', 0.7, this.time.now + 85);
      this.showRunCompleteOverlay('SIGNAL TERMINATED', this.hudCss.warningText, false, true);
      return;
    }
    if (
      shouldPlayRaycastLowHealthWarning({
        previousHealth,
        nextHealth: this.playerHealth,
        nowMs: this.time.now,
        lastWarningAtMs: this.lastLowHealthWarningAt,
        playerAlive: this.playerAlive,
        levelComplete: this.levelComplete
      })
    ) {
      this.lastLowHealthWarningAt = this.time.now;
      this.playFeedbackEvent('lowHealthWarning');
      this.pulseFeedback(this.playerHealth <= 25 ? 0xff5b6f : 0xffb347, 0.04, 120);
      this.setCombatMessage(buildRaycastLowHealthWarningMessage(this.playerHealth));
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
        this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.09, 140);
        this.cameras.main.shake(55, 0.0014);
        this.setCombatMessage(`${getRaycastCombatMessageForSegment(this.getWorldSegment(), 'key')}: ${key.pickupObjectiveText}`);
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
      this.stageSetpieceCue(trigger.setpieceCue);
      this.audioFeedback.play('directorAmbush', 1, this.time.now);
      this.pulseCorruption();
      this.pulseFeedback(0xff5b6f, 0.06, 170);
      this.setCombatMessage(`CORRUPTION BREACH: ${trigger.activationText}`);
      const spawned: RaycastEnemy[] = [];
      for (let index = 0; index < trigger.spawns.length; index += 1) {
        const spawn = trigger.spawns[index];
        const enemy = this.createTelegraphedSpawnEnemy(
          { id: `${trigger.id}-${index}`, kind: spawn.kind, x: spawn.x, y: spawn.y },
          'encounter'
        );
        if (enemy) spawned.push(enemy);
      }
      this.enemies.push(...spawned);
    });

    this.currentLevel.secrets.forEach((secret) => {
      if (this.collectedSecrets.has(secret.id)) return;
      if (!isNearPoint(this.player.x, this.player.y, secret)) return;
      registerRaycastSecret(this.collectedSecrets, secret);
      this.runScore = addRaycastSecretScore(this.runScore);
      this.audioFeedback.play('secret', 1, this.time.now);
      this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.11, 180);
      this.setCombatMessage(`${getRaycastCombatMessageForSegment(this.getWorldSegment(), 'secret')}: ${secret.objectiveText}`);
    });

    this.currentLevel.healthPickups.forEach((pickup) => {
      if (this.collectedHealthPickups.has(pickup.id)) return;
      if (!isNearPoint(this.player.x, this.player.y, pickup)) return;

      const result = applyRaycastHealthPickup(
        this.playerHealth,
        getRaycastDifficultyHealthPickup(pickup, this.difficultyId),
        RAYCAST_PLAYER_MAX_HEALTH
      );
      if (!result.consumed) {
        const lastHintAt = this.deferredPickupHints.get(pickup.id) ?? Number.NEGATIVE_INFINITY;
        if (this.time.now - lastHintAt < 1800) return;
        this.deferredPickupHints.set(pickup.id, this.time.now);
        this.playFeedbackEvent('healthPickupDenied');
        this.pulseFeedback(0xffb347, 0.035, 90);
        this.setCombatMessage(pickup.fullHealthMessage);
        return;
      }

      this.playerHealth = result.nextHealth;
      registerRaycastPickup(this.collectedHealthPickups, pickup);
      this.deferredPickupHints.delete(pickup.id);
      this.playFeedbackEvent('healthPickup');
      this.pulseFeedback(0xff8fb0, 0.08, 150);
      this.cameras.main.shake(45, 0.001);
      this.setCombatMessage(`${pickup.pickupMessage} +${result.restored} HP`);
    });

    this.currentLevel.exits.forEach((exit) => {
      if (this.levelComplete) return;
      if (!isNearPoint(this.player.x, this.player.y, exit)) return;
      const exitAccess = getRaycastExitAccess(this.currentLevel, {
        collectedKeyIds: this.currentLevel.keys.filter((key) => this.keySystem.hasKey(key.id)).map((key) => key.id),
        openDoorIds: this.currentLevel.doors.filter((door) => this.doorSystem.isOpen(door.id)).map((door) => door.id),
        activatedTriggerIds: this.currentLevel.triggers.filter((trigger) => this.triggerSystem.hasActivated(trigger.id)).map((trigger) => trigger.id),
        livingEnemyCount: this.countReachableLivingEnemies(),
        bossDefeated: this.bossState ? !this.bossState.alive : true
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
        this.setCombatMessage(exitAccess.message ?? getRaycastCombatMessageForSegment(this.getWorldSegment(), 'locked'));
        return;
      }
      const sectorMetrics = this.collectSectorMetricsSnapshot();
      this.campaignMetrics = mergeCampaignMetrics(this.campaignMetrics, sectorMetrics);
      this.runScore = addRaycastSectorPerformanceBonus(this.runScore, sectorMetrics);
      if (this.isTerminalArcSector()) {
        this.runScore += RAYCAST_FULL_ARC_CLEAR_BONUS;
      }
      this.levelComplete = true;
      this.episodeComplete = this.nextLevelId === null;
      if (this.episodeComplete) {
        this.runScore = addRaycastCampaignCompletionBonus(this.runScore, this.campaignMetrics);
      }
      const bossContinueWorldTwo =
        Boolean(this.currentLevel.bossConfig) && !this.episodeComplete && this.nextLevelId !== null;

      let overlayTitle = 'LEVEL CLEAR';
      if (bossContinueWorldTwo) {
        overlayTitle = 'BOSS DEFEATED';
      } else if (this.episodeComplete && this.isTerminalArcSector()) {
        overlayTitle = 'FULL ARC CLEAR';
      } else if (this.episodeComplete && this.currentLevel.bossConfig) {
        overlayTitle = 'BOSS DEFEATED';
      } else if (this.episodeComplete) {
        overlayTitle = 'EPISODE CLEAR';
      }

      this.playFeedbackEvent(this.episodeComplete ? 'episodeComplete' : 'levelComplete');
      this.pulseFeedback(this.episodeComplete ? 0xffc36b : RAYCAST_PALETTE.plasmaBright, this.episodeComplete ? 0.12 : 0.09, 260);
      this.cameras.main.shake(this.episodeComplete ? 180 : 120, this.episodeComplete ? 0.0022 : 0.0017);
      this.setCombatMessage(`${getRaycastExitMessageForSegment(this.getWorldSegment())}: ${exit.objectiveText}`);
      this.showRunCompleteOverlay(overlayTitle, this.hudCss.systemText, this.episodeComplete);
    });
  }

  private collectSectorMetricsSnapshot(): RaycastSectorMetrics {
    return {
      pelletsFired: this.runPelletsFired,
      pelletsHitHostile: this.runPelletsHitHostile,
      damageTaken: this.damageTaken,
      secretsFound: this.collectedSecrets.size,
      secretTotal: this.currentLevel.secrets.length,
      elapsedMs: this.time.now - this.runStartedAt,
      enemiesKilled: this.enemiesKilled,
      bossPelletsFired: this.runBossPelletsFired,
      bossPelletsHitHostile: this.runBossPelletsHitHostile,
      bossDamageTaken: this.runBossDamageTaken,
      hadBoss: Boolean(this.currentLevel.bossConfig)
    };
  }

  private static dedupeMedalList(ids: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  private showRunCompleteOverlay(
    title: string,
    titleColor: string,
    episodeComplete = false,
    isDeath = false
  ): void {
    appendRaycastPlaytestTelemetry({
      timestampIso: new Date().toISOString(),
      levelId: this.currentLevel.id,
      levelName: this.currentLevel.name,
      worldSegment: this.getWorldSegment(),
      difficulty: getRaycastDifficultyPreset(this.difficultyId).label,
      outcome: isDeath ? 'death' : 'clear',
      elapsedMs: this.time.now - this.runStartedAt,
      score: this.runScore,
      enemiesKilled: this.enemiesKilled,
      damageTaken: this.damageTaken,
      secretsFound: this.collectedSecrets.size,
      secretTotal: this.currentLevel.secrets.length,
      tokensFound: this.getKeyCount(),
      tokenTotal: this.currentLevel.keys.length,
      pelletsFired: this.runPelletsFired,
      pelletsHitHostile: this.runPelletsHitHostile,
      bossPelletsFired: this.runBossPelletsFired,
      bossPelletsHitHostile: this.runBossPelletsHitHostile,
      bossDamageTaken: this.runBossDamageTaken,
      campaign: episodeComplete ? this.campaignMetrics : undefined
    });
    writeRaycastHighScoreIfBetter(this.runScore);
    const highScore = readRaycastHighScore();
    const episodeState = getRaycastEpisodeState(this.currentLevel.id);
    const worldTwoIndex = RAYCAST_WORLD_TWO_CATALOG.findIndex((entry) => entry.id === this.currentLevel.id);
    const worldThreeIndex = RAYCAST_WORLD_THREE_CATALOG.findIndex((entry) => entry.id === this.currentLevel.id);
    const fullArcClear = episodeComplete && this.isTerminalArcSector();
    const sectorMetrics = this.collectSectorMetricsSnapshot();
    const medals = !isDeath
      ? RaycastScene.dedupeMedalList([
          ...(episodeComplete ? computeRaycastCampaignMedals(this.campaignMetrics) : []),
          ...computeRaycastSectorMedals(sectorMetrics)
        ])
      : [];

    const summary = buildRaycastRunSummary({
      difficultyLabel: getRaycastDifficultyPreset(this.difficultyId).label,
      elapsedMs: this.time.now - this.runStartedAt,
      enemiesKilled: this.enemiesKilled,
      score: this.runScore,
      highScore,
      secretsFound: this.collectedSecrets.size,
      secretTotal: this.currentLevel.secrets.length,
      tokensFound: this.getKeyCount(),
      tokenTotal: this.currentLevel.keys.length,
      damageTaken: this.damageTaken,
      bossArenaDamageTaken: this.currentLevel.bossConfig ? this.runBossDamageTaken : undefined,
      fullArcClear: !isDeath && fullArcClear,
      pelletsFired: this.runPelletsFired,
      pelletsHitHostile: this.runPelletsHitHostile,
      bossPelletsFired: this.runBossPelletsFired,
      bossPelletsHitHostile: this.runBossPelletsHitHostile,
      hadBoss: Boolean(this.currentLevel.bossConfig),
      medals: medals.length > 0 ? medals : undefined,
      campaign: episodeComplete ? this.campaignMetrics : undefined,
      episodeComplete: !isDeath && episodeComplete
    });
    const levelLine =
      worldThreeIndex >= 0
        ? `WORLD 3 SECTOR ${worldThreeIndex + 1}/${RAYCAST_WORLD_THREE_CATALOG.length} ${this.currentLevel.name.toUpperCase()}`
        : worldTwoIndex >= 0
          ? `WORLD 2 SECTOR ${worldTwoIndex + 1}/${RAYCAST_WORLD_TWO_CATALOG.length} ${this.currentLevel.name.toUpperCase()}`
          : `SECTOR ${episodeState.currentLevelNumber}/${episodeState.totalLevels} ${this.currentLevel.name.toUpperCase()}`;

    if (isDeath) {
      const overlaySummary = [...buildRaycastDeathOverlaySummary(levelLine), ...summary];
      this.finalTitleText.setText(title).setColor(titleColor);
      this.finalSummaryText.setText(overlaySummary.join('\n'));
      this.finalHintText.setText(buildRaycastDeathOverlayHint());
      this.finalOverlay.setVisible(true).setAlpha(0.9);
      this.finalTitleText.setVisible(true);
      this.finalSummaryText.setVisible(true);
      this.finalHintText.setVisible(true);
      return;
    }

    const finaleBossEpisodeComplete = Boolean(episodeComplete && this.currentLevel.bossConfig);
    const bossContinueWorldThree =
      !episodeComplete &&
      this.nextLevelId === RAYCAST_WORLD_THREE_CATALOG[0]?.id &&
      this.currentLevel.id === RAYCAST_WORLD_TWO_CATALOG[RAYCAST_WORLD_TWO_CATALOG.length - 1]?.id;
    const bossContinueWorldTwo =
      Boolean(this.currentLevel.bossConfig) &&
      !episodeComplete &&
      this.nextLevelId !== null &&
      !bossContinueWorldThree;

    const overlaySummary = [levelLine, ...summary];
    const hint = buildRaycastOverlayHint({
      currentLevelNumber: episodeState.currentLevelNumber,
      canAdvance: !episodeComplete && this.nextLevelId !== null,
      episodeComplete,
      finaleBossCleared: finaleBossEpisodeComplete || bossContinueWorldTwo || bossContinueWorldThree,
      worldTwoLocked: RAYCAST_WORLD_TWO_CATALOG.length === 0,
      continueToWorldTwo: bossContinueWorldTwo,
      continueToWorldThree: bossContinueWorldThree
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
      this.playFeedbackEvent('doorDenied');
      this.pulseFeedback(0xff5b6f, 0.05, 100);
      this.blockedHintReason = 'door-key';
      this.blockedHintUntil = this.time.now + 2600;
      this.setCombatMessage(`TOKEN REQUIRED: ${door.lockedObjectiveText.toUpperCase()}`);
      return;
    }
    if (!result.opened) return;

    openRaycastDoor(this.map, door);
    this.mapLayoutRevision += 1;
    this.minimapStaticCellsCacheKey = '';
    this.minimapStaticCells = null;
    this.blockedHintReason = null;
    this.tryTriggerEncounterBeat((beat) => beat.doorId === door.id);
    this.playFeedbackEvent('doorOpened');
    this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.06, 140);
    this.cameras.main.shake(70, 0.0014);
    this.setCombatMessage(`${getRaycastCombatMessageForSegment(this.getWorldSegment(), 'doorOpen')}: ${door.openObjectiveText}`);
  }

  private playFeedbackEvent(event: RaycastFeedbackEvent): void {
    getRaycastFeedbackActions(event).forEach((action) => {
      this.audioFeedback.play(action.cue, action.intensity, this.time.now + (action.delayMs ?? 0));
    });
  }

  private computeBillboardSignature(): string {
    /** Level key/door order is stable — no sort (saves work on every frame before cache hit). */
    const keysHeld = this.currentLevel.keys
      .filter((key) => this.keySystem.hasKey(key.id))
      .map((key) => key.id)
      .join(',');
    const doorsOpen = this.currentLevel.doors
      .filter((door) => this.doorSystem.isOpen(door.id))
      .map((door) => door.id)
      .join(',');
    const secrets = [...this.collectedSecrets].sort().join(',');
    const pickups = [...this.collectedHealthPickups].sort().join(',');
    return `${keysHeld}|${doorsOpen}|${secrets}|${pickups}|${this.levelComplete ? 1 : 0}|${this.getObjectiveHint()}`;
  }

  private refreshBillboardCache(): void {
    const next = this.computeBillboardSignature();
    if (next === this.billboardSig && this.cachedBillboards.length > 0) return;
    this.billboardSig = next;
    this.cachedBillboards = this.buildBillboardsFromState();
  }

  private buildBillboardsFromState(): RaycastBillboard[] {
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
    const healthBillboards = this.currentLevel.healthPickups
      .filter((pickup) => !this.collectedHealthPickups.has(pickup.id))
      .map((pickup) => ({
        x: pickup.x,
        y: pickup.y,
        color: getBillboardColor('health'),
        radius: pickup.radius,
        label: pickup.billboardLabel,
        style: 'health' as const
      }));
    const exitBillboards = this.currentLevel.exits.map((exit) => ({
      x: exit.x,
      y: exit.y,
      color: getBillboardColor('exit', this.levelComplete),
      radius: exit.radius,
      label: this.getObjectiveHint() === 'REACH EXIT' || this.levelComplete ? 'PORTAL' : exit.billboardLabel,
      style: 'exit' as const
    }));

    return [...keyBillboards, ...doorBillboards, ...secretBillboards, ...healthBillboards, ...exitBillboards];
  }

  private renderMinimapThrottled(): void {
    if (!this.minimapVisible) {
      return;
    }
    if (!this.gamePaused) {
      this.minimapFrameCounter += 1;
      if (this.minimapFrameCounter % 2 !== 0) {
        return;
      }
    }
    this.renderMinimap();
  }

  private updatePlayerMetrics(delta: number): void {
    const movement = Math.hypot(this.player.x - this.lastPlayerPosition.x, this.player.y - this.lastPlayerPosition.y);
    this.playerStationaryMs = movement < 0.01 ? this.playerStationaryMs + delta : 0;
    this.lastPlayerPosition.x = this.player.x;
    this.lastPlayerPosition.y = this.player.y;
  }

  private updateGameDirector(): void {
    if (!this.currentLevel.director.enabled) return;

    const safePoints = getSafeDirectorSpawnPoints(this.currentLevel, this.player, this.activeZoneId, {
      map: this.map,
      enemies: this.enemies,
      allowVisibleFrontSpawns: false
    });

    const zoneRule = selectRaycastEncounterPatternBinding(
      this.currentLevel,
      this.activeZoneId,
      this.lastDirectorState ?? 'CALM',
      this.time.now,
      this.playerHealth,
      this.encounterPatternCooldownUntil
    );
    const patternRule = this.pickBossEncounterPatternRule() ?? zoneRule;

    let encounterPattern: {
      patternId: EncounterPatternId;
      bindingId?: string;
      cooldownMs?: number;
      spawns: SpawnRequest[];
    } | null = null;
    if (patternRule && safePoints.length >= 1) {
      const kinds = getEncounterPatternKinds(patternRule.patternId);
      const spawns = buildEncounterPatternSpawns(patternRule.patternId, kinds, safePoints, this.player);
      if (spawns.length >= 1) {
        encounterPattern = {
          patternId: patternRule.patternId,
          bindingId: patternRule.id,
          cooldownMs: patternRule.cooldownMs,
          spawns
        };
      }
    }

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
      spawnPoints: safePoints,
      aliveEnemyKindCounts: this.countLivingEnemyKinds(),
      encounterPattern
    });

    const previousState = this.lastDirectorState;
    this.directorIntensity = decision.intensity;
    this.directorDebug = decision.debug;
    this.lastDirectorState = decision.state;
    this.announceDirectorStateChange(previousState, decision.state);
    this.handleDirectorEvents(decision.events, decision.spawn, decision.extraSpawns);
  }

  private pickBossEncounterPatternRule(): RaycastEncounterPatternBinding | null {
    if (!this.bossState?.alive) return null;
    if (this.bossState.arenaTwist !== 'lateral_lane') return null;
    if (this.time.now >= this.bossState.arenaTwistUntil) return null;
    if (this.playerHealth <= 28) return null;
    if (this.lastDirectorState !== 'PRESSURE' && this.lastDirectorState !== 'AMBUSH') return null;
    const id = 'boss-lateral-lane';
    if (this.time.now < (this.encounterPatternCooldownUntil.get(id) ?? 0)) return null;
    return buildSyntheticBossLateralBinding(11_000);
  }

  private handleDirectorEvents(events: DirectorEvent[], spawn: SpawnRequest | null, extraSpawns: SpawnRequest[]): void {
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
        this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.05, 150);
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

      if (event.type === 'ENCOUNTER_PATTERN') {
        this.audioFeedback.play(audioPlan.cue, audioPlan.intensity, this.time.now);
        this.pulseFeedback(0xff3358, 0.06, 155);
        if (event.bindingId !== undefined && event.patternCooldownMs !== undefined) {
          this.encounterPatternCooldownUntil.set(event.bindingId, this.time.now + event.patternCooldownMs);
        }
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'SPAWN_PRESSURE' && spawn) {
        spawnedFromEvent = true;
        this.spawnDirectorEnemy(spawn);
      }
    });

    if (spawn && !spawnedFromEvent) this.spawnDirectorEnemy(spawn);
    extraSpawns.forEach((req) => this.spawnDirectorEnemy(req));
  }

  private announceDirectorStateChange(previousState: DirectorState | null, nextState: DirectorState): void {
    if (previousState === null || previousState === nextState) return;
    if (nextState === 'WARNING') this.setCombatMessage(getRaycastCombatMessageForSegment(this.getWorldSegment(), 'pressure'));
    if (nextState === 'PRESSURE' || nextState === 'AMBUSH')
      this.setCombatMessage(getRaycastCombatMessageForSegment(this.getWorldSegment(), 'surge'));
    if (nextState === 'RECOVERY') {
      const triggered = this.tryTriggerEncounterBeat((beat) => beat.directorState === 'RECOVERY');
      if (!triggered) this.setCombatMessage(getRaycastCombatMessageForSegment(this.getWorldSegment(), 'recovery'));
    }
  }

  private spawnDirectorEnemy(spawn: SpawnRequest): void {
    const enemy = this.createTelegraphedSpawnEnemy(
      {
        id: `director-${this.directorSpawnCounter}`,
        kind: spawn.kind,
        x: spawn.x,
        y: spawn.y
      },
      'director'
    );
    if (!enemy) return;
    this.enemies.push(enemy);
    this.directorSpawnCounter += 1;
    this.audioFeedback.play('directorAmbush', 1, this.time.now);
    this.pulseCorruption();
    this.pulseFeedback(0xff5b6f, 0.06, 160);
    const roleTag = getRaycastEnemyRoleAbbrev(spawn.kind);
    this.setCombatMessage(
      this.getWorldSegment() === 'world2'
        ? `STRATUM SIGNATURE: ${spawn.kind} (${roleTag})`
        : `HOSTILE SIGNAL DETECTED: ${spawn.kind} (${roleTag})`
    );
  }

  private createTelegraphedSpawnEnemy(
    spawn: { id: string; kind: SpawnRequest['kind']; x: number; y: number },
    source: 'director' | 'encounter'
  ): RaycastEnemy | null {
    const safe = this.resolveSafeSpawnPoint(spawn);
    if (!safe) return null;
    const visibleToPlayer = this.hasLineOfSightToPoint(safe.x, safe.y);
    const distanceToPlayer = Math.hypot(safe.x - this.player.x, safe.y - this.player.y);
    const baseDuration = source === 'director' ? DIRECTOR_SPAWN_TELEGRAPH_MS : ENCOUNTER_SPAWN_TELEGRAPH_MS;
    const telegraphDurationMs =
      baseDuration +
      (visibleToPlayer ? VISIBLE_SPAWN_TELEGRAPH_BONUS_MS : 0) +
      (distanceToPlayer <= 5.5 ? CLOSE_SPAWN_TELEGRAPH_BONUS_MS : 0);

    return createTelegraphedRaycastEnemy({ ...spawn, x: safe.x, y: safe.y }, {
      telegraphStartedAt: this.time.now,
      telegraphDurationMs
    });
  }

  private resolveSafeSpawnPoint(spawn: { x: number; y: number; kind: EnemyKind }): { x: number; y: number } | null {
    const radius = Math.max(0.2, getEnemyConfig(spawn.kind, 'raycast').size / 100);
    const isClear = (x: number, y: number): boolean => {
      if (!isRaycastMapPointReachable(this.map, this.player, { x, y })) return false;
      if (!isRaycastSpawnPlacementValid(this.map, { x, y }, radius)) return false;
      if (Math.hypot(x - this.player.x, y - this.player.y) < 0.72) return false;
      for (let i = 0; i < this.enemies.length; i += 1) {
        const enemy = this.enemies[i];
        if (!enemy.alive) continue;
        if (Math.hypot(x - enemy.x, y - enemy.y) < radius + enemy.radius + 0.16) return false;
      }
      return true;
    };
    if (isClear(spawn.x, spawn.y)) return { x: spawn.x, y: spawn.y };

    const probeStep = 0.45;
    for (let ring = 1; ring <= 3; ring += 1) {
      const r = ring * probeStep;
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        const nx = spawn.x + Math.cos(a) * r;
        const ny = spawn.y + Math.sin(a) * r;
        if (isClear(nx, ny)) return { x: nx, y: ny };
      }
    }
    return null;
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
    const healthPickupDistances =
      this.playerHealth <= RAYCAST_LOW_HEALTH_HINT_THRESHOLD
        ? this.currentLevel.healthPickups
            .filter((pickup) => !this.collectedHealthPickups.has(pickup.id))
            .filter((pickup) => {
              const requiredDoors = pickup.requiredOpenDoorIds ?? [];
              return requiredDoors.every((doorId) => this.doorSystem.isOpen(doorId));
            })
            .map((pickup) => Math.hypot(pickup.x - this.player.x, pickup.y - this.player.y))
        : [];
    const allDistances = [...uncollectedKeyDistances, ...healthPickupDistances];
    return allDistances.length > 0 ? Math.min(...allDistances) : null;
  }

  private isWorldTwoBreachFromBossClear(): boolean {
    return (
      this.levelComplete &&
      Boolean(this.currentLevel.bossConfig) &&
      this.nextLevelId === RAYCAST_WORLD_TWO_CATALOG[0]?.id
    );
  }

  private getCurrentStatusMessage(): string {
    if (this.time.now < this.combatMessageUntil) return this.lastCombatMessage;
    return buildRaycastStatusMessage(
      this.levelComplete,
      this.episodeComplete,
      this.playerAlive,
      Boolean(this.levelComplete && this.currentLevel.bossConfig),
      RAYCAST_WORLD_TWO_CATALOG.length === 0,
      Boolean(this.levelComplete && this.episodeComplete && this.isTerminalArcSector()),
      this.isWorldTwoBreachFromBossClear()
    );
  }

  private buildLevelStartObjectiveMessage(): string {
    const state = this.getObjectiveState();
    return buildRaycastLevelStartObjectiveMessage({
      objective: buildRaycastCurrentObjective(state),
      hasBoss: Boolean(this.currentLevel.bossConfig),
      keyTotal: this.currentLevel.keys.length,
      livingEnemyCount: state.livingEnemyCount
    });
  }

  private updatePriorityMessage(objective: string, hint: string, blockedHintActive: boolean): void {
    const lowHealthHint = buildRaycastLowHealthHint(this.getNearestAvailableHealthPickupDistance(), this.playerHealth);
    const message = buildRaycastPriorityMessage({
      levelComplete: this.levelComplete,
      episodeComplete: this.episodeComplete,
      finaleBossCleared: Boolean(this.levelComplete && this.currentLevel.bossConfig),
      worldTwoLocked: RAYCAST_WORLD_TWO_CATALOG.length === 0,
      fullArcClear: Boolean(this.levelComplete && this.episodeComplete && this.isTerminalArcSector()),
      worldTwoTransition: this.isWorldTwoBreachFromBossClear(),
      playerAlive: this.playerAlive,
      playerHealth: this.playerHealth,
      objective,
      hint,
      lowHealthHint,
      combatMessage: this.time.now < this.combatMessageUntil ? this.lastCombatMessage : undefined,
      combatMessageActive: this.time.now < this.combatMessageUntil,
      blockedHintActive
    });
    const color =
      message.tone === 'critical'
        ? this.hudCss.warningText
        : message.tone === 'warning'
          ? palette.accent.warmText
          : this.hudCss.systemText;
    this.systemText.setText(message.text).setColor(color).setAlpha(message.tone === 'routine' ? 0.82 : 1);
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

  private getWorldSegment(): RaycastWorldSegmentId {
    return this.currentLevel.worldSegment ?? 'world1';
  }

  private isLastWorldTwoLevel(): boolean {
    if (RAYCAST_WORLD_TWO_CATALOG.length === 0) return false;
    return this.currentLevel.id === RAYCAST_WORLD_TWO_CATALOG[RAYCAST_WORLD_TWO_CATALOG.length - 1].id;
  }

  private isLastWorldThreeLevel(): boolean {
    if (RAYCAST_WORLD_THREE_CATALOG.length === 0) return false;
    return this.currentLevel.id === RAYCAST_WORLD_THREE_CATALOG[RAYCAST_WORLD_THREE_CATALOG.length - 1].id;
  }

  /** Terminal sector for full-arc scoring — World 3 finale when shipped, else World 2 finale. */
  private isTerminalArcSector(): boolean {
    if (RAYCAST_WORLD_THREE_CATALOG.length > 0) return this.isLastWorldThreeLevel();
    return this.isLastWorldTwoLevel();
  }

  private getAtmosphereOptions() {
    let base = getAtmosphereForDirector(this.directorDebug?.state ?? null, this.directorIntensity);
    base = applyWorldSegmentToAtmosphere(base, this.getWorldSegment());
    const boss = this.bossState;
    if (boss?.alive && this.time.now < boss.arenaTwistUntil && boss.arenaTwist === 'ion_veil') {
      return {
        ...base,
        corruptionAlpha: Math.min(0.26, base.corruptionAlpha * 1.14),
        pulseAlpha: Math.min(0.28, base.pulseAlpha * 1.1),
        enemyMinVisibility: Math.max(0.58, base.enemyMinVisibility - 0.035)
      };
    }
    if (boss?.alive && this.time.now < boss.arenaTwistUntil && boss.arenaTwist === 'retreat_cut') {
      return {
        ...base,
        fogStart: base.fogStart * 0.94,
        pulseAlpha: Math.min(0.26, base.pulseAlpha * 1.08)
      };
    }
    return base;
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
      livingEnemyCount: this.countReachableLivingEnemies(),
      playerStationaryMs: this.playerStationaryMs,
      recentBlockedReason: this.blockedHintReason
    };
  }

  private getObjectiveHint(): string {
    return buildRaycastCurrentObjective(this.getObjectiveState());
  }

  private ensureMinimapStaticCells(): RaycastMinimapCell[] {
    const key = `${this.currentLevel.id}:${this.mapLayoutRevision}`;
    if (this.minimapStaticCellsCacheKey !== key || !this.minimapStaticCells) {
      this.minimapStaticCells = buildStaticRaycastMinimapCells({ map: this.map, level: this.currentLevel });
      this.minimapStaticCellsCacheKey = key;
    }
    return this.minimapStaticCells;
  }

  private renderMinimap(): void {
    this.minimapGraphics.clear();
    this.minimapMarkerLabels.forEach((label) => label.setVisible(false));
    if (!this.minimapVisible) return;

    const keyIds = this.minimapKeyIdScratch;
    keyIds.length = 0;
    for (let i = 0; i < this.currentLevel.keys.length; i += 1) {
      const key = this.currentLevel.keys[i];
      if (this.keySystem.hasKey(key.id)) keyIds.push(key.id);
    }
    const doorIds = this.minimapDoorIdScratch;
    doorIds.length = 0;
    for (let i = 0; i < this.currentLevel.doors.length; i += 1) {
      const door = this.currentLevel.doors[i];
      if (this.doorSystem.isOpen(door.id)) doorIds.push(door.id);
    }
    const blips = this.minimapEnemyBlipScratch;
    blips.length = 0;
    for (let i = 0; i < this.enemies.length; i += 1) {
      const enemy = this.enemies[i];
      if (!enemy.alive) continue;
      blips.push({ id: enemy.id, kind: enemy.kind, x: enemy.x, y: enemy.y });
    }

    const model = buildRaycastMinimapModel({
      map: this.map,
      level: this.currentLevel,
      player: this.player,
      collectedKeyIds: keyIds,
      openDoorIds: doorIds,
      collectedSecretIds: this.collectedSecrets,
      enemies: blips,
      staticCells: this.ensureMinimapStaticCells()
    });
    const hudLayout = buildRaycastHudLayout(GAME_WIDTH, GAME_HEIGHT);
    const panelWidth = hudLayout.minimapPanelWidth;
    const panelHeight = hudLayout.minimapPanelHeight;
    const originX = hudLayout.minimapPanelX;
    const originY = hudLayout.minimapPanelY;
    const tileSize = Math.max(5, Math.floor(Math.min(panelWidth / model.width, panelHeight / model.height)));
    const offsetX = originX + Math.floor((panelWidth - model.width * tileSize) / 2);
    const offsetY = originY + Math.floor((panelHeight - model.height * tileSize) / 2);

    model.cells.forEach((cell) => {
      const color = cell.kind === 'wall' ? 0x5f7788 : cell.kind === 'door' ? 0xffd268 : 0x0f1f14;
      const alpha = cell.kind === 'floor' ? 0.94 : 1;
      this.minimapGraphics.fillStyle(color, alpha);
      this.minimapGraphics.fillRect(offsetX + cell.x * tileSize, offsetY + cell.y * tileSize, tileSize - 1, tileSize - 1);
    });

    for (let mi = 0; mi < model.markers.length; mi += 1) {
      const marker = model.markers[mi];
      if (!marker.active || marker.kind === 'player') continue;
      const px = offsetX + marker.x * tileSize;
      const py = offsetY + marker.y * tileSize;
      const color =
        marker.kind === 'key'
          ? RAYCAST_PALETTE.plasmaBright
          : marker.kind === 'exit'
            ? 0x6fd8ff
            : marker.kind === 'landmark'
              ? 0xffde8a
            : 0xffb347;
      this.minimapGraphics.fillStyle(color, 1);
      this.minimapGraphics.fillRect(px - 3, py - 3, Math.max(6, tileSize - 1), Math.max(6, tileSize - 1));
      this.minimapGraphics.lineStyle(1, 0x04070c, 0.95);
      this.minimapGraphics.strokeRect(px - 3, py - 3, Math.max(6, tileSize - 1), Math.max(6, tileSize - 1));
      if (marker.kind === 'exit') {
        this.minimapGraphics.lineStyle(2, 0xe2f7ff, 1);
        this.minimapGraphics.strokeCircle(px + tileSize * 0.1, py + tileSize * 0.1, Math.max(5, tileSize * 0.55));
      }
    }

    model.enemyBlips.forEach((enemy) => {
      const px = offsetX + enemy.x * tileSize;
      const py = offsetY + enemy.y * tileSize;
      const style = getRaycastMinimapEnemyDotStyle(enemy.kind);
      const baseR = Math.max(1.8, tileSize * 0.22 * style.radiusMul);
      this.minimapGraphics.lineStyle(1, style.ring, 0.88);
      this.minimapGraphics.strokeCircle(px, py, baseR + 1.1);
      this.minimapGraphics.fillStyle(style.fill, 1);
      if (enemy.kind === 'STALKER') {
        const s = baseR * 1.25;
        this.minimapGraphics.fillTriangle(px, py - s, px - s * 0.92, py + s * 0.62, px + s * 0.92, py + s * 0.62);
      } else if (enemy.kind === 'RANGED') {
        this.minimapGraphics.fillCircle(px, py, baseR);
        this.minimapGraphics.fillStyle(0xfff7fb, 0.55);
        this.minimapGraphics.fillCircle(px, py, Math.max(1, baseR * 0.38));
      } else {
        this.minimapGraphics.fillCircle(px, py, baseR);
      }
    });

    let playerMarker: RaycastMinimapMarker | undefined;
    for (let pi = 0; pi < model.markers.length; pi += 1) {
      const candidate = model.markers[pi];
      if (candidate.kind === 'player' && candidate.active) {
        playerMarker = candidate;
        break;
      }
    }
    if (playerMarker) {
      const px = offsetX + playerMarker.x * tileSize;
      const py = offsetY + playerMarker.y * tileSize;
      const bodyR = Math.max(3.4, tileSize * 0.42);
      this.minimapGraphics.lineStyle(3, 0x05070c, 1);
      this.minimapGraphics.strokeCircle(px, py, bodyR + 2);
      this.minimapGraphics.fillStyle(0xffffff, 1);
      this.minimapGraphics.fillCircle(px, py, bodyR + 0.4);
      this.minimapGraphics.fillStyle(0x58f2e4, 1);
      this.minimapGraphics.fillCircle(px, py, Math.max(1.6, tileSize * 0.14));
      const dirX = Math.cos(playerMarker.angle ?? 0) * tileSize * 1.15;
      const dirY = Math.sin(playerMarker.angle ?? 0) * tileSize * 1.15;
      this.minimapGraphics.lineStyle(4, 0xfff29e, 1);
      this.minimapGraphics.beginPath();
      this.minimapGraphics.moveTo(px, py);
      this.minimapGraphics.lineTo(px + dirX, py + dirY);
      this.minimapGraphics.strokePath();
    }

    const labelScratch = this.minimapLabeledMarkerScratch;
    labelScratch.length = 0;
    for (let li = 0; li < model.markers.length; li += 1) {
      const marker = model.markers[li];
      if (this.shouldRenderMinimapMarkerLabel(marker)) labelScratch.push(marker);
    }
    const labelLimit = Math.min(labelScratch.length, this.minimapMarkerLabels.length);
    for (let index = 0; index < labelLimit; index += 1) {
      const marker = labelScratch[index];
      const label = this.minimapMarkerLabels[index];
      const markerX = offsetX + marker.x * tileSize;
      const markerY = offsetY + marker.y * tileSize;
      label.setText(marker.label);
      const textX = Phaser.Math.Clamp(markerX + 4, originX + 6, originX + panelWidth - label.width - 4);
      const textY = Phaser.Math.Clamp(markerY - 6, originY + 3, originY + panelHeight - label.height - 3);
      label.setPosition(textX, textY).setVisible(true);
    }
  }

  private shouldRenderMinimapMarkerLabel(marker: { kind: string; label: string; active: boolean }): boolean {
    if (!marker.active) return false;
    if (marker.kind === 'door') return marker.label === 'LOCK' || marker.label === 'OPEN';
    if (marker.kind === 'exit') return marker.label === 'EXIT' || marker.label === 'PORTAL';
    if (marker.kind === 'key') return marker.label === 'KEY';
    if (marker.kind === 'landmark') return true;
    return false;
  }

  private updateHealthHud(): void {
    const visual = getRaycastHealthVisualState(this.playerHealth);
    this.healthText.setColor(visual.color);
    this.healthBarFill.setFillStyle(visual.accentColor, 1);
    this.healthBarFill.setSize(168 * visual.ratio, 6);
    const pulse =
      visual.tone === 'critical'
        ? 0.76 + Math.sin(this.time.now * 0.0082) * 0.16
        : visual.tone === 'low'
          ? 0.88 + Math.sin(this.time.now * 0.005) * 0.08
          : 1;
    this.healthBarTrack.setAlpha(visual.tone === 'stable' ? 0.9 : pulse);
    if (visual.tone === 'critical') {
      this.healthBarFill.setAlpha(0.86 + Math.sin(this.time.now * 0.0095) * 0.12);
    } else {
      this.healthBarFill.setAlpha(1);
    }
  }

  private updateBossHud(): void {
    const boss = this.bossState;
    const showBossHud = Boolean(
      this.currentLevel.bossConfig &&
      boss &&
      this.playerAlive &&
      !this.levelComplete
    );
    this.bossNameText.setVisible(showBossHud);
    this.bossPhaseText.setVisible(showBossHud);
    this.bossBarTrack.setVisible(showBossHud);
    this.bossBarFill.setVisible(showBossHud);
    if (!showBossHud || !boss) return;

    const ratio = Phaser.Math.Clamp(boss.maxHealth <= 0 ? 0 : boss.health / boss.maxHealth, 0, 1);
    const telegraphing = this.time.now < boss.telegraphUntil;
    this.bossNameText.setText(`BOSS // ${boss.displayName.toUpperCase()}`);
    this.bossPhaseText
      .setText(`${getRaycastBossPhaseLabel(boss)}  //  ${Math.ceil(ratio * 100)}%`)
      .setColor(telegraphing ? '#ffcf7c' : boss.phase === 3 ? '#ff6a7c' : boss.phase === 2 ? '#ff9ca8' : '#ffe7b8');
    this.bossBarFill
      .setSize(430 * ratio, 10)
      .setFillStyle(telegraphing ? 0xff8833 : boss.phase === 3 ? 0xff3145 : boss.phase === 2 ? 0xff5b6f : 0xb84fff, 1);
  }

  private updateFocusedEnemyHud(): void {
    const wallDistance = castRay(this.map, this.player.x, this.player.y, this.player.angle, this.player.angle).distance;
    const bossTarget = getRaycastBossCrosshairTarget(this.player, wallDistance, this.bossState, this.time.now);
    const target =
      bossTarget ??
      getRaycastCrosshairTargetInfo(this.player, this.enemies, wallDistance, this.time.now);
    if (!target) {
      this.targetText.setVisible(false);
      this.targetBarTrack.setVisible(false);
      this.targetBarFill.setVisible(false);
      return;
    }

    const targetColor = target.isTelegraphing ? '#ffd78a' : target.isWindingUp ? '#ff7a92' : '#fff0c2';
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
      .setFillStyle(target.isTelegraphing ? 0xffc266 : target.isWindingUp ? 0xff4468 : 0xfff29e, 1);
    this.targetBarFill.setSize(118 * Phaser.Math.Clamp(target.healthRatio, 0, 1), 4);
  }

  private flashDamage(amount: number): void {
    const maxHp = 100;
    const ratio = Phaser.Math.Clamp(this.playerHealth / maxHp, 0, 1);
    let stress = 1;
    if (ratio <= 0.25) stress = 1.18 + (0.25 - ratio) * 0.95;
    else if (ratio <= 0.5) stress = 1.04 + (0.5 - ratio) * 0.26;
    const frameAlpha = Phaser.Math.Clamp((0.48 + amount / 17) * stress, 0.48, 0.96);
    const flashAlpha = Phaser.Math.Clamp((0.2 + amount / 46) * stress, 0.2, 0.48);
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
      duration: ratio <= 0.25 ? 312 : ratio <= 0.5 ? 288 : 268,
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
    if (this.gamePaused || !this.playerAlive || this.levelComplete) return;
    if (this.time.now < this.nextAmbientCueAt) return;
    const bossActive = Boolean(this.bossState?.alive && this.currentLevel.bossConfig && !this.levelComplete);
    const segment = this.getWorldSegment();
    const dirState = this.directorDebug?.state;
    const pressure = dirState === 'AMBUSH' || dirState === 'PRESSURE';
    const recovery = dirState === 'RECOVERY';

    let cue: AudioFeedbackCue = 'ambient';
    if (bossActive) cue = segment === 'world2' ? 'ambientCorrupt' : 'ambientIndustrial';
    else if (pressure) cue = 'ambientIndustrial';
    else if (segment === 'world2') cue = 'ambientCorrupt';

    const baseIntensity = bossActive
      ? segment === 'world2'
        ? 0.88
        : 0.84
      : pressure
        ? 0.81
        : segment === 'world2'
          ? 0.72
          : 0.75;

    this.audioFeedback.play(cue, baseIntensity, this.time.now);
    if (bossActive) this.audioFeedback.play('directorWarning', 0.58, this.time.now + 120);

    const interval = bossActive ? 3000 : recovery ? 13200 : pressure ? 4400 : 8200;
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
    if (beat.directorState === 'RECOVERY') this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.04, 140);
    else this.pulseFeedback(0xff5b6f, 0.04, 130);
    if (beat.directorState !== 'RECOVERY') this.pulseCorruption();
    this.setCombatMessage(beat.message);
    this.stageSetpieceCue(beat.setpieceCue);
    return true;
  }

  /** Authored tension beats — overlays + audio only (see `RaycastSetpieceCue`). */
  private stageSetpieceCue(cue: RaycastSetpieceCue | undefined): void {
    if (!cue || this.gamePaused) return;
    const opts = this.getAtmosphereOptions();
    const now = this.time.now;

    if (cue === 'BLACKOUT_PULSE') {
      this.corruptionVeil.setAlpha(Math.min(0.4, opts.corruptionAlpha + 0.22));
      this.tweens.killTweensOf(this.corruptionVeil);
      this.tweens.add({
        targets: this.corruptionVeil,
        alpha: opts.corruptionAlpha,
        duration: 520,
        ease: 'Quad.easeOut'
      });
      this.cameras.main.flash(130, 12, 14, 18, false);
      this.audioFeedback.play('directorWarning', 0.48, now);
      return;
    }

    if (cue === 'ALARM_SURGE') {
      this.audioFeedback.play('directorWarning', 0.88, now);
      this.pulseFeedback(0xff2244, 0.07, 110);
      this.time.delayedCall(120, () => this.pulseFeedback(0xff5533, 0.055, 95));
      this.time.delayedCall(260, () => this.audioFeedback.play('stingerDread', 0.42, now + 260));
      return;
    }

    if (cue === 'RITUAL_PULSE') {
      this.pulseCorruption();
      this.pulseFeedback(RAYCAST_PALETTE.riftBloom, 0.1, 220);
      this.audioFeedback.play('directorAmbush', 0.62, now + 40);
      return;
    }

    if (cue === 'FAKE_CALM') {
      this.audioFeedback.play('directorRecovery', 0.58, now);
      this.pulseFeedback(RAYCAST_PALETTE.plasmaBright, 0.052, 180);
      this.corruptionVeil.setAlpha(Math.max(0.03, opts.corruptionAlpha * 0.45));
      this.tweens.killTweensOf(this.corruptionVeil);
      this.tweens.add({
        targets: this.corruptionVeil,
        alpha: opts.corruptionAlpha,
        duration: 520,
        ease: 'Quad.easeOut'
      });
      return;
    }

    if (cue === 'CORRIDOR_HUNT') {
      this.audioFeedback.play('directorWarning', 0.74, now);
      this.audioFeedback.play('uiSoftDeny', 0.44, now + 55);
      this.pulseFeedback(0xffaa44, 0.068, 140);
      return;
    }

    if (cue === 'ARENA_LOCKDOWN') {
      this.audioFeedback.play('directorAmbush', 0.72, now);
      this.audioFeedback.play('stingerDread', 0.38, now + 60);
      this.pulseFeedback(0xff2244, 0.075, 125);
      this.damageFrameTop.setAlpha(0.28);
      this.damageFrameBottom.setAlpha(0.28);
      this.tweens.killTweensOf([this.damageFrameTop, this.damageFrameBottom]);
      this.tweens.add({
        targets: [this.damageFrameTop, this.damageFrameBottom],
        alpha: 0,
        duration: 220,
        ease: 'Quad.easeOut'
      });
    }
  }

  private getNearestAvailableHealthPickupDistance(): number | null {
    const distances = this.currentLevel.healthPickups
      .filter((pickup) => !this.collectedHealthPickups.has(pickup.id))
      .filter((pickup) => {
        const requiredDoors = pickup.requiredOpenDoorIds ?? [];
        if (!requiredDoors.every((doorId) => this.doorSystem.isOpen(doorId))) return false;
        return isRaycastPointReachable(this.currentLevel, pickup, { openDoorIds: requiredDoors });
      })
      .map((pickup) => Math.hypot(pickup.x - this.player.x, pickup.y - this.player.y));

    return distances.length > 0 ? Math.min(...distances) : null;
  }
}
