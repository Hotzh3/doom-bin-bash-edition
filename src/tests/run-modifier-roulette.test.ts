import { describe, expect, it } from 'vitest';
import {
  applyRunModifierRankBonus,
  applyRunModifierScore,
  getRunModifierById,
  rollRunModifier,
  RUN_MODIFIER_ROULETTE
} from '../game/raycast/RunModifierRoulette';

describe('run modifier roulette', () => {
  it('defines the required eight optional modifiers', () => {
    expect(RUN_MODIFIER_ROULETTE).toHaveLength(8);
    expect(RUN_MODIFIER_ROULETTE.map((m) => m.id)).toEqual([
      'DOUBLE_DAMAGE_LOW_HP',
      'FAST_ENEMIES_MORE_SCORE',
      'NO_REGEN_HIGHER_RANK_BONUS',
      'GLASS_CANNON',
      'TREASURE_SIGNAL',
      'OVERCLOCKED',
      'HUNTER_MARK',
      'DARK_ROUTE'
    ]);
  });

  it('rolls deterministically when rng is provided', () => {
    const mod = rollRunModifier(() => 0.51);
    expect(mod.id).toBe('TREASURE_SIGNAL');
  });

  it('applies score multipliers only when modifier provides one', () => {
    const fast = getRunModifierById('FAST_ENEMIES_MORE_SCORE');
    const overclocked = getRunModifierById('OVERCLOCKED');
    expect(applyRunModifierScore(100, fast)).toBe(130);
    expect(applyRunModifierScore(100, overclocked)).toBe(100);
    expect(applyRunModifierScore(100, null)).toBe(100);
  });

  it('applies rank bonus multipliers for no-regen challenge', () => {
    const noRegen = getRunModifierById('NO_REGEN_HIGHER_RANK_BONUS');
    expect(applyRunModifierRankBonus(400, noRegen)).toBe(620);
    expect(applyRunModifierRankBonus(400, null)).toBe(400);
  });
});
