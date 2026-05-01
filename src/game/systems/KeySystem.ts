import type { KeyPickup } from '../level/arenaLayout';

export class KeySystem {
  private readonly collectedKeys = new Set<string>();

  collect(key: KeyPickup): boolean {
    if (this.collectedKeys.has(key.id)) return false;
    this.collectedKeys.add(key.id);
    return true;
  }

  hasKey(keyId: string): boolean {
    return this.collectedKeys.has(keyId);
  }
}
