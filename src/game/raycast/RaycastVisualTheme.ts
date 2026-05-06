import type { RectArea } from '../level/arenaLayout';
import type { EnemyKind } from '../types/game';

export type RaycastZoneThemeId =
  | 'corrupted-metal'
  | 'void-stone'
  | 'warning-amber'
  | 'toxic-green'
  | 'exit-portal';

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
  accentColor: 0x4f617d,
  patternColor: 0xa4b3cf,
  floorColor: 0x071019,
  ceilingColor: 0x03060c,
  signalColor: 0xffc56d
};

export const RAYCAST_ZONE_THEMES: Record<RaycastZoneThemeId, RaycastZoneTheme> = {
  'corrupted-metal': {
    id: 'corrupted-metal',
    accentColor: 0x667f9c,
    patternColor: 0xc5d2e4,
    floorColor: 0x0a121d,
    ceilingColor: 0x050912,
    signalColor: 0xffd084
  },
  'void-stone': {
    id: 'void-stone',
    accentColor: 0x756f84,
    patternColor: 0xd7cde3,
    floorColor: 0x0c0a13,
    ceilingColor: 0x05040b,
    signalColor: 0xc0b6de
  },
  'warning-amber': {
    id: 'warning-amber',
    accentColor: 0xd27a35,
    patternColor: 0xffe4a2,
    floorColor: 0x161008,
    ceilingColor: 0x0c0703,
    signalColor: 0xffe6a6
  },
  'toxic-green': {
    id: 'toxic-green',
    accentColor: 0x249770,
    patternColor: 0xb7ffe0,
    floorColor: 0x081510,
    ceilingColor: 0x031009,
    signalColor: 0x97ffd1
  },
  'exit-portal': {
    id: 'exit-portal',
    accentColor: 0x37abd5,
    patternColor: 0xe0fbff,
    floorColor: 0x07131d,
    ceilingColor: 0x020a10,
    signalColor: 0xb6fff3
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
      detailColor: blendThemeColor(surface.theme.patternColor, 0xffcf7c, 0.48),
      secondaryColor: blendThemeColor(surface.theme.accentColor, 0x2b1208, 0.2),
      signalColor: 0xff7a6d,
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
      detailColor: blendThemeColor(surface.theme.patternColor, 0x8ff4c0, 0.18),
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
      floorGlowColor: blendThemeColor(surface.theme.signalColor, 0xff7a6d, 0.34),
      floorBandAlpha: 0.14,
      cellStride: 16
    };
  }

  if (surface.theme.id === 'toxic-green') {
    return {
      floorPattern: 'noise-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.signalColor, 0x8ff4c0, 0.4),
      floorBandAlpha: 0.12,
      cellStride: 15
    };
  }

  if (surface.theme.id === 'void-stone') {
    return {
      floorPattern: 'grid-cells',
      ceilingPattern: 'void-noise',
      floorGlowColor: blendThemeColor(surface.theme.patternColor, 0xa9a2c4, 0.3),
      floorBandAlpha: 0.1,
      cellStride: 20
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
      outlineColor: 0x1b0906,
      accentColor: blendThemeColor(color, 0xffde9d, 0.38),
      eyeColor: 0xfff2b3,
      coreColor: 0xffaa5e,
      hornStyle: 'ram',
      role: 'heavy',
      windupColor: 0xff9c63
    };
  }

  if (kind === 'STALKER') {
    return {
      silhouette: 'phantom',
      outlineColor: 0x020d0a,
      accentColor: blendThemeColor(color, 0x9fffd9, 0.38),
      eyeColor: 0xf1fff9,
      coreColor: 0x63f1bc,
      hornStyle: 'glitch-spikes',
      role: 'flanker',
      windupColor: 0x7ff6cf
    };
  }

  if (kind === 'RANGED') {
    return {
      silhouette: 'sentinel',
      outlineColor: 0x061019,
      accentColor: blendThemeColor(color, 0xe2fbff, 0.42),
      eyeColor: 0xffffff,
      coreColor: 0x8fe6ff,
      hornStyle: 'antenna',
      role: 'artillery',
      windupColor: 0xbef5ff
    };
  }

  return {
    silhouette: 'raider',
    outlineColor: 0x1c0708,
    accentColor: blendThemeColor(color, 0xffb492, 0.22),
    eyeColor: 0xfff1df,
    coreColor: 0xff6f61,
    hornStyle: 'none',
    role: 'pressure',
    windupColor: 0xffa45e
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
  if (style === 'token') return 0x8ff4c0;
  if (style === 'gate') return 0xff7a6d;
  if (style === 'gate-open') return isActive ? 0x9feee2 : 0x57cfa7;
  if (style === 'secret') return 0xffc56d;
  if (style === 'health') return 0xff8fb0;
  return isActive ? 0xd2f7ff : 0x6fd8ff;
}

function blendThemeColor(baseColor: number, blendColor: number, amount: number): number {
  const clampedAmount = Math.max(0, Math.min(1, amount));
  const inverse = 1 - clampedAmount;
  const r = ((baseColor >> 16) & 0xff) * inverse + ((blendColor >> 16) & 0xff) * clampedAmount;
  const g = ((baseColor >> 8) & 0xff) * inverse + ((blendColor >> 8) & 0xff) * clampedAmount;
  const b = (baseColor & 0xff) * inverse + (blendColor & 0xff) * clampedAmount;
  return (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b);
}
