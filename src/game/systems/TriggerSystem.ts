import type { LevelTrigger, PlayerSpawn } from '../level/arenaLayout';
import { isPointInsideRect } from '../level/arenaLayout';

export class TriggerSystem {
  private readonly activatedTriggers = new Set<string>();

  activateIfEntered(trigger: LevelTrigger, points: PlayerSpawn[]): boolean {
    if (trigger.once && this.activatedTriggers.has(trigger.id)) return false;

    const entered = points.some((point) => isPointInsideRect(point, trigger));
    if (!entered) return false;

    this.activatedTriggers.add(trigger.id);
    return true;
  }

  hasActivated(triggerId: string): boolean {
    return this.activatedTriggers.has(triggerId);
  }
}
