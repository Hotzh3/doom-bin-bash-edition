export type RunModifierId =
  | 'DOUBLE_DAMAGE_LOW_HP'
  | 'FAST_ENEMIES_MORE_SCORE'
  | 'NO_REGEN_HIGHER_RANK_BONUS'
  | 'GLASS_CANNON'
  | 'TREASURE_SIGNAL'
  | 'OVERCLOCKED'
  | 'HUNTER_MARK'
  | 'DARK_ROUTE';

export interface RunModifier {
  id: RunModifierId;
  label: string;
  summary: string;
  details: string;
  effects: {
    playerDamageMul?: number;
    playerMaxHealthMul?: number;
    enemySpeedMul?: number;
    enemyDamageMul?: number;
    scoreMul?: number;
    rankBonusMul?: number;
    passiveHealMul?: number;
    passiveHealDelayMul?: number;
    moveSpeedMul?: number;
    fireRateMul?: number;
    spawnPressureMul?: number;
    eliteRateBonus?: number;
    fogMul?: number;
    darknessAdd?: number;
    tokenScoreBonus?: number;
    secretScoreMul?: number;
    clearBonusMul?: number;
  };
}

export const RUN_MODIFIER_ROULETTE: readonly RunModifier[] = [
  {
    id: 'DOUBLE_DAMAGE_LOW_HP',
    label: 'DOBLE DAÑO / VIDA BAJA',
    summary: 'Pegas mucho más fuerte, pero con menos vida máxima.',
    details: '+100% daño del jugador, -35% vida máxima, +25% de puntaje.',
    effects: { playerDamageMul: 2, playerMaxHealthMul: 0.65, scoreMul: 1.25 }
  },
  {
    id: 'FAST_ENEMIES_MORE_SCORE',
    label: 'ENEMIGOS RÁPIDOS / MÁS PUNTAJE',
    summary: 'Los enemigos se mueven más rápido y sube el puntaje.',
    details: '+18% velocidad enemiga, +30% de puntaje.',
    effects: { enemySpeedMul: 1.18, scoreMul: 1.3 }
  },
  {
    id: 'NO_REGEN_HIGHER_RANK_BONUS',
    label: 'SIN REGEN / BONO DE RANGO',
    summary: 'Sin curación pasiva, pero mejor premio de rango.',
    details: 'Regen pasiva desactivada, +55% bono de rango/campaña.',
    effects: { passiveHealMul: 0, rankBonusMul: 1.55 }
  },
  {
    id: 'GLASS_CANNON',
    label: 'CAÑÓN DE CRISTAL',
    summary: 'Ambos lados hacen más daño.',
    details: '+45% daño del jugador, +35% daño enemigo, +20% de puntaje.',
    effects: { playerDamageMul: 1.45, enemyDamageMul: 1.35, scoreMul: 1.2 }
  },
  {
    id: 'TREASURE_SIGNAL',
    label: 'SEÑAL DE TESORO',
    summary: 'Secretos/llaves valen más, pero suben emboscadas.',
    details: '+80% puntaje de secretos, +120 bono de llaves, +18% presión de spawns.',
    effects: { secretScoreMul: 1.8, tokenScoreBonus: 120, spawnPressureMul: 1.18 }
  },
  {
    id: 'OVERCLOCKED',
    label: 'SOBREACELERADO',
    summary: 'Te mueves y disparas más rápido, pero la regen tarda más.',
    details: '+12% movimiento, +18% cadencia, +60% retraso de regen.',
    effects: { moveSpeedMul: 1.12, fireRateMul: 1.18, passiveHealDelayMul: 1.6 }
  },
  {
    id: 'HUNTER_MARK',
    label: 'MARCA DEL CAZADOR',
    summary: 'Aparecen más élites y sube el puntaje.',
    details: '+22% tasa de élites, +28% de puntaje.',
    effects: { eliteRateBonus: 0.22, scoreMul: 1.28 }
  },
  {
    id: 'DARK_ROUTE',
    label: 'RUTA OSCURA',
    summary: 'Más niebla/oscuridad a cambio de mayor bono de limpieza.',
    details: 'Niebla más densa + escenas más oscuras, +35% bono de desempeño.',
    effects: { fogMul: 0.82, darknessAdd: 0.06, clearBonusMul: 1.35 }
  }
] as const;

export function getRunModifierById(id: RunModifierId | null | undefined): RunModifier | null {
  if (!id) return null;
  return RUN_MODIFIER_ROULETTE.find((m) => m.id === id) ?? null;
}

export function rollRunModifier(rng: () => number = Math.random): RunModifier {
  const i = Math.max(0, Math.min(RUN_MODIFIER_ROULETTE.length - 1, Math.floor(rng() * RUN_MODIFIER_ROULETTE.length)));
  return RUN_MODIFIER_ROULETTE[i];
}

export function applyRunModifierScore(base: number, mod: RunModifier | null): number {
  const mul = mod?.effects.scoreMul ?? 1;
  return Math.max(0, Math.round(base * mul));
}

export function applyRunModifierRankBonus(base: number, mod: RunModifier | null): number {
  const mul = mod?.effects.rankBonusMul ?? 1;
  return Math.max(0, Math.round(base * mul));
}
