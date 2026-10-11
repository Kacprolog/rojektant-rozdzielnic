// Naprawy proponowane przez kontrolę i pasek szybkiej edycji aparatu.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
});

const ids = page => page.evaluate(() => { const m = {}; Object.values(S.dev).forEach(d => { m[d.name] = d.id; }); return m; });
const crit = page => page.evaluate(() => checks().filter(c => c.sev === 'crit').map(c => c.msg.replace(/<[^>]+>/g, '')));
const fix = (page, label) => page.locator('#panel [data-fix]', { hasText: label });

test('kontrola proponuje naprawę obwodu: prąd, przekrój, różnicówka; cofnięcie ją odwraca', async ({ page }) => {
  const d = await ids(page);
  // 5 kW na B16 i 2,5 mm²: Ib ≈ 22,9 A.
  await page.evaluate(id => { S.dev[id].c.P = 5; render(); }, d['Gniazda salon']);
  await page.click('[data-tab="kontrola"]');
  await expect(page.locator('#panel')).toContainText('prąd obciążenia 22,9 A przekracza In 16 A');
  await fix(page, 'Ustaw In 25 A i przewód 4 mm²').click();
  await expect(page.locator('.toast')).toContainText('Naprawiono: Ustaw In 25 A i przewód 4 mm²');
  expect(await page.evaluate(id => [S.dev[id].p.In, S.dev[id].c.cable], d['Gniazda salon'])).toEqual([25, 4]);
  // Obwód jest naprawiony; zostaje błąd całej instalacji (dodatkowe 3 kW), którego naprawa nie dotyczy.
  expect(await crit(page)).toEqual(['Prąd szczytowy 32,3 A przekracza zabezpieczenie przedlicznikowe 32 A.']);
  await page.click('#bUndo');
  expect(await page.evaluate(id => [S.dev[id].p.In, S.dev[id].c.cable], d['Gniazda salon'])).toEqual([16, 2.5]);
  await page.click('#bUndo');

  // Za cienki przewód przy poprawnym prądzie.
  await page.evaluate(id => { S.dev[id].c.cable = 1.5; render(); }, d['Pralka']);
  await fix(page, 'Zwiększ przewód do 2,5 mm²').click();
  expect(await crit(page)).toEqual([]);

  // Gniazda bez różnicówki: jest pasująca 30 mA, więc naprawa przypisuje obwód.
  await page.evaluate(id => { S.dev[id].c.kind = 'gniazda'; render(); }, d['Podgrzewacz wody']);
  await expect(page.locator('#panel')).toContainText('nie ma ochrony różnicowoprądowej 30 mA');
  await fix(page, 'Przypisz do -F11').click(); // -F11 ma 1 obwód, -F2 ma 9
  expect(await page.evaluate(id => S.dev[id].rcd, d['Podgrzewacz wody'])).toBe(d['RCD ładowarka EV']);
  expect(await crit(page)).toEqual([]);
});

test('naprawy dodające aparaty: różnicówka przed obwodem, rozłącznik, ogranicznik', async ({ page }) => {
  await page.click('#bNew');
  await page.locator('.libitem', { hasText: 'MCB B16 1P' }).click();
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Dodaj różnicówkę 40 A / 30 mA typ A').click();
  // Różnicówka stoi bezpośrednio przed wyłącznikiem, więc powstaje szyna grzebieniowa.
  expect(await page.evaluate(() => { const r = S.rows[S.active].map(id => S.dev[id]); return [r.map(x => x.t).join(), r[1].rcd === r[0].id, buildConns().combs.length]; })).toEqual(['rcd,mcb', true, 1]);
  await fix(page, 'Dodaj rozłącznik 32 A 3P').click();
  await fix(page, 'Dodaj ogranicznik T1+T2 3P+N').click();
  // Rozłącznik trafia na początek rzędu 1, ogranicznik zaraz za nim.
  expect(await page.evaluate(() => S.rows[0].map(id => S.dev[id].t).join())).toBe('sw,spd,rcd,mcb');
  // Zostaje tylko uwaga o asymetrii (jedyny obwód jest na L1); nie ma już żadnego błędu.
  expect(await page.evaluate(() => checks().filter(c => c.sev !== 'info').map(c => c.sev + ':' + c.msg.slice(0, 9)))).toEqual(['warn:Asymetria']);
  // Cztery naprawy = cztery kroki cofania... minus dodanie wyłącznika z biblioteki: razem wracamy do pustej obudowy.
  for (let i = 0; i < 4; i++) await page.click('#bUndo');
  await expect(page.locator('.slot')).toHaveCount(0);
});

test('naprawy przewodów ręcznych: usunięcie złego przewodu, kolor i przekrój automatycznie', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Przejmij automatyczne').click();
  expect(await page.evaluate(() => S.conn.length)).toBe(36);
  const d = await ids(page);
  await page.evaluate(([q, r]) => { wireClick({ k: 'dev', id: q, side: 'bot', i: 0 }); wireClick({ k: 'dev', id: r, side: 'top', i: 1 }); }, [d['Rozłącznik główny'], d['RCD obwody ogólne']]);
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Usuń ten przewód').click();
  expect(await page.evaluate(() => [S.conn.length, wireCheck().out.length])).toEqual([36, 0]);

  await page.evaluate(() => { const w = S.conn.find(x => x.a.k === 'dev' && x.b.k === 'dev'); w.col = 'PE'; w.mm = 35; render(); });
  await fix(page, 'Przywróć kolor wg normy').click();
  await fix(page, 'Ustaw przekrój automatycznie').click();
  expect(await page.evaluate(() => wireCheck().out.length)).toBe(0);
});

test('pasek szybkiej edycji: faza, prąd, charakterystyka, przesuwanie, kopia, usunięcie', async ({ page }) => {
  const d = await ids(page), id = d['Gniazda salon'];
  await expect(page.locator('#board .quick')).toHaveCount(0);
  await page.locator(`#board .slot[data-id="${id}"] .rt`).click();
  const q = page.locator('#board .quick');
  await expect(q).toHaveCount(1);
  const get = () => page.evaluate(x => { const v = S.dev[x]; return [v.c.ph, v.p.In, v.p.curve, S.rows[1].indexOf(x)]; }, id);
  expect(await get()).toEqual(['L3', 16, 'B', 3]);

  await q.locator('[data-q="ph:L1"]').click();
  await q.locator('[data-q="in+"]').click();
  await q.locator('[data-q="curve"]').click();
  await q.locator('[data-q="left"]').click();
  expect(await get()).toEqual(['L1', 20, 'C', 2]);
  await expect(q.locator('.qv')).toHaveText('20 A');
  await expect(q.locator('[data-q="ph:L1"]')).toHaveAttribute('aria-pressed', 'true');

  await q.locator('[data-q="dup"]').click();
  await expect(page.locator('#board .slot')).toHaveCount(22);
  await page.locator('#board .quick [data-q="del"]').click();
  await expect(page.locator('#board .slot')).toHaveCount(21);
  await expect(page.locator('#board .quick')).toHaveCount(0);

  // Obwód trójfazowy nie ma wyboru fazy; różnicówka nie ma charakterystyki.
  await page.locator(`#board .slot[data-id="${d['Pompa ciepła']}"] .rt`).click();
  await expect(page.locator('#board .quick [data-q^="ph:"]')).toHaveCount(0);
  await page.locator(`#board .slot[data-id="${d['RCD obwody ogólne']}"] .rt`).click();
  await expect(page.locator('#board .quick [data-q="curve"]')).toHaveCount(0);
  await page.locator('#board .quick [data-q="in-"]').click();
  expect(await page.evaluate(x => S.dev[x].p.In, d['RCD obwody ogólne'])).toBe(25);

  // W okablowaniu i w symulacji paska nie ma.
  await page.click('[data-view="wires"]');
  await expect(page.locator('#board .quick')).toHaveCount(0);
  await page.click('[data-view="front"]');
  await page.click('#bSim');
  await expect(page.locator('#board .quick')).toHaveCount(0);
});
