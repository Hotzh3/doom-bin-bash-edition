import type { BalanceProfile } from '../types/BalanceProfile';
import { getWeaponConfig, WEAPON_ORDER } from './WeaponConfig';
import { normalizeMovementInput, type MovementVector } from './MovementSystem';
import type { WeaponFireInput, WeaponFireResult, WeaponKind, ProjectileSpawn } from './WeaponTypes';

const MUZZLE_DISTANCE = 22;

export class WeaponSystem {
  private currentWeapon: WeaponKind = 'PISTOL';
  private readonly lastFireAt = new Map<WeaponKind, number>();
  private readonly ammoByWeapon = new Map<WeaponKind, number>();
  private readonly reloadUntilByWeapon = new Map<WeaponKind, number>();
  private fireRateMultiplier = 1;

  constructor(private readonly profile: BalanceProfile = 'arena') {}

  getCurrentWeapon(): WeaponKind {
    return this.currentWeapon;
  }

  getCurrentWeaponLabel(): string {
    return getWeaponConfig(this.currentWeapon, this.profile).label;
  }

  switchWeapon(kind: WeaponKind): void {
    this.currentWeapon = kind;
    this.ensureWeaponState(kind);
  }

  switchBySlot(slot: number): void {
    const nextWeapon = WEAPON_ORDER[slot - 1];
    if (nextWeapon) this.switchWeapon(nextWeapon);
  }

  canFire(time: number): boolean {
    const config = getWeaponConfig(this.currentWeapon, this.profile);
    const ammo = this.getAmmo(this.currentWeapon);
    if (ammo <= 0) return false;
    if (this.isReloading(this.currentWeapon, time)) return false;
    const lastFire = this.lastFireAt.get(this.currentWeapon) ?? Number.NEGATIVE_INFINITY;
    const effectiveCooldown = config.cooldownMs / Math.max(0.1, this.fireRateMultiplier);
    return time - lastFire >= effectiveCooldown;
  }

  setFireRateMultiplier(multiplier: number): void {
    this.fireRateMultiplier = Number.isFinite(multiplier) ? Math.max(0.1, multiplier) : 1;
  }

  getAmmo(kind: WeaponKind = this.currentWeapon): number {
    this.ensureWeaponState(kind);
    return this.ammoByWeapon.get(kind) ?? 0;
  }

  getAmmoCapacity(kind: WeaponKind = this.currentWeapon): number {
    return getWeaponConfig(kind, this.profile).ammoCapacity;
  }

  isReloading(kind: WeaponKind = this.currentWeapon, time = Number.POSITIVE_INFINITY): boolean {
    this.ensureWeaponState(kind);
    return (this.reloadUntilByWeapon.get(kind) ?? 0) > time;
  }

  startReload(time: number, kind: WeaponKind = this.currentWeapon): boolean {
    this.ensureWeaponState(kind);
    if (this.isReloading(kind, time)) return false;
    if (this.getAmmo(kind) >= this.getAmmoCapacity(kind)) return false;
    const reloadMs = getWeaponConfig(kind, this.profile).reloadMs;
    this.reloadUntilByWeapon.set(kind, time + reloadMs);
    return true;
  }

  tick(time: number): void {
    for (const kind of WEAPON_ORDER) {
      this.ensureWeaponState(kind);
      const until = this.reloadUntilByWeapon.get(kind) ?? 0;
      if (until > 0 && time >= until) {
        this.ammoByWeapon.set(kind, this.getAmmoCapacity(kind));
        this.reloadUntilByWeapon.set(kind, 0);
      }
    }
  }

  fire(input: WeaponFireInput): WeaponFireResult | null {
    this.tick(input.time);
    if (!this.canFire(input.time)) return null;

    const weapon = getWeaponConfig(this.currentWeapon, this.profile);
    const direction = normalizeMovementInput(input.direction);
    const projectiles = createProjectileSpawns({
      ownerTeam: input.ownerTeam,
      origin: input.origin,
      direction,
      weaponKind: this.currentWeapon
    }, this.profile);

    this.lastFireAt.set(this.currentWeapon, input.time);
    this.ammoByWeapon.set(this.currentWeapon, Math.max(0, this.getAmmo(this.currentWeapon) - 1));
    return { weapon, projectiles };
  }

  private ensureWeaponState(kind: WeaponKind): void {
    if (!this.ammoByWeapon.has(kind)) this.ammoByWeapon.set(kind, getWeaponConfig(kind, this.profile).ammoCapacity);
    if (!this.reloadUntilByWeapon.has(kind)) this.reloadUntilByWeapon.set(kind, 0);
  }
}

interface ProjectileSpawnInput {
  ownerTeam: WeaponFireInput['ownerTeam'];
  origin: MovementVector;
  direction: MovementVector;
  weaponKind: WeaponKind;
}

export function createProjectileSpawns(input: ProjectileSpawnInput, profile: BalanceProfile = 'arena'): ProjectileSpawn[] {
  const weapon = getWeaponConfig(input.weaponKind, profile);
  const spreadStart = weapon.pelletCount > 1 ? -weapon.spreadRadians * 0.5 : 0;
  const spreadStep = weapon.pelletCount > 1 ? weapon.spreadRadians / (weapon.pelletCount - 1) : 0;

  return Array.from({ length: weapon.pelletCount }, (_, index) => {
    const angle = Math.atan2(input.direction.y, input.direction.x) + spreadStart + spreadStep * index;
    const shotDirection = { x: Math.cos(angle), y: Math.sin(angle) };

    return {
      ownerTeam: input.ownerTeam,
      weaponKind: weapon.kind,
      x: input.origin.x + shotDirection.x * MUZZLE_DISTANCE,
      y: input.origin.y + shotDirection.y * MUZZLE_DISTANCE,
      vx: shotDirection.x * weapon.projectileSpeed,
      vy: shotDirection.y * weapon.projectileSpeed,
      damage: weapon.damage,
      lifetimeMs: weapon.projectileLifetimeMs,
      width: weapon.projectileSize.width,
      height: weapon.projectileSize.height,
      tint: weapon.projectileTint,
      explosionRadius: weapon.explosionRadius
    };
  });
}
