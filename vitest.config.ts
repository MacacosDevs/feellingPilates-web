import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  envDir: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('https://api.test.invalid/api') },
  test: {
    environment: 'jsdom',
    globals: false,
    isolate: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
  },
});
