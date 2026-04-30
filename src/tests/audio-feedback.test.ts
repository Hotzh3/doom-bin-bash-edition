import { describe, expect, it } from 'vitest';
import { AUDIO_FEEDBACK_CONFIG, type AudioFeedbackCue } from '../game/systems/AudioFeedbackSystem';

describe('AudioFeedbackSystem config', () => {
  it('defines short, low-volume cues for core combat events', () => {
    const cues: AudioFeedbackCue[] = ['shoot', 'hit', 'death', 'spawn'];

    cues.forEach((cue) => {
      const config = AUDIO_FEEDBACK_CONFIG[cue];
      expect(config.frequency).toBeGreaterThan(0);
      expect(config.duration).toBeGreaterThan(0);
      expect(config.duration).toBeLessThanOrEqual(0.2);
      expect(config.volume).toBeGreaterThan(0);
      expect(config.volume).toBeLessThanOrEqual(0.05);
    });
  });
});
