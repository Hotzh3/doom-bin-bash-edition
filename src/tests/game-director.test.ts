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
  });
});
