import { describe, expect, it } from 'vitest';
import { castRay, RAYCAST_MAP_BOSS } from '../game/raycast/RaycastMap';
import type { RaycastPlayerState } from '../game/raycast/RaycastPlayerController';
import {
  computeRaycastBossWeaponDamage,
  countRaycastBossConnectingPellets,
  createRaycastBossState,
  damageRaycastBoss,
  getRaycastBossPhaseLabel,
  syncRaycastBossPhase,
  tickRaycastBossArenaTwist,
  tickRaycastBossMovement,
  tickRaycastBossVolleys,
  type RaycastBossConfig
} from '../game/raycast/RaycastBoss';
import { addRaycastBossClearScore } from '../game/raycast/RaycastScore';
import { RAYCAST_LEVEL_BOSS, RAYCAST_WORLD_THREE_CATALOG, RAYCAST_WORLD_TWO_CATALOG } from '../game/raycast/RaycastLevel';
import { getRaycastBossVisualProfile } from '../game/raycast/RaycastBossVisual';

const CONFIG: RaycastBossConfig = {
  id: 'volt-archon',
  displayName: 'Volt Archon',
  x: 7.5,
  y: 7.5,
  maxHealth: 120,
  hitRadius: 0.55
};

describe('raycast boss', () => {
  it('creates alive state with phased health bands', () => {
    const t = 1000;
    const boss = createRaycastBossState(CONFIG, t);
    expect(boss.alive).toBe(true);
    expect(boss.health).toBe(120 * 6);
    expect(boss.phase).toBe(1);
    expect(boss.arenaTwist).toBe('none');
  });

  it('starts a telegraphed arena twist when crossing into phase 2', () => {
    const boss = createRaycastBossState(CONFIG, 500);
    damageRaycastBoss(boss, 241, 1000);
    expect(boss.phase).toBe(2);
    expect(boss.arenaTwist).toBe('ion_veil');
    expect(boss.arenaTwistUntil).toBeGreaterThan(1000);
  });

  it('picks lateral lane twist for Bloom Warden on phase 2 entry', () => {
    const boss = createRaycastBossState(
      { ...CONFIG, id: 'bloom', displayName: 'Bloom Warden', behavior: 'bloom-warden' },
      0
    );
    damageRaycastBoss(boss, 241, 200);
    expect(boss.arenaTwist).toBe('lateral_lane');
  });

  it('clears arena twist after the twist window expires', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    damageRaycastBoss(boss, 61, 0);
    const until = boss.arenaTwistUntil;
    tickRaycastBossArenaTwist(boss, until + 50);
    expect(boss.arenaTwist).toBe('none');
  });

  it('transitions through phase 1 -> 2 -> 3 by health ratio bands', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    boss.health = Math.round(boss.maxHealth * 0.68);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(1);
    boss.health = Math.round(boss.maxHealth * 0.66);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(2);
    boss.health = Math.round(boss.maxHealth * 0.64);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(2);
    boss.health = Math.round(boss.maxHealth * 0.35);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(2);
    boss.health = Math.round(boss.maxHealth * 0.33);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(3);
    boss.health = Math.round(boss.maxHealth * 0.31);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(3);
    expect(getRaycastBossPhaseLabel({ ...boss, phase: 2 })).toContain('ION BRACKET');
    expect(getRaycastBossPhaseLabel(boss)).toContain('PHASE 3');
  });

  it('uses strict thresholds at exactly 66% and 33% hp', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    boss.health = boss.maxHealth * (2 / 3);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(2);
    boss.health = boss.maxHealth * (1 / 3);
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(3);
  });

  it('applies weapon damage along pellet rays against boss disk', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    const player: RaycastPlayerState = {
      x: 2.5,
      y: 7.5,
      angle: 0,
      velocity: { x: 0, y: 0 }
    };
    const dmg = computeRaycastBossWeaponDamage(boss, player, RAYCAST_MAP_BOSS, 'PISTOL', 'raycast');
    expect(dmg).toBeGreaterThan(0);
    expect(countRaycastBossConnectingPellets(boss, player, RAYCAST_MAP_BOSS, 'PISTOL', 'raycast')).toBeGreaterThanOrEqual(1);
  });

  it('emits telegraphed volleys after scheduling', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    boss.nextVolleyReadyAt = 0;
    boss.pendingVolleyAt = 0;
    const t0 = 5000;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true }, t0);
    expect(boss.pendingVolleyAt).toBeGreaterThan(t0);
    const shots = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true }, boss.pendingVolleyAt + 1);
    expect(shots.length).toBeGreaterThanOrEqual(1);
  });

  it('fires stronger volleys when player stays stationary', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    boss.phase = 2;
    boss.nextVolleyReadyAt = 0;
    const t0 = 4000;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 1200 }, t0);
    const shots = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 1200 }, boss.pendingVolleyAt + 1);
    expect(shots.length).toBe(7);
  });

  it('adds phase 2 bracket rails without inflating fan count when player is moving', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    boss.phase = 2;
    boss.nextVolleyReadyAt = 0;
    const t0 = 4500;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 0 }, t0);
    const shots = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 0 }, boss.pendingVolleyAt + 1);
    expect(shots.length).toBe(5);
  });

  it('moves in the arena without clipping into walls', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    const before = { x: boss.x, y: boss.y };
    tickRaycastBossMovement(boss, RAYCAST_MAP_BOSS, { x: 2.5, y: 7.5, alive: true }, 1000, 1000);
    expect(Math.hypot(boss.x - before.x, boss.y - before.y)).toBeGreaterThan(0.05);
    expect(Math.floor(boss.x)).toBeGreaterThanOrEqual(0);
    expect(Math.floor(boss.y)).toBeGreaterThanOrEqual(0);
    expect(RAYCAST_MAP_BOSS.grid[Math.floor(boss.y)]?.[Math.floor(boss.x)]).toBe(0);
  });

  it('dies and awards flat clear score hook', () => {
    const boss = createRaycastBossState({ ...CONFIG, maxHealth: 20 }, 0);
    const killed = damageRaycastBoss(boss, 121, 100);
    expect(killed).toBe(true);
    expect(boss.alive).toBe(false);
    expect(addRaycastBossClearScore(100)).toBe(100 + 2500);
  });

  it('labels Bloom Warden phases distinctly', () => {
    const boss = createRaycastBossState(
      { ...CONFIG, behavior: 'bloom-warden', id: 'bloom-warden', displayName: 'Bloom Warden' },
      0
    );
    boss.phase = 2;
    expect(getRaycastBossPhaseLabel(boss)).toContain('BLOOM CROSS');
  });

  it('fires Bloom Warden volleys: twin rails then bloom cross pattern', () => {
    const cfg: RaycastBossConfig = {
      ...CONFIG,
      id: 'bloom-warden',
      displayName: 'Bloom Warden',
      behavior: 'bloom-warden'
    };
    const boss = createRaycastBossState(cfg, 0);
    boss.phase = 1;
    boss.nextVolleyReadyAt = 0;
    boss.pendingVolleyAt = 0;
    const t0 = 5000;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true }, t0);
    const p1 = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true }, boss.pendingVolleyAt + 1);
    expect(p1.length).toBe(2);

    boss.phase = 2;
    boss.nextVolleyReadyAt = 0;
    boss.pendingVolleyAt = 0;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 0 }, 6000);
    const p2move = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 0 }, boss.pendingVolleyAt + 1);
    expect(p2move.length).toBe(6);

    boss.nextVolleyReadyAt = 0;
    boss.pendingVolleyAt = 0;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 1200 }, 7000);
    const p2camp = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 1200 }, boss.pendingVolleyAt + 1);
    expect(p2camp.length).toBe(8);

    boss.phase = 3;
    boss.nextVolleyReadyAt = 0;
    boss.pendingVolleyAt = 0;
    tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 1200 }, 7500);
    const p3camp = tickRaycastBossVolleys(boss, { x: 2.5, y: 7.5, alive: true, stationaryMs: 1200 }, boss.pendingVolleyAt + 1);
    expect(p3camp.length).toBeGreaterThan(p2camp.length);
  });

  it('keeps World 2 boss config distinct and harder than World 1 boss', () => {
    const world2Boss = RAYCAST_WORLD_TWO_CATALOG.find((level) => level.id === 'bloom-warden-pit')?.bossConfig;
    const world1Boss = RAYCAST_LEVEL_BOSS.bossConfig;
    expect(world2Boss).toBeDefined();
    expect(world1Boss).toBeDefined();
    expect(world2Boss?.behavior).toBe('bloom-warden');
    expect(world2Boss?.displayName).not.toBe(world1Boss?.displayName);
    expect((world2Boss?.maxHealth ?? 0)).toBeGreaterThan(world1Boss?.maxHealth ?? 0);
    expect((world2Boss?.hitRadius ?? 0)).toBeGreaterThan(world1Boss?.hitRadius ?? 0);
  });

  it('keeps World 3 boss harder than World 2 with distinct behavior', () => {
    const world2Boss = RAYCAST_WORLD_TWO_CATALOG.find((level) => level.id === 'bloom-warden-pit')?.bossConfig;
    const world3Boss = RAYCAST_WORLD_THREE_CATALOG.find((level) => level.id === 'ash-judge-seal')?.bossConfig;
    expect(world2Boss).toBeDefined();
    expect(world3Boss).toBeDefined();
    expect(world3Boss?.behavior).toBe('ash-judge');
    expect((world3Boss?.maxHealth ?? 0)).toBeGreaterThan(world2Boss?.maxHealth ?? 0);
    expect((world3Boss?.hitRadius ?? 0)).toBeGreaterThan(world2Boss?.hitRadius ?? 0);
  });

  it('uses oversized layered boss visuals distinct from regular enemy billboards', () => {
    const p1 = getRaycastBossVisualProfile({ behavior: 'volt-archon', phase: 1, hitFlashUntil: 0 }, 0);
    const p3 = getRaycastBossVisualProfile({ behavior: 'bloom-warden', phase: 3, hitFlashUntil: 0 }, 0);
    expect(p1.silhouetteScale).toBeGreaterThan(1.1);
    expect(p1.ringCount).toBeGreaterThanOrEqual(2);
    expect(p3.silhouetteScale).toBeGreaterThan(p1.silhouetteScale);
    expect(p3.ringCount).toBeGreaterThan(p1.ringCount);
    expect(p3.particleCount).toBeGreaterThan(p1.particleCount);
  });

  it('keeps exit ray from player to boss unblocked on boss map', () => {
    const player: RaycastPlayerState = {
      x: 2.5,
      y: 7.5,
      angle: 0,
      velocity: { x: 0, y: 0 }
    };
    const hit = castRay(RAYCAST_MAP_BOSS, player.x, player.y, player.angle, player.angle);
    expect(hit.distance).toBeGreaterThan(4);
  });
});
