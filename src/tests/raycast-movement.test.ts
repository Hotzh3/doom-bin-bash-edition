import { describe, expect, it } from 'vitest';
import { RAYCAST_MAP } from '../game/raycast/RaycastMap';
import {
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
    expect(strafe.y).toBeCloseTo(1);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1);
  });

  it('accelerates and caps raycast velocity using shared arcade movement', () => {
    const firstStep = updateRaycastVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, 16);
    const capped = updateRaycastVelocity({ x: RAYCAST_MOVEMENT.maxSpeed, y: 0 }, { x: 1, y: 0 }, 100);

    expect(firstStep.x).toBeGreaterThan(0);
    expect(firstStep.x).toBeLessThan(RAYCAST_MOVEMENT.maxSpeed);
    expect(capped.x).toBe(RAYCAST_MOVEMENT.maxSpeed);
  });

  it('applies friction when no movement input is held', () => {
    const velocity = updateRaycastVelocity({ x: 2, y: 0 }, { x: 0, y: 0 }, 16);

    expect(velocity.x).toBeLessThan(2);
    expect(velocity.x).toBeGreaterThan(0);
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
  });
});
