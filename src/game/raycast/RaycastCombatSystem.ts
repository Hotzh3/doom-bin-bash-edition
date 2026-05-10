import { applyDamage } from '../systems/CombatSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { getWeaponConfig } from '../systems/WeaponConfig';
import type { RaycastMap } from './RaycastMap';
import { castRay } from './RaycastMap';
import { isRaycastEnemyTelegraphing, isRaycastEnemyWindingUp, type RaycastEnemy } from './RaycastEnemy';
import type { RaycastPlayerState } from './RaycastPlayerController';
import type { ProjectileSpawn, WeaponKind } from '../systems/WeaponTypes';
import { formatRaycastEnemyKindLabel } from './RaycastHud';
import type { EnemyKind } from '../types/game';

export interface RaycastCombatResult {
  fired: boolean;
  /** Pellets spawned this trigger pull — used for accuracy / scoring (Phase 24). */
  pelletCount: number;
  hitEnemy: RaycastEnemy | null;
  killed: boolean;
  killCount: number;
  killedEnemyKinds: EnemyKind[];
  splashHitCount: number;
  wallDistance: number;
  totalDamage: number;
  hitCount: number;
  weaponKind: WeaponKind;
  wallHit: boolean;
}

const DEFAULT_AIM_TOLERANCE_RADIANS = 0.1;
/** Exported for renderer/UI sync — slightly longer reads clearly at raycast resolution. */
export const RAYCAST_HIT_FLASH_MS = 200;
export const RAYCAST_DEATH_BURST_MS = 330;
const HIT_FLASH_MS = RAYCAST_HIT_FLASH_MS;
const DEATH_BURST_MS = RAYCAST_DEATH_BURST_MS;
const GRID_SCALE = 100;

export class RaycastCombatSystem {
  private readonly weapons = new WeaponSystem('raycast');

  getWeaponLabel(): string {
    return this.weapons.getCurrentWeaponLabel();
  }

  getCurrentWeapon(): WeaponKind {
    return this.weapons.getCurrentWeapon();
  }

  switchWeaponSlot(slot: number): void {
    this.weapons.switchBySlot(slot);
  }

  fire(player: RaycastPlayerState, enemies: RaycastEnemy[], map: RaycastMap, time: number): RaycastCombatResult {
    const result = this.weapons.fire({
      ownerTeam: 'P1',
      origin: { x: player.x, y: player.y },
      direction: { x: Math.cos(player.angle), y: Math.sin(player.angle) },
      time
    });
    const wallDistance = castRay(map, player.x, player.y, player.angle, player.angle).distance;

    if (!result) {
      return {
        fired: false,
        pelletCount: 0,
        hitEnemy: null,
        killed: false,
        killCount: 0,
        killedEnemyKinds: [],
        splashHitCount: 0,
        wallDistance,
        totalDamage: 0,
        hitCount: 0,
        weaponKind: this.getCurrentWeapon(),
        wallHit: false
      };
    }

    const pelletCount = result.projectiles.length;

    const impacts = result.projectiles
      .map((projectile) => this.resolveProjectileHit(player, projectile, enemies, map, time))
      .filter((impact): impact is RaycastProjectileImpact => impact !== null);

    if (impacts.length === 0) {
      return {
        fired: true,
        pelletCount,
        hitEnemy: null,
        killed: false,
        killCount: 0,
        killedEnemyKinds: [],
        splashHitCount: 0,
        wallDistance,
        totalDamage: 0,
        hitCount: 0,
        weaponKind: result.weapon.kind,
        wallHit: true
      };
    }

    const killedEnemyKinds = impacts.flatMap((impact) => impact.killedEnemyKinds);

    return {
      fired: true,
      pelletCount,
      hitEnemy: impacts[0].enemy,
      killed: impacts.some((impact) => impact.killed),
      killCount: impacts.reduce((total, impact) => total + impact.killCount, 0),
      killedEnemyKinds,
      splashHitCount: impacts.reduce((total, impact) => total + impact.splashHitCount, 0),
      wallDistance,
      totalDamage: impacts.reduce((total, impact) => total + impact.damage, 0),
      hitCount: impacts.length,
      weaponKind: result.weapon.kind,
      wallHit: false
    };
  }

  private resolveProjectileHit(
    player: RaycastPlayerState,
    projectile: ProjectileSpawn,
    enemies: RaycastEnemy[],
    map: RaycastMap,
    time: number
  ): RaycastProjectileImpact | null {
    const projectileAngle = Math.atan2(projectile.vy, projectile.vx);
    const wallDistance = castRay(map, player.x, player.y, projectileAngle, player.angle).distance;
    const weapon = getWeaponConfig(projectile.weaponKind, 'raycast');
    const target = findEnemyAlongAim(player, projectileAngle, enemies, wallDistance, weapon.aimToleranceRadians);
    if (!target) return null;

    const directKilled = applyDamage(target, projectile.damage);
    target.hitFlashUntil = time + HIT_FLASH_MS;
    if (directKilled) target.deathBurstUntil = time + DEATH_BURST_MS;
    const splashImpacts = this.applyExplosionSplash(target, projectile, enemies, time);
    const killedEnemyKinds: EnemyKind[] = [];
    if (directKilled) killedEnemyKinds.push(target.kind);
    killedEnemyKinds.push(...splashImpacts.killedKinds);
    return {
      enemy: target,
      damage: projectile.damage + splashImpacts.damage,
      killed: directKilled || splashImpacts.killCount > 0,
      killCount: (directKilled ? 1 : 0) + splashImpacts.killCount,
      killedEnemyKinds,
      splashHitCount: splashImpacts.hitCount
    };
  }

  private applyExplosionSplash(
    originEnemy: RaycastEnemy,
    projectile: ProjectileSpawn,
    enemies: RaycastEnemy[],
    time: number
  ): { damage: number; killCount: number; hitCount: number; killedKinds: EnemyKind[] } {
    if (projectile.explosionRadius <= 0) return { damage: 0, killCount: 0, hitCount: 0, killedKinds: [] };

    const radius = projectile.explosionRadius / GRID_SCALE;
    let damage = 0;
    let killCount = 0;
    let hitCount = 0;
    const killedKinds: EnemyKind[] = [];
    enemies.forEach((enemy) => {
      if (!enemy.alive || enemy.id === originEnemy.id) return;
      const distance = Math.hypot(enemy.x - originEnemy.x, enemy.y - originEnemy.y);
      if (distance > radius) return;

      const falloff = 1 - distance / radius;
      const splashDamage = Math.max(1, Math.round(projectile.damage * 0.62 * falloff));
      hitCount += 1;
      if (applyDamage(enemy, splashDamage)) {
        enemy.deathBurstUntil = time + DEATH_BURST_MS;
        killCount += 1;
        killedKinds.push(enemy.kind);
      }
      enemy.hitFlashUntil = time + HIT_FLASH_MS;
      damage += splashDamage;
    });

    return { damage, killCount, hitCount, killedKinds };
  }
}

interface RaycastProjectileImpact {
  enemy: RaycastEnemy;
  damage: number;
  killed: boolean;
  killCount: number;
  killedEnemyKinds: EnemyKind[];
  splashHitCount: number;
}

export interface RaycastCrosshairTargetInfo {
  id: string;
  kindLabel: string;
  health: number;
  maxHealth: number;
  healthRatio: number;
  isWindingUp: boolean;
  isTelegraphing: boolean;
}

export function findEnemyInCrosshair(
  player: Pick<RaycastPlayerState, 'x' | 'y' | 'angle'>,
  enemies: RaycastEnemy[],
  wallDistance: number,
  aimToleranceRadians = DEFAULT_AIM_TOLERANCE_RADIANS
): RaycastEnemy | null {
  return findEnemyAlongAim(player, player.angle, enemies, wallDistance, aimToleranceRadians);
}

export function getRaycastCrosshairTargetInfo(
  player: Pick<RaycastPlayerState, 'x' | 'y' | 'angle'>,
  enemies: RaycastEnemy[],
  wallDistance: number,
  time: number,
  aimToleranceRadians = DEFAULT_AIM_TOLERANCE_RADIANS
): RaycastCrosshairTargetInfo | null {
  const enemy = findEnemyInCrosshair(player, enemies, wallDistance, aimToleranceRadians);
  if (!enemy) return null;
  return {
    id: enemy.id,
    kindLabel: formatRaycastEnemyKindLabel(enemy.kind),
    health: enemy.health,
    maxHealth: enemy.maxHealth,
    healthRatio: enemy.maxHealth <= 0 ? 0 : enemy.health / enemy.maxHealth,
    isWindingUp: isRaycastEnemyWindingUp(enemy, time),
    isTelegraphing: isRaycastEnemyTelegraphing(enemy, time)
  };
}

function findEnemyAlongAim(
  player: Pick<RaycastPlayerState, 'x' | 'y'>,
  angle: number,
  enemies: RaycastEnemy[],
  wallDistance: number,
  aimToleranceRadians: number
): RaycastEnemy | null {
  const candidates = enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      const angleToEnemy = Math.atan2(dy, dx);
      const angleDelta = Math.abs(normalizeAngle(angleToEnemy - angle));
      const tolerance = Math.max(aimToleranceRadians, enemy.radius / Math.max(distance, 0.001));
      return { enemy, distance, angleDelta, tolerance };
    })
    .filter((candidate) => candidate.distance < wallDistance && candidate.angleDelta <= candidate.tolerance)
    .sort((a, b) => a.distance - b.distance);

  return candidates[0]?.enemy ?? null;
}

export function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
