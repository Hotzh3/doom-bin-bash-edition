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
    label: 'DOUBLE DAMAGE / LOW HP',
    summary: 'Hit much harder, survive with lower max HP.',
    details: '+100% player damage, -35% max HP, +25% score gain.',
    effects: { playerDamageMul: 2, playerMaxHealthMul: 0.65, scoreMul: 1.25 }
  },
  {
    id: 'FAST_ENEMIES_MORE_SCORE',
    label: 'FAST ENEMIES / MORE SCORE',
    summary: 'Enemies move faster, score rewards increase.',
    details: '+18% enemy speed, +30% score gain.',
    effects: { enemySpeedMul: 1.18, scoreMul: 1.3 }
  },
  {
    id: 'NO_REGEN_HIGHER_RANK_BONUS',
    label: 'NO REGEN / HIGHER RANK BONUS',
    summary: 'Passive healing disabled for stronger rank rewards.',
    details: 'Passive regen off, +55% rank/campaign completion bonus.',
    effects: { passiveHealMul: 0, rankBonusMul: 1.55 }
  },
  {
    id: 'GLASS_CANNON',
    label: 'GLASS CANNON',
    summary: 'Both sides deal more damage.',
    details: '+45% player damage, +35% enemy damage, +20% score gain.',
    effects: { playerDamageMul: 1.45, enemyDamageMul: 1.35, scoreMul: 1.2 }
  },
  {
    id: 'TREASURE_SIGNAL',
    label: 'TREASURE SIGNAL',
    summary: 'Secrets/tokens are worth more, ambush pressure rises.',
    details: '+80% secret score, +120 token bonus, +18% spawn pressure.',
    effects: { secretScoreMul: 1.8, tokenScoreBonus: 120, spawnPressureMul: 1.18 }
  },
  {
    id: 'OVERCLOCKED',
    label: 'OVERCLOCKED',
    summary: 'You move/shoot faster, but healing takes longer to restart.',
    details: '+12% movement, +18% fire rate, +60% regen delay.',
    effects: { moveSpeedMul: 1.12, fireRateMul: 1.18, passiveHealDelayMul: 1.6 }
  },
  {
    id: 'HUNTER_MARK',
    label: 'HUNTER MARK',
    summary: 'Elites appear more often, scoring is boosted.',
    details: '+22% elite rate, +28% score gain.',
    effects: { eliteRateBonus: 0.22, scoreMul: 1.28 }
  },
  {
    id: 'DARK_ROUTE',
    label: 'DARK ROUTE',
    summary: 'Heavier fog/darkness in exchange for a bigger clear bonus.',
    details: 'Denser fog + darker scenes, +35% clear/performance bonus.',
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
