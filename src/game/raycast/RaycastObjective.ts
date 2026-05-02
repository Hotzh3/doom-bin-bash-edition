export interface RaycastObjectiveState {
  levelComplete: boolean;
  keyCount: number;
  keyTotal: number;
  closedDoorCount: number;
  activatedTriggerCount: number;
  requiredTriggerCount: number;
  livingEnemyCount: number;
  playerStationaryMs: number;
  recentBlockedReason?: RaycastBlockedReason | null;
}

export type RaycastBlockedReason =
  | 'door-key'
  | 'exit-key'
  | 'exit-door'
  | 'exit-trigger'
  | 'exit-combat';

export function buildRaycastCurrentObjective(state: RaycastObjectiveState): string {
  if (state.levelComplete) return 'SECTOR PURGED';
  if (state.keyCount < state.keyTotal) return 'FIND KEY';
  if (state.closedDoorCount > 0) return 'OPEN DOOR';
  if (state.activatedTriggerCount < state.requiredTriggerCount || state.livingEnemyCount > 0) return 'SURVIVE AMBUSH';
  return 'REACH EXIT';
}

export function buildRaycastHintText(state: RaycastObjectiveState): string {
  if (state.levelComplete) return 'PATH CLEARED. ADVANCE OR RESET THE LOOP.';
  if (state.recentBlockedReason === 'door-key') {
    return 'TOKEN LOCKED. SWEEP THE SIDE ROUTE FOR THE MISSING SIGNAL, THEN RETURN TO THE GATE.';
  }
  if (state.recentBlockedReason === 'exit-key') {
    return 'EXFIL REFUSED. AT LEAST ONE TOKEN SIGNAL IS STILL OUT IN THE SECTOR.';
  }
  if (state.recentBlockedReason === 'exit-door') {
    return 'ROUTE STILL CHAINED. FIND THE SEALED GATE ON THE MAIN PATH AND BREACH IT.';
  }
  if (state.recentBlockedReason === 'exit-trigger') {
    return 'TRIGGER PATH INCOMPLETE. PUSH DEEPER UNTIL THE ROUTE WAKES THE FINAL BREACH.';
  }
  if (state.recentBlockedReason === 'exit-combat') {
    return 'SIGNAL JAMMED. CLEAR THE ACTIVE HOSTILES BEFORE EXTRACTION.';
  }
  if (state.playerStationaryMs >= 9000) {
    const objective = buildRaycastCurrentObjective(state);
    if (objective === 'FIND KEY') return 'STILLNESS FEEDS THE HIVE. SWEEP FOR THE TOKEN PING.';
    if (objective === 'OPEN DOOR') return 'TOKEN IN HAND. PUSH BACK TO THE SEALED GATE.';
    if (objective === 'SURVIVE AMBUSH') return 'PRESSURE RISING. BREAK THE TRAP, THEN STABILIZE THE ROUTE.';
    return 'NOISE IS A BEACON. CUT FOR THE EXIT.';
  }

  const objective = buildRaycastCurrentObjective(state);
  if (objective === 'FIND KEY') return 'FOLLOW THE OFF-PATH SIGNAL. THE TOKEN NODE OPENS THE ROUTE.';
  if (objective === 'OPEN DOOR') return 'THE SEALED GATE IS THE NEXT BREACH POINT.';
  if (objective === 'SURVIVE AMBUSH') return 'EXPECT CONTACT BEYOND THE GATE. HOLD MOMENTUM AND CLEAR THE LANE.';
  return 'EXIT NODE IS LIVE. FINISH THE ROUTE.';
}

export function buildRaycastInstructionText(minimapToggleKey = 'M'): string {
  return [
    `MOVE WASD  FIRE F/SPACE/CLICK  SWITCH 1/2/3`,
    `KEYS OPEN DOORS  MAP ${minimapToggleKey}  TAB DEBUG`
  ].join('\n');
}
