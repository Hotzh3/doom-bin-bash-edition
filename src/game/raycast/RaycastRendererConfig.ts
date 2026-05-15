export interface RaycastRendererConfig {
  fovRadians: number;
  rayCount: number;
  maxWallHeight: number;
}

export const RAYCAST_RENDERER_CONFIG: RaycastRendererConfig = {
  fovRadians: (108.24 * Math.PI) / 180,
  rayCount: 160,
  maxWallHeight: 620
};
