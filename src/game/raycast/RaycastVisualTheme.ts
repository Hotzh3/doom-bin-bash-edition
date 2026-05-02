import type { RectArea } from '../level/arenaLayout';

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
    accentColor: 0x5d748d,
    patternColor: 0xb6c4db,
    floorColor: 0x081019,
    ceilingColor: 0x04070d,
    signalColor: 0xffc56d
  },
  'void-stone': {
    id: 'void-stone',
    accentColor: 0x6a6876,
    patternColor: 0xc8c2d5,
    floorColor: 0x09080f,
    ceilingColor: 0x04040a,
    signalColor: 0xa9a2c4
  },
  'warning-amber': {
    id: 'warning-amber',
    accentColor: 0xc26d2f,
    patternColor: 0xffda81,
    floorColor: 0x120d08,
    ceilingColor: 0x0a0603,
    signalColor: 0xffe08d
  },
  'toxic-green': {
    id: 'toxic-green',
    accentColor: 0x1f8c69,
    patternColor: 0xa8ffd4,
    floorColor: 0x07120f,
    ceilingColor: 0x030906,
    signalColor: 0x8ff4c0
  },
  'exit-portal': {
    id: 'exit-portal',
    accentColor: 0x2a9bc2,
    patternColor: 0xd2f7ff,
    floorColor: 0x07111a,
    ceilingColor: 0x02070d,
    signalColor: 0x9feee2
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
  style: 'token' | 'gate' | 'gate-open' | 'secret' | 'exit',
  isActive = false
): number {
  if (style === 'token') return 0x8ff4c0;
  if (style === 'gate') return 0xff7a6d;
  if (style === 'gate-open') return isActive ? 0x9feee2 : 0x57cfa7;
  if (style === 'secret') return 0xffc56d;
  return isActive ? 0xd2f7ff : 0x6fd8ff;
}
