export type EnemyState = 'SPAWN' | 'CHASE' | 'ATTACK' | 'DEAD';

export class EnemyFSM {
  public state: EnemyState = 'SPAWN';

  update(distanceToTarget: number, alive: boolean, attackRange = 36): EnemyState {
    if (!alive) {
      this.state = 'DEAD';
      return this.state;
    }
    if (this.state === 'SPAWN') this.state = 'CHASE';
    if (distanceToTarget < attackRange) this.state = 'ATTACK';
    else this.state = 'CHASE';
    return this.state;
  }
}
