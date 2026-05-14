import type { RaycastBossState } from './RaycastBoss';

export interface RaycastBossVisualProfile {
  silhouetteScale: number;
  ringCount: number;
  haloColor: number;
  coreColor: number;
  particleCount: number;
}

export function getRaycastBossVisualProfile(
  boss: Pick<RaycastBossState, 'behavior' | 'phase' | 'hitFlashUntil'>,
  time: number
): RaycastBossVisualProfile {
  const phaseBoost = boss.phase === 1 ? 0 : boss.phase === 2 ? 0.08 : 0.16;
  if (boss.behavior === 'bloom-warden') {
    return {
      silhouetteScale: 1.26 + phaseBoost,
      ringCount: boss.phase === 3 ? 5 : boss.phase === 2 ? 4 : 3,
      haloColor: boss.phase === 3 ? 0xc6ff63 : 0x8fdb52,
      coreColor: time < boss.hitFlashUntil ? 0xfff6e2 : boss.phase === 3 ? 0xd7ff7a : 0xa3dd63,
      particleCount: boss.phase === 3 ? 14 : boss.phase === 2 ? 10 : 7
    };
  }
  if (boss.behavior === 'ash-judge') {
    return {
      silhouetteScale: 1.24 + phaseBoost,
      ringCount: boss.phase === 3 ? 5 : boss.phase === 2 ? 4 : 3,
      haloColor: boss.phase === 3 ? 0xff3d2d : 0xff5f33,
      coreColor: time < boss.hitFlashUntil ? 0xfff8f4 : boss.phase === 3 ? 0xff6448 : 0xff5a4a,
      particleCount: boss.phase === 3 ? 13 : boss.phase === 2 ? 9 : 6
    };
  }
  return {
    silhouetteScale: 1.2 + phaseBoost,
    ringCount: boss.phase === 3 ? 4 : boss.phase === 2 ? 3 : 2,
    haloColor: boss.phase === 3 ? 0xff7844 : 0xff8833,
    coreColor: time < boss.hitFlashUntil ? 0xfff8f4 : boss.phase >= 2 ? 0xff6a58 : 0x6b4ae8,
    particleCount: boss.phase === 3 ? 11 : boss.phase === 2 ? 8 : 5
  };
}
