import type { DirectorState } from '../systems/DirectorState';

export interface RaycastAtmosphereRenderOptions {
  ambientDarkness: number;
  fogStart: number;
  fogEnd: number;
  fogColor: number;
  corruptionTint: number;
  corruptionAlpha: number;
  pulseAlpha: number;
  enemyMinVisibility: number;
}

export const RAYCAST_ATMOSPHERE = {
  voidColor: 0x000207,
  floorColor: 0x03070d,
  fogColor: 0x00030a,
  corruptionTint: 0x46102f,
  criticalTint: 0x6f0f1f,
  muzzleFlash: 0xfff29e,
  damageFlash: 0xff2348,
  projectileHalo: 0xfff0a8,
  pickupHalo: 0x9feee2,
  enemyOutline: 0x070a10,
  hudPanel: '#03070dcc',
  debugText: '#6ca99f',
  systemText: '#9feee2',
  warningText: '#ff5b6f',
  keyText: '#fff0c2',
  wallColors: {
    1: 0x26344d,
    2: 0x6d1f37,
    3: 0x0f6d67,
    4: 0xaa5a2a
  },
  wallPatternColors: {
    1: 0x5f7190,
    2: 0xff5b6f,
    3: 0x9feee2,
    4: 0xffc36b
  },
  sectorDarkness: {
    1: 0.82,
    2: 0.68,
    3: 0.76,
    4: 1.0
  },
  messages: {
    intro: 'TERMINAL CORRUPTION HELL ARENA',
    idle: 'SYSTEM WATCHES',
    locked: 'ACCESS DENIED',
    key: 'ACCESS TOKEN CAPTURED',
    doorOpen: 'GATEWAY DECRYPTED',
    trigger: 'AMBUSH PROTOCOL RELEASED',
    pressure: 'CORRUPTION PRESSURE RISING',
    surge: 'HOSTILE SYSTEM SURGE',
    recovery: 'SYSTEM RECEDES',
    spawn: 'HOSTILE PROCESS SPAWNED',
    damage: 'SIGNAL DEGRADED',
    kill: 'PROCESS TERMINATED',
    secret: 'HIDDEN NODE DISCOVERED',
    exit: 'CORRUPTION NODE CLEARED',
    critical: 'CRITICAL BODY STATE'
  }
} as const;

export function getAtmosphereForDirector(state: DirectorState | null, intensity: number): RaycastAtmosphereRenderOptions {
  const pressure = Math.max(0, Math.min(1, intensity / 5));

  if (state === 'HIGH_INTENSITY') {
    return {
      ambientDarkness: 0.29 + pressure * 0.05,
      fogStart: 3.2,
      fogEnd: 8.2,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.criticalTint,
      corruptionAlpha: 0.11 + pressure * 0.06,
      pulseAlpha: 0.12 + pressure * 0.08,
      enemyMinVisibility: 0.66
    };
  }

  if (state === 'AMBUSH') {
    return {
      ambientDarkness: 0.28 + pressure * 0.04,
      fogStart: 3.4,
      fogEnd: 8.6,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
      corruptionAlpha: 0.09 + pressure * 0.055,
      pulseAlpha: 0.1 + pressure * 0.055,
      enemyMinVisibility: 0.64
    };
  }

  if (state === 'BUILD_UP') {
    return {
      ambientDarkness: 0.27 + pressure * 0.035,
      fogStart: 3.6,
      fogEnd: 8.8,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
      corruptionAlpha: 0.055 + pressure * 0.045,
      pulseAlpha: 0.045 + pressure * 0.04,
      enemyMinVisibility: 0.6
    };
  }

  if (state === 'RECOVERY') {
    return {
      ambientDarkness: 0.23,
      fogStart: 5.4,
      fogEnd: 11.8,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
      corruptionAlpha: 0.026,
      pulseAlpha: 0.018,
      enemyMinVisibility: 0.58
    };
  }

  return {
    ambientDarkness: 0.265,
    fogStart: 3.9,
    fogEnd: 9.6,
    fogColor: RAYCAST_ATMOSPHERE.fogColor,
    corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
    corruptionAlpha: 0.038 + pressure * 0.025,
    pulseAlpha: 0.022 + pressure * 0.018,
    enemyMinVisibility: 0.58
  };
}

export function calculateFogShade(distance: number, options: RaycastAtmosphereRenderOptions): number {
  const fogRange = Math.max(0.001, options.fogEnd - options.fogStart);
  const fogAmount = Math.max(0, Math.min(1, (distance - options.fogStart) / fogRange));
  return Math.max(options.ambientDarkness, 1 - fogAmount);
}

export function calculateEnemyVisibility(distance: number, options: RaycastAtmosphereRenderOptions): number {
  return Math.max(options.enemyMinVisibility, Math.min(1, calculateFogShade(distance, options) + 0.28));
}
