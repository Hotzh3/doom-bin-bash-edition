import { describe, expect, it } from 'vitest';
import { EnemyFSM } from '../game/systems/EnemyFSM';

describe('EnemyFSM', () => {
  it('transitions SPAWN -> CHASE -> ATTACK', () => {
    const fsm = new EnemyFSM();
    expect(fsm.update(100, true)).toBe('CHASE');
    expect(fsm.update(10, true)).toBe('ATTACK');
  });

  it('returns to CHASE when target leaves attack range', () => {
    const fsm = new EnemyFSM();
    expect(fsm.update(10, true)).toBe('ATTACK');
    expect(fsm.update(40, true)).toBe('CHASE');
  });

  it('transitions to DEAD when enemy is no longer alive', () => {
    const fsm = new EnemyFSM();
    expect(fsm.update(100, false)).toBe('DEAD');
    expect(fsm.state).toBe('DEAD');
  });
});
