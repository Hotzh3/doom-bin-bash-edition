import type { EnemyKind } from '../types/game';

/**
 * Lightweight ensemble picks during director PRESSURE — avoids duplicating roles already on the field.
 * Weapon-specific counters in {@link GameDirector.selectEnemyKind} run before this.
 */
export function pickPressureEnsembleKind(counts: Partial<Record<EnemyKind, number>>): EnemyKind | null {
  const brutes = counts.BRUTE ?? 0;
  const ranged = counts.RANGED ?? 0;
  const stalkers = counts.STALKER ?? 0;
  const scramblers = counts.SCRAMBLER ?? 0;

  if (brutes >= 1 && ranged === 0) return 'RANGED';
  if (stalkers >= 2 && brutes === 0) return 'BRUTE';
  if (scramblers >= 2 && brutes === 0) return 'BRUTE';
  if (scramblers >= 1 && ranged >= 1 && stalkers === 0) return 'STALKER';
  return null;
}
