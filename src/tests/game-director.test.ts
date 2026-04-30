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
    expect(decision.spawn).toBeNull();
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
  });
});
