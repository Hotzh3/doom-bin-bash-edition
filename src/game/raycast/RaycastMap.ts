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

export const RAYCAST_TILE = {
  EMPTY: 0,
  WALL: 1,
  INFERNAL_WALL: 2,
  CORRUPT_WALL: 3,
  LOCKED_DOOR: 4
} as const;

export const RAYCAST_MAP: RaycastMap = {
  tileSize: 1,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 2, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 1, 0, 1, 0, 3, 3, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 3, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
};

export const RAYCAST_PLAYER_START = {
  x: 2.4,
  y: 9.4,
  angle: -Math.PI * 0.5,
  velocity: { x: 0, y: 0 }
} as const;

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
