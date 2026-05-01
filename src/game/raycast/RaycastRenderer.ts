import Phaser from 'phaser';
import { castRay, type RaycastMap } from './RaycastMap';
import type { RaycastEnemy } from './RaycastEnemy';
import type { RaycastEnemyProjectile } from './RaycastEnemySystem';
import type { RaycastPlayerState } from './RaycastPlayerController';
import type { WeaponKind } from '../systems/WeaponTypes';
import {
  RAYCAST_ATMOSPHERE,
  calculateEnemyVisibility,
  calculateFogShade,
  getAtmosphereForDirector,
  type RaycastAtmosphereRenderOptions
} from './RaycastAtmosphere';
import { RAYCAST_RENDERER_CONFIG } from './RaycastRendererConfig';
export { RAYCAST_RENDERER_CONFIG, type RaycastRendererConfig } from './RaycastRendererConfig';

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
      this.drawWallPattern(hit.wallType, column, x, y, Math.ceil(columnWidth) + 1, wallHeight, shade, atmosphere);
    }
  }

  renderEnemies(
    player: RaycastPlayerState,
    enemies: RaycastEnemy[],
    width: number,
    height: number,
    time: number,
    atmosphere: RaycastAtmosphereRenderOptions = getAtmosphereForDirector(null, 0)
  ): void {
    const visibleEnemies = enemies
      .filter((enemy) => enemy.alive || enemy.deathBurstUntil > time)
      .map((enemy) => this.projectEnemy(player, enemy, width, height))
      .filter((projection): projection is EnemyProjection => projection !== null)
      .sort((a, b) => b.distance - a.distance);

    visibleEnemies.forEach((projection) => {
      const column = Phaser.Math.Clamp(Math.floor(projection.screenX / (width / this.config.rayCount)), 0, this.config.rayCount - 1);
      if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) return;

      if (!projection.enemy.alive) {
        this.drawEnemyDeathBurst(projection, height, time, atmosphere);
        return;
      }

      const color = projection.enemy.hitFlashUntil > time ? 0xffffff : projection.enemy.color;
      const visibility = calculateEnemyVisibility(projection.distance, atmosphere);
      const isWindingUp = projection.enemy.attackWindupUntil > time;
      this.graphics.fillStyle(RAYCAST_ATMOSPHERE.enemyOutline, 0.72 * visibility);
      this.graphics.fillRect(
        projection.screenX - projection.size * 0.56,
        height * 0.5 - projection.size * 0.61,
        projection.size * 1.12,
        projection.size * 1.22
      );
      this.graphics.fillStyle(color, 0.95 * visibility);
      this.graphics.fillRect(
        projection.screenX - projection.size * 0.5,
        height * 0.5 - projection.size * 0.55,
        projection.size,
        projection.size * 1.1
      );
      if (isWindingUp) {
        this.graphics.lineStyle(3, 0xfff29e, 0.82 * visibility);
        this.graphics.strokeRect(
          projection.screenX - projection.size * 0.62,
          height * 0.5 - projection.size * 0.67,
          projection.size * 1.24,
          projection.size * 1.34
        );
        this.graphics.fillStyle(0xfff29e, 0.52 * visibility);
        this.graphics.fillRect(projection.screenX - projection.size * 0.34, height * 0.5 - projection.size * 0.82, projection.size * 0.68, 4);
      }
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

        this.graphics.fillStyle(RAYCAST_ATMOSPHERE.projectileHalo, 0.24);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size + 5);
        this.graphics.fillStyle(projection.projectile.color, 0.98);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size);
        this.graphics.lineStyle(2, 0xffffff, 0.38);
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

        this.graphics.fillStyle(RAYCAST_ATMOSPHERE.pickupHalo, 0.18);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size + 6);
        this.graphics.fillStyle(projection.billboard.color, 0.94);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size);
        this.graphics.lineStyle(2, 0xffffff, 0.45);
        this.graphics.strokeCircle(projection.screenX, height * 0.5, projection.size);

        if (projection.billboard.label) {
          this.graphics.fillStyle(0x020408, 0.8);
          this.graphics.fillRect(projection.screenX - 24, height * 0.5 - projection.size - 18, 48, 12);
          this.graphics.fillStyle(projection.billboard.color, 0.95);
          this.graphics.fillRect(projection.screenX - 18, height * 0.5 - projection.size - 12, 36, 2);
        }
      });
  }

  renderWeaponOverlay(weapon: WeaponKind, width: number, height: number, muzzleAlpha: number): void {
    const baseY = height - 18;
    const centerX = width * 0.5;
    const weaponColor = weapon === 'SHOTGUN' ? 0x6f3b25 : weapon === 'LAUNCHER' ? 0x33535f : 0x3d4654;
    const trimColor = weapon === 'SHOTGUN' ? 0xff8a3d : weapon === 'LAUNCHER' ? 0x9feee2 : 0xfff29e;
    const bodyWidth = weapon === 'SHOTGUN' ? 168 : weapon === 'LAUNCHER' ? 142 : 96;
    const bodyHeight = weapon === 'SHOTGUN' ? 46 : weapon === 'LAUNCHER' ? 58 : 38;
    const barrelWidth = weapon === 'SHOTGUN' ? 56 : weapon === 'LAUNCHER' ? 76 : 34;

    this.graphics.fillStyle(0x020408, 0.72);
    this.graphics.fillRect(centerX - bodyWidth * 0.62, baseY - bodyHeight - 6, bodyWidth * 1.24, bodyHeight + 12);
    this.graphics.fillStyle(weaponColor, 0.96);
    this.graphics.fillRect(centerX - bodyWidth * 0.5, baseY - bodyHeight, bodyWidth, bodyHeight);
    this.graphics.fillStyle(trimColor, 0.82);
    this.graphics.fillRect(centerX - barrelWidth * 0.5, baseY - bodyHeight - 16, barrelWidth, 24);
    this.graphics.fillStyle(0x0b0d12, 0.9);
    this.graphics.fillRect(centerX - bodyWidth * 0.38, baseY - 18, bodyWidth * 0.76, 8);

    if (muzzleAlpha <= 0) return;
    this.graphics.fillStyle(trimColor, Phaser.Math.Clamp(muzzleAlpha, 0, 1));
    this.graphics.fillTriangle(centerX - 42, baseY - bodyHeight - 18, centerX + 42, baseY - bodyHeight - 18, centerX, baseY - bodyHeight - 72);
    this.graphics.fillStyle(0xffffff, Phaser.Math.Clamp(muzzleAlpha * 0.55, 0, 1));
    this.graphics.fillCircle(centerX, baseY - bodyHeight - 30, weapon === 'SHOTGUN' ? 34 : weapon === 'LAUNCHER' ? 42 : 24);
  }

  private drawBackground(width: number, height: number, atmosphere: RaycastAtmosphereRenderOptions): void {
    this.graphics.fillStyle(RAYCAST_ATMOSPHERE.voidColor, 1);
    this.graphics.fillRect(0, 0, width, height * 0.5);
    this.graphics.fillStyle(RAYCAST_ATMOSPHERE.floorColor, 1);
    this.graphics.fillRect(0, height * 0.5, width, height * 0.5);
    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.corruptionAlpha);
    this.graphics.fillRect(0, 0, width, height);
    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.pulseAlpha);
    this.graphics.fillRect(0, height * 0.47, width, height * 0.06);
    this.graphics.lineStyle(1, 0x12382f, 0.08);
    for (let y = 18; y < height; y += 36) {
      this.graphics.lineBetween(0, y, width, y);
    }
  }

  private drawWallPattern(
    wallType: number,
    column: number,
    x: number,
    y: number,
    width: number,
    wallHeight: number,
    shade: number,
    atmosphere: RaycastAtmosphereRenderOptions
  ): void {
    const patternColor = this.blendColors(
      this.applyShade(RAYCAST_ATMOSPHERE.wallPatternColors[wallType as keyof typeof RAYCAST_ATMOSPHERE.wallPatternColors] ?? 0x5f7190, shade),
      atmosphere.fogColor,
      1 - shade
    );
    const alpha = Phaser.Math.Clamp((shade - atmosphere.ambientDarkness) * 0.5, 0.05, 0.28);

    if (wallType === 1 && column % 13 === 0) {
      this.graphics.fillStyle(patternColor, alpha);
      this.graphics.fillRect(x, y + wallHeight * 0.24, width, 2);
      this.graphics.fillRect(x, y + wallHeight * 0.68, width, 2);
      return;
    }

    if (wallType === 2 && column % 17 === 0) {
      this.graphics.lineStyle(1, patternColor, alpha + 0.08);
      this.graphics.lineBetween(x, y + wallHeight * 0.2, x + width, y + wallHeight * 0.42);
      this.graphics.lineBetween(x + width, y + wallHeight * 0.42, x, y + wallHeight * 0.7);
      return;
    }

    if (wallType === 3 && column % 9 === 0) {
      this.graphics.fillStyle(patternColor, alpha + atmosphere.pulseAlpha);
      this.graphics.fillRect(x, y + wallHeight * 0.16, width, wallHeight * 0.1);
      this.graphics.fillRect(x, y + wallHeight * 0.54, width, wallHeight * 0.08);
      return;
    }

    if (wallType === 4 && column % 11 === 0) {
      this.graphics.lineStyle(1, patternColor, alpha + 0.1);
      this.graphics.strokeRect(x, y + wallHeight * 0.32, Math.max(2, width), Math.max(5, wallHeight * 0.2));
    }
  }

  private drawEnemyDeathBurst(
    projection: EnemyProjection,
    height: number,
    time: number,
    atmosphere: RaycastAtmosphereRenderOptions
  ): void {
    const remaining = Math.max(0, projection.enemy.deathBurstUntil - time);
    const alpha = Phaser.Math.Clamp(remaining / 260, 0, 1);
    const visibility = calculateEnemyVisibility(projection.distance, atmosphere);
    const burstSize = projection.size * (1.15 + (1 - alpha) * 0.75);

    this.graphics.fillStyle(projection.enemy.color, alpha * 0.48 * visibility);
    this.graphics.fillCircle(projection.screenX, height * 0.5, burstSize * 0.42);
    this.graphics.lineStyle(3, 0xffffff, alpha * 0.7 * visibility);
    this.graphics.strokeCircle(projection.screenX, height * 0.5, burstSize * 0.34);
    this.graphics.lineStyle(2, projection.enemy.color, alpha * 0.85 * visibility);
    this.graphics.lineBetween(projection.screenX - burstSize * 0.5, height * 0.5, projection.screenX + burstSize * 0.5, height * 0.5);
    this.graphics.lineBetween(projection.screenX, height * 0.5 - burstSize * 0.42, projection.screenX, height * 0.5 + burstSize * 0.42);
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
