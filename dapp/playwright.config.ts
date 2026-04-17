import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function loadSharedEnv() {
  const envPath = resolve(__dirname, '../.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (process.env[key]) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadSharedEnv();

export default defineConfig({
  testDir: './e2e',
  timeout:      60_000,   // 60s por test (tx blockchain + React update)
  expect:       { timeout: 30_000 },
  fullyParallel: false,   // tests secuenciales — blockchain comparte estado
  workers:      1,
  retries:      0,
  reporter:     [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]],

  use: {
    baseURL:           'http://localhost:3006',
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
