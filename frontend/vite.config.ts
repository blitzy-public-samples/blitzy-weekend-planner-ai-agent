/**
 * Vite Configuration for Weekend Planner Frontend
 *
 * This configuration file sets up the Vite 5.x build tool for the Weekend Planner
 * React application. It includes:
 * - React plugin for Fast Refresh and JSX transformation
 * - Development server proxy to route API requests to the ADK backend
 * - Build optimization settings for production deployment
 *
 * @see https://vitejs.dev/config/
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration using defineConfig for type-safe configuration.
 *
 * The configuration enables seamless development with the ADK backend
 * by proxying /api requests to localhost:8000, avoiding CORS issues
 * during local development.
 */
export default defineConfig({
  /**
   * Plugins array
   * - react(): Enables React Fast Refresh for hot module replacement,
   *   JSX transformation, and optimized production builds
   */
  plugins: [react()],

  /**
   * Development server configuration
   * Configures the Vite dev server to run on port 5173 (default)
   * and proxy API requests to the ADK backend
   */
  server: {
    /**
     * Development server port
     * Frontend runs on port 5173 while backend ADK server runs on port 8000
     */
    port: 5173,

    /**
     * Enable strict port - fail if port is already in use
     */
    strictPort: true,

    /**
     * Proxy configuration for development mode API routing
     *
     * Routes all requests starting with /api to the backend ADK server
     * at localhost:8000. This eliminates CORS issues during development
     * by making the browser think all requests are same-origin.
     *
     * Example:
     * - Frontend request: POST /api/run
     * - Proxied to: POST http://localhost:8000/run
     */
    proxy: {
      '/api': {
        /**
         * Target URL for the ADK backend server
         * The backend runs via `adk web` command at this address
         */
        target: 'http://localhost:8000',

        /**
         * Changes the origin header to the target URL
         * Required for proper CORS handling with the backend
         */
        changeOrigin: true,

        /**
         * Rewrite function to strip the /api prefix from requests
         * This allows the frontend to use /api/* paths while the backend
         * receives requests at /* (e.g., /run instead of /api/run)
         *
         * @param path - The original request path
         * @returns The rewritten path with /api prefix removed
         */
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },

  /**
   * Preview server configuration
   * Used when running `npm run preview` to serve the production build locally
   */
  preview: {
    port: 5173,
    strictPort: true,
  },

  /**
   * Build configuration for production deployment
   * Optimizes the bundle for production with proper code splitting
   * and minification settings
   */
  build: {
    /**
     * Output directory for production build
     * Default is 'dist' - assets are output to 'dist/assets'
     */
    outDir: 'dist',

    /**
     * Enable source maps for production debugging
     * Set to false in production to reduce bundle size
     */
    sourcemap: false,

    /**
     * Rollup options for advanced build configuration
     */
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting for better caching
         * Separates vendor dependencies from application code
         */
        manualChunks: {
          /**
           * React and ReactDOM in a separate chunk
           * These rarely change and can be cached longer
           */
          vendor: ['react', 'react-dom'],
        },
      },
    },

    /**
     * Target browser compatibility
     * Using modern ES modules for smaller bundle size
     */
    target: 'esnext',

    /**
     * Minification settings
     * Using esbuild for fast minification (default in Vite 5.x)
     */
    minify: 'esbuild',
  },

  /**
   * Dependency optimization settings
   * Pre-bundles dependencies for faster cold start and page loads
   */
  optimizeDeps: {
    /**
     * Dependencies to include in pre-bundling
     * React and ReactDOM are pre-bundled for optimal performance
     */
    include: ['react', 'react-dom'],
  },
});
