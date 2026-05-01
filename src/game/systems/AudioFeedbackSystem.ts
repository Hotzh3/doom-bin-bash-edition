export type AudioFeedbackCue =
  | 'shoot'
  | 'shootPistol'
  | 'shootShotgun'
  | 'shootLauncher'
  | 'hit'
  | 'kill'
  | 'death'
  | 'wallImpact'
  | 'spawn'
  | 'door'
  | 'pickup'
  | 'damage'
  | 'ambient';

export interface AudioFeedbackConfig {
  frequency: number;
  endFrequency?: number;
  duration: number;
  volume: number;
  type: OscillatorType;
}

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export const AUDIO_FEEDBACK_CONFIG: Record<AudioFeedbackCue, AudioFeedbackConfig> = {
  shoot: {
    frequency: 620,
    endFrequency: 340,
    duration: 0.055,
    volume: 0.035,
    type: 'square'
  },
  shootPistol: {
    frequency: 760,
    endFrequency: 420,
    duration: 0.06,
    volume: 0.045,
    type: 'square'
  },
  shootShotgun: {
    frequency: 190,
    endFrequency: 70,
    duration: 0.13,
    volume: 0.065,
    type: 'sawtooth'
  },
  shootLauncher: {
    frequency: 95,
    endFrequency: 42,
    duration: 0.18,
    volume: 0.07,
    type: 'triangle'
  },
  hit: {
    frequency: 240,
    endFrequency: 95,
    duration: 0.09,
    volume: 0.042,
    type: 'sawtooth'
  },
  kill: {
    frequency: 260,
    endFrequency: 48,
    duration: 0.2,
    volume: 0.06,
    type: 'triangle'
  },
  death: {
    frequency: 220,
    endFrequency: 55,
    duration: 0.18,
    volume: 0.04,
    type: 'triangle'
  },
  wallImpact: {
    frequency: 120,
    endFrequency: 85,
    duration: 0.07,
    volume: 0.034,
    type: 'square'
  },
  spawn: {
    frequency: 90,
    endFrequency: 140,
    duration: 0.12,
    volume: 0.026,
    type: 'sine'
  },
  door: {
    frequency: 120,
    endFrequency: 70,
    duration: 0.16,
    volume: 0.03,
    type: 'sawtooth'
  },
  pickup: {
    frequency: 420,
    endFrequency: 760,
    duration: 0.1,
    volume: 0.026,
    type: 'triangle'
  },
  damage: {
    frequency: 70,
    endFrequency: 45,
    duration: 0.14,
    volume: 0.04,
    type: 'square'
  },
  ambient: {
    frequency: 52,
    endFrequency: 58,
    duration: 0.22,
    volume: 0.012,
    type: 'sine'
  }
};

export class AudioFeedbackSystem {
  private audioContext: AudioContext | null | undefined;

  play(cue: AudioFeedbackCue): void {
    const context = this.getAudioContext();
    if (!context) return;

    const config = AUDIO_FEEDBACK_CONFIG[cue];
    try {
      void context.resume().catch(() => undefined);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      const endTime = now + config.duration;

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, now);
      if (config.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(config.endFrequency, endTime);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(config.volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(endTime);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
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
