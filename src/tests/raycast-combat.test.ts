import { describe, expect, it } from 'vitest';
import {
  getRaycastCrosshairTargetInfo,
  RaycastCombatSystem,
  findEnemyInCrosshair,
  normalizeAngle
} from '../game/raycast/RaycastCombatSystem';
import type { RaycastEnemy } from '../game/raycast/RaycastEnemy';
import { RAYCAST_MAP, type RaycastMap } from '../game/raycast/RaycastMap';
import type { RaycastPlayerState } from '../game/raycast/RaycastPlayerController';

const createEnemy = (overrides: Partial<RaycastEnemy> = {}): RaycastEnemy => ({
  id: 'test-enemy',
  kind: 'GRUNT',
  x: 3,
  y: 2,
  health: 13,
  maxHealth: 13,
  alive: true,
  radius: 0.3,
  color: 0xff4f5f,
  lastAttack: Number.NEGATIVE_INFINITY,
  spawnTelegraphStartedAt: 0,
  spawnTelegraphUntil: 0,
  attackWindupStartedAt: 0,
  attackWindupUntil: 0,
  hitFlashUntil: 0,
  deathBurstUntil: 0,
  ...overrides
});

const player: RaycastPlayerState = {
  x: 2.4,
  y: 9.4,
  angle: 0,
  velocity: { x: 0, y: 0 }
};

const wallTestMap: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1]
  ]
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

  it('builds focused target info for the enemy under the crosshair', () => {
    const enemy = createEnemy({ id: 'close', kind: 'RANGED', x: 2.8, y: 9.4, health: 24, maxHealth: 48, attackWindupStartedAt: 980, attackWindupUntil: 1200 });

    expect(getRaycastCrosshairTargetInfo(player, [enemy], 10, 1000)).toEqual({
      id: 'close',
      kindLabel: 'TURRET',
      health: 24,
      maxHealth: 48,
      healthRatio: 0.5,
      isTelegraphing: false,
      isWindingUp: true
    });
  });

  it('auto-aim hits a visible enemy inside forgiving center tolerance', () => {
    const combat = new RaycastCombatSystem();
    const enemy = createEnemy({ health: 14, x: 3.2, y: 9.56 });

    const shot = combat.fire(player, [enemy], RAYCAST_MAP, 1000);

    expect(shot.fired).toBe(true);
    expect(shot.hitEnemy?.id).toBe(enemy.id);
    expect(enemy.alive).toBe(false);
  });

  it('ignores enemies behind walls or outside aim tolerance', () => {
    const offAngleEnemy = createEnemy({ x: 3, y: 3 });

    expect(findEnemyInCrosshair(player, [offAngleEnemy], 10)).toBeNull();
    expect(findEnemyInCrosshair(player, [createEnemy({ x: 3 })], 0.5)).toBeNull();
  });

  it('auto-aim does not hit an enemy behind a wall', () => {
    const combat = new RaycastCombatSystem();
    const blockedPlayer: RaycastPlayerState = { x: 1.5, y: 2.5, angle: 0, velocity: { x: 0, y: 0 } };
    const enemy = createEnemy({ health: 14, x: 3.5, y: 2.5 });

    const shot = combat.fire(blockedPlayer, [enemy], wallTestMap, 1000);

    expect(shot.fired).toBe(true);
    expect(shot.hitEnemy).toBeNull();
    expect(shot.wallHit).toBe(true);
    expect(enemy.alive).toBe(true);
  });

  it('fires through WeaponSystem cooldown and damages enemies', () => {
    const combat = new RaycastCombatSystem();
    const enemy = createEnemy({ health: 14, x: 2.8, y: 9.4 });
    const firstShot = combat.fire(player, [enemy], RAYCAST_MAP, 1000);
    const secondShot = combat.fire(player, [enemy], RAYCAST_MAP, 1050);

    expect(firstShot.fired).toBe(true);
    expect(firstShot.hitEnemy?.id).toBe(enemy.id);
    expect(firstShot.killed).toBe(true);
    expect(enemy.alive).toBe(false);
    expect(secondShot.fired).toBe(false);
  });

  it('applies multiple shotgun pellet hits at close range', () => {
    const combat = new RaycastCombatSystem();
    combat.switchWeaponSlot(2);
    const enemy = createEnemy({ health: 80, x: 2.8, y: 9.4 });

    const shot = combat.fire(player, [enemy], RAYCAST_MAP, 1000);

    expect(shot.fired).toBe(true);
    expect(shot.hitCount).toBeGreaterThan(1);
    expect(shot.totalDamage).toBeGreaterThan(16);
    expect(shot.killed).toBe(true);
  });

  it('shotgun can hit multiple nearby targets inside the cone', () => {
    const combat = new RaycastCombatSystem();
    combat.switchWeaponSlot(2);
    const left = createEnemy({ id: 'left', health: 13, x: 3.1, y: 9.15 });
    const center = createEnemy({ id: 'center', health: 13, x: 3.2, y: 9.4 });
    const right = createEnemy({ id: 'right', health: 13, x: 3.1, y: 9.65 });

    const shot = combat.fire(player, [left, center, right], RAYCAST_MAP, 1000);

    expect(shot.fired).toBe(true);
    expect([left, center, right].filter((enemy) => !enemy.alive)).toHaveLength(3);
    expect(shot.killCount).toBe(3);
  });

  it('applies launcher splash damage around a direct hit', () => {
    const combat = new RaycastCombatSystem();
    combat.switchWeaponSlot(3);
    const direct = createEnemy({ id: 'direct', health: 58, x: 2.8, y: 9.4 });
    const nearby = createEnemy({ id: 'nearby', health: 12, x: 3.1, y: 9.4 });
    const far = createEnemy({ id: 'far', health: 12, x: 4.5, y: 9.4 });

    const shot = combat.fire(player, [direct, nearby, far], RAYCAST_MAP, 1000);

    expect(shot.fired).toBe(true);
    expect(shot.hitEnemy?.id).toBe('direct');
    expect(direct.alive).toBe(false);
    expect(nearby.alive).toBe(false);
    expect(far.alive).toBe(true);
    expect(shot.killCount).toBe(2);
    expect(shot.splashHitCount).toBe(1);
  });
});
