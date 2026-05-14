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
    name: 'Pixelated Map',
    introText: 'Sector Mod // PIXELATED MAP: automap feed degraded and unstable.',
    hudText: 'MOD // PIXELATED MAP',
    objectiveText: 'AUTOMAP CLARITY REDUCED',
    weight: 1,
    bossSafe: true,
    effects: { minimapPixelation: 0.55 }
  },
  {
    id: 'HEAVY_FOG',
    name: 'Heavy Fog',
    introText: 'Sector Mod // HEAVY FOG: visibility range is compressed.',
    hudText: 'MOD // HEAVY FOG',
    objectiveText: 'VISUAL RANGE REDUCED',
    weight: 1,
    bossSafe: true,
    effects: { fogDensityMultiplier: 0.83 }
  },
  {
    id: 'OVERCHARGE',
    name: 'Overcharge',
    introText: 'Sector Mod // OVERCHARGE: hostiles sprint faster, your weapons hit harder.',
    hudText: 'MOD // OVERCHARGE',
    objectiveText: 'FAST HOSTILES // BOOSTED DAMAGE',
    weight: 1,
    bossSafe: true,
    effects: { enemySpeedMultiplier: 1.12, playerDamageMultiplier: 1.18 }
  },
  {
    id: 'SIGNAL_JAM',
    name: 'Signal Jam',
    introText: 'Sector Mod // SIGNAL JAM: HUD and objective telemetry are noisy.',
    hudText: 'MOD // SIGNAL JAM',
    objectiveText: 'TELEMETRY DELAYED',
    weight: 0.9,
    bossSafe: true,
    effects: { hudSignalJitter: 0.75, minimapPixelation: 0.2 }
  },
  {
    id: 'BLOOD_PRICE',
    name: 'Blood Price',
    introText: 'Sector Mod // BLOOD PRICE: bonus score routing at the cost of regeneration.',
    hudText: 'MOD // BLOOD PRICE',
    objectiveText: 'HIGH SCORE // LOW REGEN',
    weight: 1,
    bossSafe: false,
    effects: { scoreMultiplier: 1.35, passiveHealMultiplier: 0 }
  },
  {
    id: 'LOW_GRAVITY_STRAFE',
    name: 'Low Gravity Strafe',
    introText: 'Sector Mod // LOW GRAVITY STRAFE: your movement is quicker, hostile shots drift slower.',
    hudText: 'MOD // LOW-G STRAFE',
    objectiveText: 'MOBILITY BOOSTED',
    weight: 1,
    bossSafe: true,
    effects: { playerMoveMultiplier: 1.09, enemyProjectileSpeedMultiplier: 0.86 }
  },
  {
    id: 'CORRUPTION_SURGE',
    name: 'Corruption Surge',
    introText: 'Sector Mod // CORRUPTION SURGE: unstable damage zones intermittently emerge.',
    hudText: 'MOD // CORRUPTION SURGE',
    objectiveText: 'AVOID CORRUPTION ZONES',
    weight: 0.9,
    bossSafe: true,
    effects: { corruptionSurge: true }
  },
  {
    id: 'AMMO_FEAST',
    name: 'Ammo Feast',
    introText: 'Sector Mod // AMMO FEAST: weapon feed is richer, but hostile pressure rises.',
    hudText: 'MOD // AMMO FEAST',
    objectiveText: 'HIGH CADENCE // HIGH PRESSURE',
    weight: 1,
    bossSafe: false,
    effects: { ammoCadenceMultiplier: 1.22, spawnPressureMultiplier: 1.2 }
  },
  {
    id: 'HUNTER_PROTOCOL',
    name: 'Hunter Protocol',
    introText: 'Sector Mod // HUNTER PROTOCOL: fewer hostiles, but elite units are reinforced.',
    hudText: 'MOD // HUNTER PROTOCOL',
    objectiveText: 'LOW COUNT // STRONG ELITES',
    weight: 0.9,
    bossSafe: true,
    effects: { spawnPressureMultiplier: 0.72, eliteHealthMultiplier: 1.35, eliteDamageMultiplier: 1.18 }
  },
  {
    id: 'BLACKOUT_PULSE',
    name: 'Blackout Pulse',
    introText: 'Sector Mod // BLACKOUT PULSE: darkness pulses when combat pressure spikes.',
    hudText: 'MOD // BLACKOUT PULSE',
    objectiveText: 'TRACK SILHOUETTES IN PULSES',
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
