import { isPointInsideRect, type KeyPickup, type LevelTrigger, type LockedDoor, type RectArea, type SecretPickup } from '../level/arenaLayout';
import type { DirectorConfig } from '../systems/DirectorConfig';
import type { SpawnPoint } from '../systems/GameDirector';
import type { EnemyKind } from '../types/game';
import {
  castRay,
  RAYCAST_MAP_LEVEL_1,
  RAYCAST_MAP_LEVEL_2,
  RAYCAST_MAP_LEVEL_3,
  RAYCAST_PLAYER_START_LEVEL_1,
  RAYCAST_PLAYER_START_LEVEL_2,
  RAYCAST_PLAYER_START_LEVEL_3,
  RAYCAST_TILE,
  type RaycastMap,
  type RaycastPlayerStart
} from './RaycastMap';
import type { RaycastLandmarkId, RaycastZoneThemeId, RaycastZoneVisualDescriptor } from './RaycastVisualTheme';

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
}

export interface RaycastLevel {
  id: string;
  name: string;
  map: RaycastMap;
  playerStart: RaycastPlayerStart;
  zones: RaycastZone[];
  keys: RaycastKey[];
  doors: RaycastDoor[];
  triggers: RaycastTrigger[];
  secrets: RaycastSecret[];
  exits: RaycastExit[];
  initialSpawns: RaycastEnemySpawn[];
  encounterBeats: RaycastEncounterBeat[];
  progression: {
    requiredExitKeyIds: string[];
    requiredExitDoorIds: string[];
    requiredExitTriggerIds: string[];
    requiredExitKeyGroups?: string[][];
    requireCombatClear?: boolean;
    blockedExitMessage: string;
  };
  director: {
    enabled: boolean;
    config: Partial<DirectorConfig>;
    spawnPoints: RaycastDirectorSpawnPoint[];
  };
}

export const RAYCAST_LEVEL_1: RaycastLevel = {
  id: 'access-node',
  name: 'Corrupt Access Node',
  map: RAYCAST_MAP_LEVEL_1,
  playerStart: RAYCAST_PLAYER_START_LEVEL_1,
  zones: [
    { id: 'start', x: 2.5, y: 12.3, width: 3.2, height: 1.4, visualTheme: 'corrupted-metal' },
    { id: 'narrow-hall', x: 3.0, y: 9.2, width: 4.8, height: 4.8, visualTheme: 'void-stone' },
    { id: 'first-contact', x: 3.8, y: 7.5, width: 3.8, height: 1.8, visualTheme: 'warning-amber' },
    { id: 'key-area', x: 4.5, y: 3.8, width: 3.4, height: 2.8, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'locked-door', x: 8.0, y: 7.5, width: 2.0, height: 1.8, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'ambush', x: 10.4, y: 7.8, width: 3.2, height: 2.0, visualTheme: 'warning-amber', landmark: 'ambush' },
    { id: 'combat-arena', x: 14.8, y: 9.6, width: 4.2, height: 5.2, visualTheme: 'toxic-green', landmark: 'ambush' },
    { id: 'side-pressure', x: 11.8, y: 10.5, width: 5.2, height: 3.0, visualTheme: 'corrupted-metal' },
    { id: 'secret', x: 6.1, y: 12.3, width: 2.6, height: 1.4, visualTheme: 'void-stone', landmark: 'secret' },
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
      activationText: 'Side channel breach: lateral pressure',
      spawns: [
        { x: 9.5, y: 11.5, kind: 'GRUNT' },
        { x: 14.5, y: 11.5, kind: 'STALKER' },
        { x: 16.5, y: 11.5, kind: 'GRUNT' }
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
    }
  ],
  secrets: [
    {
      id: 'west-cache',
      label: 'Hidden Cache',
      x: 5.5,
      y: 12.5,
      radius: 0.24,
      objectiveText: 'Hidden node: 25 HP restored',
      billboardLabel: 'HIDDEN'
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
    }
  ],
  initialSpawns: [
    { id: 'first-contact-grunt', kind: 'GRUNT', x: 3.5, y: 7.5 },
    { id: 'key-guard-stalker', kind: 'STALKER', x: 5.5, y: 3.5 },
    { id: 'arena-sleeper-brute', kind: 'BRUTE', x: 14.5, y: 9.5 },
    { id: 'exit-ranged-lookout', kind: 'RANGED', x: 16.5, y: 5.5 }
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
    }
  ],
  progression: {
    requiredExitKeyIds: ['rust-key'],
    requiredExitDoorIds: ['rust-gate'],
    requiredExitTriggerIds: ['gate-ambush', 'lateral-pressure'],
    blockedExitMessage: 'ACCESS DENIED: NODE INCOMPLETE'
  },
  director: {
    enabled: true,
    config: {
      maxEnemiesAlive: 4,
      maxTotalSpawns: 9,
      openingSpawnCount: 0,
      baseSpawnCooldownMs: 5600,
      buildUpSpawnCooldownMs: 4600,
      ambushSpawnCooldownMs: 2200,
      highIntensitySpawnCooldownMs: 3800,
      recoveryDurationMs: 5200,
      ambushDurationMs: 6000,
      highIntensityDurationMs: 9000,
      buildUpAfterMs: 7200,
      idlePressureMs: 2000,
      dominanceNoDamageMs: 9500,
      lowHealthThreshold: 35,
      comfortableHealthThreshold: 65,
      debugEnabled: true
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
      { id: 'exit-pressure', zoneId: 'exit', x: 16.5, y: 3.5, minPlayerDistance: 2.0 }
    ]
  }
};

export const RAYCAST_LEVEL_2: RaycastLevel = {
  id: 'glass-cistern',
  name: 'Glass Cistern Breach',
  map: RAYCAST_MAP_LEVEL_2,
  playerStart: RAYCAST_PLAYER_START_LEVEL_2,
  zones: [
    { id: 'start', x: 1.4, y: 9.8, width: 4.0, height: 1.9, visualTheme: 'corrupted-metal' },
    { id: 'trench', x: 1.2, y: 7.8, width: 4.1, height: 2.3, visualTheme: 'void-stone' },
    { id: 'cistern', x: 1.2, y: 1.6, width: 5.4, height: 4.6, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'secret', x: 1.1, y: 7.1, width: 2.2, height: 1.2, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'gate', x: 7.4, y: 4.8, width: 2.0, height: 1.8, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'furnace-threshold', x: 9.2, y: 4.6, width: 3.8, height: 2.0, visualTheme: 'warning-amber', landmark: 'ambush' },
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
      activationText: 'Void trench stirred: flankers inbound',
      spawns: [
        { x: 3.5, y: 8.5, kind: 'STALKER' },
        { x: 5.5, y: 10.5, kind: 'GRUNT' }
      ]
    }
  ],
  secrets: [
    {
      id: 'trench-cache',
      label: 'Trench Cache',
      x: 1.5,
      y: 7.5,
      radius: 0.24,
      objectiveText: 'Trench cache: 25 HP restored',
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
      message: 'Trench echo ahead: keep momentum'
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
    }
  ],
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
      debugEnabled: true
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
  name: 'Relay Catacomb',
  map: RAYCAST_MAP_LEVEL_3,
  playerStart: RAYCAST_PLAYER_START_LEVEL_3,
  zones: [
    { id: 'start', x: 5.0, y: 13.1, width: 7.2, height: 1.6, visualTheme: 'corrupted-metal' },
    { id: 'lower-loop', x: 1.2, y: 9.0, width: 5.2, height: 3.4, visualTheme: 'void-stone' },
    { id: 'archive', x: 1.1, y: 1.4, width: 5.6, height: 5.0, visualTheme: 'toxic-green', landmark: 'key' },
    { id: 'secret', x: 1.1, y: 7.8, width: 2.2, height: 1.4, visualTheme: 'void-stone', landmark: 'secret' },
    { id: 'seal', x: 9.1, y: 6.2, width: 2.0, height: 2.0, visualTheme: 'warning-amber', landmark: 'gate' },
    { id: 'conduit-threshold', x: 11.0, y: 5.8, width: 2.2, height: 2.2, visualTheme: 'warning-amber', landmark: 'ambush' },
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
  secrets: [
    {
      id: 'archive-cache',
      label: 'Archive Cache',
      x: 1.5,
      y: 8.5,
      radius: 0.24,
      objectiveText: 'Archive cache: 25 HP restored',
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

export const RAYCAST_LEVEL_CATALOG: RaycastLevel[] = [RAYCAST_LEVEL_1, RAYCAST_LEVEL_2, RAYCAST_LEVEL_3];
export const RAYCAST_LEVEL = RAYCAST_LEVEL_1;

export function getRaycastLevelById(levelId: string | null | undefined): RaycastLevel {
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

export function isNearPoint(x: number, y: number, point: { x: number; y: number; radius: number }): boolean {
  return Math.hypot(point.x - x, point.y - y) <= point.radius;
}

export function registerRaycastSecret(collectedSecrets: Set<string>, secret: Pick<RaycastSecret, 'id'>): boolean {
  if (collectedSecrets.has(secret.id)) return false;
  collectedSecrets.add(secret.id);
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

  if (hasRequiredKeys && hasRequiredDoors && hasRequiredTriggers && !combatLocked) {
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
    if (options?.map && options.map.grid[Math.floor(point.y)]?.[Math.floor(point.x)] !== RAYCAST_TILE.EMPTY) return false;
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
