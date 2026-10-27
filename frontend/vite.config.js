import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Library mode leaves process.env.* untouched, but `process` doesn't exist in the browser — without
  // this the embed bundle throws "process is not defined" on load (React and embed.jsx both read it).
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
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
}));
