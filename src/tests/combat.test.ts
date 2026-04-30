import { describe, expect, it } from 'vitest';
import { applyDamage } from '../game/systems/CombatSystem';

describe('CombatSystem', () => {
  it('reduces health and marks dead at zero', () => {
    const target = { health: 15, alive: true };
    const dead = applyDamage(target, 20);
    expect(dead).toBe(true);
    expect(target.health).toBe(0);
    expect(target.alive).toBe(false);
  });
});
