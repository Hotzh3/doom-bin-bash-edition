import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser-vendor';
          }
          return undefined;
        }
      }
    },
    chunkSizeWarningLimit: 1600
  }
});
