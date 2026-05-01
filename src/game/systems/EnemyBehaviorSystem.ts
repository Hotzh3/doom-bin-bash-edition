import type { EnemyConfig } from '../entities/enemyConfig';
import type { MovementVector } from './MovementSystem';

export type EnemyBehaviorAction = 'IDLE' | 'CHASE' | 'RETREAT' | 'MELEE_ATTACK' | 'RANGED_ATTACK';

export interface EnemyBehaviorInput {
  distanceToTarget: number;
  enemyAlive: boolean;
  targetAlive: boolean;
  config: EnemyConfig;
}

export interface EnemyBehaviorDecision {
  action: EnemyBehaviorAction;
  speedMultiplier: number;
}

export function decideEnemyBehavior(input: EnemyBehaviorInput): EnemyBehaviorDecision {
  if (!input.enemyAlive || !input.targetAlive || input.distanceToTarget > input.config.detectionRange) {
    return { action: 'IDLE', speedMultiplier: 0 };
  }

  if (input.config.behaviorHint === 'RANGED_PRESSURE') {
    return decideRangedBehavior(input.distanceToTarget, input.config);
  }

  if (input.distanceToTarget <= input.config.attackRange) {
    return { action: 'MELEE_ATTACK', speedMultiplier: 0 };
  }

  return {
    action: 'CHASE',
    speedMultiplier: input.config.behaviorHint === 'MELEE_PRESSURE' ? 1.08 : 1
  };
}

export function getDirection(from: MovementVector, to: MovementVector): MovementVector {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { x: 0, y: 0 };
  return { x: dx / distance, y: dy / distance };
}

function decideRangedBehavior(distanceToTarget: number, config: EnemyConfig): EnemyBehaviorDecision {
  const preferredRange = config.preferredRange ?? config.attackRange * 0.7;
  const tooCloseRange = preferredRange * 0.68;

  if (distanceToTarget <= tooCloseRange) {
    return { action: 'RETREAT', speedMultiplier: 0.9 };
  }

  if (distanceToTarget <= config.attackRange) {
    return { action: 'RANGED_ATTACK', speedMultiplier: 0 };
  }

  return { action: 'CHASE', speedMultiplier: 0.82 };
}
