import { describe, expect, it } from 'vitest';
import { calculateArcadeVelocity, DOOMLIKE_PLAYER_MOVEMENT, normalizeMovementInput } from '../game/systems/MovementSystem';

describe('MovementSystem', () => {
  it('normalizes diagonal movement input', () => {
    const diagonal = normalizeMovementInput({ x: 1, y: 1 });

    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1);
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2);
    expect(diagonal.y).toBeCloseTo(Math.SQRT1_2);
  });

  it('accelerates toward max speed without snapping instantly', () => {
    const velocity = calculateArcadeVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, 16);

    expect(velocity.x).toBeGreaterThan(0);
    expect(velocity.x).toBeLessThan(DOOMLIKE_PLAYER_MOVEMENT.maxSpeed);
    expect(velocity.y).toBe(0);
  });

  it('caps sustained movement at configured max speed', () => {
    const velocity = calculateArcadeVelocity(
      { x: DOOMLIKE_PLAYER_MOVEMENT.maxSpeed - 4, y: 0 },
      { x: 1, y: 0 },
      100
    );

    expect(velocity.x).toBe(DOOMLIKE_PLAYER_MOVEMENT.maxSpeed);
  });

  it('uses friction to slow the player when input is released', () => {
    const velocity = calculateArcadeVelocity({ x: 250, y: 0 }, { x: 0, y: 0 }, 16);

    expect(velocity.x).toBeLessThan(250);
    expect(velocity.x).toBeGreaterThan(0);
  });

  it('allows fast direction changes without exceeding max speed', () => {
    const velocity = calculateArcadeVelocity(
      { x: DOOMLIKE_PLAYER_MOVEMENT.maxSpeed, y: 0 },
      { x: -1, y: 0 },
      100
    );

    expect(Math.abs(velocity.x)).toBeLessThanOrEqual(DOOMLIKE_PLAYER_MOVEMENT.maxSpeed);
    expect(velocity.x).toBeLessThan(DOOMLIKE_PLAYER_MOVEMENT.maxSpeed);
  });
});
