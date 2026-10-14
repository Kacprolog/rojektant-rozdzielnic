// Schemat jednokreskowy: rysowany z modelu, kliknięcie zaznacza aparat, widok nie zmienia danych projektu.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('schemat przykładu: rozłącznik, szyna, dwie różnicówki z obwodami, tor licznika i stycznika', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const before = await page.evaluate(() => JSON.stringify(exportData().S));
  await page.click('[data-view="schem"]');
  await expect(page.locator('#viewSeg [data-view="schem"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#board .slot')).toHaveCount(0);
  const svg = page.locator('#board svg.schem');
  await expect(svg).toHaveCount(1);
  // Q1 + 3 aparaty pomocnicze + 2 RCD z 10 obwodami + RCBO + 2 obwody bez RCD = 19 elementów do kliknięcia
  await expect(svg.locator('[data-sid]')).toHaveCount(19);
  await expect(svg.locator('path.bus2')).toHaveCount(2); // szyny pod dwiema różnicówkami
  for (const s of ['-Q1', '-F2', '-F11', '-P1', '-K2', 'taryfa G12', 'YKY 4×10', 'Pompa ciepła'])
    await expect(svg).toContainText(s);
  // obwód z licznikiem w torze: licznik pod wyłącznikiem tego obwodu
  const pc = await page.evaluate(() => {
    const m = Object.values(S.dev).find(d => d.t === 'meter');
    return document.querySelector(`svg.schem [data-sid="${m.circ}"]`).textContent;
  });
  expect(pc).toContain('kWh');
  // widok nie zmienia danych projektu
  expect(await page.evaluate(() => JSON.stringify(exportData().S))).toBe(before);
  expect(errors).toEqual([]);
});

test('kliknięcie obwodu na schemacie zaznacza go i otwiera jego parametry', async ({ page }) => {
  await page.click('[data-view="schem"]');
  const id = await page.evaluate(() => Object.values(S.dev).find(d => d.name === 'Pralka').id);
  await page.locator(`svg.schem [data-sid="${id}"] > rect.hit`).click({ position: { x: 8, y: 30 } });
  expect(await page.evaluate(() => [S.sel, S.tab, S.schem])).toEqual([id, 'aparat', true]);
  await expect(page.locator(`svg.schem [data-sid="${id}"]`)).toHaveClass(/sel/);
  await expect(page.locator('#iName')).toHaveValue('Pralka');
  await page.click('[data-view="front"]');
  await expect(page.locator('#board .slot')).toHaveCount(21);
});

test('schemat pustej obudowy i zapamiętanie widoku', async ({ page }) => {
  await page.click('[data-view="schem"]');
  await page.click('#bClear');
  await page.click('#cYes');
  await expect(page.locator('svg.schem')).toContainText('Obudowa jest pusta');
  await page.reload();
  await expect(page.locator('svg.schem')).toHaveCount(1);
});
