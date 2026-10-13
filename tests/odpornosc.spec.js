// Odporność na złe dane: wstrzyknięcie HTML przez nazwy, parametry spoza zakresu, uszkodzone wpisy, zakresy ustawień.
// Każdy test odtwarza błąd znaleziony w przeglądzie kodu (wersja 0.14.0).
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
});

const EVIL = '</option></select><img src=x onerror="window.__x=1"><b id="inj">';

test('nazwa aparatu z HTML nie jest wykonywana nigdzie w interfejsie ani po wczytaniu z pliku', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Każdy aparat i projekt dostaje złośliwą nazwę; przechodzimy przez wszystkie zakładki, widoki, symulację i wydruk.
  const run = async () => {
    await page.evaluate(() => { window.print = () => {}; });
    for (const tab of ['aparat', 'kontrola', 'bilans', 'struktura', 'kable', 'bom']) await page.click(`[data-tab="${tab}"]`);
    for (const t of ['mcb', 'rcd', 'meter', 'contactor', 'rcbo']) {
      await page.evaluate(x => { S.sel = Object.values(S.dev).find(d => d.t === x).id; S.tab = 'aparat'; render(); }, t);
    }
    await page.click('[data-view="wires"]');
    await page.click('[data-wmode="manual"]');
    await page.click('[data-wact="adopt"]');
    await page.evaluate(() => { wireSel = S.conn[5].id; render(true); });
    await page.click('#bSim');
    await page.click('[data-sim="short"]');
    await page.click('[data-sim="leak"]');
    await page.click('#bSim');
    await page.click('#bPrint');
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => [window.__x, document.querySelectorAll('#inj, img').length])).toEqual([undefined, 0]);
  };
  await page.evaluate(evil => { Object.values(S.dev).forEach(d => { d.name = evil; }); S.name = evil; render(); }, EVIL);
  await run();
  await page.evaluate(() => { S.sel = Object.values(S.dev).find(d => d.t === 'mcb').id; S.tab = 'aparat'; render(); });
  await expect(page.locator('#iRcd option').nth(1)).toContainText('<img src=x');   // nazwa pokazana jako tekst

  // To samo przez plik projektu (nowy projekt na liście).
  const file = await page.evaluate(() => JSON.stringify(exportData()));
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.setInputFiles('#fOpen', { name: 'x.rozdz.json', mimeType: 'application/json', buffer: Buffer.from(file) });
  await expect(page.locator('#projSel option')).toHaveCount(2);
  await run();
  expect(errors).toEqual([]);
});

test('plik z parametrami aparatów spoza typoszeregu wczytuje się z wartościami dozwolonymi', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const j = await page.evaluate(() => exportData());
  const by = t => Object.values(j.S.dev).find(d => d.t === t);
  by('sw').p.poles = 7; by('rcd').p.poles = 3; by('rcbo').p.poles = 99; by('contactor').p.poles = 0; by('meter').p.ph = 2;
  by('mcb').p.poles = -1; by('mcb').p.In = 0; by('mcb').p.icn = 'x';
  j.S.set.ks = 5; j.S.set.cos = 3; j.S.name = 'Spoza zakresu';
  await page.setInputFiles('#fOpen', { name: 'x.rozdz.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(j)) });
  await expect(page.locator('.toast')).toContainText('Wczytano projekt „Spoza zakresu”');
  await expect(page.locator('.slot')).toHaveCount(21);
  const got = await page.evaluate(() => { const by = t => Object.values(S.dev).find(d => d.t === t).p; return [by('sw').poles, by('rcd').poles, by('rcbo').poles, by('contactor').poles, by('meter').ph, by('mcb').poles, by('mcb').In, by('mcb').icn, S.set.ks, S.set.cos]; });
  expect(got).toEqual([3, 4, 2, 2, 3, 1, 16, 6, 1, 1]);
  await page.click('[data-view="wires"]');
  await expect(page.locator('svg.wires')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('projektu, którego nie da się wczytać, aplikacja nie usuwa z pamięci przeglądarki', async ({ page }) => {
  await page.click('#bNew');
  await page.fill('#pname', 'Drugi projekt');
  await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('rozdz-v2')); j.list[1].S.rows = [['d999']]; j.cur = j.list[0].id; localStorage.setItem('rozdz-v2', JSON.stringify(j)); });
  await page.reload();
  await expect(page.locator('#projSel option')).toHaveCount(1);
  // Zmiana w działającym projekcie wymusza zapis; uszkodzony wpis nadal jest w pamięci, bez zmian.
  await page.locator('.libitem', { hasText: 'MCB B16 1P' }).click();
  const st = await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('rozdz-v2')); return [j.list.length, j.bad.length, j.bad[0].S.name, JSON.stringify(j.bad[0].S.rows)]; });
  expect(st).toEqual([1, 1, 'Drugi projekt', '[["d999"]]']);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rozdz-v2')).bad.length)).toBe(1);   // nie mnoży się przy kolejnych startach
});

test('projekt, którego nie da się narysować przy starcie, zostaje zachowany, a nie nadpisany przykładem', async ({ page }) => {
  await page.fill('#pname', 'Mój projekt');
  // Wpis poprawny strukturalnie, ale wywracający rysowanie (symulacja błędu w przyszłej wersji aplikacji).
  await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('rozdz-v2')); j.list[0].S.enc = { mfr: 'hager', series: 'volta', rows: 3 }; localStorage.setItem('rozdz-v2', JSON.stringify(j)); });
  await page.addInitScript(() => { window.__breakRender = true; });
  await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => {}); });
  await page.route('**/js/render.js', async route => {
    const res = await route.fetch(); let body = await res.text();
    body = body.replace('function renderEnc(){', 'let __once=true;function renderEnc(){if(__once){__once=false;throw new Error("celowy błąd rysowania");}');
    await route.fulfill({ response: res, body });
  });
  await page.reload();
  await expect(page.locator('.toast')).toContainText('Jego dane zostały zachowane');
  await expect(page.locator('.slot')).toHaveCount(21);
  const st = await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('rozdz-v2')); return [j.bad.length, j.bad[0].S.name, j.list.map(x => x.S.name)]; });
  expect(st).toEqual([1, 'Mój projekt', ['Dom jednorodzinny – rozdzielnica RG']]);
});

test('współczynnik jednoczesności i cos φ są ograniczane do sensownego zakresu', async ({ page }) => {
  await page.click('[data-tab="bilans"]');
  await page.fill('#sKs', '5');
  await page.locator('#sKs').blur();
  await page.fill('#sCos', '3');
  await page.locator('#sCos').blur();
  expect(await page.evaluate(() => [S.set.ks, S.set.cos])).toEqual([1, 1]);
  await page.fill('#sCos', '0.1');
  await page.locator('#sCos').blur();
  expect(await page.evaluate(() => S.set.cos)).toBe(0.5);
  await expect(page.locator('#sCos')).toHaveValue('0.5');
});

test('„Wyczyść” usuwa także ręczne przewody', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  await page.click('#bClear');
  await page.click('#cYes');
  expect(await page.evaluate(() => [Object.keys(S.dev).length, S.conn.length])).toEqual([0, 0]);
  await page.click('#bUndo');
  expect(await page.evaluate(() => [Object.keys(S.dev).length, S.conn.length])).toEqual([21, 42]);
});
