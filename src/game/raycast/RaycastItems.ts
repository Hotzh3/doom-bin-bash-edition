export const RAYCAST_PLAYER_MAX_HEALTH = 100;
export const RAYCAST_LOW_HEALTH_HINT_THRESHOLD = 50;
export const RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD = 25;

export type RaycastHealthPickupKind = 'health-pack' | 'repair-cell';

export interface RaycastHealthPickup {
  id: string;
  kind: RaycastHealthPickupKind;
  label: string;
  x: number;
  y: number;
  radius: number;
  restoreAmount: number;
  billboardLabel: string;
  pickupMessage: string;
  fullHealthMessage: string;
  requiredOpenDoorIds?: string[];
}

export interface RaycastHealthPickupResult {
  nextHealth: number;
  restored: number;
  consumed: boolean;
}

export function applyRaycastHealthPickup(
  currentHealth: number,
  pickup: Pick<RaycastHealthPickup, 'restoreAmount'>,
  maxHealth = RAYCAST_PLAYER_MAX_HEALTH
): RaycastHealthPickupResult {
  const clampedHealth = Math.max(0, Math.min(currentHealth, maxHealth));
  const nextHealth = Math.min(maxHealth, clampedHealth + Math.max(0, pickup.restoreAmount));
  const restored = nextHealth - clampedHealth;

  return {
    nextHealth,
    restored,
    consumed: restored > 0
  };
}

export function buildRaycastLowHealthHint(nearestPickupDistance: number | null, health: number): string | null {
  if (health > RAYCAST_LOW_HEALTH_HINT_THRESHOLD) return null;

  if (nearestPickupDistance !== null && nearestPickupDistance <= 6) {
    return health <= RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD
      ? 'CRITICAL HEALTH. REPAIR CELL NEARBY, TAKE IT NOW.'
      : 'LOW HEALTH. REPAIR CELL NEARBY, STABILIZE BEFORE THE NEXT PUSH.';
  }

  return health <= RAYCAST_CRITICAL_HEALTH_HINT_THRESHOLD
    ? 'CRITICAL HEALTH. SCAN FOR A REPAIR CELL OR FORCE THE OBJECTIVE.'
    : 'LOW HEALTH. SCAN FOR A REPAIR CELL AND AVOID TRADING DAMAGE.';
}
