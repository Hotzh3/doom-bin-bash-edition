/** Ms to sweep toward last known player position after losing sight. */
export const RAYCAST_ALERT_AFTER_LOSS_MS = 4200;

/** Reach waypoint / advance to next patrol node when closer than this (world units). */
export const RAYCAST_PATROL_WAYPOINT_EPSILON = 0.34;

/** Treat alert search as complete when this close to last known position. */
export const RAYCAST_ALERT_ARRIVE_EPSILON = 0.44;

export interface PatrolWaypoint {
  x: number;
  y: number;
}

export function hashStringToSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small triangular route around spawn — no pathfinding; walls block via collision elsewhere. */
export function buildRaycastPatrolWaypoints(homeX: number, homeY: number, seedId: string): PatrolWaypoint[] {
  const seed = hashStringToSeed(seedId);
  const a0 = (seed % 628) / 100;
  const a1 = a0 + 2.15;
  const a2 = a0 + 4.05;
  const r0 = 0.55 + (seed % 45) / 100;
  const r1 = r0 * 0.78;
  const r2 = r0 * 0.66;
  return [
    { x: homeX, y: homeY },
    { x: homeX + Math.cos(a0) * r0, y: homeY + Math.sin(a0) * r0 },
    { x: homeX + Math.cos(a1) * r1, y: homeY + Math.sin(a1) * r1 },
    { x: homeX + Math.cos(a2) * r2, y: homeY + Math.sin(a2) * r2 }
  ];
}

export function advancePatrolWaypointIndex(
  currentIndex: number,
  waypointCount: number,
  reachedWaypoint: boolean
): number {
  if (waypointCount <= 0) return 0;
  if (!reachedWaypoint) return currentIndex;
  return (currentIndex + 1) % waypointCount;
}
