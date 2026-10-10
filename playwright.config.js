// @ts-check
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/serve.js 4173', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    // Firefox z Playwright nie startuje na części kompilacji Windows Insider (błąd SideBySide: mozglue).
    // Działa w CI (Linux) i lokalnie po ustawieniu PW_FIREFOX=1.
    ...(process.env.CI || process.env.PW_FIREFOX ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }] : [])
  ]
});
