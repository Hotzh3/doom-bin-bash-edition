import type { Team } from '../types/game';
import type { PlayerControls } from './InputManager';
import type { MovementVector } from './MovementSystem';
import { WeaponSystem } from './WeaponSystem';
import type { WeaponFireResult, WeaponKind } from './WeaponTypes';

interface PlayerWeaponControllerInput {
  ownerTeam: Team;
  origin: MovementVector;
  aimDirection: MovementVector;
  controls: PlayerControls;
  time: number;
}

export class PlayerWeaponController {
  private readonly weapons = new WeaponSystem();

  updateWeaponSwitches(controls: PlayerControls): void {
    if (controls.weapon1.isDown) this.weapons.switchBySlot(1);
    if (controls.weapon2.isDown) this.weapons.switchBySlot(2);
    if (controls.weapon3.isDown) this.weapons.switchBySlot(3);
  }

  tryFire(input: PlayerWeaponControllerInput): WeaponFireResult | null {
    this.updateWeaponSwitches(input.controls);
    if (!input.controls.shoot.isDown) return null;

    return this.weapons.fire({
      ownerTeam: input.ownerTeam,
      origin: input.origin,
      direction: input.aimDirection,
      time: input.time
    });
  }

  getCurrentWeapon(): WeaponKind {
    return this.weapons.getCurrentWeapon();
  }

  getCurrentWeaponLabel(): string {
    return this.weapons.getCurrentWeaponLabel();
  }
}
