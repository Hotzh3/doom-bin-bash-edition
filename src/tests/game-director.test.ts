import { describe, expect, it } from 'vitest';
import { GameDirector, type GameDirectorInput } from '../game/systems/GameDirector';

const baseInput: GameDirectorInput = {
  elapsedTime: 0,
  totalKills: 0,
  enemiesAlive: 0,
  p1Health: 100,
  p2Health: 100,
  p1Alive: true,
  p2Alive: true,
  currentWave: 1
};

describe('GameDirector', () => {
  it('lowers intensity when players are weak', () => {
    const director = new GameDirector();
    const healthyIntensity = director.calculateIntensity({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 6
    });
    const weakIntensity = director.calculateIntensity({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 6,
      p1Health: 20,
      p2Health: 25
    });

    expect(weakIntensity).toBeLessThan(healthyIntensity);
  });

  it('raises intensity with time and kills', () => {
    const director = new GameDirector();
    const openingIntensity = director.calculateIntensity(baseInput);
    const progressedIntensity = director.calculateIntensity({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 6
    });

    expect(progressedIntensity).toBeGreaterThan(openingIntensity);
  });

  it('respects the maximum number of living enemies', () => {
    const director = new GameDirector({ maxEnemiesAlive: 2, spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      enemiesAlive: 2,
      elapsedTime: 10_000
    });

    expect(decision.maxEnemiesAlive).toBe(2);
    expect(decision.state).toBe('BUILD_UP');
    expect(decision.spawn).toBeNull();
    expect(decision.events.some((event) => event.type === 'WARNING_MESSAGE')).toBe(true);
  });

  it('does not spawn while both players are dead', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 10_000,
      p1Alive: false,
      p2Alive: false
    });

    expect(decision.intensity).toBe(0);
    expect(decision.spawn).toBeNull();
  });

  it('respects spawn cooldown', () => {
    const director = new GameDirector({ spawnCooldownMs: 5000 });
    director.createOpeningSpawns();

    const decision = director.update({
      ...baseInput,
      elapsedTime: 3000
    });

    expect(decision.spawn).toBeNull();
  });

  it('respects spawn cooldown during ambush pressure', () => {
    const director = new GameDirector({ config: { ambushSpawnCooldownMs: 5000 } });
    director.notifyZoneTrigger('cooldown-ambush', 1000);
    const first = director.update({ ...baseInput, elapsedTime: 2000, activatedTriggerCount: 1 });
    const second = director.update({ ...baseInput, elapsedTime: 3000, activatedTriggerCount: 1 });

    expect(first.spawn).not.toBeNull();
    expect(first.events.some((event) => event.type === 'PREPARE_AMBUSH')).toBe(true);
    expect(first.events.some((event) => event.type === 'SPAWN_PRESSURE')).toBe(true);
    expect(second.spawn).toBeNull();
    expect(second.debug.lastDecisionReason).toBe('spawn cooldown');
  });

  it('does not exceed total spawn budget', () => {
    const director = new GameDirector({
      maxTotalSpawns: 2,
      openingSpawnCount: 1,
      spawnCooldownMs: 0
    });

    expect(director.createOpeningSpawns()).toHaveLength(1);
    director.notifyZoneTrigger('test-ambush', 1000);
    expect(director.update({ ...baseInput, elapsedTime: 2000 }).spawn).not.toBeNull();
    expect(director.update({ ...baseInput, elapsedTime: 4000 }).spawn).toBeNull();
    expect(director.hasExhaustedSpawnBudget()).toBe(true);
  });

  it('chooses enemy types according to progression', () => {
    const director = new GameDirector();
    expect(director.selectEnemyKind(baseInput)).toBe('GRUNT');

    expect(
      director.selectEnemyKind({
        ...baseInput,
        elapsedTime: 40_000,
        totalKills: 1
      })
    ).toBe('STALKER');

    expect(
      director.selectEnemyKind({
        ...baseInput,
        elapsedTime: 60_000,
        totalKills: 6
      })
    ).toBe('BRUTE');

    expect(
      director.selectEnemyKind({
        ...baseInput,
        elapsedTime: 60_000,
        totalKills: 7
      })
    ).toBe('RANGED');
  });

  it('enters ambush when a zone trigger notifies the director', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    director.notifyZoneTrigger('foundry-ambush', 1000);

    const decision = director.update({
      ...baseInput,
      elapsedTime: 2000,
      activeZoneId: 'foundry-ambush',
      activatedTriggerCount: 1
    });

    expect(decision.state).toBe('AMBUSH');
    expect(decision.spawn?.kind).toMatch(/STALKER|RANGED/);
    expect(decision.debug.lastDecisionReason).toContain('spawn');
  });

  it('punishes stationary players with stalker pressure', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 2000,
      playerStationaryMs: 3000
    });

    expect(decision.state).toBe('BUILD_UP');
    expect(decision.spawn?.kind).toBe('STALKER');
    expect(decision.events.some((event) => event.type === 'PUNISH_STATIONARY')).toBe(true);
  });

  it('stationary player can emit pressure event without spawning when capped', () => {
    const director = new GameDirector({ maxEnemiesAlive: 1, spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      enemiesAlive: 1,
      elapsedTime: 2000,
      playerStationaryMs: 3000
    });

    expect(decision.state).toBe('BUILD_UP');
    expect(decision.spawn).toBeNull();
    expect(decision.events.some((event) => event.type === 'PUNISH_STATIONARY')).toBe(true);
  });

  it('uses scene-filtered spawn points when provided', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 2000,
      playerStationaryMs: 3000,
      spawnPoints: [{ x: 9, y: 10, zoneId: 'gate-hall' }]
    });

    expect(decision.spawn).toMatchObject({ x: 9, y: 10 });
  });

  it('does not spend budget when no safe spawn points are available', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 2000,
      playerStationaryMs: 3000,
      spawnPoints: []
    });

    expect(decision.spawn).toBeNull();
    expect(decision.debug.lastDecisionReason).toBe('no safe spawn points');
    expect(decision.debug.spawnBudgetRemaining).toBe(22);
  });

  it('does not spawn over the configured enemy cap in high pressure', () => {
    const director = new GameDirector({ config: { maxEnemiesAlive: 3, highIntensitySpawnCooldownMs: 0 } });
    expect(
      director.update({
        ...baseInput,
        elapsedTime: 60_000,
        totalKills: 8,
        enemiesAlive: 1,
        timeSincePlayerDamagedMs: 20_000,
        equippedWeapons: ['SHOTGUN']
      }).state
    ).toBe('HIGH_INTENSITY');

    const decision = director.update({
      ...baseInput,
      elapsedTime: 61_000,
      totalKills: 8,
      enemiesAlive: 3,
      timeSincePlayerDamagedMs: 20_000,
      equippedWeapons: ['SHOTGUN']
    });

    expect(decision.state).toBe('HIGH_INTENSITY');
    expect(decision.spawn).toBeNull();
    expect(decision.debug.lastDecisionReason).toBe('enemy cap reached');
  });

  it('dominance generates high intensity pressure events', () => {
    const director = new GameDirector({ config: { highIntensitySpawnCooldownMs: 0 } });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 8,
      enemiesAlive: 1,
      timeSincePlayerDamagedMs: 20_000,
      equippedWeapons: ['SHOTGUN']
    });

    expect(decision.state).toBe('HIGH_INTENSITY');
    expect(decision.events.some((event) => event.type === 'WARNING_MESSAGE')).toBe(true);
  });

  it('adds pressure when the player is far from an important pickup', () => {
    const director = new GameDirector();
    const nearPickup = director.calculateIntensity({
      ...baseInput,
      elapsedTime: 10_000,
      distanceToImportantPickup: 1
    });
    const farPickup = director.calculateIntensity({
      ...baseInput,
      elapsedTime: 10_000,
      distanceToImportantPickup: 8
    });

    expect(farPickup).toBeGreaterThan(nearPickup);
  });

  it('allows FPS-specific director config overrides', () => {
    const director = new GameDirector({ config: { maxEnemiesAlive: 1, maxTotalSpawns: 3 } });
    const decision = director.update({
      ...baseInput,
      enemiesAlive: 1,
      elapsedTime: 10_000
    });

    expect(decision.maxEnemiesAlive).toBe(1);
    expect(decision.spawn).toBeNull();
    expect(decision.debug.spawnBudgetRemaining).toBe(3);
  });

  it('allows stronger enemies when the player has the launcher', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    director.notifyZoneTrigger('test', 1000);
    director.update({ ...baseInput, elapsedTime: 2000, activeZoneId: 'test' });

    const decision = director.update({
      ...baseInput,
      elapsedTime: 12_000,
      totalKills: 8,
      equippedWeapons: ['LAUNCHER']
    });

    expect(decision.spawn?.kind).toMatch(/BRUTE|RANGED|STALKER/);
  });

  it('enters recovery when living players are low health', () => {
    const director = new GameDirector({ spawnCooldownMs: 0 });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 20_000,
      p1Health: 20,
      p2Health: 25
    });

    expect(decision.state).toBe('RECOVERY');
    expect(decision.spawn).toBeNull();
    expect(decision.events.some((event) => event.type === 'RECOVERY_SIGNAL')).toBe(true);
  });

  it('emits ambient pulse during exploration without spawning', () => {
    const director = new GameDirector({ config: { ambientPulseCooldownMs: 1000 } });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 1000
    });

    expect(decision.state).toBe('EXPLORATION');
    expect(decision.spawn).toBeNull();
    expect(decision.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'AMBIENT_PULSE'
        })
      ])
    );
  });

  it('leaves recovery after its configured duration when health stabilizes', () => {
    const director = new GameDirector({ config: { recoveryDurationMs: 1000 } });

    expect(
      director.update({
        ...baseInput,
        elapsedTime: 20_000,
        p1Health: 20,
        p2Health: 25
      }).state
    ).toBe('RECOVERY');

    const recovered = director.update({
      ...baseInput,
      elapsedTime: 21_200,
      p1Health: 70,
      p2Health: 70
    });

    expect(recovered.state).toBe('EXPLORATION');
    expect(recovered.spawn).toBeNull();
  });

  it('caps high intensity duration into recovery instead of looping forever', () => {
    const director = new GameDirector({ config: { highIntensityDurationMs: 1000, highIntensitySpawnCooldownMs: 0 } });

    expect(
      director.update({
        ...baseInput,
        elapsedTime: 60_000,
        totalKills: 8,
        enemiesAlive: 1,
        timeSincePlayerDamagedMs: 20_000
      }).state
    ).toBe('HIGH_INTENSITY');

    const spent = director.update({
      ...baseInput,
      elapsedTime: 61_200,
      totalKills: 8,
      enemiesAlive: 3,
      timeSincePlayerDamagedMs: 21_200
    });

    expect(spent.state).toBe('RECOVERY');
    expect(spent.spawn).toBeNull();
    expect(spent.debug.lastDecisionReason).toBe('recovery pause');
  });
});
