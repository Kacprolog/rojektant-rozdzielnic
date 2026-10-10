// Testy funkcji P0: plik projektu, lista projektów, cofanie, druk.
const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
});

const derived = page => page.evaluate(() => JSON.stringify([buildConns(), bomRows()]));
const asFile = (name, text) => ({ name, mimeType: 'application/json', buffer: Buffer.from(text, 'utf8') });

test.describe('plik projektu', () => {
  test('zapisany plik po wczytaniu daje identyczne połączenia i zestawienie', async ({ page }) => {
    await page.goto('/');
    const before = await derived(page);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bSave')]);
    expect(dl.suggestedFilename()).toMatch(/^Dom jednorodzinny.*\.rozdz\.json$/);
    const text = fs.readFileSync(await dl.path(), 'utf8');
    const j = JSON.parse(text);
    expect(j.app).toBe('projektant-rozdzielnic');
    expect(j.version).toBe(1);
    expect(Object.keys(j.S).sort()).toEqual(['dev', 'enc', 'name', 'rows', 'set']);

    await page.click('#bClear');
    await page.click('#cYes');
    await expect(page.locator('.slot')).toHaveCount(0);
    await page.setInputFiles('#fOpen', asFile('dom.rozdz.json', text));
    await expect(page.locator('.slot')).toHaveCount(21);
    expect(await derived(page)).toBe(before);
  });

  test('niepoprawne pliki są odrzucane z komunikatem i nie zmieniają projektu', async ({ page }) => {
    await page.goto('/');
    const cases = [
      ['to nie json', 'nie jest poprawnym plikiem JSON'],
      [JSON.stringify({ foo: 1 }), 'To nie jest plik Projektanta'],
      [JSON.stringify({ app: 'projektant-rozdzielnic', version: 99, S: {} }), 'nowszej wersji'],
      [JSON.stringify({ app: 'projektant-rozdzielnic', version: 1, S: { rows: [['d1']], dev: {}, enc: { mfr: 'hager' } } }), 'uszkodzony']
    ];
    for (const [text, msg] of cases) {
      await page.setInputFiles('#fOpen', asFile('x.json', text));
      await expect(page.locator('.toast')).toContainText(msg);
      await expect(page.locator('.slot')).toHaveCount(21);
    }
  });

  test('wartości spoza słowników w pliku są sprowadzane do bezpiecznych', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    const j = await page.evaluate(() => exportData());
    const mcb = Object.values(j.S.dev).find(d => d.t === 'mcb' && d.p.poles === 1);
    mcb.c.ph = '"><img src=x onerror=window.__xss=1>';
    mcb.c.kind = 'nieznany';
    mcb.p.In = 'abc';
    await page.setInputFiles('#fOpen', asFile('x.rozdz.json', JSON.stringify(j)));
    await expect(page.locator('.toast')).toContainText('Wczytano projekt');
    const d = await page.evaluate(id => S.dev[id], mcb.id);
    expect(d.c.ph).toBe('L1');
    expect(d.c.kind).toBe('inne');
    expect(d.p.In).toBe(16);
    await page.click('[data-tab="kontrola"]');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(errors).toEqual([]);
  });
});
