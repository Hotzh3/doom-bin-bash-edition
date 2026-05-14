export type Team = 'P1' | 'P2' | 'ENEMY';
export type EnemyKind = 'GRUNT' | 'BRUTE' | 'STALKER' | 'RANGED' | 'SCRAMBLER' | 'FLASHER';
export type GameState = 'RUNNING' | 'GAME_OVER' | 'ROUND_CLEAR';

export interface HealthLike {
  health: number;
  alive: boolean;
}
