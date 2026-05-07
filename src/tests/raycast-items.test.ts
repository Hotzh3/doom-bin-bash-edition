import { describe, expect, it } from 'vitest';
import {
  applyRaycastHealthPickup,
  buildRaycastLowHealthHint,
  RAYCAST_PLAYER_MAX_HEALTH
} from '../game/raycast/RaycastItems';
import { getRaycastDifficultyHealthPickup } from '../game/raycast/RaycastDifficulty';
import { RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';

describe('raycast items', () => {
  it('restores a limited amount and caps at max health', () => {
    expect(
      applyRaycastHealthPickup(55, {
        restoreAmount: 20
      })
    ).toEqual({
      nextHealth: 75,
      restored: 20,
      consumed: true
    });

    expect(
      applyRaycastHealthPickup(90, {
        restoreAmount: 30
      })
    ).toEqual({
      nextHealth: RAYCAST_PLAYER_MAX_HEALTH,
      restored: 10,
      consumed: true
    });
  });

  it('does not consume a pickup when the player is already fully healthy', () => {
    expect(
      applyRaycastHealthPickup(100, {
        restoreAmount: 20
      })
    ).toEqual({
      nextHealth: 100,
      restored: 0,
      consumed: false
    });
  });

  it('builds contextual low-health hints from pickup availability', () => {
    expect(buildRaycastLowHealthHint(4, 18)).toBe('CRITICAL HEALTH. REPAIR CELL NEARBY, TAKE IT NOW.');
    expect(buildRaycastLowHealthHint(9, 42)).toBe('LOW HEALTH. SCAN FOR A REPAIR CELL AND AVOID TRADING DAMAGE.');
    expect(buildRaycastLowHealthHint(null, 80)).toBeNull();
  });

  it('defines explicit heal pickup metadata for authored levels', () => {
    expect(RAYCAST_LEVEL.healthPickups.length).toBeGreaterThanOrEqual(2);
    expect(RAYCAST_LEVEL.healthPickups[0]).toMatchObject({
      kind: 'repair-cell',
      restoreAmount: 20,
      billboardLabel: 'CELL'
    });
    expect(RAYCAST_LEVEL.healthPickups[1]).toMatchObject({
      kind: 'health-pack',
      restoreAmount: 30,
      billboardLabel: 'PATCH'
    });
    expect(RAYCAST_LEVEL.healthPickups.some((p) => p.id === 'east-buffer-patch')).toBe(true);
    expect(RAYCAST_LEVEL.healthPickups.some((p) => p.id === 'south-repair-node')).toBe(true);
  });

  it('integrates difficulty-scaled pickup values without breaking healing caps', () => {
    expect(
      applyRaycastHealthPickup(55, getRaycastDifficultyHealthPickup({ restoreAmount: 20 }, 'assist'))
    ).toEqual({
      nextHealth: 80,
      restored: 25,
      consumed: true
    });

    expect(
      applyRaycastHealthPickup(82, getRaycastDifficultyHealthPickup({ restoreAmount: 20 }, 'hard'))
    ).toEqual({
      nextHealth: 100,
      restored: 18,
      consumed: true
    });
  });
});
