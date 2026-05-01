import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { applyDamage } from '../systems/CombatSystem';
import { AudioFeedbackSystem } from '../systems/AudioFeedbackSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import { createControls, type PlayerControls } from '../systems/InputManager';
import { HUDSystem } from '../systems/HUDSystem';
import { selectClosestLivingTarget } from '../systems/TargetSelector';
import { VisualEffectsSystem } from '../systems/VisualEffectsSystem';
import { palette } from '../theme/palette';
import type { GameState } from '../types/game';

export class ArenaScene extends Phaser.Scene {
  private p1!: Player;
  private p2!: Player;
  private p1Controls!: PlayerControls;
  private p2Controls!: PlayerControls;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hud!: HUDSystem;
  private statusOverlay!: Phaser.GameObjects.Container;
  private statusTitle!: Phaser.GameObjects.Text;
  private statusSubtitle!: Phaser.GameObjects.Text;
  private statusStats!: Phaser.GameObjects.Text;
  private audioFeedback!: AudioFeedbackSystem;
  private visualEffects!: VisualEffectsSystem;
  private gameDirector!: GameDirector;
  private gameState: GameState = 'RUNNING';
  private currentWave = 1;
  private enemiesKilled = 0;
  private directorIntensity = 0;
  private lastShotByTeam: Record<string, number> = {};
  private pendingSpawns = 0;

  constructor() {
    super('ArenaScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(palette.background.void);

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

    this.p1 = new Player(this, 180, 280, palette.player.p1, 'P1');
    this.p2 = new Player(this, 760, 280, palette.player.p2, 'P2');
    this.p1Controls = createControls(this, ['A', 'D', 'W', 'S', 'F']);
    this.p2Controls = createControls(this, ['LEFT', 'RIGHT', 'UP', 'DOWN', 'L']);

    this.projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true
    });
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.audioFeedback = new AudioFeedbackSystem();
    this.visualEffects = new VisualEffectsSystem(this);
    this.gameDirector = new GameDirector();

    this.spawnInitialEnemies();
    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    this.handleCollisions();

    this.hud = new HUDSystem(this);
    this.createStatusOverlay();
  }

  update(time: number): void {
    this.updatePlayer(this.p1, this.p1Controls, time);
    this.updatePlayer(this.p2, this.p2Controls, time);
    if (this.gameState === 'RUNNING') {
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
      directorIntensity: this.directorIntensity
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

  private updatePlayer(player: Player, controls: PlayerControls, time: number): void {
    if (!player.alive) return; // dead players cannot move/shoot until restart
    let vx = 0;
    let vy = 0;
    if (controls.left.isDown) vx = -player.speed;
    if (controls.right.isDown) vx = player.speed;
    if (controls.up.isDown) vy = -player.speed;
    if (controls.down.isDown) vy = player.speed;
    player.setVelocity(vx, vy);

    this.handleShooting(player, controls, time);
  }

  private hitPlayer(player: Player, damage: number): void {
    if (!player.alive) return;
    const dead = applyDamage(player, damage);
    this.audioFeedback.play('hit');
    this.visualEffects.triggerCombatShake('PLAYER_HIT');
    if (!dead) player.flashHit();
    if (dead) {
      player.markDefeated();
    }
  }

  private spawnEnemy(spawn: SpawnRequest): void {
    const enemy = new Enemy(this, spawn.x, spawn.y, spawn.kind);
    this.enemies.add(enemy);
  }

  private spawnInitialEnemies(): void {
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
      currentWave: this.currentWave
    });

    this.directorIntensity = decision.intensity;
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

    if (this.countEnemiesAlive() === 0 && this.pendingSpawns === 0 && this.gameDirector.hasExhaustedSpawnBudget()) {
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

  private handleShooting(player: Player, controls: PlayerControls, time: number): void {
    const cooldown = this.lastShotByTeam[player.team] ?? 0;
    if (!controls.shoot.isDown || time - cooldown <= 250) return;

    this.lastShotByTeam[player.team] = time;
    const directionX = player === this.p1 ? 1 : -1;
    const muzzleX = player.x + directionX * 18;
    const bullet = new Projectile(this, muzzleX, player.y, 360 * directionX, 0, player.team);
    this.projectiles.add(bullet);
    this.visualEffects.createMuzzleFlash(muzzleX, player.y, directionX);
    this.audioFeedback.play('shoot');
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
      const distanceToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      const state = enemy.fsm.update(distanceToTarget, enemy.alive);
      if (state === 'CHASE') this.physics.moveToObject(enemy, target, enemy.speed);
      if (state === 'ATTACK') this.handleEnemyAttack(enemy, target, time);
    });
  }

  private handleEnemyAttack(enemy: Enemy, target: Player, time: number): void {
    enemy.setVelocity(0, 0);
    if (time - enemy.lastAttack <= 700) return;
    enemy.lastAttack = time;
    this.hitPlayer(target, enemy.damage);
  }

  private handleCollisions(): void {
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

      const dead = applyDamage(enemy, bullet.damage);
      if (!dead) {
        enemy.flashHit();
        this.audioFeedback.play('hit');
      }
      if (dead) {
        this.audioFeedback.play('death');
        this.visualEffects.triggerCombatShake('ENEMY_DEATH');
        this.visualEffects.createEnemyDeathBurst(enemy);
        enemy.markDefeated();
        this.enemiesKilled += 1;
        if (bullet.ownerTeam === 'P1') this.p1.kills += 1;
        if (bullet.ownerTeam === 'P2') this.p2.kills += 1;
      }
      bullet.destroy();
    });
  }
}