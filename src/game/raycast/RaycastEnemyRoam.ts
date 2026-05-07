import type { PatrolWaypoint } from './RaycastPatrol';
import type { RaycastMap } from './RaycastMap';
import { collides } from './RaycastMovement';

export const RAYCAST_ROAM_MAX_ATTEMPTS = 12;
export const RAYCAST_ROAM_PROBE = 0.38;
export const RAYCAST_ROAM_STUCK_THRESHOLD_MS = 720;
export const RAYCAST_ROAM_REDIRECT_MIN_MS = 2100;
export const RAYCAST_ROAM_REDIRECT_VAR_MS = 2000;

/** When patrolling, nudge toward a new open spot near home if a waypoint sits inside geometry. */
export function pickPatrolRetargetNearHome(
  map: RaycastMap,
  homeX: number,
  homeY: number,
  radius: number,
  random01: () => number = Math.random
): PatrolWaypoint {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const angle = random01() * Math.PI * 2;
    const dist = 0.28 + random01() * 0.92;
    const x = homeX + Math.cos(angle) * dist;
    const y = homeY + Math.sin(angle) * dist;
    if (!collides(map, x, y, radius)) return { x, y };
  }
  return { x: homeX, y: homeY };
}

/** Blend toward a goal direction with random probes so paths feel less robotic than a pure strafe. */
export function pickOpenRoamHeadingToward(
  map: RaycastMap,
  x: number,
  y: number,
  radius: number,
  goalX: number,
  goalY: number,
  random01: () => number = Math.random
): number {
  const gx = goalX - x;
  const gy = goalY - y;
  const goalAngle = Math.atan2(gy, gx);
  for (let attempt = 0; attempt < RAYCAST_ROAM_MAX_ATTEMPTS; attempt += 1) {
    const jitter = (random01() - 0.5) * 1.05;
    const angle = goalAngle + jitter;
    const px = x + Math.cos(angle) * RAYCAST_ROAM_PROBE;
    const py = y + Math.sin(angle) * RAYCAST_ROAM_PROBE;
    if (!collides(map, px, py, radius)) return angle;
  }
  return pickOpenRoamHeading(map, x, y, radius, random01);
}

/** Picks a horizontal wander heading by probing short steps on random bearings (no grid pathfinding). */
export function pickOpenRoamHeading(
  map: RaycastMap,
  x: number,
  y: number,
  radius: number,
  random01: () => number = Math.random
): number {
  for (let attempt = 0; attempt < RAYCAST_ROAM_MAX_ATTEMPTS; attempt += 1) {
    const angle = random01() * Math.PI * 2;
    const px = x + Math.cos(angle) * RAYCAST_ROAM_PROBE;
    const py = y + Math.sin(angle) * RAYCAST_ROAM_PROBE;
    if (!collides(map, px, py, radius)) return angle;
  }
  return random01() * Math.PI * 2;
}

/** Builds stuck-time when almost no displacement despite wandering; otherwise bleeds off stuck credit. */
export function accumulateRoamStuck(
  movedDist: number,
  deltaMs: number,
  prevStuckMs: number,
  moveEpsilon = 0.00135
): number {
  const threshold = moveEpsilon * Math.min(deltaMs, 48);
  if (movedDist < threshold) return prevStuckMs + deltaMs;
  return Math.max(0, prevStuckMs - deltaMs * 0.62);
}
