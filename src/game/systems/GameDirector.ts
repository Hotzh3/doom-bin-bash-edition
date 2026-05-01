import type { EnemyKind } from '../types/game';
import { DEFAULT_DIRECTOR_CONFIG, type DirectorConfig } from './DirectorConfig';
import type { DirectorEvent } from './DirectorEvents';
import type { DirectorDebugInfo, DirectorState } from './DirectorState';
import type { WeaponKind } from './WeaponTypes';

export interface GameDirectorInput {
  elapsedTime: number;
  totalKills: number;
  enemiesAlive: number;
  p1Health: number;
  p2Health: number;
  p1Alive: boolean;
  p2Alive: boolean;
  currentWave: number;
  timeSincePlayerDamagedMs?: number;
  playerStationaryMs?: number;
  equippedWeapons?: WeaponKind[];
  activeZoneId?: string | null;
  activatedTriggerCount?: number;
  distanceToImportantPickup?: number | null;
  spawnPoints?: SpawnPoint[];
}

export interface SpawnPoint {
  x: number;
  y: number;
  zoneId?: string;
}

export interface SpawnRequest extends SpawnPoint {
  kind: EnemyKind;
}

export interface GameDirectorDecision {
  intensity: number;
  state: DirectorState;
  maxEnemiesAlive: number;
  spawn: SpawnRequest | null;
  events: DirectorEvent[];
  debug: DirectorDebugInfo;
}

interface GameDirectorOptions {
  config?: Partial<DirectorConfig>;
  maxEnemiesAlive?: number;
  maxTotalSpawns?: number;
  spawnCooldownMs?: number;
  openingSpawnCount?: number;
  spawnPoints?: SpawnPoint[];
  debugEnabled?: boolean;
}

const DEFAULT_SPAWN_POINTS: SpawnPoint[] = [
  { x: 480, y: 92 },
  { x: 92, y: 280 },
  { x: 868, y: 280 },
  { x: 480, y: 508 }
];

export class GameDirector {
  private readonly config: DirectorConfig;
  private readonly spawnPoints: SpawnPoint[];
  private spawnedCount = 0;
  private lastSpawnAt = Number.NEGATIVE_INFINITY;
  private nextSpawnPointIndex = 0;
  private state: DirectorState = 'EXPLORATION';
  private stateEnteredAt = 0;
  private lastTotalKills = 0;
  private lastKillAt = Number.NEGATIVE_INFINITY;
  private pendingZoneAmbushId: string | null = null;
  private lastDecisionReason = 'director initialized';
  private readonly queuedEvents: DirectorEvent[] = [];
  private lastAmbientPulseAt = Number.NEGATIVE_INFINITY;
  private lastWarningMessageAt = Number.NEGATIVE_INFINITY;
  private lastStationaryPunishAt = Number.NEGATIVE_INFINITY;

  constructor(options: GameDirectorOptions = {}) {
    this.config = {
      ...DEFAULT_DIRECTOR_CONFIG,
      ...options.config,
      maxEnemiesAlive: options.maxEnemiesAlive ?? options.config?.maxEnemiesAlive ?? DEFAULT_DIRECTOR_CONFIG.maxEnemiesAlive,
      maxTotalSpawns: options.maxTotalSpawns ?? options.config?.maxTotalSpawns ?? DEFAULT_DIRECTOR_CONFIG.maxTotalSpawns,
      openingSpawnCount: options.openingSpawnCount ?? options.config?.openingSpawnCount ?? DEFAULT_DIRECTOR_CONFIG.openingSpawnCount,
      baseSpawnCooldownMs: options.spawnCooldownMs ?? options.config?.baseSpawnCooldownMs ?? DEFAULT_DIRECTOR_CONFIG.baseSpawnCooldownMs,
      debugEnabled: options.debugEnabled ?? options.config?.debugEnabled ?? DEFAULT_DIRECTOR_CONFIG.debugEnabled
    };
    this.spawnPoints = options.spawnPoints ?? DEFAULT_SPAWN_POINTS;
  }

  createOpeningSpawns(): SpawnRequest[] {
    const spawnCount = Math.min(this.config.openingSpawnCount, this.config.maxTotalSpawns);
    const spawns = Array.from({ length: spawnCount }, () => this.createSpawnRequest('GRUNT'));
    this.lastSpawnAt = 0;
    return spawns;
  }

  update(input: GameDirectorInput): GameDirectorDecision {
    this.observeKills(input);
    const intensity = this.calculateIntensity(input);
    const previousState = this.state;
    this.updateState(input, intensity);

    if (!this.canSpawn(input)) {
      return this.createDecision(input, intensity, null, previousState);
    }

    const kind = this.selectEnemyKind(input, intensity);
    this.lastSpawnAt = input.elapsedTime;
    this.lastDecisionReason = `spawn ${kind} during ${this.state}`;
    return this.createDecision(input, intensity, this.createSpawnRequest(kind, input.spawnPoints), previousState);
  }

  hasExhaustedSpawnBudget(): boolean {
    return this.spawnedCount >= this.config.maxTotalSpawns;
  }

  notifyZoneTrigger(triggerId: string, time: number): void {
    this.pendingZoneAmbushId = triggerId;
    this.enterState('AMBUSH', time, `trigger ${triggerId}`);
    this.queuedEvents.push({
      type: 'PREPARE_AMBUSH',
      state: 'AMBUSH',
      message: `Ambush protocol primed: ${triggerId}`,
      time
    });
  }

  getState(): DirectorState {
    return this.state;
  }

  calculateIntensity(input: GameDirectorInput): number {
    if (!input.p1Alive && !input.p2Alive) return 0;

    let intensity = 1;
    if (input.elapsedTime >= 30_000) intensity += 1;
    if (input.elapsedTime >= 60_000) intensity += 1;
    if (input.totalKills >= 3) intensity += 1;
    if (input.totalKills >= 6) intensity += 1;
    intensity += Math.max(0, input.currentWave - 1);

    if (input.p1Alive && input.p2Alive && input.p1Health >= this.config.comfortableHealthThreshold && input.p2Health >= this.config.comfortableHealthThreshold) {
      intensity += 1;
    }

    if ((input.timeSincePlayerDamagedMs ?? 0) >= this.config.dominanceNoDamageMs) intensity += 1;
    if (
      (input.equippedWeapons?.includes('SHOTGUN') || input.equippedWeapons?.includes('LAUNCHER')) &&
      (input.timeSincePlayerDamagedMs ?? 0) >= this.config.dominanceNoDamageMs
    ) {
      intensity += 1;
    }
    if ((input.playerStationaryMs ?? 0) >= this.config.idlePressureMs) intensity += 1;
    if (input.activeZoneId) intensity += 1;
    if ((input.distanceToImportantPickup ?? 0) >= 5 && input.elapsedTime >= this.config.buildUpAfterMs) intensity += 1;

    if (!input.p1Alive || !input.p2Alive) intensity -= 2;

    const livingHealth = [input.p1Alive ? input.p1Health : null, input.p2Alive ? input.p2Health : null].filter(
      (health): health is number => health !== null
    );
    const averageHealth =
      livingHealth.length > 0 ? livingHealth.reduce((total, health) => total + health, 0) / livingHealth.length : 0;

    if (averageHealth <= this.config.lowHealthThreshold) intensity -= 2;
    else if (averageHealth <= this.config.comfortableHealthThreshold) intensity -= 1;

    return this.clampIntensity(intensity);
  }

  selectEnemyKind(input: GameDirectorInput, intensity = this.calculateIntensity(input)): EnemyKind {
    const progressScore = Math.floor(input.elapsedTime / 20_000) + input.totalKills + input.currentWave;
    if ((input.playerStationaryMs ?? 0) >= this.config.idlePressureMs) return 'STALKER';
    if (this.state === 'AMBUSH') return input.totalKills % 2 === 0 ? 'STALKER' : 'RANGED';
    if (this.state === 'HIGH_INTENSITY' && input.equippedWeapons?.includes('LAUNCHER')) return 'BRUTE';
    if (this.state === 'HIGH_INTENSITY' && input.equippedWeapons?.includes('SHOTGUN')) return 'RANGED';
    if (this.state === 'BUILD_UP') return input.totalKills % 2 === 0 ? 'GRUNT' : 'RANGED';
    if (intensity <= 1 || progressScore < 4) return 'GRUNT';
    if (intensity >= 3 && progressScore >= 7 && input.totalKills % 3 === 1) return 'RANGED';
    if (intensity >= 4 && progressScore >= 8) return input.totalKills % 2 === 0 ? 'BRUTE' : 'STALKER';
    if (progressScore >= 6) return 'BRUTE';
    return 'STALKER';
  }

  private canSpawn(input: GameDirectorInput): boolean {
    const cooldown = this.getCurrentSpawnCooldownMs();
    if (!input.p1Alive && !input.p2Alive) return false;
    if (this.state === 'EXPLORATION' || this.state === 'RECOVERY') {
      this.lastDecisionReason = `${this.state.toLowerCase()} pause`;
      return false;
    }
    if (input.enemiesAlive >= this.config.maxEnemiesAlive) {
      this.lastDecisionReason = 'enemy cap reached';
      return false;
    }
    if (this.spawnedCount >= this.config.maxTotalSpawns) {
      this.lastDecisionReason = 'spawn budget exhausted';
      return false;
    }
    if (input.elapsedTime - this.lastSpawnAt < cooldown) {
      this.lastDecisionReason = 'spawn cooldown';
      return false;
    }
    return true;
  }

  private createSpawnRequest(kind: EnemyKind, spawnPoints?: SpawnPoint[]): SpawnRequest {
    const point = this.getNextSpawnPoint(spawnPoints);
    this.spawnedCount += 1;
    return { kind, x: point.x, y: point.y };
  }

  private getNextSpawnPoint(spawnPoints = this.spawnPoints): SpawnPoint {
    const points = spawnPoints.length > 0 ? spawnPoints : this.spawnPoints;
    const point = points[this.nextSpawnPointIndex % points.length];
    this.nextSpawnPointIndex += 1;
    return point;
  }

  private clampIntensity(value: number): number {
    return Math.max(0, Math.min(5, value));
  }

  private observeKills(input: GameDirectorInput): void {
    if (input.totalKills > this.lastTotalKills) {
      this.lastKillAt = input.elapsedTime;
      this.lastTotalKills = input.totalKills;
    }
  }

  private updateState(input: GameDirectorInput, intensity: number): void {
    const averageHealth = this.getAverageLivingHealth(input);
    if (averageHealth > 0 && averageHealth <= this.config.lowHealthThreshold) {
      this.enterState('RECOVERY', input.elapsedTime, 'players low health');
      return;
    }

    if (this.state === 'AMBUSH' && input.elapsedTime - this.stateEnteredAt >= this.config.ambushDurationMs) {
      this.enterState('HIGH_INTENSITY', input.elapsedTime, 'ambush matured');
      return;
    }

    if (this.state === 'HIGH_INTENSITY' && input.enemiesAlive === 0 && input.elapsedTime - this.lastKillAt < 2500) {
      this.enterState('RECOVERY', input.elapsedTime, 'combat cleared');
      return;
    }

    if (this.state === 'HIGH_INTENSITY' && input.elapsedTime - this.stateEnteredAt >= this.config.highIntensityDurationMs) {
      this.enterState('RECOVERY', input.elapsedTime, 'surge spent');
      return;
    }

    if (this.state === 'RECOVERY') {
      if (input.elapsedTime - this.stateEnteredAt < this.config.recoveryDurationMs) return;
      this.enterState('EXPLORATION', input.elapsedTime, 'recovery complete');
    }

    if (this.pendingZoneAmbushId) {
      this.pendingZoneAmbushId = null;
      this.enterState('AMBUSH', input.elapsedTime, 'zone trigger');
      return;
    }

    if ((input.playerStationaryMs ?? 0) >= this.config.idlePressureMs) {
      this.enterState('BUILD_UP', input.elapsedTime, 'player stationary');
      return;
    }

    if (intensity >= 4 && input.enemiesAlive <= 2) {
      this.enterState('HIGH_INTENSITY', input.elapsedTime, 'player dominating');
      return;
    }

    if (this.state === 'EXPLORATION' && input.elapsedTime - this.stateEnteredAt >= this.config.buildUpAfterMs) {
      this.enterState('BUILD_UP', input.elapsedTime, 'exploration timer');
      return;
    }

    if (this.state === 'BUILD_UP' && intensity >= 3 && input.enemiesAlive <= 2) {
      this.enterState('HIGH_INTENSITY', input.elapsedTime, 'pressure escalated');
    }
  }

  private enterState(nextState: DirectorState, time: number, reason: string): void {
    if (this.state === nextState) {
      this.lastDecisionReason = reason;
      return;
    }

    this.state = nextState;
    this.stateEnteredAt = time;
    this.lastDecisionReason = reason;
  }

  private getCurrentSpawnCooldownMs(): number {
    if (this.state === 'AMBUSH') return this.config.ambushSpawnCooldownMs;
    if (this.state === 'HIGH_INTENSITY') return this.config.highIntensitySpawnCooldownMs;
    if (this.state === 'BUILD_UP') return this.config.buildUpSpawnCooldownMs;
    return this.config.baseSpawnCooldownMs;
  }

  private getAverageLivingHealth(input: GameDirectorInput): number {
    const livingHealth = [input.p1Alive ? input.p1Health : null, input.p2Alive ? input.p2Health : null].filter(
      (health): health is number => health !== null
    );
    return livingHealth.length > 0 ? livingHealth.reduce((total, health) => total + health, 0) / livingHealth.length : 0;
  }

  private createDecision(
    input: GameDirectorInput,
    intensity: number,
    spawn: SpawnRequest | null,
    previousState: DirectorState
  ): GameDirectorDecision {
    const events = this.collectEvents(input, intensity, spawn, previousState);
    return {
      intensity,
      state: this.state,
      maxEnemiesAlive: this.config.maxEnemiesAlive,
      spawn,
      events,
      debug: {
        enabled: this.config.debugEnabled,
        state: this.state,
        intensity,
        enemiesAlive: input.enemiesAlive,
        maxEnemiesAlive: this.config.maxEnemiesAlive,
        spawnCooldownRemainingMs: Math.max(0, this.getCurrentSpawnCooldownMs() - (input.elapsedTime - this.lastSpawnAt)),
        lastDecisionReason: this.config.debugEnabled ? this.lastDecisionReason : 'debug disabled',
        spawnBudgetRemaining: Math.max(0, this.config.maxTotalSpawns - this.spawnedCount)
      }
    };
  }

  private collectEvents(
    input: GameDirectorInput,
    intensity: number,
    spawn: SpawnRequest | null,
    previousState: DirectorState
  ): DirectorEvent[] {
    const events = this.queuedEvents.splice(0);
    const time = input.elapsedTime;

    if (this.state === 'EXPLORATION' && time - this.lastAmbientPulseAt >= this.config.ambientPulseCooldownMs) {
      this.lastAmbientPulseAt = time;
      events.push({
        type: 'AMBIENT_PULSE',
        state: this.state,
        message: 'Quiet systems breathing',
        time
      });
    }

    if (previousState !== this.state && this.state === 'RECOVERY') {
      events.push({
        type: 'RECOVERY_SIGNAL',
        state: this.state,
        message: 'Pressure receding',
        time
      });
    }

    if (
      (this.state === 'BUILD_UP' || this.state === 'HIGH_INTENSITY') &&
      time - this.lastWarningMessageAt >= this.config.warningMessageCooldownMs
    ) {
      this.lastWarningMessageAt = time;
      events.push({
        type: 'WARNING_MESSAGE',
        state: this.state,
        message: intensity >= 4 ? 'Pressure spike rising' : 'Tension building',
        time
      });
    }

    if (
      (input.playerStationaryMs ?? 0) >= this.config.idlePressureMs &&
      time - this.lastStationaryPunishAt >= this.config.stationaryPunishCooldownMs
    ) {
      this.lastStationaryPunishAt = time;
      events.push({
        type: 'PUNISH_STATIONARY',
        state: this.state,
        message: 'Motion required',
        time,
        spawnKind: 'STALKER'
      });
    }

    if (spawn) {
      events.push({
        type: 'SPAWN_PRESSURE',
        state: this.state,
        message: `Pressure spawn: ${spawn.kind}`,
        time,
        spawnKind: spawn.kind
      });
    }

    return events;
  }
}
