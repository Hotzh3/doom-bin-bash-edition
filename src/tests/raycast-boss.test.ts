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
    expect(boss.health).toBe(120);
    expect(boss.phase).toBe(1);
    expect(boss.arenaTwist).toBe('none');
  });

  it('starts a telegraphed arena twist when crossing into phase 2', () => {
    const boss = createRaycastBossState(CONFIG, 500);
    damageRaycastBoss(boss, 61, 1000);
    expect(boss.phase).toBe(2);
    expect(boss.arenaTwist).toBe('ion_veil');
    expect(boss.arenaTwistUntil).toBeGreaterThan(1000);
  });

  it('picks lateral lane twist for Bloom Warden on phase 2 entry', () => {
    const boss = createRaycastBossState(
      { ...CONFIG, id: 'bloom', displayName: 'Bloom Warden', behavior: 'bloom-warden' },
      0
    );
    damageRaycastBoss(boss, 61, 200);
    expect(boss.arenaTwist).toBe('lateral_lane');
  });

  it('clears arena twist after the twist window expires', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    damageRaycastBoss(boss, 61, 0);
    const until = boss.arenaTwistUntil;
    tickRaycastBossArenaTwist(boss, until + 50);
    expect(boss.arenaTwist).toBe('none');
  });

  it('switches into aggressive phase when boss drops to half health', () => {
    const boss = createRaycastBossState(CONFIG, 0);
    boss.health = 71;
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(1);
    boss.health = 60;
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(1);
    boss.health = 59;
    syncRaycastBossPhase(boss);
    expect(boss.phase).toBe(2);
    expect(getRaycastBossPhaseLabel(boss)).toContain('PHASE 2');
    expect(getRaycastBossPhaseLabel(boss)).toContain('ION BRACKET');
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
    const killed = damageRaycastBoss(boss, 25, 100);
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
