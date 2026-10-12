import { defineConfig } from '@playwright/test'

const label = process.env.SCREENSHOT_TEST_LABEL || 'current'

export default defineConfig({
  testDir: './tests',
  outputDir: `./test-results/${label}`,
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: [
    ['list'],
    ['json', { outputFile: `./test-results/${label}-report.json` }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4178',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
  },
  projects: [
    { name: 'desktop-dark', use: { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' } },
    {
      name: 'mobile-light',
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' },
    },
  ],
  webServer: {
    command: 'node tests/serve.mjs',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: false,
  },
})
