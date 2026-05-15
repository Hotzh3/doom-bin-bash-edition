import { applyDamage } from '../systems/CombatSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { getWeaponConfig } from '../systems/WeaponConfig';
import type { RaycastMap } from './RaycastMap';
import { castRay } from './RaycastMap';
import { isRaycastEnemyTelegraphing, isRaycastEnemyWindingUp, type RaycastEnemy } from './RaycastEnemy';
import type { RaycastPlayerState } from './RaycastPlayerController';
import type { ProjectileSpawn, WeaponKind } from '../systems/WeaponTypes';
import { formatRaycastEnemyTargetLabel } from './RaycastHud';
import { applyRaycastEnemyKnockback } from './RaycastHitKnockback';
import type { EnemyKind } from '../types/game';

export interface RaycastCombatResult {
  fired: boolean;
  /** Pellets spawned this trigger pull — used for accuracy / scoring (Phase 24). */
  pelletCount: number;
  hitEnemy: RaycastEnemy | null;
  killed: boolean;
  /** Any connecting hit this frame was a non-lethal heavy “crit” chunk. */
  anyCrit: boolean;
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
export const RAYCAST_HIT_FLASH_MS = 218;
export const RAYCAST_CRIT_FLASH_EXTRA_MS = 82;
/** Hit counts as "critical" when it deals at least this fraction of target max HP without killing. */
export const RAYCAST_CRIT_DAMAGE_RATIO = 0.34;
export const RAYCAST_DEATH_BURST_MS = 405;
const HIT_FLASH_MS = RAYCAST_HIT_FLASH_MS;
const CRIT_FLASH_EXTRA_MS = RAYCAST_CRIT_FLASH_EXTRA_MS;
const DEATH_BURST_MS = RAYCAST_DEATH_BURST_MS;
const GRID_SCALE = 100;
const STAGGER_BASE_MS: Record<WeaponKind, number> = {
  PISTOL: 55,
  SHOTGUN: 115,
  LAUNCHER: 165
};
const STAGGER_KIND_MUL: Record<EnemyKind, number> = {
  GRUNT: 1,
  STALKER: 1.18,
  RANGED: 1.14,
  SCRAMBLER: 1.22,
  BRUTE: 0.64,
  FLASHER: 1.08
};

export class RaycastCombatSystem {
  private readonly weapons = new WeaponSystem('raycast');
  private playerDamageMultiplier = 1;

  getWeaponLabel(): string {
    return this.weapons.getCurrentWeaponLabel();
  }

  getCurrentWeapon(): WeaponKind {
    return this.weapons.getCurrentWeapon();
  }

  switchWeaponSlot(slot: number): void {
    this.weapons.switchBySlot(slot);
  }

  setPlayerDamageMultiplier(multiplier: number): void {
    this.playerDamageMultiplier = Number.isFinite(multiplier) ? Math.max(0.1, multiplier) : 1;
  }

  setWeaponFireRateMultiplier(multiplier: number): void {
    this.weapons.setFireRateMultiplier(multiplier);
  }

  tick(time: number): void {
    this.weapons.tick(time);
  }

  tryReload(time: number): boolean {
    return this.weapons.startReload(time);
  }

  isReloading(time: number): boolean {
    return this.weapons.isReloading(this.weapons.getCurrentWeapon(), time);
  }

  getAmmoState(): { current: number; capacity: number } {
    const kind = this.weapons.getCurrentWeapon();
    return { current: this.weapons.getAmmo(kind), capacity: this.weapons.getAmmoCapacity(kind) };
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
        anyCrit: false,
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
        anyCrit: false,
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
      anyCrit: impacts.some((impact) => impact.isCrit),
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

    const scaledDamageBase = Math.max(1, Math.round(projectile.damage * this.playerDamageMultiplier));
    const reducedForShield =
      (target.frontalDamageReduction ?? 0) > 0 && isFrontalHit(player, projectileAngle, target)
        ? Math.max(1, Math.round(scaledDamageBase * (1 - (target.frontalDamageReduction ?? 0))))
        : scaledDamageBase;
    const scaledDamage = reducedForShield;
    const critThreshold = Math.max(1, Math.ceil(target.maxHealth * RAYCAST_CRIT_DAMAGE_RATIO));
    const preDirectCrit = target.health > scaledDamage && scaledDamage >= critThreshold;
    applyRaycastEnemyKnockback(target, player.x, player.y, scaledDamage, map, preDirectCrit ? 1.16 : 1);
    const directKilled = applyDamage(target, scaledDamage);
    const directCrit = !directKilled && scaledDamage >= critThreshold;
    target.hitFlashUntil = time + HIT_FLASH_MS + (directCrit ? CRIT_FLASH_EXTRA_MS : 0);
    if ((target.frontalDamageReduction ?? 0) > 0) target.shieldPulseUntil = time + 180;
    applyRaycastHitStagger(target, projectile.weaponKind, time, false);
    if (directKilled) target.deathBurstUntil = time + DEATH_BURST_MS;
    const splashImpacts = this.applyExplosionSplash(target, projectile, enemies, map, time);
    const killedEnemyKinds: EnemyKind[] = [];
    if (directKilled) killedEnemyKinds.push(target.kind);
    killedEnemyKinds.push(...splashImpacts.killedKinds);
    return {
      enemy: target,
      damage: scaledDamage + splashImpacts.damage,
      killed: directKilled || splashImpacts.killCount > 0,
      isCrit: directCrit || splashImpacts.anyCrit,
      killCount: (directKilled ? 1 : 0) + splashImpacts.killCount,
      killedEnemyKinds,
      splashHitCount: splashImpacts.hitCount
    };
  }

  private applyExplosionSplash(
    originEnemy: RaycastEnemy,
    projectile: ProjectileSpawn,
    enemies: RaycastEnemy[],
    map: RaycastMap,
    time: number
  ): { damage: number; killCount: number; hitCount: number; killedKinds: EnemyKind[]; anyCrit: boolean } {
    if (projectile.explosionRadius <= 0)
      return { damage: 0, killCount: 0, hitCount: 0, killedKinds: [], anyCrit: false };

    const radius = projectile.explosionRadius / GRID_SCALE;
    let damage = 0;
    let killCount = 0;
    let hitCount = 0;
    let anyCrit = false;
    const killedKinds: EnemyKind[] = [];
    enemies.forEach((enemy) => {
      if (!enemy.alive || enemy.id === originEnemy.id) return;
      const distance = Math.hypot(enemy.x - originEnemy.x, enemy.y - originEnemy.y);
      if (distance > radius) return;

      const falloff = 1 - distance / radius;
      const scaledBaseDamage = Math.max(1, Math.round(projectile.damage * this.playerDamageMultiplier));
      const splashDamage = Math.max(1, Math.round(scaledBaseDamage * 0.62 * falloff));
      const splashCritTh = Math.max(1, Math.ceil(enemy.maxHealth * RAYCAST_CRIT_DAMAGE_RATIO));
      const preSplashCrit = enemy.health > splashDamage && splashDamage >= splashCritTh;
      hitCount += 1;
      applyRaycastEnemyKnockback(enemy, originEnemy.x, originEnemy.y, splashDamage, map, preSplashCrit ? 1.14 : 1);
      const splKilled = applyDamage(enemy, splashDamage);
      const splashCrit = !splKilled && splashDamage >= splashCritTh;
      if (splashCrit) anyCrit = true;
      if (splKilled) {
        enemy.deathBurstUntil = time + DEATH_BURST_MS;
        killCount += 1;
        killedKinds.push(enemy.kind);
      }
      applyRaycastHitStagger(enemy, projectile.weaponKind, time, true);
      enemy.hitFlashUntil = time + HIT_FLASH_MS + (splashCrit ? CRIT_FLASH_EXTRA_MS : 0);
      damage += splashDamage;
    });

    return { damage, killCount, hitCount, killedKinds, anyCrit };
  }
}

function applyRaycastHitStagger(enemy: RaycastEnemy, weaponKind: WeaponKind, time: number, splash: boolean): void {
  const base = STAGGER_BASE_MS[weaponKind] ?? STAGGER_BASE_MS.PISTOL;
  const kindMul = STAGGER_KIND_MUL[enemy.kind] ?? 1;
  const splashMul = splash ? 0.58 : 1;
  const duration = Math.round(base * kindMul * splashMul);
  enemy.staggerUntil = Math.max(enemy.staggerUntil ?? 0, time + duration);
}

interface RaycastProjectileImpact {
  enemy: RaycastEnemy;
  damage: number;
  killed: boolean;
  isCrit: boolean;
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
    kindLabel: formatRaycastEnemyTargetLabel(enemy.kind),
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

function isFrontalHit(
  player: Pick<RaycastPlayerState, 'x' | 'y'>,
  projectileAngle: number,
  enemy: Pick<RaycastEnemy, 'x' | 'y'>
): boolean {
  const enemyToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  return Math.abs(normalizeAngle(projectileAngle - enemyToPlayer)) <= Math.PI / 3;
}
