import { describe, expect, it } from 'vitest';
import { applyDamage } from '../game/systems/CombatSystem';

describe('CombatSystem', () => {
  it('reduces health without killing when damage is not lethal', () => {
    const target = { health: 15, alive: true };
    const dead = applyDamage(target, 5);

    expect(dead).toBe(false);
    expect(target.health).toBe(10);
    expect(target.alive).toBe(true);
  });

  it('reduces health and marks dead at zero', () => {
    const target = { health: 15, alive: true };
    const dead = applyDamage(target, 20);
    expect(dead).toBe(true);
    expect(target.health).toBe(0);
    expect(target.alive).toBe(false);
  });

  it('does not damage targets that are already dead', () => {
    const target = { health: 10, alive: false };
    const dead = applyDamage(target, 5);

    expect(dead).toBe(false);
    expect(target.health).toBe(10);
    expect(target.alive).toBe(false);
  });
});
