import type { DirectorState } from '../systems/DirectorState';
import { RAYCAST_CSS, RAYCAST_PALETTE } from './RaycastPalette';

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
  voidColor: RAYCAST_PALETTE.voidBlack,
  floorColor: RAYCAST_PALETTE.floorVoid,
  fogColor: RAYCAST_PALETTE.fogVoid,
  corruptionTint: RAYCAST_PALETTE.corruptVeil,
  criticalTint: RAYCAST_PALETTE.criticalVeil,
  muzzleFlash: RAYCAST_PALETTE.muzzleWarm,
  damageFlash: RAYCAST_PALETTE.damageFlash,
  projectileHalo: RAYCAST_PALETTE.projectileHalo,
  pickupHalo: RAYCAST_PALETTE.pickupHalo,
  enemyOutline: RAYCAST_PALETTE.enemyOutline,
  hudPanel: RAYCAST_CSS.hudPanel,
  debugText: RAYCAST_CSS.debugText,
  systemText: RAYCAST_CSS.systemText,
  warningText: RAYCAST_CSS.warningText,
  keyText: RAYCAST_CSS.keyText,
  wallColors: {
    1: RAYCAST_PALETTE.wallSteel,
    2: RAYCAST_PALETTE.wallCrimson,
    3: RAYCAST_PALETTE.wallOxide,
    4: RAYCAST_PALETTE.wallRust
  },
  wallPatternColors: {
    1: RAYCAST_PALETTE.patternSteel,
    2: RAYCAST_PALETTE.patternCrimson,
    3: RAYCAST_PALETTE.patternOxide,
    4: RAYCAST_PALETTE.patternRust
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

/** World 2 — colder fog, violet corruption veil (renderer + post stack only). */
export const RAYCAST_ATMOSPHERE_WORLD2 = {
  fogColor: RAYCAST_PALETTE.riftFog,
  corruptionTint: RAYCAST_PALETTE.riftVeil,
  messages: {
    intro: 'STRATUM RIFT — SUBLEVEL SIGNAL FREEZING YOUR TELEMETRY',
    exit: 'RIFT STRATUM PURGED'
  }
} as const;

/**
 * Layered only in `applyWorldSegmentToAtmosphere` for `world2`.
 * Ion stratum: slightly deeper fog envelope + softer corrupt pulse vs infernal W1; bump silhouette floor so cold haze stays fair.
 */
export const RAYCAST_WORLD2_SEGMENT_LAYER = {
  fogStartDelta: 0.2,
  fogEndDelta: 0.5,
  fogEndCap: 12,
  corruptionAlphaScale: 0.86,
  pulseAlphaScale: 0.81,
  ambientDarknessBump: 0.014,
  ambientDarknessMax: 0.31,
  enemyMinVisibilityDelta: 0.034,
  enemyMinVisibilityCap: 0.73
} as const;

export type RaycastWorldSegmentId = 'world1' | 'world2';

export function getRaycastIntroMessageForSegment(segment: RaycastWorldSegmentId): string {
  return segment === 'world2' ? RAYCAST_ATMOSPHERE_WORLD2.messages.intro : RAYCAST_ATMOSPHERE.messages.intro;
}

export function getRaycastExitMessageForSegment(segment: RaycastWorldSegmentId): string {
  return segment === 'world2' ? RAYCAST_ATMOSPHERE_WORLD2.messages.exit : RAYCAST_ATMOSPHERE.messages.exit;
}

/** Biome tint layered on director-driven atmosphere (no second renderer). */
export function applyWorldSegmentToAtmosphere(
  base: RaycastAtmosphereRenderOptions,
  segment: RaycastWorldSegmentId
): RaycastAtmosphereRenderOptions {
  if (segment !== 'world2') return base;
  const L = RAYCAST_WORLD2_SEGMENT_LAYER;
  const fogEnd = Math.min(L.fogEndCap, base.fogEnd + L.fogEndDelta);
  const fogStart = Math.min(base.fogStart + L.fogStartDelta, fogEnd - 0.35);
  return {
    ...base,
    fogColor: RAYCAST_ATMOSPHERE_WORLD2.fogColor,
    corruptionTint: RAYCAST_ATMOSPHERE_WORLD2.corruptionTint,
    fogStart,
    fogEnd,
    corruptionAlpha: base.corruptionAlpha * L.corruptionAlphaScale,
    pulseAlpha: base.pulseAlpha * L.pulseAlphaScale,
    ambientDarkness: Math.min(L.ambientDarknessMax, base.ambientDarkness + L.ambientDarknessBump),
    enemyMinVisibility: Math.min(L.enemyMinVisibilityCap, base.enemyMinVisibility + L.enemyMinVisibilityDelta)
  };
}

export function getAtmosphereForDirector(state: DirectorState | null, intensity: number): RaycastAtmosphereRenderOptions {
  const pressure = Math.max(0, Math.min(1, intensity / 5));

  if (state === 'PRESSURE') {
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

  if (state === 'WARNING') {
    return {
      ambientDarkness: 0.278 + pressure * 0.038,
      fogStart: 3.5,
      fogEnd: 8.7,
      fogColor: RAYCAST_ATMOSPHERE.fogColor,
      corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
      corruptionAlpha: 0.072 + pressure * 0.048,
      pulseAlpha: 0.08 + pressure * 0.05,
      enemyMinVisibility: 0.63
    };
  }

  if (state === 'WATCHING') {
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
    ambientDarkness: 0.262,
    fogStart: 3.65,
    fogEnd: 11.05,
    fogColor: RAYCAST_ATMOSPHERE.fogColor,
    corruptionTint: RAYCAST_ATMOSPHERE.corruptionTint,
    corruptionAlpha: 0.038 + pressure * 0.025,
    pulseAlpha: 0.022 + pressure * 0.018,
    enemyMinVisibility: 0.58
  };
}

export function calculateFogShade(distance: number, options: RaycastAtmosphereRenderOptions): number {
  const fogRange = Math.max(0.001, options.fogEnd - options.fogStart);
  const raw = (distance - options.fogStart) / fogRange;
  const t = Math.max(0, Math.min(1, raw));
  /** Smoothstep for a more natural distance falloff (endpoints match the old linear curve). */
  const smooth = t * t * (3 - 2 * t);
  const eased = smooth * 0.93;
  return Math.max(options.ambientDarkness, 1 - eased);
}

export function calculateEnemyVisibility(distance: number, options: RaycastAtmosphereRenderOptions): number {
  return Math.max(options.enemyMinVisibility, Math.min(1, calculateFogShade(distance, options) + 0.28));
}
