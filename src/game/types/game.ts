export type Team = 'P1' | 'P2' | 'ENEMY';
export type EnemyKind = 'GRUNT' | 'BRUTE' | 'STALKER';

export interface HealthLike {
  health: number;
  alive: boolean;
}
