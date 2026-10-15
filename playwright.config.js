// @ts-check
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  // W CI jedna ponowna próba: maszyny CI bywają wolne dla WebKit. Test, który przejdzie dopiero za drugim razem, raport oznacza jako „flaky”.
  retries: process.env.CI ? 1 : 0,
  // Service worker zablokowany: page.route() nie widzi zapytań, które on obsługuje. Test PWA włącza go u siebie.
  // reducedMotion: bez ciągłej animacji przepływu prądu (aplikacja respektuje „ogranicz ruch”); na wolnych maszynach CI
  // z WebKit przerysowywanie dużego SVG w każdej klatce nie pozwalało Playwrightowi doczekać się stabilnego elementu.
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    reducedMotion: 'reduce'
  },
  // Osobny port i zawsze świeży serwer: testy nie mogą trafić w serwer uruchomiony z innej kopii projektu.
  webServer: { command: 'node scripts/serve.js 4174', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    // WebKit w CI (Linux, bez akceleracji grafiki) rysuje klatkę widoku okablowania ok. 200–300 ms (lokalnie ok. 25 ms;
    // pomiar: scripts/ci-klatki.js), więc każde kliknięcie czeka kilka sekund na stabilny element. Dłuższy limit tylko tam.
    { name: 'safari', use: { ...devices['Desktop Safari'] }, timeout: process.env.CI ? 90000 : 30000 },
    // Firefox z Playwright nie startuje na części kompilacji Windows Insider (błąd SideBySide: mozglue).
    // Działa w CI (Linux) i lokalnie po ustawieniu PW_FIREFOX=1.
    ...(process.env.CI || process.env.PW_FIREFOX ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }] : [])
  ]
});
