export type EnemyState = 'SPAWN' | 'CHASE' | 'ATTACK' | 'DEAD';

export class EnemyFSM {
  public state: EnemyState = 'SPAWN';

  update(distanceToTarget: number, alive: boolean): EnemyState {
    if (!alive) {
      this.state = 'DEAD';
      return this.state;
    }
    if (this.state === 'SPAWN') this.state = 'CHASE';
    if (distanceToTarget < 36) this.state = 'ATTACK';
    else this.state = 'CHASE';
    return this.state;
  }
}
