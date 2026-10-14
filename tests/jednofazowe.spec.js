// Zasilanie jednofazowe 230 V: przełączenie, obwody na L1, kontrola aparatów trójfazowych z naprawami, obliczenia, okablowanie.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

const supply = page =>
  page.evaluate(() =>
    checks()
      .filter(c => /zasilanie jest jednofazowe|zasilaniu jednofazowym|fazie L[23]/.test(c.msg))
      .map(c => c.sev + ': ' + c.msg.replace(/<[^>]+>/g, ''))
  );

test('przełączenie na jednofazowe: obwody na L1, aparaty trójfazowe w kontroli z naprawami', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.click('[data-tab="bilans"]');
  await page.selectOption('#sFaz', '1');
  await expect(page.locator('.toast')).toContainText('Zasilanie jednofazowe 230 V; obwody przeniesione na L1');
  expect(
    await page.evaluate(() => [
      S.set.faz,
      Object.values(S.dev).filter(d => isCirc(d) && !is3(d) && d.c.ph !== 'L1').length,
      wlzType()
    ])
  ).toEqual([1, 0, 'YKY 2×10 mm² (PEN)']);
  const found = await supply(page);
  expect(found.filter(x => x.startsWith('crit')).length).toBe(3); // trzy obwody trójfazowe: EV, płyta, pompa ciepła
  expect(found).toContain('crit: -F12 Ładowarka EV 11 kW jest obwodem trójfazowym, a zasilanie jest jednofazowe.');
  expect(found).toContain('warn: -Q1 Rozłącznik główny ma 3 bieguny, a zasilanie jest jednofazowe.');
  // wszystkie naprawy po kolei: nie zostaje żadna uwaga o zasilaniu poza informacją o kontrolkach i przekaźniku
  for (let k = 0; k < 20; k++) {
    const left = await page.evaluate(() => {
      const c = checks().find(x => x.fix && /zasilanie jest jednofazowe|fazie L[23]/.test(x.msg));
      if (!c) return false;
      c.fix.f();
      render();
      return true;
    });
    if (!left) break;
  }
  expect(await supply(page)).toEqual([
    'info: -H1 Kontrolki faz: przy zasilaniu jednofazowym świeci tylko kontrolka L1.',
    'warn: -K1 Kontrola faz PC kontroluje trzy fazy, a zasilanie jest jednofazowe: nigdy nie zamknie styku.'
  ]);
  // okablowanie: żadnej żyły L2 / L3 z WLZ, wszystkie obwody na L1
  expect(
    await page.evaluate(
      () => buildConns().C.filter(c => c.a.k === 'wlz' && (c.a.ph === 'L2' || c.a.ph === 'L3')).length
    )
  ).toBe(0);
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  await expect(page.locator('svg.wires .tp[aria-label="WLZ L2"]')).toHaveCount(0);
  await expect(page.locator('svg.wires .tp[aria-label="WLZ L1"]')).toHaveCount(1);
  expect(
    await page.evaluate(() =>
      wireCheck()
        .out.filter(c => c.sev === 'crit')
        .map(c => c.msg)
    )
  ).toEqual([]);
  // symulacja: zanik fazy tylko dla L1
  await page.click('#bSim');
  await expect(page.locator('[data-simph] option')).toHaveText(['brak', 'L1']);
  expect(errors).toEqual([]);
});

test('obliczenia przy zasilaniu jednofazowym (rachunek ręczny)', async ({ page }) => {
  const r = await page.evaluate(() => {
    S.set.faz = 1;
    const T = totals(),
      n = netCalc();
    return { Pd: T.Pd, Ibm: T.Ibm, du: n.duWlz, ik: n.ikB, cos: S.set.cos, L: sv('wlzLen'), ik0: sv('ik0') };
  });
  // Ib = Pd / (230 · cos φ)
  expect(r.Ibm).toBeCloseTo((r.Pd * 1000) / (230 * r.cos), 6);
  // ΔU% = 200 · P · L / (γ · S · U²), WLZ 10 mm²
  expect(r.du).toBeCloseTo((200 * r.Pd * 1000 * r.L) / (56 * 10 * 230 * 230), 6);
  // Ik L–N = 230 / (2 · (Zźródła + R_WLZ))
  const zk = 400 / (Math.sqrt(3) * r.ik0 * 1000) + r.L / (56 * 10);
  expect(r.ik).toBeCloseTo(230 / (2 * zk) / 1000, 6);
});

test('ustawienie zasilania w pliku: zapis, odczyt, wartości spoza listy', async ({ page }) => {
  await page.click('[data-tab="bilans"]');
  await page.selectOption('#sFaz', '1');
  const j = await page.evaluate(() => exportData());
  expect(j.S.set.faz).toBe(1);
  j.S.set.faz = 7;
  j.S.name = 'Zła liczba faz';
  await page.setInputFiles('#fOpen', {
    name: 'x.rozdz.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(j))
  });
  await expect(page.locator('.toast')).toContainText('Wczytano projekt „Zła liczba faz”');
  expect(await page.evaluate(() => [S.set.faz, is1F()])).toEqual([3, false]);
  // projekt sprzed tej wersji (bez pola faz) jest trójfazowy
  expect(await page.evaluate(() => (delete S.set.faz, [sv('faz'), supPh()]))).toEqual([3, ['L1', 'L2', 'L3']]);
});

test('powrót do trójfazowego i „Rozłóż fazy” przy jednofazowym', async ({ page }) => {
  await page.click('[data-tab="bilans"]');
  await page.selectOption('#sFaz', '1');
  await page.click('#bBalance');
  await expect(page.locator('.toast')).toContainText('wszystkie obwody są na L1');
  await page.selectOption('#sFaz', '3');
  await expect(page.locator('.toast')).toContainText('Zasilanie trójfazowe');
  await page.click('#bBalance');
  expect(
    await page.evaluate(
      () =>
        new Set(
          Object.values(S.dev)
            .filter(d => isCirc(d) && !is3(d))
            .map(d => d.c.ph)
        ).size
    )
  ).toBe(3);
});
