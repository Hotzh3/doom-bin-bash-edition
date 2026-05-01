import { describe, expect, it } from 'vitest';
import { RAYCAST_MAP } from '../game/raycast/RaycastMap';
import { RAYCAST_RENDERER_CONFIG } from '../game/raycast/RaycastRendererConfig';
import { cloneRaycastMap, openRaycastDoor, RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';
import {
  applyRaycastMouseTurn,
  collides,
  getCameraRelativeInput,
  moveWithWallSlide,
  RAYCAST_MOVEMENT,
  updateRaycastVelocity
} from '../game/raycast/RaycastMovement';

describe('raycast movement', () => {
  it('converts forward and strafe input into camera-relative movement', () => {
    const forward = getCameraRelativeInput(1, 0, 0);
    const strafe = getCameraRelativeInput(0, 1, 0);
    const diagonal = getCameraRelativeInput(1, 1, 0);

    expect(forward.x).toBeCloseTo(1);
    expect(forward.y).toBeCloseTo(0);
    expect(strafe.x).toBeCloseTo(0);
    expect(strafe.y).toBeCloseTo(RAYCAST_MOVEMENT.strafeSpeed / RAYCAST_MOVEMENT.maxSpeed);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1);
  });

  it('keeps backward slower than forward while preserving useful strafe speed', () => {
    const forward = updateRaycastVelocity({ x: 0, y: 0 }, getCameraRelativeInput(1, 0, 0), 1000);
    const backward = updateRaycastVelocity({ x: 0, y: 0 }, getCameraRelativeInput(-1, 0, 0), 1000);
    const strafe = updateRaycastVelocity({ x: 0, y: 0 }, getCameraRelativeInput(0, 1, 0), 1000);

    expect(forward.x).toBeCloseTo(RAYCAST_MOVEMENT.forwardSpeed);
    expect(Math.abs(backward.x)).toBeCloseTo(RAYCAST_MOVEMENT.backwardSpeed);
    expect(strafe.y).toBeCloseTo(RAYCAST_MOVEMENT.strafeSpeed);
    expect(Math.abs(backward.x)).toBeLessThan(forward.x);
    expect(strafe.y).toBeGreaterThan(RAYCAST_MOVEMENT.forwardSpeed * 0.9);
  });

  it('reaches forward target velocity almost immediately', () => {
    const firstStep = updateRaycastVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, 16);
    const capped = updateRaycastVelocity({ x: RAYCAST_MOVEMENT.maxSpeed, y: 0 }, { x: 1, y: 0 }, 100);

    expect(firstStep.x).toBeCloseTo(RAYCAST_MOVEMENT.maxSpeed);
    expect(capped.x).toBe(RAYCAST_MOVEMENT.maxSpeed);
  });

  it('keeps diagonal movement capped at max speed', () => {
    const diagonalInput = getCameraRelativeInput(1, 1, 0);
    const velocity = updateRaycastVelocity({ x: 0, y: 0 }, diagonalInput, 16);

    expect(Math.hypot(velocity.x, velocity.y)).toBeLessThanOrEqual(RAYCAST_MOVEMENT.maxSpeed + 0.0001);
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(RAYCAST_MOVEMENT.maxSpeed);
  });

  it('stops quickly when no movement input is held', () => {
    const velocity = updateRaycastVelocity({ x: RAYCAST_MOVEMENT.maxSpeed, y: 0 }, { x: 0, y: 0 }, 16);

    expect(velocity.x).toBe(0);
  });

  it('slides along walls by resolving axes independently', () => {
    const state = {
      x: 1.25,
      y: 1.25,
      angle: 0,
      velocity: { x: -4, y: 1 }
    };

    const moved = moveWithWallSlide(RAYCAST_MAP, state, 100);

    expect(moved.x).toBe(state.x);
    expect(moved.y).toBeGreaterThan(state.y);
    expect(moved.velocity.x).toBe(0);
    expect(collides(RAYCAST_MAP, moved.x, moved.y, RAYCAST_MOVEMENT.collisionRadius)).toBe(false);
  });

  it('blocks solid wall movement even with a fast frame step', () => {
    const state = {
      x: 1.35,
      y: 1.5,
      angle: 0,
      velocity: { x: -RAYCAST_MOVEMENT.maxSpeed, y: 0 }
    };

    const moved = moveWithWallSlide(RAYCAST_MAP, state, 500);

    expect(moved.x).toBeGreaterThan(1);
    expect(collides(RAYCAST_MAP, moved.x, moved.y, RAYCAST_MOVEMENT.collisionRadius)).toBe(false);
    expect(moved.velocity.x).toBe(0);
  });

  it('blocks closed doors but allows crossing opened doors', () => {
    const door = RAYCAST_LEVEL.doors[0];
    const closedDoorApproach = {
      x: door.x - 0.7,
      y: door.y,
      angle: 0,
      velocity: { x: RAYCAST_MOVEMENT.maxSpeed, y: 0 }
    };

    const blocked = moveWithWallSlide(RAYCAST_MAP, closedDoorApproach, 500);
    expect(blocked.x).toBeLessThan(door.x - RAYCAST_MOVEMENT.collisionRadius);
    expect(blocked.velocity.x).toBe(0);

    const openedMap = cloneRaycastMap(RAYCAST_MAP);
    openRaycastDoor(openedMap, door);
    const crossed = moveWithWallSlide(openedMap, closedDoorApproach, 500);

    expect(crossed.x).toBeGreaterThan(door.x + RAYCAST_MOVEMENT.collisionRadius);
    expect(collides(openedMap, crossed.x, crossed.y, RAYCAST_MOVEMENT.collisionRadius)).toBe(false);
  });

  it('uses a wide classic FPS FOV', () => {
    const fovDegrees = (RAYCAST_RENDERER_CONFIG.fovRadians * 180) / Math.PI;

    expect(fovDegrees).toBeGreaterThanOrEqual(78);
    expect(fovDegrees).toBeLessThanOrEqual(86);
  });

  it('applies configurable horizontal mouse turn without vertical aim state', () => {
    const angle = applyRaycastMouseTurn(1, 12, { mouseTurnSensitivity: 0.01 });

    expect(angle).toBeCloseTo(1.12);
  });
});
