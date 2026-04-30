import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
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

  constructor() { super('ArenaScene'); }

  create(): void {
    this.physics.world.setBounds(0, 0, 960, 540);
    this.p1 = new Player(this, 180, 280, 0x44ddff, 'P1');
    this.p2 = new Player(this, 760, 280, 0x66ff66, 'P2');
    this.p1Controls = createControls(this, ['A', 'D', 'W', 'S', 'F']);
    this.p2Controls = createControls(this, ['LEFT', 'RIGHT', 'UP', 'DOWN', 'L']);

    this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });

    this.spawnEnemy(480, 100);

    this.physics.add.overlap(this.projectiles, [this.p1, this.p2], (_, target) => {
      const bullet = _ as Projectile;
      const player = target as Player;
      if (bullet.ownerTeam === player.team) return;
      this.hitPlayer(player, bullet.damage);
      bullet.destroy();
    });

    this.physics.add.overlap(this.projectiles, this.enemies, (obj, ene) => {
      const bullet = obj as Projectile;
      const enemy = ene as Enemy;
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

    this.hud = new HUDSystem(this);
  }

  update(time: number): void {
    this.updatePlayer(this.p1, this.p1Controls, time);
    this.updatePlayer(this.p2, this.p2Controls, time);

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.alive) return;
      const target = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.p1.x, this.p1.y) <
        Phaser.Math.Distance.Between(enemy.x, enemy.y, this.p2.x, this.p2.y)
        ? this.p1
        : this.p2;
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      const state = enemy.fsm.update(dist, enemy.alive);
      if (state === 'CHASE') this.physics.moveToObject(enemy, target, enemy.speed);
      if (state === 'ATTACK') {
        enemy.setVelocity(0, 0);
        if (time - enemy.lastAttack > 700) {
          enemy.lastAttack = time;
          this.hitPlayer(target, 7);
        }
      }
    });

    this.hud.update(this.p1, this.p2, this.enemiesKilled);
  }

  private updatePlayer(player: Player, controls: PlayerControls, time: number): void {
    if (!player.alive) return;
    let vx = 0; let vy = 0;
    if (controls.left.isDown) vx = -player.speed;
    if (controls.right.isDown) vx = player.speed;
    if (controls.up.isDown) vy = -player.speed;
    if (controls.down.isDown) vy = player.speed;
    player.setVelocity(vx, vy);

    const cooldown = (player as any).lastShot ?? 0;
    if (controls.shoot.isDown && time - cooldown > 250) {
      (player as any).lastShot = time;
      const dirX = player === this.p1 ? 1 : -1;
      const bullet = new Projectile(this, player.x + dirX * 18, player.y, 360 * dirX, 0, player.team);
      this.projectiles.add(bullet);
    }
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
}
