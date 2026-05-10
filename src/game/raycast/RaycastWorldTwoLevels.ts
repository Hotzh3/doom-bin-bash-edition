/**
 * World 2 authored sectors — extracted from `RaycastLevel.ts` for structural budget (Phase 21).
 * Byte-identical data; no gameplay changes.
 */
import {
  RAYCAST_MAP_LEVEL_2,
  RAYCAST_MAP_LEVEL_4,
  RAYCAST_PLAYER_START_LEVEL_2,
  RAYCAST_PLAYER_START_LEVEL_4
} from './RaycastMap';
import type { RaycastLevel } from './RaycastLevel';

/** World 2 — cold ion stratum under Episode 1 (layout mirrors Glass Cistern; zones + IDs unique). */
export const RAYCAST_LEVEL_WORLD2_FRACTURE: RaycastLevel = {
  id: 'rift-fracture',
  name: 'Ion Stratum — Basalt Fracture',
  episodeTheme: 'rift-fracture',
  worldSegment: 'world2',
  map: RAYCAST_MAP_LEVEL_2,
  playerStart: RAYCAST_PLAYER_START_LEVEL_2,
  zones: [
    { id: 'rift-start', x: 1.4, y: 9.8, width: 4.0, height: 1.9, visualTheme: 'basalt-rift' },
    { id: 'rift-gully', x: 1.2, y: 7.8, width: 4.1, height: 2.3, visualTheme: 'basalt-rift' },
    { id: 'ion-well', x: 1.2, y: 1.6, width: 5.4, height: 4.6, visualTheme: 'ion-shaft', landmark: 'key' },
    { id: 'rift-secret', x: 1.1, y: 7.1, width: 2.2, height: 1.2, visualTheme: 'basalt-rift', landmark: 'secret' },
    { id: 'seam-gate', x: 7.4, y: 4.8, width: 2.0, height: 1.8, visualTheme: 'ion-shaft', landmark: 'gate' },
    { id: 'split-push', x: 9.2, y: 4.6, width: 3.8, height: 2.0, visualTheme: 'ion-shaft', landmark: 'ambush' },
    { id: 'ion-run', x: 11.0, y: 1.2, width: 3.8, height: 7.0, visualTheme: 'ion-shaft' },
    { id: 'nadir-ledge', x: 13.0, y: 1.0, width: 1.8, height: 2.4, visualTheme: 'nadir-glow', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'rift-ion-flare',
      label: 'Ion Flare',
      x: 4.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'rift-seam-gate',
      pickupObjectiveText: 'Flare charged: breach the seam gate',
      billboardLabel: 'FLARE'
    }
  ],
  doors: [
    {
      id: 'rift-seam-gate',
      tileX: 8,
      tileY: 5,
      x: 8.5,
      y: 5.5,
      width: 1,
      height: 1,
      keyId: 'rift-ion-flare',
      killsRequired: 0,
      openObjectiveText: 'Basalt seam vented — ion lane opening',
      lockedObjectiveText: 'Seam locked: ion flare required',
      billboardLabel: 'SEAM'
    }
  ],
  triggers: [
    {
      id: 'rift-split-push',
      x: 10.2,
      y: 5.2,
      width: 2.6,
      height: 1.6,
      once: true,
      doorId: 'rift-seam-gate',
      objectiveText: 'Split the ion shaft',
      activationText: 'Basalt seam tearing: pressure spike inbound',
      spawns: [
        { x: 9.5, y: 2.5, kind: 'RANGED' },
        { x: 13.5, y: 6.5, kind: 'GRUNT' },
        { x: 13.5, y: 3.5, kind: 'STALKER' }
      ]
    },
    {
      id: 'rift-overwire',
      x: 13.2,
      y: 1.4,
      width: 1.4,
      height: 1.8,
      once: true,
      doorId: 'rift-seam-gate',
      objectiveText: 'Overwire lane clears last',
      activationText: 'Nadir ledge exposed: hold the overlook',
      spawns: [
        { x: 14.5, y: 6.5, kind: 'BRUTE' },
        { x: 14.5, y: 5.5, kind: 'RANGED' }
      ]
    },
    {
      id: 'rift-cache-stir',
      x: 1.2,
      y: 7.2,
      width: 1.8,
      height: 1.0,
      once: true,
      objectiveText: 'Fracture cache disturbed',
      activationText: 'Gully stirred: flankers crawl from basalt',
      spawns: [
        { x: 3.5, y: 8.5, kind: 'STALKER' },
        { x: 5.5, y: 10.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'rift-gully-cell',
      kind: 'repair-cell',
      label: 'Cold Repair Cell',
      x: 5.5,
      y: 10.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'CELL',
      pickupMessage: 'Cold repair cell fused',
      fullHealthMessage: 'Core stable: skip the spare cell'
    },
    {
      id: 'rift-ion-pack',
      kind: 'health-pack',
      label: 'Ion Patch',
      x: 13.5,
      y: 6.5,
      radius: 0.26,
      restoreAmount: 32,
      billboardLabel: 'PATCH',
      pickupMessage: 'Ion patch applied',
      fullHealthMessage: 'Vitals capped: stash the patch',
      requiredOpenDoorIds: ['rift-seam-gate']
    },
    {
      id: 'rift-gully-stash',
      kind: 'health-pack',
      label: 'Gully Stash',
      x: 1.5,
      y: 9.5,
      radius: 0.26,
      restoreAmount: 24,
      billboardLabel: 'STASH',
      pickupMessage: 'Gully stash ripped — lateral route pays',
      fullHealthMessage: 'Satchel full: leave the stash'
    }
  ],
  secrets: [
    {
      id: 'rift-fissure-cache',
      label: 'Fissure Cache',
      x: 1.5,
      y: 7.5,
      radius: 0.24,
      objectiveText: 'Foreign cache indexed',
      billboardLabel: 'CACHE'
    }
  ],
  exits: [
    {
      id: 'rift-fracture-exit',
      x: 14.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Fracture route cooled',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'rift-gully-watch', kind: 'GRUNT', x: 3.5, y: 8.5 },
    { id: 'ion-well-guard', kind: 'STALKER', x: 4.5, y: 4.5 },
    { id: 'split-lookout', kind: 'RANGED', x: 9.5, y: 2.5 },
    { id: 'ledge-brute', kind: 'BRUTE', x: 13.5, y: 5.5 }
  ],
  encounterBeats: [
    {
      id: 'rift-gully-read',
      zoneId: 'rift-gully',
      message: 'Basalt gully forks — skim the fissure cache or sprint for the ion flare'
    },
    {
      id: 'rift-seam-hum',
      doorId: 'rift-seam-gate',
      message: 'Seam humming: ion lane signatures climbing through the breach'
    },
    {
      id: 'rift-split-beat',
      triggerId: 'rift-split-push',
      message: 'Cross-shaft fire: break the overlook wire'
    },
    {
      id: 'rift-overwire-beat',
      triggerId: 'rift-overwire',
      message: 'Overwire contested: clear before the ledge seals'
    },
    {
      id: 'rift-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'rift-split-push',
      message: 'Ion pressure dips — recover before the next spike'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'HARVEST ION FLARE // COLD WELL',
    openDoor: 'OPEN BASALT SEAM GATE',
    surviveAmbush: 'CLEAR SPLIT PUSH + OVERWIRE',
    reachExit: 'CUT TO NADIR LEDGE',
    sectorPurged: 'FRACTURE STRAND STABILIZED'
  },
  progression: {
    requiredExitKeyIds: ['rift-ion-flare'],
    requiredExitDoorIds: ['rift-seam-gate'],
    requiredExitTriggerIds: ['rift-split-push', 'rift-overwire'],
    blockedExitMessage: 'ION ROUTE UNSTABLE: BREACH INCOMPLETE'
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
      { id: 'rift-start-rear', zoneId: 'rift-start', x: 5.5, y: 10.5, minPlayerDistance: 2.2 },
      { id: 'rift-gully-left', zoneId: 'rift-gully', x: 3.5, y: 8.5, minPlayerDistance: 1.8 },
      { id: 'ion-well-inner', zoneId: 'ion-well', x: 4.5, y: 4.5, minPlayerDistance: 1.8 },
      { id: 'seam-anchor', zoneId: 'seam-gate', x: 7.5, y: 5.5, minPlayerDistance: 1.8 },
      { id: 'split-ranged', zoneId: 'split-push', x: 9.5, y: 2.5, minPlayerDistance: 2.0 },
      { id: 'ion-run-mid', zoneId: 'ion-run', x: 13.5, y: 6.5, minPlayerDistance: 2.0 },
      { id: 'nadir-rear', zoneId: 'nadir-ledge', x: 14.5, y: 5.5, minPlayerDistance: 2.2 }
    ]
  }
};

/** World 2 coda — violet nadir ring (Crimson Shaft topology, distinct landmark copy). */
export const RAYCAST_LEVEL_WORLD2_THRESHOLD: RaycastLevel = {
  id: 'signal-threshold',
  name: 'Nadir Ring — Signal Threshold',
  episodeTheme: 'signal-threshold',
  worldSegment: 'world2',
  map: RAYCAST_MAP_LEVEL_4,
  playerStart: RAYCAST_PLAYER_START_LEVEL_4,
  zones: [
    { id: 'threshold-start', x: 1.5, y: 11.5, width: 5.5, height: 5.0, visualTheme: 'basalt-rift' },
    { id: 'spiral-cold', x: 1.0, y: 7.5, width: 5.5, height: 3.8, visualTheme: 'basalt-rift' },
    { id: 'nadir-pit', x: 1.0, y: 10.5, width: 6.8, height: 2.6, visualTheme: 'ion-shaft', landmark: 'key' },
    { id: 'threshold-secret', x: 2.2, y: 11.2, width: 2.4, height: 1.6, visualTheme: 'basalt-rift', landmark: 'secret' },
    { id: 'signal-seal', x: 8.2, y: 5.8, width: 2.2, height: 2.0, visualTheme: 'ion-shaft', landmark: 'gate' },
    { id: 'glass-neck', x: 10.5, y: 5.5, width: 3.0, height: 2.4, visualTheme: 'ion-shaft', landmark: 'ambush' },
    { id: 'threshold-climb', x: 10.2, y: 1.2, width: 6.2, height: 9.0, visualTheme: 'ion-shaft' },
    { id: 'threshold-exit-zone', x: 12.0, y: 0.8, width: 4.6, height: 2.6, visualTheme: 'nadir-glow', landmark: 'exit' }
  ],
  keys: [
    {
      id: 'cold-prism',
      label: 'Cold Prism',
      x: 3.5,
      y: 3.5,
      radius: 0.28,
      unlocksDoorId: 'threshold-seal',
      pickupObjectiveText: 'Prism synced: return heat to the signal seal',
      billboardLabel: 'PRISM'
    }
  ],
  doors: [
    {
      id: 'threshold-seal',
      tileX: 9,
      tileY: 6,
      x: 9.5,
      y: 6.5,
      width: 1,
      height: 1,
      keyId: 'cold-prism',
      killsRequired: 0,
      openObjectiveText: 'Signal seal vented',
      lockedObjectiveText: 'Nadir seal: cold prism required',
      billboardLabel: 'SEAL'
    }
  ],
  triggers: [
    {
      id: 'threshold-spiral',
      x: 10.8,
      y: 6.0,
      width: 2.0,
      height: 1.6,
      once: true,
      doorId: 'threshold-seal',
      objectiveText: 'Break the glass neck',
      activationText: 'Neck live: ion shear inbound',
      spawns: [
        { x: 14.5, y: 1.5, kind: 'RANGED' },
        { x: 12.5, y: 2.5, kind: 'STALKER' },
        { x: 10.5, y: 1.5, kind: 'GRUNT' }
      ]
    },
    {
      id: 'threshold-crown',
      x: 13.5,
      y: 1.2,
      width: 2.8,
      height: 1.8,
      once: true,
      doorId: 'threshold-seal',
      objectiveText: 'Crown ring contested',
      activationText: 'Threshold flares: heavies spill onto the climb',
      spawns: [
        { x: 14.5, y: 3.5, kind: 'STALKER' },
        { x: 8.5, y: 1.5, kind: 'GRUNT' },
        { x: 12.5, y: 3.5, kind: 'BRUTE' }
      ]
    },
    {
      id: 'threshold-cache-stir',
      x: 2.0,
      y: 8.5,
      width: 2.4,
      height: 1.2,
      once: true,
      objectiveText: 'Cold cache pinged',
      activationText: 'Spiral wakes: scavengers hunt the loop',
      spawns: [
        { x: 2.5, y: 11.5, kind: 'STALKER' },
        { x: 1.5, y: 11.5, kind: 'GRUNT' }
      ]
    }
  ],
  healthPickups: [
    {
      id: 'threshold-cell',
      kind: 'repair-cell',
      label: 'Stratum Cell',
      x: 3.5,
      y: 13.5,
      radius: 0.26,
      restoreAmount: 22,
      billboardLabel: 'CELL',
      pickupMessage: 'Stratum cell routed',
      fullHealthMessage: 'Stable: leave the cell'
    },
    {
      id: 'threshold-pack',
      kind: 'health-pack',
      label: 'Signal Patch',
      x: 14.5,
      y: 5.5,
      radius: 0.26,
      restoreAmount: 30,
      billboardLabel: 'PATCH',
      pickupMessage: 'Signal patch applied',
      fullHealthMessage: 'Vitals full: skip spare patch',
      requiredOpenDoorIds: ['threshold-seal']
    },
    {
      id: 'threshold-niche',
      kind: 'health-pack',
      label: 'Niche Pack',
      x: 2.5,
      y: 11.5,
      radius: 0.26,
      restoreAmount: 26,
      billboardLabel: 'STASH',
      pickupMessage: 'Niche pack cracked',
      fullHealthMessage: 'Reserve full: skip niche pack'
    }
  ],
  secrets: [
    {
      id: 'threshold-niche-secret',
      label: 'Nadir Niche',
      x: 2.5,
      y: 11.5,
      radius: 0.24,
      objectiveText: 'Niche vein mapped',
      billboardLabel: 'NICHE'
    }
  ],
  exits: [
    {
      id: 'threshold-run-exit',
      x: 14.5,
      y: 1.5,
      radius: 0.35,
      objectiveText: 'Signal threshold crossed',
      billboardLabel: 'EXIT'
    }
  ],
  initialSpawns: [
    { id: 'cold-sentry', kind: 'GRUNT', x: 4.5, y: 9.5 },
    { id: 'pit-stalker', kind: 'STALKER', x: 3.5, y: 9.5 },
    { id: 'gate-rifle', kind: 'RANGED', x: 10.5, y: 1.5 },
    { id: 'climb-brute', kind: 'BRUTE', x: 12.5, y: 2.5 },
    { id: 'upper-watch', kind: 'RANGED', x: 14.5, y: 3.5 }
  ],
  encounterBeats: [
    { id: 'nadir-read', zoneId: 'nadir-pit', message: 'Cold prism in the pit — grab it before the seal ices you out' },
    {
      id: 'spiral-breathe',
      zoneId: 'spiral-cold',
      message: 'Spiral breathes — hub rush or flank the cold loop'
    },
    { id: 'seal-tick', doorId: 'threshold-seal', message: 'Signal seal ticking: defenders stacking at the glass neck' },
    { id: 'spiral-beat', triggerId: 'threshold-spiral', message: 'Neck breach: shear the cross-climb' },
    { id: 'crown-beat', triggerId: 'threshold-crown', message: 'Crown ring flaring: finish the ascent' },
    {
      id: 'threshold-recovery',
      directorState: 'RECOVERY',
      requiresTriggerId: 'threshold-crown',
      message: 'Signal wavers: short recovery window'
    }
  ],
  hudObjectiveLabels: {
    findKey: 'CLAIM COLD PRISM // NADIR PIT',
    openDoor: 'OPEN SIGNAL SEAL',
    surviveAmbush: 'BREAK SPIRAL + CROWN PRESSURE',
    reachExit: 'ASCEND THRESHOLD EXIT',
    sectorPurged: 'SIGNAL STRATUM QUIET'
  },
  progression: {
    requiredExitKeyIds: ['cold-prism'],
    requiredExitDoorIds: ['threshold-seal'],
    requiredExitTriggerIds: ['threshold-spiral', 'threshold-crown'],
    blockedExitMessage: 'THRESHOLD LOCKED: ROUTE INCOMPLETE'
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
      { id: 'threshold-start-flank', zoneId: 'threshold-start', x: 1.5, y: 9.5, minPlayerDistance: 2.0 },
      { id: 'spiral-mid', zoneId: 'spiral-cold', x: 4.5, y: 9.5, minPlayerDistance: 1.8 },
      { id: 'pit-inner', zoneId: 'nadir-pit', x: 3.5, y: 10.5, minPlayerDistance: 1.8 },
      { id: 'seal-foyer', zoneId: 'signal-seal', x: 8.5, y: 7.5, minPlayerDistance: 1.8 },
      { id: 'neck-zone', zoneId: 'glass-neck', x: 10.5, y: 7.5, minPlayerDistance: 2.0 },
      { id: 'climb-mid', zoneId: 'threshold-climb', x: 14.5, y: 5.5, minPlayerDistance: 2.0 },
      { id: 'climb-high', zoneId: 'threshold-climb', x: 14.5, y: 3.5, minPlayerDistance: 2.1 },
      { id: 'exit-foyer', zoneId: 'threshold-exit-zone', x: 14.5, y: 1.5, minPlayerDistance: 2.2 }
    ]
  }
};

export const RAYCAST_WORLD_TWO_CATALOG: RaycastLevel[] = [
  RAYCAST_LEVEL_WORLD2_FRACTURE,
  RAYCAST_LEVEL_WORLD2_THRESHOLD
];
