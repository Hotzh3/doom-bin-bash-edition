import { isPointInsideRect, type KeyPickup, type LevelTrigger, type LockedDoor, type RectArea, type SecretPickup } from '../level/arenaLayout';
import type { RaycastSetpieceCue } from './RaycastSetpiece';
import type { DirectorConfig } from '../systems/DirectorConfig';
import type { DirectorState } from '../systems/DirectorState';
import type { EncounterPatternId } from '../systems/EncounterPattern';
import type { SpawnPoint } from '../systems/GameDirector';
import type { EnemyKind } from '../types/game';
import {
  castRay,
  RAYCAST_MAP_LEVEL_1,
  RAYCAST_MAP_LEVEL_2,
  RAYCAST_MAP_LEVEL_3,
  RAYCAST_MAP_LEVEL_4,
  RAYCAST_MAP_LEVEL_5,
  RAYCAST_MAP_BOSS,
  RAYCAST_PLAYER_START_LEVEL_1,
  RAYCAST_PLAYER_START_LEVEL_2,
  RAYCAST_PLAYER_START_LEVEL_3,
  RAYCAST_PLAYER_START_LEVEL_4,
  RAYCAST_PLAYER_START_LEVEL_5,
  RAYCAST_PLAYER_START_BOSS,
  RAYCAST_TILE,
  type RaycastMap,
  type RaycastPlayerStart
} from './RaycastMap';
import type { RaycastBossConfig } from './RaycastBoss';
import type { RaycastHealthPickup } from './RaycastItems';
import type { RaycastLandmarkId, RaycastZoneThemeId, RaycastZoneVisualDescriptor } from './RaycastVisualTheme';
import type { RaycastHudObjectiveLabels } from './RaycastObjective';
import {
  RAYCAST_LEVEL_WORLD2_FRACTURE,
  RAYCAST_LEVEL_WORLD2_SULFUR_LATTICE,
  RAYCAST_LEVEL_WORLD2_THRESHOLD,
  RAYCAST_LEVEL_WORLD2_WARDEN_PIT,
  RAYCAST_WORLD_TWO_CATALOG
} from './RaycastWorldTwoLevels';
import {
  RAYCAST_LEVEL_WORLD3_ASH_JUDGE,
  RAYCAST_LEVEL_WORLD3_EMBER_RAMP,
  RAYCAST_LEVEL_WORLD3_GATE_CUT,
  RAYCAST_WORLD_THREE_CATALOG
} from './RaycastWorldThreeLevels';

export {
  RAYCAST_LEVEL_WORLD2_FRACTURE,
  RAYCAST_LEVEL_WORLD2_SULFUR_LATTICE,
  RAYCAST_LEVEL_WORLD2_THRESHOLD,
  RAYCAST_LEVEL_WORLD2_WARDEN_PIT,
  RAYCAST_WORLD_TWO_CATALOG,
  RAYCAST_LEVEL_WORLD3_EMBER_RAMP,
  RAYCAST_LEVEL_WORLD3_GATE_CUT,
  RAYCAST_LEVEL_WORLD3_ASH_JUDGE,
  RAYCAST_WORLD_THREE_CATALOG
};

export interface RaycastEnemySpawn {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
}

export interface RaycastZone extends RectArea, RaycastZoneVisualDescriptor {
  visualTheme: RaycastZoneThemeId;
  landmark?: RaycastLandmarkId;
}

export interface RaycastKey extends KeyPickup {
  pickupObjectiveText: string;
  billboardLabel: string;
}

export interface RaycastDoor extends LockedDoor {
  tileX: number;
  tileY: number;
  billboardLabel: string;
  requiredKeyIds?: string[];
}

export interface RaycastTrigger extends LevelTrigger {
  activationText: string;
  /** Presentation-only tension staging when the trigger fires. */
  setpieceCue?: RaycastSetpieceCue;
}

export interface RaycastSecret extends SecretPickup {
  billboardLabel: string;
}

export interface RaycastExit {
  id: string;
  x: number;
  y: number;
  radius: number;
  objectiveText: string;
  billboardLabel: string;
}

export interface RaycastDirectorSpawnPoint extends SpawnPoint {
  id: string;
  zoneId: string;
  minPlayerDistance: number;
}

export interface RaycastEncounterBeat {
  id: string;
  message: string;
  zoneId?: string;
  doorId?: string;
  triggerId?: string;
  directorState?: 'RECOVERY';
  requiresTriggerId?: string;
  /** Optional authored presentation hook (stacked after beat audio/message). */
  setpieceCue?: RaycastSetpieceCue;
}

export interface RaycastLevel {
  id: string;
  name: string;
  /** Short theme tag for UI/tests (e.g. foundry, labyrinth). */
  episodeTheme?: string;
  map: RaycastMap;
  playerStart: RaycastPlayerStart;
  zones: RaycastZone[];
  keys: RaycastKey[];
  doors: RaycastDoor[];
  triggers: RaycastTrigger[];
  healthPickups: RaycastHealthPickup[];
  secrets: RaycastSecret[];
  exits: RaycastExit[];
  initialSpawns: RaycastEnemySpawn[];
  encounterBeats: RaycastEncounterBeat[];
  /** Sector-flavored OBJECTIVE line — canonical objective codes unchanged for logic/tests. */
  hudObjectiveLabels?: RaycastHudObjectiveLabels;
  progression: {
    requiredExitKeyIds: string[];
    requiredExitDoorIds: string[];
    requiredExitTriggerIds: string[];
    requiredExitKeyGroups?: string[][];
    requireCombatClear?: boolean;
    /** When true, exit stays sealed until `bossDefeated` is set in progress snapshot. */
    requireBossDefeated?: boolean;
    blockedExitMessage: string;
  };
  bossConfig?: RaycastBossConfig;
  director: {
    enabled: boolean;
    config: Partial<DirectorConfig>;
    spawnPoints: RaycastDirectorSpawnPoint[];
  };
  /** Post–Episode 1 arc — drives fog palette + HUD banner (default infernal World 1). */
  worldSegment?: 'world1' | 'world2' | 'world3';
}

export const RAYCAST_LEVEL_1: RaycastLevel = {
  id: 'access-node',
  name: 'Slag Foundry — Cinder Annex',
  episodeTheme: 'foundry',
  map: RAYCAST_MAP_LEVEL_1,
  playerStart: RAYCAST_PLAYER_START_LEVEL_1,
  zones: [
    { id: 'start', x: 2.5, y: 12.3, width: 3.2, height: 1.4, visualTheme: 'corrupted-metal' },
    { id: 'narrow-hall', x: 3.0, y: 9.2, width: 4.8, height: 5.2, visualTheme: 'void-stone' },
    { id: 'first-contact', x: 3.8, y: 7.5, width: 3.8, height: 1.8, visualTheme: 'warning-amber' },
    { id: 'key-area', x: 4.5, y: 3.8, width: 3.4, height: 2.8, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'locked-door', x: 8.0, y: 7.5, width: 2.0, height: 1.8, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'service-mezzanine', x: 17.8, y: 9.4, width: 6.2, height: 3.2, visualTheme: 'void-stone' },
    { id: 'ambush', x: 10.4, y: 7.8, width: 3.2, height: 2.0, visualTheme: 'warning-amber', landmark: 'ambush' },
    { id: 'combat-arena', x: 14.8, y: 9.6, width: 4.2, height: 5.2, visualTheme: 'toxic-green', landmark: 'reactor' },
    { id: 'side-pressure', x: 11.8, y: 10.5, width: 5.2, height: 3.0, visualTheme: 'corrupted-metal' },
    { id: 'east-terrace', x: 18.2, y: 8.8, width: 9.2, height: 5.4, visualTheme: 'toxic-green', landmark: 'bridge' },
    { id: 'east-sleeve', x: 22.2, y: 3.8, width: 5.4, height: 10.2, visualTheme: 'warning-amber' },
    {
      id: 'east-exit-snare',
      x: 24.0,
      y: 2.6,
      width: 3.4,
      height: 3.0,
      visualTheme: 'warning-amber',
      landmark: 'gate'
    },
    { id: 'east-overlook', x: 23.8, y: 2.2, width: 3.6, height: 4.2, visualTheme: 'void-stone' },
    { id: 'secret', x: 6.1, y: 12.3, width: 2.6, height: 1.4, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'south-catacombs', x: 3.2, y: 14.5, width: 13.2, height: 3.4, visualTheme: 'corrupted-metal' },
    { id: 'exit', x: 16.2, y: 2.2, width: 1.8, height: 2.4, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'rust-key',
      label: 'Access Token',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'rust-gate',
      pickupObjectiveText: 'Token routed: return to gateway',
      billboardLabel: 'TOKEN'
    }
  ],
  doors: [
    {
      id: 'rust-gate',
      tileX: 8,
      tileY: 7,
      x: 8.5,
      y: 7.5,
      width: 1,
      height: 1,
      keyId: 'rust-key',
      killsRequired: 0,
      openObjectiveText: 'Gateway open: combat node exposed',
      lockedObjectiveText: 'Firewall sealed: access token required',
      billboardLabel: 'SEALED'
    },
    {
      id: 'service-shutter',
      tileX: 20,
      tileY: 10,
      x: 20.5,
      y: 10.5,
      width: 1,
      height: 1,
      keyId: 'rust-key',
      killsRequired: 0,
      openObjectiveText: 'Service shutter lifted: east sleeve aligned',
      lockedObjectiveText: 'Maintenance shutter: route token required',
      billboardLabel: 'LOCKED'
    }
  ],
  triggers: [
    {
      id: 'gate-ambush',
      x: 10.4,
      y: 7.9,
      width: 2.6,
      height: 1.6,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Ambush protocol: clear the node',
      activationText: 'Corruption spike: ambush active',
      setpieceCue: 'ALARM_SURGE',
      spawns: [
        { x: 10.5, y: 7.5, kind: 'STALKER' },
        { x: 13.5, y: 9.5, kind: 'GRUNT' },
        { x: 16.5, y: 7.5, kind: 'RANGED' }
      ]
    },
    {
      id: 'lateral-pressure',
      x: 14.8,
      y: 9.8,
      width: 3.2,
      height: 2.4,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Side pressure: keep moving',
      activationText: 'Side channel breach: brute anchors the choke',
      spawns: [
        { x: 9.5, y: 11.5, kind: 'GRUNT' },
        { x: 14.5, y: 11.5, kind: 'STALKER' },
        { x: 16.5, y: 11.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'east-overlook',
      x: 21.5,
      y: 10.5,
      width: 5.4,
      height: 3.4,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'East annex sweep logged',
      activationText: 'Overlook breach: east sleeve awake',
      spawns: [
        { x: 22.5, y: 10.5, kind: 'RANGED' },
        { x: 24.5, y: 11.5, kind: 'STALKER' },
        { x: 20.5, y: 11.5, kind: 'GRUNT' }
      ]
    },
    {
      id: 'south-drain',
      x: 9.5,
      y: 15.5,
      width: 5.4,
      height: 2.2,
      once: true,
      objectiveText: 'Catacomb drain disturbed',
      activationText: 'Drain surge: anchor brute claws up — trap room live',
      setpieceCue: 'BLACKOUT_PULSE',
      spawns: [
        { x: 7.5, y: 14.5, kind: 'GRUNT' },
        { x: 11.5, y: 15.5, kind: 'STALKER' },
        { x: 13.5, y: 15.5, kind: 'GRUNT' },
        { x: 9.5, y: 14.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'secret-cache-pressure',
      x: 6.1,
      y: 12.3,
      width: 2.0,
      height: 1.0,
      once: true,
      doorId: 'rust-gate',
      objectiveText: 'Hidden node disturbed',
      activationText: 'Hidden cache ping: response inbound',
      spawns: [
        { x: 3.5, y: 9.5, kind: 'STALKER' },
        { x: 7.5, y: 11.5, kind: 'GRUNT' }
      ]
    },
    {
      id: 'service-cut',
      x: 19.6,
      y: 10.6,
      width: 2.4,
      height: 1.4,
      once: true,
      doorId: 'service-shutter',
      objectiveText: 'Service sleeve intersected',
      activationText: 'Maintenance hatch stressed: reroute signals',
      spawns: [
        { x: 21.5, y: 11.5, kind: 'GRUNT' },
        { x: 24.5, y: 11.5, kind: 'STALKER' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'start-repair-cell',
      kind: 'repair-cell',
      label: 'Emergency Repair Cell',
      x: 3.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 20,
      billboardLabel: 'CELL',
      pickupMessage: 'Emergency repair cell routed',
      fullHealthMessage: 'Systems stable: leave the repair cell intact'
    },
    {
      id: 'arena-health-pack',
      kind: 'health-pack',
      label: 'Field Health Pack',
      x: 12.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 30,
      billboardLabel: 'PATCH',
      pickupMessage: 'Field health pack applied',
      fullHealthMessage: 'Vital bands full: save the patch for later',
      requiredOpenDoorIds: ['rust-gate']
    },
    {
      id: 'east-buffer-patch',
      kind: 'health-pack',
      label: 'Annex Buffer Patch',
      x: 22.5,
      y: 9.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'BUFFER',
      pickupMessage: 'Annex buffer patch absorbed',
      fullHealthMessage: 'Signal stable: skip the spare patch',
      requiredOpenDoorIds: ['rust-gate', 'service-shutter']
    },
    {
      id: 'south-repair-node',
      kind: 'repair-cell',
      label: 'Drain Repair Node',
      x: 12.5,
      y: 15.5,
      radius: 0.26,
      restoreAmount: 18,
      billboardLabel: 'DRAIN',
      pickupMessage: 'Drain repair node stabilized',
      fullHealthMessage: 'Routing clean: leave the drain cell'
    }
  ],
  secrets: [
    {
      id: 'west-cache',
      label: 'Hidden Cache',
      x: 5.5,
      y: 12.5,
      radius: 0.24,
      objectiveText: 'Hidden cache logged',
      billboardLabel: 'HIDDEN'
    },
    {
      id: 'shard-overlook',
      label: 'Shard Niche',
      x: 25.5,
      y: 4.5,
      radius: 0.24,
      objectiveText: 'East niche mapped',
      billboardLabel: 'NICHE'
    },
    {
      id: 'pit-archive',
      label: 'Drain Archive',
      x: 14.5,
      y: 15.5,
      radius: 0.24,
      objectiveText: 'Drain archive indexed',
      billboardLabel: 'ARCHIVE'
    }
  ],
  exits: [
    {
      id: 'foundry-exit',
      x: 16.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Access node purged',
      billboardLabel: 'EXIT'
    },
    {
      id: 'foundry-east-exit',
      x: 25.5,
      y: 3.5,
      radius: 0.34,
      objectiveText: 'East annex purge logged — same clearance token as roof hatch',
      billboardLabel: 'EXIT?'
    }
  ],
  initialSpawns: [
    { id: 'first-contact-grunt', kind: 'GRUNT', x: 3.5, y: 7.5 },
    { id: 'key-guard-stalker', kind: 'STALKER', x: 5.5, y: 3.5 },
    { id: 'arena-sleeper-brute', kind: 'BRUTE', x: 14.5, y: 9.5 },
    { id: 'exit-ranged-lookout', kind: 'RANGED', x: 16.5, y: 5.5 },
    { id: 'east-wing-grunt', kind: 'GRUNT', x: 24.5, y: 10.5 },
    { id: 'south-skulk-stalker', kind: 'STALKER', x: 10.5, y: 15.5 }
  ],
  encounterBeats: [
    {
      id: 'first-contact-warning',
      zoneId: 'first-contact',
      message: 'Signal ripple ahead: keep moving'
    },
    {
      id: 'gate-preparation',
      doorId: 'rust-gate',
      message: 'Gateway breach detected: ambush signatures rising'
    },
    {
      id: 'gate-ambush-spike',
      triggerId: 'gate-ambush',
      message: 'Crossfire spike: push through the trap'
    },
    {
      id: 'gate-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'gate-ambush',
      message: 'Node staggered: take the recovery window'
    },
    {
      id: 'east-wing-note',
      zoneId: 'east-terrace',
      message: 'East annex opens: mind the service shutter loop'
    },
    {
      id: 'south-backtrack',
      zoneId: 'south-catacombs',
      message: 'Drain loop detected — map routes home through the catacombs'
    },
    {
      id: 'east-decoy-read',
      zoneId: 'east-exit-snare',
      message: 'EXIT? gleams early — same clearance rules as roof hatch; shortcut once route armed',
      setpieceCue: 'FAKE_CALM'
    },
    {
      id: 'holdout-lateral',
      triggerId: 'lateral-pressure',
      message: 'Holdout choke: anchor brute pins the lane — peel before rifles respawn'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'TRACE WEST TOKEN // SLAB FORGE',
    openDoor: 'BREACH ANNEX SHUTTERS // TWO LOCKS',
    surviveAmbush: 'CLEAR TRIANGLE TRAPS // ARENA + EAST',
    reachExit: 'EXFIL THROUGH ROOF EXIT NODE',
    sectorPurged: 'FOUNDRY ANNEX PURGED'
  },
  progression: {
    requiredExitKeyIds: ['rust-key'],
    requiredExitDoorIds: ['rust-gate', 'service-shutter'],
    requiredExitTriggerIds: ['gate-ambush', 'lateral-pressure', 'east-overlook'],
    blockedExitMessage: 'ACCESS DENIED: NODE INCOMPLETE'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 5,
      maxTotalSpawns: 10,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 5400,
      buildUpSpawnCooldownMs: 4400,
      ambushSpawnCooldownMs: 2100,
      highIntensitySpawnCooldownMs: 3600,
      recoveryDurationMs: 5000,
      ambushDurationMs: 6400,
      highIntensityDurationMs: 9200,
      buildUpAfterMs: 6800,
      idlePressureMs: 1850,
      dominanceNoDamageMs: 9200,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: false
    },
    spawnPoints: [
      { id: 'first-contact-rear', zoneId: 'first-contact', x: 3.5, y: 7.5, minPlayerDistance: 1.6 },
      { id: 'key-area-terminal', zoneId: 'key-area', x: 5.5, y: 3.5, minPlayerDistance: 1.8 },
      { id: 'locked-door-pressure', zoneId: 'locked-door', x: 7.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'ambush-threshold', zoneId: 'ambush', x: 10.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'arena-left', zoneId: 'combat-arena', x: 13.5, y: 9.5, minPlayerDistance: 1.8 },
      { id: 'arena-lower', zoneId: 'combat-arena', x: 14.5, y: 11.5, minPlayerDistance: 1.8 },
      { id: 'arena-ranged-perch', zoneId: 'combat-arena', x: 16.5, y: 7.5, minPlayerDistance: 2.2 },
      { id: 'side-loop-pressure', zoneId: 'side-pressure', x: 9.5, y: 11.5, minPlayerDistance: 2.0 },
      { id: 'east-terrace-west', zoneId: 'east-terrace', x: 21.5, y: 11.5, minPlayerDistance: 2.0 },
      { id: 'east-sleeve-north', zoneId: 'east-sleeve', x: 24.5, y: 5.5, minPlayerDistance: 2.2 },
      { id: 'south-catacombs-mid', zoneId: 'south-catacombs', x: 9.5, y: 15.5, minPlayerDistance: 2.0 },
      { id: 'exit-pressure', zoneId: 'exit', x: 16.5, y: 3.5, minPlayerDistance: 2.0 }
    ]
  },
  encounterPatternBindings: [
    {
      id: 'combat-arena-lockdown',
      zoneId: 'combat-arena',
      patternId: 'arena_lockdown',
      cooldownMs: 14_000,
      maxPlayerHealthToSkip: 18
    },
    {
      id: 'east-snare-fake-safety',
      zoneId: 'east-exit-snare',
      patternId: 'fake_safety_ambush',
      cooldownMs: 16_000,
      maxPlayerHealthToSkip: 18
    },
    {
      id: 'narrow-hall-hunt',
      zoneId: 'narrow-hall',
      patternId: 'corridor_hunt',
      cooldownMs: 12_000,
      maxPlayerHealthToSkip: 18
    },
    {
      id: 'side-pincer',
      zoneId: 'side-pressure',
      patternId: 'pincer',
      cooldownMs: 13_000,
      maxPlayerHealthToSkip: 18
    },
    {
      id: 'terrace-flank',
      zoneId: 'east-terrace',
      patternId: 'flank_pressure',
      cooldownMs: 15_000,
      maxPlayerHealthToSkip: 18
    },
    {
      id: 'catacomb-wave',
      zoneId: 'south-catacombs',
      patternId: 'pressure_wave',
      cooldownMs: 14_000,
      maxPlayerHealthToSkip: 18
    },
    {
      id: 'ambush-brute-support',
      zoneId: 'ambush',
      patternId: 'support_brute_push',
      cooldownMs: 15_000,
      maxPlayerHealthToSkip: 18
    }
  ]
};

export const RAYCAST_LEVEL_2: RaycastLevel = {
  id: 'glass-cistern',
  name: 'Glass Cistern — Furnace Fork',
  episodeTheme: 'labyrinth',
  map: RAYCAST_MAP_LEVEL_2,
  playerStart: RAYCAST_PLAYER_START_LEVEL_2,
  zones: [
    { id: 'start', x: 1.4, y: 9.8, width: 4.0, height: 1.9, visualTheme: 'corrupted-metal' },
    { id: 'trench', x: 1.2, y: 7.8, width: 4.1, height: 2.3, visualTheme: 'void-stone' },
    { id: 'cistern', x: 1.2, y: 1.6, width: 5.4, height: 4.6, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'secret', x: 1.1, y: 7.1, width: 2.2, height: 1.2, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'gate', x: 7.4, y: 4.8, width: 2.0, height: 1.8, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'furnace-threshold', x: 9.2, y: 4.6, width: 3.8, height: 2.0, visualTheme: 'warning-amber', landmark: 'reactor' },
    { id: 'glass-run', x: 11.0, y: 1.2, width: 3.8, height: 7.0, visualTheme: 'toxic-green' },
    { id: 'overlook', x: 13.0, y: 1.0, width: 1.8, height: 2.4, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'glass-sigil',
      label: 'Glass Sigil',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'cistern-gate',
      pickupObjectiveText: 'Sigil bound: breach the furnace gate',
      billboardLabel: 'SIGIL'
    }
  ],
  doors: [
    {
      id: 'cistern-gate',
      tileX: 8,
      tileY: 5,
      x: 8.5,
      y: 5.5,
      width: 1,
      height: 1,
      keyId: 'glass-sigil',
      killsRequired: 0,
      openObjectiveText: 'Furnace gate vented',
      lockedObjectiveText: 'Glass lock sealed: sigil required',
      billboardLabel: 'LOCK'
    }
  ],
  triggers: [
    {
      id: 'furnace-ambush',
      x: 10.2,
      y: 5.2,
      width: 2.6,
      height: 1.6,
      once: true,
      doorId: 'cistern-gate',
      objectiveText: 'Breach the furnace lane',
      activationText: 'Furnace breach: pressure rising',
      spawns: [
        { x: 9.5, y: 2.5, kind: 'RANGED' },
        { x: 13.5, y: 6.5, kind: 'GRUNT' },
        { x: 13.5, y: 3.5, kind: 'STALKER' }
      ]
    },
    {
      id: 'exit-lockdown',
      x: 13.2,
      y: 1.4,
      width: 1.4,
      height: 1.8,
      once: true,
      doorId: 'cistern-gate',
      objectiveText: 'Exit lane contested',
      activationText: 'Overlook compromised: hold the lane',
      spawns: [
        { x: 14.5, y: 6.5, kind: 'BRUTE' },
        { x: 14.5, y: 5.5, kind: 'RANGED' }
      ]
    },
    {
      id: 'secret-stir',
      x: 1.2,
      y: 7.2,
      width: 1.8,
      height: 1.0,
      once: true,
      objectiveText: 'Cache disturbed',
      activationText: 'Void trench stirred: flankers + perch rifle',
      spawns: [
        { x: 3.5, y: 8.5, kind: 'STALKER' },
        { x: 5.5, y: 10.5, kind: 'GRUNT' },
        { x: 5.5, y: 9.5, kind: 'RANGED' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'trench-repair-cell',
      kind: 'repair-cell',
      label: 'Emergency Repair Cell',
      x: 5.5,
      y: 10.5,
      radius: 0.26,
      restoreAmount: 20,
      billboardLabel: 'CELL',
      pickupMessage: 'Emergency repair cell routed',
      fullHealthMessage: 'Systems stable: leave the repair cell intact'
    },
    {
      id: 'glass-run-health-pack',
      kind: 'health-pack',
      label: 'Field Health Pack',
      x: 13.5,
      y: 6.5,
      radius: 0.26,
      restoreAmount: 30,
      billboardLabel: 'PATCH',
      pickupMessage: 'Field health pack applied',
      fullHealthMessage: 'Vital bands full: save the patch for later',
      requiredOpenDoorIds: ['cistern-gate']
    },
    {
      id: 'trench-stash-pack',
      kind: 'health-pack',
      label: 'Trench Cache Pack',
      x: 1.5,
      y: 9.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'STASH',
      pickupMessage: 'Trench cache ripped open — side route pays',
      fullHealthMessage: 'Reserve full: leave the trench stash'
    }
  ],
  secrets: [
    {
      id: 'trench-cache',
      label: 'Trench Cache',
      x: 1.5,
      y: 7.5,
      radius: 0.24,
      objectiveText: 'Trench cache logged',
      billboardLabel: 'CACHE'
    }
  ],
  exits: [
    {
      id: 'cistern-exit',
      x: 14.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Cistern route stabilized',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'trench-watch', kind: 'GRUNT', x: 3.5, y: 8.5 },
    { id: 'cistern-guard', kind: 'STALKER', x: 4.5, y: 4.5 },
    { id: 'furnace-lookout', kind: 'RANGED', x: 9.5, y: 2.5 },
    { id: 'overlook-brute', kind: 'BRUTE', x: 13.5, y: 5.5 }
  ],
  encounterBeats: [
    {
      id: 'trench-warning',
      zoneId: 'trench',
      message: 'Trench fork: skim the cache alcove or sprint straight for the sigil'
    },
    {
      id: 'furnace-prep',
      doorId: 'cistern-gate',
      message: 'Gate venting: furnace lane signatures climbing'
    },
    {
      id: 'furnace-spike',
      triggerId: 'furnace-ambush',
      message: 'Cross-lane fire: break the overlook'
    },
    {
      id: 'overlook-lockdown',
      triggerId: 'exit-lockdown',
      message: 'Extraction lane jammed: clear the overlook'
    },
    {
      id: 'cistern-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'furnace-ambush',
      message: 'Pressure dip: use the recovery window'
    },
    {
      id: 'cistern-sigil-risk',
      zoneId: 'cistern',
      message: 'Sigil pocket is a kill box — grab + bail or kite guardians into the trench fork'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'RECOVER GLASS SIGIL // DEEP CISTERN',
    openDoor: 'VENT FURNACE GATE // LOCK ONE',
    surviveAmbush: 'SURVIVE OVERLOOK LOCKDOWN',
    reachExit: 'CUT TO STACK EXIT LEDGE',
    sectorPurged: 'CISTERN FORK STABILIZED'
  },
  progression: {
    requiredExitKeyIds: ['glass-sigil'],
    requiredExitDoorIds: ['cistern-gate'],
    requiredExitTriggerIds: ['furnace-ambush', 'exit-lockdown'],
    blockedExitMessage: 'ROUTE UNSTABLE: BREACH INCOMPLETE'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 5,
      maxTotalSpawns: 10,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 5200,
      buildUpSpawnCooldownMs: 4200,
      ambushSpawnCooldownMs: 2100,
      highIntensitySpawnCooldownMs: 3400,
      recoveryDurationMs: 4600,
      ambushDurationMs: 5800,
      highIntensityDurationMs: 8600,
      buildUpAfterMs: 6500,
      idlePressureMs: 1800,
      dominanceNoDamageMs: 8800,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: false
    },
    spawnPoints: [
      { id: 'start-rear', zoneId: 'start', x: 5.5, y: 10.5, minPlayerDistance: 2.2 },
      { id: 'trench-left', zoneId: 'trench', x: 3.5, y: 8.5, minPlayerDistance: 1.8 },
      { id: 'cistern-inner', zoneId: 'cistern', x: 4.5, y: 4.5, minPlayerDistance: 1.8 },
      { id: 'gate-anchor', zoneId: 'gate', x: 7.5, y: 5.5, minPlayerDistance: 1.8 },
      { id: 'threshold-ranged', zoneId: 'furnace-threshold', x: 9.5, y: 2.5, minPlayerDistance: 2.0 },
      { id: 'glass-run-mid', zoneId: 'glass-run', x: 13.5, y: 6.5, minPlayerDistance: 2.0 },
      { id: 'overlook-rear', zoneId: 'overlook', x: 14.5, y: 5.5, minPlayerDistance: 2.2 }
    ]
  }
};

export const RAYCAST_LEVEL_3: RaycastLevel = {
  id: 'relay-catacomb',
  name: 'Bile Relay — Catacomb Split',
  episodeTheme: 'toxic',
  map: RAYCAST_MAP_LEVEL_3,
  playerStart: RAYCAST_PLAYER_START_LEVEL_3,
  zones: [
    { id: 'start', x: 5.0, y: 13.1, width: 7.2, height: 1.6, visualTheme: 'corrupted-metal' },
    { id: 'lower-loop', x: 1.2, y: 9.0, width: 5.2, height: 3.4, visualTheme: 'void-stone' },
    { id: 'archive', x: 1.1, y: 1.4, width: 5.6, height: 5.0, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'secret', x: 1.1, y: 7.8, width: 2.2, height: 1.4, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'seal', x: 9.1, y: 6.2, width: 2.0, height: 2.0, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'conduit-threshold', x: 11.0, y: 5.8, width: 2.2, height: 2.2, visualTheme: 'warning-amber', landmark: 'ritual' },
    { id: 'conduit-loop', x: 11.0, y: 1.2, width: 7.0, height: 10.2, visualTheme: 'toxic-green' },
    { id: 'relay-overlook', x: 13.2, y: 1.0, width: 4.2, height: 2.4, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'amber-core',
      label: 'Amber Core',
      x: 5.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'relay-seal',
      pickupObjectiveText: 'Core routed: break the relay seal',
      billboardLabel: 'CORE'
    }
  ],
  doors: [
    {
      id: 'relay-seal',
      tileX: 10,
      tileY: 7,
      x: 10.5,
      y: 7.5,
      width: 1,
      height: 1,
      keyId: 'amber-core',
      killsRequired: 0,
      openObjectiveText: 'Relay seal ruptured',
      lockedObjectiveText: 'Seal intact: amber core required',
      billboardLabel: 'SEAL'
    }
  ],
  triggers: [
    {
      id: 'conduit-surge',
      x: 11.2,
      y: 6.2,
      width: 1.6,
      height: 1.6,
      once: true,
      doorId: 'relay-seal',
      objectiveText: 'Conduit surge: break through',
      activationText: 'Conduit surge: crossfire rising',
      spawns: [
        { x: 11.5, y: 3.5, kind: 'RANGED' },
        { x: 15.5, y: 5.5, kind: 'GRUNT' },
        { x: 17.5, y: 7.5, kind: 'STALKER' }
      ]
    },
    {
      id: 'relay-lockdown',
      x: 14.2,
      y: 1.2,
      width: 2.4,
      height: 1.8,
      once: true,
      doorId: 'relay-seal',
      objectiveText: 'Relay overlook contested',
      activationText: 'Relay spike: extraction lane jammed',
      spawns: [
        { x: 17.5, y: 1.5, kind: 'RANGED' },
        { x: 15.5, y: 9.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'archive-stir',
      x: 1.2,
      y: 8.0,
      width: 1.6,
      height: 1.0,
      once: true,
      objectiveText: 'Archive cache stirred',
      activationText: 'Archive echo: flankers inbound',
      spawns: [
        { x: 3.5, y: 9.5, kind: 'STALKER' },
        { x: 5.5, y: 11.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'loop-repair-cell',
      kind: 'repair-cell',
      label: 'Emergency Repair Cell',
      x: 5.5,
      y: 13.5,
      radius: 0.26,
      restoreAmount: 20,
      billboardLabel: 'CELL',
      pickupMessage: 'Emergency repair cell routed',
      fullHealthMessage: 'Systems stable: leave the repair cell intact'
    },
    {
      id: 'conduit-health-pack',
      kind: 'health-pack',
      label: 'Field Health Pack',
      x: 15.5,
      y: 5.5,
      radius: 0.26,
      restoreAmount: 30,
      billboardLabel: 'PATCH',
      pickupMessage: 'Field health pack applied',
      fullHealthMessage: 'Vital bands full: save the patch for later',
      requiredOpenDoorIds: ['relay-seal']
    },
    {
      id: 'archive-niche-stash',
      kind: 'repair-cell',
      label: 'Cached Repair Gel',
      x: 1.5,
      y: 8.5,
      radius: 0.26,
      restoreAmount: 18,
      billboardLabel: 'STASH',
      pickupMessage: 'Cached gel drained from the archive niche',
      fullHealthMessage: 'Stable: leave the niche gel'
    }
  ],
  secrets: [
    {
      id: 'archive-cache',
      label: 'Archive Cache',
      x: 1.5,
      y: 8.5,
      radius: 0.24,
      objectiveText: 'Archive cache logged',
      billboardLabel: 'CACHE'
    }
  ],
  exits: [
    {
      id: 'relay-exit',
      x: 16.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Relay chain severed',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'lower-loop-watch', kind: 'GRUNT', x: 3.5, y: 9.5 },
    { id: 'archive-guard', kind: 'STALKER', x: 5.5, y: 4.5 },
    { id: 'threshold-rifle', kind: 'RANGED', x: 11.5, y: 3.5 },
    { id: 'conduit-anchor', kind: 'GRUNT', x: 15.5, y: 5.5 },
    { id: 'relay-brute', kind: 'BRUTE', x: 15.5, y: 9.5 }
  ],
  encounterBeats: [
    {
      id: 'archive-warning',
      zoneId: 'archive',
      message: 'Archive noise ahead: sweep for the amber core'
    },
    {
      id: 'loop-breathe',
      zoneId: 'lower-loop',
      message: 'Lower loop breathes — route choice: seal rush or archive skim'
    },
    {
      id: 'seal-prep',
      doorId: 'relay-seal',
      message: 'Seal cracking: conduit signatures climbing'
    },
    {
      id: 'conduit-surge-beat',
      triggerId: 'conduit-surge',
      message: 'Conduit breach: cut through the crossfire'
    },
    {
      id: 'relay-lockdown-beat',
      triggerId: 'relay-lockdown',
      message: 'Relay spike: hold the overlook long enough to extract'
    },
    {
      id: 'relay-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'relay-lockdown',
      message: 'Relay stuttering: take the recovery window'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'HARVEST AMBER CORE // ARCHIVE PIT',
    openDoor: 'RUPTURE RELAY SEAL',
    surviveAmbush: 'CLEAR CONDUIT SPIKE + LOCKDOWN',
    reachExit: 'ASCEND RELAY OVERLOOK EXIT',
    sectorPurged: 'RELAY VEIN CUT'
  },
  progression: {
    requiredExitKeyIds: ['amber-core'],
    requiredExitDoorIds: ['relay-seal'],
    requiredExitTriggerIds: ['conduit-surge', 'relay-lockdown'],
    blockedExitMessage: 'RELAY ACTIVE: PURGE INCOMPLETE'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 5,
      maxTotalSpawns: 11,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 5000,
      buildUpSpawnCooldownMs: 3900,
      ambushSpawnCooldownMs: 2000,
      highIntensitySpawnCooldownMs: 3200,
      recoveryDurationMs: 4400,
      ambushDurationMs: 6200,
      highIntensityDurationMs: 9200,
      buildUpAfterMs: 6200,
      idlePressureMs: 1700,
      dominanceNoDamageMs: 8400,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: true
    },
    spawnPoints: [
      { id: 'start-flank', zoneId: 'start', x: 5.5, y: 13.5, minPlayerDistance: 2.2 },
      { id: 'lower-loop-left', zoneId: 'lower-loop', x: 3.5, y: 9.5, minPlayerDistance: 1.8 },
      { id: 'archive-inner', zoneId: 'archive', x: 5.5, y: 4.5, minPlayerDistance: 1.8 },
      { id: 'seal-anchor', zoneId: 'seal', x: 9.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'conduit-ranged', zoneId: 'conduit-threshold', x: 11.5, y: 3.5, minPlayerDistance: 2.0 },
      { id: 'conduit-mid', zoneId: 'conduit-loop', x: 15.5, y: 5.5, minPlayerDistance: 2.0 },
      { id: 'relay-lower', zoneId: 'conduit-loop', x: 15.5, y: 9.5, minPlayerDistance: 2.1 },
      { id: 'overlook-rear', zoneId: 'relay-overlook', x: 17.5, y: 1.5, minPlayerDistance: 2.3 }
    ]
  }
};

export const RAYCAST_LEVEL_4: RaycastLevel = {
  id: 'shard-vault',
  name: 'Crimson Shaft — Ember Crown',
  episodeTheme: 'core',
  map: RAYCAST_MAP_LEVEL_4,
  playerStart: RAYCAST_PLAYER_START_LEVEL_4,
  zones: [
    { id: 'start', x: 1.5, y: 11.5, width: 5.5, height: 5.0, visualTheme: 'corrupted-metal' },
    { id: 'ember-loop', x: 1.0, y: 7.5, width: 5.5, height: 3.8, visualTheme: 'void-stone' },
    { id: 'core-pit', x: 1.0, y: 10.5, width: 6.8, height: 2.6, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'secret', x: 2.2, y: 11.2, width: 2.4, height: 1.6, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'crimson-gate', x: 8.2, y: 5.8, width: 2.2, height: 2.0, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'pressure-neck', x: 10.5, y: 5.5, width: 3.0, height: 2.4, visualTheme: 'warning-amber', landmark: 'core' },
    { id: 'infernal-climb', x: 10.2, y: 1.2, width: 6.2, height: 9.0, visualTheme: 'corrupted-metal' },
    { id: 'stack-exit', x: 12.0, y: 0.8, width: 4.6, height: 2.6, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'prism-shard',
      label: 'Ember Prism',
      x: 3.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'vault-seal',
      pickupObjectiveText: 'Prism hot: route back to the crimson gate',
      billboardLabel: 'PRISM'
    }
  ],
  doors: [
    {
      id: 'vault-seal',
      tileX: 9,
      tileY: 6,
      x: 9.5,
      y: 6.5,
      width: 1,
      height: 1,
      keyId: 'prism-shard',
      killsRequired: 0,
      openObjectiveText: 'Core gate vented',
      lockedObjectiveText: 'Thermal seal: ember prism required',
      billboardLabel: 'SEAL'
    }
  ],
  triggers: [
    {
      id: 'spiral-break',
      x: 10.8,
      y: 6.0,
      width: 2.0,
      height: 1.6,
      once: true,
      doorId: 'vault-seal',
      objectiveText: 'Shaft breach: push the neck',
      activationText: 'Core neck live: pressure wave inbound',
      spawns: [
        { x: 14.5, y: 1.5, kind: 'RANGED' },
        { x: 12.5, y: 2.5, kind: 'STALKER' },
        { x: 10.5, y: 1.5, kind: 'GRUNT' }
      ]
    },
    {
      id: 'crown-crossfire',
      x: 13.5,
      y: 1.2,
      width: 2.8,
      height: 1.8,
      once: true,
      doorId: 'vault-seal',
      objectiveText: 'Stack head contested',
      activationText: 'Crown flare: flanks spill downward',
      spawns: [
        { x: 14.5, y: 3.5, kind: 'STALKER' },
        { x: 8.5, y: 1.5, kind: 'GRUNT' },
        { x: 12.5, y: 3.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'ember-cache-stir',
      x: 2.0,
      y: 8.5,
      width: 2.4,
      height: 1.2,
      once: true,
      objectiveText: 'Ember cache pinged',
      activationText: 'Loop stirred: scavengers inbound',
      spawns: [
        { x: 2.5, y: 11.5, kind: 'STALKER' },
        { x: 1.5, y: 11.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'drain-repair-cell',
      kind: 'repair-cell',
      label: 'Emergency Repair Cell',
      x: 3.5,
      y: 13.5,
      radius: 0.26,
      restoreAmount: 20,
      billboardLabel: 'CELL',
      pickupMessage: 'Emergency repair cell routed',
      fullHealthMessage: 'Systems stable: leave the repair cell intact'
    },
    {
      id: 'spiral-health-pack',
      kind: 'health-pack',
      label: 'Field Health Pack',
      x: 14.5,
      y: 5.5,
      radius: 0.26,
      restoreAmount: 28,
      billboardLabel: 'PATCH',
      pickupMessage: 'Field health pack applied',
      fullHealthMessage: 'Vital bands full: save the patch for later',
      requiredOpenDoorIds: ['vault-seal']
    },
    {
      id: 'shaft-niche-stash',
      kind: 'health-pack',
      label: 'Shaft Niche Pack',
      x: 2.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 24,
      billboardLabel: 'STASH',
      pickupMessage: 'Shaft niche supplies cracked open',
      fullHealthMessage: 'Satchel full: skip the niche pack'
    }
  ],
  secrets: [
    {
      id: 'drain-cache',
      label: 'Shaft Niche',
      x: 2.5,
      y: 11.5,
      radius: 0.24,
      objectiveText: 'Shaft niche logged',
      billboardLabel: 'NICHE'
    }
  ],
  exits: [
    {
      id: 'vault-exit',
      x: 14.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Crimson shaft capped',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'ember-sentry', kind: 'GRUNT', x: 4.5, y: 9.5 },
    { id: 'pit-stalker', kind: 'STALKER', x: 3.5, y: 9.5 },
    { id: 'gate-rifle', kind: 'RANGED', x: 10.5, y: 1.5 },
    { id: 'climb-brute', kind: 'BRUTE', x: 12.5, y: 2.5 },
    { id: 'upper-watch', kind: 'RANGED', x: 14.5, y: 3.5 }
  ],
  encounterBeats: [
    { id: 'vault-warning', zoneId: 'core-pit', message: 'Thermal prism ahead: grab it before the gate cooks you' },
    {
      id: 'ember-loop-read',
      zoneId: 'ember-loop',
      message: 'Ember loop branches — shaft hub or spiral flank'
    },
    { id: 'seal-prep', doorId: 'vault-seal', message: 'Crimson seal ticking: defenders stacking at the neck' },
    { id: 'spiral-break-beat', triggerId: 'spiral-break', message: 'Neck breach: break the crossfire climb' },
    { id: 'crown-crossfire-beat', triggerId: 'crown-crossfire', message: 'Stack head flaring: clear the crown lane' },
    {
      id: 'vault-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'crown-crossfire',
      message: 'Core wavering: short recovery before extraction'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'CLAIM EMBER PRISM // CORE PIT',
    openDoor: 'OPEN CRIMSON VAULT SEAL',
    surviveAmbush: 'BREAK SPIRAL + CROWN CROSSFIRE',
    reachExit: 'CLIMB STACK EXIT SPINE',
    sectorPurged: 'SHAFT PRESSURE VENTED'
  },
  progression: {
    requiredExitKeyIds: ['prism-shard'],
    requiredExitDoorIds: ['vault-seal'],
    requiredExitTriggerIds: ['spiral-break', 'crown-crossfire'],
    blockedExitMessage: 'CORE PRESSURE: SHAFT UNCLEARED'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 6,
      maxTotalSpawns: 12,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 4500,
      buildUpSpawnCooldownMs: 3400,
      ambushSpawnCooldownMs: 1850,
      highIntensitySpawnCooldownMs: 2900,
      recoveryDurationMs: 4000,
      ambushDurationMs: 6600,
      highIntensityDurationMs: 9800,
      buildUpAfterMs: 5600,
      idlePressureMs: 1500,
      dominanceNoDamageMs: 7600,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: true
    },
    spawnPoints: [
      { id: 'start-flank', zoneId: 'start', x: 1.5, y: 9.5, minPlayerDistance: 2.0 },
      { id: 'ember-mid', zoneId: 'ember-loop', x: 4.5, y: 9.5, minPlayerDistance: 1.8 },
      { id: 'pit-inner', zoneId: 'core-pit', x: 3.5, y: 10.5, minPlayerDistance: 1.8 },
      { id: 'gate-foyer', zoneId: 'crimson-gate', x: 8.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'neck', zoneId: 'pressure-neck', x: 10.5, y: 7.5, minPlayerDistance: 2.0 },
      { id: 'climb-mid', zoneId: 'infernal-climb', x: 14.5, y: 5.5, minPlayerDistance: 2.0 },
      { id: 'climb-high', zoneId: 'infernal-climb', x: 14.5, y: 3.5, minPlayerDistance: 2.1 },
      { id: 'exit-foyer', zoneId: 'stack-exit', x: 14.5, y: 1.5, minPlayerDistance: 2.2 }
    ]
  }
};

export const RAYCAST_LEVEL_5: RaycastLevel = {
  id: 'relay-heart',
  name: 'Black Gate — Throne Ring',
  episodeTheme: 'gate',
  map: RAYCAST_MAP_LEVEL_5,
  playerStart: RAYCAST_PLAYER_START_LEVEL_5,
  zones: [
    { id: 'start', x: 1.5, y: 11.5, width: 5.5, height: 5.0, visualTheme: 'void-stone' },
    { id: 'sump-loop', x: 1.0, y: 8.5, width: 6.0, height: 3.2, visualTheme: 'corrupted-metal' },
    { id: 'heart-archive', x: 1.0, y: 1.5, width: 6.5, height: 5.5, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'secret', x: 3.5, y: 11.2, width: 2.4, height: 1.6, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'heart-seal', x: 6.2, y: 6.5, width: 2.4, height: 2.2, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'throne-threshold', x: 8.5, y: 6.0, width: 3.0, height: 2.4, visualTheme: 'warning-amber', landmark: 'ambush' },
    { id: 'throne-ring', x: 8.5, y: 1.2, width: 8.0, height: 10.5, visualTheme: 'corrupted-metal', landmark: 'machinery' },
    { id: 'final-exit', x: 12.0, y: 0.8, width: 4.6, height: 2.6, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'heart-sigil',
      label: 'Gate Sigil',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'heart-seal-door',
      pickupObjectiveText: 'Sigil captured: march on the black gate',
      billboardLabel: 'SIGIL'
    }
  ],
  doors: [
    {
      id: 'heart-seal-door',
      tileX: 7,
      tileY: 7,
      x: 7.5,
      y: 7.5,
      width: 1,
      height: 1,
      keyId: 'heart-sigil',
      killsRequired: 0,
      openObjectiveText: 'Antechamber gate opens',
      lockedObjectiveText: 'Black gate sealed: sigil required',
      billboardLabel: 'GATE'
    }
  ],
  triggers: [
    {
      id: 'heart-breach',
      x: 9.0,
      y: 6.5,
      width: 2.0,
      height: 1.8,
      once: true,
      doorId: 'heart-seal-door',
      objectiveText: 'Force the inner ring',
      activationText: 'Ring breach: heavy units mobilizing',
      spawns: [
        { x: 10.5, y: 9.5, kind: 'RANGED' },
        { x: 11.5, y: 6.5, kind: 'BRUTE' },
        { x: 10.5, y: 10.5, kind: 'GRUNT' }
      ]
    },
    {
      id: 'boss-lockdown',
      x: 13.0,
      y: 1.2,
      width: 3.0,
      height: 2.0,
      once: true,
      doorId: 'heart-seal-door',
      objectiveText: 'Finale wave: clear the antechamber',
      activationText: 'Gate master alarm: everything left awakens',
      spawns: [
        { x: 12.5, y: 2.5, kind: 'RANGED' },
        { x: 14.5, y: 9.5, kind: 'BRUTE' },
        { x: 13.5, y: 9.5, kind: 'STALKER' },
        { x: 15.5, y: 5.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'sump-cache-stir',
      x: 2.0,
      y: 9.0,
      width: 2.2,
      height: 1.2,
      once: true,
      objectiveText: 'Side channel pinged',
      activationText: 'Echo in the sump: flankers inbound',
      spawns: [
        { x: 1.5, y: 11.5, kind: 'STALKER' },
        { x: 1.5, y: 10.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'sump-repair-cell',
      kind: 'repair-cell',
      label: 'Emergency Repair Cell',
      x: 3.5,
      y: 13.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'CELL',
      pickupMessage: 'Emergency repair cell routed',
      fullHealthMessage: 'Systems stable: leave the repair cell intact'
    },
    {
      id: 'throne-health-pack',
      kind: 'health-pack',
      label: 'Field Health Pack',
      x: 14.5,
      y: 5.5,
      radius: 0.26,
      restoreAmount: 28,
      billboardLabel: 'PATCH',
      pickupMessage: 'Field health pack applied',
      fullHealthMessage: 'Vital bands full: save the patch for later',
      requiredOpenDoorIds: ['heart-seal-door']
    },
    {
      id: 'ante-niche-stash',
      kind: 'repair-cell',
      label: 'Antechamber Cache Cell',
      x: 3.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 20,
      billboardLabel: 'STASH',
      pickupMessage: 'Antechamber cache salvaged',
      fullHealthMessage: 'Integrity OK: leave the cache cell'
    }
  ],
  secrets: [
    {
      id: 'sump-cache',
      label: 'Ante Niche',
      x: 3.5,
      y: 11.5,
      radius: 0.24,
      objectiveText: 'Ante niche logged',
      billboardLabel: 'NICHE'
    }
  ],
  exits: [
    {
      id: 'heart-exit',
      x: 14.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Antechamber cleared — guardian ahead',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'sump-watch', kind: 'STALKER', x: 6.5, y: 11.5 },
    { id: 'archive-guard', kind: 'GRUNT', x: 5.5, y: 4.5 },
    { id: 'threshold-rifle', kind: 'RANGED', x: 10.5, y: 9.5 },
    { id: 'throne-brute-a', kind: 'BRUTE', x: 11.5, y: 6.5 },
    { id: 'throne-brute-b', kind: 'BRUTE', x: 12.5, y: 8.5 },
    { id: 'exit-sniper', kind: 'RANGED', x: 12.5, y: 2.5 }
  ],
  encounterBeats: [
    { id: 'heart-warning', zoneId: 'heart-archive', message: 'Sigil chamber: grab the token before the gate locks down' },
    {
      id: 'sump-respite',
      zoneId: 'sump-loop',
      message: 'Sump ring opens — brief respite before the throne sprint'
    },
    { id: 'heart-seal-prep', doorId: 'heart-seal-door', message: 'Black gate humming: the ring is about to wake' },
    { id: 'heart-breach-beat', triggerId: 'heart-breach', message: 'Inner ring live: punch through the heavies' },
    { id: 'boss-lockdown-beat', triggerId: 'boss-lockdown', message: 'Finale surge: clear every hostile before the exit' },
    {
      id: 'final-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'boss-lockdown',
      message: 'Pressure breaks: one breath before extraction'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'CAPTURE GATE SIGIL // HEART ARCHIVE',
    openDoor: 'OPEN BLACK GATE SEAL',
    surviveAmbush: 'CLEAR THRONE RING + FINALE LOCKDOWN',
    reachExit: 'REACH BOSS RELAY THRESHOLD',
    sectorPurged: 'ANTECHAMBER PURGED'
  },
  progression: {
    requiredExitKeyIds: ['heart-sigil'],
    requiredExitDoorIds: ['heart-seal-door'],
    requiredExitTriggerIds: ['heart-breach', 'boss-lockdown'],
    requireCombatClear: true,
    blockedExitMessage: 'GATE ARENA ACTIVE: PURGE INCOMPLETE'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 6,
      maxTotalSpawns: 14,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 4200,
      buildUpSpawnCooldownMs: 3100,
      ambushSpawnCooldownMs: 1700,
      highIntensitySpawnCooldownMs: 2700,
      recoveryDurationMs: 3400,
      ambushDurationMs: 7200,
      highIntensityDurationMs: 11200,
      buildUpAfterMs: 5000,
      idlePressureMs: 1400,
      dominanceNoDamageMs: 7000,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: true
    },
    spawnPoints: [
      { id: 'start-flank', zoneId: 'start', x: 1.5, y: 9.5, minPlayerDistance: 2.0 },
      { id: 'sump-left', zoneId: 'sump-loop', x: 8.5, y: 11.5, minPlayerDistance: 1.8 },
      { id: 'archive-inner', zoneId: 'heart-archive', x: 3.5, y: 4.5, minPlayerDistance: 1.8 },
      { id: 'heart-anchor', zoneId: 'heart-seal', x: 8.5, y: 9.5, minPlayerDistance: 1.8 },
      { id: 'threshold-ranged', zoneId: 'throne-threshold', x: 10.5, y: 9.5, minPlayerDistance: 2.0 },
      { id: 'throne-mid', zoneId: 'throne-ring', x: 10.5, y: 10.5, minPlayerDistance: 2.0 },
      { id: 'throne-lower', zoneId: 'throne-ring', x: 13.5, y: 9.5, minPlayerDistance: 2.1 },
      { id: 'throne-rear', zoneId: 'throne-ring', x: 15.5, y: 8.5, minPlayerDistance: 2.0 },
      { id: 'exit-rear', zoneId: 'final-exit', x: 14.5, y: 1.5, minPlayerDistance: 2.2 }
    ]
  }
};

export const RAYCAST_LEVEL_BOSS: RaycastLevel = {
  id: 'volt-archon-pit',
  name: 'Volt Archon — Core Pit',
  episodeTheme: 'boss',
  map: RAYCAST_MAP_BOSS,
  playerStart: RAYCAST_PLAYER_START_BOSS,
  zones: [
    { id: 'arena', x: 1.0, y: 1.0, width: 13.0, height: 13.0, visualTheme: 'warning-amber', landmark: 'core' },
    { id: 'exit', x: 11.0, y: 6.0, width: 3.0, height: 3.0, visualTheme: 'exit-portal', landmark: 'exit' }
  ],
  keys: [],
  doors: [],
  triggers: [],
  healthPickups: [
    {
      id: 'boss-patch-a',
      kind: 'health-pack',
      label: 'Combat Patch',
      x: 4.5,
      y: 3.5,
      radius: 0.26,
      restoreAmount: 35,
      billboardLabel: 'PATCH',
      pickupMessage: 'Combat patch applied',
      fullHealthMessage: 'Vitals capped: leave the spare patch',
      requiredOpenDoorIds: []
    },
    {
      id: 'boss-patch-b',
      kind: 'repair-cell',
      label: 'Stabilizer Cell',
      x: 10.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'CELL',
      pickupMessage: 'Stabilizer cell routed',
      fullHealthMessage: 'Stable: skip the cell'
    }
  ],
  secrets: [],
  exits: [
    {
      id: 'boss-exit',
      x: 12.5,
      y: 7.5,
      radius: 0.38,
      objectiveText: 'Volt Archon decompiled',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [],
  encounterBeats: [
    { id: 'boss-open', zoneId: 'arena', message: 'Volt Archon locks the pit — watch the telegraph bands before each volley' }
  ],
  hudObjectiveLabels: {
    surviveAmbush: 'END THE ARCHON SIGNAL',
    reachExit: 'EXTRACTION WHEN CORE COLLAPSES',
    sectorPurged: 'ARCHON DELETED'
  },
  progression: {
    requiredExitKeyIds: [],
    requiredExitDoorIds: [],
    requiredExitTriggerIds: [],
    requireBossDefeated: true,
    blockedExitMessage: 'ARCHON STILL ONLINE'
  },
  bossConfig: {
    id: 'volt-archon',
    displayName: 'Volt Archon',
    x: 7.5,
    y: 7.5,
    maxHealth: 620,
    hitRadius: 0.55
  },
  director: {
    enabled: false,
    config: RAYCAST_LEVEL_1.director.config,
    spawnPoints: []
  }
};

export const RAYCAST_LEVEL_CATALOG: RaycastLevel[] = [
  RAYCAST_LEVEL_1,
  RAYCAST_LEVEL_2,
  RAYCAST_LEVEL_3,
  RAYCAST_LEVEL_4,
  RAYCAST_LEVEL_5,
  RAYCAST_LEVEL_BOSS
];
export const RAYCAST_LEVEL = RAYCAST_LEVEL_1;

export function getRaycastLevelById(levelId: string | null | undefined): RaycastLevel {
  if (!levelId) return RAYCAST_LEVEL;
  const worldTwo = RAYCAST_WORLD_TWO_CATALOG.find((level) => level.id === levelId);
  if (worldTwo) return worldTwo;
  const worldThree = RAYCAST_WORLD_THREE_CATALOG.find((level) => level.id === levelId);
  if (worldThree) return worldThree;
  return RAYCAST_LEVEL_CATALOG.find((level) => level.id === levelId) ?? RAYCAST_LEVEL;
}

export function getRaycastLevelIndex(levelId: string): number {
  return RAYCAST_LEVEL_CATALOG.findIndex((level) => level.id === levelId);
}

export function cloneRaycastMap(map: RaycastMap): RaycastMap {
  return {
    tileSize: map.tileSize,
    grid: map.grid.map((row) => [...row])
  };
}

export function openRaycastDoor(map: RaycastMap, door: RaycastDoor): void {
  map.grid[door.tileY][door.tileX] = RAYCAST_TILE.EMPTY;
}

export function isRaycastSpawnPlacementValid(
  map: RaycastMap,
  point: { x: number; y: number },
  radius = 0.4,
  clearance = 0.04
): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  const guardRadius = Math.max(0, radius + clearance);
  const samples = [
    { x: point.x, y: point.y },
    { x: point.x - guardRadius, y: point.y },
    { x: point.x + guardRadius, y: point.y },
    { x: point.x, y: point.y - guardRadius },
    { x: point.x, y: point.y + guardRadius },
    { x: point.x - guardRadius, y: point.y - guardRadius },
    { x: point.x + guardRadius, y: point.y - guardRadius },
    { x: point.x - guardRadius, y: point.y + guardRadius },
    { x: point.x + guardRadius, y: point.y + guardRadius }
  ];

  return samples.every((sample) => map.grid[Math.floor(sample.y)]?.[Math.floor(sample.x)] === RAYCAST_TILE.EMPTY);
}

export function isNearPoint(x: number, y: number, point: { x: number; y: number; radius: number }): boolean {
  return Math.hypot(point.x - x, point.y - y) <= point.radius;
}

export function registerRaycastSecret(collectedSecrets: Set<string>, secret: Pick<RaycastSecret, 'id'>): boolean {
  if (collectedSecrets.has(secret.id)) return false;
  collectedSecrets.add(secret.id);
  return true;
}

export function registerRaycastPickup(collectedPickups: Set<string>, pickup: Pick<RaycastHealthPickup, 'id'>): boolean {
  if (collectedPickups.has(pickup.id)) return false;
  collectedPickups.add(pickup.id);
  return true;
}

export function findRaycastZoneId(level: RaycastLevel, x: number, y: number): string | null {
  return level.zones.find((zone) => isPointInsideRect({ x, y }, zone))?.id ?? null;
}

export interface RaycastProgressSnapshot {
  collectedKeyIds: Iterable<string>;
  openDoorIds: Iterable<string>;
  activatedTriggerIds: Iterable<string>;
  livingEnemyCount?: number;
  bossDefeated?: boolean;
}

export interface RaycastExitAccessResult {
  allowed: boolean;
  message?: string;
  reason?: 'TOKEN_REQUIRED' | 'ACCESS_DENIED' | 'TRIGGER_REQUIRED' | 'SIGNAL_LOCKED';
  missingKeyIds?: string[];
  missingDoorIds?: string[];
  missingTriggerIds?: string[];
}

export function getRaycastDoorRequiredKeyIds(door: Pick<RaycastDoor, 'keyId' | 'requiredKeyIds'>): string[] {
  return door.requiredKeyIds?.length ? [...door.requiredKeyIds] : [door.keyId];
}

export function getRaycastExitAccess(level: RaycastLevel, progress: RaycastProgressSnapshot): RaycastExitAccessResult {
  const keyIds = new Set(progress.collectedKeyIds);
  const doorIds = new Set(progress.openDoorIds);
  const triggerIds = new Set(progress.activatedTriggerIds);
  const requirements = level.progression;
  const requiredKeyGroups =
    requirements.requiredExitKeyGroups?.length
      ? requirements.requiredExitKeyGroups
      : requirements.requiredExitKeyIds.map((id) => [id]);
  const missingKeyIds = requirements.requiredExitKeyIds.filter((id) => !keyIds.has(id));
  const missingDoorIds = requirements.requiredExitDoorIds.filter((id) => !doorIds.has(id));
  const missingTriggerIds = requirements.requiredExitTriggerIds.filter((id) => !triggerIds.has(id));
  const hasRequiredKeys = requiredKeyGroups.every((group) => group.some((id) => keyIds.has(id)));
  const hasRequiredDoors = missingDoorIds.length === 0;
  const hasRequiredTriggers = missingTriggerIds.length === 0;
  const combatLocked = Boolean(requirements.requireCombatClear && (progress.livingEnemyCount ?? 0) > 0);
  const bossLocked = Boolean(requirements.requireBossDefeated && !progress.bossDefeated);

  if (hasRequiredKeys && hasRequiredDoors && hasRequiredTriggers && !combatLocked && !bossLocked) {
    return { allowed: true };
  }

  if (!hasRequiredKeys) {
    return {
      allowed: false,
      reason: 'TOKEN_REQUIRED',
      message: 'TOKEN REQUIRED',
      missingKeyIds
    };
  }

  if (!hasRequiredDoors) {
    return {
      allowed: false,
      reason: 'ACCESS_DENIED',
      message: requirements.blockedExitMessage,
      missingDoorIds
    };
  }

  if (!hasRequiredTriggers) {
    return {
      allowed: false,
      reason: 'TRIGGER_REQUIRED',
      message: 'TRIGGER REQUIRED',
      missingTriggerIds
    };
  }

  if (combatLocked) {
    return {
      allowed: false,
      reason: 'SIGNAL_LOCKED',
      message: 'SIGNAL LOCKED'
    };
  }

  if (bossLocked) {
    return {
      allowed: false,
      reason: 'SIGNAL_LOCKED',
      message: requirements.blockedExitMessage
    };
  }

  return {
    allowed: false,
    message: requirements.blockedExitMessage
  };
}

export function getSafeDirectorSpawnPoints(
  level: RaycastLevel,
  player: { x: number; y: number; angle?: number },
  activeZoneId: string | null,
  options?: {
    map?: RaycastMap;
    enemies?: Array<{ x: number; y: number; radius: number; alive: boolean }>;
    allowVisibleFrontSpawns?: boolean;
  }
): SpawnPoint[] {
  const zoneMatches = level.director.spawnPoints.filter((point) => !activeZoneId || point.zoneId === activeZoneId);
  const candidates = zoneMatches.length > 0 ? zoneMatches : level.director.spawnPoints;
  return candidates.filter((point) => {
    const distance = Math.hypot(point.x - player.x, point.y - player.y);
    const safeDistanceFloor = Math.max(point.minPlayerDistance, 2.75);
    if (distance < safeDistanceFloor) return false;
    if (options?.map && !isRaycastSpawnPlacementValid(options.map, point)) return false;
    if (options?.enemies?.some((enemy) => enemy.alive && Math.hypot(point.x - enemy.x, point.y - enemy.y) <= enemy.radius + 0.45)) {
      return false;
    }
    if (options?.allowVisibleFrontSpawns) return true;
    if (player.angle === undefined || !options?.map) return true;
    const forwardX = Math.cos(player.angle);
    const forwardY = Math.sin(player.angle);
    const dot = ((point.x - player.x) * forwardX + (point.y - player.y) * forwardY) / Math.max(distance, 0.001);
    const hasSight = hasLineOfSightToPoint(options.map, player, point);
    if (!hasSight) return true;
    if (distance <= Math.max(safeDistanceFloor + 1.4, 4.8)) return false;
    if (dot >= 0.45) return false;
    return dot < 0.2 || distance >= safeDistanceFloor + 2.6;
  });
}

function hasLineOfSightToPoint(map: RaycastMap, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const hit = castRay(map, from.x, from.y, angle, angle);
  return hit.distance + 0.08 >= distance;
}

export function isRaycastPointReachable(
  level: RaycastLevel,
  point: { x: number; y: number },
  options?: { openDoorIds?: Iterable<string> }
): boolean {
  const map = cloneRaycastMap(level.map);
  const openDoorIds = new Set(options?.openDoorIds ?? []);
  level.doors
    .filter((door) => openDoorIds.has(door.id))
    .forEach((door) => openRaycastDoor(map, door));

  return isRaycastMapPointReachable(map, level.playerStart, point);
}

export function isRaycastMapPointReachable(
  map: RaycastMap,
  from: { x: number; y: number },
  point: { x: number; y: number }
): boolean {
  const startX = Math.floor(from.x);
  const startY = Math.floor(from.y);
  const targetX = Math.floor(point.x);
  const targetY = Math.floor(point.y);

  if (map.grid[startY]?.[startX] !== RAYCAST_TILE.EMPTY) return false;
  if (map.grid[targetY]?.[targetX] !== RAYCAST_TILE.EMPTY) return false;

  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const key = `${current.x},${current.y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (current.x === targetX && current.y === targetY) return true;

    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].forEach((neighbor) => {
      const cell = map.grid[neighbor.y]?.[neighbor.x];
      if (cell === RAYCAST_TILE.EMPTY && !visited.has(`${neighbor.x},${neighbor.y}`)) {
        queue.push(neighbor);
      }
    });
  }

  return false;
}
