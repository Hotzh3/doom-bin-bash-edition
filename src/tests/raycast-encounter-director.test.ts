import { describe, expect, it } from 'vitest';
import { RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';
import {
  buildSyntheticBossLateralBinding,
  selectRaycastEncounterPatternBinding
} from '../game/raycast/RaycastEncounterDirector';

describe('raycast encounter director', () => {
  it('selects a binding when zone, state, cooldown, and health allow', () => {
    const cd = new Map<string, number>();
    const rule = selectRaycastEncounterPatternBinding(
      RAYCAST_LEVEL,
      'combat-arena',
      'PRESSURE',
      10_000,
      80,
      cd
    );
    expect(rule?.patternId).toBe('arena_lockdown');
    expect(rule?.id).toBe('combat-arena-lockdown');
  });

  it('respects per-binding cooldown', () => {
    const cd = new Map<string, number>([['combat-arena-lockdown', 20_000]]);
    expect(
      selectRaycastEncounterPatternBinding(RAYCAST_LEVEL, 'combat-arena', 'PRESSURE', 15_000, 80, cd)
    ).toBeNull();
    expect(
      selectRaycastEncounterPatternBinding(RAYCAST_LEVEL, 'combat-arena', 'PRESSURE', 21_000, 80, cd)
    ).not.toBeNull();
  });

  it('skips patterns when player health is critically low', () => {
    const cd = new Map<string, number>();
    expect(
      selectRaycastEncounterPatternBinding(RAYCAST_LEVEL, 'combat-arena', 'PRESSURE', 0, 20, cd)
    ).toBeNull();
  });

  it('skips when binding maxPlayerHealthToSkip would exclude the player', () => {
    const cd = new Map<string, number>();
    expect(
      selectRaycastEncounterPatternBinding(RAYCAST_LEVEL, 'combat-arena', 'PRESSURE', 0, 18, cd)
    ).toBeNull();
    expect(
      selectRaycastEncounterPatternBinding(RAYCAST_LEVEL, 'combat-arena', 'PRESSURE', 0, 30, cd)
    ).not.toBeNull();
  });

  it('does not match CALM director state', () => {
    const cd = new Map<string, number>();
    expect(
      selectRaycastEncounterPatternBinding(RAYCAST_LEVEL, 'combat-arena', 'CALM', 0, 80, cd)
    ).toBeNull();
  });

  it('builds synthetic boss lateral binding for flank pressure', () => {
    const b = buildSyntheticBossLateralBinding(9000);
    expect(b.patternId).toBe('flank_pressure');
    expect(b.id).toBe('boss-lateral-lane');
    expect(b.cooldownMs).toBe(9000);
  });
});
