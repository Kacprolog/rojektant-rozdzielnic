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
    expect(Object.keys(j.S).sort()).toEqual(['conn', 'dev', 'enc', 'name', 'rows', 'set', 'wmode']);

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
      [
        JSON.stringify({
          app: 'projektant-rozdzielnic',
          version: 1,
          S: { rows: [['d1']], dev: {}, enc: { mfr: 'hager' } }
        }),
        'uszkodzony'
      ]
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

  test('wczytany plik staje się nowym projektem i nie nadpisuje bieżącego', async ({ page }) => {
    await page.goto('/');
    const text = await page.evaluate(() => JSON.stringify(Object.assign(exportData(), {})));
    await page.setInputFiles('#fOpen', asFile('dom.rozdz.json', text));
    await expect(page.locator('#projSel option')).toHaveCount(2);
    await expect(page.locator('.slot')).toHaveCount(21);
  });
});

test.describe('lista projektów', () => {
  test('nowy, przełączanie, duplikat, zmiana nazwy, usunięcie z potwierdzeniem, trwałość', async ({ page }) => {
    await page.goto('/');
    const opts = page.locator('#projSel option');
    await expect(opts).toHaveCount(1);

    await page.click('#bNew');
    await expect(opts).toHaveCount(2);
    await expect(page.locator('.slot')).toHaveCount(0);
    await expect(page.locator('#pname')).toHaveValue('Nowy projekt');

    await page.fill('#pname', 'Garaż');
    await expect(opts.nth(1)).toHaveText('Garaż');

    await page.selectOption('#projSel', { index: 0 });
    await expect(page.locator('.slot')).toHaveCount(21);

    await page.click('#bDup');
    await expect(opts).toHaveCount(3);
    await expect(page.locator('#pname')).toHaveValue(/\(kopia\)$/);
    await expect(page.locator('.slot')).toHaveCount(21);

    // Usunięcie wymaga potwierdzenia na stronie; „Anuluj” niczego nie usuwa.
    await page.click('#bDel');
    await expect(page.locator('#confirm')).toContainText('(kopia)');
    await page.click('#cNo');
    await expect(opts).toHaveCount(3);
    await page.click('#bDel');
    await page.click('#cYes');
    await expect(opts).toHaveCount(2);

    await page.reload();
    await expect(opts).toHaveCount(2);
    await expect(opts.nth(1)).toHaveText('Garaż');
  });

  test('historia cofania jest osobna dla każdego projektu', async ({ page }) => {
    await page.goto('/');
    if (await page.locator('#lib').isHidden()) await page.click('#bLib'); // szuflada biblioteki
    await page.locator('.libitem', { hasText: 'MCB B16 1P' }).click();
    await expect(page.locator('#bUndo')).toBeEnabled();
    await page.click('#bNew');
    await expect(page.locator('#bUndo')).toBeDisabled();
  });

  test('usunięcie ostatniego projektu zostawia pusty projekt', async ({ page }) => {
    await page.goto('/');
    await page.click('#bDel');
    await page.click('#cYes');
    await expect(page.locator('#projSel option')).toHaveCount(1);
    await expect(page.locator('.slot')).toHaveCount(0);
    await expect(page.locator('#pname')).toHaveValue('Nowy projekt');
  });
});

test.describe('cofnij / ponów', () => {
  test('przyciski cofają i ponawiają zmiany danych, a zmiany widoku pomijają', async ({ page }) => {
    await page.goto('/');
    const undo = page.locator('#bUndo'),
      redo = page.locator('#bRedo'),
      slots = page.locator('.slot');
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    // Zmiany widoku: okablowanie, zakładka, zaznaczenie, filtr żył, wyszukiwanie.
    await page.click('[data-view="wires"]');
    await page.click('[data-wf="N"]');
    await page.click('[data-tab="bilans"]');
    await slots.first().click();
    if (await page.locator('#lib').isHidden()) await page.click('#bLib'); // szuflada biblioteki
    await page.fill('#libSearch', 'B16');
    await page.fill('#libSearch', '');
    await expect(undo).toBeDisabled();

    if (await page.locator('#lib').isHidden()) await page.click('#bLib'); // szuflada biblioteki

    await page.locator('.libitem', { hasText: 'MCB B16 1P' }).click();
    await expect(slots).toHaveCount(22);
    await page.keyboard.press('Delete');
    await expect(slots).toHaveCount(21);

    await undo.click();
    await expect(slots).toHaveCount(22);
    await undo.click();
    await expect(slots).toHaveCount(21);
    await expect(undo).toBeDisabled();
    await redo.click();
    await expect(slots).toHaveCount(22);
    await redo.click();
    await expect(slots).toHaveCount(21);
    await expect(redo).toBeDisabled();
  });

  test('skróty klawiszowe, cofnięcie „Wyczyść” i przywrócenie identycznego modelu', async ({ page }) => {
    await page.goto('/');
    const before = await derived(page);
    await page.click('#bClear');
    await page.click('#cYes');
    await expect(page.locator('.slot')).toHaveCount(0);
    await page.locator('body').click({ position: { x: 2, y: 2 } });
    await page.keyboard.press('Control+z');
    await expect(page.locator('.slot')).toHaveCount(21);
    expect(await derived(page)).toBe(before);
    await page.keyboard.press('Control+Shift+Z');
    await expect(page.locator('.slot')).toHaveCount(0);
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');
    await expect(page.locator('.slot')).toHaveCount(0);
  });

  test('pisanie w polu to jeden krok cofania; nowa zmiana kasuje „Ponów”', async ({ page }) => {
    await page.goto('/');
    await page.locator('.slot').nth(8).click();
    const name = await page.inputValue('#iName');
    await page.locator('#iName').pressSequentially(' abc');
    await page.locator('body').click({ position: { x: 2, y: 2 } });
    await page.click('#bUndo');
    await expect(page.locator('#iName')).toHaveValue(name);
    await expect(page.locator('#bUndo')).toBeDisabled();
    await expect(page.locator('#bRedo')).toBeEnabled();
    await page.click('#bBalance');
    await expect(page.locator('#bRedo')).toBeDisabled();
  });

  test('stos ma limit 50 kroków', async ({ page }) => {
    await page.goto('/');
    const n = await page.evaluate(() => {
      for (let i = 0; i < 60; i++) {
        S.set.moc = 10 + i;
        render();
      }
      return HIST.u.length;
    });
    expect(n).toBe(50);
  });
});

test.describe('druk / PDF', () => {
  test('buduje 4 strony z frontem, okablowaniem, strukturą i zestawieniem; nie zmienia widoku', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.evaluate(() => {
      window.print = () => {
        window.__printed = (window.__printed || 0) + 1;
      };
    });
    await page.locator('.slot').nth(3).click();
    await page.click('#bPrint');
    expect(await page.evaluate(() => window.__printed)).toBe(1);

    const pages = page.locator('#print .ppage');
    await expect(pages).toHaveCount(5);
    for (let i = 0; i < 5; i++) await expect(pages.nth(i).locator('.phead')).toContainText('Dom jednorodzinny');
    await expect(pages.nth(0).locator('.slot')).toHaveCount(21);
    await expect(pages.nth(0).locator('svg.wires')).toHaveCount(0);
    await expect(pages.nth(1).locator('svg.wires')).toHaveCount(1);
    expect(await pages.nth(1).locator('svg.wires path.w').count()).toBeGreaterThan(30);
    await expect(pages.nth(2).locator('svg.schem [data-sid]')).toHaveCount(19);
    await expect(pages.nth(3)).toContainText('WLZ');
    await expect(pages.nth(3).locator('.issue').first()).toBeAttached();
    await expect(pages.nth(4)).toContainText('Szyna grzebieniowa');
    await expect(pages.nth(4)).toContainText('YKY 4×10');

    // Obudowa mieści się na stronie A4 poziomo (obszar roboczy ok. 1047 × 718 px).
    const fit = await page.evaluate(() =>
      [...document.querySelectorAll('#print .pfit')].map(e => [parseFloat(e.style.width), parseFloat(e.style.height)])
    );
    for (const [w, h] of fit) {
      expect(w).toBeLessThanOrEqual(1040);
      expect(h).toBeLessThanOrEqual(570);
    }

    // Ekran bez zmian: widok frontu, zaznaczenie zachowane, #print ukryty.
    await expect(page.locator('#board svg.wires')).toHaveCount(0);
    await expect(page.locator('#board .slot.sel')).toHaveCount(1);
    await expect(page.locator('#print')).toBeHidden();
    await expect(page.locator('#bUndo')).toBeDisabled();

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#print')).toBeVisible();
    await expect(page.locator('.app')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('przewody na wydruku trafiają w zaciski tak samo jak na ekranie', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.click('[data-view="wires"]');
    const screen = await page.evaluate(() => document.querySelector('#board svg.wires').innerHTML);
    await page.click('#bPrint');
    const printed = await page.evaluate(() => document.querySelector('#print svg.wires').innerHTML);
    expect(printed).toBe(screen);
  });
});
