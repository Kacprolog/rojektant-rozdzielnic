// Podpisy aparatów: mały przycisk z oznaczeniem pod aparatem, rozwijany opis z adnotacją liczoną z projektu.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

const id = (page, name) => page.evaluate(n => Object.values(S.dev).find(d => d.name === n).id, name);

test('podpis rozwija się i zwija, jeden naraz, bez zmiany danych projektu', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const before = await page.evaluate(() => [JSON.stringify(exportData().S), HIST.u.length]);
  const f8 = await id(page, 'Pralka'),
    f2 = await id(page, 'RCD obwody ogólne');
  await expect(page.locator(`[data-tag="${f8}"]`)).toHaveText(/-F8/);
  await expect(page.locator('.tagpop')).toHaveCount(0);
  await page.click(`[data-tag="${f8}"]`);
  const pop = page.locator('.tagpop');
  await expect(pop).toHaveCount(1);
  await expect(pop).toContainText('-F8');
  await expect(pop).toContainText('Pralka');
  await expect(pop).toContainText('2,2 kW · faza L3 · za -F2');
  await expect(page.locator(`[data-tag="${f8}"]`)).toHaveAttribute('aria-expanded', 'true');
  // inny podpis: poprzedni się zwija
  await page.click(`[data-tag="${f2}"]`);
  await expect(pop).toHaveCount(1);
  await expect(pop).toContainText('chroni -F3 … -F10, -F13'); // zakres tylko dla kolejnych numerów
  // drugie kliknięcie zwija
  await page.click(`[data-tag="${f2}"]`);
  await expect(pop).toHaveCount(0);
  expect(await page.evaluate(() => [JSON.stringify(exportData().S), HIST.u.length])).toEqual(before);
  expect(errors).toEqual([]);
});

test('podpis z klawiatury, Escape i kliknięcie obok zwijają opis', async ({ page }) => {
  const q1 = await id(page, 'Rozłącznik główny');
  await page.focus(`[data-tag="${q1}"]`);
  await page.keyboard.press('Enter');
  await expect(page.locator('.tagpop')).toContainText('odłącza całą instalację');
  await expect(page.locator(`[data-tag="${q1}"]`)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.tagpop')).toHaveCount(0);
  await expect(page.locator(`[data-tag="${q1}"]`)).toBeFocused();
  await page.click(`[data-tag="${q1}"]`);
  await page.locator('.rowlab').first().click();
  await expect(page.locator('.tagpop')).toHaveCount(0);
});

test('adnotacje z projektu: stycznik, licznik, ostatni rząd otwiera opis w górę', async ({ page }) => {
  const k2 = await id(page, 'Bojler – taryfa G12'),
    p1 = await id(page, 'Podlicznik pompy ciepła'),
    f16 = await id(page, 'Pompa ciepła');
  await page.click(`[data-tag="${k2}"]`);
  await expect(page.locator('.tagpop')).toContainText('łączy obwód -F15 · sygnał taryfy G12');
  await page.click(`[data-tag="${p1}"]`);
  await expect(page.locator('.tagpop')).toContainText('mierzy energię obwodu -F16');
  await expect(page.locator('.tagpop')).not.toHaveClass(/up/);
  await page.click(`[data-tag="${f16}"]`);
  await expect(page.locator('.tagpop')).toContainText('5 kW · trójfazowy');
  await expect(page.locator('.tagpop')).toHaveClass(/up/);
});
