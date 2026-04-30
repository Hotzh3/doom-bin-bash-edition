import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { applyDamage } from '../systems/CombatSystem';
import { GameDirector, type SpawnRequest } from '../systems/GameDirector';
import { createControls, type PlayerControls } from '../systems/InputManager';
import { HUDSystem } from '../systems/HUDSystem';
import { selectClosestLivingTarget } from '../systems/TargetSelector';
import type { GameState } from '../types/game';

export class ArenaScene extends Phaser.Scene {
  private p1!: Player;
  private p2!: Player;
  private p1Controls!: PlayerControls;
  private p2Controls!: PlayerControls;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hud!: HUDSystem;
  private statusText!: Phaser.GameObjects.Text;
  private gameDirector!: GameDirector;
  private gameState: GameState = 'RUNNING';
  private currentWave = 1;
  private enemiesKilled = 0;
  private lastShotByTeam: Record<string, number> = {};
  private lastCombatShakeAt = 0;
  private pendingSpawns = 0;

  constructor() {
    super('ArenaScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor('#07090f');

    const baseLayer = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT, 0x121722);
    baseLayer.setDepth(-30);

    const centerGlow = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH * 0.8, GAME_HEIGHT * 0.72, 0x1f1320);
    centerGlow.setAlpha(0.38);
    centerGlow.setDepth(-29);

    const topShade = this.add.rectangle(GAME_WIDTH * 0.5, 36, GAME_WIDTH, 72, 0x000000);
    topShade.setAlpha(0.28);
    topShade.setDepth(-28);

    const frameOuter = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH - 8, GAME_HEIGHT - 8);
    frameOuter.setStrokeStyle(6, 0x5c667f, 0.82);
    frameOuter.setDepth(-27);

    const frameInner = this.add.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, GAME_WIDTH - 28, GAME_HEIGHT - 28);
    frameInner.setStrokeStyle(2, 0x9e2f3e, 0.82);
    frameInner.setDepth(-26);

    this.p1 = new Player(this, 180, 280, 0x44ddff, 'P1');
    this.p2 = new Player(this, 760, 280, 0x66ff66, 'P2');
    this.p1Controls = createControls(this, ['A', 'D', 'W', 'S', 'F']);
    this.p2Controls = createControls(this, ['LEFT', 'RIGHT', 'UP', 'DOWN', 'L']);

    this.projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true
    });
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.gameDirector = new GameDirector();

    this.spawnInitialEnemies();
    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    this.handleCollisions();

    this.hud = new HUDSystem(this);
    this.statusText = this.createStatusOverlay();
  }

  update(time: number): void {
    this.updatePlayer(this.p1, this.p1Controls, time);
    this.updatePlayer(this.p2, this.p2Controls, time);
    if (this.gameState === 'RUNNING') {
      this.updateEnemies(time);
      this.updateGameDirector(time);
      this.updateGameState();
    }

    this.hud.update(this.p1, this.p2, this.enemiesKilled);
  }

  private createStatusOverlay(): Phaser.GameObjects.Text {
    const text = this.add.text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, '', {
      fontSize: '44px',
      fontStyle: '700',
      color: '#f7fbff',
      stroke: '#06080c',
      strokeThickness: 5
    });
    text.setOrigin(0.5);
    text.setDepth(30);
    text.setVisible(false);
    return text;
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
    const dead = applyDamage(player, damage);
    this.triggerCombatShake('PLAYER_HIT');
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
    this.statusText.setText(state === 'GAME_OVER' ? 'GAME OVER' : 'ROUND CLEAR');
    this.statusText.setVisible(state !== 'RUNNING');
  }

  private handleShooting(player: Player, controls: PlayerControls, time: number): void {
    const cooldown = this.lastShotByTeam[player.team] ?? 0;
    if (!controls.shoot.isDown || time - cooldown <= 250) return;

    this.lastShotByTeam[player.team] = time;
    const directionX = player === this.p1 ? 1 : -1;
    const muzzleX = player.x + directionX * 18;
    const bullet = new Projectile(this, muzzleX, player.y, 360 * directionX, 0, player.team);
    this.projectiles.add(bullet);
    this.createMuzzleFlash(muzzleX, player.y, directionX);
  }

  private createMuzzleFlash(x: number, y: number, directionX: number): void {
    const flash = this.add.rectangle(x + directionX * 8, y, 14, 8, 0xfff29e);
    flash.setAlpha(0.86);
    flash.setDepth(8);
    this.time.delayedCall(45, () => flash.destroy());
  }

  private telegraphEnemySpawn(spawn: SpawnRequest): void {
    this.pendingSpawns += 1;

    const marker = this.add.circle(spawn.x, spawn.y, 18, 0x9e2f3e, 0.18);
    marker.setStrokeStyle(2, 0xff8a3d, 0.9);
    marker.setDepth(7);

    this.tweens.add({
      targets: marker,
      alpha: 0.62,
      scale: 1.35,
      yoyo: true,
      repeat: 2,
      duration: 120,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(720, () => {
      marker.destroy();
      this.pendingSpawns = Math.max(0, this.pendingSpawns - 1);
      if (this.gameState === 'RUNNING') this.spawnEnemy(spawn);
    });
  }

  private triggerCombatShake(kind: 'PLAYER_HIT' | 'ENEMY_DEATH'): void {
    const now = this.time.now;
    if (now - this.lastCombatShakeAt < 120) return;

    this.lastCombatShakeAt = now;
    const duration = kind === 'PLAYER_HIT' ? 90 : 70;
    const intensity = kind === 'PLAYER_HIT' ? 0.0024 : 0.0018;
    this.cameras.main.shake(duration, intensity);
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
      if (!dead) enemy.flashHit();
      if (dead) {
        this.triggerCombatShake('ENEMY_DEATH');
        this.createEnemyDeathBurst(enemy);
        enemy.markDefeated();
        this.enemiesKilled += 1;
        if (bullet.ownerTeam === 'P1') this.p1.kills += 1;
        if (bullet.ownerTeam === 'P2') this.p2.kills += 1;
      }
      bullet.destroy();
    });
  }

  private createEnemyDeathBurst(enemy: Enemy): void {
    const burstColor = this.getEnemyBurstColor(enemy);

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const particle = this.add.circle(enemy.x, enemy.y, 3, burstColor);
      particle.setAlpha(0.88);
      particle.setDepth(9);

      this.tweens.add({
        targets: particle,
        x: enemy.x + Math.cos(angle) * 22,
        y: enemy.y + Math.sin(angle) * 22,
        alpha: 0,
        scale: 0.35,
        duration: 180,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private getEnemyBurstColor(enemy: Enemy): number {
    if (enemy.kind === 'BRUTE') return 0xff8a3d;
    if (enemy.kind === 'STALKER') return 0xc17bff;
    return 0xff4f5f;
  }
}