import type { HealthLike } from '../types/game';

export function applyDamage(target: HealthLike, amount: number): boolean {
  if (!target.alive) return false;
  target.health = Math.max(0, target.health - amount);
  if (target.health === 0) {
    target.alive = false;
    return true;
  }
  return false;
}
