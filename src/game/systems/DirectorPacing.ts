import type { DirectorConfig } from './DirectorConfig';

export type DirectorPressureCause = 'none' | 'zone-ambush' | 'anti-camp' | 'dominance';
export type AntiCampPhase = 'none' | 'watching' | 'warning' | 'pressure';

export interface AntiCampState {
  meterMs: number;
  phase: AntiCampPhase;
}

export interface AntiCampInput {
  stationaryMs: number;
  deltaMs: number;
  recentKill: boolean;
}

export function updateAntiCampState(
  previous: AntiCampState,
  input: AntiCampInput,
  config: Pick<DirectorConfig, 'idlePressureMs' | 'stationaryPressureGraceMs' | 'warningLeadMs'>
): AntiCampState {
  const deltaMs = Math.max(0, input.deltaMs);
  const isCamping = input.stationaryMs >= config.idlePressureMs;
  const decayMultiplier = input.recentKill ? 2.2 : 1.35;
  const nextMeterMs = isCamping
    ? Math.min(config.stationaryPressureGraceMs, previous.meterMs + deltaMs)
    : Math.max(0, previous.meterMs - deltaMs * decayMultiplier);

  return {
    meterMs: nextMeterMs,
    phase: getAntiCampPhase(nextMeterMs, input.stationaryMs, config)
  };
}

function getAntiCampPhase(
  meterMs: number,
  stationaryMs: number,
  config: Pick<DirectorConfig, 'idlePressureMs' | 'stationaryPressureGraceMs' | 'warningLeadMs'>
): AntiCampPhase {
  if (meterMs >= config.stationaryPressureGraceMs) return 'pressure';
  if (stationaryMs >= config.idlePressureMs && meterMs >= config.warningLeadMs) return 'warning';
  if (stationaryMs >= config.idlePressureMs * 0.55 || meterMs >= config.warningLeadMs * 0.4) return 'watching';
  return 'none';
}

export function shouldMatureWarning(
  cause: DirectorPressureCause,
  warningStartedAt: number,
  now: number,
  config: Pick<DirectorConfig, 'warningLeadMs'>,
  antiCamp: AntiCampState
): boolean {
  if (cause === 'none') return false;
  if (now - warningStartedAt < config.warningLeadMs) return false;
  if (cause === 'anti-camp') return antiCamp.phase === 'pressure';
  return true;
}
