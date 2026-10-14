// Poprawki sugestii z przeglądu kodu 0.14.1 (HANDOFF.md → „Z przeglądu kodu”).
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
});

const ids = page => page.evaluate(() => { const m = {}; Object.values(S.dev).forEach(d => { m[d.name] = d.id; }); return m; });
const issues = page => page.evaluate(() => checks().filter(c => c.sev !== 'info').map(c => c.sev + ': ' + c.msg.replace(/<[^>]+>/g, '')));

test('„Rozłóż fazy” w okablowaniu ręcznym przepina przewody zasilające i nie tworzy błędów faz', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  const d = await ids(page);
  // Wszystkie obwody jednofazowe na L3: asymetria i przeciążenie L3.
  await page.evaluate(() => { Object.values(S.dev).forEach(x => { if ((x.t === 'mcb' && x.p.poles === 1) || (x.t === 'rcbo' && x.p.poles === 2)) x.c.ph = 'L3'; }); render(); });
  // Przewody do obwodów bez różnicówki (podgrzewacz, RCBO) przepinamy ręcznie na L3, żeby stan startowy był spójny.
  await page.evaluate(([q, f15, rc]) => { S.conn.forEach(w => { const a = w.a, b = w.b; [[a, b], [b, a]].forEach(([e, o]) => { if (e.k === 'dev' && (e.id === f15 || e.id === rc) && e.side === 'top' && e.i === 0 && o.k === 'dev' && o.id === q) o.i = 2; }); }); render(); }, [d['Rozłącznik główny'], d['Podgrzewacz wody'], d['Gniazda garaż / ogród']]);
  expect(await page.evaluate(() => wireCheck().out.length)).toBe(0);
  expect((await issues(page)).some(x => x.includes('Asymetria'))).toBe(true);

  await page.click('#bBalance');
  await expect(page.locator('.toast')).toContainText('przepięto przewody zasilające');
  expect(await page.evaluate(() => wireCheck().out.map(x => x.msg))).toEqual([]);
  const out = await issues(page);
  expect(out.some(x => x.includes('Asymetria') || x.includes('dwie różne fazy'))).toBe(false);
  await page.click('#bUndo');
  expect(await page.evaluate(() => wireCheck().out.length)).toBe(0);

  // Zmiana fazy w pasku szybkiej edycji też przepina przewód.
  await page.click('[data-view="front"]');
  await page.locator(`#board .slot[data-id="${d['Podgrzewacz wody']}"] .rt`).click();
  await page.locator('#board .quick [data-q="ph:L1"]').click();
  await expect(page.locator('.toast')).toContainText('Przepięto przewód zasilający na L1');
  expect(await page.evaluate(() => wireCheck().out.length)).toBe(0);
});

test('„Rozłóż fazy” nie przenosi obwodów za różnicówką 2P', async ({ page }) => {
  const d = await ids(page);
  await page.evaluate(id => { S.dev[id].p.poles = 2; Object.values(S.dev).forEach(x => { if (x.rcd === id && x.p.poles === 1) x.c.ph = 'L1'; }); render(); }, d['RCD obwody ogólne']);
  await page.click('#bBalance');
  const ph = await page.evaluate(id => Object.values(S.dev).filter(x => x.rcd === id && x.p.poles === 1).map(x => x.c.ph), d['RCD obwody ogólne']);
  expect(new Set(ph)).toEqual(new Set(['L1']));
  expect((await issues(page)).some(x => x.includes('2P podaje fazę'))).toBe(false);
});

test('na listwach każdy przewód ma własny zacisk, nawet przy wielu różnicówkach', async ({ page }) => {
  // 6 różnicówek z obwodami i 4 RCBO: główna listwa N ma wiele przewodów, a dzieli miejsce z 6 listwami za różnicówkami.
  await page.evaluate(() => {
    S.enc = { mfr: 'hager', series: 'volta', rows: 4 }; S.rows = [[], [], [], []]; S.dev = {}; S.conn = []; uid = 1;
    const put = (r, d) => { S.dev[d.id] = d; S.rows[r].push(d.id); return d; };
    put(0, newDev('sw', 'hager', { In: 63, poles: 3 })); put(0, newDev('spd', 'hager', { cls: 'T1+T2', sys: '3P+N' })); put(0, newDev('lamp', 'hager', {}));
    for (let k = 0; k < 6; k++) { const row = 1 + Math.floor(k / 2), rc = put(row, newDev('rcd', 'hager', { In: 25, poles: 2, idn: 30, kind: 'A', sel: false })); const m = newDev('mcb', 'hager', { In: 10, curve: 'B', poles: 1, icn: 6 }, { kind: 'oswietlenie', P: 0.3, cable: 1.5, ph: 'L1' }); m.rcd = rc.id; put(row, m); }
    for (let k = 0; k < 4; k++) put(0, newDev('rcbo', 'hager', { In: 16, curve: 'B', poles: 2, idn: 30, kind: 'A' }, { kind: 'gniazda', P: 1, cable: 2.5, ph: ['L1', 'L2', 'L3'][k % 3] }));
    S.wires = true; render();
  });
  const st = await page.evaluate(() => BAR_STATS);
  expect(st.N.wires).toBeGreaterThan(6);
  for (const k of Object.keys(st)) expect(st[k].points, k).toBe(st[k].wires);
  // Listwy mieszczą się w obudowie (rysunek nie wychodzi poza jej prawą krawędź).
  const fit = await page.evaluate(() => { const cab = document.querySelector('#board').getBoundingClientRect(); return [...document.querySelectorAll('svg.wires rect')].every(r => r.getBoundingClientRect().right <= cab.right + 1); });
  expect(fit).toBe(true);
});
