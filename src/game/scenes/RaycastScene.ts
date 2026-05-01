import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DoorSystem } from '../systems/DoorSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import { KeySystem } from '../systems/KeySystem';
import { TriggerSystem } from '../systems/TriggerSystem';
import { AudioFeedbackSystem } from '../systems/AudioFeedbackSystem';
import { DIRECTOR_STATE_LABELS, type DirectorDebugInfo } from '../systems/DirectorState';
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
  getSafeDirectorSpawnPoints,
  isNearPoint,
  openRaycastDoor,
  RAYCAST_LEVEL,
  type RaycastDoor
} from '../raycast/RaycastLevel';
import { RAYCAST_MAP, RAYCAST_PLAYER_START, type RaycastMap } from '../raycast/RaycastMap';
import { RAYCAST_ATMOSPHERE, getAtmosphereForDirector } from '../raycast/RaycastAtmosphere';
import { RaycastPlayerController, type RaycastPlayerState } from '../raycast/RaycastPlayerController';
import { RaycastRenderer } from '../raycast/RaycastRenderer';
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
  private playerAlive = true;
  private levelComplete = false;
  private readonly collectedSecrets = new Set<string>();
  private enemiesKilled = 0;
  private playerStationaryMs = 0;
  private lastPlayerDamageAt = 0;
  private lastPlayerPosition: { x: number; y: number } = { x: RAYCAST_PLAYER_START.x, y: RAYCAST_PLAYER_START.y };
  private activeZoneId: string | null = null;
  private directorDebug: DirectorDebugInfo | null = null;
  private directorIntensity = 0;
  private directorSpawnCounter = 0;
  private debugText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private muzzleFlash!: Phaser.GameObjects.Rectangle;
  private damageFlash!: Phaser.GameObjects.Rectangle;
  private corruptionVeil!: Phaser.GameObjects.Rectangle;
  private systemText!: Phaser.GameObjects.Text;
  private crosshair!: Phaser.GameObjects.Text;
  private lastCombatMessage: string = RAYCAST_ATMOSPHERE.messages.intro;
  private combatMessageUntil = 0;
  private nextAmbientCueAt = 0;

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
      .text(16, 14, 'TERMINAL CORRUPTION HELL ARENA  |  WASD move/strafe  |  Q/E turn  |  1/2/3 weapon  |  FIRE: F/SPACE/click', {
        fontSize: '15px',
        fontStyle: '700',
        color: palette.background.panelText,
        backgroundColor: palette.background.hudPanel,
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
        fontSize: '22px',
        fontStyle: '700',
        color: palette.accent.warmText,
        backgroundColor: palette.background.hudPanel,
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.muzzleFlash = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT - 54, 96, 34, palette.accent.projectile, 0);
    this.muzzleFlash.setDepth(11);
    this.damageFlash = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_ATMOSPHERE.damageFlash, 0);
    this.damageFlash.setDepth(13);
    this.corruptionVeil = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, RAYCAST_ATMOSPHERE.corruptionTint, 0);
    this.corruptionVeil.setDepth(9);
    this.systemText = this.add
      .text(GAME_WIDTH * 0.5, 58, RAYCAST_ATMOSPHERE.messages.intro, {
        fontSize: '22px',
        fontStyle: '700',
        color: RAYCAST_ATMOSPHERE.systemText,
        stroke: '#020408',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(14);

    this.debugText = this.add
      .text(16, GAME_HEIGHT - 38, '', {
        fontSize: '14px',
        color: palette.accent.terminalText,
        backgroundColor: palette.background.hudPanel,
        padding: { x: 8, y: 5 }
      })
      .setDepth(10);

    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-F', () => this.fireWeapon());
    this.input.keyboard?.on('keydown-SPACE', () => this.fireWeapon());
    this.input.keyboard?.on('keydown-ONE', () => this.switchWeapon(1));
    this.input.keyboard?.on('keydown-TWO', () => this.switchWeapon(2));
    this.input.keyboard?.on('keydown-THREE', () => this.switchWeapon(3));
    this.input.on('pointerdown', () => this.fireWeapon());
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
    this.raycastRenderer.render(this.player, GAME_WIDTH, GAME_HEIGHT, this.getAtmosphereOptions());
    this.raycastRenderer.renderBillboards(this.player, this.createLevelBillboards(), GAME_WIDTH, GAME_HEIGHT);
    this.raycastRenderer.renderEnemies(this.player, this.enemies, GAME_WIDTH, GAME_HEIGHT, this.time.now);
    this.raycastRenderer.renderEnemyProjectiles(this.player, this.enemyProjectiles, GAME_WIDTH, GAME_HEIGHT);
    this.corruptionVeil.setAlpha(this.getAtmosphereOptions().corruptionAlpha);
    this.weaponText.setText(
      `HP ${this.playerHealth}${this.playerHealth <= 30 ? ' CRITICAL' : ''} | ${this.combat.getWeaponLabel()} | KEY ${this.hasAnyKey() ? 'YES' : 'NO'} | AI ${this.getDirectorLabel()}`
    );
    this.debugText.setText(
      [
        `x ${this.player.x.toFixed(2)} y ${this.player.y.toFixed(2)} angle ${Phaser.Math.RadToDeg(this.player.angle).toFixed(0)}`,
        `vel ${Math.hypot(this.player.velocity.x, this.player.velocity.y).toFixed(2)}`,
        this.getDirectorDebugLine(),
        this.time.now < this.combatMessageUntil
          ? this.lastCombatMessage
          : this.levelComplete
            ? 'Level complete. Press ESC.'
            : this.playerAlive
              ? RAYCAST_ATMOSPHERE.messages.idle
              : 'Down. Press ESC.'
      ].join(' | ')
    );
  }

  private resetRuntimeState(): void {
    this.player = {
      x: RAYCAST_PLAYER_START.x,
      y: RAYCAST_PLAYER_START.y,
      angle: RAYCAST_PLAYER_START.angle,
      velocity: { ...RAYCAST_PLAYER_START.velocity }
    };
    this.playerHealth = 100;
    this.playerAlive = true;
    this.levelComplete = false;
    this.collectedSecrets.clear();
    this.enemiesKilled = 0;
    this.playerStationaryMs = 0;
    this.lastPlayerDamageAt = this.time.now;
    this.lastPlayerPosition = { x: RAYCAST_PLAYER_START.x, y: RAYCAST_PLAYER_START.y };
    this.activeZoneId = null;
    this.directorDebug = null;
    this.directorIntensity = 0;
    this.directorSpawnCounter = 0;
    this.enemyProjectiles = [];
    this.lastCombatMessage = RAYCAST_ATMOSPHERE.messages.intro;
    this.combatMessageUntil = 0;
    this.nextAmbientCueAt = 0;
  }

  private fireWeapon(): void {
    if (!this.playerAlive) return;
    const result = this.combat.fire(this.player, this.enemies, this.map, this.time.now);
    if (!result.fired) return;

    this.flashMuzzle();
    this.audioFeedback.play('shoot');
    if (!result.hitEnemy) {
      this.setCombatMessage('WALL IMPACT');
      return;
    }

    if (result.killed) this.enemiesKilled += 1;
    this.audioFeedback.play(result.killed ? 'death' : 'hit');
    this.crosshair.setColor(result.killed ? '#ff5b6f' : '#ffffff');
    this.time.delayedCall(90, () => this.crosshair.setColor('#fff0c2'));
    this.setCombatMessage(result.killed ? RAYCAST_ATMOSPHERE.messages.kill : 'HOSTILE PROCESS HIT');
  }

  private flashMuzzle(): void {
    this.muzzleFlash.setFillStyle(RAYCAST_ATMOSPHERE.muzzleFlash);
    this.muzzleFlash.setAlpha(0.9);
    this.tweens.killTweensOf(this.muzzleFlash);
    this.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      duration: 85,
      ease: 'Quad.easeOut'
    });
  }

  private setCombatMessage(message: string): void {
    this.lastCombatMessage = message.toUpperCase();
    this.combatMessageUntil = this.time.now + 1100;
    this.systemText.setText(this.lastCombatMessage);
    this.systemText.setAlpha(1);
    this.tweens.killTweensOf(this.systemText);
    this.tweens.add({
      targets: this.systemText,
      alpha: 0.18,
      delay: 650,
      duration: 650,
      ease: 'Quad.easeOut'
    });
  }

  private switchWeapon(slot: number): void {
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
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.lastPlayerDamageAt = this.time.now;
    this.cameras.main.shake(95, 0.003);
    this.flashDamage();
    this.audioFeedback.play('damage');
    this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.damage} -${amount}`);
    if (this.playerHealth === 0) {
      this.playerAlive = false;
      this.setCombatMessage('SIGNAL LOST');
    }
  }

  private updateLevelState(): void {
    this.activeZoneId = findRaycastZoneId(RAYCAST_LEVEL, this.player.x, this.player.y);

    RAYCAST_LEVEL.keys.forEach((key) => {
      if (!this.keySystem.hasKey(key.id) && isNearPoint(this.player.x, this.player.y, key)) {
        this.keySystem.collect(key);
        this.audioFeedback.play('pickup');
        this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.key}: ${key.label}`);
      }
    });

    RAYCAST_LEVEL.doors.forEach((door) => {
      if (!this.doorSystem.isOpen(door.id) && isNearPoint(this.player.x, this.player.y, { ...door, radius: 0.78 })) {
        this.tryOpenDoor(door);
      }
    });

    RAYCAST_LEVEL.triggers.forEach((trigger) => {
      const activated = this.triggerSystem.activateIfEntered(trigger, [{ x: this.player.x, y: this.player.y }]);
      if (!activated) return;

      this.gameDirector.notifyZoneTrigger(trigger.id, this.time.now);
      this.audioFeedback.play('spawn');
      this.pulseCorruption();
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.trigger}: ${trigger.objectiveText}`);
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
      this.collectedSecrets.add(secret.id);
      this.audioFeedback.play('pickup');
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.secret}: ${secret.objectiveText}`);
    });

    RAYCAST_LEVEL.exits.forEach((exit) => {
      if (!isNearPoint(this.player.x, this.player.y, exit)) return;
      this.levelComplete = true;
      this.audioFeedback.play('pickup');
      this.setCombatMessage(`${RAYCAST_ATMOSPHERE.messages.exit}: ${exit.objectiveText}`);
    });
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

  private createLevelBillboards(): Array<{ x: number; y: number; color: number; radius: number }> {
    const keyBillboards = RAYCAST_LEVEL.keys
      .filter((key) => !this.keySystem.hasKey(key.id))
      .map((key) => ({ x: key.x, y: key.y, color: 0x9feee2, radius: key.radius }));
    const secretBillboards = RAYCAST_LEVEL.secrets
      .filter((secret) => !this.collectedSecrets.has(secret.id))
      .map((secret) => ({ x: secret.x, y: secret.y, color: 0xff8a3d, radius: secret.radius }));
    const exitBillboards = RAYCAST_LEVEL.exits.map((exit) => ({ x: exit.x, y: exit.y, color: 0x66ff66, radius: exit.radius }));

    return [...keyBillboards, ...secretBillboards, ...exitBillboards];
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
      spawnPoints: getSafeDirectorSpawnPoints(RAYCAST_LEVEL, this.player, this.activeZoneId)
    });

    this.directorIntensity = decision.intensity;
    this.directorDebug = decision.debug;
    if (decision.spawn) this.spawnDirectorEnemy(decision.spawn);
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

  private getDirectorLabel(): string {
    if (!RAYCAST_LEVEL.director.enabled || !this.directorDebug) return 'off';
    return `${DIRECTOR_STATE_LABELS[this.directorDebug.state]} ${this.directorIntensity}`;
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

  private hasAnyKey(): boolean {
    return RAYCAST_LEVEL.keys.some((key) => this.keySystem.hasKey(key.id));
  }

  private flashDamage(): void {
    this.damageFlash.setAlpha(0.42);
    this.tweens.killTweensOf(this.damageFlash);
    this.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: 210,
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
