export type RaycastLevelEventId =
  | 'PIXELATED_MAP'
  | 'HEAVY_FOG'
  | 'OVERCHARGE'
  | 'SIGNAL_JAM'
  | 'BLOOD_PRICE'
  | 'LOW_GRAVITY_STRAFE'
  | 'CORRUPTION_SURGE'
  | 'AMMO_FEAST'
  | 'HUNTER_PROTOCOL'
  | 'BLACKOUT_PULSE';

export interface RaycastLevelEventEffects {
  minimapPixelation?: number;
  fogDensityMultiplier?: number;
  playerDamageMultiplier?: number;
  enemySpeedMultiplier?: number;
  hudSignalJitter?: number;
  passiveHealMultiplier?: number;
  scoreMultiplier?: number;
  playerMoveMultiplier?: number;
  enemyProjectileSpeedMultiplier?: number;
  corruptionSurge?: boolean;
  ammoCadenceMultiplier?: number;
  spawnPressureMultiplier?: number;
  eliteHealthMultiplier?: number;
  eliteDamageMultiplier?: number;
  blackoutPulse?: boolean;
}

export interface RaycastLevelEventDefinition {
  id: RaycastLevelEventId;
  name: string;
  introText: string;
  hudText: string;
  objectiveText: string;
  weight: number;
  bossSafe: boolean;
  effects: RaycastLevelEventEffects;
}

export interface RaycastLevelEventSelectionInput {
  isBossLevel: boolean;
  rng?: () => number;
}

export const RAYCAST_LEVEL_EVENTS: readonly RaycastLevelEventDefinition[] = [
  {
    id: 'PIXELATED_MAP',
    name: 'Mapa Pixelado',
    introText: 'Mod de Sector // MAPA PIXELADO: el automapa está degradado e inestable.',
    hudText: 'MOD // MAPA PIXELADO',
    objectiveText: 'CLARIDAD DEL AUTOMAPA REDUCIDA',
    weight: 1,
    bossSafe: true,
    effects: { minimapPixelation: 0.55 }
  },
  {
    id: 'HEAVY_FOG',
    name: 'Niebla Densa',
    introText: 'Mod de Sector // NIEBLA DENSA: el alcance de visibilidad se reduce.',
    hudText: 'MOD // NIEBLA DENSA',
    objectiveText: 'ALCANCE VISUAL REDUCIDO',
    weight: 1,
    bossSafe: true,
    effects: { fogDensityMultiplier: 0.83 }
  },
  {
    id: 'OVERCHARGE',
    name: 'Sobrecarga',
    introText: 'Mod de Sector // SOBRECARGA: hostiles más veloces, armas con mayor daño.',
    hudText: 'MOD // SOBRECARGA',
    objectiveText: 'HOSTILES RÁPIDOS // DAÑO AUMENTADO',
    weight: 1,
    bossSafe: true,
    effects: { enemySpeedMultiplier: 1.12, playerDamageMultiplier: 1.18 }
  },
  {
    id: 'SIGNAL_JAM',
    name: 'Interferencia de Señal',
    introText: 'Mod de Sector // INTERFERENCIA: HUD y telemetría de objetivo inestables.',
    hudText: 'MOD // INTERFERENCIA',
    objectiveText: 'TELEMETRÍA RETRASADA',
    weight: 0.9,
    bossSafe: true,
    effects: { hudSignalJitter: 0.75, minimapPixelation: 0.2 }
  },
  {
    id: 'BLOOD_PRICE',
    name: 'Precio de Sangre',
    introText: 'Mod de Sector // PRECIO DE SANGRE: más puntaje a cambio de regeneración.',
    hudText: 'MOD // PRECIO DE SANGRE',
    objectiveText: 'PUNTAJE ALTO // REGEN BAJA',
    weight: 1,
    bossSafe: false,
    effects: { scoreMultiplier: 1.35, passiveHealMultiplier: 0 }
  },
  {
    id: 'LOW_GRAVITY_STRAFE',
    name: 'Estrafeo Baja Gravedad',
    introText: 'Mod de Sector // BAJA GRAVEDAD: te mueves más rápido y los disparos enemigos van más lento.',
    hudText: 'MOD // ESTRAFE BAJA-G',
    objectiveText: 'MOVILIDAD AUMENTADA',
    weight: 1,
    bossSafe: true,
    effects: { playerMoveMultiplier: 1.09, enemyProjectileSpeedMultiplier: 0.86 }
  },
  {
    id: 'CORRUPTION_SURGE',
    name: 'Oleada de Corrupción',
    introText: 'Mod de Sector // OLEADA DE CORRUPCIÓN: aparecen zonas de daño inestables.',
    hudText: 'MOD // OLEADA DE CORRUPCIÓN',
    objectiveText: 'EVITA ZONAS DE CORRUPCIÓN',
    weight: 0.9,
    bossSafe: true,
    effects: { corruptionSurge: true }
  },
  {
    id: 'AMMO_FEAST',
    name: 'Fiesta de Munición',
    introText: 'Mod de Sector // FIESTA DE MUNICIÓN: más recursos, pero sube la presión enemiga.',
    hudText: 'MOD // FIESTA DE MUNICIÓN',
    objectiveText: 'ALTO RITMO // ALTA PRESIÓN',
    weight: 1,
    bossSafe: false,
    effects: { ammoCadenceMultiplier: 1.22, spawnPressureMultiplier: 1.2 }
  },
  {
    id: 'HUNTER_PROTOCOL',
    name: 'Protocolo Cazador',
    introText: 'Mod de Sector // PROTOCOLO CAZADOR: menos hostiles, élites más fuertes.',
    hudText: 'MOD // PROTOCOLO CAZADOR',
    objectiveText: 'MENOS ENEMIGOS // ÉLITES FUERTES',
    weight: 0.9,
    bossSafe: true,
    effects: { spawnPressureMultiplier: 0.72, eliteHealthMultiplier: 1.35, eliteDamageMultiplier: 1.18 }
  },
  {
    id: 'BLACKOUT_PULSE',
    name: 'Pulso de Apagón',
    introText: 'Mod de Sector // PULSO DE APAGÓN: la oscuridad pulsa durante picos de combate.',
    hudText: 'MOD // PULSO DE APAGÓN',
    objectiveText: 'SIGUE SILUETAS EN LOS PULSOS',
    weight: 0.8,
    bossSafe: true,
    effects: { blackoutPulse: true }
  }
] as const;

export function getRaycastLevelEventPool(isBossLevel: boolean): RaycastLevelEventDefinition[] {
  if (!isBossLevel) return [...RAYCAST_LEVEL_EVENTS];
  return RAYCAST_LEVEL_EVENTS.filter((event) => event.bossSafe);
}

export function selectRaycastLevelEvent(input: RaycastLevelEventSelectionInput): RaycastLevelEventDefinition {
  const pool = getRaycastLevelEventPool(input.isBossLevel);
  const rng = input.rng ?? Math.random;
  return pickWeightedLevelEvent(pool, rng);
}

export function pickWeightedLevelEvent(
  candidates: readonly RaycastLevelEventDefinition[],
  rng: () => number
): RaycastLevelEventDefinition {
  if (candidates.length === 0) {
    throw new Error('Cannot select level event from empty candidates list');
  }
  const total = candidates.reduce((sum, event) => sum + Math.max(0, event.weight), 0);
  if (total <= 0) return candidates[0];

  let roll = Math.max(0, Math.min(0.999999, rng())) * total;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    roll -= Math.max(0, candidate.weight);
    if (roll <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

export function createSeededLevelEventRng(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) {
    state = (Math.imul(state, 31) + seed.charCodeAt(i)) >>> 0;
  }
  if (state === 0) state = 0x9e3779b9;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state >>> 8) / 0x1000000;
  };
}

export function applyRaycastEventScoreMultiplier(baseScoreGain: number, event: RaycastLevelEventDefinition): number {
  const mul = event.effects.scoreMultiplier ?? 1;
  return Math.max(0, Math.round(baseScoreGain * mul));
}
