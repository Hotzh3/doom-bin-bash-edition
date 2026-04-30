import { describe, expect, it } from 'vitest';
import { selectClosestLivingTarget } from '../game/systems/TargetSelector';

describe('TargetSelector', () => {
  it('chooses the closest living target', () => {
    const origin = { x: 0, y: 0 };
    const farTarget = { id: 'far', x: 100, y: 0, alive: true };
    const nearTarget = { id: 'near', x: 10, y: 0, alive: true };

    expect(selectClosestLivingTarget(origin, [farTarget, nearTarget])).toBe(nearTarget);
  });

  it('ignores dead targets', () => {
    const origin = { x: 0, y: 0 };
    const deadNearTarget = { id: 'dead-near', x: 1, y: 0, alive: false };
    const livingFarTarget = { id: 'living-far', x: 100, y: 0, alive: true };

    expect(selectClosestLivingTarget(origin, [deadNearTarget, livingFarTarget])).toBe(livingFarTarget);
  });

  it('returns the only living target', () => {
    const origin = { x: 0, y: 0 };
    const onlyLivingTarget = { id: 'only', x: 50, y: 0, alive: true };

    expect(selectClosestLivingTarget(origin, [{ id: 'dead', x: 1, y: 0, alive: false }, onlyLivingTarget])).toBe(
      onlyLivingTarget
    );
  });

  it('returns null when no targets are alive', () => {
    const origin = { x: 0, y: 0 };

    expect(
      selectClosestLivingTarget(origin, [
        { id: 'dead-1', x: 1, y: 0, alive: false },
        { id: 'dead-2', x: 2, y: 0, alive: false }
      ])
    ).toBeNull();
  });
});
