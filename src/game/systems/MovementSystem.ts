export interface MovementVector {
  x: number;
  y: number;
}

export interface PlayerMovementConfig {
  maxSpeed: number;
  acceleration: number;
  friction: number;
  stopEpsilon: number;
}

export const DOOMLIKE_PLAYER_MOVEMENT: PlayerMovementConfig = {
  maxSpeed: 320,
  acceleration: 2600,
  friction: 2100,
  stopEpsilon: 8
};

const ZERO_VECTOR: MovementVector = { x: 0, y: 0 };

export function normalizeMovementInput(input: MovementVector): MovementVector {
  const magnitude = Math.hypot(input.x, input.y);
  if (magnitude === 0) return ZERO_VECTOR;
  return { x: input.x / magnitude, y: input.y / magnitude };
}

export function calculateArcadeVelocity(
  currentVelocity: MovementVector,
  input: MovementVector,
  deltaMs: number,
  config: PlayerMovementConfig = DOOMLIKE_PLAYER_MOVEMENT
): MovementVector {
  const deltaSeconds = Math.max(0, deltaMs) / 1000;
  const movementInput = normalizeMovementInput(input);

  if (movementInput.x !== 0 || movementInput.y !== 0) {
    const targetVelocity = {
      x: movementInput.x * config.maxSpeed,
      y: movementInput.y * config.maxSpeed
    };

    return moveTowardVector(currentVelocity, targetVelocity, config.acceleration * deltaSeconds);
  }

  const slowedVelocity = moveTowardVector(currentVelocity, ZERO_VECTOR, config.friction * deltaSeconds);
  if (Math.hypot(slowedVelocity.x, slowedVelocity.y) <= config.stopEpsilon) return ZERO_VECTOR;
  return slowedVelocity;
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
