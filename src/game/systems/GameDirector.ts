import type { EnemyKind } from '../types/game';

export interface GameDirectorInput {
  elapsedTime: number;
  totalKills: number;
  enemiesAlive: number;
  p1Health: number;
  p2Health: number;
  p1Alive: boolean;
  p2Alive: boolean;
  currentWave: number;
}

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface SpawnRequest extends SpawnPoint {
  kind: EnemyKind;
}

export interface GameDirectorDecision {
  intensity: number;
  maxEnemiesAlive: number;
  spawn: SpawnRequest | null;
}

interface GameDirectorOptions {
  maxEnemiesAlive?: number;
  maxTotalSpawns?: number;
  spawnCooldownMs?: number;
  openingSpawnCount?: number;
  spawnPoints?: SpawnPoint[];
}

const DEFAULT_SPAWN_POINTS: SpawnPoint[] = [
  { x: 480, y: 92 },
  { x: 92, y: 280 },
  { x: 868, y: 280 },
  { x: 480, y: 508 }
];

export class GameDirector {
  private readonly maxEnemiesAlive: number;
  private readonly maxTotalSpawns: number;
  private readonly spawnCooldownMs: number;
  private readonly openingSpawnCount: number;
  private readonly spawnPoints: SpawnPoint[];
  private spawnedCount = 0;
  private lastSpawnAt = Number.NEGATIVE_INFINITY;
  private nextSpawnPointIndex = 0;

  constructor(options: GameDirectorOptions = {}) {
    this.maxEnemiesAlive = options.maxEnemiesAlive ?? 4;
    this.maxTotalSpawns = options.maxTotalSpawns ?? 9;
    this.spawnCooldownMs = options.spawnCooldownMs ?? 4500;
    this.openingSpawnCount = options.openingSpawnCount ?? 2;
    this.spawnPoints = options.spawnPoints ?? DEFAULT_SPAWN_POINTS;
  }

  createOpeningSpawns(): SpawnRequest[] {
    const spawnCount = Math.min(this.openingSpawnCount, this.maxTotalSpawns);
    const spawns = Array.from({ length: spawnCount }, () => this.createSpawnRequest('GRUNT'));
    this.lastSpawnAt = 0;
    return spawns;
  }

  update(input: GameDirectorInput): GameDirectorDecision {
    const intensity = this.calculateIntensity(input);
    if (!this.canSpawn(input)) {
      return { intensity, maxEnemiesAlive: this.maxEnemiesAlive, spawn: null };
    }

    const kind = this.selectEnemyKind(input, intensity);
    this.lastSpawnAt = input.elapsedTime;
    return {
      intensity,
      maxEnemiesAlive: this.maxEnemiesAlive,
      spawn: this.createSpawnRequest(kind)
    };
  }

  hasExhaustedSpawnBudget(): boolean {
    return this.spawnedCount >= this.maxTotalSpawns;
  }

  calculateIntensity(input: GameDirectorInput): number {
    if (!input.p1Alive && !input.p2Alive) return 0;

    let intensity = 1;
    if (input.elapsedTime >= 30_000) intensity += 1;
    if (input.elapsedTime >= 60_000) intensity += 1;
    if (input.totalKills >= 3) intensity += 1;
    if (input.totalKills >= 6) intensity += 1;
    intensity += Math.max(0, input.currentWave - 1);

    if (input.p1Alive && input.p2Alive && input.p1Health >= 70 && input.p2Health >= 70) {
      intensity += 1;
    }

    if (!input.p1Alive || !input.p2Alive) intensity -= 2;

    const livingHealth = [input.p1Alive ? input.p1Health : null, input.p2Alive ? input.p2Health : null].filter(
      (health): health is number => health !== null
    );
    const averageHealth =
      livingHealth.length > 0 ? livingHealth.reduce((total, health) => total + health, 0) / livingHealth.length : 0;

    if (averageHealth <= 35) intensity -= 2;
    else if (averageHealth <= 55) intensity -= 1;

    return this.clampIntensity(intensity);
  }

  selectEnemyKind(input: GameDirectorInput, intensity = this.calculateIntensity(input)): EnemyKind {
    const progressScore = Math.floor(input.elapsedTime / 20_000) + input.totalKills + input.currentWave;
    if (intensity <= 1 || progressScore < 4) return 'GRUNT';
    if (intensity >= 4 && progressScore >= 8) return input.totalKills % 2 === 0 ? 'BRUTE' : 'STALKER';
    if (progressScore >= 6) return 'BRUTE';
    return 'STALKER';
  }

  private canSpawn(input: GameDirectorInput): boolean {
    if (!input.p1Alive && !input.p2Alive) return false;
    if (input.enemiesAlive >= this.maxEnemiesAlive) return false;
    if (this.spawnedCount >= this.maxTotalSpawns) return false;
    return input.elapsedTime - this.lastSpawnAt >= this.spawnCooldownMs;
  }

  private createSpawnRequest(kind: EnemyKind): SpawnRequest {
    const point = this.getNextSpawnPoint();
    this.spawnedCount += 1;
    return { kind, x: point.x, y: point.y };
  }

  private getNextSpawnPoint(): SpawnPoint {
    const point = this.spawnPoints[this.nextSpawnPointIndex % this.spawnPoints.length];
    this.nextSpawnPointIndex += 1;
    return point;
  }

  private clampIntensity(value: number): number {
    return Math.max(0, Math.min(5, value));
  }
}
