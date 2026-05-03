import { describe, expect, it } from 'vitest';
import { RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';
import {
  getBillboardColor,
  getRaycastCellVariant,
  getRaycastEnemyVisualStyle,
  getRaycastGroundVisualStyle,
  getRaycastWallVisualStyle,
  getRaycastZoneTheme,
  getRaycastZoneVisual,
  sampleRaycastGroundBand,
  sampleRaycastWallPattern,
  sampleRaycastSurfaceContext
} from '../game/raycast/RaycastVisualTheme';

describe('raycast visual theme', () => {
  it('resolves zone visuals from authored level regions', () => {
    const zone = getRaycastZoneVisual(RAYCAST_LEVEL.zones, 5.4, 4.2);

    expect(zone?.id).toBe('key-area');
    expect(zone?.visualTheme).toBe('toxic-green');
    expect(zone?.landmark).toBe('key');
  });

  it('returns stable cell variants for procedural patterning', () => {
    expect(getRaycastCellVariant(4, 7)).toBe(getRaycastCellVariant(4, 7));
    expect(getRaycastCellVariant(4, 7)).not.toBe(getRaycastCellVariant(5, 7));
  });

  it('samples wall surfaces back into the traversable zone for theme lookups', () => {
    const surface = sampleRaycastSurfaceContext(RAYCAST_LEVEL.zones, 8.12, 7.5, 0);

    expect(surface.zoneId).toBe('locked-door');
    expect(surface.theme.id).toBe('warning-amber');
    expect(surface.landmark).toBe('gate');
  });

  it('samples deterministic wall pattern details for a column', () => {
    const surface = sampleRaycastSurfaceContext(RAYCAST_LEVEL.zones, 8.12, 7.5, 0);
    const sampleA = sampleRaycastWallPattern(4, surface, 12);
    const sampleB = sampleRaycastWallPattern(4, surface, 12);
    const sampleC = sampleRaycastWallPattern(4, surface, 13);

    expect(sampleA).toEqual(sampleB);
    expect(sampleA).not.toEqual(sampleC);
    expect(sampleA.horizontalInset).toBeGreaterThanOrEqual(0.08);
    expect(sampleA.horizontalInset).toBeLessThanOrEqual(0.24);
  });

  it('samples deterministic ground bands for floor and ceiling variation', () => {
    const surface = sampleRaycastSurfaceContext(RAYCAST_LEVEL.zones, 5.4, 4.2, Math.PI * 0.25);
    const floorBand = sampleRaycastGroundBand(surface, 6, 'floor');
    const ceilingBand = sampleRaycastGroundBand(surface, 6, 'ceiling');

    expect(sampleRaycastGroundBand(surface, 6, 'floor')).toEqual(floorBand);
    expect(floorBand).not.toEqual(ceilingBand);
    expect(floorBand.segmentLength).toBeGreaterThanOrEqual(10);
    expect(floorBand.segmentLength).toBeLessThanOrEqual(31);
  });

  it('selects warning-frame wall styling for locked gates and exit glow for exit zones', () => {
    const gateSurface = sampleRaycastSurfaceContext(RAYCAST_LEVEL.zones, 8.12, 7.5, 0);
    const exitSurface = {
      zoneId: 'exit',
      theme: getRaycastZoneTheme('exit-portal'),
      landmark: 'exit' as const,
      cellX: 16,
      cellY: 3,
      variant: 0.4
    };

    expect(getRaycastWallVisualStyle(4, gateSurface)).toMatchObject({
      pattern: 'locked-warning-frame',
      pulseSignal: true,
      signalColor: 0xff7a6d
    });
    expect(getRaycastWallVisualStyle(1, exitSurface)).toMatchObject({
      pattern: 'exit-glow',
      pulseSignal: true
    });
  });

  it('selects ground pattern families from landmark and zone theme context', () => {
    const startGround = getRaycastGroundVisualStyle({
      theme: getRaycastZoneTheme('corrupted-metal'),
      landmark: 'none',
      variant: 0.2
    });
    const gateGround = getRaycastGroundVisualStyle({
      theme: getRaycastZoneTheme('warning-amber'),
      landmark: 'gate',
      variant: 0.5
    });
    const toxicGround = getRaycastGroundVisualStyle({
      theme: getRaycastZoneTheme('toxic-green'),
      landmark: 'key',
      variant: 0.8
    });

    expect(startGround.floorPattern).toBe('scanlines');
    expect(gateGround.floorPattern).toBe('hazard-lattice');
    expect(gateGround.ceilingPattern).toBe('crossbars');
    expect(toxicGround.floorPattern).toBe('noise-cells');
  });

  it('assigns distinct enemy silhouettes and role accents per enemy kind', () => {
    expect(getRaycastEnemyVisualStyle('GRUNT', 0xff6c62)).toMatchObject({
      silhouette: 'raider',
      role: 'pressure',
      hornStyle: 'ram'
    });
    expect(getRaycastEnemyVisualStyle('BRUTE', 0xffb05c)).toMatchObject({
      silhouette: 'juggernaut',
      role: 'heavy',
      hornStyle: 'ram'
    });
    expect(getRaycastEnemyVisualStyle('STALKER', 0x67f0b5)).toMatchObject({
      silhouette: 'phantom',
      role: 'flanker',
      hornStyle: 'glitch-spikes'
    });
    expect(getRaycastEnemyVisualStyle('RANGED', 0x7edbff)).toMatchObject({
      silhouette: 'sentinel',
      role: 'artillery',
      hornStyle: 'antenna'
    });
  });

  it('defines unmistakable billboard colors for stateful interactables', () => {
    expect(getBillboardColor('token')).toBe(0x8ff4c0);
    expect(getBillboardColor('gate')).toBe(0xff7a6d);
    expect(getBillboardColor('gate-open', true)).toBe(0x9feee2);
    expect(getBillboardColor('health')).toBe(0xff8fb0);
    expect(getBillboardColor('exit', false)).toBe(0x6fd8ff);
  });

  it('exposes the authored zone palette accents', () => {
    expect(getRaycastZoneTheme('corrupted-metal').accentColor).toBe(0x5d748d);
    expect(getRaycastZoneTheme('void-stone').accentColor).toBe(0x6a6876);
    expect(getRaycastZoneTheme('warning-amber').accentColor).toBe(0xc26d2f);
    expect(getRaycastZoneTheme('toxic-green').accentColor).toBe(0x1f8c69);
    expect(getRaycastZoneTheme('exit-portal').accentColor).toBe(0x2a9bc2);
  });
});
