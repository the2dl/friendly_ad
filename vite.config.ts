import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    // Development-specific settings
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        // Remove the /api prefix when forwarding to the backend
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    } : undefined
  },
  // Look for .env files in the parent directory
  // envDir: '../',
  // Add development-specific env variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY),
  },
}));