import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'src/__mocks__', 'src/__tests__', 'src/main.tsx']
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'e2e/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist']
  }
});
