import Phaser from 'phaser';
import { castRay, type RaycastMap } from './RaycastMap';
import type { RaycastEnemy } from './RaycastEnemy';
import type { RaycastEnemyProjectile } from './RaycastEnemySystem';
import type { RaycastPlayerState } from './RaycastPlayerController';
import {
  RAYCAST_ATMOSPHERE,
  calculateFogShade,
  getAtmosphereForDirector,
  type RaycastAtmosphereRenderOptions
} from './RaycastAtmosphere';

export interface RaycastRendererConfig {
  fovRadians: number;
  rayCount: number;
  maxWallHeight: number;
}

export const RAYCAST_RENDERER_CONFIG: RaycastRendererConfig = {
  fovRadians: Math.PI / 3,
  rayCount: 160,
  maxWallHeight: 620
};

const WALL_COLORS: Record<number, number> = RAYCAST_ATMOSPHERE.wallColors;

export interface RaycastBillboard {
  x: number;
  y: number;
  color: number;
  radius: number;
  label?: string;
}

export class RaycastRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private depthBuffer: number[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly map: RaycastMap,
    private readonly config = RAYCAST_RENDERER_CONFIG
  ) {
    this.graphics = scene.add.graphics();
  }

  render(
    player: RaycastPlayerState,
    width: number,
    height: number,
    atmosphere: RaycastAtmosphereRenderOptions = getAtmosphereForDirector(null, 0)
  ): void {
    this.graphics.clear();
    this.drawBackground(width, height, atmosphere);

    const columnWidth = width / this.config.rayCount;
    const startAngle = player.angle - this.config.fovRadians * 0.5;

    for (let column = 0; column < this.config.rayCount; column += 1) {
      const cameraT = column / Math.max(1, this.config.rayCount - 1);
      const rayAngle = startAngle + cameraT * this.config.fovRadians;
      const hit = castRay(this.map, player.x, player.y, rayAngle, player.angle);
      this.depthBuffer[column] = hit.correctedDistance;
      const wallHeight = Math.min(this.config.maxWallHeight, height / hit.correctedDistance);
      const sectorShade = RAYCAST_ATMOSPHERE.sectorDarkness[hit.wallType as keyof typeof RAYCAST_ATMOSPHERE.sectorDarkness] ?? 1;
      const shade = Phaser.Math.Clamp(calculateFogShade(hit.correctedDistance, atmosphere) * sectorShade, atmosphere.ambientDarkness, 1);
      const color = this.blendColors(this.applyShade(WALL_COLORS[hit.wallType] ?? WALL_COLORS[1], shade), atmosphere.fogColor, 1 - shade);
      const x = column * columnWidth;
      const y = height * 0.5 - wallHeight * 0.5;

      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(x, y, Math.ceil(columnWidth) + 1, wallHeight);
    }
  }

  renderEnemies(player: RaycastPlayerState, enemies: RaycastEnemy[], width: number, height: number, time: number): void {
    const visibleEnemies = enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => this.projectEnemy(player, enemy, width, height))
      .filter((projection): projection is EnemyProjection => projection !== null)
      .sort((a, b) => b.distance - a.distance);

    visibleEnemies.forEach((projection) => {
      const column = Phaser.Math.Clamp(Math.floor(projection.screenX / (width / this.config.rayCount)), 0, this.config.rayCount - 1);
      if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) return;

      const color = projection.enemy.hitFlashUntil > time ? 0xffffff : projection.enemy.color;
      const visibility = Phaser.Math.Clamp(calculateFogShade(projection.distance, getAtmosphereForDirector(null, 0)) + 0.25, 0.45, 1);
      this.graphics.fillStyle(color, 0.95 * visibility);
      this.graphics.fillRect(
        projection.screenX - projection.size * 0.5,
        height * 0.5 - projection.size * 0.55,
        projection.size,
        projection.size * 1.1
      );
      this.graphics.fillStyle(0x0b0d12, 1);
      this.graphics.fillRect(projection.screenX - projection.size * 0.22, height * 0.5 - projection.size * 0.24, projection.size * 0.12, projection.size * 0.12);
      this.graphics.fillRect(projection.screenX + projection.size * 0.1, height * 0.5 - projection.size * 0.24, projection.size * 0.12, projection.size * 0.12);
    });
  }

  renderEnemyProjectiles(
    player: RaycastPlayerState,
    projectiles: RaycastEnemyProjectile[],
    width: number,
    height: number
  ): void {
    projectiles
      .filter((projectile) => projectile.alive)
      .map((projectile) => this.projectPoint(player, projectile, width, height))
      .filter((projection): projection is ProjectileProjection => projection !== null)
      .sort((a, b) => b.distance - a.distance)
      .forEach((projection) => {
        const column = Phaser.Math.Clamp(Math.floor(projection.screenX / (width / this.config.rayCount)), 0, this.config.rayCount - 1);
        if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) return;

        this.graphics.fillStyle(projection.projectile.color, 0.95);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size);
        this.graphics.lineStyle(2, 0xffffff, 0.22);
        this.graphics.strokeCircle(projection.screenX, height * 0.5, projection.size + 2);
      });
  }

  renderBillboards(player: RaycastPlayerState, billboards: RaycastBillboard[], width: number, height: number): void {
    billboards
      .map((billboard) => this.projectBillboard(player, billboard, width, height))
      .filter((projection): projection is BillboardProjection => projection !== null)
      .sort((a, b) => b.distance - a.distance)
      .forEach((projection) => {
        const column = Phaser.Math.Clamp(Math.floor(projection.screenX / (width / this.config.rayCount)), 0, this.config.rayCount - 1);
        if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) return;

        this.graphics.fillStyle(projection.billboard.color, 0.92);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size);
        this.graphics.lineStyle(2, 0xffffff, 0.45);
        this.graphics.strokeCircle(projection.screenX, height * 0.5, projection.size);
      });
  }

  private drawBackground(width: number, height: number, atmosphere: RaycastAtmosphereRenderOptions): void {
    this.graphics.fillStyle(RAYCAST_ATMOSPHERE.voidColor, 1);
    this.graphics.fillRect(0, 0, width, height * 0.5);
    this.graphics.fillStyle(RAYCAST_ATMOSPHERE.floorColor, 1);
    this.graphics.fillRect(0, height * 0.5, width, height * 0.5);
    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.corruptionAlpha);
    this.graphics.fillRect(0, 0, width, height);
    this.graphics.lineStyle(1, 0x12382f, 0.08);
    for (let y = 18; y < height; y += 36) {
      this.graphics.lineBetween(0, y, width, y);
    }
  }

  private applyShade(color: number, shade: number): number {
    const r = ((color >> 16) & 0xff) * shade;
    const g = ((color >> 8) & 0xff) * shade;
    const b = (color & 0xff) * shade;
    return (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b);
  }

  private blendColors(baseColor: number, blendColor: number, amount: number): number {
    const clampedAmount = Phaser.Math.Clamp(amount, 0, 1);
    const inverse = 1 - clampedAmount;
    const r = ((baseColor >> 16) & 0xff) * inverse + ((blendColor >> 16) & 0xff) * clampedAmount;
    const g = ((baseColor >> 8) & 0xff) * inverse + ((blendColor >> 8) & 0xff) * clampedAmount;
    const b = (baseColor & 0xff) * inverse + (blendColor & 0xff) * clampedAmount;
    return (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b);
  }

  private projectEnemy(
    player: RaycastPlayerState,
    enemy: RaycastEnemy,
    width: number,
    height: number
  ): EnemyProjection | null {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToEnemy = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToEnemy - player.angle);

    if (Math.abs(angleDelta) > this.config.fovRadians * 0.58) return null;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const size = Phaser.Math.Clamp(height / correctedDistance / 1.7, 18, 210);
    return { enemy, screenX, size, distance: correctedDistance };
  }

  private projectPoint(
    player: RaycastPlayerState,
    projectile: RaycastEnemyProjectile,
    width: number,
    height: number
  ): ProjectileProjection | null {
    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToPoint = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToPoint - player.angle);

    if (Math.abs(angleDelta) > this.config.fovRadians * 0.52) return null;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const size = Phaser.Math.Clamp(height / correctedDistance / 28, 3, 14);
    return { projectile, screenX, size, distance: correctedDistance };
  }

  private projectBillboard(
    player: RaycastPlayerState,
    billboard: RaycastBillboard,
    width: number,
    height: number
  ): BillboardProjection | null {
    const dx = billboard.x - player.x;
    const dy = billboard.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToPoint = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToPoint - player.angle);
    if (Math.abs(angleDelta) > this.config.fovRadians * 0.52) return null;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const size = Phaser.Math.Clamp((height / correctedDistance / 18) * billboard.radius, 5, 28);
    return { billboard, screenX, size, distance: correctedDistance };
  }
}

interface EnemyProjection {
  enemy: RaycastEnemy;
  screenX: number;
  size: number;
  distance: number;
}

interface ProjectileProjection {
  projectile: RaycastEnemyProjectile;
  screenX: number;
  size: number;
  distance: number;
}

interface BillboardProjection {
  billboard: RaycastBillboard;
  screenX: number;
  size: number;
  distance: number;
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
