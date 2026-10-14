// Poprawki sugestii z przeglądu kodu 0.14.1 (HANDOFF.md → „Z przeglądu kodu”).
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
});

const ids = page =>
  page.evaluate(() => {
    const m = {};
    Object.values(S.dev).forEach(d => {
      m[d.name] = d.id;
    });
    return m;
  });
const issues = page =>
  page.evaluate(() =>
    checks()
      .filter(c => c.sev !== 'info')
      .map(c => c.sev + ': ' + c.msg.replace(/<[^>]+>/g, ''))
  );

test('„Rozłóż fazy” w okablowaniu ręcznym przepina przewody zasilające i nie tworzy błędów faz', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  const d = await ids(page);
  // Wszystkie obwody jednofazowe na L3: asymetria i przeciążenie L3.
  await page.evaluate(() => {
    Object.values(S.dev).forEach(x => {
      if ((x.t === 'mcb' && x.p.poles === 1) || (x.t === 'rcbo' && x.p.poles === 2)) x.c.ph = 'L3';
    });
    render();
  });
  // Przewody do obwodów bez różnicówki (podgrzewacz, RCBO) przepinamy ręcznie na L3, żeby stan startowy był spójny.
  await page.evaluate(
    ([q, f15, rc]) => {
      S.conn.forEach(w => {
        const a = w.a,
          b = w.b;
        [
          [a, b],
          [b, a]
        ].forEach(([e, o]) => {
          if (
            e.k === 'dev' &&
            (e.id === f15 || e.id === rc) &&
            e.side === 'top' &&
            e.i === 0 &&
            o.k === 'dev' &&
            o.id === q
          )
            o.i = 2;
        });
      });
      render();
    },
    [d['Rozłącznik główny'], d['Podgrzewacz wody'], d['Gniazda garaż / ogród']]
  );
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
  await page.evaluate(id => {
    S.dev[id].p.poles = 2;
    Object.values(S.dev).forEach(x => {
      if (x.rcd === id && x.p.poles === 1) x.c.ph = 'L1';
    });
    render();
  }, d['RCD obwody ogólne']);
  await page.click('#bBalance');
  const ph = await page.evaluate(
    id =>
      Object.values(S.dev)
        .filter(x => x.rcd === id && x.p.poles === 1)
        .map(x => x.c.ph),
    d['RCD obwody ogólne']
  );
  expect(new Set(ph)).toEqual(new Set(['L1']));
  expect((await issues(page)).some(x => x.includes('2P podaje fazę'))).toBe(false);
});

test('na listwach każdy przewód ma własny zacisk, nawet przy wielu różnicówkach', async ({ page }) => {
  // 6 różnicówek z obwodami i 4 RCBO: główna listwa N ma wiele przewodów, a dzieli miejsce z 6 listwami za różnicówkami.
  await page.evaluate(() => {
    S.enc = { mfr: 'hager', series: 'volta', rows: 4 };
    S.rows = [[], [], [], []];
    S.dev = {};
    S.conn = [];
    uid = 1;
    const put = (r, d) => {
      S.dev[d.id] = d;
      S.rows[r].push(d.id);
      return d;
    };
    put(0, newDev('sw', 'hager', { In: 63, poles: 3 }));
    put(0, newDev('spd', 'hager', { cls: 'T1+T2', sys: '3P+N' }));
    put(0, newDev('lamp', 'hager', {}));
    for (let k = 0; k < 6; k++) {
      const row = 1 + Math.floor(k / 2),
        rc = put(row, newDev('rcd', 'hager', { In: 25, poles: 2, idn: 30, kind: 'A', sel: false }));
      const m = newDev(
        'mcb',
        'hager',
        { In: 10, curve: 'B', poles: 1, icn: 6 },
        { kind: 'oswietlenie', P: 0.3, cable: 1.5, ph: 'L1' }
      );
      m.rcd = rc.id;
      put(row, m);
    }
    for (let k = 0; k < 4; k++)
      put(
        0,
        newDev(
          'rcbo',
          'hager',
          { In: 16, curve: 'B', poles: 2, idn: 30, kind: 'A' },
          { kind: 'gniazda', P: 1, cable: 2.5, ph: ['L1', 'L2', 'L3'][k % 3] }
        )
      );
    S.wires = true;
    render();
  });
  const st = await page.evaluate(() => BAR_STATS);
  expect(st.N.wires).toBeGreaterThan(6);
  for (const k of Object.keys(st)) expect(st[k].points, k).toBe(st[k].wires);
  // Listwy mieszczą się w obudowie (rysunek nie wychodzi poza jej prawą krawędź).
  const fit = await page.evaluate(() => {
    const cab = document.querySelector('#board').getBoundingClientRect();
    return [...document.querySelectorAll('svg.wires rect')].every(
      r => r.getBoundingClientRect().right <= cab.right + 1
    );
  });
  expect(fit).toBe(true);
});

test('projekty nie do wczytania: komunikat, pobranie, ponowna próba, usunięcie', async ({ page }) => {
  const fs = require('fs');
  await expect(page.locator('#badBox')).toBeHidden();
  // Jeden wpis uszkodzony na stałe, drugi poprawny (np. naprawiony przez nowszą wersję aplikacji).
  await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('rozdz-v2')),
      ok = JSON.parse(JSON.stringify(j.list[0]));
    ok.id = 'p-ok';
    ok.S.name = 'Odzyskany';
    j.bad = [{ id: 'p-bad', S: { name: 'Zepsuty', rows: [['d999']] }, uid: 2 }, ok];
    localStorage.setItem('rozdz-v2', JSON.stringify(j));
  });
  await page.reload();
  await expect(page.locator('#badBox')).toContainText('Nie udało się wczytać: 2');

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-bad="dl"]')]);
  expect(dl.suggestedFilename()).toBe('projekty-nie-do-wczytania.json');
  const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  expect(j.list.map(x => x.S.name)).toEqual(['Zepsuty', 'Odzyskany']);

  await page.click('[data-bad="retry"]');
  await expect(page.locator('.toast')).toContainText('Wczytano ponownie: 1; nadal nie do wczytania: 1');
  await expect(page.locator('#projSel option')).toHaveCount(2);
  await expect(page.locator('#badBox')).toContainText('Nie udało się wczytać: 1');

  await page.click('[data-bad="del"]');
  await expect(page.locator('#confirm')).toContainText('Najpierw możesz je pobrać');
  await page.click('#cYes');
  await expect(page.locator('#badBox')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rozdz-v2')).bad)).toEqual([]);
});

test('klawiatura: przewód dodany i usunięty bez myszy, aparat zaznaczony Enterem, zakładki strzałkami', async ({
  page
}) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  const d = await ids(page);
  const ep = e => page.locator(`svg.wires [data-ep='${JSON.stringify(e)}']`);
  const a = ep({ k: 'wlz', ph: 'L1' }),
    b = ep({ k: 'dev', id: d['Rozłącznik główny'], side: 'top', i: 0 });
  await expect(a).toHaveAttribute('tabindex', '0');
  await a.focus();
  await page.keyboard.press('Enter');
  await expect(a).toBeFocused(); // fokus wraca po przerysowaniu
  await expect(page.locator('svg.wires .tp.on')).toHaveCount(1);
  await b.focus();
  await page.keyboard.press(' ');
  await expect(page.locator('.toast')).toHaveText('Dodano przewód');
  const w = page.locator('svg.wires path[data-w]');
  await expect(w).toHaveCount(1);
  await w.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-wact="del"]')).toBeVisible();
  await page.keyboard.press('Delete');
  await expect(w).toHaveCount(0);

  // Aparat: Enter zaznacza.
  await page.click('[data-view="front"]');
  const s = page.locator(`#board .slot[data-id="${d['Gniazda salon']}"]`);
  await s.focus();
  await page.keyboard.press('Enter');
  await expect(s).toHaveClass(/sel/);
  await expect(s).toBeFocused();

  // Zakładki: strzałki i End, tylko wybrana w kolejności Tab.
  await page.locator('#tab-aparat').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-kontrola')).toBeFocused();
  await expect(page.locator('#tab-kontrola')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel')).toHaveAttribute('aria-labelledby', 'tab-kontrola');
  await page.keyboard.press('End');
  await expect(page.locator('#tab-bom')).toBeFocused();
  expect(await page.locator('#tabs [tabindex="0"]').count()).toBe(1);
});

test('Backspace nie usuwa aparatu (poza Makiem); Delete usuwa', async ({ page }) => {
  const mac = await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform || ''));
  await page.locator('#board .slot').nth(8).click();
  await page.keyboard.press('Backspace');
  await expect(page.locator('#board .slot')).toHaveCount(mac ? 20 : 21);
  if (!mac) {
    await page.keyboard.press('Delete');
    await expect(page.locator('#board .slot')).toHaveCount(20);
  }
});

test('wyłącznik różnicowonadprądowy ma zdolność zwarciową do ustawienia i naprawy', async ({ page }) => {
  const d = await ids(page),
    rc = d['Gniazda garaż / ogród'];
  expect(await page.evaluate(id => S.dev[id].p.icn, rc)).toBe(6);
  await page.evaluate(() => {
    S.set.ik0 = 10;
    S.set.wlzLen = 2;
    render();
  });
  expect((await issues(page)).some(x => x.includes('-F14') && x.includes('zdolność zwarciowa 6 kA'))).toBe(true);
  await page.locator(`#board .slot[data-id="${rc}"] .rt`).click();
  await expect(page.locator('#pIcn')).toHaveValue('6');
  await page.selectOption('#pIcn', '10');
  expect((await issues(page)).some(x => x.includes('-F14') && x.includes('zdolność zwarciowa'))).toBe(false);
  await expect(page.locator('#panel')).toContainText('typ A, 10 kA');
  // Plik sprzed tej wersji (RCBO bez pola icn) dostaje 6 kA.
  const j = await page.evaluate(() => exportData());
  delete Object.values(j.S.dev).find(x => x.t === 'rcbo').p.icn;
  await page.setInputFiles('#fOpen', {
    name: 'x.rozdz.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(j))
  });
  // plik jest czytany asynchronicznie (FileReader): czekamy na komunikat, zanim sprawdzimy stan
  await expect(page.locator('.toast')).toContainText('Wczytano projekt');
  await expect(page.locator('#projSel option')).toHaveCount(2);
  expect(await page.evaluate(() => Object.values(S.dev).find(x => x.t === 'rcbo').p.icn)).toBe(6);
});

test('strona nie łączy się z Google Fonts; czcionki z własnych plików mają polskie znaki', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const external = [];
  page.on('request', r => {
    const u = new URL(r.url());
    if (!['127.0.0.1', 'localhost'].includes(u.hostname) && u.protocol !== 'data:' && u.protocol !== 'blob:')
      external.push(r.url());
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
  const ok = await page.evaluate(async () => {
    const want = ['600 16px "Barlow Condensed"', '400 14px "Barlow"', '400 12px "JetBrains Mono"'];
    await Promise.all(want.map(f => document.fonts.load(f, 'Ąćęłńóśźż')));
    return want.map(f => document.fonts.check(f, 'Ąćęłńóśźż'));
  });
  expect(ok).toEqual([true, true, true]);
  await ctx.close();
});
