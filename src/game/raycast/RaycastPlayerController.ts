import Phaser from 'phaser';
import type { RaycastMap } from './RaycastMap';
import {
  applyRaycastMouseTurn,
  getCameraRelativeInput,
  moveWithWallSlide,
  RAYCAST_MOVEMENT,
  updateRaycastVelocity,
  type RaycastMovementConfig
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
  private pointerListenersRegistered = false;
  private moveSpeedMultiplier = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: RaycastMap,
    private readonly state: RaycastPlayerState,
    private readonly config: RaycastMovementConfig = RAYCAST_MOVEMENT,
    private readonly getMouseSensitivityMul?: () => number
  ) {}

  create(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.keys = this.scene.input.keyboard!.addKeys('W,A,S,D,Q,E') as Record<string, Phaser.Input.Keyboard.Key>;
    this.registerPointerControls();
  }

  update(deltaMs: number): void {
    const moveConfig =
      this.moveSpeedMultiplier === 1
        ? this.config
        : {
            ...this.config,
            maxSpeed: this.config.maxSpeed * this.moveSpeedMultiplier,
            forwardSpeed: this.config.forwardSpeed * this.moveSpeedMultiplier,
            backwardSpeed: this.config.backwardSpeed * this.moveSpeedMultiplier,
            strafeSpeed: this.config.strafeSpeed * this.moveSpeedMultiplier
          };
    const deltaSeconds = deltaMs / 1000;
    const turnInput =
      Number(this.cursors.right.isDown || this.keys.E.isDown) - Number(this.cursors.left.isDown || this.keys.Q.isDown);
    this.state.angle += turnInput * moveConfig.turnSpeed * deltaSeconds;

    const forwardInput = Number(this.keys.W.isDown) - Number(this.keys.S.isDown);
    const strafeInput = Number(this.keys.D.isDown) - Number(this.keys.A.isDown);
    const movementInput = getCameraRelativeInput(forwardInput, strafeInput, this.state.angle, moveConfig);
    this.state.velocity = updateRaycastVelocity(this.state.velocity, movementInput, deltaMs, moveConfig);
    const movedState = moveWithWallSlide(this.map, this.state, deltaMs, moveConfig);

    this.state.x = movedState.x;
    this.state.y = movedState.y;
    this.state.velocity = movedState.velocity;
  }

  destroy(): void {
    this.cleanupPointerControls();
  }

  setMoveSpeedMultiplier(multiplier: number): void {
    this.moveSpeedMultiplier = Number.isFinite(multiplier) ? Math.max(0.6, multiplier) : 1;
  }

  private readonly handlePointerDown = (): void => {
    const canvas = this.scene.game.canvas;
    if (document.pointerLockElement === canvas) return;
    canvas.requestPointerLock();
  };

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (document.pointerLockElement !== this.scene.game.canvas) return;
    const mul = this.getMouseSensitivityMul?.() ?? 1;
    this.state.angle = applyRaycastMouseTurn(this.state.angle, pointer.movementX, {
      ...this.config,
      mouseTurnSensitivity: this.config.mouseTurnSensitivity * mul
    });
  };

  private registerPointerControls(): void {
    if (this.pointerListenersRegistered) this.cleanupPointerControls();
    this.scene.input.on('pointerdown', this.handlePointerDown);
    this.scene.input.on('pointermove', this.handlePointerMove);
    this.pointerListenersRegistered = true;
  }

  private cleanupPointerControls(): void {
    if (!this.pointerListenersRegistered) return;
    this.scene.input.off('pointerdown', this.handlePointerDown);
    this.scene.input.off('pointermove', this.handlePointerMove);
    this.pointerListenersRegistered = false;
  }
}
