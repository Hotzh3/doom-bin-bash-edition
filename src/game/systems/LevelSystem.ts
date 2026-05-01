import type { ArenaLayout, LockedDoor } from '../level/arenaLayout';
import type { SpawnPoint } from './GameDirector';

export class LevelSystem {
  constructor(readonly layout: ArenaLayout) {}

  getDirectorSpawnPoints(): SpawnPoint[] {
    return this.layout.enemySpawns;
  }

  getOpeningObjective(): string {
    return 'Objective: reach the north room and recover the corruption key';
  }

  findDoor(doorId: string): LockedDoor | undefined {
    return this.layout.doors.find((door) => door.id === doorId);
  }
}
