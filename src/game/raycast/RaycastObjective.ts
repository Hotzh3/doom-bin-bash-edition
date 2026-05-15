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

/** Optional per-sector copy for the main OBJECTIVE line — canonical codes stay unchanged for logic. */
export interface RaycastHudObjectiveLabels {
  findKey?: string;
  openDoor?: string;
  surviveAmbush?: string;
  reachExit?: string;
  sectorPurged?: string;
}

export function formatRaycastObjectiveHudLabel(
  canonical: string,
  labels?: RaycastHudObjectiveLabels | null
): string {
  if (!labels) return canonical;
  switch (canonical) {
    case 'FIND KEY':
      return labels.findKey ?? 'BUSCA LA LLAVE';
    case 'OPEN DOOR':
      return labels.openDoor ?? 'ABRE LA PUERTA';
    case 'SURVIVE AMBUSH':
      return labels.surviveAmbush ?? 'SOBREVIVE LA EMBOSCADA';
    case 'REACH EXIT':
      return labels.reachExit ?? 'LLEGA A LA SALIDA';
    case 'SECTOR PURGED':
      return labels.sectorPurged ?? 'SECTOR PURGADO';
    default:
      return canonical;
  }
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
  if (state.levelComplete) return 'RUTA LIBERADA. AVANZA O REINICIA EL CICLO.';
  if (state.recentBlockedReason === 'door-key') {
    return 'FALTA LA LLAVE. PEINA LA RUTA LATERAL Y REGRESA A LA PUERTA.';
  }
  if (state.recentBlockedReason === 'exit-key') {
    return 'EXTRACCIÓN BLOQUEADA. AÚN FALTA AL MENOS UNA LLAVE EN EL SECTOR.';
  }
  if (state.recentBlockedReason === 'exit-door') {
    return 'RUTA BLOQUEADA. UBICA LA PUERTA SELLADA Y ÁBRELA.';
  }
  if (state.recentBlockedReason === 'exit-trigger') {
    return 'FALTA ACTIVAR EVENTOS. EMPUJA MÁS ADENTRO HASTA ABRIR LA BRECHA FINAL.';
  }
  if (state.recentBlockedReason === 'exit-combat') {
    return 'SEÑAL BLOQUEADA. ELIMINA HOSTILES ACTIVOS ANTES DE EXTRAER.';
  }
  if (state.playerStationaryMs >= 9000) {
    const objective = buildRaycastCurrentObjective(state);
    if (objective === 'FIND KEY') return 'NO TE QUEDES QUIETO. BUSCA LA SEÑAL DE LA LLAVE.';
    if (objective === 'OPEN DOOR') return 'YA TIENES LA LLAVE. REGRESA A LA PUERTA SELLADA.';
    if (objective === 'SURVIVE AMBUSH') return 'SUBE LA PRESIÓN. ROMPE LA TRAMPA Y ESTABILIZA LA RUTA.';
    return 'NO TE DETENGAS. CORTA HACIA LA SALIDA.';
  }

  const objective = buildRaycastCurrentObjective(state);
  if (objective === 'FIND KEY') return 'SIGUE LA SEÑAL FUERA DE RUTA. LA LLAVE ABRE EL CAMINO.';
  if (objective === 'OPEN DOOR') return 'LA PUERTA SELLADA ES TU SIGUIENTE OBJETIVO.';
  if (objective === 'SURVIVE AMBUSH') return 'VIENE CONTACTO DESPUÉS DE LA PUERTA. MANTÉN RITMO Y LIMPIA EL PASILLO.';
  return 'LA SALIDA ESTÁ ACTIVA. CIERRA LA RUTA.';
}

export function buildRaycastInstructionText(minimapToggleKey = 'M'): string {
  return [
    `MOVER WASD  GIRAR MOUSE/QE/FLECHAS  DISPARAR F/ESPACIO/CLICK  ARMAS 1/2/3`,
    `INTERACTUAR CAMINA A PUERTAS/SALIDAS  MAPA ${minimapToggleKey}  H/? AYUDA  TAB DEBUG`
  ].join('\n');
}
