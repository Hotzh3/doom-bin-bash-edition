import type { DirectorState } from '../systems/DirectorState';
import type { RaycastEncounterPatternBinding, RaycastLevel } from './RaycastLevel';

const DEFAULT_DIRECTOR_STATES: DirectorState[] = ['PRESSURE', 'AMBUSH'];

export function selectRaycastEncounterPatternBinding(
  level: RaycastLevel,
  activeZoneId: string | null,
  directorState: DirectorState,
  nowMs: number,
  playerHealth: number,
  cooldownUntilById: ReadonlyMap<string, number>
): RaycastEncounterPatternBinding | null {
  const bindings = level.encounterPatternBindings;
  if (!bindings?.length || !activeZoneId) return null;
  if (playerHealth <= 22) return null;

  for (const rule of bindings) {
    if (rule.zoneId !== activeZoneId) continue;
    const states = rule.directorStates ?? DEFAULT_DIRECTOR_STATES;
    if (!states.includes(directorState)) continue;
    if (nowMs < (cooldownUntilById.get(rule.id) ?? 0)) continue;
    const skipCeil = rule.maxPlayerHealthToSkip;
    if (skipCeil !== undefined && playerHealth <= skipCeil) continue;
    return rule;
  }
  return null;
}

export function buildSyntheticBossLateralBinding(cooldownMs: number): RaycastEncounterPatternBinding {
  return {
    id: 'boss-lateral-lane',
    zoneId: '__boss_arena__',
    patternId: 'flank_pressure',
    cooldownMs,
    directorStates: ['PRESSURE', 'AMBUSH'],
    maxPlayerHealthToSkip: 28
  };
}
