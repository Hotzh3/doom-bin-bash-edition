export interface RaycastHit {
  distance: number;
  correctedDistance: number;
  wallType: number;
  hitX: number;
  hitY: number;
  rayAngle: number;
}

export interface RaycastMap {
  grid: number[][];
  tileSize: number;
}

export interface RaycastPlayerStart {
  x: number;
  y: number;
  angle: number;
  velocity: {
    x: number;
    y: number;
  };
}

export const RAYCAST_TILE = {
  EMPTY: 0,
  WALL: 1,
  INFERNAL_WALL: 2,
  CORRUPT_WALL: 3,
  LOCKED_DOOR: 4
} as const;

/** Episode 1 hub — expanded east annex + southern catacombs (flat Wolf/Doom-style; no real vertical planes). */
export const RAYCAST_MAP_LEVEL_1: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 2, 2, 2, 0, 1, 0, 1, 0, 2, 2, 2, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 2, 1, 0, 1, 2, 2, 0, 2, 2, 2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 2, 2, 2, 0, 2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 4, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 3, 3, 3, 0, 1, 0, 1, 0, 2, 0, 2, 0, 2, 2, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 3, 3, 3, 0, 1, 0, 2, 2, 2, 2, 0, 2, 0, 0, 0, 2, 4, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_1: RaycastPlayerStart = {
  x: 2.5,
  y: 12.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

export const RAYCAST_MAP_LEVEL_2: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 0, 0, 0, 1, 1, 0, 3, 3, 3, 0, 0, 1],
    [1, 0, 2, 0, 0, 1, 0, 0, 1, 0, 3, 0, 3, 0, 0, 1],
    [1, 0, 2, 0, 0, 1, 1, 0, 1, 0, 3, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 4, 0, 3, 3, 3, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 3, 0, 1, 1],
    [1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 3, 3, 3, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_2: RaycastPlayerStart = {
  x: 2.5,
  y: 10.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

export const RAYCAST_MAP_LEVEL_3: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 0, 0, 0, 1, 0, 1, 0, 3, 3, 3, 0, 1, 0, 1],
    [1, 0, 2, 0, 0, 0, 1, 0, 1, 0, 1, 0, 3, 0, 3, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 0, 1, 0, 1, 0, 1, 0, 3, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 1, 0, 3, 3, 3, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 3, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 4, 0, 1, 0, 3, 0, 0, 0, 1],
    [1, 0, 3, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 3, 3, 1, 0, 1],
    [1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 3, 3, 3, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_3: RaycastPlayerStart = {
  x: 2.5,
  y: 13.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

/** Crimson pressure route — distinct from catacomb relay. */
export const RAYCAST_MAP_LEVEL_4: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 0, 1, 0, 2, 2, 2, 0, 1, 0, 2, 2, 0, 1],
    [1, 0, 2, 0, 1, 0, 0, 2, 0, 2, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 2, 0, 1, 1, 0, 2, 0, 2, 0, 1, 1, 2, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 0, 4, 0, 1, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 2, 0, 1, 0, 1, 0, 0, 0, 2, 2, 0, 1],
    [1, 0, 0, 0, 0, 2, 0, 0, 0, 1, 1, 1, 0, 2, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 2, 2, 0, 1],
    [1, 0, 0, 0, 3, 3, 3, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 3, 0, 3, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_4: RaycastPlayerStart = {
  x: 2.5,
  y: 13.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

/** Dark gate approach — forked sleeves, heavier ambush pockets. */
export const RAYCAST_MAP_LEVEL_5: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 3, 3, 3, 0, 0, 1, 0, 2, 2, 2, 0, 1, 0, 0, 1],
    [1, 0, 3, 0, 0, 0, 1, 1, 0, 2, 0, 2, 0, 1, 0, 1, 1],
    [1, 0, 3, 0, 1, 0, 1, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 2, 2, 2, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 1, 1],
    [1, 0, 0, 0, 1, 1, 0, 4, 0, 2, 2, 2, 0, 0, 0, 0, 1],
    [1, 0, 2, 1, 1, 0, 1, 1, 1, 1, 0, 2, 0, 1, 1, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 2, 2, 1, 1, 1, 0, 2, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_5: RaycastPlayerStart = {
  x: 2.5,
  y: 13.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

/** World 2 fracture variant — asymmetric ring with cleaner flanking routes. */
export const RAYCAST_MAP_LEVEL_6: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 0, 1, 1, 0, 2, 2, 0, 0, 2, 2, 0, 1],
    [1, 0, 2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 2, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 2, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 0, 4, 0, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 0, 0, 1, 0, 1, 1, 0, 0, 2, 2, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 2, 0, 0, 1],
    [1, 1, 1, 0, 2, 2, 0, 1, 0, 1, 0, 1, 0, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 2, 2, 0, 1],
    [1, 0, 1, 1, 0, 3, 3, 3, 0, 1, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_6: RaycastPlayerStart = {
  x: 5.5,
  y: 13.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

/** World 3 gate variant — infernal loop with central choke to force rotation. */
export const RAYCAST_MAP_LEVEL_7: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 2, 2, 0, 0, 1],
    [1, 0, 3, 3, 3, 0, 0, 1, 0, 2, 0, 2, 0, 2, 0, 0, 1],
    [1, 0, 3, 0, 0, 0, 1, 1, 0, 2, 0, 2, 0, 2, 0, 1, 1],
    [1, 0, 3, 0, 1, 0, 1, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 1, 1, 0, 2, 0, 2, 2, 2, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 1, 1],
    [1, 0, 0, 0, 1, 1, 0, 4, 0, 2, 2, 2, 0, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 1, 0, 2, 0, 2, 0, 1, 1, 0, 1],
    [1, 0, 2, 0, 1, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 1, 1, 1, 0, 2, 0, 2, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_7: RaycastPlayerStart = {
  x: 1.5,
  y: 13.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

/** World 3 ramp variant — wide industrial sweep with east service sleeve preserved. */
export const RAYCAST_MAP_LEVEL_8: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 2, 2, 2, 0, 1, 0, 1, 0, 2, 2, 2, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 2, 1, 0, 1, 2, 2, 0, 2, 2, 2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 2, 2, 2, 0, 2, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 4, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 3, 3, 3, 0, 1, 0, 1, 0, 2, 0, 2, 0, 2, 2, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 3, 3, 3, 0, 1, 0, 2, 2, 2, 2, 0, 2, 0, 0, 0, 2, 4, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_LEVEL_8: RaycastPlayerStart = {
  x: 2.5,
  y: 12.5,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
};

/** Boss arena — open core with pillar breaks. */
export const RAYCAST_MAP_BOSS: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START_BOSS: RaycastPlayerStart = {
  x: 2.5,
  y: 7.5,
  angle: 0,
  velocity: { x: 0, y: 0 }
};

export const RAYCAST_MAP = RAYCAST_MAP_LEVEL_1;
export const RAYCAST_PLAYER_START = RAYCAST_PLAYER_START_LEVEL_1;

const MAX_RAY_DISTANCE = 20;
const RAY_STEP = 0.025;

export function isWallAt(map: RaycastMap, x: number, y: number): boolean {
  const tileX = Math.floor(x / map.tileSize);
  const tileY = Math.floor(y / map.tileSize);

  if (tileY < 0 || tileY >= map.grid.length || tileX < 0 || tileX >= map.grid[0].length) return true;
  return map.grid[tileY][tileX] > 0;
}

export function getWallTypeAt(map: RaycastMap, x: number, y: number): number {
  const tileX = Math.floor(x / map.tileSize);
  const tileY = Math.floor(y / map.tileSize);

  if (tileY < 0 || tileY >= map.grid.length || tileX < 0 || tileX >= map.grid[0].length) return 1;
  return map.grid[tileY][tileX];
}

export function castRay(map: RaycastMap, originX: number, originY: number, rayAngle: number, cameraAngle: number): RaycastHit {
  const rayDirX = Math.cos(rayAngle);
  const rayDirY = Math.sin(rayAngle);

  for (let distance = RAY_STEP; distance <= MAX_RAY_DISTANCE; distance += RAY_STEP) {
    const hitX = originX + rayDirX * distance;
    const hitY = originY + rayDirY * distance;

    if (isWallAt(map, hitX, hitY)) {
      return {
        distance,
        correctedDistance: Math.max(0.001, distance * Math.cos(rayAngle - cameraAngle)),
        wallType: getWallTypeAt(map, hitX, hitY),
        hitX,
        hitY,
        rayAngle
      };
    }
  }

  return {
    distance: MAX_RAY_DISTANCE,
    correctedDistance: MAX_RAY_DISTANCE,
    wallType: 1,
    hitX: originX + rayDirX * MAX_RAY_DISTANCE,
    hitY: originY + rayDirY * MAX_RAY_DISTANCE,
    rayAngle
  };
}
