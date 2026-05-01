export interface RaycastRendererConfig {
  fovRadians: number;
  rayCount: number;
  maxWallHeight: number;
}

export const RAYCAST_RENDERER_CONFIG: RaycastRendererConfig = {
  fovRadians: (82 * Math.PI) / 180,
  rayCount: 160,
  maxWallHeight: 620
};
