import { describe, expect, it } from 'vitest';
import {
  accumulateRoamStuck,
  pickOpenRoamHeading,
  pickOpenRoamHeadingToward,
  pickPatrolRetargetNearHome,
  RAYCAST_ROAM_PROBE
} from '../game/raycast/RaycastEnemyRoam';
import { RAYCAST_MAP, type RaycastMap } from '../game/raycast/RaycastMap';
import { collides } from '../game/raycast/RaycastMovement';

const OPEN_BOX_MAP: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
  ]
};

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

  it('biases roam probes toward a goal while keeping probes on walkable floor', () => {
    const angle = pickOpenRoamHeadingToward(RAYCAST_MAP, 1.5, 7.5, 0.28, 4.5, 7.5);
    const px = 1.5 + Math.cos(angle) * RAYCAST_ROAM_PROBE;
    const py = 7.5 + Math.sin(angle) * RAYCAST_ROAM_PROBE;
    expect(collides(RAYCAST_MAP, px, py, 0.28)).toBe(false);
    expect(Math.cos(angle)).toBeGreaterThan(0.15);
  });

  it('finds a patrol retarget near home on open floor', () => {
    let i = 0;
    const vals = [0.05, 0.82, 0.31, 0.67, 0.44, 0.91, 0.12, 0.55];
    const p = pickPatrolRetargetNearHome(OPEN_BOX_MAP, 3.5, 3.5, 0.22, () => vals[i++ % vals.length]);
    expect(collides(OPEN_BOX_MAP, p.x, p.y, 0.22)).toBe(false);
    expect(Math.hypot(p.x - 3.5, p.y - 3.5)).toBeGreaterThan(0.05);
  });
});
