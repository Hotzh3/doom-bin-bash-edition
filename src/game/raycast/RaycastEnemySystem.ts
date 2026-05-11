import { getEnemyConfig } from '../entities/enemyConfig';
import { decideEnemyBehavior, getDirection } from '../systems/EnemyBehaviorSystem';
import type { MovementVector } from '../systems/MovementSystem';
import { castRay, type RaycastMap } from './RaycastMap';
import { collides } from './RaycastMovement';
import { isRaycastEnemyTelegraphing, type RaycastEnemy } from './RaycastEnemy';
import {
  RAYCAST_ALERT_AFTER_LOSS_MS,
  RAYCAST_ALERT_ARRIVE_EPSILON,
  RAYCAST_PATROL_WAYPOINT_EPSILON,
  advancePatrolWaypointIndex,
  hashStringToSeed
} from './RaycastPatrol';
import {
  accumulateRoamStuck,
  pickOpenRoamHeadingToward,
  pickPatrolRetargetNearHome,
  RAYCAST_ROAM_REDIRECT_MIN_MS,
  RAYCAST_ROAM_REDIRECT_VAR_MS,
  RAYCAST_ROAM_STUCK_THRESHOLD_MS
} from './RaycastEnemyRoam';

const GRID_SCALE = 100;
/** Hearing radius as a fraction of detection (grid units); no LOS required. */
export const RAYCAST_HEARING_RANGE_FACTOR = 0.68;
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

export function computeRaycastEnemyPlayerAwareness(
  hasSight: boolean,
  distanceWorld: number,
  detectionRangeGrid: number
): { sees: boolean; hears: boolean; aware: boolean } {
  const distGrid = distanceWorld * GRID_SCALE;
  const sees = hasSight && distGrid <= detectionRangeGrid;
  const hears = !hasSight && distGrid <= detectionRangeGrid * RAYCAST_HEARING_RANGE_FACTOR;
  return { sees, hears, aware: sees || hears };
}

function createEnemySaltedRng(enemyId: string, salt: number): () => number {
  let s = (hashStringToSeed(enemyId) ^ (salt >>> 0)) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s >>> 8) / 0x1000000;
  };
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
    if ((enemy.staggerUntil ?? 0) > time) {
      enemy.attackWindupStartedAt = 0;
      enemy.attackWindupUntil = 0;
      return;
    }
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

    const { aware } = computeRaycastEnemyPlayerAwareness(hasSight, distance, config.detectionRange);
    let decision = decideEnemyBehavior({
      distanceToTarget: distance * GRID_SCALE,
      enemyAlive: enemy.alive,
      targetAlive: player.alive && aware,
      config
    });

    if (decision.action === 'RANGED_ATTACK' && !hasSight) {
      decision = { action: 'CHASE', speedMultiplier: 0.82 };
    }

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
          const alertSteer = pickOpenRoamHeadingToward(
            map,
            enemy.x,
            enemy.y,
            enemy.radius,
            enemy.lastKnownPlayerX,
            enemy.lastKnownPlayerY
          );
          moveEnemy(
            map,
            enemy,
            { x: Math.cos(alertSteer), y: Math.sin(alertSteer) },
            alertSpeed,
            deltaMs
          );
        }
        return;
      }

      const home = enemy.patrolWaypoints[0] ?? { x: enemy.x, y: enemy.y };
      let targetWp = enemy.patrolWaypoints[enemy.patrolWaypointIndex] ?? home;
      const distWp = Math.hypot(targetWp.x - enemy.x, targetWp.y - enemy.y);

      if (distWp < RAYCAST_PATROL_WAYPOINT_EPSILON) {
        enemy.patrolWaypointIndex = advancePatrolWaypointIndex(
          enemy.patrolWaypointIndex,
          enemy.patrolWaypoints.length,
          true
        );
        enemy.roamStuckMs = Math.max(0, enemy.roamStuckMs - deltaMs * 0.85);
        return;
      }

      const patrolSpeed = (config.speed / GRID_SCALE) * (enemy.kind === 'STALKER' ? 0.54 : 0.47);
      const beforeX = enemy.x;
      const beforeY = enemy.y;

      if (time >= enemy.roamNextRedirectAt || enemy.roamStuckMs >= RAYCAST_ROAM_STUCK_THRESHOLD_MS) {
        const stuck = enemy.roamStuckMs >= RAYCAST_ROAM_STUCK_THRESHOLD_MS;
        if (stuck && enemy.patrolWaypoints.length > 1) {
          const idx = enemy.patrolWaypointIndex <= 0 ? 1 : enemy.patrolWaypointIndex;
          const rng = createEnemySaltedRng(enemy.id, Math.floor(time));
          enemy.patrolWaypoints[idx] = pickPatrolRetargetNearHome(map, home.x, home.y, enemy.radius, rng);
          enemy.patrolWaypointIndex = idx;
        } else {
          let next = (enemy.patrolWaypointIndex + 1) % enemy.patrolWaypoints.length;
          if (next === 0) next = 1;
          enemy.patrolWaypointIndex = next;
        }
        const stagger = (enemy.id.charCodeAt(0) + enemy.id.length * 17) % RAYCAST_ROAM_REDIRECT_VAR_MS;
        enemy.roamNextRedirectAt = time + RAYCAST_ROAM_REDIRECT_MIN_MS + stagger;
        enemy.roamStuckMs = stuck ? 0 : enemy.roamStuckMs * 0.38;
        targetWp = enemy.patrolWaypoints[enemy.patrolWaypointIndex] ?? home;
      }

      const steer = pickOpenRoamHeadingToward(map, enemy.x, enemy.y, enemy.radius, targetWp.x, targetWp.y);
      enemy.roamHeadingRad = steer;
      moveEnemy(map, enemy, { x: Math.cos(steer), y: Math.sin(steer) }, patrolSpeed, deltaMs);

      const moved = Math.hypot(enemy.x - beforeX, enemy.y - beforeY);
      enemy.roamStuckMs = accumulateRoamStuck(moved, deltaMs, enemy.roamStuckMs);
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
