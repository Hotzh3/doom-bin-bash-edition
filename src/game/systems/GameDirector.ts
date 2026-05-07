import type { EnemyKind } from '../types/game';
import { DEFAULT_DIRECTOR_CONFIG, type DirectorConfig } from './DirectorConfig';
import type { DirectorEvent } from './DirectorEvents';
import { shouldMatureWarning, updateAntiCampState, type AntiCampState, type DirectorPressureCause } from './DirectorPacing';
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
  private state: DirectorState = 'CALM';
  private stateEnteredAt = 0;
  private lastUpdatedAt = 0;
  private lastTotalKills = 0;
  private lastKillAt = Number.NEGATIVE_INFINITY;
  private pendingZoneAmbushId: string | null = null;
  private pendingPressureCause: DirectorPressureCause = 'none';
  private lastDecisionReason = 'director initialized';
  private readonly queuedEvents: DirectorEvent[] = [];
  private lastAmbientPulseAt = Number.NEGATIVE_INFINITY;
  private lastWarningMessageAt = Number.NEGATIVE_INFINITY;
  private lastStationaryPunishAt = Number.NEGATIVE_INFINITY;
  private antiCamp: AntiCampState = { meterMs: 0, phase: 'none' };
  private lowEnemyPressureAccumMs = 0;
  private lastEnemiesAliveSnapshot = 0;

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
    const spawns = Array.from({ length: spawnCount }, () => this.createSpawnRequest('GRUNT')).filter(
      (spawn): spawn is SpawnRequest => spawn !== null
    );
    if (spawns.length > 0) this.lastSpawnAt = 0;
    return spawns;
  }

  update(input: GameDirectorInput): GameDirectorDecision {
    this.observeKills(input);
    this.lastEnemiesAliveSnapshot = input.enemiesAlive;
    const intensity = this.calculateIntensity(input);
    const previousState = this.state;
    this.updateState(input, intensity);

    if (!this.canSpawn(input)) {
      return this.createDecision(input, intensity, null, previousState);
    }

    const kind = this.selectEnemyKind(input, intensity);
    const spawn = this.createSpawnRequest(kind, input.spawnPoints);
    if (!spawn) {
      this.lastDecisionReason = 'no safe spawn points';
      return this.createDecision(input, intensity, null, previousState);
    }
    this.lastSpawnAt = input.elapsedTime;
    this.lastDecisionReason = `spawn ${kind} during ${this.state}`;
    return this.createDecision(input, intensity, spawn, previousState);
  }

  hasExhaustedSpawnBudget(): boolean {
    return this.spawnedCount >= this.config.maxTotalSpawns;
  }

  notifyZoneTrigger(triggerId: string, time: number): void {
    this.pendingZoneAmbushId = triggerId;
    this.pendingPressureCause = 'zone-ambush';
    this.enterState('WARNING', time, `trigger ${triggerId}`);
    this.queuedEvents.push({
      type: 'PREPARE_AMBUSH',
      state: 'WARNING',
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
    if (this.pendingPressureCause === 'low-enemy-count') return input.totalKills % 3 === 0 ? 'GRUNT' : 'STALKER';
    if (this.pendingPressureCause === 'anti-camp' || this.antiCamp.phase === 'pressure') return 'STALKER';
    if (this.state === 'AMBUSH') return input.totalKills % 2 === 0 ? 'STALKER' : 'RANGED';
    if (this.state === 'PRESSURE' && input.equippedWeapons?.includes('LAUNCHER')) return 'BRUTE';
    if (this.state === 'PRESSURE' && input.equippedWeapons?.includes('SHOTGUN')) return 'RANGED';
    if (this.state === 'WARNING' || this.state === 'WATCHING') return input.totalKills % 2 === 0 ? 'GRUNT' : 'RANGED';
    if (intensity <= 1 || progressScore < 4) return 'GRUNT';
    if (intensity >= 3 && progressScore >= 7 && input.totalKills % 3 === 1) return 'RANGED';
    if (intensity >= 4 && progressScore >= 8) return input.totalKills % 2 === 0 ? 'BRUTE' : 'STALKER';
    if (progressScore >= 6) return 'BRUTE';
    return 'STALKER';
  }

  private canSpawn(input: GameDirectorInput): boolean {
    const cooldown = this.getCurrentSpawnCooldownMs();
    if (!input.p1Alive && !input.p2Alive) return false;
    if (this.state === 'CALM' || this.state === 'WATCHING' || this.state === 'WARNING' || this.state === 'RECOVERY') {
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

  private createSpawnRequest(kind: EnemyKind, spawnPoints?: SpawnPoint[]): SpawnRequest | null {
    if (spawnPoints && spawnPoints.length === 0) return null;
    const point = this.getNextSpawnPoint(spawnPoints);
    if (!point) return null;
    this.spawnedCount += 1;
    return { kind, x: point.x, y: point.y };
  }

  private getNextSpawnPoint(spawnPoints = this.spawnPoints): SpawnPoint | null {
    const points = spawnPoints.length > 0 ? spawnPoints : this.spawnPoints;
    if (points.length === 0) return null;
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
    const deltaMs = Math.max(0, input.elapsedTime - this.lastUpdatedAt);
    this.lastUpdatedAt = input.elapsedTime;
    this.antiCamp = updateAntiCampState(
      this.antiCamp,
      {
        stationaryMs: input.playerStationaryMs ?? 0,
        deltaMs,
        recentKill: input.elapsedTime - this.lastKillAt <= 2500
      },
      this.config
    );

    const averageHealth = this.getAverageLivingHealth(input);
    if (averageHealth > 0 && averageHealth <= this.config.lowHealthThreshold) {
      this.enterState('RECOVERY', input.elapsedTime, 'players low health');
      this.pendingPressureCause = 'none';
      return;
    }

    if (this.state === 'RECOVERY') {
      if (input.elapsedTime - this.stateEnteredAt < this.config.recoveryDurationMs) return;
      this.enterState('CALM', input.elapsedTime, 'recovery complete');
      return;
    }

    if (this.state === 'AMBUSH' && input.elapsedTime - this.stateEnteredAt >= this.config.ambushDurationMs) {
      this.pendingPressureCause = 'none';
      this.enterState('PRESSURE', input.elapsedTime, 'ambush matured');
      return;
    }

    if (this.state === 'PRESSURE' && input.enemiesAlive === 0 && input.elapsedTime - this.lastKillAt < 2500) {
      const reinforceEmptyArena =
        !this.hasExhaustedSpawnBudget() &&
        (this.pendingPressureCause === 'low-enemy-count' ||
          this.lowEnemyPressureAccumMs >= this.config.lowEnemyPressureThresholdMs * 0.42);
      if (!reinforceEmptyArena) {
        this.pendingPressureCause = 'none';
        this.enterState('RECOVERY', input.elapsedTime, 'combat cleared');
        return;
      }
    }

    if (this.state === 'PRESSURE' && input.elapsedTime - this.stateEnteredAt >= this.config.highIntensityDurationMs) {
      if (
        input.enemiesAlive <= 2 &&
        !this.hasExhaustedSpawnBudget() &&
        this.lowEnemyPressureAccumMs >= this.config.lowEnemyPressureThresholdMs * 0.35
      ) {
        this.stateEnteredAt = input.elapsedTime;
        this.lastDecisionReason = 'reinforcement surge extended';
        return;
      }
      this.pendingPressureCause = 'none';
      this.enterState('RECOVERY', input.elapsedTime, 'surge spent');
      return;
    }

    if (this.pendingZoneAmbushId) {
      this.pendingPressureCause = 'zone-ambush';
      this.enterState('WARNING', input.elapsedTime, `ambush warning ${this.pendingZoneAmbushId}`);
      if (shouldMatureWarning(this.pendingPressureCause, this.stateEnteredAt, input.elapsedTime, this.config, this.antiCamp)) {
        this.pendingZoneAmbushId = null;
        this.enterState('AMBUSH', input.elapsedTime, 'zone trigger');
      }
      return;
    }

    if (this.pendingPressureCause === 'anti-camp' && this.antiCamp.phase === 'none' && this.state === 'WARNING') {
      this.pendingPressureCause = 'none';
      this.enterState('WATCHING', input.elapsedTime, 'movement restored');
      return;
    }

    if (this.antiCamp.phase === 'pressure' || this.pendingPressureCause === 'anti-camp') {
      this.pendingPressureCause = 'anti-camp';
      if (this.state !== 'WARNING') this.enterState('WARNING', input.elapsedTime, 'movement warning');
      if (shouldMatureWarning(this.pendingPressureCause, this.stateEnteredAt, input.elapsedTime, this.config, this.antiCamp)) {
        this.enterState('PRESSURE', input.elapsedTime, 'stationary pressure');
      }
      return;
    }

    if (intensity >= 4 && input.enemiesAlive <= 2) {
      this.pendingPressureCause = 'dominance';
      if (this.state !== 'WARNING') this.enterState('WARNING', input.elapsedTime, 'pressure spike telegraphed');
      if (shouldMatureWarning(this.pendingPressureCause, this.stateEnteredAt, input.elapsedTime, this.config, this.antiCamp)) {
        this.enterState('PRESSURE', input.elapsedTime, 'player dominating');
      }
      return;
    }

    if (this.pendingPressureCause === 'dominance' && intensity < 4) {
      this.pendingPressureCause = 'none';
    }

    const softMercy =
      averageHealth > this.config.lowHealthThreshold && averageHealth < this.config.comfortableHealthThreshold * 0.72;
    const accumScale = softMercy ? 0.38 : 1;
    const lowEnemyPressureEligible =
      input.totalKills >= 1 ||
      input.elapsedTime >= 11_000 ||
      (input.enemiesAlive > 0 && input.enemiesAlive <= 2);
    if (lowEnemyPressureEligible && input.enemiesAlive <= 2 && (input.p1Alive || input.p2Alive)) {
      const burst = input.enemiesAlive === 0 ? 2.85 : 1;
      this.lowEnemyPressureAccumMs += deltaMs * burst * accumScale;
    } else if (input.enemiesAlive >= 4) {
      this.lowEnemyPressureAccumMs = Math.max(0, this.lowEnemyPressureAccumMs - deltaMs * 1.85);
    }

    if (
      input.enemiesAlive <= 2 &&
      this.lowEnemyPressureAccumMs >= this.config.lowEnemyPressureThresholdMs &&
      !this.hasExhaustedSpawnBudget()
    ) {
      this.pendingPressureCause = 'low-enemy-count';
      if (this.state !== 'PRESSURE' && this.state !== 'AMBUSH') {
        if (this.state !== 'WARNING') this.enterState('WARNING', input.elapsedTime, 'hostile count low');
        if (shouldMatureWarning(this.pendingPressureCause, this.stateEnteredAt, input.elapsedTime, this.config, this.antiCamp)) {
          this.enterState('PRESSURE', input.elapsedTime, 'reinforcement surge');
        }
      }
      return;
    }

    if (this.pendingPressureCause === 'low-enemy-count' && (input.enemiesAlive >= 4 || this.hasExhaustedSpawnBudget())) {
      this.pendingPressureCause = 'none';
    }

    if (
      this.antiCamp.phase === 'watching' ||
      input.activeZoneId ||
      input.elapsedTime - this.stateEnteredAt >= this.config.buildUpAfterMs ||
      intensity >= 2
    ) {
      this.enterState('WATCHING', input.elapsedTime, this.antiCamp.phase === 'watching' ? 'movement watched' : 'system watching');
      return;
    }

    this.pendingPressureCause = 'none';
    this.enterState('CALM', input.elapsedTime, 'calm window');
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
    let ms: number;
    if (this.state === 'AMBUSH') ms = this.config.ambushSpawnCooldownMs;
    else if (this.state === 'PRESSURE') ms = this.config.highIntensitySpawnCooldownMs;
    else if (this.state === 'WATCHING' || this.state === 'WARNING') ms = this.config.buildUpSpawnCooldownMs;
    else ms = this.config.baseSpawnCooldownMs;

    if (
      this.lastEnemiesAliveSnapshot <= 2 &&
      this.lowEnemyPressureAccumMs > 1400 &&
      (this.state === 'PRESSURE' || this.pendingPressureCause === 'low-enemy-count')
    ) {
      const ramp = 1 - 0.44 * Math.min(1, this.lowEnemyPressureAccumMs / 52_000);
      ms = Math.round(ms * ramp);
    }
    return Math.max(450, ms);
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
        spawnBudgetRemaining: Math.max(0, this.config.maxTotalSpawns - this.spawnedCount),
        antiCampMeterMs: Math.round(this.antiCamp.meterMs)
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

    if (this.state === 'CALM' && time - this.lastAmbientPulseAt >= this.config.ambientPulseCooldownMs) {
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

    if (this.state === 'WARNING' && time - this.lastWarningMessageAt >= this.config.warningMessageCooldownMs) {
      this.lastWarningMessageAt = time;
      events.push({
        type: 'WARNING_MESSAGE',
        state: this.state,
        message: this.getWarningMessage(intensity),
        time
      });
    }

    if (
      this.pendingPressureCause === 'anti-camp' &&
      this.state === 'PRESSURE' &&
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

  private getWarningMessage(intensity: number): string {
    if (this.pendingPressureCause === 'zone-ambush') return 'Ambush signatures rising';
    if (this.pendingPressureCause === 'anti-camp') return 'Motion detected. Keep moving';
    if (this.pendingPressureCause === 'dominance') return intensity >= 4 ? 'Pressure spike incoming' : 'Hostiles repositioning';
    if (this.pendingPressureCause === 'low-enemy-count') return 'Residual signals converging';
    return 'System attention rising';
  }
}
