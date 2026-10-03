import { randomUUID } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

const readinessToken = process.env.WEB_UX_TEST_READY ?? randomUUID();
process.env.WEB_UX_TEST_READY = readinessToken;
const baseURL = 'http://127.0.0.1:4179';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results',
  use: { baseURL, serviceWorkers: 'block', trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/e2e/server.ts',
    url: `${baseURL}/__test_ready/${readinessToken}`,
    env: { WEB_UX_TEST_READY: readinessToken },
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
});
