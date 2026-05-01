import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { palette } from '../theme/palette';
import type { DirectorDebugInfo } from './DirectorState';
import type { GameState } from '../types/game';

interface HUDUpdateData {
  p1: Player;
  p2: Player;
  enemiesAlive: number;
  enemiesKilled: number;
  gameState: GameState;
  directorIntensity: number;
  directorDebug: DirectorDebugInfo | null;
  p1Weapon: string;
  p2Weapon: string;
}

const BAR_WIDTH = 150;
const BAR_HEIGHT = 10;

export class HUDSystem {
  private p1HealthBar: Phaser.GameObjects.Rectangle;
  private p2HealthBar: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(14, 16, BAR_WIDTH, BAR_HEIGHT, palette.background.hudBarBack, 0.92).setOrigin(0, 0).setDepth(20);
    scene.add.rectangle(14, 43, BAR_WIDTH, BAR_HEIGHT, palette.background.hudBarBack, 0.92).setOrigin(0, 0).setDepth(20);

    this.p1HealthBar = scene.add.rectangle(14, 16, BAR_WIDTH, BAR_HEIGHT, palette.player.p1).setOrigin(0, 0);
    this.p2HealthBar = scene.add.rectangle(14, 43, BAR_WIDTH, BAR_HEIGHT, palette.player.p2).setOrigin(0, 0);
    this.p1HealthBar.setDepth(21);
    this.p2HealthBar.setDepth(21);

    this.text = scene.add.text(14, 58, '', {
      fontSize: '15px',
      fontStyle: '700',
      color: palette.background.panelText,
      backgroundColor: palette.background.hudPanel,
      stroke: palette.background.panelStroke,
      strokeThickness: 3,
      padding: { x: 8, y: 5 }
    });
    this.text.setDepth(20);
  }

  update(data: HUDUpdateData): void {
    this.p1HealthBar.width = this.getHealthBarWidth(data.p1.health);
    this.p2HealthBar.width = this.getHealthBarWidth(data.p2.health);
    this.text.setText(
      [
        `P1 HP ${data.p1.health} K ${data.p1.kills} | ${data.p1Weapon}`,
        `P2 HP ${data.p2.health} K ${data.p2.kills} | ${data.p2Weapon}`,
        `Alive ${data.enemiesAlive} | Down ${data.enemiesKilled}`,
        `State ${data.gameState} | Director ${data.directorIntensity}`,
        this.getDirectorDebugLine(data.directorDebug)
      ].join('\n')
    );
  }

  private getHealthBarWidth(health: number): number {
    const normalizedHealth = Phaser.Math.Clamp(health, 0, 100) / 100;
    return BAR_WIDTH * normalizedHealth;
  }

  private getDirectorDebugLine(debug: DirectorDebugInfo | null): string {
    if (!debug) return 'Director waiting';
    if (!debug.enabled) return `Dir ${debug.state} | debug off`;
    return `Dir ${debug.state} | CD ${Math.ceil(debug.spawnCooldownRemainingMs / 1000)}s | ${debug.lastDecisionReason}`;
  }
}
