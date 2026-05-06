import { getEnemyConfig } from '../entities/enemyConfig';
import { decideEnemyBehavior, getDirection } from '../systems/EnemyBehaviorSystem';
import type { MovementVector } from '../systems/MovementSystem';
import { castRay, type RaycastMap } from './RaycastMap';
import { collides } from './RaycastMovement';
import { isRaycastEnemyTelegraphing, type RaycastEnemy } from './RaycastEnemy';
import {
  advancePatrolWaypointIndex,
  RAYCAST_ALERT_AFTER_LOSS_MS,
  RAYCAST_ALERT_ARRIVE_EPSILON,
  RAYCAST_PATROL_WAYPOINT_EPSILON
} from './RaycastPatrol';

const GRID_SCALE = 100;
const PROJECTILE_RADIUS = 0.08;
const PROJECTILE_LIFETIME_MS = 1800;
const RANGED_MUZZLE_OFFSET = 0.16;

export interface RaycastEnemyProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  alive: boolean;
  color: number;
  createdAt: number;
}

export interface RaycastEnemyUpdateResult {
  meleeDamage: number;
  spawnedProjectiles: RaycastEnemyProjectile[];
}

export interface RaycastPlayerTarget {
  x: number;
  y: number;
  alive: boolean;
}

export function updateRaycastEnemies(
  map: RaycastMap,
  enemies: RaycastEnemy[],
  player: RaycastPlayerTarget,
  time: number,
  deltaMs: number
): RaycastEnemyUpdateResult {
  let meleeDamage = 0;
  const spawnedProjectiles: RaycastEnemyProjectile[] = [];

  enemies.forEach((enemy) => {
    if (!enemy.alive || !player.alive) return;
    if (isRaycastEnemyTelegraphing(enemy, time)) return;
    if (enemy.spawnTelegraphUntil > 0) {
      enemy.spawnTelegraphStartedAt = 0;
      enemy.spawnTelegraphUntil = 0;
    }

    const config = getEnemyConfig(enemy.kind, 'raycast');
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const hasSight = hasLineOfSight(map, enemy, player);

    if (enemy.kind !== 'RANGED' && enemy.attackWindupUntil > 0) {
      if (time < enemy.attackWindupUntil) return;
      enemy.attackWindupStartedAt = 0;
      enemy.attackWindupUntil = 0;
      if (distance * GRID_SCALE <= config.attackRange && hasSight) {
        enemy.lastAttack = time;
        meleeDamage += config.damage;
      }
      return;
    }

    const decision = decideEnemyBehavior({
      distanceToTarget: distance * GRID_SCALE,
      enemyAlive: enemy.alive,
      targetAlive: player.alive && hasSight,
      config
    });

    if (decision.action !== 'IDLE') {
      enemy.lastKnownPlayerX = player.x;
      enemy.lastKnownPlayerY = player.y;
    }
    if (enemy.wasCombatActiveLastTick && decision.action === 'IDLE') {
      enemy.alertUntilTime = time + RAYCAST_ALERT_AFTER_LOSS_MS;
    }
    enemy.wasCombatActiveLastTick = decision.action !== 'IDLE';

    if (decision.action === 'IDLE') {
      enemy.attackWindupStartedAt = 0;
      enemy.attackWindupUntil = 0;

      if (time < enemy.alertUntilTime) {
        const distLK = Math.hypot(enemy.lastKnownPlayerX - enemy.x, enemy.lastKnownPlayerY - enemy.y);
        if (distLK < RAYCAST_ALERT_ARRIVE_EPSILON) {
          enemy.alertUntilTime = 0;
        } else {
          const alertSpeed = (config.speed / GRID_SCALE) * 0.5;
          moveEnemy(
            map,
            enemy,
            getDirection(enemy, { x: enemy.lastKnownPlayerX, y: enemy.lastKnownPlayerY }),
            alertSpeed,
            deltaMs
          );
        }
        return;
      }

      const patrolSpeed = (config.speed / GRID_SCALE) * 0.38;
      const wps = enemy.patrolWaypoints;
      if (wps.length > 0) {
        const wp = wps[enemy.patrolWaypointIndex];
        moveEnemy(map, enemy, getDirection(enemy, wp), patrolSpeed, deltaMs);
        const reached = Math.hypot(wp.x - enemy.x, wp.y - enemy.y) < RAYCAST_PATROL_WAYPOINT_EPSILON;
        enemy.patrolWaypointIndex = advancePatrolWaypointIndex(enemy.patrolWaypointIndex, wps.length, reached);
      }
      return;
    }

    if (decision.action === 'CHASE') {
      enemy.attackWindupStartedAt = 0;
      enemy.attackWindupUntil = 0;
      moveEnemy(map, enemy, getDirection(enemy, player), (config.speed / GRID_SCALE) * decision.speedMultiplier, deltaMs);
    }

    if (decision.action === 'RETREAT') {
      enemy.attackWindupStartedAt = 0;
      enemy.attackWindupUntil = 0;
      moveEnemy(map, enemy, getDirection(player, enemy), (config.speed / GRID_SCALE) * decision.speedMultiplier, deltaMs);
    }

    if (decision.action === 'MELEE_ATTACK' && canAttack(enemy, time)) {
      enemy.attackWindupStartedAt = time;
      enemy.attackWindupUntil = time + config.attackWindupMs;
      return;
    }

    if (decision.action === 'RANGED_ATTACK') {
      if (!canAttack(enemy, time)) {
        enemy.attackWindupStartedAt = 0;
        enemy.attackWindupUntil = 0;
        return;
      }

      if (enemy.attackWindupUntil === 0) {
        enemy.attackWindupStartedAt = time;
        enemy.attackWindupUntil = time + config.attackWindupMs;
        return;
      }

      if (time >= enemy.attackWindupUntil) {
        enemy.lastAttack = time;
        enemy.attackWindupStartedAt = 0;
        enemy.attackWindupUntil = 0;
        spawnedProjectiles.push(createRaycastEnemyProjectile(enemy, player, time));
      }
    }
  });

  return { meleeDamage, spawnedProjectiles };
}

export function updateRaycastEnemyProjectiles(
  map: RaycastMap,
  projectiles: RaycastEnemyProjectile[],
  player: RaycastPlayerTarget,
  time: number,
  deltaMs: number
): number {
  let damage = 0;
  const deltaSeconds = deltaMs / 1000;

  projectiles.forEach((projectile) => {
    if (!projectile.alive) return;

    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;

    if (time - projectile.createdAt > PROJECTILE_LIFETIME_MS || collides(map, projectile.x, projectile.y, projectile.radius)) {
      projectile.alive = false;
      return;
    }

    if (player.alive && Math.hypot(projectile.x - player.x, projectile.y - player.y) <= 0.28) {
      projectile.alive = false;
      damage += projectile.damage;
    }
  });

  return damage;
}

export function hasLineOfSight(map: RaycastMap, from: MovementVector, to: MovementVector): boolean {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const hit = castRay(map, from.x, from.y, angle, angle);
  return hit.distance + 0.08 >= distance;
}

function canAttack(enemy: RaycastEnemy, time: number): boolean {
  return time - enemy.lastAttack >= getEnemyConfig(enemy.kind, 'raycast').attackCooldownMs;
}

function moveEnemy(map: RaycastMap, enemy: RaycastEnemy, direction: MovementVector, speed: number, deltaMs: number): void {
  const deltaSeconds = deltaMs / 1000;
  const nextX = enemy.x + direction.x * speed * deltaSeconds;
  const nextY = enemy.y + direction.y * speed * deltaSeconds;

  if (!collides(map, nextX, enemy.y, enemy.radius)) enemy.x = nextX;
  if (!collides(map, enemy.x, nextY, enemy.radius)) enemy.y = nextY;
}

function createRaycastEnemyProjectile(enemy: RaycastEnemy, player: RaycastPlayerTarget, time: number): RaycastEnemyProjectile {
  const config = getEnemyConfig(enemy.kind, 'raycast');
  const direction = getDirection(enemy, player);
  const speed = (config.projectileSpeed ?? 320) / GRID_SCALE;

  return {
    x: enemy.x + direction.x * (enemy.radius + RANGED_MUZZLE_OFFSET),
    y: enemy.y + direction.y * (enemy.radius + RANGED_MUZZLE_OFFSET),
    vx: direction.x * speed,
    vy: direction.y * speed,
    damage: config.damage,
    radius: PROJECTILE_RADIUS,
    alive: true,
    color: config.color,
    createdAt: time
  };
}
