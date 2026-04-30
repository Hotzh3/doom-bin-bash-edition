import { describe, expect, it } from 'vitest';
import { EnemyFSM } from '../game/systems/EnemyFSM';

describe('EnemyFSM', () => {
  it('transitions SPAWN -> CHASE -> ATTACK', () => {
    const fsm = new EnemyFSM();
    expect(fsm.update(100, true)).toBe('CHASE');
    expect(fsm.update(10, true)).toBe('ATTACK');
  });
});
