import type { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

const config: PlaywrightTestConfig = {
  testDir: path.resolve(__dirname, 'tests/e2e'),
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${process.env.PORT || 3000}`,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/report.json' }],
  ],
  globalSetup: path.resolve(__dirname, 'tests/e2e/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'tests/e2e/global-teardown.ts'),
};

export default config;