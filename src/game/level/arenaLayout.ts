import type { SpawnPoint, SpawnRequest } from '../systems/GameDirector';

export interface RectArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerSpawn {
  x: number;
  y: number;
}

export interface KeyPickup {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  unlocksDoorId: string;
}

export interface LockedDoor extends RectArea {
  keyId: string;
  killsRequired: number;
  openObjectiveText: string;
  lockedObjectiveText: string;
}

export interface LevelTrigger extends RectArea {
  once: boolean;
  doorId?: string;
  spawns: SpawnRequest[];
  objectiveText: string;
}

export interface SecretPickup {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  objectiveText: string;
}

export interface ArenaLayout {
  name: string;
  playerSpawns: {
    p1: PlayerSpawn;
    p2: PlayerSpawn;
  };
  enemySpawns: SpawnPoint[];
  initialSpawns: SpawnRequest[];
  walls: RectArea[];
  keys: KeyPickup[];
  doors: LockedDoor[];
  triggers: LevelTrigger[];
  secrets: SecretPickup[];
  key: KeyPickup;
  exitDoor: LockedDoor;
  combatTrigger: LevelTrigger;
}

const keys: KeyPickup[] = [
  {
    id: 'corruption-key',
    label: 'Corruption Key',
    x: 814,
    y: 86,
    radius: 22,
    unlocksDoorId: 'foundry-gate'
  }
];

const doors: LockedDoor[] = [
  {
    id: 'foundry-gate',
    x: 512,
    y: 306,
    width: 36,
    height: 126,
    keyId: 'corruption-key',
    killsRequired: 0,
    openObjectiveText: 'Gate open: push into the corrupted chamber',
    lockedObjectiveText: 'Gate locked: find the corruption key in the north room'
  }
];

const triggers: LevelTrigger[] = [
  {
    id: 'foundry-ambush',
    x: 705,
    y: 356,
    width: 118,
    height: 100,
    once: true,
    doorId: 'foundry-gate',
    objectiveText: 'Ambush active: survive the chamber',
    spawns: [
      { x: 840, y: 190, kind: 'STALKER' },
      { x: 850, y: 456, kind: 'GRUNT' },
      { x: 620, y: 458, kind: 'RANGED' }
    ]
  },
  {
    id: 'north-room-pressure',
    x: 742,
    y: 96,
    width: 134,
    height: 96,
    once: true,
    doorId: 'foundry-gate',
    objectiveText: 'Key room breached: fight back to the gate',
    spawns: [
      { x: 675, y: 168, kind: 'GRUNT' },
      { x: 874, y: 154, kind: 'STALKER' }
    ]
  }
];

const secrets: SecretPickup[] = [
  {
    id: 'warm-cache',
    label: 'Hidden Cache',
    x: 104,
    y: 474,
    radius: 18,
    objectiveText: 'Secret found: hidden cache recovered'
  }
];

export const DARK_FOUNDRY_LAYOUT: ArenaLayout = {
  name: 'Dark Foundry',
  playerSpawns: {
    p1: { x: 118, y: 302 },
    p2: { x: 172, y: 248 }
  },
  enemySpawns: [
    { x: 846, y: 98 },
    { x: 844, y: 430 },
    { x: 620, y: 456 },
    { x: 680, y: 154 },
    { x: 304, y: 104 }
  ],
  initialSpawns: [
    { x: 304, y: 116, kind: 'GRUNT' },
    { x: 374, y: 430, kind: 'GRUNT' },
    { x: 662, y: 154, kind: 'RANGED' }
  ],
  walls: [
    { id: 'start-north-wall', x: 190, y: 170, width: 300, height: 34 },
    { id: 'start-south-wall', x: 208, y: 374, width: 336, height: 34 },
    { id: 'west-secret-bulkhead', x: 170, y: 456, width: 210, height: 30 },
    { id: 'north-corridor-left', x: 444, y: 96, width: 34, height: 184 },
    { id: 'north-corridor-right', x: 556, y: 96, width: 34, height: 184 },
    { id: 'key-room-south', x: 744, y: 176, width: 340, height: 32 },
    { id: 'key-room-west-cap', x: 612, y: 84, width: 32, height: 150 },
    { id: 'central-spine-top', x: 512, y: 224, width: 36, height: 96 },
    { id: 'central-spine-bottom', x: 512, y: 400, width: 36, height: 140 },
    { id: 'lower-corridor-north', x: 650, y: 286, width: 238, height: 30 },
    { id: 'lower-corridor-south', x: 650, y: 426, width: 238, height: 30 },
    { id: 'combat-room-west-cover', x: 724, y: 250, width: 34, height: 92 },
    { id: 'combat-room-east-cover', x: 846, y: 354, width: 34, height: 112 }
  ],
  keys,
  doors,
  triggers,
  secrets,
  key: keys[0],
  exitDoor: doors[0],
  combatTrigger: triggers[0]
};

export function isPointInsideRect(point: PlayerSpawn, rect: Pick<RectArea, 'x' | 'y' | 'width' | 'height'>): boolean {
  const halfWidth = rect.width * 0.5;
  const halfHeight = rect.height * 0.5;

  return (
    point.x >= rect.x - halfWidth &&
    point.x <= rect.x + halfWidth &&
    point.y >= rect.y - halfHeight &&
    point.y <= rect.y + halfHeight
  );
}

export function canOpenDoor(hasKey: boolean, kills: number, door: LockedDoor): boolean {
  return hasKey && kills >= door.killsRequired;
}
