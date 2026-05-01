import { applyDamage } from '../systems/CombatSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { RaycastMap } from './RaycastMap';
import { castRay } from './RaycastMap';
import type { RaycastEnemy } from './RaycastEnemy';
import type { RaycastPlayerState } from './RaycastPlayerController';
import type { WeaponKind } from '../systems/WeaponTypes';

export interface RaycastCombatResult {
  fired: boolean;
  hitEnemy: RaycastEnemy | null;
  killed: boolean;
  wallDistance: number;
}

const AIM_TOLERANCE_RADIANS = 0.08;
const HIT_FLASH_MS = 110;

export class RaycastCombatSystem {
  private readonly weapons = new WeaponSystem();

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

    if (!result) return { fired: false, hitEnemy: null, killed: false, wallDistance };

    const target = findEnemyInCrosshair(player, enemies, wallDistance);
    if (!target) return { fired: true, hitEnemy: null, killed: false, wallDistance };

    const killed = applyDamage(target, result.weapon.damage);
    target.hitFlashUntil = time + HIT_FLASH_MS;
    return { fired: true, hitEnemy: target, killed, wallDistance };
  }
}

export function findEnemyInCrosshair(
  player: Pick<RaycastPlayerState, 'x' | 'y' | 'angle'>,
  enemies: RaycastEnemy[],
  wallDistance: number
): RaycastEnemy | null {
  const candidates = enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      const angleToEnemy = Math.atan2(dy, dx);
      const angleDelta = Math.abs(normalizeAngle(angleToEnemy - player.angle));
      const tolerance = Math.max(AIM_TOLERANCE_RADIANS, enemy.radius / Math.max(distance, 0.001));
      return { enemy, distance, angleDelta, tolerance };
    })
    .filter((candidate) => candidate.distance < wallDistance && candidate.angleDelta <= candidate.tolerance)
    .sort((a, b) => a.distance - b.distance);

  return candidates[0]?.enemy ?? null;
}

export function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
