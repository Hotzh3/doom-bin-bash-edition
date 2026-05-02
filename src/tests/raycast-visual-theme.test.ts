import { describe, expect, it } from 'vitest';
import { RAYCAST_LEVEL } from '../game/raycast/RaycastLevel';
import {
  getBillboardColor,
  getRaycastCellVariant,
  getRaycastZoneTheme,
  getRaycastZoneVisual,
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

  it('defines unmistakable billboard colors for stateful interactables', () => {
    expect(getBillboardColor('token')).toBe(0x8ff4c0);
    expect(getBillboardColor('gate')).toBe(0xff7a6d);
    expect(getBillboardColor('gate-open', true)).toBe(0x9feee2);
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
