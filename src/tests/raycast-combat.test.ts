import { describe, expect, it } from 'vitest';
import { RaycastCombatSystem, findEnemyInCrosshair, normalizeAngle } from '../game/raycast/RaycastCombatSystem';
import type { RaycastEnemy } from '../game/raycast/RaycastEnemy';
import { RAYCAST_MAP } from '../game/raycast/RaycastMap';
import type { RaycastPlayerState } from '../game/raycast/RaycastPlayerController';

const createEnemy = (overrides: Partial<RaycastEnemy> = {}): RaycastEnemy => ({
  id: 'test-enemy',
  kind: 'GRUNT',
  x: 3,
  y: 2,
  health: 13,
  alive: true,
  radius: 0.3,
  color: 0xff4f5f,
  lastAttack: Number.NEGATIVE_INFINITY,
  hitFlashUntil: 0,
  ...overrides
});

const player: RaycastPlayerState = {
  x: 2.4,
  y: 9.4,
  angle: 0,
  velocity: { x: 0, y: 0 }
};

describe('raycast combat', () => {
  it('normalizes angles around the -PI to PI range', () => {
    expect(normalizeAngle(Math.PI * 2)).toBeCloseTo(0);
    expect(normalizeAngle(-Math.PI * 2)).toBeCloseTo(0);
  });

  it('finds the closest living enemy in the crosshair', () => {
    const closeEnemy = createEnemy({ id: 'close', x: 2.8, y: 9.4 });
    const farEnemy = createEnemy({ id: 'far', x: 4, y: 9.4 });

    expect(findEnemyInCrosshair(player, [farEnemy, closeEnemy], 10)?.id).toBe('close');
  });

  it('ignores enemies behind walls or outside aim tolerance', () => {
    const offAngleEnemy = createEnemy({ x: 3, y: 3 });

    expect(findEnemyInCrosshair(player, [offAngleEnemy], 10)).toBeNull();
    expect(findEnemyInCrosshair(player, [createEnemy({ x: 3 })], 0.5)).toBeNull();
  });

  it('fires through WeaponSystem cooldown and damages enemies', () => {
    const combat = new RaycastCombatSystem();
    const enemy = createEnemy({ health: 13, x: 2.8, y: 9.4 });
    const firstShot = combat.fire(player, [enemy], RAYCAST_MAP, 1000);
    const secondShot = combat.fire(player, [enemy], RAYCAST_MAP, 1050);

    expect(firstShot.fired).toBe(true);
    expect(firstShot.hitEnemy?.id).toBe(enemy.id);
    expect(firstShot.killed).toBe(true);
    expect(enemy.alive).toBe(false);
    expect(secondShot.fired).toBe(false);
  });
});
