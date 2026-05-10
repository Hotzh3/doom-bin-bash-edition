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
    expect(getRaycastBossPhaseLabel(boss.phase)).toContain('PHASE 2');
    expect(getRaycastBossPhaseLabel(boss.phase)).toContain('ION BRACKET');
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
