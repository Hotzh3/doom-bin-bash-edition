import type { RaycastMap } from './RaycastMap';
import { collides } from './RaycastMovement';

export const RAYCAST_ROAM_MAX_ATTEMPTS = 12;
export const RAYCAST_ROAM_PROBE = 0.38;
export const RAYCAST_ROAM_STUCK_THRESHOLD_MS = 720;
export const RAYCAST_ROAM_REDIRECT_MIN_MS = 2100;
export const RAYCAST_ROAM_REDIRECT_VAR_MS = 2000;

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
