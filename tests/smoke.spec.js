// Testy dymne: start aplikacji, widok okablowania, kontrola, zestawienie, migracja starego stanu.
const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}
// Czcionki Google mogą być niedostępne offline – blokujemy je, żeby testy były deterministyczne.
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
});

test('ładuje przykładowy projekt bez błędów', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.slot')).toHaveCount(21);
  await expect(page.locator('#pname')).toHaveValue(/Dom jednorodzinny/);
  expect(errors).toEqual([]);
});

test('widok okablowania rysuje przewody, szyny grzebieniowe i listwy', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.click('[data-view="wires"]');
  const svg = page.locator('svg.wires');
  await expect(svg).toHaveCount(1);
  expect(await svg.locator('path.w').count()).toBeGreaterThan(30);
  await expect(svg.locator('text', { hasText: 'Listwa PE' })).toHaveCount(1);
  expect(await svg.locator('rect.w').count()).toBe(2); // 2 szyny grzebieniowe w przykładzie
  expect(errors).toEqual([]);
});

test('model połączeń dla przykładu jest stabilny', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => { const b = buildConns(); return { n: b.C.length, combs: b.combs.map(c => c.type + c.mod) }; });
  expect(r.n).toBe(42);
  expect(r.combs).toEqual(['3F8', '3F3']);
});

test('zakładki Kontrola, Kable i Zestawienie mają treść', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-tab="kontrola"]');
  expect(await page.locator('.issue').count()).toBeGreaterThan(0);
  await page.click('[data-tab="kable"]');
  await expect(page.locator('#panel')).toContainText('YKY 4×10');
  await page.click('[data-tab="bom"]');
  await expect(page.locator('#panel')).toContainText('Szyna grzebieniowa');
  await expect(page.locator('#panel')).toContainText('H07V-K');
});

test('dodanie aparatu z biblioteki i usunięcie klawiszem Delete', async ({ page }) => {
  await page.goto('/');
  await page.locator('.libitem', { hasText: 'MCB B16 1P' }).click();
  await expect(page.locator('.slot')).toHaveCount(22);
  await page.keyboard.press('Delete');
  await expect(page.locator('.slot')).toHaveCount(21);
});

test('czyszczenie wymaga potwierdzenia na stronie', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#confirm')).toBeHidden();
  await expect(page.locator('#wireHint')).toBeHidden();
  await page.click('#bClear');
  await expect(page.locator('#confirm')).toBeVisible();
  await page.click('#cNo');
  await expect(page.locator('#confirm')).toBeHidden();
  await expect(page.locator('.slot')).toHaveCount(21);
  await page.click('#bClear');
  await page.click('#cYes');
  await expect(page.locator('.slot')).toHaveCount(0);
});

test('stan zapisany przez starą wersję (bez len/wf) wczytuje się', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.evaluate(() => {
    // Stan w formacie sprzed listy projektów: jeden projekt pod kluczem rozdz-v1.
    const s = JSON.parse(localStorage.getItem('rozdz-v2')).list[0].S;
    delete s.wf; s.wires = true;
    Object.values(s.dev).forEach(d => { if (d.c) delete d.c.len; });
    localStorage.removeItem('rozdz-v2');
    localStorage.setItem('rozdz-v1', JSON.stringify({ S: s, uid: 99 }));
  });
  await page.reload();
  await expect(page.locator('.slot')).toHaveCount(21);
  await expect(page.locator('svg.wires')).toHaveCount(1);
  // Migracja: projekt trafia na listę (rozdz-v2), stary klucz znika.
  const keys = await page.evaluate(() => [localStorage.getItem('rozdz-v1'), JSON.parse(localStorage.getItem('rozdz-v2')).list.length]);
  expect(keys).toEqual([null, 1]);
  expect(errors).toEqual([]);
});

test('uszkodzony stan nie blokuje startu', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const bad = { rows: [['x']], dev: {}, enc: { mfr: 'hager', series: 'volta', rows: 1 }, set: {} };
    localStorage.setItem('rozdz-v1', JSON.stringify({ S: bad, uid: 2 }));
    localStorage.setItem('rozdz-v2', JSON.stringify({ version: 2, cur: 'p1', list: [{ id: 'p1', S: bad, uid: 2 }] }));
  });
  await page.reload();
  await expect(page.locator('.slot')).toHaveCount(21); // fallback do przykładu
});

test('front aparatu zależy od producenta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#board .dev.m-hager')).toHaveCount(21);
  await expect(page.locator('#board .dev.m-hager.lv')).toHaveCount(16); // rozłącznik, 2 RCD, RCBO, 12 MCB
  // Ten sam aparat pięciu producentów: inna klasa, inna barwa znaku, inny kształt dźwigni.
  const looks = [];
  for (const m of ['hager', 'schneider', 'abb', 'eaton', 'legrand']) {
    await page.click(`[data-mfr="${m}"]`);
    await page.locator('.libitem', { hasText: 'MCB B16 1P' }).click();
    const dev = page.locator(`#board .slot.sel .dev.m-${m}.lv`);
    await expect(dev).toHaveCount(1);
    looks.push(await dev.evaluate(e => {
      const mk = getComputedStyle(e.querySelector('.mk')), lv = getComputedStyle(e.querySelector('.lever'));
      return [mk.color, mk.backgroundColor, mk.borderTopWidth, mk.borderBottomWidth, mk.borderLeftWidth, lv.borderTopLeftRadius, lv.borderBottomLeftRadius].join('|');
    }));
  }
  expect(new Set(looks).size).toBe(5);
});
