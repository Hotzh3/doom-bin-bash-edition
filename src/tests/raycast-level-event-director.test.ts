import { describe, expect, it } from 'vitest';
import {
  applyRaycastEventScoreMultiplier,
  getRaycastLevelEventPool,
  pickWeightedLevelEvent,
  RAYCAST_LEVEL_EVENTS,
  selectRaycastLevelEvent
} from '../game/raycast/RaycastLevelEventDirector';

describe('raycast level event director', () => {
  it('contains the ten authored level events', () => {
    expect(RAYCAST_LEVEL_EVENTS).toHaveLength(10);
  });

  it('filters boss pool to safe events only', () => {
    const bossPool = getRaycastLevelEventPool(true);
    expect(bossPool.length).toBeGreaterThan(0);
    expect(bossPool.every((event) => event.bossSafe)).toBe(true);
    expect(bossPool.some((event) => event.id === 'BLOOD_PRICE')).toBe(false);
    expect(bossPool.some((event) => event.id === 'AMMO_FEAST')).toBe(false);
  });

  it('selects deterministic weighted events with provided rng', () => {
    const pick = pickWeightedLevelEvent(
      [
        { ...RAYCAST_LEVEL_EVENTS[0], weight: 0.1 },
        { ...RAYCAST_LEVEL_EVENTS[1], weight: 99 }
      ],
      () => 0.3
    );
    expect(pick.id).toBe('HEAVY_FOG');
  });

  it('returns a valid event for boss and non-boss selections', () => {
    const bossEvent = selectRaycastLevelEvent({ isBossLevel: true, rng: () => 0.2 });
    const normalEvent = selectRaycastLevelEvent({ isBossLevel: false, rng: () => 0.2 });

    expect(getRaycastLevelEventPool(true).map((event) => event.id)).toContain(bossEvent.id);
    expect(RAYCAST_LEVEL_EVENTS.map((event) => event.id)).toContain(normalEvent.id);
  });

  it('applies event score multipliers', () => {
    const bloodPrice = RAYCAST_LEVEL_EVENTS.find((event) => event.id === 'BLOOD_PRICE');
    expect(bloodPrice).toBeDefined();
    expect(applyRaycastEventScoreMultiplier(100, bloodPrice!)).toBe(135);
  });
});
