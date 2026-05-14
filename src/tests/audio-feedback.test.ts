import { describe, expect, it } from 'vitest';
import {
  AUDIO_FEEDBACK_CONFIG,
  getDynamicAmbientAudioPlan,
  getDirectorEventAudioPlan,
  getWeaponAudioPlan,
  shouldThrottleAudioCue,
  type AudioFeedbackCue
} from '../game/systems/AudioFeedbackSystem';

describe('AudioFeedbackSystem config', () => {
  it('defines short, low-volume cues for core combat events', () => {
    const cues: AudioFeedbackCue[] = [
      'shoot',
      'shootPistol',
      'shootShotgun',
      'shootLauncher',
      'hit',
      'kill',
      'death',
      'wallImpact',
      'splash',
      'spawn',
      'door',
      'pickup',
      'pickupHealth',
      'pickupKey',
      'secret',
      'uiSoftDeny',
      'uiDeny',
      'uiConfirm',
      'lowHealthWarning',
      'difficultySelect',
      'difficultyStart',
      'levelComplete',
      'episodeComplete',
      'directorWarning',
      'directorAmbush',
      'directorRecovery',
      'damage',
      'ambient',
      'ambientIndustrial',
      'ambientCorrupt',
      'bossPhaseShift',
      'stingerDread'
    ];

    cues.forEach((cue) => {
      const config = AUDIO_FEEDBACK_CONFIG[cue];
      expect(config.layers.length).toBeGreaterThan(0);
      config.layers.forEach((layer) => {
        expect(layer.frequency).toBeGreaterThan(0);
        expect(layer.duration).toBeGreaterThan(0);
        expect(layer.duration).toBeLessThanOrEqual(0.25);
        expect(layer.volume).toBeGreaterThan(0);
        expect(layer.volume).toBeLessThanOrEqual(0.08);
      });
    });
  });

  it('maps weapon identities to distinct procedural fire cues', () => {
    expect(getWeaponAudioPlan('PISTOL')).toEqual({ cue: 'shootPistol', intensity: 1 });
    expect(getWeaponAudioPlan('SHOTGUN')).toEqual({ cue: 'shootShotgun', intensity: 1 });
    expect(getWeaponAudioPlan('LAUNCHER')).toEqual({ cue: 'shootLauncher', intensity: 1 });
  });

  it('maps director events to expected cue names and intensity bands', () => {
    expect(getDirectorEventAudioPlan('WARNING_MESSAGE')).toEqual({ cue: 'directorWarning', intensity: 0.82 });
    expect(getDirectorEventAudioPlan('PREPARE_AMBUSH')).toEqual({ cue: 'directorAmbush', intensity: 1 });
    expect(getDirectorEventAudioPlan('SPAWN_PRESSURE')).toEqual({ cue: 'directorAmbush', intensity: 1 });
    expect(getDirectorEventAudioPlan('RECOVERY_SIGNAL')).toEqual({ cue: 'directorRecovery', intensity: 0.9 });
    expect(getDirectorEventAudioPlan('PUNISH_STATIONARY')).toEqual({ cue: 'damage', intensity: 0.9 });
    expect(getDirectorEventAudioPlan('AMBIENT_PULSE')).toEqual({ cue: 'ambient', intensity: 0.75 });
  });

  it('rate-limits only cues that opt into throttling', () => {
    expect(shouldThrottleAudioCue('directorWarning', 1000, 500)).toBe(true);
    expect(shouldThrottleAudioCue('directorWarning', 1300, 500)).toBe(false);
    expect(shouldThrottleAudioCue('shootPistol', 1000, 995)).toBe(false);
    expect(shouldThrottleAudioCue('wallImpact', 1000, undefined)).toBe(false);
  });

  it('builds dynamic ambient plans across exploration, combat, and boss phases', () => {
    const exploration = getDynamicAmbientAudioPlan({ inCombat: false, bossPhase: 0, lowHp: false, worldSegment: 'world1' });
    const combat = getDynamicAmbientAudioPlan({ inCombat: true, bossPhase: 0, lowHp: false, worldSegment: 'world1' });
    const bossP2 = getDynamicAmbientAudioPlan({ inCombat: true, bossPhase: 2, lowHp: false, worldSegment: 'world2' });
    const bossP3Low = getDynamicAmbientAudioPlan({ inCombat: true, bossPhase: 3, lowHp: true, worldSegment: 'world2' });

    expect(exploration.primary.cue).toBe('ambient');
    expect(combat.primary.cue).toBe('ambientIndustrial');
    expect(bossP2.overlays.some((p) => p.cue === 'bossPhaseShift')).toBe(true);
    expect(bossP3Low.overlays.some((p) => p.cue === 'stingerDread')).toBe(true);
    expect(bossP3Low.overlays.some((p) => p.cue === 'lowHealthWarning')).toBe(true);
    expect(bossP3Low.intervalMs).toBeLessThan(combat.intervalMs);
  });
});
