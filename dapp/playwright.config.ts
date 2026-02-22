import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout:      60_000,   // 60s por test (tx blockchain + React update)
  expect:       { timeout: 30_000 },
  fullyParallel: false,   // tests secuenciales — blockchain comparte estado
  workers:      1,
  retries:      0,
  reporter:     [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]],

  use: {
    baseURL:           'http://localhost:3000',
    headless:          true,
    viewport:          { width: 1280, height: 800 },
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
