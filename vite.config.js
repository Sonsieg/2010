import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three/examples/jsm')) {
            return 'vendor-three-extras';
          }
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'vendor-confetti';
          }
        }
      }
    }
  }
});
