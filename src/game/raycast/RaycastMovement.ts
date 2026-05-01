import { normalizeMovementInput, type MovementVector, type PlayerMovementConfig } from '../systems/MovementSystem';
import { isWallAt, type RaycastMap } from './RaycastMap';

export interface RaycastPlayerKinematics {
  x: number;
  y: number;
  angle: number;
  velocity: MovementVector;
}

export interface RaycastMovementConfig extends PlayerMovementConfig {
  forwardSpeed: number;
  backwardSpeed: number;
  strafeSpeed: number;
  turnSpeed: number;
  mouseTurnSensitivity: number;
  collisionRadius: number;
}

export const RAYCAST_MOVEMENT: RaycastMovementConfig = {
  maxSpeed: 6.8,
  forwardSpeed: 6.8,
  backwardSpeed: 5.2,
  strafeSpeed: 6.5,
  acceleration: 520,
  friction: 540,
  stopEpsilon: 0.03,
  turnSpeed: 3.85,
  mouseTurnSensitivity: 0.0032,
  collisionRadius: 0.18
};

export function getCameraRelativeInput(
  forwardInput: number,
  strafeInput: number,
  angle: number,
  config: RaycastMovementConfig = RAYCAST_MOVEMENT
): MovementVector {
  if (forwardInput === 0 && strafeInput === 0) return { x: 0, y: 0 };

  const forward = { x: Math.cos(angle), y: Math.sin(angle) };
  const right = { x: Math.cos(angle + Math.PI * 0.5), y: Math.sin(angle + Math.PI * 0.5) };
  const forwardScale = forwardInput >= 0 ? config.forwardSpeed / config.maxSpeed : config.backwardSpeed / config.maxSpeed;
  const strafeScale = config.strafeSpeed / config.maxSpeed;
  const input = {
    x: forward.x * forwardInput * forwardScale + right.x * strafeInput * strafeScale,
    y: forward.y * forwardInput * forwardScale + right.y * strafeInput * strafeScale
  };
  const magnitude = Math.hypot(input.x, input.y);

  return magnitude > 1 ? normalizeMovementInput(input) : input;
}

export function updateRaycastVelocity(
  currentVelocity: MovementVector,
  input: MovementVector,
  deltaMs: number,
  config: RaycastMovementConfig = RAYCAST_MOVEMENT
): MovementVector {
  const deltaSeconds = Math.max(0, deltaMs) / 1000;
  const inputMagnitude = Math.hypot(input.x, input.y);

  if (inputMagnitude > 0) {
    const targetVelocity = {
      x: input.x * config.maxSpeed,
      y: input.y * config.maxSpeed
    };
    return moveTowardVector(currentVelocity, targetVelocity, config.acceleration * deltaSeconds);
  }

  const slowedVelocity = moveTowardVector(currentVelocity, { x: 0, y: 0 }, config.friction * deltaSeconds);
  if (Math.hypot(slowedVelocity.x, slowedVelocity.y) <= config.stopEpsilon) return { x: 0, y: 0 };
  return slowedVelocity;
}

export function applyRaycastMouseTurn(
  currentAngle: number,
  movementX: number,
  config: Pick<RaycastMovementConfig, 'mouseTurnSensitivity'> = RAYCAST_MOVEMENT
): number {
  return currentAngle + movementX * config.mouseTurnSensitivity;
}

export function moveWithWallSlide(
  map: RaycastMap,
  state: RaycastPlayerKinematics,
  deltaMs: number,
  config: RaycastMovementConfig = RAYCAST_MOVEMENT
): RaycastPlayerKinematics {
  const deltaSeconds = deltaMs / 1000;
  const nextState = { ...state, velocity: { ...state.velocity } };
  const maxAxisMovement = Math.max(Math.abs(nextState.velocity.x * deltaSeconds), Math.abs(nextState.velocity.y * deltaSeconds));
  const subSteps = Math.max(1, Math.ceil(maxAxisMovement / Math.max(config.collisionRadius * 0.75, 0.05)));
  const stepDeltaSeconds = deltaSeconds / subSteps;

  for (let step = 0; step < subSteps; step += 1) {
    moveSingleStep(map, nextState, stepDeltaSeconds, config);
  }

  return nextState;
}

function moveSingleStep(
  map: RaycastMap,
  state: RaycastPlayerKinematics,
  deltaSeconds: number,
  config: RaycastMovementConfig
): void {
  const nextX = state.x + state.velocity.x * deltaSeconds;
  const nextY = state.y + state.velocity.y * deltaSeconds;

  if (!collides(map, nextX, state.y, config.collisionRadius)) {
    state.x = nextX;
  } else {
    state.velocity.x = 0;
  }

  if (!collides(map, state.x, nextY, config.collisionRadius)) {
    state.y = nextY;
  } else {
    state.velocity.y = 0;
  }
}

export function collides(map: RaycastMap, x: number, y: number, radius: number): boolean {
  return getCollisionSamplePoints(x, y, radius).some((point) => isWallAt(map, point.x, point.y));
}

function getCollisionSamplePoints(x: number, y: number, radius: number): MovementVector[] {
  return [
    { x: x - radius, y: y - radius },
    { x: x, y: y - radius },
    { x: x + radius, y: y - radius },
    { x: x - radius, y },
    { x: x + radius, y },
    { x: x - radius, y: y + radius },
    { x, y: y + radius },
    { x: x + radius, y: y + radius }
  ];
}

function moveTowardVector(current: MovementVector, target: MovementVector, maxDelta: number): MovementVector {
  const delta = {
    x: target.x - current.x,
    y: target.y - current.y
  };
  const distance = Math.hypot(delta.x, delta.y);

  if (distance === 0 || distance <= maxDelta) return target;

  const scale = maxDelta / distance;
  return {
    x: current.x + delta.x * scale,
    y: current.y + delta.y * scale
  };
}
