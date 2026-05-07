/** Ms to sweep toward last known player position after losing sight. */
export const RAYCAST_ALERT_AFTER_LOSS_MS = 4200;

/** Reach waypoint / advance to next patrol node when closer than this (world units). */
export const RAYCAST_PATROL_WAYPOINT_EPSILON = 0.36;

/** Max world distance patrol nodes may sit from home (after clamp). */
export const RAYCAST_PATROL_MAX_RADIUS = 1.15;

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

/** Irregular loop around spawn (not an equilateral triangle); walls avoided at runtime via movement + retarget. */
export function buildRaycastPatrolWaypoints(homeX: number, homeY: number, seedId: string): PatrolWaypoint[] {
  const seed = hashStringToSeed(seedId);
  const waypoints: PatrolWaypoint[] = [{ x: homeX, y: homeY }];
  const nodeCount = 6;
  let angleCursor = ((seed % 360) * Math.PI) / 180;
  const golden = 2.399963229728653;

  for (let i = 0; i < nodeCount; i += 1) {
    const stride = 0.85 + ((seed >>> (i * 3)) % 40) / 100;
    angleCursor += stride + golden * 0.22;
    const radiusJitter = 0.38 + ((seed >>> (i * 5)) % 65) / 100;
    const r = Math.min(RAYCAST_PATROL_MAX_RADIUS, radiusJitter);
    waypoints.push({
      x: homeX + Math.cos(angleCursor) * r,
      y: homeY + Math.sin(angleCursor) * r
    });
  }

  return waypoints;
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
