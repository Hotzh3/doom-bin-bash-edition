import { describe, expect, it } from 'vitest';
import {
  accumulateRoamStuck,
  pickOpenRoamHeading,
  RAYCAST_ROAM_PROBE
} from '../game/raycast/RaycastEnemyRoam';
import { RAYCAST_MAP } from '../game/raycast/RaycastMap';
import { collides } from '../game/raycast/RaycastMovement';

describe('raycast enemy roam helpers', () => {
  it('picks a heading where the probe step stays on empty floor', () => {
    const rng = (() => {
      let i = 0;
      const values = [0.01, 0.99, 0.42];
      return () => {
        const v = values[i % values.length];
        i += 1;
        return v;
      };
    })();

    const angle = pickOpenRoamHeading(RAYCAST_MAP, 1.5, 7.5, 0.28, rng);
    const px = 1.5 + Math.cos(angle) * RAYCAST_ROAM_PROBE;
    const py = 7.5 + Math.sin(angle) * RAYCAST_ROAM_PROBE;
    expect(collides(RAYCAST_MAP, px, py, 0.28)).toBe(false);
  });

  it('accumulates stuck time only when movement is negligible', () => {
    expect(accumulateRoamStuck(0, 16, 0)).toBeGreaterThan(0);
    expect(accumulateRoamStuck(0.2, 16, 500)).toBeLessThan(500);
  });
});
