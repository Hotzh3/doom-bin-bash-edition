import { describe, expect, it } from 'vitest';
import {
  RAYCAST_LEVEL_CATALOG,
  RAYCAST_WORLD_TWO_CATALOG,
  type RaycastLevel
} from '../game/raycast/RaycastLevel';
import {
  isRaycastSetpieceCue,
  RAYCAST_SETPIECE_CUES,
  RAYCAST_SETPIECE_CUE_SUMMARY
} from '../game/raycast/RaycastSetpiece';

function collectSetpieceRefs(level: RaycastLevel): unknown[] {
  const beat = level.encounterBeats.map((b) => b.setpieceCue).filter((v) => v !== undefined);
  const trig = level.triggers.map((t) => t.setpieceCue).filter((v) => v !== undefined);
  return [...beat, ...trig];
}

describe('raycast setpiece cues', () => {
  it('covers every cue id with a short summary string', () => {
    expect(RAYCAST_SETPIECE_CUES.length).toBeGreaterThan(0);
    RAYCAST_SETPIECE_CUES.forEach((cue) => {
      expect(RAYCAST_SETPIECE_CUE_SUMMARY[cue].length).toBeGreaterThan(12);
    });
  });

  it('only references known cues from authored levels', () => {
    const levels = [...RAYCAST_LEVEL_CATALOG, ...RAYCAST_WORLD_TWO_CATALOG];
    levels.forEach((level) => {
      collectSetpieceRefs(level).forEach((cue) => {
        expect(isRaycastSetpieceCue(cue), `${level.id}: ${String(cue)}`).toBe(true);
      });
    });
  });

  it('authors at least one memorable trigger + beat across catalogs', () => {
    const levels = [...RAYCAST_LEVEL_CATALOG, ...RAYCAST_WORLD_TWO_CATALOG];
    let triggers = 0;
    let beats = 0;
    levels.forEach((level) => {
      triggers += level.triggers.filter((t) => t.setpieceCue !== undefined).length;
      beats += level.encounterBeats.filter((b) => b.setpieceCue !== undefined).length;
    });
    expect(triggers).toBeGreaterThanOrEqual(2);
    expect(beats).toBeGreaterThanOrEqual(2);
  });
});
