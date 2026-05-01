import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { applyDamage } from '../systems/CombatSystem';
import { AudioFeedbackSystem } from '../systems/AudioFeedbackSystem';
import { decideEnemyBehavior, getDirection } from '../systems/EnemyBehaviorSystem';
import { canEnemyAttack, createEnemyProjectile, markEnemyAttack } from '../systems/EnemyAttackSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import { getEnemyConfig } from '../entities/enemyConfig';
import { createControls } from '../systems/InputManager';
import { HUDSystem } from '../systems/HUDSystem';
import { DARK_FOUNDRY_LAYOUT, type KeyPickup, type LockedDoor, type SecretPickup } from '../level/arenaLayout';
import { DoorSystem } from '../systems/DoorSystem';
import { KeySystem } from '../systems/KeySystem';
import { LevelSystem } from '../systems/LevelSystem';
import { PlayerController } from '../systems/PlayerController';
import { PlayerWeaponController } from '../systems/PlayerWeaponController';
import { selectClosestLivingTarget } from '../systems/TargetSelector';
import { TriggerSystem } from '../systems/TriggerSystem';
import { VisualEffectsSystem } from '../systems/VisualEffectsSystem';
import { palette } from '../theme/palette';
import type { GameState } from '../types/game';
import type { DirectorDebugInfo } from '../systems/DirectorState';
import type { ProjectileSpawn } from '../systems/WeaponTypes';

export class ArenaScene extends Phaser.Scene {
  private p1!: Player;
  private p2!: Player;
  private p1Controller!: PlayerController;
  private p2Controller!: PlayerController;
  private p1Weapons!: PlayerWeaponController;
  private p2Weapons!: PlayerWeaponController;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private levelWalls!: Phaser.Physics.Arcade.StaticGroup;
  private lockedDoors!: Phaser.Physics.Arcade.StaticGroup;
  private keyZones = new Map<string, Phaser.GameObjects.Zone>();
  private keyGlyphs = new Map<string, Phaser.GameObjects.Arc>();
  private doorGlyphs = new Map<string, Phaser.GameObjects.Rectangle>();
  private triggerGlyphs = new Map<string, Phaser.GameObjects.Rectangle>();
  private secretZones = new Map<string, Phaser.GameObjects.Zone>();
  private secretGlyphs = new Map<string, Phaser.GameObjects.Arc>();
  private objectiveText!: Phaser.GameObjects.Text;
  private hud!: HUDSystem;
  private statusOverlay!: Phaser.GameObjects.Container;
  private statusTitle!: Phaser.GameObjects.Text;
  private statusSubtitle!: Phaser.GameObjects.Text;
  private statusStats!: Phaser.GameObjects.Text;
  private audioFeedback!: AudioFeedbackSystem;
  private visualEffects!: VisualEffectsSystem;
  private gameDirector!: GameDirector;
  private levelSystem!: LevelSystem;
  private keySystem!: KeySystem;
  private doorSystem!: DoorSystem;
  private triggerSystem!: TriggerSystem;
  private gameState: GameState = 'RUNNING';
  private currentWave = 1;
  private enemiesKilled = 0;
  private directorIntensity = 0;
  private directorDebug: DirectorDebugInfo | null = null;
  private pendingSpawns = 0;
  private lastDoorFeedbackAt = 0;
  private lastPlayerDamageAt = 0;
  private playerStationaryMs = 0;
  private activeZoneId: string | null = null;

  constructor() {
    super('ArenaScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(palette.background.void);
    this.levelSystem = new LevelSystem(DARK_FOUNDRY_LAYOUT);
    this.keySystem = new KeySystem();
    this.doorSystem = new DoorSystem(this.keySystem);
    this.triggerSystem = new TriggerSystem();

    const baseLayer = this.add.rectangle(
      GAME_WIDTH * 0.5,
      GAME_HEIGHT * 0.5,
      GAME_WIDTH,
      GAME_HEIGHT,
      palette.background.base
    );
    baseLayer.setDepth(-30);

    const centerGlow = this.add.rectangle(
      GAME_WIDTH * 0.5,
      GAME_HEIGHT * 0.5,
      GAME_WIDTH * 0.8,
      GAME_HEIGHT * 0.72,
      palette.background.glow
    );
    centerGlow.setAlpha(0.38);
    centerGlow.setDepth(-29);

    const topShade = this.add.rectangle(GAME_WIDTH * 0.5, 36, GAME_WIDTH, 72, palette.background.shade);
    topShade.setAlpha(0.28);
    topShade.setDepth(-28);

    const frameOuter = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH - 8, GAME_HEIGHT - 8);
    frameOuter.setStrokeStyle(6, palette.accent.steel, 0.82);
    frameOuter.setDepth(-27);

    const frameInner = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH - 28, GAME_HEIGHT - 28);
    frameInner.setStrokeStyle(2, palette.accent.infernal, 0.82);
    frameInner.setDepth(-26);
    this.createArenaDecoration();
    this.createLevelGeometry();

    this.p1 = new Player(
      this,
      DARK_FOUNDRY_LAYOUT.playerSpawns.p1.x,
      DARK_FOUNDRY_LAYOUT.playerSpawns.p1.y,
      palette.player.p1,
      'P1'
    );
    this.p2 = new Player(
      this,
      DARK_FOUNDRY_LAYOUT.playerSpawns.p2.x,
      DARK_FOUNDRY_LAYOUT.playerSpawns.p2.y,
      palette.player.p2,
      'P2'
    );
    this.p1Controller = new PlayerController(this.p1, createControls(this, ['A', 'D', 'W', 'S', 'F']), {
      initialAim: { x: 1, y: 0 }
    });
    this.p2Controller = new PlayerController(this.p2, createControls(this, ['LEFT', 'RIGHT', 'UP', 'DOWN', 'L']), {
      initialAim: { x: -1, y: 0 }
    });
    this.p1Weapons = new PlayerWeaponController();
    this.p2Weapons = new PlayerWeaponController();

    this.projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true
    });
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.audioFeedback = new AudioFeedbackSystem();
    this.visualEffects = new VisualEffectsSystem(this);
    this.gameDirector = new GameDirector({
      maxEnemiesAlive: 5,
      maxTotalSpawns: 14,
      spawnCooldownMs: 3300,
      openingSpawnCount: 3,
      spawnPoints: this.levelSystem.getDirectorSpawnPoints()
    });

    this.spawnInitialEnemies();
    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    this.handleCollisions();

    this.hud = new HUDSystem(this);
    this.createStatusOverlay();
  }

  update(time: number, delta: number): void {
    this.updatePlayer(this.p1, this.p1Controller, time, delta);
    this.updatePlayer(this.p2, this.p2Controller, time, delta);
    this.updatePlayerPressureTimer(delta);
    if (this.gameState === 'RUNNING') {
      this.updateLevelObjectives();
      this.updateEnemies(time);
      this.updateGameDirector(time);
      this.updateGameState();
    }

    this.hud.update({
      p1: this.p1,
      p2: this.p2,
      enemiesAlive: this.countEnemiesAlive() + this.pendingSpawns,
      enemiesKilled: this.enemiesKilled,
      gameState: this.gameState,
      directorIntensity: this.directorIntensity,
      directorDebug: this.directorDebug,
      p1Weapon: this.p1Weapons.getCurrentWeaponLabel(),
      p2Weapon: this.p2Weapons.getCurrentWeaponLabel()
    });
  }

  private createStatusOverlay(): void {
    const panel = this.add.rectangle(0, 0, 430, 172, palette.background.panel, 0.82);
    panel.setStrokeStyle(2, palette.accent.infernal, 0.86);

    this.statusTitle = this.add.text(0, -48, '', {
      fontSize: '44px',
      fontStyle: '700',
      color: palette.background.panelText,
      stroke: palette.background.panelStroke,
      strokeThickness: 5
    });
    this.statusTitle.setOrigin(0.5);

    this.statusSubtitle = this.add.text(0, 12, 'Press R to restart', {
      fontSize: '18px',
      fontStyle: '700',
      color: palette.accent.warmText,
      stroke: palette.background.panelStroke,
      strokeThickness: 3
    });
    this.statusSubtitle.setOrigin(0.5);

    this.statusStats = this.add.text(0, 50, '', {
      fontSize: '15px',
      fontStyle: '700',
      color: palette.accent.terminalText,
      stroke: palette.background.panelStroke,
      strokeThickness: 3
    });
    this.statusStats.setOrigin(0.5);

    this.statusOverlay = this.add.container(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, [
      panel,
      this.statusTitle,
      this.statusSubtitle,
      this.statusStats
    ]);
    this.statusOverlay.setDepth(30);
    this.statusOverlay.setVisible(false);
  }

  private createArenaDecoration(): void {
    const circuitLines: Array<[number, number, number, number, number]> = [
      [80, 118, 210, 118, palette.arena.circuitBlue],
      [210, 118, 210, 178, palette.arena.circuitBlue],
      [710, 420, 860, 420, palette.arena.circuitBlue],
      [710, 360, 710, 420, palette.arena.circuitBlue],
      [96, 420, 250, 420, palette.arena.circuitRed],
      [250, 360, 250, 420, palette.arena.circuitRed],
      [720, 120, 860, 120, palette.arena.terminalGreen],
      [720, 120, 720, 176, palette.arena.terminalGreen]
    ];

    circuitLines.forEach(([x1, y1, x2, y2, color]) => {
      const line = this.add.line(0, 0, x1, y1, x2, y2, color, 0.34);
      line.setOrigin(0, 0);
      line.setDepth(-25);
    });

    [
      { x: 118, y: 118 },
      { x: 842, y: 118 },
      { x: 118, y: 422 },
      { x: 842, y: 422 }
    ].forEach(({ x, y }) => {
      const column = this.add.rectangle(x, y, 28, 42, palette.arena.columnFill, 0.55);
      column.setStrokeStyle(1, palette.arena.columnStroke, 0.38);
      column.setDepth(-24);
    });

    [
      { x: 480, y: 270, color: palette.arena.runeRed },
      { x: 480, y: 100, color: palette.arena.runeGreen },
      { x: 480, y: 440, color: palette.arena.runeGreen }
    ].forEach(({ x, y, color }) => {
      const mark = this.add.rectangle(x, y, 74, 2, color, 0.34);
      const cross = this.add.rectangle(x, y, 2, 34, color, 0.28);
      mark.setDepth(-24);
      cross.setDepth(-24);
    });
  }

  private createLevelGeometry(): void {
    this.levelWalls = this.physics.add.staticGroup();
    this.lockedDoors = this.physics.add.staticGroup();

    DARK_FOUNDRY_LAYOUT.walls.forEach((wall) => {
      const wallShape = this.add.rectangle(wall.x, wall.y, wall.width, wall.height, palette.background.panel, 0.88);
      wallShape.setStrokeStyle(2, palette.accent.steel, 0.5);
      wallShape.setDepth(-8);
      this.physics.add.existing(wallShape, true);
      this.levelWalls.add(wallShape);
    });

    DARK_FOUNDRY_LAYOUT.doors.forEach((door) => {
      const doorGlyph = this.add.rectangle(door.x, door.y, door.width, door.height, palette.accent.infernal, 0.84);
      doorGlyph.setStrokeStyle(2, palette.accent.ember, 0.8);
      doorGlyph.setData('doorId', door.id);
      doorGlyph.setDepth(-6);
      this.physics.add.existing(doorGlyph, true);
      this.lockedDoors.add(doorGlyph);
      this.doorGlyphs.set(door.id, doorGlyph);
    });

    DARK_FOUNDRY_LAYOUT.triggers.forEach((trigger) => {
      const triggerGlyph = this.add.rectangle(trigger.x, trigger.y, trigger.width, trigger.height, palette.arena.runeRed, 0.16);
      triggerGlyph.setStrokeStyle(1, palette.accent.infernal, 0.38);
      triggerGlyph.setDepth(-10);
      this.triggerGlyphs.set(trigger.id, triggerGlyph);
    });

    DARK_FOUNDRY_LAYOUT.keys.forEach((key) => {
      const keyGlyph = this.add.circle(key.x, key.y, key.radius, 0x9feee2, 0.72);
      keyGlyph.setStrokeStyle(2, palette.accent.projectile, 0.85);
      keyGlyph.setDepth(-5);
      this.keyGlyphs.set(key.id, keyGlyph);

      const keyZone = this.add.zone(key.x, key.y, key.radius * 2, key.radius * 2);
      keyZone.setData('keyId', key.id);
      this.physics.add.existing(keyZone, true);
      this.keyZones.set(key.id, keyZone);
    });

    DARK_FOUNDRY_LAYOUT.secrets.forEach((secret) => {
      const secretGlyph = this.add.circle(secret.x, secret.y, secret.radius, palette.accent.ember, 0.2);
      secretGlyph.setStrokeStyle(1, palette.accent.ember, 0.35);
      secretGlyph.setDepth(-11);
      this.secretGlyphs.set(secret.id, secretGlyph);

      const secretZone = this.add.zone(secret.x, secret.y, secret.radius * 2, secret.radius * 2);
      secretZone.setData('secretId', secret.id);
      this.physics.add.existing(secretZone, true);
      this.secretZones.set(secret.id, secretZone);
    });

    this.objectiveText = this.add.text(18, GAME_HEIGHT - 36, this.levelSystem.getOpeningObjective(), {
      fontSize: '15px',
      fontStyle: '700',
      color: palette.accent.warmText,
      stroke: palette.background.panelStroke,
      strokeThickness: 3
    });
    this.objectiveText.setDepth(20);
  }

  private updatePlayer(player: Player, controller: PlayerController, time: number, delta: number): void {
    if (!player.alive) return; // dead players cannot move/shoot until restart
    controller.update(delta);
    this.handleShooting(player, controller, player.team === 'P1' ? this.p1Weapons : this.p2Weapons, time);
  }

  private updateLevelObjectives(): void {
    const livingPlayers = [this.p1, this.p2].filter((player) => player.alive);
    DARK_FOUNDRY_LAYOUT.triggers.forEach((trigger) => {
      const activated = this.triggerSystem.activateIfEntered(trigger, livingPlayers, {
        isDoorOpen: (doorId) => this.doorSystem.isOpen(doorId)
      });
      if (!activated) return;

      this.triggerGlyphs.get(trigger.id)?.setFillStyle(palette.accent.infernal, 0.34);
      this.objectiveText.setText(trigger.objectiveText);
      this.visualEffects.triggerCombatShake('ENEMY_DEATH');
      this.activeZoneId = trigger.id;
      this.gameDirector.notifyZoneTrigger(trigger.id, this.time.now);
      trigger.spawns.forEach((spawn) => this.telegraphEnemySpawn(spawn));
    });
  }

  private updatePlayerPressureTimer(delta: number): void {
    const livingPlayers = [this.p1, this.p2].filter((player) => player.alive);
    const hasStationaryPlayer = livingPlayers.some((player) => {
      const body = player.body as Phaser.Physics.Arcade.Body;
      return Math.hypot(body.velocity.x, body.velocity.y) <= 18;
    });

    this.playerStationaryMs = hasStationaryPlayer ? this.playerStationaryMs + delta : 0;
  }

  private collectKey(player: Player, key: KeyPickup): void {
    if (!player.alive || !this.keySystem.collect(key)) return;
    this.keyGlyphs.get(key.id)?.setVisible(false);
    const zone = this.keyZones.get(key.id);
    if (zone?.body) (zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    zone?.setActive(false);
    this.audioFeedback.play('hit');
    this.objectiveText.setText(`Objective: return to ${DARK_FOUNDRY_LAYOUT.exitDoor.id} and open the gate`);
  }

  private collectSecret(player: Player, secret: SecretPickup): void {
    if (!player.alive) return;
    const zone = this.secretZones.get(secret.id);
    if (!zone?.active) return;

    this.secretGlyphs.get(secret.id)?.setVisible(false);
    if (zone.body) (zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    zone.setActive(false);
    this.objectiveText.setText(secret.objectiveText);
    this.audioFeedback.play('hit');
  }

  private tryOpenDoor(door: LockedDoor): void {
    const result = this.doorSystem.attemptOpen(door, this.enemiesKilled);
    if (result.reason === 'MISSING_KEY') {
      this.objectiveText.setText(door.lockedObjectiveText);
      if (this.time.now - this.lastDoorFeedbackAt > 450) {
        this.lastDoorFeedbackAt = this.time.now;
        this.visualEffects.createImpactSpark(door.x, door.y, palette.accent.infernal);
      }
      return;
    }
    if (result.reason === 'MISSING_KILLS') {
      this.objectiveText.setText(`Gate sealed: kill ${door.killsRequired} enemies first`);
      return;
    }
    if (!result.opened) return;

    const doorGlyph = this.doorGlyphs.get(door.id);
    doorGlyph?.setVisible(false);
    if (doorGlyph?.body) (doorGlyph.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.objectiveText.setText(door.openObjectiveText);
    this.audioFeedback.play('death');
  }

  private hitPlayer(player: Player, damage: number): void {
    if (!player.alive) return;
    const dead = applyDamage(player, damage);
    this.lastPlayerDamageAt = this.time.now;
    this.audioFeedback.play('hit');
    this.visualEffects.triggerCombatShake('PLAYER_HIT');
    if (!dead) player.flashHit();
    if (dead) {
      player.markDefeated();
    }
  }

  private damageEnemy(enemy: Enemy, damage: number, ownerTeam: Projectile['ownerTeam']): void {
    if (!enemy.alive) return;

    const dead = applyDamage(enemy, damage);
    this.visualEffects.createImpactSpark(enemy.x, enemy.y);
    if (!dead) {
      enemy.flashHit();
      this.audioFeedback.play('hit');
      return;
    }

    this.audioFeedback.play('death');
    this.visualEffects.triggerCombatShake('ENEMY_DEATH');
    this.visualEffects.createEnemyDeathBurst(enemy);
    enemy.markDefeated();
    this.enemiesKilled += 1;
    if (ownerTeam === 'P1') this.p1.kills += 1;
    if (ownerTeam === 'P2') this.p2.kills += 1;
  }

  private spawnEnemy(spawn: SpawnRequest): void {
    const enemy = new Enemy(this, spawn.x, spawn.y, spawn.kind);
    this.enemies.add(enemy);
  }

  private spawnInitialEnemies(): void {
    DARK_FOUNDRY_LAYOUT.initialSpawns.forEach((spawn) => this.spawnEnemy(spawn));
    this.gameDirector.createOpeningSpawns().forEach((spawn) => this.spawnEnemy(spawn));
  }

  private updateGameDirector(time: number): void {
    const decision = this.gameDirector.update({
      elapsedTime: time,
      totalKills: this.enemiesKilled,
      enemiesAlive: this.countEnemiesAlive() + this.pendingSpawns,
      p1Health: this.p1.health,
      p2Health: this.p2.health,
      p1Alive: this.p1.alive,
      p2Alive: this.p2.alive,
      currentWave: this.currentWave,
      timeSincePlayerDamagedMs: Math.max(0, time - this.lastPlayerDamageAt),
      playerStationaryMs: this.playerStationaryMs,
      equippedWeapons: [this.p1Weapons.getCurrentWeapon(), this.p2Weapons.getCurrentWeapon()],
      activeZoneId: this.activeZoneId,
      activatedTriggerCount: DARK_FOUNDRY_LAYOUT.triggers.filter((trigger) => this.triggerSystem.hasActivated(trigger.id)).length
    });

    this.directorIntensity = decision.intensity;
    this.directorDebug = decision.debug;
    if (decision.spawn) this.telegraphEnemySpawn(decision.spawn);
  }

  private countEnemiesAlive(): number {
    return this.enemies.getChildren().filter((child) => (child as Enemy).alive).length;
  }

  private updateGameState(): void {
    if (!this.p1.alive && !this.p2.alive) {
      this.setGameState('GAME_OVER');
      return;
    }

    if (
      this.doorSystem.isOpen(DARK_FOUNDRY_LAYOUT.exitDoor.id) &&
      this.countEnemiesAlive() === 0 &&
      this.pendingSpawns === 0 &&
      this.gameDirector.hasExhaustedSpawnBudget()
    ) {
      this.setGameState('ROUND_CLEAR');
    }
  }

  private setGameState(state: GameState): void {
    if (this.gameState === state) return;
    this.gameState = state;
    if (state === 'RUNNING') {
      this.statusOverlay.setVisible(false);
      return;
    }

    this.statusTitle.setText(state === 'GAME_OVER' ? 'GAME OVER' : 'ROUND CLEAR');
    this.statusStats.setText(`Final Kills  P1: ${this.p1.kills}  P2: ${this.p2.kills}`);
    this.statusOverlay.setVisible(true);
  }

  private handleShooting(
    player: Player,
    controller: PlayerController,
    weaponController: PlayerWeaponController,
    time: number
  ): void {
    const controls = controller.getControls();
    const result = weaponController.tryFire({
      ownerTeam: player.team,
      origin: { x: player.x, y: player.y },
      aimDirection: controller.getAimDirection(),
      controls,
      time
    });

    if (!result) return;

    result.projectiles.forEach((spawn) => this.spawnProjectile(spawn));
    const firstProjectile = result.projectiles[0];
    this.visualEffects.createMuzzleFlash(firstProjectile.x, firstProjectile.y, firstProjectile.vx >= 0 ? 1 : -1, {
      color: result.weapon.projectileTint,
      width: result.weapon.kind === 'SHOTGUN' ? 24 : 14,
      height: result.weapon.kind === 'LAUNCHER' ? 14 : 8
    });
    this.audioFeedback.play('shoot');
  }

  private spawnProjectile(spawn: ProjectileSpawn): void {
    const bullet = new Projectile(this, spawn.x, spawn.y, spawn.vx, spawn.vy, {
      ownerTeam: spawn.ownerTeam,
      damage: spawn.damage,
      lifetimeMs: spawn.lifetimeMs,
      width: spawn.width,
      height: spawn.height,
      tint: spawn.tint,
      explosionRadius: spawn.explosionRadius,
      weaponKind: spawn.weaponKind
    });
    this.projectiles.add(bullet);
  }

  private resolveProjectileImpact(bullet: Projectile, directEnemy?: Enemy): void {
    if (bullet.explosionRadius > 0) {
      this.explodeProjectile(bullet);
      return;
    }

    if (directEnemy) this.damageEnemy(directEnemy, bullet.damage, bullet.ownerTeam);
    else this.visualEffects.createImpactSpark(bullet.x, bullet.y, bullet.tintTopLeft);
    bullet.destroy();
  }

  private explodeProjectile(bullet: Projectile): void {
    this.visualEffects.createExplosion(bullet.x, bullet.y, bullet.explosionRadius);
    this.visualEffects.triggerCombatShake('ENEMY_DEATH');

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.alive) return;

      const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
      if (distance > bullet.explosionRadius) return;

      const falloff = 1 - distance / bullet.explosionRadius;
      const damage = Math.max(Math.round(bullet.damage * (0.55 + falloff * 0.45)), Math.ceil(bullet.damage * 0.45));
      this.damageEnemy(enemy, damage, bullet.ownerTeam);
    });

    bullet.destroy();
  }

  private telegraphEnemySpawn(spawn: SpawnRequest): void {
    this.pendingSpawns += 1;

    this.visualEffects.telegraphEnemySpawn(spawn, () => {
      this.pendingSpawns = Math.max(0, this.pendingSpawns - 1);
      if (this.gameState === 'RUNNING') {
        this.spawnEnemy(spawn);
        this.audioFeedback.play('spawn');
      }
    });
  }

  private updateEnemies(time: number): void {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.alive) return;

      const target = selectClosestLivingTarget(enemy, [this.p1, this.p2]);
      if (!target) {
        enemy.setVelocity(0, 0);
        return;
      }
      const config = getEnemyConfig(enemy.kind);
      const distanceToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      enemy.fsm.update(distanceToTarget, enemy.alive, config.attackRange);
      const decision = decideEnemyBehavior({
        distanceToTarget,
        enemyAlive: enemy.alive,
        targetAlive: target.alive,
        config
      });

      if (decision.action === 'IDLE') {
        enemy.setVelocity(0, 0);
      }

      if (decision.action === 'CHASE') {
        this.physics.moveToObject(enemy, target, enemy.speed * decision.speedMultiplier);
      }

      if (decision.action === 'RETREAT') {
        const direction = getDirection(target, enemy);
        enemy.setVelocity(direction.x * enemy.speed * decision.speedMultiplier, direction.y * enemy.speed * decision.speedMultiplier);
      }

      if (decision.action === 'MELEE_ATTACK') this.handleEnemyMeleeAttack(enemy, target, time);
      if (decision.action === 'RANGED_ATTACK') this.handleEnemyRangedAttack(enemy, target, time);
    });
  }

  private handleEnemyMeleeAttack(enemy: Enemy, target: Player, time: number): void {
    enemy.setVelocity(0, 0);
    if (!canEnemyAttack(enemy, target, time)) return;
    markEnemyAttack(enemy, time);
    this.hitPlayer(target, enemy.damage);
  }

  private handleEnemyRangedAttack(enemy: Enemy, target: Player, time: number): void {
    enemy.setVelocity(0, 0);
    if (!canEnemyAttack(enemy, target, time)) return;
    markEnemyAttack(enemy, time);
    this.spawnProjectile(createEnemyProjectile(enemy, target));
    this.visualEffects.createMuzzleFlash(enemy.x, enemy.y, target.x >= enemy.x ? 1 : -1, {
      color: getEnemyConfig(enemy.kind).color,
      width: 12,
      height: 7
    });
    this.audioFeedback.play('shoot');
  }

  private handleCollisions(): void {
    this.physics.add.collider(this.p1, this.levelWalls);
    this.physics.add.collider(this.p2, this.levelWalls);
    this.physics.add.collider(this.enemies, this.levelWalls);
    this.physics.add.collider(this.p1, this.lockedDoors, (_player, doorObject) => this.handleDoorContact(doorObject));
    this.physics.add.collider(this.p2, this.lockedDoors, (_player, doorObject) => this.handleDoorContact(doorObject));
    this.physics.add.collider(this.enemies, this.lockedDoors);
    this.physics.add.collider(this.projectiles, this.levelWalls, (obj) =>
      this.resolveProjectileImpact(obj as Projectile)
    );
    this.physics.add.collider(this.projectiles, this.lockedDoors, (obj) =>
      this.resolveProjectileImpact(obj as Projectile)
    );
    DARK_FOUNDRY_LAYOUT.keys.forEach((key) => {
      const zone = this.keyZones.get(key.id);
      if (!zone) return;
      this.physics.add.overlap(this.p1, zone, (_player) => this.collectKey(_player as Player, key));
      this.physics.add.overlap(this.p2, zone, (_player) => this.collectKey(_player as Player, key));
    });

    DARK_FOUNDRY_LAYOUT.secrets.forEach((secret) => {
      const zone = this.secretZones.get(secret.id);
      if (!zone) return;
      this.physics.add.overlap(this.p1, zone, (_player) => this.collectSecret(_player as Player, secret));
      this.physics.add.overlap(this.p2, zone, (_player) => this.collectSecret(_player as Player, secret));
    });

    this.physics.add.overlap(this.projectiles, [this.p1, this.p2], (obj, target) => {
      const bullet = obj as Projectile;
      const player = target as Player;
      if (bullet.ownerTeam === player.team) return;
      this.hitPlayer(player, bullet.damage);
      bullet.destroy();
    });

    this.physics.add.overlap(this.projectiles, this.enemies, (obj, target) => {
      const bullet = obj as Projectile;
      const enemy = target as Enemy;
      if (!enemy.alive) return;
      if (bullet.ownerTeam === 'ENEMY') return;
      this.resolveProjectileImpact(bullet, enemy);
    });
  }

  private handleDoorContact(doorObject: unknown): void {
    const candidate =
      doorObject && typeof doorObject === 'object' && 'gameObject' in doorObject
        ? (doorObject as { gameObject: unknown }).gameObject
        : doorObject;

    if (!candidate || typeof candidate !== 'object' || !('getData' in candidate)) return;
    const doorId = (candidate as { getData: (key: string) => unknown }).getData('doorId') as string | undefined;
    if (!doorId) return;

    const door = this.levelSystem.findDoor(doorId);
    if (door) this.tryOpenDoor(door);
  }
}
