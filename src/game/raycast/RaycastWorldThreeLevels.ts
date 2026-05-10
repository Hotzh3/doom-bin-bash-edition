/**
 * World 3 — Ember Meridian (Phase 34). Third authored hell beneath World 2 finale.
 */
import {
  RAYCAST_MAP_BOSS,
  RAYCAST_MAP_LEVEL_1,
  RAYCAST_MAP_LEVEL_5,
  RAYCAST_PLAYER_START_BOSS,
  RAYCAST_PLAYER_START_LEVEL_1,
  RAYCAST_PLAYER_START_LEVEL_5
} from './RaycastMap';
import type { RaycastLevel } from './RaycastLevel';

const FRACTURE_DIRECTOR = {
  enabled: true as const,
  config: {
    maxEnemiesAlive: 5,
    maxTotalSpawns: 11,
    openingSpawnCount: 0,
    baseSpawnCooldownMs: 4600,
    buildUpSpawnCooldownMs: 3500,
    ambushSpawnCooldownMs: 1880,
    highIntensitySpawnCooldownMs: 3050,
    recoveryDurationMs: 5400,
    ambushDurationMs: 6400,
    highIntensityDurationMs: 9200,
    buildUpAfterMs: 5600,
    idlePressureMs: 1580,
    dominanceNoDamageMs: 8000,
    lowHealthThreshold: 34,
    comfortableHealthThreshold: 64,
    debugEnabled: false
  },
  spawnPoints: [
    { id: 'm-start', zoneId: 'm-start', x: 3.5, y: 11.5, minPlayerDistance: 2.0 },
    { id: 'm-hall', zoneId: 'm-hall', x: 10.5, y: 9.5, minPlayerDistance: 1.9 },
    { id: 'm-arena', zoneId: 'm-arena', x: 14.5, y: 11.5, minPlayerDistance: 2.1 },
    { id: 'm-east', zoneId: 'm-east', x: 22.5, y: 10.5, minPlayerDistance: 2.0 },
    { id: 'm-drain', zoneId: 'm-drain', x: 10.5, y: 14.5, minPlayerDistance: 2.0 }
  ]
};

/** Approach slice — Cinder Annex geometry with Ember Meridian dressing + SCRAMBLER teaches. */
export const RAYCAST_LEVEL_WORLD3_EMBER_RAMP: RaycastLevel = {
  id: 'meridian-ember-ramp',
  name: 'Ember Meridian — Cinder Ramp',
  episodeTheme: 'meridian-ramp',
  worldSegment: 'world3',
  map: RAYCAST_MAP_LEVEL_1,
  playerStart: RAYCAST_PLAYER_START_LEVEL_1,
  zones: [
    { id: 'm-start', x: 2.5, y: 12.3, width: 3.2, height: 1.4, visualTheme: 'ash-conduit' },
    { id: 'm-hall', x: 3.0, y: 9.2, width: 4.8, height: 5.2, visualTheme: 'ember-vault' },
    { id: 'm-key', x: 4.5, y: 3.8, width: 3.4, height: 2.8, visualTheme: 'ash-conduit', landmark: 'key' },
    { id: 'm-gate', x: 8.0, y: 7.5, width: 2.0, height: 1.8, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'm-arena', x: 14.8, y: 9.6, width: 4.2, height: 5.2, visualTheme: 'ember-vault', landmark: 'ambush' },
    { id: 'm-secret', x: 6.1, y: 12.3, width: 2.6, height: 1.4, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'm-drain', x: 9.5, y: 15.5, width: 5.4, height: 2.2, visualTheme: 'ash-conduit', landmark: 'ambush' },
    { id: 'm-exit', x: 16.2, y: 2.2, width: 1.8, height: 2.4, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'meridian-ember-token',
      label: 'Ember Cinder Token',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'meridian-vent-seal',
      pickupObjectiveText: 'Cinder token fused — vent seal listens',
      billboardLabel: 'TOKEN'
    }
  ],
  doors: [
    {
      id: 'meridian-vent-seal',
      tileX: 8,
      tileY: 7,
      x: 8.5,
      y: 7.5,
      width: 1,
      height: 1,
      keyId: 'meridian-ember-token',
      killsRequired: 0,
      openObjectiveText: 'Vent seal torn — ash conduit floods the annex',
      lockedObjectiveText: 'Ember vent welded — cinder token required',
      billboardLabel: 'VENT'
    },
    {
      id: 'meridian-service-cut',
      tileX: 20,
      tileY: 10,
      x: 20.5,
      y: 10.5,
      width: 1,
      height: 1,
      keyId: 'meridian-ember-token',
      killsRequired: 0,
      openObjectiveText: 'Service sleeve ash-lit — east wing bridged',
      lockedObjectiveText: 'Maintenance sleeve: route token required',
      billboardLabel: 'CUT'
    }
  ],
  triggers: [
    {
      id: 'meridian-flank-spike',
      x: 10.4,
      y: 7.9,
      width: 2.6,
      height: 1.6,
      once: true,
      doorId: 'meridian-vent-seal',
      objectiveText: 'Ash ambush protocol armed',
      activationText: 'SCRAMBLERS SCRAPE THE VENT — DENY THEM THE DOORFRAME',
      setpieceCue: 'ALARM_SURGE',
      spawns: [
        { x: 10.5, y: 7.5, kind: 'SCRAMBLER' },
        { x: 13.5, y: 9.5, kind: 'GRUNT' },
        { x: 13.5, y: 7.5, kind: 'RANGED' },
        { x: 11.2, y: 8.5, kind: 'SCRAMBLER' }
      ]
    },
    {
      id: 'meridian-choke',
      x: 14.8,
      y: 9.8,
      width: 3.2,
      height: 2.4,
      once: true,
      doorId: 'meridian-vent-seal',
      objectiveText: 'Choke corridor taxed',
      activationText: 'Anchor brute meets scrambler harassment — peel order matters',
      spawns: [
        { x: 9.5, y: 11.5, kind: 'SCRAMBLER' },
        { x: 14.5, y: 11.5, kind: 'STALKER' },
        { x: 16.5, y: 11.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'meridian-cache-stir',
      x: 6.1,
      y: 12.3,
      width: 2.0,
      height: 1.0,
      once: true,
      doorId: 'meridian-vent-seal',
      objectiveText: 'Audit niche disturbed',
      activationText: 'Hidden ledger pinged — score spine rewarded if you survive',
      spawns: [
        { x: 3.5, y: 9.5, kind: 'SCRAMBLER' },
        { x: 7.5, y: 11.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'meridian-cell',
      kind: 'repair-cell',
      label: 'Ash Repair Cell',
      x: 3.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'CELL',
      pickupMessage: 'Ash repair cell fused',
      fullHealthMessage: 'Core stable: skip the spare cell'
    },
    {
      id: 'meridian-patch',
      kind: 'health-pack',
      label: 'Meridian Patch',
      x: 12.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 30,
      billboardLabel: 'PATCH',
      pickupMessage: 'Meridian patch applied',
      fullHealthMessage: 'Vitals capped: stash the patch',
      requiredOpenDoorIds: ['meridian-vent-seal']
    }
  ],
  secrets: [
    {
      id: 'meridian-audit-ledger',
      label: 'Audit Ledger',
      x: 5.5,
      y: 12.5,
      radius: 0.24,
      objectiveText: 'Audit ledger indexed — route score spine spikes',
      billboardLabel: 'LEDGER'
    },
    {
      id: 'meridian-shard-niche',
      label: 'Shard Niche',
      x: 25.5,
      y: 4.5,
      radius: 0.24,
      objectiveText: 'East shard niche mapped — full arc medal pressure',
      billboardLabel: 'NICHE'
    }
  ],
  exits: [
    {
      id: 'meridian-ramp-exit',
      x: 16.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Cinder ramp purged — march the black meridian',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'm-scout-a', kind: 'SCRAMBLER', x: 5.5, y: 8.5 },
    { id: 'm-grunt', kind: 'GRUNT', x: 3.5, y: 7.5 },
    { id: 'm-ranged', kind: 'RANGED', x: 16.5, y: 5.5 },
    { id: 'm-brute', kind: 'BRUTE', x: 14.5, y: 9.5 }
  ],
  encounterBeats: [
    { id: 'm-open', zoneId: 'm-start', message: 'Ember Meridian — third hell, not the stratum cold — ash eats patience' },
    { id: 'm-gate', doorId: 'meridian-vent-seal', message: 'Vent seal reads heat — scramblers punish idle ADS' },
    {
      id: 'm-spike',
      triggerId: 'meridian-flank-spike',
      message: 'Harass layer live: kill scramblers before they own the doorframe'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'CAPTURE EMBER TOKEN // CINDER ARCHIVE',
    openDoor: 'TEAR VENT SEAL + SERVICE CUT',
    surviveAmbush: 'CLEAR FLANK SPIKE + CHOKE',
    reachExit: 'REACH MERIDIAN GATE CUT',
    sectorPurged: 'RAMP PURGED'
  },
  progression: {
    requiredExitKeyIds: ['meridian-ember-token'],
    requiredExitDoorIds: ['meridian-vent-seal', 'meridian-service-cut'],
    requiredExitTriggerIds: ['meridian-flank-spike', 'meridian-choke'],
    blockedExitMessage: 'MERIDIAN ROUTE INCOMPLETE: ASH STILL STIRS'
  },
  director: FRACTURE_DIRECTOR
};

/** Gate ring — Black Gate geometry, ash vault dressing, SCRAMBLER pressure in breach. */
export const RAYCAST_LEVEL_WORLD3_GATE_CUT: RaycastLevel = {
  id: 'meridian-gate-cut',
  name: 'Ember Meridian — Gate Cut',
  episodeTheme: 'meridian-gate',
  worldSegment: 'world3',
  map: RAYCAST_MAP_LEVEL_5,
  playerStart: RAYCAST_PLAYER_START_LEVEL_5,
  zones: [
    { id: 'mg-start', x: 1.5, y: 11.5, width: 5.5, height: 5.0, visualTheme: 'ash-conduit' },
    { id: 'mg-sump', x: 1.0, y: 8.5, width: 6.0, height: 3.2, visualTheme: 'ember-vault' },
    { id: 'mg-archive', x: 1.0, y: 1.5, width: 6.5, height: 5.5, visualTheme: 'ash-conduit', landmark: 'key' },
    { id: 'mg-seal', x: 6.2, y: 6.5, width: 2.4, height: 2.2, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'mg-threshold', x: 8.5, y: 6.0, width: 3.0, height: 2.4, visualTheme: 'ember-vault', landmark: 'ambush' },
    { id: 'mg-ring', x: 8.5, y: 1.2, width: 8.0, height: 10.5, visualTheme: 'ember-vault', landmark: 'ambush' },
    { id: 'mg-exit', x: 12.0, y: 0.8, width: 4.6, height: 2.6, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'meridian-sigil',
      label: 'Meridian Sigil',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'meridian-heart-seal',
      pickupObjectiveText: 'Sigil bound — meridian heart unlocks',
      billboardLabel: 'SIGIL'
    }
  ],
  doors: [
    {
      id: 'meridian-heart-seal',
      tileX: 7,
      tileY: 7,
      x: 7.5,
      y: 7.5,
      width: 1,
      height: 1,
      keyId: 'meridian-sigil',
      killsRequired: 0,
      openObjectiveText: 'Heart seal vents ash',
      lockedObjectiveText: 'Meridian heart locked — sigil required',
      billboardLabel: 'HEART'
    }
  ],
  triggers: [
    {
      id: 'meridian-heart-breach',
      x: 9.0,
      y: 6.5,
      width: 2.0,
      height: 1.8,
      once: true,
      doorId: 'meridian-heart-seal',
      objectiveText: 'Force the inner meridian ring',
      activationText: 'SCRAMBLERS + HEAVY — split attention or eat the choke',
      spawns: [
        { x: 10.5, y: 9.5, kind: 'RANGED' },
        { x: 11.5, y: 6.5, kind: 'SCRAMBLER' },
        { x: 10.5, y: 10.5, kind: 'SCRAMBLER' },
        { x: 11.5, y: 8.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'meridian-lockdown',
      x: 13.0,
      y: 1.2,
      width: 3.0,
      height: 2.0,
      once: true,
      doorId: 'meridian-heart-seal',
      objectiveText: 'Finale surge on the ring',
      activationText: 'Everything left wakes — no idle lanes',
      setpieceCue: 'RITUAL_PULSE',
      spawns: [
        { x: 12.5, y: 2.5, kind: 'RANGED' },
        { x: 14.5, y: 9.5, kind: 'BRUTE' },
        { x: 13.5, y: 9.5, kind: 'STALKER' },
        { x: 15.5, y: 5.5, kind: 'SCRAMBLER' }
      ]
    },
    {
      id: 'meridian-sump-stir',
      x: 2.0,
      y: 9.0,
      width: 2.2,
      height: 1.2,
      once: true,
      objectiveText: 'Sump stirred',
      activationText: 'Sump echoes — harassment wave inbound',
      spawns: [
        { x: 1.5, y: 11.5, kind: 'SCRAMBLER' },
        { x: 1.5, y: 10.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'mg-cell',
      kind: 'repair-cell',
      label: 'Gate Repair Cell',
      x: 3.5,
      y: 13.5,
      radius: 0.26,
      restoreAmount: 24,
      billboardLabel: 'CELL',
      pickupMessage: 'Gate repair cell routed',
      fullHealthMessage: 'Stable: skip the cell'
    },
    {
      id: 'mg-patch',
      kind: 'health-pack',
      label: 'Cut Patch',
      x: 14.5,
      y: 5.5,
      radius: 0.26,
      restoreAmount: 28,
      billboardLabel: 'PATCH',
      pickupMessage: 'Cut patch absorbed',
      fullHealthMessage: 'Vitals full',
      requiredOpenDoorIds: ['meridian-heart-seal']
    }
  ],
  secrets: [
    {
      id: 'meridian-sump-niche',
      label: 'Sump Niche',
      x: 3.5,
      y: 11.5,
      radius: 0.24,
      objectiveText: 'Sump niche logged — medal spine tick',
      billboardLabel: 'NICHE'
    }
  ],
  exits: [
    {
      id: 'mg-exit',
      x: 14.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Gate cut cleared — Ash Judge seal ahead',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'mg-watch', kind: 'SCRAMBLER', x: 6.5, y: 11.5 },
    { id: 'mg-arch', kind: 'GRUNT', x: 5.5, y: 4.5 },
    { id: 'mg-rifle', kind: 'RANGED', x: 10.5, y: 9.5 },
    { id: 'mg-brute-a', kind: 'BRUTE', x: 11.5, y: 6.5 }
  ],
  encounterBeats: [
    { id: 'mg-warning', zoneId: 'mg-archive', message: 'Sigil chamber: grab token before heart seal spikes' },
    { id: 'mg-breach-beat', triggerId: 'meridian-heart-breach', message: 'Heart breach: scramblers tax aim — anchor brute owns space' }
  ],
  hudObjectiveLabels: {
    findKey: 'CAPTURE MERIDIAN SIGIL',
    openDoor: 'OPEN HEART SEAL',
    surviveAmbush: 'CLEAR BREACH + LOCKDOWN',
    reachExit: 'REACH ASH JUDGE RELAY',
    sectorPurged: 'GATE CUT PURGED'
  },
  progression: {
    requiredExitKeyIds: ['meridian-sigil'],
    requiredExitDoorIds: ['meridian-heart-seal'],
    requiredExitTriggerIds: ['meridian-heart-breach', 'meridian-lockdown'],
    requireCombatClear: true,
    blockedExitMessage: 'RING ACTIVE: PURGE INCOMPLETE'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 5,
      maxTotalSpawns: 12,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 4400,
      buildUpSpawnCooldownMs: 3400,
      ambushSpawnCooldownMs: 1820,
      highIntensitySpawnCooldownMs: 2980,
      recoveryDurationMs: 5200,
      ambushDurationMs: 6600,
      highIntensityDurationMs: 9300,
      buildUpAfterMs: 5400,
      idlePressureMs: 1550,
      dominanceNoDamageMs: 7800,
      lowHealthThreshold: 34,
      comfortableHealthThreshold: 64,
      debugEnabled: false
    },
    spawnPoints: [
      { id: 'mg-sp-a', zoneId: 'mg-start', x: 3.5, y: 11.5, minPlayerDistance: 2.0 },
      { id: 'mg-sp-b', zoneId: 'mg-ring', x: 12.5, y: 5.5, minPlayerDistance: 2.0 },
      { id: 'mg-sp-c', zoneId: 'mg-threshold', x: 10.5, y: 7.5, minPlayerDistance: 1.9 }
    ]
  }
};

/** Mini-boss seal — Ash Judge ember volley kit. */
export const RAYCAST_LEVEL_WORLD3_ASH_JUDGE: RaycastLevel = {
  id: 'ash-judge-seal',
  name: 'Ash Judge — Meridian Seal',
  episodeTheme: 'ash-judge',
  worldSegment: 'world3',
  map: RAYCAST_MAP_BOSS,
  playerStart: RAYCAST_PLAYER_START_BOSS,
  zones: [
    { id: 'aj-arena', x: 1.0, y: 1.0, width: 13.0, height: 13.0, visualTheme: 'ember-vault', landmark: 'ambush' },
    { id: 'aj-exit', x: 11.0, y: 6.0, width: 3.0, height: 3.0, visualTheme: 'ash-conduit', landmark: 'exit' }
  ],
  keys: [],
  doors: [],
  triggers: [],
  healthPickups: [
    {
      id: 'aj-patch',
      kind: 'health-pack',
      label: 'Seal Patch',
      x: 4.5,
      y: 3.5,
      radius: 0.26,
      restoreAmount: 34,
      billboardLabel: 'PATCH',
      pickupMessage: 'Seal patch applied',
      fullHealthMessage: 'Vitals capped'
    },
    {
      id: 'aj-cell',
      kind: 'repair-cell',
      label: 'Ember Stabilizer',
      x: 10.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 24,
      billboardLabel: 'CELL',
      pickupMessage: 'Ember stabilizer routed',
      fullHealthMessage: 'Skip the cell'
    }
  ],
  secrets: [],
  exits: [
    {
      id: 'aj-exit',
      x: 12.5,
      y: 7.5,
      radius: 0.38,
      objectiveText: 'Ash Judge verdict logged — meridian arc closes',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [],
  encounterBeats: [
    {
      id: 'aj-open',
      zoneId: 'aj-arena',
      message: 'Ash Judge speaks in rotating spires — cut strafe tension before the halo phase'
    }
  ],
  hudObjectiveLabels: {
    surviveAmbush: 'END ASH JUDGE SIGNAL',
    reachExit: 'EXTRACTION WHEN VERDICT CLEARS',
    sectorPurged: 'JUDGE SILENCED'
  },
  progression: {
    requiredExitKeyIds: [],
    requiredExitDoorIds: [],
    requiredExitTriggerIds: [],
    requireBossDefeated: true,
    blockedExitMessage: 'JUDGE STILL SPEAKS'
  },
  bossConfig: {
    id: 'ash-judge',
    displayName: 'Ash Judge',
    x: 7.5,
    y: 7.5,
    maxHealth: 430,
    hitRadius: 0.52,
    behavior: 'ash-judge'
  },
  director: {
    enabled: false,
    config: FRACTURE_DIRECTOR.config,
    spawnPoints: []
  }
};

export const RAYCAST_WORLD_THREE_CATALOG: RaycastLevel[] = [
  RAYCAST_LEVEL_WORLD3_EMBER_RAMP,
  RAYCAST_LEVEL_WORLD3_GATE_CUT,
  RAYCAST_LEVEL_WORLD3_ASH_JUDGE
];
