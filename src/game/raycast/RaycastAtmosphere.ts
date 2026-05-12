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

type RaycastAtmosphereMessageKey = keyof typeof RAYCAST_ATMOSPHERE.messages;

/** World 1 — forge stratum: tighter warm envelope vs W2 cold rift (fog mix only; base corruption tint unchanged). */
export const RAYCAST_ATMOSPHERE_WORLD1: {
  messageOverrides: Partial<Record<RaycastAtmosphereMessageKey, string>>;
} = {
  messageOverrides: {
    intro:
      'CINDER FORGE STRATUM — FIRST HELL — RUST SLABS AND AMBER ROUTING (NOT THE ABYSS ICE STRATUM)',
    idle: 'FORGE BOILER GHOSTS THE PERIPHERY — HEAT HAZE HUGS THE DECK',
    pressure: 'SHAFT PRESSURE — BREAK LINE OF SIGHT BEFORE THE BELT SHREDS YOUR ROUTE',
    spawn: 'HOSTILE SURFACES IN WARM HAZE — READ SILHOUETTE AND FOOTPRINT, NOT CHIP COLOR'
  }
};

/** World 2 — abyss stratum: deeper fog envelope, violet interference layer, “other hell” voice (HUD uses RAYCAST_CSS_WORLD2). */
export const RAYCAST_ATMOSPHERE_WORLD2 = {
  fogColor: RAYCAST_PALETTE.riftFog,
  corruptionTint: RAYCAST_PALETTE.riftVeil,
  messageOverrides: {
    intro:
      'ABYSS STRATUM — GLASS ABYSS, NOT THE FORGE — SUBLEVEL SIGNAL SHEARS HUD INTO BLUE ICE (SECOND HELL)',
    exit: 'RIFT NODE COOLED — YOU ARE STILL NOT HOME',
    idle: 'VOID GLASS LEAKS THROUGH THE STRATUM — TRACE HELD IN VIOLET STATIC — NOT EPISODE HEAT',
    locked: 'ACCESS DENIED — SEAM WELDED BY COLD SIGNAL',
    key: 'TOKEN FUSED — STRATUM ROUTING KNOWS YOUR SILHOUETTE',
    doorOpen: 'SEAM CRACKS — PRESSURE FRONT MOVES DOWNGRADE',
    trigger: 'STRATUM HANDSHAKE — HOSTILES ALLOCATED TO YOUR CORRIDOR',
    pressure: 'ION SHEAR TEARS THE ROUTE — SIDESTEP THE BRACKET',
    surge: 'STRATUM SPIKE — SCRAMBLERS + RIFLES BOILED UP FROM THE ABYSS SHAFT',
    recovery: 'STATIC LULL — USE THE BREATH BEFORE THE NEXT SPIKE',
    spawn: 'ENTITY SURFACES IN FROST AIR — NOT THE SAME BIOS AS EPISODE 1',
    damage: 'THERMAL BLEED — CORE TEMP SLIPPING',
    kill: 'HOSTILE SHATTERED INTO RIFT SNOW',
    secret: 'CONCEALED ABYSS NODE INDEXED',
    critical: 'CORE HYPOTHERMIC — MOVE OR DROP INTO BLACK WATER'
  }
} as const satisfies {
  fogColor: number;
  corruptionTint: number;
  messageOverrides: Partial<Record<RaycastAtmosphereMessageKey, string>>;
};

/** Tighter mid-range read + warm fog mix — instant contrast vs `RAYCAST_WORLD2_SEGMENT_LAYER` cold cap. */
export const RAYCAST_WORLD1_SEGMENT_LAYER = {
  fogStartDelta: -0.1,
  fogEndDelta: -0.42,
  fogEndFloor: 6.92,
  fogColorMix: 0.15,
  corruptionAlphaScale: 1.05,
  pulseAlphaScale: 1.04,
  ambientDarknessDelta: -0.014,
  ambientDarknessFloor: 0.23,
  enemyMinVisibilityDelta: 0.012,
  enemyMinVisibilityCap: 0.72
} as const;

/**
 * Layered only in `applyWorldSegmentToAtmosphere` for `world2`.
 * Ion stratum: slightly deeper fog envelope + softer corrupt pulse vs infernal W1; bump silhouette floor so cold haze stays fair.
 */
export const RAYCAST_WORLD2_SEGMENT_LAYER = {
  fogStartDelta: 0.22,
  /** Deeper cold envelope vs W1 — keeps silhouette floor bounded by fogEndCap. */
  fogEndDelta: 0.5,
  fogEndCap: 11.6,
  corruptionAlphaScale: 0.82,
  pulseAlphaScale: 0.77,
  ambientDarknessBump: 0.019,
  ambientDarknessMax: 0.314,
  enemyMinVisibilityDelta: 0.038,
  enemyMinVisibilityCap: 0.735
} as const;

/** World 3 — warm ash haze; distinct from icy World 2 without breaking silhouette caps. */
export const RAYCAST_ATMOSPHERE_WORLD3 = {
  fogColor: 0x140804,
  corruptionTint: 0x5a1820,
  messageOverrides: {
    intro:
      'EMBER MERIDIAN — THIRD HELL — ASH CLOCKS YOUR ROUTE AND SCRAMBLES IDLE LANES',
    exit: 'MERIDIAN NODE COOLED — VERDICT ARCHIVED',
    idle: 'ASH STATIC CLINGS TO THE HUD — HEAT WITHOUT FORGE BOILER — NOT ABYSS BLUE',
    locked: 'ACCESS DENIED — SEAL PACKED WITH CINDER',
    key: 'TOKEN BRANDED — MERIDIAN ROUTING KNOWS YOUR FOOTPRINT',
    doorOpen: 'VENT TEARS — EMBER FRONT MOVES DOWNCORRIDOR',
    trigger: 'MERIDIAN HANDSHAKE — HOSTILES ALLOCATED TO YOUR TIMING WINDOW',
    pressure: 'HARASS LAYER SHREDS REST — KEEP STRAFE TEMPO OR EAT CHIP DAMAGE',
    surge: 'ASH SPIKE — SCRAMBLERS AND BRACKETS STACK FAST',
    recovery: 'EMBER LULL — ONE WINDOW BEFORE THE NEXT SPIRE',
    spawn: 'HOSTILE SURFACES IN WARM HAZE — SCRAMBLER READ DIFFERENT FROM STRATUM ICE',
    damage: 'THERMAL CHIP — CORE ROUTING UNSTABLE',
    kill: 'HOSTILE DISPERSED INTO ASH',
    secret: 'CONCEALED LEDGER NODE INDEXED — SCORE SPINE TICK',
    critical: 'CORE OVERHEATING — MOVE OR BURN INTO BLACK ASH'
  }
} as const satisfies {
  fogColor: number;
  corruptionTint: number;
  messageOverrides: Partial<Record<RaycastAtmosphereMessageKey, string>>;
};

export const RAYCAST_WORLD3_SEGMENT_LAYER = {
  fogStartDelta: 0.18,
  fogEndDelta: 0.42,
  fogEndCap: 11.4,
  corruptionAlphaScale: 0.85,
  pulseAlphaScale: 0.8,
  ambientDarknessBump: 0.015,
  ambientDarknessMax: 0.308,
  enemyMinVisibilityDelta: 0.032,
  enemyMinVisibilityCap: 0.728
} as const;

export type RaycastWorldSegmentId = 'world1' | 'world2' | 'world3';

export function getRaycastCombatMessageForSegment(
  segment: RaycastWorldSegmentId,
  key: RaycastAtmosphereMessageKey
): string {
  const base = RAYCAST_ATMOSPHERE.messages[key];
  if (segment === 'world1') {
    const hit = RAYCAST_ATMOSPHERE_WORLD1.messageOverrides[key];
    return hit !== undefined ? hit : base;
  }
  if (segment === 'world2') {
    const hit = RAYCAST_ATMOSPHERE_WORLD2.messageOverrides[key];
    return hit !== undefined ? hit : base;
  }
  if (segment === 'world3') {
    const hit = RAYCAST_ATMOSPHERE_WORLD3.messageOverrides[key];
    return hit !== undefined ? hit : base;
  }
  return base;
}

export function getRaycastIntroMessageForSegment(segment: RaycastWorldSegmentId): string {
  return getRaycastCombatMessageForSegment(segment, 'intro');
}

export function getRaycastExitMessageForSegment(segment: RaycastWorldSegmentId): string {
  return getRaycastCombatMessageForSegment(segment, 'exit');
}

/** Boss-specific combat strip lines (HUD); keyed by level `bossConfig.displayName`. */
export interface RaycastBossHudLines {
  phase2Overdrive: string;
  telegraphLocked: string;
  volleyInbound: string;
  hullStressed: string;
  coreShattered: string;
}

export function getRaycastBossHudLines(displayName: string): RaycastBossHudLines {
  const lower = displayName.toLowerCase();
  if (lower.includes('ash judge')) {
    return {
      phase2Overdrive: 'ASH HALO OVERDRIVE // PHASE 2',
      telegraphLocked: 'JUDGE TELEGRAPH LOCKED',
      volleyInbound: 'EMBER SPIRE VOLLEY INBOUND',
      hullStressed: 'JUDGE HULL STRESSED',
      coreShattered: 'JUDGE VERDICT VOIDED'
    };
  }
  if (lower.includes('bloom')) {
    return {
      phase2Overdrive: 'BLOOM OVERDRIVE // PHASE 2',
      telegraphLocked: 'BLOOM TELEGRAPH LOCKED',
      volleyInbound: 'BLOOM VOLLEY INBOUND',
      hullStressed: 'WARDEN HULL STRESSED',
      coreShattered: 'WARDEN CORE SHATTERED'
    };
  }
  return {
    phase2Overdrive: 'ARCHON CORE OVERDRIVE // PHASE 2',
    telegraphLocked: 'ARCHON TELEGRAPH LOCKED',
    volleyInbound: 'ARCHON VOLLEY INBOUND',
    hullStressed: 'ARCHON HULL STRESSED',
    coreShattered: 'ARCHON CORE SHATTERED'
  };
}

function mixAtmosphereRgb(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const inv = 1 - clamped;
  const r = Math.floor(((a >> 16) & 0xff) * inv + ((b >> 16) & 0xff) * clamped);
  const g = Math.floor(((a >> 8) & 0xff) * inv + ((b >> 8) & 0xff) * clamped);
  const bl = Math.floor((a & 0xff) * inv + (b & 0xff) * clamped);
  return (r << 16) + (g << 8) + bl;
}

/** Biome tint layered on director-driven atmosphere (no second renderer). */
export function applyWorldSegmentToAtmosphere(
  base: RaycastAtmosphereRenderOptions,
  segment: RaycastWorldSegmentId
): RaycastAtmosphereRenderOptions {
  if (segment === 'world1') {
    const L = RAYCAST_WORLD1_SEGMENT_LAYER;
    const fogEnd = Math.max(L.fogEndFloor, base.fogEnd + L.fogEndDelta);
    const fogStart = Math.min(base.fogStart + L.fogStartDelta, fogEnd - 0.35);
    return {
      ...base,
      fogColor: mixAtmosphereRgb(base.fogColor, RAYCAST_PALETTE.forgeHaze, L.fogColorMix),
      fogStart,
      fogEnd,
      corruptionAlpha: base.corruptionAlpha * L.corruptionAlphaScale,
      pulseAlpha: base.pulseAlpha * L.pulseAlphaScale,
      ambientDarkness: Math.max(L.ambientDarknessFloor, base.ambientDarkness + L.ambientDarknessDelta),
      enemyMinVisibility: Math.min(L.enemyMinVisibilityCap, base.enemyMinVisibility + L.enemyMinVisibilityDelta)
    };
  }
  if (segment === 'world2') {
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
  const L = RAYCAST_WORLD3_SEGMENT_LAYER;
  const fogEnd = Math.min(L.fogEndCap, base.fogEnd + L.fogEndDelta);
  const fogStart = Math.min(base.fogStart + L.fogStartDelta, fogEnd - 0.35);
  return {
    ...base,
    fogColor: RAYCAST_ATMOSPHERE_WORLD3.fogColor,
    corruptionTint: RAYCAST_ATMOSPHERE_WORLD3.corruptionTint,
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
