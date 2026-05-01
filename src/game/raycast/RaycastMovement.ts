import { calculateArcadeVelocity, normalizeMovementInput, type MovementVector, type PlayerMovementConfig } from '../systems/MovementSystem';
import { isWallAt, type RaycastMap } from './RaycastMap';

export interface RaycastPlayerKinematics {
  x: number;
  y: number;
  angle: number;
  velocity: MovementVector;
}

export interface RaycastMovementConfig extends PlayerMovementConfig {
  turnSpeed: number;
  collisionRadius: number;
}

export const RAYCAST_MOVEMENT: RaycastMovementConfig = {
  maxSpeed: 4.2,
  acceleration: 34,
  friction: 26,
  stopEpsilon: 0.03,
  turnSpeed: 2.8,
  collisionRadius: 0.18
};

export function getCameraRelativeInput(forwardInput: number, strafeInput: number, angle: number): MovementVector {
  if (forwardInput === 0 && strafeInput === 0) return { x: 0, y: 0 };

  const forward = { x: Math.cos(angle), y: Math.sin(angle) };
  const right = { x: Math.cos(angle + Math.PI * 0.5), y: Math.sin(angle + Math.PI * 0.5) };

  return normalizeMovementInput({
    x: forward.x * forwardInput + right.x * strafeInput,
    y: forward.y * forwardInput + right.y * strafeInput
  });
}

export function updateRaycastVelocity(
  currentVelocity: MovementVector,
  input: MovementVector,
  deltaMs: number,
  config: RaycastMovementConfig = RAYCAST_MOVEMENT
): MovementVector {
  return calculateArcadeVelocity(currentVelocity, input, deltaMs, config);
}

export function moveWithWallSlide(
  map: RaycastMap,
  state: RaycastPlayerKinematics,
  deltaMs: number,
  config: RaycastMovementConfig = RAYCAST_MOVEMENT
): RaycastPlayerKinematics {
  const deltaSeconds = deltaMs / 1000;
  const nextState = { ...state, velocity: { ...state.velocity } };
  const nextX = nextState.x + nextState.velocity.x * deltaSeconds;
  const nextY = nextState.y + nextState.velocity.y * deltaSeconds;

  if (!collides(map, nextX, nextState.y, config.collisionRadius)) {
    nextState.x = nextX;
  } else {
    nextState.velocity.x = 0;
  }

  if (!collides(map, nextState.x, nextY, config.collisionRadius)) {
    nextState.y = nextY;
  } else {
    nextState.velocity.y = 0;
  }

  return nextState;
}

export function collides(map: RaycastMap, x: number, y: number, radius: number): boolean {
  return (
    isWallAt(map, x - radius, y - radius) ||
    isWallAt(map, x + radius, y - radius) ||
    isWallAt(map, x - radius, y + radius) ||
    isWallAt(map, x + radius, y + radius)
  );
}
