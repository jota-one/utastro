import { defineConfig, devices } from '@playwright/test'

// Load tests/e2e/.env if present (sourced by tests/e2e/run.sh)
// Variables are expected in process.env before this runs.

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    locale: 'fr-CH',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
