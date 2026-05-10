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
  | 'nadir-glow';

export type RaycastLandmarkId = 'none' | 'key' | 'gate' | 'ambush' | 'secret' | 'exit';

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
  hornStyle: 'none' | 'ram' | 'antenna' | 'glitch-spikes';
  role: 'pressure' | 'heavy' | 'flanker' | 'artillery';
  windupColor: number;
}

const DEFAULT_THEME: RaycastZoneTheme = {
  id: 'corrupted-metal',
  accentColor: 0x455a72,
  patternColor: 0x9cabb8,
  floorColor: 0x060910,
  ceilingColor: 0x020408,
  signalColor: RAYCAST_PALETTE.amberSoft
};

export const RAYCAST_ZONE_THEMES: Record<RaycastZoneThemeId, RaycastZoneTheme> = {
  'corrupted-metal': {
    id: 'corrupted-metal',
    accentColor: 0x556080,
    patternColor: 0xb0bec8,
    floorColor: 0x080c14,
    ceilingColor: 0x03060c,
    signalColor: RAYCAST_PALETTE.amberSoft
  },
  'void-stone': {
    id: 'void-stone',
    accentColor: 0x5a4a68,
    patternColor: 0xc4b8d8,
    floorColor: 0x0a0810,
    ceilingColor: 0x040308,
    signalColor: RAYCAST_PALETTE.corruptMist
  },
  'warning-amber': {
    id: 'warning-amber',
    accentColor: 0xc86828,
    patternColor: 0xffe0a0,
    floorColor: 0x120c06,
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
    floorColor: 0x040612,
    ceilingColor: 0x02040a,
    signalColor: RAYCAST_PALETTE.riftViolet
  },
  'ion-shaft': {
    id: 'ion-shaft',
    accentColor: 0x2a7088,
    patternColor: RAYCAST_PALETTE.riftIon,
    floorColor: 0x031018,
    ceilingColor: 0x010810,
    signalColor: RAYCAST_PALETTE.riftIon
  },
  'nadir-glow': {
    id: 'nadir-glow',
    accentColor: 0x503070,
    patternColor: 0xe8e0ff,
    floorColor: 0x060410,
    ceilingColor: 0x030208,
    signalColor: RAYCAST_PALETTE.riftViolet
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
      floorGlowColor: blendThemeColor(RAYCAST_PALETTE.riftIon, 0x082028, 0.42),
      floorBandAlpha: 0.13,
      cellStride: 14
    };
  }

  if (surface.theme.id === 'nadir-glow') {
    return {
      floorPattern: 'glow-rings',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, RAYCAST_PALETTE.riftFog, 0.5),
      floorBandAlpha: 0.15,
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
    outlineColor: 0x140304,
    accentColor: blendThemeColor(color, RAYCAST_PALETTE.telegraphRose, 0.22),
    eyeColor: RAYCAST_PALETTE.boneBright,
    coreColor: RAYCAST_PALETTE.bloodGate,
    hornStyle: 'none',
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
