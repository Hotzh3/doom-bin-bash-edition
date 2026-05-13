import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser-vendor';
          }
          /**
           * Raycast scenes only — split from `game-raycast` library without pulling Menu/Arena
           * (those share imports and caused Rollup circular chunk warnings when split separately).
           */
          if (
            id.includes('/src/game/scenes/RaycastScene') ||
            id.includes('/src/game/scenes/RaycastWorldLockedScene')
          ) {
            return 'game-raycast-scenes';
          }
          /** Isolate raycast module graph — smaller cache invalidation than whole app chunk; parallel fetch. */
          if (id.includes('/src/game/raycast/')) {
            return 'game-raycast';
          }
          return undefined;
        }
      }
    },
    chunkSizeWarningLimit: 1600
  }
});
