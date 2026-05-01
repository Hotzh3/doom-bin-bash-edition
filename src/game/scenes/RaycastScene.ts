import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DoorSystem } from '../systems/DoorSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import { KeySystem } from '../systems/KeySystem';
import { TriggerSystem } from '../systems/TriggerSystem';
import { AudioFeedbackSystem, type AudioFeedbackCue } from '../systems/AudioFeedbackSystem';
import type { DirectorEvent } from '../systems/DirectorEvents';
import type { WeaponKind } from '../systems/WeaponTypes';
import { DIRECTOR_STATE_LABELS, type DirectorDebugInfo, type DirectorState } from '../systems/DirectorState';
import { RaycastCombatSystem } from '../raycast/RaycastCombatSystem';
import { cloneRaycastEnemies, createRaycastEnemy, type RaycastEnemy } from '../raycast/RaycastEnemy';
import {
  updateRaycastEnemies,
  updateRaycastEnemyProjectiles,
  type RaycastEnemyProjectile
} from '../raycast/RaycastEnemySystem';
import {
  cloneRaycastMap,
  findRaycastZoneId,
  getRaycastExitAccess,
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor,
  registerRaycastSecret,
  RAYCAST_LEVEL,
  type RaycastDoor
} from '../raycast/RaycastLevel';
import { RAYCAST_MAP, RAYCAST_PLAYER_START, type RaycastMap } from '../raycast/RaycastMap';
import { RAYCAST_ATMOSPHERE, getAtmosphereForDirector } from '../raycast/RaycastAtmosphere';
import { buildRaycastDebugLine, buildRaycastHudLine } from '../raycast/RaycastHud';
import { RaycastPlayerController, type RaycastPlayerState } from '../raycast/RaycastPlayerController';
import { RaycastRenderer, type RaycastBillboard } from '../raycast/RaycastRenderer';
import { buildRaycastRunSummary } from '../raycast/RaycastRunSummary';
import { palette } from '../theme/palette';

export class RaycastScene extends Phaser.Scene {
  private raycastRenderer!: RaycastRenderer;
  private controller!: RaycastPlayerController;
  private combat!: RaycastCombatSystem;
  private audioFeedback!: AudioFeedbackSystem;
  private gameDirector!: GameDirector;
  private keySystem!: KeySystem;
  private doorSystem!: DoorSystem;
  private triggerSystem!: TriggerSystem;
  private map!: RaycastMap;
  private enemies: RaycastEnemy[] = [];
  private enemyProjectiles: RaycastEnemyProjectile[] = [];
  private player: RaycastPlayerState = { ...RAYCAST_PLAYER_START };
  private playerHealth = 100;
  private damageTaken = 0;
  private runStartedAt = 0;
  private playerAlive = true;
  private levelComplete = false;
  private readonly collectedSecrets = new Set<string>();
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
  private debugText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private muzzleFlash!: Phaser.GameObjects.Rectangle;
  private wallImpactFlash!: Phaser.GameObjects.Arc;
  private damageFlash!: Phaser.GameObjects.Rectangle;
  private corruptionVeil!: Phaser.GameObjects.Rectangle;
  private systemText!: Phaser.GameObjects.Text;
  private crosshair!: Phaser.GameObjects.Text;
  private finalOverlay!: Phaser.GameObjects.Rectangle;
  private finalTitleText!: Phaser.GameObjects.Text;
  private finalSummaryText!: Phaser.GameObjects.Text;
  private finalHintText!: Phaser.GameObjects.Text;
  private weaponOverlayFlashUntil = 0;
  private lastCombatMessage: string = RAYCAST_ATMOSPHERE.messages.intro;
  private combatMessageUntil = 0;
  private nextAmbientCueAt = 0;
  private sceneReady = false;
  private inputListenersRegistered = false;

  private readonly handleExitToMenu = (): void => {
    if (!this.isRaycastSceneActive()) return;
    this.scene.start('MenuScene');
  };

  private readonly handleRetry = (): void => {
    if (!this.isRaycastSceneActive()) return;
    this.scene.restart();
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

  constructor() {
    super('RaycastScene');
  }

  create(): void {
    this.resetRuntimeState();
    this.cameras.main.setBackgroundColor('#05070c');
    this.map = cloneRaycastMap(RAYCAST_MAP);
    this.keySystem = new KeySystem();
    this.doorSystem = new DoorSystem(this.keySystem);
    this.triggerSystem = new TriggerSystem();
    this.raycastRenderer = new RaycastRenderer(this, this.map);
    this.controller = new RaycastPlayerController(this, this.map, this.player);
    this.controller.create();
    this.combat = new RaycastCombatSystem();
    this.audioFeedback = new AudioFeedbackSystem();
    this.gameDirector = new GameDirector({
      config: RAYCAST_LEVEL.director.config,
      spawnPoints: RAYCAST_LEVEL.director.spawnPoints
    });
    this.enemies = cloneRaycastEnemies();

    this.add
      .text(16, 14, 'TERMINAL CORRUPTION HELL ARENA  |  WASD/QE  |  1/2/3  |  FIRE F/SPACE/click  |  TAB DEBUG', {
        fontSize: '13px',
        fontStyle: '700',
        color: palette.background.panelText,
        backgroundColor: RAYCAST_ATMOSPHERE.hudPanel,
        padding: { x: 8, y: 5 }
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

    this.muzzleFlash = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT - 54, 96, 34, palette.accent.projectile, 0);
    this.muzzleFlash.setDepth(11);
    this.wallImpactFlash = this.add.circle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, 18, 0xffffff, 0);
    this.wallImpactFlash.setDepth(12);
    this.damageFlash = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_ATMOSPHERE.damageFlash, 0);
    this.damageFlash.setDepth(13);
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
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.72, 'R RETRY  |  ESC MENU', {
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
    this.weaponText.setText(
      buildRaycastHudLine({
        health: this.playerHealth,
        weaponLabel: this.combat.getWeaponLabel(),
        keyCount: this.getKeyCount(),
        keyTotal: RAYCAST_LEVEL.keys.length,
        secretCount: this.collectedSecrets.size,
        secretTotal: RAYCAST_LEVEL.secrets.length,
        objective: this.getObjectiveHint(),
        criticalMessage: this.getHudCriticalMessage()
      })
    );
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
      x: RAYCAST_PLAYER_START.x,
      y: RAYCAST_PLAYER_START.y,
      angle: RAYCAST_PLAYER_START.angle,
      velocity: { ...RAYCAST_PLAYER_START.velocity }
    };
    this.playerHealth = 100;
    this.damageTaken = 0;
    this.runStartedAt = this.time.now;
    this.playerAlive = true;
    this.levelComplete = false;
    this.collectedSecrets.clear();
    this.enemiesKilled = 0;
    this.playerStationaryMs = 0;
    this.lastPlayerDamageAt = this.time.now;
    this.lastPlayerPosition = { x: RAYCAST_PLAYER_START.x, y: RAYCAST_PLAYER_START.y };
    this.activeZoneId = null;
    this.directorDebug = null;
    this.lastDirectorState = null;
    this.directorIntensity = 0;
    this.directorSpawnCounter = 0;
    this.debugHudVisible = false;
    this.enemyProjectiles = [];
    this.lastCombatMessage = RAYCAST_ATMOSPHERE.messages.intro;
    this.combatMessageUntil = 0;
    this.weaponOverlayFlashUntil = 0;
    this.nextAmbientCueAt = 0;
    this.sceneReady = false;
  }

  private registerInputListeners(): void {
    if (this.inputListenersRegistered) this.cleanupInputListeners();
    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ESC', this.handleExitToMenu);
    keyboard?.on('keydown-R', this.handleRetry);
    keyboard?.on('keydown-F', this.handleFireInput);
    keyboard?.on('keydown-SPACE', this.handleFireInput);
    keyboard?.on('keydown-ONE', this.handleWeaponSlotOne);
    keyboard?.on('keydown-TWO', this.handleWeaponSlotTwo);
    keyboard?.on('keydown-THREE', this.handleWeaponSlotThree);
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
    keyboard?.off('keydown-F', this.handleFireInput);
    keyboard?.off('keydown-SPACE', this.handleFireInput);
    keyboard?.off('keydown-ONE', this.handleWeaponSlotOne);
    keyboard?.off('keydown-TWO', this.handleWeaponSlotTwo);
    keyboard?.off('keydown-THREE', this.handleWeaponSlotThree);
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
      this.corruptionVeil,
      this.systemText,
      this.crosshair,
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
    this.audioFeedback.play(this.getShootCue(result.weaponKind));
    if (!result.hitEnemy) {
      this.flashWallImpact();
      this.pulseCrosshair('#9feee2', 72);
      this.audioFeedback.play('wallImpact');
      this.setCombatMessage('WALL IMPACT');
      return;
    }

    this.enemiesKilled += result.killCount;
    this.audioFeedback.play(result.killed ? 'kill' : 'hit');
    this.pulseCrosshair(result.killed ? '#ff5b6f' : '#ffffff', result.killed ? 118 : 92);
    this.setCombatMessage(
      result.killed
        ? RAYCAST_ATMOSPHERE.messages.kill
        : result.hitCount > 1
          ? `HOSTILE PROCESS HIT x${result.hitCount}`
          : `HOSTILE PROCESS HIT -${result.totalDamage}`
    );
  }

  private flashMuzzle(): void {
    const weapon = this.combat.getCurrentWeapon();
    const width = weapon === 'SHOTGUN' ? 144 : weapon === 'LAUNCHER' ? 118 : 92;
    const height = weapon === 'SHOTGUN' ? 46 : weapon === 'LAUNCHER' ? 42 : 30;
    const alpha = weapon === 'SHOTGUN' ? 0.98 : weapon === 'LAUNCHER' ? 0.92 : 0.82;
    this.muzzleFlash.setSize(width, height);
    this.muzzleFlash.setFillStyle(weapon === 'LAUNCHER' ? 0x9feee2 : weapon === 'SHOTGUN' ? 0xff8a3d : RAYCAST_ATMOSPHERE.muzzleFlash);
    this.muzzleFlash.setAlpha(alpha);
    this.weaponOverlayFlashUntil = this.time.now + (weapon === 'LAUNCHER' ? 150 : weapon === 'SHOTGUN' ? 120 : 80);
    this.tweens.killTweensOf(this.muzzleFlash);
    this.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      duration: 85,
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

  private getWeaponOverlayFlashAlpha(): number {
    if (this.time.now >= this.weaponOverlayFlashUntil) return 0;
    return Phaser.Math.Clamp((this.weaponOverlayFlashUntil - this.time.now) / 120, 0, 1);
  }

  private getShootCue(weapon: WeaponKind): AudioFeedbackCue {
    if (weapon === 'SHOTGUN') return 'shootShotgun';
    if (weapon === 'LAUNCHER') return 'shootLauncher';
    return 'shootPistol';
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
    const enemyResult = updateRaycastEnemies(
      this.map,
      this.enemies,
      { x: this.player.x, y: this.player.y, alive: this.playerAlive },
      this.time.now,
      delta
    );
    if (enemyResult.spawnedProjectiles.length > 0) {
      this.enemyProjectiles.push(...enemyResult.spawnedProjectiles);
      this.setCombatMessage('INCOMING HOSTILE PACKET');
      this.audioFeedback.play('spawn');
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
    this.flashDamage();
    this.audioFeedback.play('damage');
    this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.damage} -${amount}`);
    if (this.playerHealth === 0) {
      this.playerAlive = false;
      this.setCombatMessage('SIGNAL LOST');
      this.showRunCompleteOverlay('SIGNAL LOST', RAYCAST_ATMOSPHERE.warningText);
    }
  }

  private updateLevelState(): void {
    this.activeZoneId = findRaycastZoneId(RAYCAST_LEVEL, this.player.x, this.player.y);

    RAYCAST_LEVEL.keys.forEach((key) => {
      if (!this.keySystem.hasKey(key.id) && isNearPoint(this.player.x, this.player.y, key)) {
        this.keySystem.collect(key);
        this.audioFeedback.play('pickup');
        this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.key}: ${key.pickupObjectiveText}`);
      }
    });

    RAYCAST_LEVEL.doors.forEach((door) => {
      if (!this.doorSystem.isOpen(door.id) && isNearPoint(this.player.x, this.player.y, { ...door, radius: 0.78 })) {
        this.tryOpenDoor(door);
      }
    });

    RAYCAST_LEVEL.triggers.forEach((trigger) => {
      const activated = this.triggerSystem.activateIfEntered(trigger, [{ x: this.player.x, y: this.player.y }], {
        isDoorOpen: (doorId) => this.doorSystem.isOpen(doorId)
      });
      if (!activated) return;

      this.gameDirector.notifyZoneTrigger(trigger.id, this.time.now);
      this.audioFeedback.play('spawn');
      this.pulseCorruption();
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.trigger}: ${trigger.activationText}`);
      this.enemies.push(
        ...trigger.spawns.map((spawn, index) =>
          createRaycastEnemy({ id: `${trigger.id}-${index}`, kind: spawn.kind, x: spawn.x, y: spawn.y })
        )
      );
    });

    RAYCAST_LEVEL.secrets.forEach((secret) => {
      if (this.collectedSecrets.has(secret.id)) return;
      if (!isNearPoint(this.player.x, this.player.y, secret)) return;
      this.playerHealth = Math.min(100, this.playerHealth + 25);
      registerRaycastSecret(this.collectedSecrets, secret);
      this.audioFeedback.play('pickup');
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.secret}: ${secret.objectiveText}`);
    });

    RAYCAST_LEVEL.exits.forEach((exit) => {
      if (this.levelComplete) return;
      if (!isNearPoint(this.player.x, this.player.y, exit)) return;
      const exitAccess = getRaycastExitAccess(RAYCAST_LEVEL, {
        collectedKeyIds: RAYCAST_LEVEL.keys.filter((key) => this.keySystem.hasKey(key.id)).map((key) => key.id),
        openDoorIds: RAYCAST_LEVEL.doors.filter((door) => this.doorSystem.isOpen(door.id)).map((door) => door.id),
        activatedTriggerIds: RAYCAST_LEVEL.triggers.filter((trigger) => this.triggerSystem.hasActivated(trigger.id)).map((trigger) => trigger.id)
      });
      if (!exitAccess.allowed) {
        this.audioFeedback.play('hit');
        this.setCombatMessage(exitAccess.message ?? RAYCAST_ATMOSPHERE.messages.locked);
        return;
      }
      this.levelComplete = true;
      this.audioFeedback.play('pickup');
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.exit}: ${exit.objectiveText}`);
      this.showRunCompleteOverlay('NODE PURGED', RAYCAST_ATMOSPHERE.systemText);
    });
  }

  private showRunCompleteOverlay(title: string, titleColor: string): void {
    const summary = buildRaycastRunSummary({
      elapsedMs: this.time.now - this.runStartedAt,
      enemiesKilled: this.enemiesKilled,
      secretsFound: this.collectedSecrets.size,
      secretTotal: RAYCAST_LEVEL.secrets.length,
      tokensFound: this.getKeyCount(),
      tokenTotal: RAYCAST_LEVEL.keys.length,
      damageTaken: this.damageTaken
    });

    this.finalTitleText.setText(title).setColor(titleColor);
    this.finalSummaryText.setText(summary.join('\n'));
    this.finalOverlay.setVisible(true).setAlpha(0.82);
    this.finalTitleText.setVisible(true);
    this.finalSummaryText.setVisible(true);
    this.finalHintText.setVisible(true);
  }

  private tryOpenDoor(door: RaycastDoor): void {
    const result = this.doorSystem.attemptOpen(door, 0);
    if (result.reason === 'MISSING_KEY') {
      this.audioFeedback.play('hit');
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.locked}: ${door.lockedObjectiveText}`);
      return;
    }
    if (!result.opened) return;

    openRaycastDoor(this.map, door);
    this.audioFeedback.play('door');
    this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.doorOpen}: ${door.openObjectiveText}`);
  }

  private createLevelBillboards(): RaycastBillboard[] {
    const keyBillboards = RAYCAST_LEVEL.keys
      .filter((key) => !this.keySystem.hasKey(key.id))
      .map((key) => ({ x: key.x, y: key.y, color: 0x9feee2, radius: key.radius, label: key.billboardLabel, style: 'token' as const }));
    const doorBillboards = RAYCAST_LEVEL.doors
      .filter((door) => !this.doorSystem.isOpen(door.id))
      .map((door) => ({ x: door.x, y: door.y, color: 0xff5b6f, radius: 0.18, label: door.billboardLabel, style: 'gate' as const }));
    const secretBillboards = RAYCAST_LEVEL.secrets
      .filter((secret) => !this.collectedSecrets.has(secret.id))
      .map((secret) => ({ x: secret.x, y: secret.y, color: 0xff8a3d, radius: secret.radius, label: secret.billboardLabel, style: 'secret' as const }));
    const exitBillboards = RAYCAST_LEVEL.exits.map((exit) => ({
      x: exit.x,
      y: exit.y,
      color: this.levelComplete ? 0x9feee2 : 0x66ff66,
      radius: exit.radius,
      label: exit.billboardLabel,
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
    if (!RAYCAST_LEVEL.director.enabled) return;

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
      spawnPoints: getSafeDirectorSpawnPoints(RAYCAST_LEVEL, this.player, this.activeZoneId, {
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
      if (event.type === 'AMBIENT_PULSE') {
        this.audioFeedback.play('ambient');
        return;
      }

      if (event.type === 'WARNING_MESSAGE') {
        this.audioFeedback.play('ambient');
        this.pulseCorruption();
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'PREPARE_AMBUSH') {
        this.audioFeedback.play('spawn');
        this.pulseCorruption();
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'RECOVERY_SIGNAL') {
        this.audioFeedback.play('pickup');
        this.setCombatMessage(event.message);
        return;
      }

      if (event.type === 'PUNISH_STATIONARY') {
        this.audioFeedback.play('damage');
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
    if (nextState === 'BUILD_UP') this.setCombatMessage(RAYCAST_ATMOSPHERE.messages.pressure);
    if (nextState === 'HIGH_INTENSITY') this.setCombatMessage(RAYCAST_ATMOSPHERE.messages.surge);
    if (nextState === 'RECOVERY') this.setCombatMessage(RAYCAST_ATMOSPHERE.messages.recovery);
  }

  private spawnDirectorEnemy(spawn: SpawnRequest): void {
    this.enemies.push(
      createRaycastEnemy({
        id: `director-${this.directorSpawnCounter}`,
        kind: spawn.kind,
        x: spawn.x,
        y: spawn.y
      })
    );
    this.directorSpawnCounter += 1;
    this.audioFeedback.play('spawn');
    this.pulseCorruption();
    this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.spawn}: ${spawn.kind}`);
  }

  private getActivatedTriggerCount(): number {
    return RAYCAST_LEVEL.triggers.filter((trigger) => this.triggerSystem.hasActivated(trigger.id)).length;
  }

  private getDistanceToImportantPickup(): number | null {
    const uncollectedKeyDistances = RAYCAST_LEVEL.keys
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
    if (this.levelComplete) return 'Level complete. Press ESC.';
    if (this.playerAlive) return RAYCAST_ATMOSPHERE.messages.idle;
    return 'Down. Press ESC.';
  }

  private getDirectorDebugLine(): string {
    if (!RAYCAST_LEVEL.director.enabled) return 'director off';
    if (!this.directorDebug) return 'director warming up';
    return [
      `AI ${DIRECTOR_STATE_LABELS[this.directorDebug.state]}`,
      `int ${this.directorDebug.intensity}`,
      `alive ${this.directorDebug.enemiesAlive}/${this.directorDebug.maxEnemiesAlive ?? '?'}`,
      `cd ${Math.ceil(this.directorDebug.spawnCooldownRemainingMs / 1000)}s`,
      `budget ${this.directorDebug.spawnBudgetRemaining ?? '?'}`,
      this.directorDebug.lastDecisionReason
    ].join(' | ');
  }

  private getAtmosphereOptions() {
    return getAtmosphereForDirector(this.directorDebug?.state ?? null, this.directorIntensity);
  }

  private getKeyCount(): number {
    return RAYCAST_LEVEL.keys.filter((key) => this.keySystem.hasKey(key.id)).length;
  }

  private getObjectiveHint(): string {
    if (this.levelComplete) return 'COMPLETE';
    if (this.getKeyCount() < RAYCAST_LEVEL.keys.length) return 'TOKEN';
    if (RAYCAST_LEVEL.doors.some((door) => !this.doorSystem.isOpen(door.id))) return 'GATE';
    if (this.getActivatedTriggerCount() === 0) return 'BREACH';
    return 'EXIT';
  }

  private flashDamage(): void {
    this.damageFlash.setAlpha(0.34);
    this.tweens.killTweensOf(this.damageFlash);
    this.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: 180,
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
    this.audioFeedback.play('ambient');
    const interval = this.directorDebug?.state === 'AMBUSH' || this.directorDebug?.state === 'HIGH_INTENSITY' ? 4200 : 7600;
    this.nextAmbientCueAt = this.time.now + interval;
  }
}
