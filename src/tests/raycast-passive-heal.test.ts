import { describe, expect, it } from 'vitest';
import {
  computeEnemySwarmHealScale,
  computePassiveHealCombatScale,
  DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
  tickRaycastPassiveHeal
} from '../game/raycast/RaycastPassiveHeal';

describe('raycast passive heal', () => {
  it('does not heal until the delay after damage has passed', () => {
    const result = tickRaycastPassiveHeal({
      health: 40,
      nowMs: 9000,
      lastDamageAtMs: 6000,
      deltaMs: 16,
      config: DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
      combatScale: 1
    });
    expect(result.nextHealth).toBe(40);
    expect(result.isRegenerating).toBe(false);
  });

  it('heals over time after the delay when combat allows', () => {
    const result = tickRaycastPassiveHeal({
      health: 40,
      nowMs: 20_000,
      lastDamageAtMs: 10_000,
      deltaMs: 1000,
      config: DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
      combatScale: 1
    });
    expect(result.nextHealth).toBeGreaterThan(40);
    expect(result.healingThisTick).toBeCloseTo(2, 5);
    expect(result.isRegenerating).toBe(true);
  });

  it('respects max health', () => {
    const result = tickRaycastPassiveHeal({
      health: 99.9,
      nowMs: 50_000,
      lastDamageAtMs: 30_000,
      deltaMs: 5000,
      config: DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
      combatScale: 1
    });
    expect(result.nextHealth).toBeLessThanOrEqual(100);
  });

  it('suppresses healing during director pressure', () => {
    expect(computePassiveHealCombatScale('PRESSURE', 5)).toBe(0);
    expect(computePassiveHealCombatScale('AMBUSH', 4)).toBe(0);
    expect(computePassiveHealCombatScale('WARNING', 3)).toBeGreaterThan(0);
  });

  it('suppresses healing when many enemies are alive', () => {
    expect(computeEnemySwarmHealScale(0)).toBe(1);
    expect(computeEnemySwarmHealScale(4)).toBe(0);
  });
});
