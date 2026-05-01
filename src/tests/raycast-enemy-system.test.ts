import { describe, expect, it } from 'vitest';
import { createRaycastEnemy } from '../game/raycast/RaycastEnemy';
import {
  hasLineOfSight,
  updateRaycastEnemies,
  updateRaycastEnemyProjectiles
} from '../game/raycast/RaycastEnemySystem';
import { RAYCAST_MAP } from '../game/raycast/RaycastMap';

describe('raycast enemy system', () => {
  it('checks line of sight against raycast walls', () => {
    expect(hasLineOfSight(RAYCAST_MAP, { x: 4.4, y: 10.4 }, { x: 4.4, y: 9.4 })).toBe(true);
    expect(hasLineOfSight(RAYCAST_MAP, { x: 4.4, y: 10.4 }, { x: 8, y: 10.4 })).toBe(false);
  });

  it('moves melee enemies toward the player without crossing walls', () => {
    const enemy = createRaycastEnemy({ id: 'grunt', kind: 'GRUNT', x: 4.4, y: 6.5 });
    const startY = enemy.y;

    updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 4.4, y: 10.4, alive: true }, 1000, 250);

    expect(enemy.y).toBeGreaterThan(startY);
  });

  it('applies melee damage with cooldown', () => {
    const enemy = createRaycastEnemy({ id: 'stalker', kind: 'STALKER', x: 4.4, y: 10.08 });

    const first = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 4.4, y: 10.4, alive: true }, 1000, 16);
    const second = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 4.4, y: 10.4, alive: true }, 1100, 16);

    expect(first.meleeDamage).toBeGreaterThan(0);
    expect(second.meleeDamage).toBe(0);
  });

  it('ranged enemies spawn projectiles and projectiles damage player', () => {
    const enemy = createRaycastEnemy({ id: 'ranged', kind: 'RANGED', x: 4.4, y: 7.8 });
    const result = updateRaycastEnemies(RAYCAST_MAP, [enemy], { x: 4.4, y: 10.4, alive: true }, 2000, 16);

    expect(result.spawnedProjectiles).toHaveLength(1);
    const projectile = result.spawnedProjectiles[0];
    const damage = updateRaycastEnemyProjectiles(RAYCAST_MAP, [projectile], { x: 4.4, y: 10.4, alive: true }, 2600, 600);

    expect(damage).toBeGreaterThan(0);
    expect(projectile.alive).toBe(false);
  });
});
