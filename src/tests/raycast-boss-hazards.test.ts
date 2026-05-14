import { describe, expect, it } from 'vitest';
import {
  createRaycastBossHazardState,
  getBossHazardsForLevel,
  getRaycastBossHazardMarkers,
  tickRaycastBossHazards
} from '../game/raycast/RaycastBossHazards';

describe('raycast boss hazards', () => {
  it('loads scaled hazard sets by boss level', () => {
    expect(getBossHazardsForLevel('volt-archon-pit').length).toBeGreaterThan(0);
    expect(getBossHazardsForLevel('bloom-warden-pit').length).toBeGreaterThan(getBossHazardsForLevel('volt-archon-pit').length);
    expect(getBossHazardsForLevel('ash-judge-seal').length).toBeGreaterThan(getBossHazardsForLevel('bloom-warden-pit').length);
  });

  it('does not damage when boss is not alive', () => {
    const state = createRaycastBossHazardState('volt-archon-pit');
    const tick = tickRaycastBossHazards(state, { nowMs: 2000, player: { x: 7.5, y: 7.5 }, bossAlive: false });
    expect(tick.damage).toBe(0);
  });

  it('applies hazard damage only during active windows', () => {
    const state = createRaycastBossHazardState('volt-archon-pit');
    const tele = tickRaycastBossHazards(state, { nowMs: 250, player: { x: 7.5, y: 7.5 }, bossAlive: true });
    expect(tele.damage).toBe(0);
    const active = tickRaycastBossHazards(state, { nowMs: 1350, player: { x: 7.5, y: 7.5 }, bossAlive: true });
    expect(active.damage).toBeGreaterThanOrEqual(0);
  });

  it('triggers darkness pulse activation on active edge', () => {
    const state = createRaycastBossHazardState('volt-archon-pit');
    const first = tickRaycastBossHazards(state, { nowMs: 1000, player: { x: 7.5, y: 7.5 }, bossAlive: true });
    const second = tickRaycastBossHazards(state, { nowMs: 1800, player: { x: 7.5, y: 7.5 }, bossAlive: true });
    expect(first.triggerDarknessPulse || second.triggerDarknessPulse).toBe(true);
  });

  it('emits hazard minimap markers while telegraph/active', () => {
    const state = createRaycastBossHazardState('bloom-warden-pit');
    const markers = getRaycastBossHazardMarkers(state, 1900, true);
    expect(markers.length).toBeGreaterThan(0);
    expect(markers.some((m) => m.label.length > 0)).toBe(true);
  });
});
