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
import { RAYCAST_LEVEL, type RaycastLevel } from './RaycastLevel';
import { RAYCAST_RENDERER_CONFIG } from './RaycastRendererConfig';
import {
  getRaycastCellVariant,
  getRaycastZoneTheme,
  getRaycastZoneVisual,
  sampleRaycastSurfaceContext
} from './RaycastVisualTheme';
export { RAYCAST_RENDERER_CONFIG, type RaycastRendererConfig } from './RaycastRendererConfig';

const WALL_COLORS: Record<number, number> = RAYCAST_ATMOSPHERE.wallColors;

export interface RaycastBillboard {
  x: number;
  y: number;
  color: number;
  radius: number;
  label?: string;
  style?: 'token' | 'gate' | 'gate-open' | 'secret' | 'exit';
}

export class RaycastRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private depthBuffer: number[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly map: RaycastMap,
    private readonly level: RaycastLevel = RAYCAST_LEVEL,
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
    this.drawBackground(player, width, height, atmosphere);

    const columnWidth = width / this.config.rayCount;
    const startAngle = player.angle - this.config.fovRadians * 0.5;

    for (let column = 0; column < this.config.rayCount; column += 1) {
      const cameraT = column / Math.max(1, this.config.rayCount - 1);
      const rayAngle = startAngle + cameraT * this.config.fovRadians;
      const hit = castRay(this.map, player.x, player.y, rayAngle, player.angle);
      this.depthBuffer[column] = hit.correctedDistance;
      const wallHeight = Math.min(this.config.maxWallHeight, height / hit.correctedDistance);
      const sectorShade = RAYCAST_ATMOSPHERE.sectorDarkness[hit.wallType as keyof typeof RAYCAST_ATMOSPHERE.sectorDarkness] ?? 1;
      const surface = sampleRaycastSurfaceContext(this.level.zones, hit.hitX, hit.hitY, hit.rayAngle);
      const shade = Phaser.Math.Clamp(
        calculateFogShade(hit.correctedDistance, atmosphere) * sectorShade * (0.92 + surface.variant * 0.12),
        atmosphere.ambientDarkness,
        1
      );
      const baseWallColor = this.blendColors(
        WALL_COLORS[hit.wallType] ?? WALL_COLORS[1],
        surface.theme.accentColor,
        0.18 + surface.variant * 0.24
      );
      const color = this.blendColors(this.applyShade(baseWallColor, shade), atmosphere.fogColor, 1 - shade);
      const x = column * columnWidth;
      const y = height * 0.5 - wallHeight * 0.5;

      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(x, y, Math.ceil(columnWidth) + 1, wallHeight);
      this.drawWallPattern(hit.wallType, column, x, y, Math.ceil(columnWidth) + 1, wallHeight, shade, atmosphere, surface);
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
      this.drawEnemySilhouette(projection, height, color, visibility);
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

        const isOpenGate = projection.billboard.style === 'gate-open';
        const haloColor = isOpenGate ? 0x9feee2 : RAYCAST_ATMOSPHERE.pickupHalo;
        this.graphics.fillStyle(haloColor, isOpenGate ? 0.24 : 0.18);
        this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size + (isOpenGate ? 9 : 6));
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
        this.drawBillboardGlyph(projection, height);
      });
  }

  renderWeaponOverlay(weapon: WeaponKind, width: number, height: number, muzzleAlpha: number): void {
    const kick = Phaser.Math.Clamp(muzzleAlpha, 0, 1);
    const baseY = height - 18 + kick * 10;
    const centerX = width * 0.5;
    const weaponColor = weapon === 'SHOTGUN' ? 0x6d4028 : weapon === 'LAUNCHER' ? 0x29414d : 0x334150;
    const trimColor = weapon === 'SHOTGUN' ? 0xff9f59 : weapon === 'LAUNCHER' ? 0x9feee2 : 0xfff29e;

    if (weapon === 'PISTOL') {
      this.graphics.fillStyle(0x020408, 0.7);
      this.graphics.fillRect(centerX - 44, baseY - 78, 88, 84);
      this.graphics.fillStyle(weaponColor, 0.96);
      this.graphics.fillRect(centerX - 16, baseY - 76, 32, 56);
      this.graphics.fillRect(centerX - 12, baseY - 110, 24, 38);
      this.graphics.fillStyle(trimColor, 0.85);
      this.graphics.fillRect(centerX - 6, baseY - 126, 12, 18);
      this.graphics.fillStyle(0x0b0d12, 0.92);
      this.graphics.fillRect(centerX - 11, baseY - 42, 22, 28);
      this.graphics.fillStyle(0xffffff, 0.12);
      this.graphics.fillRect(centerX - 12, baseY - 70, 24, 4);
    } else if (weapon === 'SHOTGUN') {
      this.graphics.fillStyle(0x020408, 0.72);
      this.graphics.fillRect(centerX - 118, baseY - 82, 236, 86);
      this.graphics.fillStyle(weaponColor, 0.96);
      this.graphics.fillRect(centerX - 88, baseY - 72, 176, 38);
      this.graphics.fillRect(centerX - 62, baseY - 106, 124, 32);
      this.graphics.fillStyle(trimColor, 0.84);
      this.graphics.fillRect(centerX - 34, baseY - 124, 68, 18);
      this.graphics.fillRect(centerX - 76, baseY - 82, 14, 56);
      this.graphics.fillRect(centerX + 62, baseY - 82, 14, 56);
      this.graphics.fillStyle(0x0b0d12, 0.9);
      this.graphics.fillRect(centerX - 70, baseY - 30, 140, 10);
      this.graphics.fillStyle(0xffffff, 0.12);
      this.graphics.fillRect(centerX - 74, baseY - 66, 148, 4);
    } else {
      this.graphics.fillStyle(0x020408, 0.74);
      this.graphics.fillRect(centerX - 106, baseY - 96, 212, 104);
      this.graphics.fillStyle(weaponColor, 0.96);
      this.graphics.fillRect(centerX - 72, baseY - 84, 144, 48);
      this.graphics.fillRect(centerX - 38, baseY - 130, 76, 54);
      this.graphics.fillStyle(trimColor, 0.82);
      this.graphics.fillCircle(centerX, baseY - 108, 22);
      this.graphics.fillRect(centerX - 12, baseY - 144, 24, 26);
      this.graphics.fillStyle(0x0b0d12, 0.92);
      this.graphics.fillRect(centerX - 58, baseY - 32, 116, 12);
      this.graphics.fillStyle(0xffffff, 0.14);
      this.graphics.fillRect(centerX - 50, baseY - 76, 100, 5);
    }

    if (kick <= 0) return;
    const flashAlpha = Phaser.Math.Clamp(kick, 0, 1);
    const flashTop = weapon === 'PISTOL' ? baseY - 124 : weapon === 'SHOTGUN' ? baseY - 120 : baseY - 138;
    this.graphics.fillStyle(trimColor, flashAlpha * (weapon === 'LAUNCHER' ? 0.86 : 1));
    this.graphics.fillTriangle(centerX - 40, flashTop, centerX + 40, flashTop, centerX, flashTop - (weapon === 'LAUNCHER' ? 70 : 56));
    this.graphics.fillStyle(0xffffff, flashAlpha * 0.58);
    this.graphics.fillCircle(centerX, flashTop - 18, weapon === 'SHOTGUN' ? 32 : weapon === 'LAUNCHER' ? 40 : 22);
    this.graphics.lineStyle(2, trimColor, flashAlpha * 0.88);
    this.graphics.lineBetween(centerX, flashTop + 4, centerX, flashTop - 78);
    this.graphics.lineBetween(centerX - 16, flashTop - 10, centerX + 16, flashTop - 10);
  }

  private drawBackground(
    player: RaycastPlayerState,
    width: number,
    height: number,
    atmosphere: RaycastAtmosphereRenderOptions
  ): void {
    const activeZone = getRaycastZoneVisual(this.level.zones, player.x, player.y);
    const zoneTheme = getRaycastZoneTheme(activeZone?.visualTheme);
    const horizonY = height * 0.5;

    for (let y = 0; y < horizonY; y += 4) {
      const t = y / horizonY;
      const bandShade = 1 - t * 0.55;
      const color = this.blendColors(
        this.applyShade(zoneTheme.ceilingColor, bandShade),
        RAYCAST_ATMOSPHERE.voidColor,
        0.36 + t * 0.42
      );
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(0, y, width, 4);
    }

    for (let y = horizonY; y < height; y += 4) {
      const t = (y - horizonY) / Math.max(1, height - horizonY);
      const variant = getRaycastCellVariant(Math.floor(player.x * 3 + t * 19), Math.floor(player.y * 3 + t * 27));
      const base = this.blendColors(zoneTheme.floorColor, zoneTheme.accentColor, 0.1 + variant * 0.14);
      const color = this.blendColors(base, RAYCAST_ATMOSPHERE.floorColor, t * 0.5);
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(0, y, width, 4);

      if ((y + Math.floor(player.x * 12)) % 24 === 0) {
        this.graphics.fillStyle(zoneTheme.patternColor, 0.04 + (1 - t) * 0.03);
        this.graphics.fillRect(0, y, width, 1);
      }
    }

    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.corruptionAlpha);
    this.graphics.fillRect(0, 0, width, height);
    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.pulseAlpha);
    this.graphics.fillRect(0, height * 0.47, width, height * 0.06);
    this.graphics.lineStyle(1, zoneTheme.signalColor, 0.08);
    for (let y = 18; y < height; y += 36) {
      this.graphics.lineBetween(0, y, width, y);
    }

    if (activeZone?.landmark === 'gate' || activeZone?.landmark === 'ambush') {
      this.graphics.lineStyle(2, zoneTheme.signalColor, 0.12 + atmosphere.pulseAlpha * 0.35);
      this.graphics.lineBetween(width * 0.5 - 44, horizonY + 26, width * 0.5, horizonY + 8);
      this.graphics.lineBetween(width * 0.5 + 44, horizonY + 26, width * 0.5, horizonY + 8);
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
    atmosphere: RaycastAtmosphereRenderOptions,
    surface: ReturnType<typeof sampleRaycastSurfaceContext>
  ): void {
    const patternColor = this.blendColors(
      this.applyShade(
        this.blendColors(
          RAYCAST_ATMOSPHERE.wallPatternColors[wallType as keyof typeof RAYCAST_ATMOSPHERE.wallPatternColors] ?? 0x5f7190,
          surface.theme.patternColor,
          0.28 + surface.variant * 0.18
        ),
        shade
      ),
      atmosphere.fogColor,
      1 - shade
    );
    const alpha = Phaser.Math.Clamp((shade - atmosphere.ambientDarkness) * (0.42 + surface.variant * 0.18), 0.05, 0.32);

    if ((surface.cellX + surface.cellY) % 3 === 0 && column % 7 === 0) {
      this.graphics.fillStyle(patternColor, alpha * 0.55);
      this.graphics.fillRect(x, y + wallHeight * (0.18 + surface.variant * 0.12), width, Math.max(2, wallHeight * 0.018));
    }

    if (wallType === 1 && column % 13 === 0) {
      this.graphics.fillStyle(patternColor, alpha);
      this.graphics.fillRect(x, y + wallHeight * 0.24, width, 2);
      this.graphics.fillRect(x, y + wallHeight * 0.68, width, 2);
    } else if (wallType === 2 && column % 17 === 0) {
      this.graphics.lineStyle(1, patternColor, alpha + 0.08);
      this.graphics.lineBetween(x, y + wallHeight * 0.2, x + width, y + wallHeight * 0.42);
      this.graphics.lineBetween(x + width, y + wallHeight * 0.42, x, y + wallHeight * 0.7);
    } else if (wallType === 3 && column % 9 === 0) {
      this.graphics.fillStyle(patternColor, alpha + atmosphere.pulseAlpha);
      this.graphics.fillRect(x, y + wallHeight * 0.16, width, wallHeight * 0.1);
      this.graphics.fillRect(x, y + wallHeight * 0.54, width, wallHeight * 0.08);
    } else if (wallType === 4 && column % 11 === 0) {
      this.graphics.lineStyle(1, patternColor, alpha + 0.1);
      this.graphics.strokeRect(x, y + wallHeight * 0.32, Math.max(2, width), Math.max(5, wallHeight * 0.2));
    }

    if (surface.landmark === 'key' && column % 15 === 0) {
      this.graphics.lineStyle(2, surface.theme.signalColor, alpha + 0.08);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.2, x + width, y + wallHeight * 0.32);
      this.graphics.lineBetween(x + width, y + wallHeight * 0.32, x + width * 0.5, y + wallHeight * 0.44);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.44, x, y + wallHeight * 0.32);
      this.graphics.lineBetween(x, y + wallHeight * 0.32, x + width * 0.5, y + wallHeight * 0.2);
    }

    if (surface.landmark === 'gate' && column % 11 === 0) {
      this.graphics.lineStyle(1, surface.theme.signalColor, alpha + 0.14);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.16, x + width * 0.5, y + wallHeight * 0.82);
    }

    if (surface.landmark === 'ambush' && column % 19 === 0) {
      this.graphics.lineStyle(2, surface.theme.signalColor, alpha + atmosphere.pulseAlpha * 0.6);
      this.graphics.lineBetween(x, y + wallHeight * 0.24, x + width, y + wallHeight * 0.3);
      this.graphics.lineBetween(x + width, y + wallHeight * 0.3, x, y + wallHeight * 0.38);
    }

    if (surface.landmark === 'exit' && column % 13 === 0) {
      this.graphics.lineStyle(2, surface.theme.signalColor, alpha + 0.14);
      this.graphics.strokeCircle(x + width * 0.5, y + wallHeight * 0.32, Math.max(2, width * 0.7));
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

  private drawEnemySilhouette(projection: EnemyProjection, height: number, color: number, visibility: number): void {
    const bodyTop = height * 0.5 - projection.size * 0.55;
    const bodyLeft = projection.screenX - projection.size * 0.5;

    this.graphics.fillStyle(color, 0.95 * visibility);

    if (projection.enemy.kind === 'BRUTE') {
      this.graphics.fillRect(bodyLeft + projection.size * 0.08, bodyTop + projection.size * 0.08, projection.size * 0.84, projection.size);
      this.graphics.fillRect(bodyLeft - projection.size * 0.16, bodyTop + projection.size * 0.18, projection.size * 0.2, projection.size * 0.62);
      this.graphics.fillRect(bodyLeft + projection.size * 0.96, bodyTop + projection.size * 0.18, projection.size * 0.2, projection.size * 0.62);
      this.graphics.fillTriangle(
        projection.screenX,
        bodyTop - projection.size * 0.14,
        bodyLeft + projection.size * 0.14,
        bodyTop + projection.size * 0.18,
        bodyLeft + projection.size * 0.86,
        bodyTop + projection.size * 0.18
      );
      this.graphics.fillStyle(0xffffff, 0.08 * visibility);
      this.graphics.fillRect(bodyLeft + projection.size * 0.22, bodyTop + projection.size * 0.2, projection.size * 0.56, projection.size * 0.08);
      this.graphics.lineStyle(2, 0xffd38b, 0.4 * visibility);
      this.graphics.lineBetween(bodyLeft + projection.size * 0.2, bodyTop + projection.size * 0.66, bodyLeft + projection.size * 0.8, bodyTop + projection.size * 0.66);
      return;
    }

    if (projection.enemy.kind === 'STALKER') {
      this.graphics.fillTriangle(
        projection.screenX,
        bodyTop - projection.size * 0.08,
        bodyLeft,
        bodyTop + projection.size * 0.98,
        bodyLeft + projection.size,
        bodyTop + projection.size * 0.98
      );
      this.graphics.fillRect(projection.screenX - projection.size * 0.12, bodyTop + projection.size * 0.12, projection.size * 0.24, projection.size * 0.76);
      this.graphics.lineStyle(2, 0xa8ffd4, 0.34 * visibility);
      this.graphics.lineBetween(projection.screenX, bodyTop + projection.size * 0.1, projection.screenX, bodyTop + projection.size * 0.88);
      return;
    }

    if (projection.enemy.kind === 'RANGED') {
      this.graphics.fillRect(bodyLeft + projection.size * 0.08, bodyTop + projection.size * 0.18, projection.size * 0.84, projection.size * 0.82);
      this.graphics.fillRect(bodyLeft - projection.size * 0.1, bodyTop + projection.size * 0.42, projection.size * 1.2, projection.size * 0.12);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.14, projection.size * 0.16);
      this.graphics.lineStyle(2, 0xd2f7ff, 0.36 * visibility);
      this.graphics.strokeCircle(projection.screenX, bodyTop + projection.size * 0.14, projection.size * 0.22);
      return;
    }

    this.graphics.fillRect(bodyLeft + projection.size * 0.14, bodyTop + projection.size * 0.08, projection.size * 0.72, projection.size);
    this.graphics.fillTriangle(
      projection.screenX,
      bodyTop - projection.size * 0.08,
      bodyLeft + projection.size * 0.18,
      bodyTop + projection.size * 0.22,
      bodyLeft + projection.size * 0.82,
      bodyTop + projection.size * 0.22
    );
    this.graphics.lineStyle(2, 0xffc2b1, 0.26 * visibility);
    this.graphics.lineBetween(bodyLeft + projection.size * 0.26, bodyTop + projection.size * 0.72, bodyLeft + projection.size * 0.74, bodyTop + projection.size * 0.72);
  }

  private drawBillboardGlyph(projection: BillboardProjection, height: number): void {
    const y = height * 0.5;

    if (projection.billboard.style === 'token') {
      this.graphics.lineStyle(2, 0xffffff, 0.52);
      this.graphics.strokePoints(
        [
          new Phaser.Geom.Point(projection.screenX, y - projection.size - 1),
          new Phaser.Geom.Point(projection.screenX + projection.size * 0.58, y),
          new Phaser.Geom.Point(projection.screenX, y + projection.size + 1),
          new Phaser.Geom.Point(projection.screenX - projection.size * 0.58, y)
        ],
        true
      );
      return;
    }

    if (projection.billboard.style === 'gate') {
      this.graphics.lineStyle(2, 0xffffff, 0.42);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.52, y - projection.size * 0.74, projection.screenX - projection.size * 0.52, y + projection.size * 0.74);
      this.graphics.lineBetween(projection.screenX + projection.size * 0.52, y - projection.size * 0.74, projection.screenX + projection.size * 0.52, y + projection.size * 0.74);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.22, y - projection.size * 0.74, projection.screenX - projection.size * 0.22, y + projection.size * 0.74);
      this.graphics.lineBetween(projection.screenX + projection.size * 0.22, y - projection.size * 0.74, projection.screenX + projection.size * 0.22, y + projection.size * 0.74);
      return;
    }

    if (projection.billboard.style === 'gate-open') {
      this.graphics.lineStyle(2, 0xffffff, 0.55);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.68, y - projection.size * 0.58, projection.screenX - projection.size * 0.22, y);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.22, y, projection.screenX - projection.size * 0.68, y + projection.size * 0.58);
      this.graphics.lineBetween(projection.screenX + projection.size * 0.68, y - projection.size * 0.58, projection.screenX + projection.size * 0.22, y);
      this.graphics.lineBetween(projection.screenX + projection.size * 0.22, y, projection.screenX + projection.size * 0.68, y + projection.size * 0.58);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.08, y - projection.size * 0.5, projection.screenX + projection.size * 0.42, y);
      this.graphics.lineBetween(projection.screenX + projection.size * 0.42, y, projection.screenX - projection.size * 0.08, y + projection.size * 0.5);
      return;
    }

    if (projection.billboard.style === 'secret') {
      this.graphics.lineStyle(2, 0xffffff, 0.52);
      this.graphics.strokeCircle(projection.screenX, y, projection.size * 0.48);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.38, y, projection.screenX + projection.size * 0.38, y);
      this.graphics.lineBetween(projection.screenX, y - projection.size * 0.38, projection.screenX, y + projection.size * 0.38);
      return;
    }

    if (projection.billboard.style === 'exit') {
      this.graphics.lineStyle(2, 0xffffff, 0.58);
      this.graphics.strokeTriangle(
        projection.screenX,
        y - projection.size,
        projection.screenX + projection.size * 0.8,
        y + projection.size * 0.82,
        projection.screenX - projection.size * 0.8,
        y + projection.size * 0.82
      );
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
