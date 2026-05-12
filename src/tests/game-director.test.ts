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
  const calmInput: GameDirectorInput = {
    ...baseInput,
    p2Alive: false,
    p2Health: 0,
    currentWave: 0
  };

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

  it('starts calm, then shifts into watching as the run develops', () => {
    const director = new GameDirector();

    expect(director.update(calmInput).state).toBe('CALM');
    expect(
      director.update({
        ...baseInput,
        elapsedTime: 10_000
      }).state
    ).toBe('WATCHING');
  });

  it('respects the maximum number of living enemies during pressure', () => {
    const director = new GameDirector({ config: { maxEnemiesAlive: 2, warningLeadMs: 0, highIntensitySpawnCooldownMs: 0 } });
    director.update({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 8,
      enemiesAlive: 1,
      timeSincePlayerDamagedMs: 20_000
    });

    const decision = director.update({
      ...baseInput,
      elapsedTime: 61_000,
      totalKills: 8,
      enemiesAlive: 2,
      timeSincePlayerDamagedMs: 21_000
    });

    expect(decision.maxEnemiesAlive).toBe(2);
    expect(decision.state).toBe('PRESSURE');
    expect(decision.spawn).toBeNull();
    expect(decision.debug.lastDecisionReason).toBe('enemy cap reached');
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

  it('telegraphs ambushes before pressure spawns and still respects cooldown', () => {
    const director = new GameDirector({ config: { ambushSpawnCooldownMs: 5000, warningLeadMs: 1000 } });
    director.notifyZoneTrigger('cooldown-ambush', 1000);

    const warning = director.update({ ...baseInput, elapsedTime: 1500, activatedTriggerCount: 1 });
    const first = director.update({ ...baseInput, elapsedTime: 2000, activatedTriggerCount: 1 });
    const second = director.update({ ...baseInput, elapsedTime: 3000, activatedTriggerCount: 1 });

    expect(warning.state).toBe('WARNING');
    expect(warning.spawn).toBeNull();
    expect(warning.events.some((event) => event.type === 'PREPARE_AMBUSH')).toBe(true);
    expect(warning.events.some((event) => event.type === 'WARNING_MESSAGE')).toBe(true);
    expect(first.state).toBe('AMBUSH');
    expect(first.spawn).not.toBeNull();
    expect(first.events.some((event) => event.type === 'SPAWN_PRESSURE')).toBe(true);
    expect(second.spawn).toBeNull();
    expect(second.debug.lastDecisionReason).toMatch(/pause|cooldown/);
  });

  it('does not exceed total spawn budget', () => {
    const director = new GameDirector({
      maxTotalSpawns: 2,
      openingSpawnCount: 1,
      spawnCooldownMs: 0,
      config: { warningLeadMs: 0, ambushSpawnCooldownMs: 0 }
    });

    expect(director.createOpeningSpawns()).toHaveLength(1);
    director.notifyZoneTrigger('test-ambush', 1000);
    expect(director.update({ ...baseInput, elapsedTime: 1500 }).spawn).not.toBeNull();
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

  it('enters ambush only after the warning window from a zone trigger', () => {
    const director = new GameDirector({ spawnCooldownMs: 0, config: { warningLeadMs: 800 } });
    director.notifyZoneTrigger('foundry-ambush', 1000);

    const warning = director.update({
      ...baseInput,
      elapsedTime: 1500,
      activeZoneId: 'foundry-ambush',
      activatedTriggerCount: 1
    });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 1900,
      activeZoneId: 'foundry-ambush',
      activatedTriggerCount: 1
    });

    expect(warning.state).toBe('WARNING');
    expect(decision.state).toBe('AMBUSH');
    expect(decision.spawn?.kind).toMatch(/STALKER|RANGED/);
  });

  it('telegraphs stationary pressure before punishing with stalker spawns', () => {
    const director = new GameDirector({
      spawnCooldownMs: 0,
      config: { warningLeadMs: 600, stationaryPressureGraceMs: 1000 }
    });

    const warning = director.update({
      ...baseInput,
      elapsedTime: 2000,
      playerStationaryMs: 2200
    });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 3200,
      playerStationaryMs: 3400
    });

    expect(warning.state).toBe('WARNING');
    expect(warning.spawn).toBeNull();
    expect(warning.events.some((event) => event.type === 'WARNING_MESSAGE')).toBe(true);
    expect(decision.state).toBe('PRESSURE');
    expect(decision.spawn?.kind).toBe('STALKER');
    expect(decision.events.some((event) => event.type === 'PUNISH_STATIONARY')).toBe(true);
  });

  it('moving and getting kills reduce anti-camp pressure over time', () => {
    const director = new GameDirector({
      spawnCooldownMs: 0,
      config: { warningLeadMs: 600, stationaryPressureGraceMs: 1000 }
    });

    director.update({
      ...baseInput,
      elapsedTime: 2000,
      playerStationaryMs: 2200
    });
    const pressured = director.update({
      ...baseInput,
      elapsedTime: 3200,
      playerStationaryMs: 3400
    });
    const recovered = director.update({
      ...baseInput,
      elapsedTime: 5200,
      enemiesAlive: 1,
      totalKills: 1,
      playerStationaryMs: 0
    });

    expect(pressured.debug.antiCampMeterMs).toBeGreaterThan(0);
    expect(recovered.state).not.toBe('PRESSURE');
    expect((recovered.debug.antiCampMeterMs ?? 0)).toBeLessThan(pressured.debug.antiCampMeterMs ?? 0);
  });

  it('stationary pressure still emits events without spawning when capped', () => {
    const director = new GameDirector({
      maxEnemiesAlive: 1,
      spawnCooldownMs: 0,
      config: { warningLeadMs: 600, stationaryPressureGraceMs: 1000 }
    });

    director.update({
      ...baseInput,
      elapsedTime: 2000,
      enemiesAlive: 1,
      playerStationaryMs: 2200
    });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 3200,
      enemiesAlive: 1,
      playerStationaryMs: 3400
    });

    expect(decision.state).toBe('PRESSURE');
    expect(decision.spawn).toBeNull();
    expect(decision.events.some((event) => event.type === 'PUNISH_STATIONARY')).toBe(true);
  });

  it('uses scene-filtered spawn points when provided', () => {
    const director = new GameDirector({ spawnCooldownMs: 0, config: { warningLeadMs: 0, ambushSpawnCooldownMs: 0 } });
    director.notifyZoneTrigger('gate-hall', 1000);
    const decision = director.update({
      ...baseInput,
      elapsedTime: 1500,
      activeZoneId: 'gate-hall',
      spawnPoints: [{ x: 9, y: 10, zoneId: 'gate-hall' }]
    });

    expect(decision.spawn).toMatchObject({ x: 9, y: 10 });
  });

  it('does not spend budget when no safe spawn points are available', () => {
    const director = new GameDirector({
      spawnCooldownMs: 0,
      config: { warningLeadMs: 0, stationaryPressureGraceMs: 0, highIntensitySpawnCooldownMs: 0 }
    });
    director.update({
      ...baseInput,
      elapsedTime: 1000,
      playerStationaryMs: 2200
    });
    director.update({
      ...baseInput,
      elapsedTime: 2000,
      playerStationaryMs: 3200
    });
    const budgetBefore = director.update({
      ...baseInput,
      elapsedTime: 2500,
      enemiesAlive: 1,
      playerStationaryMs: 3600
    }).debug.spawnBudgetRemaining;
    const decision = director.update({
      ...baseInput,
      elapsedTime: 3000,
      playerStationaryMs: 4200,
      spawnPoints: []
    });

    expect(decision.spawn).toBeNull();
    expect(decision.debug.lastDecisionReason).toBe('no safe spawn points');
    expect(decision.debug.spawnBudgetRemaining).toBe(budgetBefore);
  });

  it('dominance generates warning first and then pressure', () => {
    const director = new GameDirector({ config: { highIntensitySpawnCooldownMs: 0, warningLeadMs: 600 } });
    const warning = director.update({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 8,
      enemiesAlive: 1,
      timeSincePlayerDamagedMs: 20_000,
      equippedWeapons: ['SHOTGUN']
    });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 61_000,
      totalKills: 8,
      enemiesAlive: 1,
      timeSincePlayerDamagedMs: 21_000,
      equippedWeapons: ['SHOTGUN']
    });

    expect(warning.state).toBe('WARNING');
    expect(warning.events.some((event) => event.type === 'WARNING_MESSAGE')).toBe(true);
    expect(decision.state).toBe('PRESSURE');
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
    const director = new GameDirector({ config: { maxEnemiesAlive: 1, maxTotalSpawns: 3, warningLeadMs: 0 } });
    director.update({
      ...baseInput,
      elapsedTime: 1000,
      playerStationaryMs: 2200
    });
    const decision = director.update({
      ...baseInput,
      enemiesAlive: 1,
      elapsedTime: 2000,
      playerStationaryMs: 3200
    });

    expect(decision.maxEnemiesAlive).toBe(1);
    expect(decision.spawn).toBeNull();
    expect(decision.debug.spawnBudgetRemaining).toBe(3);
  });

  it('allows stronger enemies when the player has the launcher', () => {
    const director = new GameDirector({ spawnCooldownMs: 0, config: { warningLeadMs: 0 } });
    director.notifyZoneTrigger('test', 1000);
    director.update({ ...baseInput, elapsedTime: 1500, activeZoneId: 'test' });

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

  it('emits ambient pulse during calm windows without spawning', () => {
    const director = new GameDirector({ config: { ambientPulseCooldownMs: 1000 } });
    const decision = director.update({
      ...calmInput,
      elapsedTime: 1000
    });

    expect(decision.state).toBe('CALM');
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

    expect(recovered.state).toBe('CALM');
    expect(recovered.spawn).toBeNull();
  });

  it('caps pressure duration into recovery instead of looping forever', () => {
    const director = new GameDirector({ config: { highIntensityDurationMs: 1000, highIntensitySpawnCooldownMs: 0, warningLeadMs: 0 } });

    expect(
      director.update({
        ...baseInput,
        elapsedTime: 60_000,
        totalKills: 8,
        enemiesAlive: 1,
        timeSincePlayerDamagedMs: 20_000
      }).state
    ).toBe('PRESSURE');

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

  it('enters reinforcement pressure after buildup when few enemies remain mid-run', () => {
    const director = new GameDirector({
      spawnCooldownMs: 0,
      config: {
        warningLeadMs: 0,
        lowEnemyPressureThresholdMs: 3000,
        highIntensitySpawnCooldownMs: 400
      }
    });

    director.update({
      ...calmInput,
      elapsedTime: 1000,
      enemiesAlive: 2,
      totalKills: 2
    });

    const reinforced = director.update({
      ...calmInput,
      elapsedTime: 4500,
      enemiesAlive: 2,
      totalKills: 2
    });

    expect(reinforced.state).toBe('PRESSURE');
    expect(reinforced.spawn?.kind).toMatch(/GRUNT|STALKER/);
  });

  it('does not spawn low-enemy reinforcement while director recovery protects low health', () => {
    const director = new GameDirector({
      spawnCooldownMs: 0,
      config: { warningLeadMs: 0, lowEnemyPressureThresholdMs: 500 }
    });

    const decision = director.update({
      ...calmInput,
      elapsedTime: 6000,
      enemiesAlive: 1,
      totalKills: 3,
      p1Health: 28,
      p2Health: 28
    });

    expect(decision.state).toBe('RECOVERY');
    expect(decision.spawn).toBeNull();
  });

  it('consumes multiple spawn budget slots for encounter patterns during pressure', () => {
    const director = new GameDirector({
      spawnCooldownMs: 0,
      config: { warningLeadMs: 0, highIntensitySpawnCooldownMs: 0, maxEnemiesAlive: 6, maxTotalSpawns: 8 }
    });
    director.update({
      ...baseInput,
      elapsedTime: 60_000,
      totalKills: 8,
      enemiesAlive: 1,
      timeSincePlayerDamagedMs: 20_000
    });
    const decision = director.update({
      ...baseInput,
      elapsedTime: 61_000,
      totalKills: 8,
      enemiesAlive: 1,
      timeSincePlayerDamagedMs: 21_000,
      encounterPattern: {
        patternId: 'pincer',
        bindingId: 'test',
        cooldownMs: 9000,
        spawns: [
          { kind: 'GRUNT', x: 1, y: 1 },
          { kind: 'STALKER', x: 2, y: 2 }
        ]
      }
    });
    expect(decision.state).toBe('PRESSURE');
    expect(decision.spawn).not.toBeNull();
    expect(decision.extraSpawns).toHaveLength(1);
    expect(decision.events.some((e) => e.type === 'ENCOUNTER_PATTERN')).toBe(true);
    expect(decision.debug.spawnBudgetRemaining).toBe(5);
  });
});
