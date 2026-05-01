import { describe, expect, it } from 'vitest';
import { ENEMY_CONFIG } from '../game/entities/enemyConfig';
import { createRaycastEnemy } from '../game/raycast/RaycastEnemy';
import {
  hasLineOfSight,
  type RaycastEnemyProjectile,
  updateRaycastEnemies,
  updateRaycastEnemyProjectiles
} from '../game/raycast/RaycastEnemySystem';
import { RAYCAST_MAP } from '../game/raycast/RaycastMap';
import { collides } from '../game/raycast/RaycastMovement';

describe('raycast enemy system', () => {
  it('checks line of sight against raycast walls', () => {
    expect(hasLineOfSight(RAYCAST_MAP, { x: 1.5, y: 10.5 }, { x: 1.5, y: 7.5 })).toBe(true);
    expect(hasLineOfSight(RAYCAST_MAP, { x: 1.5, y: 10.5 }, { x: 8, y: 10.5 })).toBe(false);
  });

  it('moves melee enemies toward the player without crossing walls', () => {
    const enemy = createRaycastEnemy({ id: 'grunt', kind: 'GRUNT', x: 1.5, y: 7.5 });
    const startY = enemy.y;

    updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.5, alive: true }, 1000, 700);

    expect(enemy.y).toBeGreaterThan(startY);
    expect(collides(RAYCAST_MAP, enemy.x, enemy.y, enemy.radius)).toBe(false);
  });

  it('applies melee damage only after windup completes and then respects cooldown', () => {
    const enemy = createRaycastEnemy({ id: 'stalker', kind: 'STALKER', x: 2.5, y: 10.08 });

    const windup = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 2.5, y: 10.4, alive: true }, 1000, 16);
    const hit = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 2.5, y: 10.4, alive: true }, 1081, 16);
    const second = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 2.5, y: 10.4, alive: true }, 1100, 16);

    expect(windup.meleeDamage).toBe(0);
    expect(hit.meleeDamage).toBeGreaterThan(0);
    expect(second.meleeDamage).toBe(0);
  });

  it('does not apply unfair immediate melee damage at spawn time', () => {
    const enemy = createRaycastEnemy({ id: 'spawn-stalker', kind: 'STALKER', x: 2.5, y: 10.08 });

    const result = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 2.5, y: 10.4, alive: true }, 100, 16);

    expect(result.meleeDamage).toBe(0);
  });

  it('cancels melee damage when the player dodges out of range before windup completes', () => {
    const enemy = createRaycastEnemy({ id: 'dodge-stalker', kind: 'STALKER', x: 2.5, y: 10.08 });

    updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 2.5, y: 10.4, alive: true }, 1000, 16);
    const result = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 3.5, y: 10.4, alive: true }, 1081, 16);

    expect(result.meleeDamage).toBe(0);
  });

  it('does not let dead enemies move or attack', () => {
    const enemy = createRaycastEnemy({ id: 'dead-grunt', kind: 'GRUNT', x: 2.5, y: 10.08 });
    enemy.alive = false;

    const result = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 2.5, y: 10.4, alive: true }, 1000, 250);

    expect(result.meleeDamage).toBe(0);
    expect(enemy.x).toBeCloseTo(2.5);
    expect(enemy.y).toBeCloseTo(10.08);
  });

  it('moves stalkers faster than grunts while keeping them fragile', () => {
    const grunt = createRaycastEnemy({ id: 'grunt', kind: 'GRUNT', x: 1.5, y: 7.5 });
    const stalker = createRaycastEnemy({ id: 'stalker', kind: 'STALKER', x: 1.5, y: 7.5 });

    updateRaycastEnemies(RAYCAST_MAP, [grunt, stalker], { x: 1.5, y: 10.5, alive: true }, 1000, 250);

    expect(stalker.y - 7.5).toBeGreaterThan(grunt.y - 7.5);
    expect(stalker.health).toBeLessThan(grunt.health);
    expect(ENEMY_CONFIG.STALKER.behaviorHint).toBe('MELEE_PRESSURE');
  });

  it('keeps brutes slower and tougher than grunts', () => {
    const grunt = createRaycastEnemy({ id: 'grunt', kind: 'GRUNT', x: 1.5, y: 7.5 });
    const brute = createRaycastEnemy({ id: 'brute', kind: 'BRUTE', x: 1.5, y: 7.5 });

    updateRaycastEnemies(RAYCAST_MAP, [grunt, brute], { x: 1.5, y: 10.5, alive: true }, 1000, 250);

    expect(brute.y - 7.5).toBeLessThan(grunt.y - 7.5);
    expect(brute.health).toBeGreaterThan(grunt.health);
  });

  it('ranged enemies telegraph before spawning projectiles', () => {
    const enemy = createRaycastEnemy({ id: 'ranged', kind: 'RANGED', x: 1.5, y: 7.8 });
    const windup = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2000, 16);
    const early = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2200, 16);
    const result = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2400, 16);

    expect(windup.spawnedProjectiles).toHaveLength(0);
    expect(early.spawnedProjectiles).toHaveLength(0);
    expect(enemy.attackWindupUntil).toBe(0);
    expect(result.spawnedProjectiles).toHaveLength(1);
  });

  it('ranged enemies respect cooldown after windup shot', () => {
    const enemy = createRaycastEnemy({ id: 'ranged', kind: 'RANGED', x: 1.5, y: 7.8 });

    updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2000, 16);
    const shot = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2400, 16);
    const cooldown = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2500, 16);

    expect(shot.spawnedProjectiles).toHaveLength(1);
    expect(cooldown.spawnedProjectiles).toHaveLength(0);
  });

  it('ranged projectiles damage player after clear telegraph', () => {
    const enemy = createRaycastEnemy({ id: 'ranged', kind: 'RANGED', x: 1.5, y: 7.8 });
    updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2000, 16);
    const result = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 1.5, y: 10.4, alive: true }, 2400, 16);
    const projectile = result.spawnedProjectiles[0];
    expect(Math.hypot(projectile.vx, projectile.vy)).toBeCloseTo((ENEMY_CONFIG.RANGED.projectileSpeed ?? 0) / 100);
    const damage = updateRaycastEnemyProjectiles(RAYCAST_MAP, [projectile], { x: 1.5, y: 10.4, alive: true }, 3100, 700);

    expect(damage).toBeGreaterThan(0);
    expect(projectile.alive).toBe(false);
  });

  it('destroys enemy projectiles against walls', () => {
    const projectile: RaycastEnemyProjectile = {
      x: 3.75,
      y: 10.5,
      vx: 2,
      vy: 0,
      damage: 10,
      radius: 0.08,
      alive: true,
      color: ENEMY_CONFIG.RANGED.color,
      createdAt: 1000
    };

    const damage = updateRaycastEnemyProjectiles(RAYCAST_MAP, [projectile], { x: 1.5, y: 10.5, alive: true }, 1100, 200);

    expect(damage).toBe(0);
    expect(projectile.alive).toBe(false);
  });
});
