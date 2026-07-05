/**
 * PizzaFlow — Vite Configuration
 * @see https://vitejs.dev/config/
 */
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const r = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Base path for GitHub Pages deployment
  base: process.env.GITHUB_ACTIONS ? '/appjcinformatica/' : '/',

  // Root directory (where index.html is located)
  root: '.',

  // Static assets directory
  publicDir: 'public',

  // Dev server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/gerenciador': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/painel.js': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/painel.css': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/firebase-config.js': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          if (id.includes('/src/js/components/')) return 'components';
          if (id.includes('/src/js/pages/'))      return 'pages';
          if (id.includes('/src/js/services/'))   return 'services';
        }
      }
    }
  },

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@':           r('./src'),
      '@js':         r('./src/js'),
      '@css':        r('./src/css'),
      '@components': r('./src/js/components'),
      '@pages':      r('./src/js/pages'),
      '@services':   r('./src/js/services'),
      '@store':      r('./src/js/store'),
      '@utils':      r('./src/js/utils'),
      '@data':       r('./src/js/data'),
      '@router':     r('./src/js/router'),
    }
  }
});
