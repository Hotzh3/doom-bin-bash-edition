import { canOpenDoor, type LockedDoor } from '../level/arenaLayout';
import { KeySystem } from './KeySystem';

export interface DoorAttemptResult {
  opened: boolean;
  alreadyOpen: boolean;
  reason: 'OPENED' | 'ALREADY_OPEN' | 'MISSING_KEY' | 'MISSING_KILLS';
}

export class DoorSystem {
  private readonly openDoors = new Set<string>();

  constructor(private readonly keys: KeySystem) {}

  attemptOpen(door: LockedDoor, kills: number): DoorAttemptResult {
    if (this.isOpen(door.id)) {
      return { opened: false, alreadyOpen: true, reason: 'ALREADY_OPEN' };
    }

    if (!this.keys.hasKey(door.keyId)) {
      return { opened: false, alreadyOpen: false, reason: 'MISSING_KEY' };
    }

    if (!canOpenDoor(true, kills, door)) {
      return { opened: false, alreadyOpen: false, reason: 'MISSING_KILLS' };
    }

    this.openDoors.add(door.id);
    return { opened: true, alreadyOpen: false, reason: 'OPENED' };
  }

  isOpen(doorId: string): boolean {
    return this.openDoors.has(doorId);
  }
}
