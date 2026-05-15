import type { DirectorEventType } from './DirectorEvents';
import type { WeaponKind } from './WeaponTypes';

export type AudioFeedbackCue =
  | 'shoot'
  | 'shootPistol'
  | 'shootShotgun'
  | 'shootLauncher'
  | 'hit'
  | 'kill'
  | 'death'
  | 'wallImpact'
  | 'splash'
  | 'spawn'
  | 'door'
  | 'pickup'
  | 'pickupHealth'
  | 'pickupKey'
  | 'secret'
  | 'uiSoftDeny'
  | 'uiDeny'
  | 'uiConfirm'
  | 'lowHealthWarning'
  | 'difficultySelect'
  | 'difficultyStart'
  | 'levelComplete'
  | 'episodeComplete'
  | 'directorWarning'
  | 'directorAmbush'
  | 'directorRecovery'
  | 'damage'
  | 'ambient'
  | 'ambientIndustrial'
  | 'ambientCorrupt'
  | 'bossPhaseShift'
  | 'stingerDread';

export interface AudioFeedbackLayerConfig {
  frequency: number;
  endFrequency?: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  delay?: number;
}

export interface AudioFeedbackConfig {
  layers: AudioFeedbackLayerConfig[];
  throttleMs?: number;
}

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export const AUDIO_FEEDBACK_CONFIG: Record<AudioFeedbackCue, AudioFeedbackConfig> = {
  shoot: {
    layers: [
      { frequency: 620, endFrequency: 340, duration: 0.055, volume: 0.035, type: 'square' }
    ]
  },
  shootPistol: {
    layers: [
      { frequency: 880, endFrequency: 510, duration: 0.038, volume: 0.042, type: 'square' },
      { frequency: 1820, endFrequency: 1120, duration: 0.022, volume: 0.016, type: 'triangle', delay: 0.002 }
    ]
  },
  shootShotgun: {
    layers: [
      { frequency: 148, endFrequency: 52, duration: 0.165, volume: 0.062, type: 'sawtooth' },
      { frequency: 380, endFrequency: 140, duration: 0.095, volume: 0.024, type: 'square', delay: 0.004 },
      { frequency: 96, endFrequency: 48, duration: 0.06, volume: 0.018, type: 'triangle', delay: 0.012 }
    ]
  },
  shootLauncher: {
    layers: [
      { frequency: 72, endFrequency: 28, duration: 0.22, volume: 0.058, type: 'triangle' },
      { frequency: 185, endFrequency: 62, duration: 0.16, volume: 0.024, type: 'sine', delay: 0.012 },
      { frequency: 420, endFrequency: 120, duration: 0.05, volume: 0.01, type: 'square', delay: 0.045 }
    ]
  },
  hit: {
    layers: [
      { frequency: 310, endFrequency: 108, duration: 0.072, volume: 0.036, type: 'sawtooth' },
      { frequency: 680, endFrequency: 260, duration: 0.045, volume: 0.016, type: 'triangle', delay: 0.002 }
    ],
    throttleMs: 35
  },
  kill: {
    layers: [
      { frequency: 300, endFrequency: 62, duration: 0.2, volume: 0.054, type: 'triangle' },
      { frequency: 520, endFrequency: 140, duration: 0.13, volume: 0.018, type: 'sawtooth', delay: 0.016 },
      { frequency: 880, endFrequency: 220, duration: 0.06, volume: 0.008, type: 'sine', delay: 0.05 }
    ],
    throttleMs: 70
  },
  death: {
    layers: [
      { frequency: 220, endFrequency: 55, duration: 0.18, volume: 0.04, type: 'triangle' }
    ]
  },
  wallImpact: {
    layers: [
      { frequency: 132, endFrequency: 92, duration: 0.08, volume: 0.024, type: 'square' },
      { frequency: 420, endFrequency: 220, duration: 0.03, volume: 0.009, type: 'triangle', delay: 0.002 }
    ],
    throttleMs: 55
  },
  splash: {
    layers: [
      { frequency: 108, endFrequency: 38, duration: 0.2, volume: 0.055, type: 'triangle' },
      { frequency: 260, endFrequency: 92, duration: 0.125, volume: 0.02, type: 'sawtooth', delay: 0.008 },
      { frequency: 58, endFrequency: 32, duration: 0.14, volume: 0.022, type: 'sine', delay: 0.02 }
    ],
    throttleMs: 80
  },
  spawn: {
    layers: [
      { frequency: 94, endFrequency: 146, duration: 0.13, volume: 0.024, type: 'sine' },
      { frequency: 188, endFrequency: 132, duration: 0.08, volume: 0.01, type: 'triangle', delay: 0.016 }
    ],
    throttleMs: 80
  },
  door: {
    layers: [
      { frequency: 118, endFrequency: 72, duration: 0.16, volume: 0.024, type: 'sawtooth' },
      { frequency: 240, endFrequency: 148, duration: 0.09, volume: 0.01, type: 'triangle', delay: 0.012 }
    ],
    throttleMs: 120
  },
  pickup: {
    layers: [
      { frequency: 380, endFrequency: 720, duration: 0.085, volume: 0.024, type: 'triangle' },
      { frequency: 920, endFrequency: 1420, duration: 0.065, volume: 0.014, type: 'sine', delay: 0.02 }
    ],
    throttleMs: 55
  },
  pickupHealth: {
    layers: [
      { frequency: 352, endFrequency: 528, duration: 0.08, volume: 0.018, type: 'triangle' },
      { frequency: 528, endFrequency: 864, duration: 0.12, volume: 0.018, type: 'sine', delay: 0.018 }
    ],
    throttleMs: 90
  },
  pickupKey: {
    layers: [
      { frequency: 380, endFrequency: 760, duration: 0.08, volume: 0.019, type: 'triangle' },
      { frequency: 760, endFrequency: 1180, duration: 0.1, volume: 0.018, type: 'sine', delay: 0.02 }
    ]
  },
  secret: {
    layers: [
      { frequency: 260, endFrequency: 520, duration: 0.08, volume: 0.012, type: 'sine' },
      { frequency: 520, endFrequency: 940, duration: 0.15, volume: 0.018, type: 'triangle', delay: 0.01 }
    ],
    throttleMs: 180
  },
  uiSoftDeny: {
    layers: [
      { frequency: 238, endFrequency: 184, duration: 0.07, volume: 0.016, type: 'square' },
      { frequency: 148, endFrequency: 110, duration: 0.09, volume: 0.01, type: 'triangle', delay: 0.01 }
    ],
    throttleMs: 260
  },
  uiDeny: {
    layers: [
      { frequency: 210, endFrequency: 118, duration: 0.09, volume: 0.026, type: 'square' },
      { frequency: 160, endFrequency: 82, duration: 0.11, volume: 0.014, type: 'sawtooth', delay: 0.008 }
    ],
    throttleMs: 180
  },
  uiConfirm: {
    layers: [
      { frequency: 260, endFrequency: 360, duration: 0.07, volume: 0.018, type: 'triangle' },
      { frequency: 420, endFrequency: 620, duration: 0.08, volume: 0.014, type: 'sine', delay: 0.012 }
    ],
    throttleMs: 140
  },
  lowHealthWarning: {
    layers: [
      { frequency: 156, endFrequency: 132, duration: 0.08, volume: 0.017, type: 'sine' },
      { frequency: 156, endFrequency: 132, duration: 0.08, volume: 0.014, type: 'sine', delay: 0.15 },
      { frequency: 820, endFrequency: 540, duration: 0.055, volume: 0.008, type: 'triangle', delay: 0.088 }
    ],
    throttleMs: 1800
  },
  difficultySelect: {
    layers: [
      { frequency: 318, endFrequency: 422, duration: 0.05, volume: 0.014, type: 'triangle' },
      { frequency: 422, endFrequency: 636, duration: 0.07, volume: 0.012, type: 'sine', delay: 0.01 }
    ],
    throttleMs: 80
  },
  difficultyStart: {
    layers: [
      { frequency: 208, endFrequency: 318, duration: 0.08, volume: 0.018, type: 'triangle' },
      { frequency: 318, endFrequency: 524, duration: 0.11, volume: 0.016, type: 'sine', delay: 0.03 }
    ],
    throttleMs: 220
  },
  levelComplete: {
    layers: [
      { frequency: 240, endFrequency: 360, duration: 0.08, volume: 0.018, type: 'triangle' },
      { frequency: 360, endFrequency: 620, duration: 0.13, volume: 0.022, type: 'sine', delay: 0.03 }
    ]
  },
  episodeComplete: {
    layers: [
      { frequency: 220, endFrequency: 320, duration: 0.09, volume: 0.018, type: 'triangle' },
      { frequency: 320, endFrequency: 540, duration: 0.14, volume: 0.022, type: 'sine', delay: 0.028 },
      { frequency: 540, endFrequency: 820, duration: 0.18, volume: 0.015, type: 'triangle', delay: 0.058 }
    ]
  },
  directorWarning: {
    layers: [
      { frequency: 126, endFrequency: 168, duration: 0.11, volume: 0.015, type: 'sine' },
      { frequency: 310, endFrequency: 220, duration: 0.08, volume: 0.009, type: 'triangle', delay: 0.018 }
    ],
    throttleMs: 650
  },
  directorAmbush: {
    layers: [
      { frequency: 146, endFrequency: 92, duration: 0.12, volume: 0.026, type: 'sawtooth' },
      { frequency: 96, endFrequency: 54, duration: 0.16, volume: 0.018, type: 'triangle', delay: 0.012 }
    ],
    throttleMs: 500
  },
  directorRecovery: {
    layers: [
      { frequency: 188, endFrequency: 260, duration: 0.1, volume: 0.014, type: 'sine' },
      { frequency: 260, endFrequency: 420, duration: 0.12, volume: 0.012, type: 'triangle', delay: 0.02 }
    ],
    throttleMs: 650
  },
  damage: {
    layers: [
      { frequency: 62, endFrequency: 38, duration: 0.155, volume: 0.038, type: 'square' },
      { frequency: 148, endFrequency: 62, duration: 0.095, volume: 0.018, type: 'sawtooth', delay: 0.005 },
      { frequency: 240, endFrequency: 110, duration: 0.06, volume: 0.009, type: 'triangle', delay: 0.022 }
    ],
    throttleMs: 88
  },
  ambient: {
    layers: [
      { frequency: 52, endFrequency: 58, duration: 0.22, volume: 0.012, type: 'sine' },
      { frequency: 112, endFrequency: 76, duration: 0.14, volume: 0.0065, type: 'triangle', delay: 0.045 }
    ],
    throttleMs: 520
  },
  /** Director pressure / boss pit — grinding machinery undertones (still short procedural blips). */
  ambientIndustrial: {
    layers: [
      { frequency: 72, endFrequency: 96, duration: 0.18, volume: 0.014, type: 'sawtooth' },
      { frequency: 156, endFrequency: 118, duration: 0.14, volume: 0.009, type: 'square', delay: 0.028 },
      { frequency: 240, endFrequency: 180, duration: 0.11, volume: 0.0055, type: 'triangle', delay: 0.055 }
    ],
    throttleMs: 480
  },
  /** Ion stratum / corrupted signal bed — whisper HF decay + low crawl. */
  ambientCorrupt: {
    layers: [
      { frequency: 58, endFrequency: 74, duration: 0.2, volume: 0.011, type: 'sine' },
      { frequency: 620, endFrequency: 420, duration: 0.09, volume: 0.0045, type: 'triangle', delay: 0.04 },
      { frequency: 118, endFrequency: 92, duration: 0.12, volume: 0.007, type: 'sawtooth', delay: 0.018 }
    ],
    throttleMs: 540
  },
  /** Boss phase transition — sub-heavy sweep distinct from director ambush spawn sting. */
  bossPhaseShift: {
    layers: [
      { frequency: 48, endFrequency: 28, duration: 0.18, volume: 0.042, type: 'triangle' },
      { frequency: 180, endFrequency: 72, duration: 0.14, volume: 0.022, type: 'sawtooth', delay: 0.02 },
      { frequency: 520, endFrequency: 160, duration: 0.08, volume: 0.012, type: 'sine', delay: 0.045 }
    ],
    throttleMs: 2400
  },
  /** Telegraph edge — thin harmonic stab; paired with directorWarning, heavily throttled. */
  stingerDread: {
    layers: [
      { frequency: 280, endFrequency: 120, duration: 0.065, volume: 0.022, type: 'triangle' },
      { frequency: 920, endFrequency: 380, duration: 0.045, volume: 0.011, type: 'sine', delay: 0.018 }
    ],
    throttleMs: 950
  }
};

export interface AudioFeedbackPlan {
  cue: AudioFeedbackCue;
  intensity: number;
}

export function getWeaponAudioPlan(weapon: WeaponKind): AudioFeedbackPlan {
  if (weapon === 'SHOTGUN') return { cue: 'shootShotgun', intensity: 1 };
  if (weapon === 'LAUNCHER') return { cue: 'shootLauncher', intensity: 1 };
  return { cue: 'shootPistol', intensity: 1 };
}

export function getDirectorEventAudioPlan(eventType: DirectorEventType): AudioFeedbackPlan {
  if (eventType === 'ENCOUNTER_PATTERN') {
    return { cue: 'directorWarning', intensity: 0.94 };
  }
  if (eventType === 'PREPARE_AMBUSH' || eventType === 'SPAWN_PRESSURE') {
    return { cue: 'directorAmbush', intensity: 1 };
  }
  if (eventType === 'RECOVERY_SIGNAL') {
    return { cue: 'directorRecovery', intensity: 0.9 };
  }
  if (eventType === 'WARNING_MESSAGE') {
    return { cue: 'directorWarning', intensity: 0.82 };
  }
  if (eventType === 'PUNISH_STATIONARY') {
    return { cue: 'damage', intensity: 0.9 };
  }
  return { cue: 'ambient', intensity: 0.75 };
}

export function shouldThrottleAudioCue(
  cue: AudioFeedbackCue,
  nowMs: number,
  lastPlayedAtMs: number | undefined
): boolean {
  const throttleMs = AUDIO_FEEDBACK_CONFIG[cue].throttleMs ?? 0;
  if (throttleMs <= 0 || lastPlayedAtMs === undefined) return false;
  return nowMs - lastPlayedAtMs < throttleMs;
}

export class AudioFeedbackSystem {
  private audioContext: AudioContext | null | undefined;
  private readonly lastPlayedAt = new Map<AudioFeedbackCue, number>();
  private masterVolume = 1;

  setMasterVolume(linear: number): void {
    this.masterVolume = Math.max(0, Math.min(1, linear));
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  play(cue: AudioFeedbackCue, intensity = 1, nowMs = performance.now()): void {
    const context = this.getAudioContext();
    if (!context) return;

    const config = AUDIO_FEEDBACK_CONFIG[cue];
    if (shouldThrottleAudioCue(cue, nowMs, this.lastPlayedAt.get(cue))) return;
    this.lastPlayedAt.set(cue, nowMs);

    try {
      void context.resume().catch(() => undefined);
      config.layers.forEach((layer) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startTime = context.currentTime + (layer.delay ?? 0);
        const endTime = startTime + layer.duration;
        const layerVolume = Math.max(0.0001, Math.min(0.08, layer.volume * intensity * this.masterVolume));

        oscillator.type = layer.type;
        oscillator.frequency.setValueAtTime(layer.frequency, startTime);
        if (layer.endFrequency) {
          oscillator.frequency.exponentialRampToValueAtTime(layer.endFrequency, endTime);
        }

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(layerVolume, startTime + Math.min(0.01, layer.duration * 0.4));
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Audio feedback is optional and must never block gameplay.
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.audioContext !== undefined) return this.audioContext;
    if (typeof window === 'undefined') {
      this.audioContext = null;
      return this.audioContext;
    }

    const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) {
      this.audioContext = null;
      return this.audioContext;
    }

    try {
      this.audioContext = new AudioContextConstructor();
    } catch {
      this.audioContext = null;
    }

    return this.audioContext;
  }
}
