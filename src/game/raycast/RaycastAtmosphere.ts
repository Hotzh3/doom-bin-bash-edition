import type { DirectorState } from '../systems/DirectorState';

export interface RaycastAtmosphereRenderOptions {
  ambientDarkness: number;
  fogStart: number;
  fogEnd: number;
  fogColor: number;
  corruptionTint: number;
  corruptionAlpha: number;
}

export const RAYCAST_ATMOSPHERE = {
  voidColor: 0x020408,
  floorColor: 0x080b10,
  fogColor: 0x020408,
  corruptionTint: 0x34102a,
  criticalTint: 0x6f0f1f,
  muzzleFlash: 0xfff29e,
  damageFlash: 0xff2348,
  systemText: '#9feee2',
  warningText: '#ff5b6f',
  keyText: '#fff0c2',
  wallColors: {
    1: 0x384256,
    2: 0x6d2135,
    3: 0x10645d,
    4: 0x8f4e2d
  },
  sectorDarkness: {
    1: 0.96,
    2: 0.82,
    3: 0.88,
    4: 1
  },
  messages: {
    intro: 'TERMINAL CORRUPTION HELL ARENA',
    idle: 'SYSTEM WATCHES',
    locked: 'DOOR LOCKED',
    key: 'ACCESS KEY DETECTED',
    doorOpen: 'ACCESS GRANTED',
    trigger: 'SYSTEM BREACH',
    spawn: 'HOSTILE PROCESS SPAWNED',
    damage: 'INTRUSION DAMAGE',
    kill: 'PROCESS TERMINATED',
    secret: 'HIDDEN CACHE DECRYPTED',
    exit: 'CORRUPTION NODE CLEARED',
    critical: 'CRITICAL BODY STATE'
  }
} as const;

export function getAtmosphereForDirector(state: DirectorState | null, intensity: number): RaycastAtmosphereRenderOptions {
  const pressure = Math.max(0, Math.min(1, intensity / 5));

  if (state === 'AMBUSH' || state === 'HIGH_INTENSITY') {
    return {
      ambientDarkness: 0.26 + pressure * 0.1,
      fogStart: 4.8,
      fogEnd: 10.5,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
      corruptionAlpha: 0.08 + pressure * 0.08
    };
  }

  if (state === 'RECOVERY') {
    return {
      ambientDarkness: 0.2,
      fogStart: 6.2,
      fogEnd: 12,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
      corruptionAlpha: 0.035
    };
  }

  return {
    ambientDarkness: 0.3,
    fogStart: 3.8,
    fogEnd: 9,
    fogColor: RAYCAST_ATMOSPHERE.fogColor,
    corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
    corruptionAlpha: 0.045 + pressure * 0.04
  };
}

export function calculateFogShade(distance: number, options: RaycastAtmosphereRenderOptions): number {
  const fogRange = Math.max(0.001, options.fogEnd - options.fogStart);
  const fogAmount = Math.max(0, Math.min(1, (distance - options.fogStart) / fogRange));
  return Math.max(options.ambientDarkness, 1 - fogAmount);
}
