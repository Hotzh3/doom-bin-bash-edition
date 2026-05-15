import Phaser from 'phaser';
import { castRay, type RaycastHit, type RaycastMap } from './RaycastMap';
import {
  getRaycastEnemySpawnTelegraphProgress,
  getRaycastEnemyWindupProgress,
  isRaycastEnemyTelegraphing,
  isRaycastEnemyWindingUp,
  type RaycastEnemy
} from './RaycastEnemy';
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
import { RAYCAST_PALETTE } from './RaycastPalette';
import { RAYCAST_DEATH_BURST_MS, RAYCAST_HIT_FLASH_MS } from './RaycastCombatSystem';
import type { RaycastBossState } from './RaycastBoss';
import { getRaycastBossVisualProfile } from './RaycastBossVisual';
import {
  getBillboardColor,
  getRaycastCellVariant,
  getRaycastEnemyVisualStyle,
  getRaycastGroundVisualStyle,
  sampleRaycastGroundBand,
  sampleRaycastWallPattern,
  getRaycastZoneTheme,
  getRaycastZoneVisual,
  getRaycastWallVisualStyle,
  getRaycastLandmarkColumnShadeBoost,
  sampleRaycastSurfaceContext,
  enforceRaycastEnemyBillboardReadability,
  RAYCAST_ENEMY_BILLBOARD_READABILITY
} from './RaycastVisualTheme';
export { RAYCAST_RENDERER_CONFIG, type RaycastRendererConfig } from './RaycastRendererConfig';

const WALL_COLORS: Record<number, number> = RAYCAST_ATMOSPHERE.wallColors;

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

export interface RaycastBillboard {
  x: number;
  y: number;
  color: number;
  radius: number;
  label?: string;
  style?: 'token' | 'gate' | 'gate-open' | 'secret' | 'exit' | 'health';
}

/** Preallocated slots reused each frame — avoids per-enemy/projection object literals in hot paths. */
const PROJECTION_POOL_CAP = 160;

export class RaycastRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly depthBuffer: number[];
  private readonly enemyProjectionScratch: EnemyProjection[] = [];
  private readonly projectileProjectionScratch: ProjectileProjection[] = [];
  private readonly billboardProjectionScratch: BillboardProjection[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly map: RaycastMap,
    private readonly level: RaycastLevel = RAYCAST_LEVEL,
    private readonly config = RAYCAST_RENDERER_CONFIG
  ) {
    this.graphics = scene.add.graphics();
    this.depthBuffer = new Array(this.config.rayCount);
    for (let i = 0; i < PROJECTION_POOL_CAP; i += 1) {
      this.enemyProjectionScratch.push({
        enemy: null as unknown as RaycastEnemy,
        screenX: 0,
        size: 0,
        distance: 0
      });
      this.projectileProjectionScratch.push({
        projectile: null as unknown as RaycastEnemyProjectile,
        screenX: 0,
        size: 0,
        distance: 0
      });
      this.billboardProjectionScratch.push({
        billboard: null as unknown as RaycastBillboard,
        screenX: 0,
        size: 0,
        distance: 0
      });
    }
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
        calculateFogShade(hit.correctedDistance, atmosphere) * sectorShade * (0.92 + surface.variant * 0.12) +
          getRaycastLandmarkColumnShadeBoost(surface.landmark),
        atmosphere.ambientDarkness,
        1
      );
      const columnNoise = Math.sin(column * 0.37 + hit.distance * 0.42) * 0.035;
      const hitFracX = Math.abs(hit.hitX - Math.floor(hit.hitX) - 0.5);
      const hitFracY = Math.abs(hit.hitY - Math.floor(hit.hitY) - 0.5);
      const edgeDarken = hitFracX > hitFracY ? 0.92 : 1;
      const aoLikeShade = Phaser.Math.Clamp(shade * edgeDarken + columnNoise, atmosphere.ambientDarkness, 1);
      const baseWallColor = this.blendColors(
        WALL_COLORS[hit.wallType] ?? WALL_COLORS[1],
        surface.theme.accentColor,
        0.18 + surface.variant * 0.24
      );
      const color = this.blendColors(this.applyShade(baseWallColor, aoLikeShade), atmosphere.fogColor, 1 - aoLikeShade);
      const x = column * columnWidth;
      const y = height * 0.5 - wallHeight * 0.5;

      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(x, y, Math.ceil(columnWidth) + 1, wallHeight);
      this.drawWallColumnVolume(hit, column, x, y, Math.ceil(columnWidth) + 1, wallHeight, shade, atmosphere, surface);
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
    const list = this.enemyProjectionScratch;
    let n = 0;
    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      if (!enemy.alive && enemy.deathBurstUntil <= time) continue;
      if (this.fillEnemyProjection(player, enemy, width, height, this.ensureEnemyProjectionSlot(n))) {
        n += 1;
      }
    }
    list.length = n;
    list.sort((a, b) => b.distance - a.distance);

    const columnScale = width / this.config.rayCount;
    for (let j = 0; j < list.length; j += 1) {
      const projection = list[j];
      const column = Phaser.Math.Clamp(Math.floor(projection.screenX / columnScale), 0, this.config.rayCount - 1);
      if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) continue;

      if (!projection.enemy.alive) {
        this.drawEnemyDeathBurst(projection, height, time, atmosphere);
        continue;
      }

      const hitStaggerX =
        projection.enemy.hitFlashUntil > time
          ? Math.sin(time * 0.11) *
            projection.size *
            0.12 *
            Math.min(1, (projection.enemy.hitFlashUntil - time) / RAYCAST_HIT_FLASH_MS)
          : 0;

      if (isRaycastEnemyTelegraphing(projection.enemy, time)) {
        const progress = getRaycastEnemySpawnTelegraphProgress(projection.enemy, time);
        const pulse = Math.sin(time / 64) * 0.5 + 0.5;
        const visibility = calculateEnemyVisibility(projection.distance, atmosphere);
        const markerRadius = projection.size * (0.42 + progress * 0.14 + pulse * 0.08);
        const haloRadius = projection.size * (0.72 + progress * 0.2 + pulse * 0.1);
        const alpha = (0.42 + pulse * 0.18) * visibility;
        this.graphics.fillStyle(RAYCAST_PALETTE.criticalVeil, 0.52 * visibility);
        const tx = projection.screenX + hitStaggerX;
        this.graphics.fillRect(
          tx - projection.size * 0.6,
          height * 0.5 - projection.size * 0.7,
          projection.size * 1.2,
          projection.size * 1.4
        );
        this.graphics.fillStyle(RAYCAST_PALETTE.telegraphRose, 0.16 * visibility + progress * 0.08);
        this.graphics.fillCircle(tx, height * 0.5, haloRadius);
        this.graphics.lineStyle(4, RAYCAST_PALETTE.telegraphAmber, alpha);
        this.graphics.strokeCircle(tx, height * 0.5, markerRadius);
        this.graphics.lineStyle(2, 0xffffff, (0.35 + pulse * 0.12) * visibility);
        this.graphics.lineBetween(
          tx - projection.size * 0.36,
          height * 0.5,
          tx + projection.size * 0.36,
          height * 0.5
        );
        this.graphics.lineBetween(
          tx,
          height * 0.5 - projection.size * 0.36,
          tx,
          height * 0.5 + projection.size * 0.36
        );
        this.graphics.fillStyle(RAYCAST_PALETTE.amberSoft, (0.55 + pulse * 0.16) * visibility);
        this.graphics.fillRect(tx - projection.size * 0.2, height * 0.5 - projection.size * 0.9, projection.size * 0.4, 5);
        this.graphics.fillStyle(RAYCAST_PALETTE.telegraphRose, 0.78 * visibility);
        this.graphics.fillRect(
          tx - projection.size * 0.28,
          height * 0.5 - projection.size * 0.52,
          projection.size * 0.56,
          projection.size * (0.72 + pulse * 0.06)
        );
        continue;
      }

      const isWindingUp = isRaycastEnemyWindingUp(projection.enemy, time);
      const windupProgress = getRaycastEnemyWindupProgress(projection.enemy, time);
      const pulse = isWindingUp ? Math.sin(time / 30) * 0.5 + 0.5 : 0;
      const telegraphMix = isWindingUp ? 0.3 + windupProgress * 0.4 + pulse * 0.18 : 0;
      const color =
        projection.enemy.hitFlashUntil > time
          ? this.blendColors(0xfff5f0, projection.enemy.color, 0.48)
          : this.blendColors(projection.enemy.color, RAYCAST_PALETTE.telegraphRose, telegraphMix);
      const enemyStyle = getRaycastEnemyVisualStyle(projection.enemy.kind, projection.enemy.color);
      const accentColor = projection.enemy.variantAccentColor ?? enemyStyle.accentColor;
      const readability = enforceRaycastEnemyBillboardReadability(
        calculateEnemyVisibility(projection.distance, atmosphere),
        projection.size
      );
      const visibility = readability.visibility;
      const size = readability.size * (isWindingUp ? 1.04 + windupProgress * 0.08 + pulse * 0.04 : 1);
      const sx = projection.screenX + hitStaggerX;
      const savedEnemyX = projection.screenX;
      projection.screenX = sx;
      this.graphics.fillStyle(enemyStyle.outlineColor, RAYCAST_ENEMY_BILLBOARD_READABILITY.outlineAlpha * visibility);
      this.graphics.fillEllipse(sx, height * 0.5 + size * 0.08, size * 1.28, size * 1.42);
      if ((projection.enemy.shieldPulseUntil ?? 0) > time) {
        this.graphics.lineStyle(3, 0x8fd8ff, 0.62 * visibility);
        this.graphics.strokeEllipse(sx, height * 0.5 + size * 0.08, size * 1.38, size * 1.46);
      }
      if (isWindingUp) {
        this.graphics.fillStyle(enemyStyle.windupColor, (0.18 + windupProgress * 0.14 + pulse * 0.08) * visibility);
        this.graphics.fillCircle(sx, height * 0.5, size * (0.46 + windupProgress * 0.08));
      }
      this.graphics.fillStyle(color, RAYCAST_ENEMY_BILLBOARD_READABILITY.fillAlpha * visibility);
      const savedSilhouetteSize = projection.size;
      projection.size = size;
      this.drawEnemySilhouette(projection, height, color, visibility, enemyStyle, telegraphMix);
      projection.size = savedSilhouetteSize;
      projection.screenX = savedEnemyX;
      if (isWindingUp) {
        this.graphics.lineStyle(4, accentColor, (0.78 + pulse * 0.14) * visibility);
        this.graphics.strokeEllipse(sx, height * 0.5 + size * 0.08, size * 1.48, size * 1.56);
        this.graphics.fillStyle(enemyStyle.windupColor, (0.5 + windupProgress * 0.2) * visibility);
        this.graphics.fillRect(sx - size * 0.42, height * 0.5 - size * 0.92, size * 0.84, 6);
        this.graphics.lineStyle(2, enemyStyle.eyeColor, (0.5 + pulse * 0.18) * visibility);
        this.graphics.lineBetween(
          sx - size * 0.38,
          height * 0.5 - size * 0.89,
          sx + size * (windupProgress * 0.76 - 0.38),
          height * 0.5 - size * 0.89
        );
      }
    }
  }

  renderBoss(
    player: RaycastPlayerState,
    boss: RaycastBossState | null,
    width: number,
    height: number,
    time: number,
    atmosphere: RaycastAtmosphereRenderOptions
  ): void {
    if (!boss?.alive) return;
    const dx = boss.x - player.x;
    const dy = boss.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToEnemy = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToEnemy - player.angle);
    if (Math.abs(angleDelta) > this.config.fovRadians * 0.58) return;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const column = Phaser.Math.Clamp(Math.floor(screenX / (width / this.config.rayCount)), 0, this.config.rayCount - 1);
    if (correctedDistance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.08) return;

    const visibility = calculateEnemyVisibility(correctedDistance, atmosphere);
    const baseSize = Phaser.Math.Clamp(height / correctedDistance / 1.12, 44, 270);
    const profile = getRaycastBossVisualProfile(boss, time);
    const size = baseSize * profile.silhouetteScale;
    const telegraph = time < boss.telegraphUntil;
    const pulse = telegraph ? 0.55 + Math.sin(time / 42) * 0.45 : 1;
    const cx = screenX;
    const cy = height * 0.5;
    const coreColor = profile.coreColor;

    this.graphics.fillStyle(0x120618, 0.82 * visibility);
    this.graphics.fillEllipse(cx, cy + size * 0.1, size * 1.5, size * 0.42);
    for (let i = 0; i < profile.ringCount; i += 1) {
      const ringMix = i / Math.max(1, profile.ringCount - 1);
      const ringScale = 1.04 + i * 0.14 + Math.sin(time * 0.002 + i * 0.8) * 0.02;
      this.graphics.lineStyle(
        telegraph ? 5 - Math.min(2, i * 0.5) : 3 - Math.min(1.2, i * 0.35),
        this.blendColors(profile.haloColor, RAYCAST_PALETTE.plasmaBright, ringMix * 0.3),
        (telegraph ? 0.88 : 0.52) * visibility * pulse * (1 - ringMix * 0.18)
      );
      this.graphics.strokeEllipse(cx, cy, size * ringScale, size * (1.34 + i * 0.08));
    }
    this.graphics.fillStyle(coreColor, 0.92 * visibility);
    this.graphics.fillEllipse(cx, cy - size * 0.05, size * 0.88, size * 1.05);
    const finRot = time * 0.0018;
    for (let i = 0; i < 3; i += 1) {
      const a = finRot + (i * Math.PI * 2) / 3;
      const tipX = cx + Math.cos(a) * size * 0.82;
      const tipY = cy + Math.sin(a) * size * 0.62;
      const leftX = cx + Math.cos(a + 0.42) * size * 0.42;
      const leftY = cy + Math.sin(a + 0.42) * size * 0.36;
      const rightX = cx + Math.cos(a - 0.42) * size * 0.42;
      const rightY = cy + Math.sin(a - 0.42) * size * 0.36;
      this.graphics.fillStyle(this.blendColors(profile.haloColor, 0x11151f, 0.45), (0.44 - i * 0.06) * visibility);
      this.graphics.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);
    }
    this.graphics.fillStyle(RAYCAST_PALETTE.plasmaBright, 0.3 * visibility);
    this.graphics.fillRect(cx - size * 0.08, cy - size * 0.56, size * 0.16, size * 0.2);
    this.graphics.fillRect(cx + size * 0.18, cy - size * 0.28, size * 0.12, size * 0.16);
    this.graphics.fillRect(cx - size * 0.3, cy - size * 0.28, size * 0.12, size * 0.16);
    for (let i = 0; i < profile.particleCount; i += 1) {
      const t = (i / profile.particleCount) * Math.PI * 2 + time * (0.0014 + (i % 3) * 0.0002);
      const pr = size * (0.72 + (i % 4) * 0.05 + Math.sin(time * 0.003 + i) * 0.03);
      this.graphics.fillStyle(profile.haloColor, (0.1 + ((i + 2) % 5) * 0.03) * visibility);
      this.graphics.fillCircle(cx + Math.cos(t) * pr, cy + Math.sin(t) * pr * 0.76, Math.max(2, size * 0.032));
    }
    if (telegraph) {
      const rays = boss.phase === 3 ? 10 : boss.phase === 2 ? 7 : 4;
      const haloAlpha = (0.24 + pulse * 0.2) * visibility;
      const haloColor = profile.haloColor;
      this.graphics.fillStyle(haloColor, haloAlpha);
      this.graphics.fillCircle(cx, cy, size * (0.86 + pulse * 0.12));
      this.graphics.lineStyle(2, 0xfff1c4, (0.35 + pulse * 0.3) * visibility);
      for (let i = 0; i < rays; i += 1) {
        const a = (i / rays) * Math.PI * 2 + time * 0.003;
        this.graphics.lineBetween(
          cx + Math.cos(a) * size * 0.26,
          cy + Math.sin(a) * size * 0.26,
          cx + Math.cos(a) * size * 0.92,
          cy + Math.sin(a) * size * 0.92
        );
      }
    }
  }

  renderEnemyProjectiles(
    player: RaycastPlayerState,
    projectiles: RaycastEnemyProjectile[],
    width: number,
    height: number
  ): void {
    const list = this.projectileProjectionScratch;
    let n = 0;
    for (let i = 0; i < projectiles.length; i += 1) {
      const projectile = projectiles[i];
      if (!projectile.alive) continue;
      if (this.fillProjectileProjection(player, projectile, width, height, this.ensureProjectileProjectionSlot(n))) {
        n += 1;
      }
    }
    list.length = n;
    list.sort((a, b) => b.distance - a.distance);

    const columnScale = width / this.config.rayCount;
    for (let j = 0; j < list.length; j += 1) {
      const projection = list[j];
      const column = Phaser.Math.Clamp(Math.floor(projection.screenX / columnScale), 0, this.config.rayCount - 1);
      if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) continue;

      this.graphics.fillStyle(RAYCAST_ATMOSPHERE.projectileHalo, 0.24);
      this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size + 5);
      this.graphics.fillStyle(projection.projectile.color, 0.98);
      this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size);
      this.graphics.lineStyle(2, 0xffffff, 0.38);
      this.graphics.strokeCircle(projection.screenX, height * 0.5, projection.size + 2);
    }
  }

  renderBillboards(player: RaycastPlayerState, billboards: RaycastBillboard[], width: number, height: number): void {
    const list = this.billboardProjectionScratch;
    let n = 0;
    for (let i = 0; i < billboards.length; i += 1) {
      const billboard = billboards[i];
      if (this.fillBillboardProjection(player, billboard, width, height, this.ensureBillboardProjectionSlot(n))) {
        n += 1;
      }
    }
    list.length = n;
    list.sort((a, b) => b.distance - a.distance);

    const columnScale = width / this.config.rayCount;
    for (let j = 0; j < list.length; j += 1) {
      const projection = list[j];
      const column = Phaser.Math.Clamp(Math.floor(projection.screenX / columnScale), 0, this.config.rayCount - 1);
      if (projection.distance > (this.depthBuffer[column] ?? Number.POSITIVE_INFINITY) + 0.05) continue;

      const isOpenGate = projection.billboard.style === 'gate-open';
      const haloColor = isOpenGate ? getBillboardColor('gate-open', true) : RAYCAST_ATMOSPHERE.pickupHalo;
      this.graphics.fillStyle(haloColor, isOpenGate ? 0.24 : 0.18);
      this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size + (isOpenGate ? 9 : 6));
      this.graphics.fillStyle(projection.billboard.color, 0.94);
      this.graphics.fillCircle(projection.screenX, height * 0.5, projection.size);
      this.graphics.lineStyle(2, 0xffffff, 0.45);
      this.graphics.strokeCircle(projection.screenX, height * 0.5, projection.size);
      this.graphics.lineStyle(1, haloColor, isOpenGate ? 0.42 : 0.34);
      this.graphics.strokeCircle(projection.screenX, height * 0.5, projection.size * 0.62);

      if (projection.billboard.label) {
        this.graphics.fillStyle(0x020408, 0.8);
        this.graphics.fillRect(projection.screenX - 24, height * 0.5 - projection.size - 18, 48, 12);
        this.graphics.fillStyle(projection.billboard.color, 0.95);
        this.graphics.fillRect(projection.screenX - 18, height * 0.5 - projection.size - 12, 36, 2);
      }
      this.drawBillboardGlyph(projection, height);
    }
  }

  private weaponRecoilOffset(weapon: WeaponKind, kick: number): { x: number; y: number } {
    const k = Phaser.Math.Clamp(kick, 0, 1);
    if (weapon === 'PISTOL') {
      return { x: k * 2.4, y: k * 6.4 };
    }
    if (weapon === 'SHOTGUN') {
      return { x: k * 13, y: k * 30 };
    }
    const eased = k * k;
    return { x: eased * 8.8, y: eased * 34 };
  }

  renderWeaponOverlay(weapon: WeaponKind, width: number, height: number, muzzleAlpha: number): void {
    const kick = Phaser.Math.Clamp(muzzleAlpha, 0, 1);
    const { x: recoilX, y: recoilY } = this.weaponRecoilOffset(weapon, kick);
    const baseY = height - 18 + recoilY;
    const cx = width * 0.5 + recoilX;
    const weaponColor = weapon === 'SHOTGUN' ? 0x6d4028 : weapon === 'LAUNCHER' ? 0x29414d : 0x334150;
    const trimColor = weapon === 'SHOTGUN' ? RAYCAST_PALETTE.rustBright : weapon === 'LAUNCHER' ? RAYCAST_PALETTE.plasmaBright : RAYCAST_PALETTE.muzzleWarm;
    const deepShadow = RAYCAST_PALETTE.floorVoid;
    const corruptGlow = RAYCAST_PALETTE.telegraphRose;

    if (weapon === 'PISTOL') {
      this.graphics.fillStyle(0x010306, 0.55);
      this.graphics.fillEllipse(cx + 6, baseY - 48, 52, 72);
      this.graphics.fillStyle(0x020408, 0.72);
      this.graphics.fillRect(cx - 44, baseY - 78, 88, 84);
      this.graphics.fillGradientStyle(weaponColor, this.blendColors(weaponColor, deepShadow, 0.55), 0x152028, 0x152028, 0.96);
      this.graphics.fillRect(cx - 16, baseY - 76, 32, 56);
      this.graphics.fillStyle(this.blendColors(weaponColor, 0x1a2a38, 0.35), 0.96);
      this.graphics.fillRect(cx - 11, baseY - 112, 22, 40);
      this.graphics.fillStyle(this.blendColors(weaponColor, 0x0e141c, 0.5), 0.92);
      this.graphics.fillRect(cx - 7, baseY - 128, 14, 22);
      this.graphics.lineStyle(1, trimColor, 0.45);
      this.graphics.strokeRect(cx - 11, baseY - 112, 22, 40);
      this.graphics.fillStyle(trimColor, 0.88);
      this.graphics.fillRect(cx - 5, baseY - 128, 10, 16);
      this.graphics.fillStyle(0x0b0d12, 0.94);
      this.graphics.fillRect(cx - 10, baseY - 42, 20, 26);
      this.graphics.fillStyle(0x1a222c, 0.88);
      this.graphics.fillRect(cx - 8, baseY - 118, 16, 6);
      this.graphics.fillStyle(0xffffff, 0.18);
      this.graphics.fillRect(cx - 10, baseY - 110, 20, 2);
      this.graphics.fillStyle(0xffffff, 0.12);
      this.graphics.fillRect(cx - 10, baseY - 70, 20, 3);
      this.graphics.fillStyle(trimColor, 0.42);
      this.graphics.fillRect(cx - 4, baseY - 54, 8, 12);
      this.graphics.lineStyle(2, trimColor, 0.22);
      this.graphics.strokeCircle(cx - 2, baseY - 50, 10);
      this.graphics.fillStyle(0x050508, 0.9);
      this.graphics.fillEllipse(cx, baseY - 130, 8, 5);
      this.graphics.fillStyle(0x461830, 0.5);
      this.graphics.fillTriangle(cx + 8, baseY - 38, cx + 16, baseY - 14, cx + 4, baseY - 14);
      this.graphics.fillStyle(0x120a0e, 0.62);
      this.graphics.fillTriangle(cx - 14, baseY - 28, cx - 4, baseY - 12, cx - 18, baseY - 8);
    } else if (weapon === 'SHOTGUN') {
      this.graphics.fillStyle(0x010306, 0.58);
      this.graphics.fillEllipse(cx + 14, baseY - 50, 108, 78);
      this.graphics.fillStyle(0x020408, 0.74);
      this.graphics.fillRect(cx - 118, baseY - 82, 236, 86);
      this.graphics.fillGradientStyle(
        this.blendColors(weaponColor, 0x3a1f0c, 0.25),
        this.blendColors(weaponColor, deepShadow, 0.5),
        weaponColor,
        weaponColor,
        0.97
      );
      this.graphics.fillRect(cx - 88, baseY - 72, 176, 38);
      this.graphics.fillStyle(weaponColor, 0.96);
      this.graphics.fillRect(cx - 62, baseY - 108, 124, 34);
      this.graphics.fillStyle(this.blendColors(weaponColor, 0x0a0604, 0.55), 0.9);
      this.graphics.fillRect(cx - 24, baseY - 118, 10, 14);
      this.graphics.fillRect(cx + 14, baseY - 118, 10, 14);
      this.graphics.fillStyle(0x080604, 0.85);
      this.graphics.fillRect(cx - 20, baseY - 122, 6, 8);
      this.graphics.fillRect(cx + 14, baseY - 122, 6, 8);
      this.graphics.fillStyle(trimColor, 0.86);
      this.graphics.fillRect(cx - 34, baseY - 126, 68, 16);
      this.graphics.fillStyle(this.blendColors(weaponColor, 0x2a1408, 0.4), 0.92);
      this.graphics.fillRect(cx - 76, baseY - 82, 14, 56);
      this.graphics.fillRect(cx + 62, baseY - 82, 14, 56);
      this.graphics.fillStyle(0x0b0d12, 0.92);
      this.graphics.fillRect(cx - 70, baseY - 30, 140, 10);
      this.graphics.fillStyle(0x1a0d06, 0.45);
      this.graphics.fillRect(cx - 66, baseY - 52, 132, 8);
      this.graphics.fillStyle(0xffffff, 0.14);
      this.graphics.fillRect(cx - 74, baseY - 66, 148, 3);
      for (let v = 0; v < 5; v += 1) {
        this.graphics.fillStyle(0x1a0d06, 0.35);
        this.graphics.fillRect(cx - 58 + v * 26, baseY - 100, 6, 22);
      }
      this.graphics.lineStyle(2, trimColor, 0.26);
      this.graphics.strokeRect(cx - 62, baseY - 108, 124, 34);
      this.graphics.fillStyle(trimColor, 0.22);
      this.graphics.fillRect(cx - 20, baseY - 48, 40, 3);
      this.graphics.fillStyle(0x180c08, 0.55);
      this.graphics.fillTriangle(cx - 28, baseY - 18, cx + 28, baseY - 18, cx, baseY - 6);
    } else {
      this.graphics.fillStyle(0x010306, 0.6);
      this.graphics.fillEllipse(cx + 10, baseY - 54, 96, 88);
      this.graphics.fillStyle(0x020408, 0.76);
      this.graphics.fillRect(cx - 106, baseY - 96, 212, 104);
      this.graphics.fillGradientStyle(
        this.blendColors(weaponColor, 0x153038, 0.22),
        this.blendColors(weaponColor, deepShadow, 0.48),
        weaponColor,
        this.blendColors(weaponColor, 0x0a1820, 0.35),
        0.97
      );
      this.graphics.fillRect(cx - 72, baseY - 84, 144, 48);
      this.graphics.fillStyle(weaponColor, 0.96);
      this.graphics.fillRect(cx - 40, baseY - 134, 80, 56);
      this.graphics.fillStyle(this.blendColors(weaponColor, 0x0a1218, 0.4), 0.88);
      this.graphics.fillRect(cx - 14, baseY - 148, 28, 18);
      this.graphics.fillStyle(0x05080c, 0.92);
      this.graphics.fillRect(cx - 10, baseY - 146, 20, 6);
      this.graphics.fillStyle(trimColor, 0.84);
      this.graphics.fillCircle(cx, baseY - 110, 22);
      this.graphics.lineStyle(2, this.blendColors(trimColor, 0x0a2030, 0.4), 0.55);
      this.graphics.strokeCircle(cx, baseY - 110, 20);
      this.graphics.fillStyle(trimColor, 0.72);
      this.graphics.fillRect(cx - 12, baseY - 146, 24, 26);
      this.graphics.fillStyle(0x0b0d12, 0.94);
      this.graphics.fillRect(cx - 58, baseY - 32, 116, 12);
      this.graphics.fillStyle(0xffa033, 0.55);
      this.graphics.fillRect(cx - 18, baseY - 130, 36, 4);
      this.graphics.fillStyle(0xff2348, 0.28);
      this.graphics.fillRect(cx - 36, baseY - 122, 72, 3);
      this.graphics.fillStyle(0xffffff, 0.16);
      this.graphics.fillRect(cx - 50, baseY - 76, 100, 4);
      this.graphics.lineStyle(1, trimColor, 0.35);
      this.graphics.lineBetween(cx - 40, baseY - 88, cx + 40, baseY - 88);
      for (let band = 0; band < 3; band += 1) {
        this.graphics.lineStyle(1, this.blendColors(trimColor, deepShadow, 0.5), 0.2);
        this.graphics.lineBetween(cx - 36, baseY - 102 + band * 8, cx + 36, baseY - 102 + band * 8);
      }
      this.graphics.fillStyle(0x0a1014, 0.7);
      this.graphics.fillRect(cx - 22, baseY - 24, 44, 10);
    }

    if (kick <= 0) return;
    const flashAlpha = Phaser.Math.Clamp(kick, 0, 1);
    const flashTop = weapon === 'PISTOL' ? baseY - 126 : weapon === 'SHOTGUN' ? baseY - 122 : baseY - 142;
    const flashH = weapon === 'LAUNCHER' ? 74 : weapon === 'SHOTGUN' ? 60 : 52;
    const flashW = weapon === 'SHOTGUN' ? 48 : weapon === 'LAUNCHER' ? 44 : 36;

    this.graphics.fillStyle(corruptGlow, flashAlpha * 0.22);
    this.graphics.fillCircle(cx, flashTop - 12, weapon === 'SHOTGUN' ? 38 : weapon === 'LAUNCHER' ? 46 : 26);
    this.graphics.fillStyle(trimColor, flashAlpha * (weapon === 'LAUNCHER' ? 0.82 : 0.95));
    this.graphics.fillTriangle(cx - flashW, flashTop, cx + flashW, flashTop, cx, flashTop - flashH);
    this.graphics.fillStyle(0xffffff, flashAlpha * 0.62);
    this.graphics.fillCircle(cx, flashTop - 16, weapon === 'SHOTGUN' ? 30 : weapon === 'LAUNCHER' ? 38 : 20);
    this.graphics.lineStyle(2, trimColor, flashAlpha * 0.85);
    this.graphics.lineBetween(cx, flashTop + 4, cx, flashTop - 82);
    this.graphics.lineBetween(cx - 18, flashTop - 12, cx + 18, flashTop - 12);
    this.graphics.lineStyle(1, 0xfff0c2, flashAlpha * 0.45);
    this.graphics.lineBetween(cx - 26, flashTop - 4, cx - 8, flashTop - 28);
    this.graphics.lineBetween(cx + 26, flashTop - 4, cx + 8, flashTop - 28);
  }

  private drawBackground(
    player: RaycastPlayerState,
    width: number,
    height: number,
    atmosphere: RaycastAtmosphereRenderOptions
  ): void {
    const activeZone = getRaycastZoneVisual(this.level.zones, player.x, player.y);
    const zoneTheme = getRaycastZoneTheme(activeZone?.visualTheme);
    const activeSurface = {
      cellX: Math.floor(player.x),
      cellY: Math.floor(player.y),
      landmark: activeZone?.landmark ?? 'none',
      variant: getRaycastCellVariant(Math.floor(player.x * 2), Math.floor(player.y * 2))
    };
    const groundStyle = getRaycastGroundVisualStyle({
      theme: zoneTheme,
      landmark: activeSurface.landmark,
      variant: activeSurface.variant
    });
    const horizonY = height * 0.5;

    for (let y = 0; y < horizonY; y += 4) {
      const t = y / horizonY;
      const bandIndex = Math.floor(y / 4);
      const bandSample = sampleRaycastGroundBand(activeSurface, bandIndex, 'ceiling');
      const bandShade = 1 - t * 0.55;
      const color = this.blendColors(
        this.applyShade(
          this.blendColors(zoneTheme.ceilingColor, zoneTheme.accentColor, 0.06 + bandSample.scatter * 0.08),
          bandShade
        ),
        RAYCAST_ATMOSPHERE.voidColor,
        0.36 + t * 0.42
      );
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(0, y, width, 4);

      if (groundStyle.ceilingPattern === 'crossbars' && (y + bandSample.crossbarOffset) % 28 === 0) {
        this.graphics.fillStyle(zoneTheme.signalColor, (0.02 + (1 - t) * 0.028) * bandSample.accentAlpha);
        this.graphics.fillRect(0, y, width, 2);
        this.graphics.fillStyle(zoneTheme.patternColor, (0.012 + (1 - t) * 0.02) * bandSample.accentAlpha);
        this.graphics.fillRect(width * 0.18, y + 2, width * 0.64, 1);
      } else if (groundStyle.ceilingPattern === 'void-noise' && (y + Math.floor(player.x * 10)) % 22 === 0) {
        const laneX = (bandSample.laneOffset * 9) % Math.max(16, width);
        this.graphics.fillStyle(zoneTheme.patternColor, (0.018 + (1 - t) * 0.025) * bandSample.accentAlpha);
        this.graphics.fillRect(laneX, y, width * (0.34 + bandSample.scatter * 0.4), 1);
        if (bandSample.scatter > 0.58) {
          this.graphics.fillRect(Math.max(0, width - laneX - width * 0.22), y + 2, width * 0.22, 1);
        }
      } else if (groundStyle.ceilingPattern === 'scanlines' && y % 20 === 0) {
        this.graphics.fillStyle(zoneTheme.patternColor, (0.012 + (1 - t) * 0.018) * bandSample.accentAlpha);
        this.graphics.fillRect(width * 0.12, y, width * (0.2 + bandSample.scatter * 0.32), 1);
        this.graphics.fillRect(width * 0.62, y, width * (0.12 + bandSample.scatter * 0.18), 1);
      }
    }

    for (let y = horizonY; y < height; y += 4) {
      const t = (y - horizonY) / Math.max(1, height - horizonY);
      const bandIndex = Math.floor((y - horizonY) / 4);
      const bandSample = sampleRaycastGroundBand(activeSurface, bandIndex, 'floor');
      const variant = getRaycastCellVariant(Math.floor(player.x * 3 + t * 19), Math.floor(player.y * 3 + t * 27));
      const base = this.blendColors(zoneTheme.floorColor, zoneTheme.accentColor, 0.1 + variant * 0.14);
      const color = this.blendColors(
        this.blendColors(base, groundStyle.floorGlowColor, bandSample.scatter * 0.05),
        RAYCAST_ATMOSPHERE.floorColor,
        t * 0.5
      );
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(0, y, width, 4);
      if (t < 0.1) {
        this.graphics.fillStyle(zoneTheme.accentColor, 0.011 * (1 - t / 0.1) * bandSample.accentAlpha);
        this.graphics.fillRect(0, y, width, 2);
      }

      if (groundStyle.floorPattern === 'scanlines' && (y + Math.floor(player.x * 12)) % 24 === 0) {
        this.graphics.fillStyle(zoneTheme.patternColor, (0.024 + (1 - t) * 0.028) * bandSample.accentAlpha);
        this.graphics.fillRect(0, y, width, 1);
        this.graphics.fillRect(width * 0.16 + bandSample.laneOffset, y + 2, width * 0.14, 1);
      } else if (groundStyle.floorPattern === 'grid-cells' && y % groundStyle.cellStride < 4) {
        this.graphics.fillStyle(groundStyle.floorGlowColor, (0.02 + (1 - t) * 0.025) * bandSample.accentAlpha);
        this.graphics.fillRect(0, y, width, 1);
        for (let x = ((Math.floor(player.x * 14) + bandSample.laneOffset) % groundStyle.cellStride); x < width; x += groundStyle.cellStride) {
          this.graphics.fillRect(x, y, 1, 4);
        }
      } else if (groundStyle.floorPattern === 'hazard-lattice' && y % groundStyle.cellStride < 4) {
        this.graphics.fillStyle(groundStyle.floorGlowColor, (0.03 + (1 - t) * 0.036) * bandSample.accentAlpha);
        this.graphics.fillRect(0, y, width, 2);
        for (let x = ((Math.floor(player.y * 11) + bandSample.laneOffset) % groundStyle.cellStride); x < width; x += groundStyle.cellStride) {
          this.graphics.fillRect(x, y, 2, 4);
        }
      } else if (groundStyle.floorPattern === 'glow-rings' && y % groundStyle.cellStride < 4) {
        const ringInset = width * (0.24 + bandSample.scatter * 0.08);
        this.graphics.fillStyle(groundStyle.floorGlowColor, (0.028 + (1 - t) * 0.046) * bandSample.accentAlpha);
        this.graphics.fillRect(ringInset, y, width - ringInset * 2, 2);
        this.graphics.fillRect(ringInset + bandSample.segmentLength, y + 2, Math.max(16, width * 0.18), 1);
      } else if (groundStyle.floorPattern === 'noise-cells') {
        const cellStride = groundStyle.cellStride;
        const rowSeed = Math.floor(player.x * 9 + y * 0.15 + bandSample.laneOffset);
        if (y % Math.max(8, Math.floor(cellStride * 0.66)) === 0) {
          for (let x = 0; x < width; x += Math.max(10, Math.floor(cellStride * 0.75))) {
            const noise = getRaycastCellVariant(Math.floor(x * 0.2) + rowSeed, Math.floor(y * 0.18) + Math.floor(player.y * 8));
            if (noise > 0.52) {
              this.graphics.fillStyle(groundStyle.floorGlowColor, (0.012 + noise * 0.04 * (1 - t)) * bandSample.accentAlpha);
              this.graphics.fillRect(x, y, Math.max(3, cellStride * (0.24 + bandSample.scatter * 0.22)), 2);
            }
          }
        }
      }

      if (bandSample.scatter > 0.6 && y % Math.max(12, Math.floor(groundStyle.cellStride * 0.55)) === 0) {
        this.graphics.fillStyle(zoneTheme.patternColor, 0.01 + (1 - t) * 0.018 * groundStyle.floorBandAlpha);
        this.graphics.fillRect(width * 0.5 - bandSample.segmentLength, y + 1, bandSample.segmentLength * 2, 1);
      }
    }

    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.corruptionAlpha);
    this.graphics.fillRect(0, 0, width, height);
    this.graphics.fillStyle(atmosphere.corruptionTint, atmosphere.pulseAlpha);
    this.graphics.fillRect(0, height * 0.47, width, height * 0.06);
    this.graphics.lineStyle(1, zoneTheme.signalColor, 0.08 + groundStyle.floorBandAlpha);
    for (let y = 18; y < height; y += 36) {
      this.graphics.lineBetween(0, y, width, y);
    }

    const hzLm = activeZone?.landmark;
    if (hzLm === 'gate' || hzLm === 'ambush' || hzLm === 'reactor') {
      this.graphics.lineStyle(2, zoneTheme.signalColor, 0.12 + atmosphere.pulseAlpha * 0.35);
      this.graphics.lineBetween(width * 0.5 - 44, horizonY + 26, width * 0.5, horizonY + 8);
      this.graphics.lineBetween(width * 0.5 + 44, horizonY + 26, width * 0.5, horizonY + 8);
    }
    if (hzLm === 'bridge') {
      this.graphics.lineStyle(2, zoneTheme.signalColor, 0.09 + atmosphere.pulseAlpha * 0.22);
      this.graphics.lineBetween(width * 0.08, horizonY + 22, width * 0.92, horizonY + 22);
      this.graphics.lineBetween(width * 0.18, horizonY + 34, width * 0.82, horizonY + 30);
    }
    if (hzLm === 'core') {
      this.graphics.lineStyle(1, zoneTheme.signalColor, 0.11 + atmosphere.pulseAlpha * 0.42);
      this.graphics.strokeCircle(width * 0.5, horizonY + 24, 40);
    }

    this.graphics.fillStyle(zoneTheme.signalColor, 0.028 + atmosphere.pulseAlpha * 0.04);
    this.graphics.fillRect(0, horizonY - 1, width, 2);

    const vignette = this.blendColors(0x010206, RAYCAST_ATMOSPHERE.fogColor, 0.55);
    this.graphics.fillStyle(vignette, 0.06 + atmosphere.corruptionAlpha * 0.08);
    this.graphics.fillTriangle(0, horizonY, width * 0.28, height, 0, height);
    this.graphics.fillTriangle(width, horizonY, width - width * 0.28, height, width, height);
    this.graphics.fillStyle(vignette, 0.04);
    this.graphics.fillTriangle(0, 0, width * 0.22, horizonY, 0, horizonY);
    this.graphics.fillTriangle(width, 0, width - width * 0.22, horizonY, width, horizonY);
  }

  private drawWallColumnVolume(
    hit: RaycastHit,
    column: number,
    x: number,
    y: number,
    w: number,
    h: number,
    shade: number,
    atmosphere: RaycastAtmosphereRenderOptions,
    surface: ReturnType<typeof sampleRaycastSurfaceContext>
  ): void {
    const edgeColor = this.blendColors(0x020408, atmosphere.fogColor, 0.48);
    const edgeW = Math.max(1, w * 0.24);
    const edgeAlpha = Phaser.Math.Clamp(0.12 + (1 - shade) * 0.26, 0.06, 0.34);
    this.graphics.fillStyle(edgeColor, edgeAlpha * shade);
    this.graphics.fillRect(x, y, edgeW, h);
    this.graphics.fillRect(x + w - edgeW, y, edgeW, h);

    const midGlow = this.blendColors(0x7a8aa8, surface.theme.patternColor, 0.4);
    this.graphics.fillStyle(midGlow, 0.038 * shade * (0.82 + surface.variant * 0.35));
    this.graphics.fillRect(x + w * 0.33, y + h * 0.06, w * 0.34, h * 0.88);

    const brickRows = Math.min(8, Math.max(3, Math.floor(h / 13)));
    for (let r = 1; r < brickRows; r += 1) {
      const rowY = y + (r / brickRows) * h;
      const v = getRaycastCellVariant(
        surface.cellX * 9 + r,
        surface.cellY * 11 + Math.floor(hit.hitX * 19 + hit.hitY * 13)
      );
      if (v > 0.3) {
        this.graphics.fillStyle(edgeColor, (0.07 + v * 0.12) * shade);
        this.graphics.fillRect(x, rowY, w, Math.max(1, h * 0.011));
      }
    }

    const speck = getRaycastCellVariant(column + surface.cellX * 3, surface.cellY * 5);
    if (speck > 0.58 && column % 4 === 0) {
      this.graphics.fillStyle(surface.theme.signalColor, 0.055 * speck * shade);
      this.graphics.fillRect(
        x + w * 0.38,
        y + h * (0.18 + (speck % 0.55) * 0.55),
        w * 0.24,
        Math.max(1, h * 0.038)
      );
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
    const wallStyle = getRaycastWallVisualStyle(wallType, surface);
    const detail = sampleRaycastWallPattern(wallType, surface, column);
    const patternColor = this.blendColors(
      this.applyShade(
        this.blendColors(
          RAYCAST_ATMOSPHERE.wallPatternColors[wallType as keyof typeof RAYCAST_ATMOSPHERE.wallPatternColors] ?? 0x5f7190,
          wallStyle.detailColor,
          wallStyle.trimMix + surface.variant * 0.12
        ),
        shade
      ),
      atmosphere.fogColor,
      1 - shade
    );
    const secondaryColor = this.blendColors(
      this.applyShade(wallStyle.secondaryColor, shade),
      atmosphere.fogColor,
      1 - shade
    );
    const signalColor = this.blendColors(
      this.applyShade(wallStyle.signalColor, shade),
      atmosphere.fogColor,
      1 - shade
    );
    const alpha = Phaser.Math.Clamp((shade - atmosphere.ambientDarkness) * (0.42 + surface.variant * 0.18), 0.05, 0.32);
    const pulseAlpha = wallStyle.pulseSignal ? atmosphere.pulseAlpha * 0.6 : 0;
    const insetX = x + width * detail.horizontalInset * 0.2;
    const insetWidth = Math.max(1, width - width * detail.horizontalInset * 0.4);

    if ((surface.cellX + surface.cellY) % 3 === 0 && column % 7 === 0) {
      this.graphics.fillStyle(patternColor, alpha * 0.45);
      this.graphics.fillRect(
        insetX,
        y + wallHeight * (0.18 + surface.variant * 0.12 + detail.bandOffset),
        insetWidth,
        Math.max(2, wallHeight * 0.018)
      );
    }

    if (wallStyle.pattern === 'terminal-panels' && column % wallStyle.panelStride === 0) {
      this.graphics.fillStyle(patternColor, alpha);
      this.graphics.fillRect(insetX, y + wallHeight * (0.18 + detail.bandOffset), insetWidth, Math.max(2, wallHeight * 0.028));
      this.graphics.fillRect(insetX, y + wallHeight * (0.64 - detail.bandOffset * 0.5), insetWidth, Math.max(2, wallHeight * 0.022));
      this.graphics.fillStyle(secondaryColor, alpha * 0.7);
      this.graphics.fillRect(insetX, y + wallHeight * 0.34, insetWidth, Math.max(3, wallHeight * (0.1 + detail.chip * 0.05)));
      if (detail.energy > 0.62) {
        this.graphics.fillStyle(signalColor, alpha * 0.3 + pulseAlpha * 0.4);
        this.graphics.fillRect(x + width * 0.5, y + wallHeight * 0.22, Math.max(1, width * 0.35), Math.max(2, wallHeight * 0.12));
      }
    } else if (wallStyle.pattern === 'corrupted-ribs' && column % wallStyle.panelStride === 0) {
      this.graphics.lineStyle(1, patternColor, alpha + 0.08);
      if (detail.diagonalFlip) {
        this.graphics.lineBetween(x, y + wallHeight * (0.18 + detail.seamOffset * 0.2), x + width, y + wallHeight * 0.42);
        this.graphics.lineBetween(x + width, y + wallHeight * 0.42, x, y + wallHeight * (0.76 - detail.seamOffset * 0.2));
      } else {
        this.graphics.lineBetween(x + width, y + wallHeight * (0.18 + detail.seamOffset * 0.2), x, y + wallHeight * 0.42);
        this.graphics.lineBetween(x, y + wallHeight * 0.42, x + width, y + wallHeight * (0.76 - detail.seamOffset * 0.2));
      }
      this.graphics.fillStyle(secondaryColor, alpha * 0.42);
      this.graphics.fillRect(insetX, y + wallHeight * (0.48 + detail.bandOffset * 0.6), insetWidth, Math.max(2, wallHeight * 0.06));
    } else if (wallStyle.pattern === 'hazard-strips' && column % Math.max(6, wallStyle.panelStride - 2) === 0) {
      this.graphics.fillStyle(patternColor, alpha + pulseAlpha);
      this.graphics.fillRect(insetX, y + wallHeight * (0.16 + detail.bandOffset * 0.5), insetWidth, Math.max(2, wallHeight * 0.1));
      this.graphics.fillRect(insetX, y + wallHeight * (0.56 - detail.bandOffset * 0.35), insetWidth, Math.max(2, wallHeight * 0.08));
      this.graphics.lineStyle(1, signalColor, alpha + 0.12 + pulseAlpha);
      this.graphics.lineBetween(x, y + wallHeight * (0.26 + detail.seamOffset * 0.12), x + width, y + wallHeight * (0.34 - detail.seamOffset * 0.12));
    } else if (wallStyle.pattern === 'locked-warning-frame' && column % wallStyle.panelStride === 0) {
      this.graphics.lineStyle(1, signalColor, alpha + 0.14 + pulseAlpha);
      this.graphics.strokeRect(insetX, y + wallHeight * (0.22 + detail.bandOffset * 0.3), Math.max(2, insetWidth), Math.max(6, wallHeight * 0.5));
      this.graphics.fillStyle(secondaryColor, alpha * 0.6);
      this.graphics.fillRect(insetX, y + wallHeight * (0.42 + detail.seamOffset * 0.08), insetWidth, Math.max(2, wallHeight * 0.06));
    } else if (wallStyle.pattern === 'exit-glow' && column % wallStyle.panelStride === 0) {
      this.graphics.fillStyle(signalColor, alpha * 0.5 + pulseAlpha);
      this.graphics.fillRect(insetX, y + wallHeight * (0.14 + detail.bandOffset * 0.3), insetWidth, Math.max(3, wallHeight * 0.14));
      this.graphics.lineStyle(2, patternColor, alpha + 0.16);
      this.graphics.strokeCircle(x + width * 0.5, y + wallHeight * 0.34, Math.max(2, width * 0.72));
    } else if (wallStyle.pattern === 'data-noise-cells' && column % wallStyle.panelStride === 0) {
      const noiseStep = wallHeight * 0.1;
      for (let row = 0; row < 4; row += 1) {
        const noise = getRaycastCellVariant(surface.cellX + column + row, surface.cellY + row);
        const rowY = y + wallHeight * (0.18 + row * 0.16 + detail.bandOffset * 0.35);
        if (noise > 0.42) {
          this.graphics.fillStyle(noise > 0.72 ? signalColor : patternColor, alpha * (0.6 + noise * 0.2));
          this.graphics.fillRect(insetX, rowY, insetWidth, Math.max(2, noiseStep * (0.18 + noise * 0.24)));
        }
      }
    }

    if (detail.chip > 0.66 && column % Math.max(5, wallStyle.panelStride - 4) === 0) {
      this.graphics.fillStyle(secondaryColor, alpha * 0.4);
      this.graphics.fillRect(x, y + wallHeight * (0.28 + detail.seamOffset * 0.15), Math.max(1, width * 0.35), Math.max(2, wallHeight * 0.05));
    }

    if (surface.landmark === 'key' && column % 15 === 0) {
      this.graphics.lineStyle(2, signalColor, alpha + 0.08);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.2, x + width, y + wallHeight * 0.32);
      this.graphics.lineBetween(x + width, y + wallHeight * 0.32, x + width * 0.5, y + wallHeight * 0.44);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.44, x, y + wallHeight * 0.32);
      this.graphics.lineBetween(x, y + wallHeight * 0.32, x + width * 0.5, y + wallHeight * 0.2);
    }

    if (surface.landmark === 'gate' && column % 11 === 0) {
      this.graphics.lineStyle(1, signalColor, alpha + 0.14 + pulseAlpha);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.16, x + width * 0.5, y + wallHeight * 0.82);
    }

    if (surface.landmark === 'ambush' && column % 19 === 0) {
      this.graphics.lineStyle(2, signalColor, alpha + atmosphere.pulseAlpha * 0.6);
      this.graphics.lineBetween(x, y + wallHeight * 0.24, x + width, y + wallHeight * 0.3);
      this.graphics.lineBetween(x + width, y + wallHeight * 0.3, x, y + wallHeight * 0.38);
    }

    const edgeShade = this.blendColors(0x020408, atmosphere.fogColor, 0.55);
    this.graphics.lineStyle(1, edgeShade, 0.12 + (1 - shade) * 0.14);
    this.graphics.lineBetween(x, y, x, y + wallHeight);
    this.graphics.lineBetween(x + Math.max(1, width - 1), y, x + Math.max(1, width - 1), y + wallHeight);

    if (surface.landmark === 'exit' && column % 13 === 0) {
      this.graphics.lineStyle(2, signalColor, alpha + 0.14 + pulseAlpha);
      this.graphics.strokeCircle(x + width * 0.5, y + wallHeight * 0.32, Math.max(2, width * 0.7));
    }

    if (surface.landmark === 'monolith' && column % 13 === 0) {
      this.graphics.lineStyle(2, signalColor, alpha + 0.08);
      this.graphics.lineBetween(x + width * 0.5, y + wallHeight * 0.1, x + width * 0.5, y + wallHeight * 0.9);
    }
    if (surface.landmark === 'reactor' && column % 17 === 0) {
      this.graphics.lineStyle(1, signalColor, alpha + 0.1 + pulseAlpha * 0.5);
      this.graphics.lineBetween(x, y + wallHeight * 0.22, x + width, y + wallHeight * 0.28);
      this.graphics.lineBetween(x, y + wallHeight * 0.62, x + width, y + wallHeight * 0.68);
    }
    if (surface.landmark === 'bridge' && column % 23 === 0) {
      this.graphics.lineStyle(1, signalColor, alpha + 0.06);
      this.graphics.lineBetween(x, y + wallHeight * 0.47, x + width, y + wallHeight * 0.51);
    }
    if (surface.landmark === 'core' && column % 21 === 0) {
      this.graphics.lineStyle(1, signalColor, alpha + 0.1 + pulseAlpha * 0.35);
      this.graphics.strokeCircle(x + width * 0.5, y + wallHeight * 0.36, Math.max(2, width * 0.58));
    }
    if (surface.landmark === 'ritual' && column % 11 === 0) {
      this.graphics.lineStyle(1, patternColor, alpha + 0.06 + pulseAlpha * 0.25);
      this.graphics.lineBetween(x + width * 0.12, y + wallHeight * 0.74, x + width * 0.88, y + wallHeight * 0.78);
    }
    if (surface.landmark === 'machinery' && column % 29 === 0) {
      this.graphics.fillStyle(secondaryColor, alpha * 0.38);
      this.graphics.fillRect(x + width * 0.1, y + wallHeight * 0.54, width * 0.8, Math.max(1, wallHeight * 0.045));
    }
  }

  private drawEnemyDeathBurst(
    projection: EnemyProjection,
    height: number,
    time: number,
    atmosphere: RaycastAtmosphereRenderOptions
  ): void {
    const remaining = Math.max(0, projection.enemy.deathBurstUntil - time);
    const burstDuration = Math.max(1, RAYCAST_DEATH_BURST_MS);
    const alpha = Phaser.Math.Clamp(remaining / burstDuration, 0, 1);
    const visibility = calculateEnemyVisibility(projection.distance, atmosphere);
    const burstSize = projection.size * (1.28 + (1 - alpha) * 0.92);
    const shard = 1 - alpha;
    const cx = projection.screenX;
    const cy = height * 0.5;

    this.graphics.fillStyle(0xfff8f0, alpha * 0.34 * visibility * (0.25 + shard * 0.75));
    this.graphics.fillCircle(cx, cy, burstSize * 0.24);
    this.graphics.fillStyle(RAYCAST_PALETTE.telegraphRose, alpha * 0.28 * visibility * shard);
    this.graphics.fillCircle(cx, cy, burstSize * 0.56);
    this.graphics.fillStyle(projection.enemy.color, alpha * 0.62 * visibility);
    this.graphics.fillCircle(cx, cy, burstSize * 0.44);
    this.graphics.lineStyle(5, 0xfff5e8, alpha * 0.88 * visibility);
    this.graphics.strokeCircle(cx, cy, burstSize * 0.42);
    this.graphics.lineStyle(4, RAYCAST_PALETTE.plasmaBright, alpha * 0.42 * visibility);
    this.graphics.strokeCircle(cx, cy, burstSize * 0.34);
    this.graphics.lineStyle(3, projection.enemy.color, alpha * 0.9 * visibility);
    this.graphics.strokeCircle(cx, cy, burstSize * 0.28);
    this.graphics.lineStyle(2, projection.enemy.color, alpha * 0.88 * visibility);
    this.graphics.lineBetween(cx - burstSize * 0.62, cy, cx + burstSize * 0.62, cy);
    this.graphics.lineBetween(cx, cy - burstSize * 0.52, cx, cy + burstSize * 0.52);
    const diag = burstSize * 0.44;
    this.graphics.lineBetween(cx - diag, cy - diag, cx + diag, cy + diag);
    this.graphics.lineBetween(cx - diag, cy + diag, cx + diag, cy - diag);
    const shards = 8;
    for (let i = 0; i < shards; i += 1) {
      const ang = (i / shards) * Math.PI * 2 + time * 0.02;
      const outer = burstSize * (0.56 + shard * 0.68);
      const inner = burstSize * 0.18;
      const x0 = cx + Math.cos(ang) * inner;
      const y0 = cy + Math.sin(ang) * inner;
      const x1 = cx + Math.cos(ang) * outer;
      const y1 = cy + Math.sin(ang) * outer;
      this.graphics.lineStyle(2, i % 2 === 0 ? 0xfff0d0 : RAYCAST_PALETTE.plasmaBright, alpha * 0.64 * visibility * shard);
      this.graphics.lineBetween(x0, y0, x1, y1);
      this.graphics.fillStyle(projection.enemy.color, alpha * 0.5 * visibility * shard);
      this.graphics.fillCircle(x1, y1, Math.max(1.2, burstSize * 0.03));
    }
  }

  private drawEnemySilhouette(
    projection: EnemyProjection,
    height: number,
    color: number,
    visibility: number,
    style: ReturnType<typeof getRaycastEnemyVisualStyle>,
    telegraphMix: number
  ): void {
    const bodyTop = height * 0.5 - projection.size * 0.55;
    const bodyLeft = projection.screenX - projection.size * 0.5;
    const centerY = height * 0.5;
    const accentColor = this.blendColors(style.accentColor, RAYCAST_PALETTE.telegraphRose, telegraphMix * 0.45);

    this.graphics.fillStyle(color, 0.95 * visibility);

    if (style.silhouette === 'juggernaut') {
      this.graphics.fillStyle(0x080402, 0.55 * visibility);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.62, projection.size * 0.95, projection.size * 0.38);
      this.graphics.fillStyle(color, 0.95 * visibility);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.16, projection.size * 0.2);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.58, projection.size * 0.9, projection.size * 0.96);
      this.graphics.fillRect(bodyLeft + projection.size * 0.02, bodyTop + projection.size * 0.34, projection.size * 0.22, projection.size * 0.28);
      this.graphics.fillRect(bodyLeft + projection.size * 0.76, bodyTop + projection.size * 0.34, projection.size * 0.22, projection.size * 0.28);
      this.graphics.fillCircle(bodyLeft + projection.size * 0.14, bodyTop + projection.size * 0.46, projection.size * 0.15);
      this.graphics.fillCircle(bodyLeft + projection.size * 0.86, bodyTop + projection.size * 0.46, projection.size * 0.15);
      this.graphics.fillTriangle(
        projection.screenX,
        bodyTop + projection.size * 0.52,
        bodyLeft + projection.size * 0.2,
        bodyTop + projection.size * 1.04,
        bodyLeft + projection.size * 0.4,
        bodyTop + projection.size * 0.62
      );
      this.graphics.fillTriangle(
        projection.screenX,
        bodyTop + projection.size * 0.52,
        bodyLeft + projection.size * 0.8,
        bodyTop + projection.size * 1.04,
        bodyLeft + projection.size * 0.6,
        bodyTop + projection.size * 0.62
      );
      this.graphics.fillStyle(accentColor, 0.22 * visibility);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.42, projection.size * 0.54, projection.size * 0.14);
      this.drawEnemyHeadAccent(projection.screenX, bodyTop + projection.size * 0.08, projection.size, visibility, style, accentColor);
      this.graphics.fillStyle(style.coreColor, 0.72 * visibility);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.56, projection.size * 0.11);
      this.graphics.fillStyle(style.eyeColor, 0.98 * visibility);
      this.graphics.fillCircle(bodyLeft + projection.size * 0.42, bodyTop + projection.size * 0.18, projection.size * 0.04);
      this.graphics.fillCircle(bodyLeft + projection.size * 0.58, bodyTop + projection.size * 0.18, projection.size * 0.04);
      this.graphics.lineStyle(2, accentColor, 0.42 * visibility);
      this.graphics.lineBetween(bodyLeft + projection.size * 0.32, bodyTop + projection.size * 0.06, bodyLeft + projection.size * 0.18, bodyTop - projection.size * 0.06);
      this.graphics.lineBetween(bodyLeft + projection.size * 0.68, bodyTop + projection.size * 0.06, bodyLeft + projection.size * 0.82, bodyTop - projection.size * 0.06);
      this.graphics.fillStyle(0x0a0202, 0.38 * visibility);
      this.graphics.fillRect(bodyLeft + projection.size * 0.08, bodyTop + projection.size * 0.28, projection.size * 0.2, projection.size * 0.5);
      this.graphics.fillRect(bodyLeft + projection.size * 0.72, bodyTop + projection.size * 0.28, projection.size * 0.2, projection.size * 0.5);
      for (const rx of [0.22, 0.5, 0.78] as const) {
        this.graphics.fillStyle(accentColor, 0.35 * visibility);
        this.graphics.fillCircle(bodyLeft + projection.size * rx, bodyTop + projection.size * 0.4, Math.max(1.2, projection.size * 0.04));
      }
      this.graphics.fillStyle(0x120805, 0.45 * visibility);
      this.graphics.fillEllipse(bodyLeft + projection.size * 0.22, bodyTop + projection.size * 0.92, projection.size * 0.2, projection.size * 0.14);
      this.graphics.fillEllipse(bodyLeft + projection.size * 0.78, bodyTop + projection.size * 0.92, projection.size * 0.2, projection.size * 0.14);
      return;
    }

    if (style.silhouette === 'phantom') {
      this.graphics.fillStyle(0x020408, 0.5 * visibility);
      this.graphics.fillTriangle(
        projection.screenX - projection.size * 0.06,
        bodyTop + projection.size * 0.12,
        bodyLeft + projection.size * 0.02,
        bodyTop + projection.size * 0.52,
        bodyLeft + projection.size * 0.14,
        bodyTop + projection.size * 0.2
      );
      this.graphics.fillTriangle(
        projection.screenX + projection.size * 0.06,
        bodyTop + projection.size * 0.12,
        bodyLeft + projection.size * 0.98,
        bodyTop + projection.size * 0.52,
        bodyLeft + projection.size * 0.86,
        bodyTop + projection.size * 0.2
      );
      this.graphics.fillStyle(color, 0.95 * visibility);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.16, projection.size * 0.11);
      this.graphics.fillRect(
        projection.screenX - projection.size * 0.12,
        bodyTop + projection.size * 0.22,
        projection.size * 0.24,
        projection.size * 0.52
      );
      this.graphics.fillTriangle(
        projection.screenX,
        bodyTop + projection.size * 0.06,
        bodyLeft + projection.size * 0.1,
        bodyTop + projection.size * 1.02,
        bodyLeft + projection.size * 0.9,
        bodyTop + projection.size * 1.02
      );
      this.graphics.fillTriangle(
        projection.screenX - projection.size * 0.06,
        bodyTop + projection.size * 0.14,
        projection.screenX - projection.size * 0.38,
        bodyTop - projection.size * 0.02,
        projection.screenX - projection.size * 0.1,
        bodyTop + projection.size * 0.42
      );
      this.graphics.fillTriangle(
        projection.screenX + projection.size * 0.06,
        bodyTop + projection.size * 0.14,
        projection.screenX + projection.size * 0.38,
        bodyTop - projection.size * 0.02,
        projection.screenX + projection.size * 0.1,
        bodyTop + projection.size * 0.42
      );
      this.graphics.fillStyle(style.coreColor, 0.42 * visibility);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.56, projection.size * 0.26, projection.size * 0.38);
      this.graphics.lineStyle(2, accentColor, 0.38 * visibility);
      this.graphics.lineBetween(projection.screenX, bodyTop + projection.size * 0.16, projection.screenX, bodyTop + projection.size * 0.86);
      this.graphics.lineBetween(projection.screenX - projection.size * 0.16, centerY + projection.size * 0.1, projection.screenX - projection.size * 0.3, centerY + projection.size * 0.42);
      this.graphics.lineBetween(projection.screenX + projection.size * 0.16, centerY + projection.size * 0.1, projection.screenX + projection.size * 0.3, centerY + projection.size * 0.42);
      this.drawEnemyHeadAccent(projection.screenX, bodyTop + projection.size * 0.1, projection.size, visibility, style, accentColor);
      this.graphics.fillStyle(style.eyeColor, 0.92 * visibility);
      this.graphics.fillCircle(projection.screenX - projection.size * 0.05, bodyTop + projection.size * 0.22, projection.size * 0.03);
      this.graphics.fillCircle(projection.screenX + projection.size * 0.05, bodyTop + projection.size * 0.22, projection.size * 0.03);
      this.graphics.lineStyle(1, this.blendColors(accentColor, 0x0a1a14, 0.45), 0.22 * visibility);
      for (let w = 0; w < 4; w += 1) {
        const o = w * 0.14;
        this.graphics.lineBetween(
          bodyLeft + projection.size * 0.12,
          bodyTop + projection.size * (0.88 + o),
          bodyLeft + projection.size * 0.32,
          bodyTop + projection.size * (0.55 + o * 0.5)
        );
        this.graphics.lineBetween(
          bodyLeft + projection.size * 0.88,
          bodyTop + projection.size * (0.88 + o),
          bodyLeft + projection.size * 0.68,
          bodyTop + projection.size * (0.55 + o * 0.5)
        );
      }
      this.graphics.fillStyle(0x010806, 0.28 * visibility);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.4, projection.size * 0.24, projection.size * 0.2);
      return;
    }

    if (style.silhouette === 'sentinel') {
      this.graphics.fillStyle(0x030810, 0.52 * visibility);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.54, projection.size * 0.74, projection.size * 0.52);
      this.graphics.fillStyle(color, 0.95 * visibility);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.18, projection.size * 0.17);
      this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.54, projection.size * 0.64, projection.size * 0.72);
      this.graphics.fillRect(
        bodyLeft + projection.size * 0.06,
        bodyTop + projection.size * 0.32,
        projection.size * 0.2,
        projection.size * 0.36
      );
      this.graphics.fillRect(
        bodyLeft + projection.size * 0.74,
        bodyTop + projection.size * 0.32,
        projection.size * 0.2,
        projection.size * 0.36
      );
      this.graphics.fillCircle(bodyLeft + projection.size * 0.16, centerY, projection.size * 0.11);
      this.graphics.fillCircle(bodyLeft + projection.size * 0.84, centerY, projection.size * 0.11);
      this.graphics.fillTriangle(
        projection.screenX,
        bodyTop + projection.size * 0.3,
        bodyLeft + projection.size * 0.3,
        bodyTop + projection.size * 0.88,
        bodyLeft + projection.size * 0.7,
        bodyTop + projection.size * 0.88
      );
      this.graphics.lineStyle(2, accentColor, 0.4 * visibility);
      this.graphics.strokeCircle(projection.screenX, bodyTop + projection.size * 0.18, projection.size * 0.24);
      this.drawEnemyHeadAccent(projection.screenX, bodyTop + projection.size * 0.02, projection.size, visibility, style, accentColor);
      this.graphics.lineBetween(bodyLeft + projection.size * 0.4, bodyTop + projection.size * 0.02, bodyLeft + projection.size * 0.34, bodyTop - projection.size * 0.16);
      this.graphics.lineBetween(bodyLeft + projection.size * 0.6, bodyTop + projection.size * 0.02, bodyLeft + projection.size * 0.66, bodyTop - projection.size * 0.16);
      this.graphics.fillStyle(style.coreColor, 0.68 * visibility);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.58, projection.size * 0.1);
      this.graphics.fillStyle(style.eyeColor, 0.96 * visibility);
      this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.18, projection.size * 0.04);
      this.graphics.fillStyle(0x040a12, 0.55 * visibility);
      this.graphics.fillRect(
        bodyLeft + projection.size * 0.78,
        bodyTop + projection.size * 0.34,
        projection.size * 0.22,
        projection.size * 0.2
      );
      this.graphics.fillStyle(this.blendColors(style.coreColor, 0x1a2a30, 0.5), 0.85 * visibility);
      this.graphics.fillRect(
        bodyLeft + projection.size * 0.82,
        bodyTop + projection.size * 0.38,
        projection.size * 0.2,
        projection.size * 0.12
      );
      this.graphics.lineStyle(1, accentColor, 0.5 * visibility);
      for (let s = 0; s < 3; s += 1) {
        this.graphics.lineBetween(
          bodyLeft + projection.size * 0.86,
          bodyTop + projection.size * (0.4 + s * 0.04),
          bodyLeft + projection.size * 0.98,
          bodyTop + projection.size * (0.38 + s * 0.04)
        );
      }
      this.graphics.fillStyle(accentColor, 0.32 * visibility);
      this.graphics.fillRect(
        bodyLeft + projection.size * 0.88,
        bodyTop + projection.size * 0.2,
        projection.size * 0.26,
        projection.size * 0.08
      );
      this.graphics.fillStyle(0x020408, 0.42 * visibility);
      this.graphics.fillRect(bodyLeft + projection.size * 0.12, bodyTop + projection.size * 0.88, projection.size * 0.76, projection.size * 0.08);
      return;
    }

    this.graphics.fillStyle(0x0a0305, 0.48 * visibility);
    this.graphics.fillEllipse(projection.screenX, bodyTop + projection.size * 0.52, projection.size * 0.52, projection.size * 0.44);
    this.graphics.fillStyle(color, 0.95 * visibility);
    this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.17, projection.size * 0.13);
    const leanWide = style.role === 'flanker' ? 0.14 : 0.18;
    const leanTall = style.role === 'flanker' ? 0.4 : 0.38;
    this.graphics.fillRect(
      projection.screenX - projection.size * leanWide,
      bodyTop + projection.size * 0.26,
      projection.size * (leanWide * 2),
      projection.size * leanTall
    );
    const coatL = style.role === 'flanker' ? 0.1 : 0.18;
    const coatR = style.role === 'flanker' ? 0.9 : 0.82;
    this.graphics.fillTriangle(
      projection.screenX,
      bodyTop + projection.size * 0.16,
      bodyLeft + projection.size * coatL,
      bodyTop + projection.size * 0.92,
      bodyLeft + projection.size * coatR,
      bodyTop + projection.size * 0.92
    );
    const armOuterL = style.role === 'flanker' ? 0.02 : 0.04;
    const armInnerL = style.role === 'flanker' ? 0.22 : 0.24;
    const armOuterR = style.role === 'flanker' ? 0.98 : 0.96;
    const armInnerR = style.role === 'flanker' ? 0.78 : 0.76;
    this.graphics.fillTriangle(
      bodyLeft + projection.size * coatL,
      bodyTop + projection.size * 0.42,
      bodyLeft + projection.size * armOuterL,
      bodyTop + projection.size * 0.72,
      bodyLeft + projection.size * armInnerL,
      bodyTop + projection.size * 0.54
    );
    this.graphics.fillTriangle(
      bodyLeft + projection.size * coatR,
      bodyTop + projection.size * 0.42,
      bodyLeft + projection.size * armOuterR,
      bodyTop + projection.size * 0.72,
      bodyLeft + projection.size * armInnerR,
      bodyTop + projection.size * 0.54
    );
    this.graphics.fillStyle(style.coreColor, 0.5 * visibility);
    this.graphics.fillCircle(projection.screenX, bodyTop + projection.size * 0.54, projection.size * 0.08);
    this.graphics.lineStyle(2, accentColor, 0.3 * visibility);
    this.drawEnemyHeadAccent(projection.screenX, bodyTop + projection.size * 0.12, projection.size, visibility, style, accentColor);
    this.graphics.lineBetween(bodyLeft + projection.size * 0.26, bodyTop + projection.size * 0.72, bodyLeft + projection.size * 0.74, bodyTop + projection.size * 0.72);
    this.graphics.fillStyle(0x1a0a0c, 0.85 * visibility);
    this.graphics.fillRect(bodyLeft + projection.size * 0.34, bodyTop + projection.size * 0.19, projection.size * 0.32, projection.size * 0.05);
    this.graphics.fillStyle(style.eyeColor, 0.94 * visibility);
    this.graphics.fillRect(bodyLeft + projection.size * 0.36, bodyTop + projection.size * 0.2, projection.size * 0.1, projection.size * 0.03);
    this.graphics.fillRect(bodyLeft + projection.size * 0.54, bodyTop + projection.size * 0.2, projection.size * 0.1, projection.size * 0.03);
    this.graphics.fillStyle(0x0c0304, 0.4 * visibility);
    this.graphics.fillRect(bodyLeft + projection.size * 0.28, bodyTop + projection.size * 0.4, projection.size * 0.44, projection.size * 0.12);
    for (let b = 0; b < 3; b += 1) {
      this.graphics.fillStyle(accentColor, (0.22 - b * 0.04) * visibility);
      this.graphics.fillRect(
        bodyLeft + projection.size * 0.3,
        bodyTop + projection.size * (0.42 + b * 0.04),
        projection.size * 0.4,
        2
      );
    }
    this.graphics.fillStyle(0x150506, 0.32 * visibility);
    this.graphics.fillEllipse(bodyLeft + projection.size * 0.2, bodyTop + projection.size * 0.36, projection.size * 0.12, projection.size * 0.1);
    this.graphics.fillEllipse(bodyLeft + projection.size * 0.8, bodyTop + projection.size * 0.36, projection.size * 0.12, projection.size * 0.1);
  }

  private drawEnemyHeadAccent(
    centerX: number,
    headY: number,
    size: number,
    visibility: number,
    style: ReturnType<typeof getRaycastEnemyVisualStyle>,
    accentColor: number
  ): void {
    this.graphics.lineStyle(2, accentColor, 0.44 * visibility);

    if (style.hornStyle === 'ram') {
      this.graphics.lineBetween(centerX - size * 0.08, headY, centerX - size * 0.26, headY - size * 0.16);
      this.graphics.lineBetween(centerX + size * 0.08, headY, centerX + size * 0.26, headY - size * 0.16);
      return;
    }

    if (style.hornStyle === 'tusk') {
      this.graphics.lineBetween(centerX - size * 0.2, headY + size * 0.06, centerX - size * 0.26, headY + size * 0.22);
      this.graphics.lineBetween(centerX + size * 0.2, headY + size * 0.06, centerX + size * 0.26, headY + size * 0.22);
      return;
    }

    if (style.hornStyle === 'antenna') {
      this.graphics.lineBetween(centerX, headY + size * 0.03, centerX, headY - size * 0.22);
      this.graphics.lineBetween(centerX - size * 0.08, headY - size * 0.03, centerX - size * 0.14, headY - size * 0.15);
      this.graphics.lineBetween(centerX + size * 0.08, headY - size * 0.03, centerX + size * 0.14, headY - size * 0.15);
      this.graphics.fillStyle(style.eyeColor, 0.72 * visibility);
      this.graphics.fillCircle(centerX, headY - size * 0.24, Math.max(1.5, size * 0.022));
      return;
    }

    if (style.hornStyle === 'glitch-spikes') {
      this.graphics.lineBetween(centerX - size * 0.14, headY + size * 0.02, centerX - size * 0.2, headY - size * 0.14);
      this.graphics.lineBetween(centerX, headY + size * 0.04, centerX, headY - size * 0.18);
      this.graphics.lineBetween(centerX + size * 0.14, headY + size * 0.02, centerX + size * 0.2, headY - size * 0.14);
      return;
    }

    this.graphics.lineBetween(centerX - size * 0.12, headY, centerX + size * 0.12, headY);
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

    if (projection.billboard.style === 'health') {
      this.graphics.lineStyle(2, 0xffffff, 0.58);
      this.graphics.strokeRect(
        projection.screenX - projection.size * 0.42,
        y - projection.size * 0.42,
        projection.size * 0.84,
        projection.size * 0.84
      );
      this.graphics.lineBetween(projection.screenX - projection.size * 0.24, y, projection.screenX + projection.size * 0.24, y);
      this.graphics.lineBetween(projection.screenX, y - projection.size * 0.24, projection.screenX, y + projection.size * 0.24);
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

  private ensureEnemyProjectionSlot(index: number): EnemyProjection {
    const list = this.enemyProjectionScratch;
    while (index >= list.length) {
      list.push({
        enemy: null as unknown as RaycastEnemy,
        screenX: 0,
        size: 0,
        distance: 0
      });
    }
    return list[index];
  }

  private ensureProjectileProjectionSlot(index: number): ProjectileProjection {
    const list = this.projectileProjectionScratch;
    while (index >= list.length) {
      list.push({
        projectile: null as unknown as RaycastEnemyProjectile,
        screenX: 0,
        size: 0,
        distance: 0
      });
    }
    return list[index];
  }

  private ensureBillboardProjectionSlot(index: number): BillboardProjection {
    const list = this.billboardProjectionScratch;
    while (index >= list.length) {
      list.push({
        billboard: null as unknown as RaycastBillboard,
        screenX: 0,
        size: 0,
        distance: 0
      });
    }
    return list[index];
  }

  private fillEnemyProjection(
    player: RaycastPlayerState,
    enemy: RaycastEnemy,
    width: number,
    height: number,
    out: EnemyProjection
  ): boolean {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToEnemy = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToEnemy - player.angle);

    if (Math.abs(angleDelta) > this.config.fovRadians * 0.58) return false;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const size = Phaser.Math.Clamp(height / correctedDistance / 1.7, 18, 210);
    out.enemy = enemy;
    out.screenX = screenX;
    out.size = size;
    out.distance = correctedDistance;
    return true;
  }

  private fillProjectileProjection(
    player: RaycastPlayerState,
    projectile: RaycastEnemyProjectile,
    width: number,
    height: number,
    out: ProjectileProjection
  ): boolean {
    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToPoint = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToPoint - player.angle);

    if (Math.abs(angleDelta) > this.config.fovRadians * 0.52) return false;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const size = Phaser.Math.Clamp(height / correctedDistance / 28, 3, 14);
    out.projectile = projectile;
    out.screenX = screenX;
    out.size = size;
    out.distance = correctedDistance;
    return true;
  }

  private fillBillboardProjection(
    player: RaycastPlayerState,
    billboard: RaycastBillboard,
    width: number,
    height: number,
    out: BillboardProjection
  ): boolean {
    const dx = billboard.x - player.x;
    const dy = billboard.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToPoint = Math.atan2(dy, dx);
    const angleDelta = normalizeAngle(angleToPoint - player.angle);
    if (Math.abs(angleDelta) > this.config.fovRadians * 0.52) return false;

    const screenX = width * 0.5 + (angleDelta / (this.config.fovRadians * 0.5)) * width * 0.5;
    const correctedDistance = Math.max(0.001, distance * Math.cos(angleDelta));
    const size = Phaser.Math.Clamp((height / correctedDistance / 18) * billboard.radius, 5, 28);
    out.billboard = billboard;
    out.screenX = screenX;
    out.size = size;
    out.distance = correctedDistance;
    return true;
  }
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
