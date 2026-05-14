import { describe, expect, it } from 'vitest';
import {
  computeEnemySwarmHealScale,
  computePassiveHealCombatScale,
  DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
  formatRaycastPassiveRegenHudLabel,
  getRaycastPassiveRegenHudState,
  tickRaycastPassiveHeal
} from '../game/raycast/RaycastPassiveHeal';
import { getRaycastDifficultyPassiveHealConfig } from '../game/raycast/RaycastDifficulty';

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
    expect(result.nextHealth).toBe(42);
    expect(result.healingThisTick).toBe(2);
    expect(result.isRegenerating).toBe(true);
    expect(result.nextFractionalCarry).toBe(0);
  });

  it('respects partial max health instead of regenerating to full', () => {
    const result = tickRaycastPassiveHeal({
      health: 69,
      nowMs: 50_000,
      lastDamageAtMs: 30_000,
      deltaMs: 5000,
      config: { ...DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG, maxHealth: 70 },
      combatScale: 1
    });
    expect(result.nextHealth).toBe(70);
    expect(result.nextHealth).toBeLessThan(100);
  });

  it('varies passive regen by difficulty', () => {
    const standard = getRaycastDifficultyPassiveHealConfig('standard');
    const hard = getRaycastDifficultyPassiveHealConfig('hard');
    const assist = getRaycastDifficultyPassiveHealConfig('assist');

    expect(assist.maxHealth).toBeGreaterThan(standard.maxHealth);
    expect(standard.maxHealth).toBeGreaterThan(hard.maxHealth);
    expect(assist.healPerSecond).toBeGreaterThan(standard.healPerSecond);
    expect(hard.delayAfterDamageMs).toBeGreaterThan(standard.delayAfterDamageMs);
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

  it('accumulates fractional passive regen but only applies whole HP', () => {
    const first = tickRaycastPassiveHeal({
      health: 71,
      nowMs: 20_000,
      lastDamageAtMs: 10_000,
      deltaMs: 200,
      config: DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
      combatScale: 1,
      fractionalCarry: 0
    });
    expect(first.nextHealth).toBe(71);
    expect(first.healingThisTick).toBe(0);
    expect(first.nextFractionalCarry).toBeCloseTo(0.4, 5);

    const second = tickRaycastPassiveHeal({
      health: first.nextHealth,
      nowMs: 20_200,
      lastDamageAtMs: 10_000,
      deltaMs: 300,
      config: DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG,
      combatScale: 1,
      fractionalCarry: first.nextFractionalCarry
    });
    expect(second.nextHealth).toBe(72);
    expect(second.healingThisTick).toBe(1);
    expect(second.nextFractionalCarry).toBeCloseTo(0, 5);
  });

  it('reports HUD state for waiting, blocked, active, and capped regen', () => {
    const config = { ...DEFAULT_RAYCAST_PASSIVE_HEAL_CONFIG, maxHealth: 70 };

    expect(
      formatRaycastPassiveRegenHudLabel(
        getRaycastPassiveRegenHudState({
          health: 42,
          nowMs: 12_000,
          lastDamageAtMs: 10_000,
          config,
          combatScale: 1,
          isRegenerating: false
        })
      )
    ).toBe('REGEN WAIT');

    expect(
      formatRaycastPassiveRegenHudLabel(
        getRaycastPassiveRegenHudState({
          health: 42,
          nowMs: 20_000,
          lastDamageAtMs: 10_000,
          config,
          combatScale: 0,
          isRegenerating: false
        })
      )
    ).toBe('REGEN LOCK');

    expect(
      formatRaycastPassiveRegenHudLabel(
        getRaycastPassiveRegenHudState({
          health: 42,
          nowMs: 20_000,
          lastDamageAtMs: 10_000,
          config,
          combatScale: 1,
          isRegenerating: true
        })
      )
    ).toBe('REGEN');

    expect(
      formatRaycastPassiveRegenHudLabel(
        getRaycastPassiveRegenHudState({
          health: 70,
          nowMs: 20_000,
          lastDamageAtMs: 10_000,
          config,
          combatScale: 1,
          isRegenerating: false
        })
      )
    ).toBeNull();
  });
});
