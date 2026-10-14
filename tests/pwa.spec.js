// Praca offline i instalacja (PWA): manifest, service worker, lista plików w pamięci podręcznej, przycisk „Zainstaluj”.
const { test, expect } = require('@playwright/test');

const assets = async request => {
  const sw = await (await request.get('/sw.js')).text();
  return JSON.parse(
    /const ASSETS = (\[[\s\S]*?\]);/
      .exec(sw)[1]
      .replace(/'/g, '"')
      .replace(/,\s*\]/, ']')
  );
};

test('lista plików service workera jest kompletna i każdy plik istnieje', async ({ page, request }) => {
  const list = await assets(request);
  await page.goto('/');
  // wszystko, co strona wczytuje: skrypty, style, manifest, ikony, czcionki z fonts.css
  const used = await page.evaluate(() =>
    [...document.querySelectorAll('script[src], link[href]')].map(e => e.getAttribute('src') || e.getAttribute('href'))
  );
  const fontsCss = await (await request.get('/css/fonts.css')).text();
  const fonts = [...fontsCss.matchAll(/url\(\.\.\/(fonts\/[^)]+)\)/g)].map(m => m[1]);
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  const icons = manifest.icons.map(i => i.src);
  for (const f of [...used, ...fonts, ...icons]) expect(list, 'brak w ASSETS: ' + f).toContain(f);
  for (const f of list) expect((await request.get('/' + f.replace(/^\.\//, ''))).status(), f).toBe(200);
});

test('manifest opisuje aplikację i jest podany z właściwym typem', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.headers()['content-type']).toContain('application/manifest+json');
  const m = await res.json();
  expect([m.name, m.lang, m.display, m.start_url]).toEqual(['Projektant Rozdzielnic', 'pl', 'standalone', './']);
  expect(m.icons.some(i => i.purpose === 'maskable')).toBe(true);
  expect(m.icons.some(i => i.sizes === '512x512')).toBe(true);
});

test('przycisk „Zainstaluj” pojawia się dopiero po zgłoszeniu przeglądarki i wywołuje jej okno', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#bInstall')).toBeHidden();
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => {
      window.__prompted = (window.__prompted || 0) + 1;
    };
    window.dispatchEvent(e);
  });
  await expect(page.locator('#bInstall')).toBeVisible();
  await page.click('#bInstall');
  expect(await page.evaluate(() => window.__prompted)).toBe(1);
  await expect(page.locator('#bInstall')).toBeHidden();
});

test.describe('bez internetu', () => {
  test.use({ serviceWorkers: 'allow' });
  test('po pierwszej wizycie aplikacja uruchamia się bez sieci', async ({ page, context, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit nie obsługuje trybu offline dla service workera');
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // od teraz stroną steruje service worker
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.locator('.slot')).toHaveCount(21);
      await page.click('[data-view="schem"]');
      await expect(page.locator('svg.schem')).toHaveCount(1);
      // czcionki też z pamięci podręcznej
      expect(await page.evaluate(() => document.fonts.check('600 16px "Barlow Condensed"'))).toBe(true);
    } finally {
      await context.setOffline(false);
    }
  });
});
