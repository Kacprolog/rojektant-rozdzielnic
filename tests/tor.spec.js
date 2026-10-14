// Licznik i stycznik w torze obwodu: zaciski, okablowanie, kontrola, sterowanie w symulacji.
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
const found = page => page.evaluate(() => checks().map(c => c.sev + ': ' + c.msg.replace(/<[^>]+>/g, '')));
const slot = (page, id) => page.locator(`#board .slot[data-id="${id}"]`);
const tor = (page, cid) =>
  page.evaluate(id => {
    const D = designations();
    return buildConns()
      .C.filter(c => [c.a, c.b].some(e => e.k === 'dev' && S.dev[e.id].circ === id))
      .map(c => epName(c.a, D) + ' → ' + epName(c.b, D) + ' ' + c.mm);
  }, cid);

test('przykład: licznik w torze pompy ciepła i stycznik w torze bojlera mają zaciski i przewody', async ({ page }) => {
  const d = await ids(page);
  expect(
    await page.evaluate(
      ([m, k]) => [terms(S.dev[m]).top.join(), terms(S.dev[k]).top.join()],
      [d['Podlicznik pompy ciepła'], d['Bojler – taryfa G12']]
    )
  ).toEqual(['L1,L2,L3,N', 'L3,N']);
  // Przewody o przekroju kabla obwodowego (2,5 mm²); N z listwy głównej, bo oba obwody nie mają różnicówki.
  expect(await tor(page, d['Pompa ciepła'])).toEqual([
    '-F16 wyj. L1 → -P1 wej. L1 2.5',
    '-F16 wyj. L2 → -P1 wej. L2 2.5',
    '-F16 wyj. L3 → -P1 wej. L3 2.5',
    'Listwa N → -P1 wej. N 2.5'
  ]);
  expect(await tor(page, d['Podgrzewacz wody'])).toEqual([
    '-F15 wyj. L3 → -K2 wej. L3 2.5',
    'Listwa N → -K2 wej. N 2.5'
  ]);
  expect((await found(page)).filter(x => !x.startsWith('info'))).toEqual([]);
  // Odejście do kabla obwodowego jest rysowane z ostatniego aparatu toru.
  await page.click('[data-view="wires"]');
  const title = id =>
    page.evaluate(i => {
      const t = [...document.querySelectorAll('svg.wires text title')].find(x => x.textContent.includes(S.dev[i].name));
      const tx = t.parentNode.getBoundingClientRect();
      const dv = document
        .querySelector(`#board .slot[data-id="${S.dev[i].circ ? i : i}"] .dev`)
        .getBoundingClientRect();
      return [tx.left + tx.width / 2, dv.left, dv.right];
    }, id);
  const where = async (circuit, last) => {
    const [x] = await title(circuit);
    const b = await slot(page, last).locator('.dev').boundingBox();
    return x >= b.x && x <= b.x + b.width;
  };
  expect(await where(d['Pompa ciepła'], d['Podlicznik pompy ciepła'])).toBe(true);
  expect(await where(d['Podgrzewacz wody'], d['Bojler – taryfa G12'])).toBe(true);
  expect(await where(d['Gniazda salon'], d['Gniazda salon'])).toBe(true);
});

test('wybór toru w panelu aparatu, aparat poza torem, usunięcie obwodu', async ({ page }) => {
  const d = await ids(page),
    k = d['Bojler – taryfa G12'];
  await slot(page, k).locator('.rt').click();
  await expect(page.locator('#iCirc')).toHaveValue(d['Podgrzewacz wody']);
  await expect(page.locator('#pCtl')).toHaveValue('g12');
  await page.selectOption('#iCirc', '');
  expect(await page.evaluate(i => [S.dev[i].circ, terms(S.dev[i]).top.length, buildConns().C.length], k)).toEqual([
    '',
    0,
    46
  ]);
  expect(await found(page)).toContain('info: -K2 Bojler – taryfa G12 nie jest w torze żadnego obwodu.');
  // Przeniesienie do toru obwodu za różnicówką: N z listwy tej różnicówki.
  await page.selectOption('#iCirc', d['Gniazda salon']);
  expect(await tor(page, d['Gniazda salon'])).toEqual([
    '-F5 wyj. L3 → -K2 wej. L3 2.5',
    'Listwa N -F2 → -K2 wej. N 2.5'
  ]);
  // Usunięcie obwodu zwalnia aparaty z jego toru.
  await page.evaluate(i => delDev(i), d['Gniazda salon']);
  expect(await page.evaluate(i => S.dev[i].circ, k)).toBe(null);
  await page.click('#bUndo');
  expect(await page.evaluate(i => S.dev[i].circ, k)).toBe(d['Gniazda salon']);
});

test('kontrola toru: za słaby stycznik, stycznik 2NO i licznik 1F w obwodzie trójfazowym, brak przekaźnika', async ({
  page
}) => {
  const d = await ids(page),
    k = d['Bojler – taryfa G12'],
    m = d['Podlicznik pompy ciepła'];
  const crit = async () => (await found(page)).filter(x => !x.startsWith('info'));
  await page.evaluate(
    ([i, c]) => {
      S.dev[i].circ = c;
      render();
    },
    [k, d['Pompa ciepła']]
  );
  expect(await crit()).toContain(
    'crit: -K2 Bojler – taryfa G12 (2NO) nie rozłączy wszystkich faz obwodu trójfazowego -F16.'
  );
  await page.click('[data-tab="kontrola"]');
  await page.locator('#panel [data-fix]', { hasText: 'Zmień na stycznik 4NO' }).click();
  expect(await page.evaluate(i => terms(S.dev[i]).top.join(), k)).toBe('L1,L2,L3,N');
  expect(await crit()).toEqual([]);

  await page.evaluate(i => {
    S.dev[i].p.In = 20;
    S.dev[i].p.ctl = 'relay';
    render();
  }, k);
  await page.evaluate(i => {
    S.dev[i].p.In = 25;
    S.dev[i].c.cable = 4;
    render();
  }, d['Pompa ciepła']);
  expect(await crit()).toContain(
    'crit: -K2 Bojler – taryfa G12: prąd znamionowy 20 A jest mniejszy niż zabezpieczenie obwodu -F16 (25 A).'
  );
  await page.evaluate(i => delDev(i), d['Kontrola faz PC']);
  expect(
    (await crit()).some(x => x.includes('ma być sterowany przekaźnikiem kontroli faz, ale w rozdzielnicy go nie ma'))
  ).toBe(true);

  await page.evaluate(i => {
    S.dev[i].p.ph = 1;
    render();
  }, m);
  expect((await crit()).some(x => x.includes('jest jednofazowy, a obwód') && x.includes('jest trójfazowy'))).toBe(true);
});

test('symulacja: taryfa G12 rozłącza bojler, przekaźnik kontroli faz rozłącza pompę ciepła przy zaniku fazy', async ({
  page
}) => {
  const d = await ids(page),
    k = d['Bojler – taryfa G12'];
  await page.click('#bSim');
  const count = page.locator('#simCount');
  await expect(count).toHaveText('Zasilone obwody: 13/13');
  // Stycznik taryfowy nie reaguje na kliknięcie dźwigni, tylko na sygnał taryfy.
  await slot(page, k).locator('.lever').click();
  await expect(page.locator('.toast')).toContainText('sygnał taryfy G12');
  await expect(count).toHaveText('Zasilone obwody: 13/13');
  await page.click('[data-sim="g12"]');
  await expect(count).toHaveText('Zasilone obwody: 12/13');
  await expect(slot(page, k)).toHaveClass(/s-off/);
  await expect(slot(page, d['Podgrzewacz wody'])).toHaveClass(/s-ctl/); // wyłącznik załączony, odbiornik bez napięcia
  await expect(page.locator('[data-sim="g12"]')).toContainText('dzienna');
  await page.click('[data-sim="g12"]');
  await expect(count).toHaveText('Zasilone obwody: 13/13');

  // Stycznik 4NO w torze pompy ciepła, sterowany przekaźnikiem kontroli faz.
  await page.evaluate(
    ([i, c]) => {
      S.dev[i].circ = c;
      S.dev[i].p.poles = 4;
      S.dev[i].p.ctl = 'relay';
      render();
    },
    [k, d['Pompa ciepła']]
  );
  await expect(count).toHaveText('Zasilone obwody: 13/13');
  await page.selectOption('[data-simph]', 'L1');
  await expect(slot(page, k)).toHaveClass(/s-off/);
  await expect(slot(page, d['Pompa ciepła'])).toHaveClass(/s-ctl/); // odłączona, a nie zasilana niepełnie
  await expect(page.locator('#simBar .simlog')).toContainText(
    '-K1 Kontrola faz PC wykrywa zanik fazy i rozłącza: -K2 (Pompa ciepła).'
  );
  await page.selectOption('[data-simph]', '');
  await expect(slot(page, d['Pompa ciepła'])).toHaveClass(/s-on/);

  // Stycznik ręczny reaguje na dźwignię.
  await page.evaluate(i => {
    S.dev[i].p.ctl = 'man';
    render();
  }, k);
  await slot(page, k).locator('.lever').click();
  await expect(slot(page, d['Pompa ciepła'])).toHaveClass(/s-ctl/);
  await expect(count).toHaveText('Zasilone obwody: 12/13');
});

test('okablowanie ręczne toru: przejęcie bez uwag, ominięcie zabezpieczenia jest błędem, starszy projekt bez toru działa', async ({
  page
}) => {
  const d = await ids(page);
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  expect(await page.evaluate(() => wireCheck().out.length)).toBe(0);
  // Zasilenie licznika wprost z rozłącznika omija wyłącznik pompy ciepła.
  await page.evaluate(
    ([q, m]) => {
      wireClick({ k: 'dev', id: q, side: 'bot', i: 0 });
      wireClick({ k: 'dev', id: m, side: 'top', i: 0 });
    },
    [d['Rozłącznik główny'], d['Podlicznik pompy ciepła']]
  );
  await expect(page.locator('.toast')).toContainText(
    'zasila aparat w torze obwodu -F16 z pominięciem jego zabezpieczenia'
  );

  // Projekt zapisany przed wersją 0.14.0: licznik i stycznik bez pola circ zostają poza torem.
  await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('rozdz-v2'));
    Object.values(j.list[0].S.dev).forEach(x => {
      delete x.circ;
      if (x.p) delete x.p.ctl;
    });
    j.list[0].S.conn = [];
    j.list[0].S.wmode = 'auto';
    localStorage.setItem('rozdz-v2', JSON.stringify(j));
  });
  await page.reload();
  expect(
    await page.evaluate(() => [buildConns().C.length, Object.values(S.dev).filter(x => x.t === 'contactor')[0].p.ctl])
  ).toEqual([42, 'man']);
});
