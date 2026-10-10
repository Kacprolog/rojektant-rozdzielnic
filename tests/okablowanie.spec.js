// Okablowanie ręczne: dodawanie przewodów kliknięciem zacisków i alerty o złym podłączeniu.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
  await page.click('[data-view="wires"]');
});

// Aparaty przykładu po nazwie → id; zapisany koniec przewodu na zacisku aparatu.
const ids = page => page.evaluate(() => { const m = {}; Object.values(S.dev).forEach(d => { m[d.name] = d.id; }); return m; });
const dev = (id, side, i) => ({ k: 'dev', id, side, i });
const bar = b => ({ k: 'bar', bar: b });
const wlz = ph => ({ k: 'wlz', ph });
const connect = (page, a, b) => page.evaluate(([x, y]) => { wireClick(x); wireClick(y); }, [a, b]);
const issues = page => page.evaluate(() => wireCheck().out.map(x => x.sev + ': ' + x.msg.replace(/<[^>]+>/g, '')));
const manualAdopted = async page => { await page.click('[data-wmode="manual"]'); await page.click('[data-wact="adopt"]'); };
const target = (page, ep) => page.locator(`svg.wires [data-ep='${JSON.stringify(ep)}']`);

test('tryb automatyczny jest domyślny i nie ma klikalnych zacisków', async ({ page }) => {
  await expect(page.locator('[data-wmode="auto"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('svg.wires .tp')).toHaveCount(0);
  expect(await issues(page)).toEqual([]);
});

test('tryb ręczny: pusty daje informację, zaciski są klikalne, kliknięcia dodają przewód', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.click('[data-wmode="manual"]');
  expect(await page.locator('svg.wires .tp').count()).toBeGreaterThan(60);
  expect(await issues(page)).toEqual(['info: Okablowanie ręczne jest puste.']);
  // Szyny grzebieniowe zostają, bo wynikają z ustawienia aparatów.
  expect(await page.locator('svg.wires rect.w').count()).toBe(2);

  const d = await ids(page);
  await target(page, wlz('L1')).click();
  await expect(page.locator('#wireHelp')).toContainText('drugi zacisk');
  await expect(page.locator('svg.wires .tp.on')).toHaveCount(1);
  await target(page, dev(d['Rozłącznik główny'], 'top', 0)).click();
  await expect(page.locator('.toast')).toHaveText('Dodano przewód');
  await expect(page.locator('svg.wires path[data-w]')).toHaveCount(1);
  expect(await page.evaluate(() => S.conn.length)).toBe(1);

  // Drugi raz ten sam przewód nie powstaje; Esc anuluje wybór zacisku.
  await connect(page, dev(d['Rozłącznik główny'], 'top', 0), wlz('L1'));
  await expect(page.locator('.toast')).toHaveText('Taki przewód już istnieje');
  await target(page, wlz('L2')).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('svg.wires .tp.on')).toHaveCount(0);
  expect(await page.evaluate(() => S.conn.length)).toBe(1);
  expect(errors).toEqual([]);
});

test('„Przejmij automatyczne” daje to samo okablowanie bez żadnych uwag', async ({ page }) => {
  const auto = await page.evaluate(() => ({ n: buildConns().C.length, mat: JSON.stringify(wireMat()), sev: checks().map(c => c.sev).sort().join() }));
  await manualAdopted(page);
  const man = await page.evaluate(() => ({ n: buildConns().C.length, mat: JSON.stringify(wireMat()), sev: checks().map(c => c.sev).sort().join(), user: S.conn.length }));
  expect(man.n).toBe(42);
  expect(man.user).toBe(36); // 42 połączenia minus 6 zworek szyn grzebieniowych
  expect(man.n).toBe(auto.n);
  expect(man.mat).toBe(auto.mat);
  expect(man.sev).toBe(auto.sev);
  expect(await issues(page)).toEqual([]);
  await expect(page.locator('svg.wires path.halo')).toHaveCount(0);
});

test('zwarcie międzyfazowe: alert od razu, czerwona obwódka, wpis w Kontroli, usunięcie klawiszem Delete', async ({ page }) => {
  await manualAdopted(page);
  const d = await ids(page);
  await target(page, dev(d['Rozłącznik główny'], 'bot', 0)).click();          // wyj. L1
  await target(page, dev(d['RCD obwody ogólne'], 'top', 1)).click();          // wej. L2
  const toast = page.locator('.toast');
  await expect(toast).toContainText('Złe podłączenie');
  await expect(toast).toContainText('dwie różne fazy (L1 i L2)');
  await expect(toast).toHaveClass(/alert/);
  await expect(page.locator('svg.wires path.halo')).toHaveCount(1);
  await page.click('[data-tab="kontrola"]');
  await expect(page.locator('.issue .sev.crit')).toHaveCount(1);
  await expect(page.locator('#panel')).toContainText('zwarcie międzyfazowe 400 V');
  await expect(page.locator('#stats')).toContainText('1 błędy');

  const id = await page.evaluate(() => S.conn[S.conn.length - 1].id);
  // Kliknięcie w przewód (zdarzenie wysyłane wprost, bo środek obrysu ścieżki może zasłaniać inny przewód).
  await page.locator(`svg.wires path[data-w="${id}"]`).dispatchEvent('click');
  await expect(page.locator('[data-wact="del"]')).toContainText('-Q1 wyj. L1 → -F2 wej. L2');
  await page.keyboard.press('Delete');
  await expect(page.locator('svg.wires path.halo')).toHaveCount(0);
  expect(await issues(page)).toEqual([]);
  await expect(page.locator('.slot')).toHaveCount(21); // Delete usunął przewód, nie aparat
});

test('pozostałe rodzaje złych podłączeń', async ({ page }) => {
  await manualAdopted(page);
  const d = await ids(page);
  const q = d['Rozłącznik główny'], r1 = d['RCD obwody ogólne'], r2 = d['RCD ładowarka EV'];
  const cases = [
    [dev(q, 'bot', 0), bar('N'), 'łączy fazę z przewodem neutralnym: zwarcie'],
    [dev(q, 'bot', 2), bar('PE'), 'łączy fazę z PE: zwarcie doziemne'],
    [bar('PE'), bar('N:' + r1), 'łączy N z PE poza punktem podziału PEN'],
    [bar('N'), bar('N:' + r1), 'łączy przewody N z różnych stref (przed różnicówkami / za różnicówką -F2)'],
    [bar('N:' + r1), bar('N:' + r2), 'łączy przewody N z różnych stref (za różnicówką -F2 / za różnicówką -F11)'],
    [wlz('L1'), dev(r1, 'top', 0), 'omija rozłącznik główny'],
    [dev(q, 'bot', 0), dev(d['Płyta indukcyjna'], 'top', 0), 'łączy tory z różnych stref (przed różnicówkami / za różnicówką -F2)'],
    [dev(r1, 'bot', 0), dev(r2, 'bot', 0), 'łączy tory z różnych stref (za różnicówką -F2 / za różnicówką -F11)'],
    [dev(q, 'bot', 2), dev(d['Podgrzewacz wody'], 'bot', 0), 'jest wpięty w zacisk odejścia obwodu']
  ];
  for (const [a, b, msg] of cases) {
    await connect(page, a, b);
    const out = await issues(page);
    expect(out.length, msg).toBe(1);
    expect(out[0]).toContain(msg);
    await expect(page.locator('.toast')).toContainText(msg.slice(0, 20));
    await page.evaluate(() => { wireSel = S.conn[S.conn.length - 1].id; wireDel(); });
    expect(await issues(page)).toEqual([]);
  }
});

test('brak zasilania: usunięty przewód, niepodłączona listwa PE i listwa N za różnicówką', async ({ page }) => {
  await manualAdopted(page);
  const d = await ids(page);
  const drop = (a, b) => page.evaluate(([x, y]) => { const k = JSON.stringify; S.conn = S.conn.filter(w => !((k(w.a) === k(x) && k(w.b) === k(y)) || (k(w.a) === k(y) && k(w.b) === k(x)))); render(); }, [a, b]);

  await drop(dev(d['Rozłącznik główny'], 'bot', 2), dev(d['Podgrzewacz wody'], 'top', 0));
  expect(await issues(page)).toEqual(['crit: -F15 Podgrzewacz wody: brak połączenia z zasilaniem na zaciskach wej. L3.']);

  await drop(wlz('PE'), bar('PE'));
  const out = await issues(page);
  expect(out).toContain('crit: Listwa PE nie jest połączona z przewodem ochronnym zasilania (WLZ).');
  expect(out).toContain('warn: Listwa N nie jest zasilona.');
  expect(out.some(x => x.includes('-F1 Ochrona przepięciowa') && x.includes('wyj. PE'))).toBe(true);
  await page.click('#bUndo');

  await drop(dev(d['RCD obwody ogólne'], 'bot', 3), bar('N:' + d['RCD obwody ogólne']));
  expect(await issues(page)).toContain('warn: Listwa N -F2 nie jest połączona z wyjściem N różnicówki.');
});

test('zmiana fazy obwodu i układu sieci ujawnia złe podłączenie istniejących przewodów', async ({ page }) => {
  await manualAdopted(page);
  const d = await ids(page);
  await page.evaluate(id => { S.dev[id].c.ph = 'L1'; render(); }, d['Podgrzewacz wody']);
  let out = await issues(page);
  expect(out.length).toBe(1);
  expect(out[0]).toContain('-Q1 wyj. L3 → -F15 wej. L1');
  expect(out[0]).toContain('dwie różne fazy (L3 i L1)');
  await page.click('#bUndo');
  expect(await issues(page)).toEqual([]);

  // TN-S: mostek PE–N jest błędem, a przewód N zasilania przestaje istnieć po stronie PEN.
  await page.evaluate(() => { S.set.siec = 'TN-S'; render(); });
  out = await issues(page);
  expect(out.some(x => x.includes('łączy N z PE') && x.includes('TN-S'))).toBe(true);
});

test('przewody są danymi projektu: cofanie, plik, usunięcie aparatu, przeładowanie', async ({ page }) => {
  await page.click('[data-wmode="manual"]');
  const d = await ids(page);
  await connect(page, wlz('L1'), dev(d['Rozłącznik główny'], 'top', 0));
  await connect(page, dev(d['Rozłącznik główny'], 'bot', 0), dev(d['RCD obwody ogólne'], 'top', 0));
  expect(await page.evaluate(() => S.conn.length)).toBe(2);

  await page.click('#bUndo');
  expect(await page.evaluate(() => S.conn.length)).toBe(1);
  await page.click('#bRedo');
  expect(await page.evaluate(() => S.conn.length)).toBe(2);

  const file = await page.evaluate(() => JSON.stringify(exportData()));
  expect(JSON.parse(file).S.wmode).toBe('manual');
  await page.reload();
  expect(await page.evaluate(() => [S.wmode, S.conn.length])).toEqual(['manual', 2]);

  // Usunięcie aparatu usuwa jego przewody.
  await page.evaluate(id => delDev(id), d['RCD obwody ogólne']);
  expect(await page.evaluate(() => S.conn.length)).toBe(1);

  // Plik: przewody wracają, a końce wskazujące nieistniejące zaciski są odrzucane.
  const j = JSON.parse(file);
  j.S.conn.push({ id: 'w999', a: { k: 'dev', id: '__proto__', side: 'top', i: 0 }, b: { k: 'bar', bar: 'N' } });
  j.S.conn.push({ id: 'zły', a: { k: 'wlz', ph: 'L1' }, b: { k: 'bar', bar: 'N:nic' } });
  await page.setInputFiles('#fOpen', { name: 'x.rozdz.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(j)) });
  await expect(page.locator('.toast')).toContainText('Wczytano projekt');
  expect(await page.evaluate(() => [S.wmode, S.conn.length])).toEqual(['manual', 2]);
});

test('„Usuń przewody” i zastąpienie wymagają potwierdzenia; powrót do trybu automatycznego niczego nie kasuje', async ({ page }) => {
  await manualAdopted(page);
  await page.click('[data-wact="adopt"]');
  await expect(page.locator('#confirm')).toContainText('Zastąpić ręczne okablowanie (36 przewodów)');
  await page.click('#cNo');
  await page.click('[data-wact="clear"]');
  await page.click('#cYes');
  expect(await page.evaluate(() => S.conn.length)).toBe(0);
  await page.click('#bUndo');
  expect(await page.evaluate(() => S.conn.length)).toBe(36);
  await page.click('[data-wmode="auto"]');
  await expect(page.locator('svg.wires .tp')).toHaveCount(0);
  expect(await page.evaluate(() => [S.conn.length, buildConns().C.length])).toEqual([36, 42]);
});
