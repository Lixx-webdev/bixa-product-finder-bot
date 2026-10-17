import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5057',
        changeOrigin: true
      },
      '/product-finder': {
        target: 'http://localhost:5057',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/embed.jsx'),
      name: 'BixaProductFinder',
      fileName: (format) => `bixa-product-finder.${format}.js`,
      formats: ['iife', 'umd', 'es']
    }
  }
});
