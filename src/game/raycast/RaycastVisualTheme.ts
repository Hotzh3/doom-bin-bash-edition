import type { RectArea } from '../level/arenaLayout';
import type { EnemyKind } from '../types/game';
import { RAYCAST_PALETTE } from './RaycastPalette';

export type RaycastZoneThemeId =
  | 'corrupted-metal'
  | 'void-stone'
  | 'warning-amber'
  | 'toxic-green'
  | 'exit-portal'
  /** World 2 — authored cold biomes */
  | 'basalt-rift'
  | 'ion-shaft'
  | 'nadir-glow'
  /** World 3 — Ember Meridian (Phase 34) */
  | 'ash-conduit'
  | 'ember-vault';

export type RaycastLandmarkId =
  | 'none'
  | 'key'
  | 'gate'
  | 'ambush'
  | 'secret'
  | 'exit'
  /** Authored setpieces — orientation + silhouette read (see `getRaycastWallVisualStyle`). */
  | 'reactor'
  | 'monolith'
  | 'core'
  | 'ritual'
  | 'bridge'
  | 'machinery';

export interface RaycastZoneVisualDescriptor extends RectArea {
  visualTheme: RaycastZoneThemeId;
  landmark?: RaycastLandmarkId;
}

export interface RaycastZoneTheme {
  id: RaycastZoneThemeId;
  accentColor: number;
  patternColor: number;
  floorColor: number;
  ceilingColor: number;
  signalColor: number;
}

export interface RaycastSurfaceContext {
  zoneId: string | null;
  theme: RaycastZoneTheme;
  landmark: RaycastLandmarkId;
  cellX: number;
  cellY: number;
  variant: number;
}

export type RaycastWallPatternId =
  | 'terminal-panels'
  | 'corrupted-ribs'
  | 'hazard-strips'
  | 'locked-warning-frame'
  | 'exit-glow'
  | 'data-noise-cells';

export type RaycastGroundPatternId = 'scanlines' | 'grid-cells' | 'hazard-lattice' | 'glow-rings' | 'noise-cells';

export interface RaycastWallVisualStyle {
  pattern: RaycastWallPatternId;
  detailColor: number;
  secondaryColor: number;
  signalColor: number;
  trimMix: number;
  panelStride: number;
  pulseSignal: boolean;
}

export interface RaycastGroundVisualStyle {
  floorPattern: RaycastGroundPatternId;
  ceilingPattern: 'scanlines' | 'crossbars' | 'void-noise';
  floorGlowColor: number;
  floorBandAlpha: number;
  cellStride: number;
}

export interface RaycastWallPatternSample {
  horizontalInset: number;
  bandOffset: number;
  seamOffset: number;
  energy: number;
  chip: number;
  diagonalFlip: boolean;
}

export interface RaycastGroundBandSample {
  laneOffset: number;
  segmentLength: number;
  accentAlpha: number;
  scatter: number;
  crossbarOffset: number;
}

export interface RaycastEnemyVisualStyle {
  silhouette: 'raider' | 'juggernaut' | 'phantom' | 'sentinel';
  outlineColor: number;
  accentColor: number;
  eyeColor: number;
  coreColor: number;
  hornStyle: 'none' | 'ram' | 'antenna' | 'glitch-spikes' | 'tusk';
  role: 'pressure' | 'heavy' | 'flanker' | 'artillery';
  windupColor: number;
}

export const RAYCAST_ENEMY_BILLBOARD_READABILITY = {
  minVisibility: 0.72,
  minProjectedSize: 18,
  outlineAlpha: 0.9,
  fillAlpha: 0.98,
  accentAlpha: 0.56
} as const;

export interface RaycastEnemyBillboardReadability {
  visibility: number;
  size: number;
}

export function enforceRaycastEnemyBillboardReadability(
  visibility: number,
  projectedSize: number
): RaycastEnemyBillboardReadability {
  return {
    visibility: Math.max(RAYCAST_ENEMY_BILLBOARD_READABILITY.minVisibility, visibility),
    size: Math.max(RAYCAST_ENEMY_BILLBOARD_READABILITY.minProjectedSize, projectedSize)
  };
}

const DEFAULT_THEME: RaycastZoneTheme = {
  id: 'corrupted-metal',
  accentColor: 0x183c2c,
  patternColor: 0x6fd0a0,
  floorColor: 0x050b08,
  ceilingColor: 0x020408,
  signalColor: RAYCAST_PALETTE.toxicMid
};

export const RAYCAST_ZONE_THEMES: Record<RaycastZoneThemeId, RaycastZoneTheme> = {
  'corrupted-metal': {
    id: 'corrupted-metal',
    accentColor: 0x1d4a34,
    patternColor: 0x78d8a8,
    floorColor: 0x050c08,
    ceilingColor: 0x020604,
    signalColor: RAYCAST_PALETTE.toxicMid
  },
  'void-stone': {
    id: 'void-stone',
    accentColor: 0x183a30,
    patternColor: 0x6fa88f,
    floorColor: 0x040908,
    ceilingColor: 0x020504,
    signalColor: 0x52b878
  },
  'warning-amber': {
    id: 'warning-amber',
    accentColor: 0x7a3a18,
    patternColor: 0xd89458,
    floorColor: 0x0e0804,
    ceilingColor: 0x080502,
    signalColor: RAYCAST_PALETTE.amberWarn
  },
  'toxic-green': {
    id: 'toxic-green',
    accentColor: 0x1c8050,
    patternColor: 0xa8f0c8,
    floorColor: 0x06120c,
    ceilingColor: 0x020a06,
    signalColor: RAYCAST_PALETTE.toxicMid
  },
  'exit-portal': {
    id: 'exit-portal',
    accentColor: 0x2898a8,
    patternColor: 0xd8fcff,
    floorColor: 0x051018,
    ceilingColor: 0x020810,
    signalColor: RAYCAST_PALETTE.plasmaBright
  },
  'basalt-rift': {
    id: 'basalt-rift',
    accentColor: RAYCAST_PALETTE.riftBasalt,
    patternColor: RAYCAST_PALETTE.riftBone,
    /** Fracture crust — icy deck vs W1 rust slabs (grammar: noise floors + violet seam). */
    floorColor: 0x010718,
    ceilingColor: 0x010314,
    signalColor: RAYCAST_PALETTE.riftViolet
  },
  'ion-shaft': {
    id: 'ion-shaft',
    accentColor: 0x12356c,
    patternColor: RAYCAST_PALETTE.riftIon,
    /** Frost circulation lanes — vertical shaft read (cyan conductor, not amber hazard). */
    floorColor: 0x010f22,
    ceilingColor: 0x010716,
    signalColor: RAYCAST_PALETTE.riftIon
  },
  'nadir-glow': {
    id: 'nadir-glow',
    accentColor: 0x2a145f,
    patternColor: 0xd6d9ff,
    floorColor: 0x030824,
    ceilingColor: 0x020416,
    signalColor: RAYCAST_PALETTE.riftViolet
  },
  'ash-conduit': {
    id: 'ash-conduit',
    accentColor: 0x7a2010,
    patternColor: 0xffb070,
    floorColor: 0x160604,
    ceilingColor: 0x080402,
    signalColor: RAYCAST_PALETTE.amberWarn
  },
  'ember-vault': {
    id: 'ember-vault',
    accentColor: 0x641404,
    patternColor: 0xff7a38,
    floorColor: 0x1a0703,
    ceilingColor: 0x0a0402,
    signalColor: 0xff6633
  }
};

export function getRaycastZoneTheme(themeId: RaycastZoneThemeId | null | undefined): RaycastZoneTheme {
  return themeId ? RAYCAST_ZONE_THEMES[themeId] ?? DEFAULT_THEME : DEFAULT_THEME;
}

export function getRaycastZoneVisual(
  zones: RaycastZoneVisualDescriptor[],
  x: number,
  y: number
): RaycastZoneVisualDescriptor | null {
  return zones.find((zone) => x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height) ?? null;
}

export function getRaycastCellVariant(x: number, y: number): number {
  const seed = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263);
  const mixed = (seed ^ (seed >>> 13)) >>> 0;
  return (mixed % 1000) / 999;
}

export function getRaycastWallVisualStyle(wallType: number, surface: RaycastSurfaceContext): RaycastWallVisualStyle {
  if (surface.landmark === 'exit') {
    return {
      pattern: 'exit-glow',
      detailColor: surface.theme.patternColor,
      secondaryColor: surface.theme.accentColor,
      signalColor: surface.theme.signalColor,
      trimMix: 0.58,
      panelStride: 8,
      pulseSignal: true
    };
  }

  if (wallType === 4 || surface.landmark === 'gate') {
    return {
      pattern: 'locked-warning-frame',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.telegraphAmber, 0.48),
      secondaryColor: blendThemeColor(surface.theme.accentColor, RAYCAST_PALETTE.rustWall, 0.2),
      signalColor: RAYCAST_PALETTE.gateSignal,
      trimMix: 0.62,
      panelStride: 10,
      pulseSignal: true
    };
  }

  if (surface.landmark === 'reactor') {
    return {
      pattern: 'hazard-strips',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.rustBright, 0.32),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x281008, 0.48),
      signalColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.amberWarn, 0.38),
      trimMix: 0.54,
      panelStride: 10,
      pulseSignal: true
    };
  }
  if (surface.landmark === 'monolith') {
    return {
      pattern: 'corrupted-ribs',
      detailColor: blendThemeColor(surface.theme.patternColor, 0x2a2438, 0.52),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x06040a, 0.52),
      signalColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.corruptMist, 0.32),
      trimMix: 0.7,
      panelStride: 20,
      pulseSignal: false
    };
  }
  if (surface.landmark === 'core') {
    return {
      pattern: 'data-noise-cells',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.plasmaMid, 0.34),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x081018, 0.42),
      signalColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.plasmaBright, 0.42),
      trimMix: 0.52,
      panelStride: 10,
      pulseSignal: true
    };
  }
  if (surface.landmark === 'ritual') {
    return {
      pattern: 'data-noise-cells',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.corruptViolet, 0.38),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x100814, 0.48),
      signalColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.toxicGlow, 0.22),
      trimMix: 0.6,
      panelStride: 8,
      pulseSignal: true
    };
  }
  if (surface.landmark === 'bridge') {
    return {
      pattern: 'terminal-panels',
      detailColor: surface.theme.patternColor,
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x0a1412, 0.22),
      signalColor: surface.theme.signalColor,
      trimMix: 0.34,
      panelStride: 24,
      pulseSignal: false
    };
  }
  if (surface.landmark === 'machinery') {
    return {
      pattern: 'terminal-panels',
      detailColor: blendThemeColor(surface.theme.patternColor, 0x5a5e68, 0.45),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x060608, 0.55),
      signalColor: blendThemeColor(surface.theme.signalColor, 0x3a3e48, 0.55),
      trimMix: 0.3,
      panelStride: 16,
      pulseSignal: false
    };
  }

  if (wallType === 2) {
    return {
      pattern: surface.landmark === 'ambush' ? 'hazard-strips' : 'corrupted-ribs',
      detailColor: blendThemeColor(surface.theme.patternColor, 0xc08b6f, 0.22),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x2e1612, 0.18),
      signalColor: surface.theme.signalColor,
      trimMix: 0.46,
      panelStride: 12,
      pulseSignal: surface.landmark === 'ambush'
    };
  }

  if (wallType === 3) {
    return {
      pattern: 'data-noise-cells',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.toxicGlow, 0.18),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x091419, 0.28),
      signalColor: surface.theme.signalColor,
      trimMix: 0.5,
      panelStride: 9,
      pulseSignal: true
    };
  }

  /** World 2 primary walls (type 1): distinct grammar vs Episode 1 terminal slabs. */
  if (wallType === 1 && surface.theme.id === 'basalt-rift') {
    return {
      pattern: 'data-noise-cells',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.riftFog, 0.34),
      secondaryColor: blendThemeColor(surface.theme.accentColor, RAYCAST_PALETTE.riftBasalt, 0.3),
      signalColor: surface.theme.signalColor,
      trimMix: 0.54,
      panelStride: 11,
      pulseSignal: surface.landmark === 'secret'
    };
  }
  if (wallType === 1 && surface.theme.id === 'ion-shaft') {
    return {
      pattern: 'terminal-panels',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.riftIon, 0.24),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x050c14, 0.38),
      signalColor: surface.theme.signalColor,
      trimMix: 0.47,
      panelStride: 13,
      pulseSignal: true
    };
  }
  if (wallType === 1 && surface.theme.id === 'nadir-glow') {
    return {
      pattern: 'corrupted-ribs',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.riftViolet, 0.3),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x100428, 0.34),
      signalColor: surface.theme.signalColor,
      trimMix: 0.56,
      panelStride: 12,
      pulseSignal: true
    };
  }

  if (wallType === 1 && surface.theme.id === 'ash-conduit') {
    return {
      pattern: 'corrupted-ribs',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.amberWarn, 0.2),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x180804, 0.36),
      signalColor: surface.theme.signalColor,
      trimMix: 0.52,
      panelStride: 12,
      pulseSignal: true
    };
  }
  if (wallType === 1 && surface.theme.id === 'ember-vault') {
    return {
      pattern: 'hazard-strips',
      detailColor: blendThemeColor(surface.theme.patternColor, 0xff6633, 0.18),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x200804, 0.4),
      signalColor: surface.theme.signalColor,
      trimMix: 0.54,
      panelStride: 11,
      pulseSignal: true
    };
  }

  if (wallType === 1 && surface.theme.id === 'toxic-green') {
    return {
      pattern: 'data-noise-cells',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.toxicGlow, 0.14),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x061210, 0.26),
      signalColor: surface.theme.signalColor,
      trimMix: 0.48,
      panelStride: 10,
      pulseSignal: surface.landmark === 'secret'
    };
  }
  if (wallType === 1 && surface.theme.id === 'warning-amber') {
    const hazard = surface.landmark === 'ambush';
    return {
      pattern: hazard ? 'hazard-strips' : 'terminal-panels',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.telegraphAmber, 0.22),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x201008, 0.28),
      signalColor: surface.theme.signalColor,
      trimMix: 0.5,
      panelStride: hazard ? 11 : 13,
      pulseSignal: hazard
    };
  }
  if (wallType === 1 && surface.theme.id === 'void-stone') {
    return {
      pattern: 'corrupted-ribs',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.corruptMist, 0.16),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x080510, 0.24),
      signalColor: surface.theme.signalColor,
      trimMix: 0.48,
      panelStride: 13,
      pulseSignal: surface.landmark === 'secret'
    };
  }
  if (wallType === 1 && surface.theme.id === 'corrupted-metal') {
    return {
      pattern: 'terminal-panels',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.patternSteel, 0.14),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x0a0e14, 0.2),
      signalColor: surface.theme.signalColor,
      trimMix: 0.38,
      panelStride: 16,
      pulseSignal: surface.landmark === 'key'
    };
  }
  if (wallType === 1 && surface.theme.id === 'exit-portal') {
    return {
      pattern: 'terminal-panels',
      detailColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.plasmaMid, 0.28),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x050c12, 0.28),
      signalColor: surface.theme.signalColor,
      trimMix: 0.46,
      panelStride: 12,
      pulseSignal: true
    };
  }

  return {
    pattern: 'terminal-panels',
    detailColor: surface.theme.patternColor,
    secondaryColor: blendThemeColor(surface.theme.accentColor, 0x0a1118, 0.16),
    signalColor: surface.theme.signalColor,
    trimMix: 0.42,
    panelStride: 14,
    pulseSignal: surface.landmark === 'key'
  };
}

export function getRaycastGroundVisualStyle(surface: Pick<RaycastSurfaceContext, 'theme' | 'landmark' | 'variant'>): RaycastGroundVisualStyle {
  if (surface.landmark === 'exit') {
    return {
      floorPattern: 'glow-rings',
      ceilingPattern: 'crossbars',
      floorGlowColor: surface.theme.signalColor,
      floorBandAlpha: 0.16,
      cellStride: 20
    };
  }

  if (surface.landmark === 'reactor') {
    return {
      floorPattern: 'hazard-lattice',
      ceilingPattern: 'crossbars',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.rustBright, 0.35),
      floorBandAlpha: 0.165,
      cellStride: 15
    };
  }
  if (surface.landmark === 'monolith') {
    return {
      floorPattern: 'grid-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.corruptMist, 0.38),
      floorBandAlpha: 0.12,
      cellStride: 22
    };
  }
  if (surface.landmark === 'core') {
    return {
      floorPattern: 'glow-rings',
      ceilingPattern: 'crossbars',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.plasmaMid, 0.45),
      floorBandAlpha: 0.17,
      cellStride: 18
    };
  }
  if (surface.landmark === 'ritual') {
    return {
      floorPattern: 'noise-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.corruptViolet, 0.28),
      floorBandAlpha: 0.14,
      cellStride: 14
    };
  }
  if (surface.landmark === 'bridge') {
    return {
      floorPattern: 'scanlines',
      ceilingPattern: 'crossbars',
      floorGlowColor: blendThemeColor(surface.theme.patternColor, surface.theme.signalColor, 0.35),
      floorBandAlpha: 0.11,
      cellStride: 26
    };
  }
  if (surface.landmark === 'machinery') {
    return {
      floorPattern: 'grid-cells',
      ceilingPattern: 'scanlines',
      floorGlowColor: blendThemeColor(surface.theme.patternColor, 0x2a2a30, 0.5),
      floorBandAlpha: 0.085,
      cellStride: 20
    };
  }

  if (surface.landmark === 'key') {
    return {
      floorPattern: 'grid-cells',
      ceilingPattern: 'crossbars',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, surface.theme.patternColor, 0.42),
      floorBandAlpha: 0.14,
      cellStride: 18
    };
  }

  if (surface.landmark === 'gate' || surface.landmark === 'ambush') {
    return {
      floorPattern: 'hazard-lattice',
      ceilingPattern: 'crossbars',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.gateSignal, 0.34),
      floorBandAlpha: 0.14,
      cellStride: 16
    };
  }

  if (surface.theme.id === 'toxic-green') {
    return {
      floorPattern: 'noise-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.toxicGlow, 0.4),
      floorBandAlpha: 0.12,
      cellStride: 15
    };
  }

  if (surface.theme.id === 'void-stone') {
    return {
      floorPattern: 'grid-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.patternColor, RAYCAST_PALETTE.corruptMist, 0.3),
      floorBandAlpha: 0.1,
      cellStride: 20
    };
  }

  if (surface.theme.id === 'basalt-rift') {
    return {
      floorPattern: 'noise-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.riftBone, 0.35),
      floorBandAlpha: 0.11,
      cellStride: 17
    };
  }

  if (surface.theme.id === 'ion-shaft') {
    return {
      floorPattern: 'hazard-lattice',
      ceilingPattern: 'crossbars',
      floorGlowColor: blendThemeColor(
        blendThemeColor(RAYCAST_PALETTE.riftIon, 0x082028, 0.42),
        RAYCAST_PALETTE.riftBloom,
        0.06
      ),
      floorBandAlpha: 0.135,
      cellStride: 14
    };
  }

  if (surface.theme.id === 'nadir-glow') {
    return {
      floorPattern: 'glow-rings',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.riftFog, 0.52),
      floorBandAlpha: 0.155,
      cellStride: 19
    };
  }

  return {
    floorPattern: 'scanlines',
    ceilingPattern: 'scanlines',
    floorGlowColor: surface.theme.patternColor,
    floorBandAlpha: 0.08,
    cellStride: 24
  };
}

export function getRaycastEnemyVisualStyle(kind: EnemyKind, color: number): RaycastEnemyVisualStyle {
  if (kind === 'BRUTE') {
    return {
      silhouette: 'juggernaut',
      outlineColor: 0x120502,
      accentColor: blendThemeColor(color, RAYCAST_PALETTE.amberSoft, 0.38),
      eyeColor: RAYCAST_PALETTE.amberWarn,
      coreColor: RAYCAST_PALETTE.rustBright,
      hornStyle: 'ram',
      role: 'heavy',
      windupColor: RAYCAST_PALETTE.patternRust
    };
  }

  if (kind === 'STALKER') {
    return {
      silhouette: 'phantom',
      outlineColor: 0x010806,
      accentColor: blendThemeColor(color, RAYCAST_PALETTE.toxicGlow, 0.38),
      eyeColor: RAYCAST_PALETTE.boneBright,
      coreColor: RAYCAST_PALETTE.toxicMid,
      hornStyle: 'glitch-spikes',
      role: 'flanker',
      windupColor: RAYCAST_PALETTE.patternOxide
    };
  }

  if (kind === 'SCRAMBLER') {
    return {
      silhouette: 'raider',
      outlineColor: 0x050208,
      accentColor: blendThemeColor(color, RAYCAST_PALETTE.amberWarn, 0.42),
      eyeColor: RAYCAST_PALETTE.boneBright,
      coreColor: RAYCAST_PALETTE.rustBright,
      hornStyle: 'glitch-spikes',
      role: 'flanker',
      windupColor: RAYCAST_PALETTE.amberWarn
    };
  }

  if (kind === 'RANGED') {
    return {
      silhouette: 'sentinel',
      outlineColor: 0x040810,
      accentColor: blendThemeColor(color, RAYCAST_PALETTE.plasmaBright, 0.42),
      eyeColor: RAYCAST_PALETTE.boneBright,
      coreColor: RAYCAST_PALETTE.plasmaMid,
      hornStyle: 'antenna',
      role: 'artillery',
      windupColor: RAYCAST_PALETTE.plasmaBright
    };
  }

  return {
    silhouette: 'raider',
    outlineColor: 0x100204,
    accentColor: blendThemeColor(color, RAYCAST_PALETTE.telegraphRose, 0.22),
    eyeColor: RAYCAST_PALETTE.boneBright,
    coreColor: RAYCAST_PALETTE.bloodGate,
    hornStyle: 'tusk',
    role: 'pressure',
    windupColor: RAYCAST_PALETTE.patternRust
  };
}

export function sampleRaycastWallPattern(
  wallType: number,
  surface: Pick<RaycastSurfaceContext, 'cellX' | 'cellY' | 'variant' | 'landmark'>,
  column: number
): RaycastWallPatternSample {
  const baseX = surface.cellX * 19 + column * 3 + wallType * 11;
  const baseY = surface.cellY * 23 + Math.floor(surface.variant * 97);
  const insetSeed = getRaycastCellVariant(baseX, baseY);
  const bandSeed = getRaycastCellVariant(baseX + 7, baseY - 11);
  const seamSeed = getRaycastCellVariant(baseX - 13, baseY + 5);
  const energySeed = getRaycastCellVariant(baseX + 17, baseY + 29);
  const chipSeed = getRaycastCellVariant(baseX - 5, baseY - 19);

  return {
    horizontalInset: 0.08 + insetSeed * 0.16,
    bandOffset: (bandSeed - 0.5) * 0.08,
    seamOffset: (seamSeed - 0.5) * 0.14,
    energy: energySeed,
    chip: chipSeed,
    diagonalFlip: (surface.cellX + surface.cellY + column + wallType) % 2 === 0
  };
}

export function sampleRaycastGroundBand(
  surface: Pick<RaycastSurfaceContext, 'cellX' | 'cellY' | 'variant' | 'landmark'>,
  bandIndex: number,
  plane: 'floor' | 'ceiling'
): RaycastGroundBandSample {
  const planeOffset = plane === 'floor' ? 41 : 83;
  const baseX = surface.cellX * 13 + bandIndex * 5 + planeOffset;
  const baseY = surface.cellY * 17 + Math.floor(surface.variant * 131) + planeOffset * 2;
  const laneSeed = getRaycastCellVariant(baseX, baseY);
  const segmentSeed = getRaycastCellVariant(baseX + 9, baseY - 7);
  const accentSeed = getRaycastCellVariant(baseX - 15, baseY + 11);
  const scatterSeed = getRaycastCellVariant(baseX + 21, baseY + 3);
  const crossbarSeed = getRaycastCellVariant(baseX - 3, baseY - 25);

  return {
    laneOffset: Math.floor(laneSeed * 24),
    segmentLength: 10 + Math.floor(segmentSeed * 22),
    accentAlpha: 0.4 + accentSeed * 0.6,
    scatter: scatterSeed,
    crossbarOffset: Math.floor(crossbarSeed * 18)
  };
}

export function sampleRaycastSurfaceContext(
  zones: RaycastZoneVisualDescriptor[],
  hitX: number,
  hitY: number,
  rayAngle: number
): RaycastSurfaceContext {
  const sampleX = hitX - Math.cos(rayAngle) * 0.08;
  const sampleY = hitY - Math.sin(rayAngle) * 0.08;
  const cellX = Math.floor(sampleX);
  const cellY = Math.floor(sampleY);
  const zone = getRaycastZoneVisual(zones, sampleX, sampleY);

  return {
    zoneId: zone?.id ?? null,
    theme: getRaycastZoneTheme(zone?.visualTheme),
    landmark: zone?.landmark ?? 'none',
    cellX,
    cellY,
    variant: getRaycastCellVariant(cellX, cellY)
  };
}

export function getBillboardColor(
  style: 'token' | 'gate' | 'gate-open' | 'secret' | 'exit' | 'health',
  isActive = false
): number {
  if (style === 'token') return RAYCAST_PALETTE.toxicGlow;
  if (style === 'gate') return RAYCAST_PALETTE.bloodGate;
  if (style === 'gate-open') return isActive ? RAYCAST_PALETTE.plasmaBright : RAYCAST_PALETTE.plasmaMid;
  if (style === 'secret') return RAYCAST_PALETTE.amberWarn;
  if (style === 'health') return 0xff7098;
  return isActive ? 0xa8fcff : 0x48b0c8;
}

function blendThemeColor(baseColor: number, blendColor: number, amount: number): number {
  const clampedAmount = Math.max(0, Math.min(1, amount));
  const inverse = 1 - clampedAmount;
  const r = ((baseColor >> 16) & 0xff) * inverse + ((blendColor >> 16) & 0xff) * clampedAmount;
  const g = ((baseColor >> 8) & 0xff) * inverse + ((blendColor >> 8) & 0xff) * clampedAmount;
  const b = (baseColor & 0xff) * inverse + (blendColor & 0xff) * clampedAmount;
  return (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b);
}

/** Fake local fill lights — column shade bump only (no new lighting pass). */
export function getRaycastLandmarkColumnShadeBoost(landmark: RaycastLandmarkId): number {
  switch (landmark) {
    case 'core':
      return 0.085;
    case 'reactor':
      return 0.072;
    case 'ritual':
      return 0.058;
    case 'exit':
      return 0.048;
    case 'key':
      return 0.038;
    case 'bridge':
      return 0.034;
    case 'monolith':
      return 0.03;
    case 'machinery':
      return 0.022;
    default:
      return 0;
  }
}
