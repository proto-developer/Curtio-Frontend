import { defineConfig, devices } from '@playwright/test';

// Headed Chrome instances are far heavier on the single on-demand Vite dev
// server than headless ones. Halving the worker count keeps that contention
// from tipping navigations over their timeout.
const HEADED = process.argv.includes('--headed') || process.argv.includes('--ui');

export default defineConfig({
  testDir: './e2e',
  // Headroom for the on-demand Vite dev server under parallel (and --headed) load.
  timeout: 45000,
  expect: {
    // Rides out Vite's first-run re-optimize reload and slow async re-renders
    // (e.g. the sidebar's getPlan()) when the dev server is under parallel load.
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry absorbs dev-server contention under --headed without hiding
  // real failures (a genuine bug fails the retry too).
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : HEADED ? 2 : undefined,
  // CI: GitHub annotations on failing lines + a self-contained HTML report to
  // upload as an artifact. Local: the usual HTML report.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : 'html',
  // Pre-compile every route once so the workers hit warm modules.
  globalSetup: './e2e/global-setup.js',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
