import { describe, expect, it } from 'vitest';
import { RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';
import { RAYCAST_LEVEL_WORLD2_FRACTURE } from '../game/raycast/RaycastWorldTwoLevels';
import {
  getBillboardColor,
  getRaycastCellVariant,
  getRaycastEnemyVisualStyle,
  getRaycastGroundVisualStyle,
  getRaycastWallVisualStyle,
  getRaycastLandmarkColumnShadeBoost,
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

  it('World 2 fracture primary walls use basalt noise vs ion shaft slabs (distinct from Episode 1)', () => {
    const basaltSurface = sampleRaycastSurfaceContext(RAYCAST_LEVEL_WORLD2_FRACTURE.zones, 3.0, 8.5, 0);
    const ionSurface = sampleRaycastSurfaceContext(RAYCAST_LEVEL_WORLD2_FRACTURE.zones, 3.5, 3.5, 0);
    expect(getRaycastWallVisualStyle(1, basaltSurface)).toMatchObject({
      pattern: 'data-noise-cells',
      pulseSignal: false
    });
    expect(getRaycastWallVisualStyle(1, ionSurface)).toMatchObject({
      pattern: 'terminal-panels',
      pulseSignal: true
    });
  });

  it('World 2 fracture separates basalt gully from ion-well key landmark', () => {
    const ionWell = getRaycastZoneVisual(RAYCAST_LEVEL_WORLD2_FRACTURE.zones, 4.5, 3.5);
    expect(ionWell?.id).toBe('ion-well');
    expect(ionWell?.visualTheme).toBe('ion-shaft');
    expect(ionWell?.landmark).toBe('key');
    const gully = getRaycastZoneVisual(RAYCAST_LEVEL_WORLD2_FRACTURE.zones, 3.0, 8.5);
    expect(gully?.visualTheme).toBe('basalt-rift');
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
      signalColor: 0xe83048
    });
    expect(getRaycastWallVisualStyle(1, exitSurface)).toMatchObject({
      pattern: 'exit-glow',
      pulseSignal: true
    });
  });

  it('maps authored setpiece landmarks to hazard and bridge wall grammars', () => {
    const reactorSurface = {
      zoneId: 'x',
      theme: getRaycastZoneTheme('toxic-green'),
      landmark: 'reactor' as const,
      cellX: 4,
      cellY: 9,
      variant: 0.33
    };
    const bridgeSurface = {
      zoneId: 'y',
      theme: getRaycastZoneTheme('ion-shaft'),
      landmark: 'bridge' as const,
      cellX: 2,
      cellY: 3,
      variant: 0.5
    };
    expect(getRaycastWallVisualStyle(1, reactorSurface)).toMatchObject({
      pattern: 'hazard-strips',
      pulseSignal: true
    });
    expect(getRaycastWallVisualStyle(1, bridgeSurface)).toMatchObject({
      pattern: 'terminal-panels',
      pulseSignal: false,
      panelStride: 24
    });
    expect(getRaycastLandmarkColumnShadeBoost('core')).toBeGreaterThan(getRaycastLandmarkColumnShadeBoost('bridge'));
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
    expect(toxicGround.floorPattern).toBe('grid-cells');
    expect(toxicGround.ceilingPattern).toBe('crossbars');
  });

  it('assigns distinct enemy silhouettes and role accents per enemy kind', () => {
    const gruntStyle = getRaycastEnemyVisualStyle('GRUNT', 0xff5c42);
    const bruteStyle = getRaycastEnemyVisualStyle('BRUTE', 0xffa64d);
    const stalkerStyle = getRaycastEnemyVisualStyle('STALKER', 0x54e898);
    const rangedStyle = getRaycastEnemyVisualStyle('RANGED', 0x5cefef);

    expect(gruntStyle).toMatchObject({
      silhouette: 'raider',
      role: 'pressure',
      hornStyle: 'tusk'
    });
    expect(bruteStyle).toMatchObject({
      silhouette: 'juggernaut',
      role: 'heavy',
      hornStyle: 'ram'
    });
    expect(stalkerStyle).toMatchObject({
      silhouette: 'phantom',
      role: 'flanker',
      hornStyle: 'glitch-spikes'
    });
    expect(rangedStyle).toMatchObject({
      silhouette: 'sentinel',
      role: 'artillery',
      hornStyle: 'antenna'
    });
    expect(bruteStyle.coreColor).not.toBe(gruntStyle.coreColor);
    expect(stalkerStyle.windupColor).not.toBe(rangedStyle.windupColor);
  });

  it('defines unmistakable billboard colors for stateful interactables', () => {
    expect(getBillboardColor('token')).toBe(0x72f298);
    expect(getBillboardColor('gate')).toBe(0xdc2840);
    expect(getBillboardColor('gate-open', true)).toBe(0x58f2e4);
    expect(getBillboardColor('health')).toBe(0xff7098);
    expect(getBillboardColor('exit', false)).toBe(0x48b0c8);
  });

  it('exposes the authored zone palette accents', () => {
    expect(getRaycastZoneTheme('corrupted-metal').accentColor).toBe(0x556080);
    expect(getRaycastZoneTheme('void-stone').accentColor).toBe(0x5a4a68);
    expect(getRaycastZoneTheme('warning-amber').accentColor).toBe(0xc86828);
    expect(getRaycastZoneTheme('toxic-green').accentColor).toBe(0x1c8050);
    expect(getRaycastZoneTheme('exit-portal').accentColor).toBe(0x2898a8);
  });
});
