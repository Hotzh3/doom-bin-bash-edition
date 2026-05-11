/**
 * Authored tension hooks — HUD / overlay / audio only (no cinematics, no renderer rewrite).
 * Wired from {@link RaycastEncounterBeat.setpieceCue} and {@link RaycastTrigger.setpieceCue}.
 */
export type RaycastSetpieceCue =
  | 'BLACKOUT_PULSE'
  | 'ALARM_SURGE'
  | 'RITUAL_PULSE'
  | 'FAKE_CALM'
  | 'CORRIDOR_HUNT'
  | 'ARENA_LOCKDOWN';

export const RAYCAST_SETPIECE_CUES: readonly RaycastSetpieceCue[] = [
  'BLACKOUT_PULSE',
  'ALARM_SURGE',
  'RITUAL_PULSE',
  'FAKE_CALM',
  'CORRIDOR_HUNT',
  'ARENA_LOCKDOWN'
];

export function isRaycastSetpieceCue(value: unknown): value is RaycastSetpieceCue {
  return typeof value === 'string' && RAYCAST_SETPIECE_CUES.includes(value as RaycastSetpieceCue);
}

/** Short labels for docs / debug — not shown in HUD verbatim. */
export const RAYCAST_SETPIECE_CUE_SUMMARY: Record<RaycastSetpieceCue, string> = {
  BLACKOUT_PULSE: 'Brief veil crush + cold flash — player loses sight for a beat.',
  ALARM_SURGE: 'Staggered warning audio + crimson pulses — breach/alarm fantasy.',
  RITUAL_PULSE: 'Heavy corrupt bloom + low sting — vault / ritual chamber.',
  FAKE_CALM: 'Soft recovery-colored pulse — suggests safety before the next spike.',
  CORRIDOR_HUNT: 'Tight amber denial ping — hunted corridor / ridge chase.',
  ARENA_LOCKDOWN: 'Crimson frame + surge sting — space feels sealed for a beat.'
};
