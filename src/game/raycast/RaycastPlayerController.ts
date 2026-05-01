import Phaser from 'phaser';
import type { RaycastMap } from './RaycastMap';
import {
  getCameraRelativeInput,
  moveWithWallSlide,
  RAYCAST_MOVEMENT,
  updateRaycastVelocity
} from './RaycastMovement';
import type { MovementVector } from '../systems/MovementSystem';

export interface RaycastPlayerState {
  x: number;
  y: number;
  angle: number;
  velocity: MovementVector;
}

export class RaycastPlayerController {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: RaycastMap,
    private readonly state: RaycastPlayerState,
    private readonly config = RAYCAST_MOVEMENT
  ) {}

  create(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.keys = this.scene.input.keyboard!.addKeys('W,A,S,D,Q,E') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;
    const turnInput = Number(this.cursors.right.isDown || this.keys.E.isDown) - Number(this.cursors.left.isDown || this.keys.Q.isDown);
    this.state.angle += turnInput * this.config.turnSpeed * deltaSeconds;

    const forwardInput = Number(this.keys.W.isDown) - Number(this.keys.S.isDown);
    const strafeInput = Number(this.keys.D.isDown) - Number(this.keys.A.isDown);
    const movementInput = getCameraRelativeInput(forwardInput, strafeInput, this.state.angle);
    this.state.velocity = updateRaycastVelocity(this.state.velocity, movementInput, deltaMs, this.config);
    const movedState = moveWithWallSlide(this.map, this.state, deltaMs, this.config);

    this.state.x = movedState.x;
    this.state.y = movedState.y;
    this.state.velocity = movedState.velocity;
  }
}
