import { getEnemyConfig } from '../entities/enemyConfig';
import type { EnemyKind } from '../types/game';
import { collides } from './RaycastMovement';
import type { RaycastMap } from './RaycastMap';
import type { RaycastEnemy } from './RaycastEnemy';

/** Per-kind resistance — higher = more displacement (BRUTE/RANGED resist more). */
const KNOCKBACK_KIND_SCALE: Record<EnemyKind, number> = {
  GRUNT: 1,
  BRUTE: 0.38,
  STALKER: 1.06,
  RANGED: 0.52,
  SCRAMBLER: 0.88
};

const KNOCKBACK_BASE = 0.022;
const KNOCKBACK_PER_DAMAGE = 0.00088;
const KNOCKBACK_CAP = 0.095;

/**
 * Micro knockback away from `originX/originY`. Slides along axes with wall checks only;
 * does not alter AI timers or path state beyond position.
 */
export function applyRaycastEnemyKnockback(
  enemy: RaycastEnemy,
  originX: number,
  originY: number,
  damage: number,
  map: RaycastMap
): void {
  if (damage <= 0) return;
  const profileScale = getEnemyConfig(enemy.kind, 'raycast').size >= 34 ? 0.92 : 1;
  const kindScale = KNOCKBACK_KIND_SCALE[enemy.kind];
  const push = Math.min(KNOCKBACK_CAP, KNOCKBACK_BASE + damage * KNOCKBACK_PER_DAMAGE) * kindScale * profileScale;
  const dx = enemy.x - originX;
  const dy = enemy.y - originY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = enemy.x + (dx / len) * push;
  const ny = enemy.y + (dy / len) * push;
  if (!collides(map, nx, enemy.y, enemy.radius)) enemy.x = nx;
  if (!collides(map, enemy.x, ny, enemy.radius)) enemy.y = ny;
}
