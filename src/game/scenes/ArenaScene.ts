import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { applyDamage } from '../systems/CombatSystem';
import { createControls, type PlayerControls } from '../systems/InputManager';
import { HUDSystem } from '../systems/HUDSystem';

export class ArenaScene extends Phaser.Scene {
  private p1!: Player;
  private p2!: Player;
  private p1Controls!: PlayerControls;
  private p2Controls!: PlayerControls;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hud!: HUDSystem;
  private enemiesKilled = 0;
  private lastShotByTeam: Record<string, number> = {};

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

    this.spawnInitialEnemies();
    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    this.handleCollisions();

    this.hud = new HUDSystem(this);
  }

  update(time: number): void {
    this.updatePlayer(this.p1, this.p1Controls, time);
    this.updatePlayer(this.p2, this.p2Controls, time);
    this.updateEnemies(time);
    // GameDirector hook: central game flow updates would be called here.

    this.hud.update(this.p1, this.p2, this.enemiesKilled);
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
    if (dead) {
      player.setTint(0x666666);
      player.setVelocity(0, 0);
    }
  }

  private spawnEnemy(x: number, y: number): void {
    const enemy = new Enemy(this, x, y);
    this.enemies.add(enemy);
  }

  private spawnInitialEnemies(): void {
    // GameDirector hook: future spawn plans can orchestrate this scene from here.
    this.spawnEnemy(480, 100);
  }

  private handleShooting(player: Player, controls: PlayerControls, time: number): void {
    const cooldown = this.lastShotByTeam[player.team] ?? 0;
    if (!controls.shoot.isDown || time - cooldown <= 250) return;

    this.lastShotByTeam[player.team] = time;
    const directionX = player === this.p1 ? 1 : -1;
    const bullet = new Projectile(this, player.x + directionX * 18, player.y, 360 * directionX, 0, player.team);
    this.projectiles.add(bullet);
  }

  private updateEnemies(time: number): void {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.alive) return;

      const target = this.getClosestPlayer(enemy);
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
    this.hitPlayer(target, 7);
  }

  private getClosestPlayer(enemy: Enemy): Player {
    const distanceToP1 = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.p1.x, this.p1.y);
    const distanceToP2 = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.p2.x, this.p2.y);
    return distanceToP1 < distanceToP2 ? this.p1 : this.p2;
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
      if (dead) {
        enemy.setVisible(false);
        enemy.disableBody(true, true);
        this.enemiesKilled += 1;
        if (bullet.ownerTeam === 'P1') this.p1.kills += 1;
        if (bullet.ownerTeam === 'P2') this.p2.kills += 1;
      }
      bullet.destroy();
    });
  }
}