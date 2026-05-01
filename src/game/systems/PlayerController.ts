import type Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { PlayerControls } from './InputManager';
import {
  calculateArcadeVelocity,
  DOOMLIKE_PLAYER_MOVEMENT,
  normalizeMovementInput,
  type MovementVector,
  type PlayerMovementConfig
} from './MovementSystem';

interface PlayerControllerOptions {
  movement?: PlayerMovementConfig;
  initialAim: MovementVector;
}

export class PlayerController {
  private readonly movement: PlayerMovementConfig;
  private aimDirection: MovementVector;

  constructor(
    private readonly player: Player,
    private readonly controls: PlayerControls,
    options: PlayerControllerOptions
  ) {
    this.movement = options.movement ?? DOOMLIKE_PLAYER_MOVEMENT;
    this.aimDirection = normalizeMovementInput(options.initialAim);
  }

  update(deltaMs: number): void {
    if (!this.player.alive) {
      this.player.setVelocity(0, 0);
      return;
    }

    const input = this.readMovementInput();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const currentVelocity = { x: body.velocity.x, y: body.velocity.y };
    const nextVelocity = calculateArcadeVelocity(currentVelocity, input, deltaMs, this.movement);

    this.player.setVelocity(nextVelocity.x, nextVelocity.y);

    if (input.x !== 0 || input.y !== 0) {
      this.aimDirection = normalizeMovementInput(input);
    }
  }

  getControls(): PlayerControls {
    return this.controls;
  }

  getAimDirection(): MovementVector {
    return this.aimDirection;
  }

  private readMovementInput(): MovementVector {
    return {
      x: Number(this.controls.right.isDown) - Number(this.controls.left.isDown),
      y: Number(this.controls.down.isDown) - Number(this.controls.up.isDown)
    };
  }
}
