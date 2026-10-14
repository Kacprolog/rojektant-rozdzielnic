// Przewody sterownicze: cewka stycznika A1/A2, styk przekaźnika kontroli faz 11–14, sygnał taryfy G12.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

const id = (page, name) => page.evaluate(n => Object.values(S.dev).find(d => d.name === n).id, name);
const ctlWires = page =>
  page.evaluate(() => {
    const D = designations();
    return buildConns()
      .C.filter(c => c.ph === 'S')
      .map(c => epName(c.a, D) + ' → ' + epName(c.b, D) + ' ' + c.mm);
  });
const found = page => page.evaluate(() => checks().map(c => c.sev + ': ' + c.msg.replace(/<[^>]+>/g, '')));

test('cewka stycznika dostaje przewody sterownicze zależnie od sposobu sterowania', async ({ page }) => {
  const k = await id(page, 'Bojler – taryfa G12');
  expect(await ctlWires(page)).toEqual([
    'Sygnał taryfy G12 (licznik OSD) → -K2 cewka A1 1.5',
    'Listwa N → -K2 cewka A2 1.5'
  ]);
  await page.evaluate(i => {
    S.dev[i].p.ctl = 'relay';
    render();
  }, k);
  expect(await ctlWires(page)).toEqual([
    '-F15 wyj. L3 → -K1 styk 11 1.5',
    '-K1 styk 14 → -K2 cewka A1 1.5',
    'Listwa N → -K2 cewka A2 1.5'
  ]);
  await page.evaluate(i => {
    S.dev[i].p.ctl = 'man';
    render();
  }, k);
  expect(await ctlWires(page)).toEqual(['-F15 wyj. L3 → -K2 cewka A1 1.5', 'Listwa N → -K2 cewka A2 1.5']);
  expect((await found(page)).filter(x => !x.startsWith('info'))).toEqual([]);
  // rysunek: czerwone przewody, filtr żyły S, zestawienie materiałów
  await page.click('[data-view="wires"]');
  await expect(page.locator('svg.wires path.w[stroke="var(--s)"]')).toHaveCount(2);
  await page.click('[data-wf="S"]');
  await expect(page.locator('svg.wires path.w[stroke="var(--s)"]')).toHaveCount(0);
  await page.click('[data-tab="bom"]');
  await expect(page.locator('#panel')).toContainText('1,5 mm², sterowniczy czerwony');
});

test('symulacja: stycznik załącza się tylko wtedy, gdy cewka ma napięcie', async ({ page }) => {
  const k = await id(page, 'Bojler – taryfa G12'),
    f = await id(page, 'Podgrzewacz wody');
  const st = () => page.evaluate(([a, b]) => [simCalc().dev[a].st, simCalc().dev[b].st], [k, f]);
  await page.click('#bSim');
  expect(await st()).toEqual(['on', 'on']);
  await page.evaluate(() => simG12()); // sygnał taryfy znika
  expect(await st()).toEqual(['off', 'ctl']);
  await page.evaluate(() => simG12());
  // ręczne okablowanie bez przewodu A1: stycznik nie załączy, a kontrola to zgłasza z naprawą
  await page.click('#bSim');
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  await page.evaluate(i => {
    S.conn = S.conn.filter(w => !(w.b.id === i && w.b.c === 'A1'));
    render();
  }, k);
  expect(await found(page)).toContain(
    'warn: -K2 Bojler – taryfa G12: cewka nie jest podłączona (A1). Stycznik nie załączy obwodu.'
  );
  await page.click('#bSim');
  expect(await st()).toEqual(['off', 'ctl']);
  await page.click('#bSim');
  await page.click('[data-tab="kontrola"]');
  await page.locator('#panel [data-fix]', { hasText: 'Dodaj przewody cewki' }).click();
  expect(await found(page)).not.toContain(
    'warn: -K2 Bojler – taryfa G12: cewka nie jest podłączona (A1). Stycznik nie załączy obwodu.'
  );
  expect(await page.evaluate(() => S.conn.length)).toBe(44);
  // przekaźnik kontroli faz: zanik fazy otwiera jego styk 11–14 i stycznik odpada
  await page.click('[data-wmode="auto"]');
  await page.evaluate(i => {
    S.dev[i].p.ctl = 'relay';
    render();
  }, k);
  await page.click('#bSim');
  expect(await st()).toEqual(['on', 'on']);
  await page.evaluate(() => simPhase('L1'));
  expect(await st()).toEqual(['off', 'ctl']);
});

test('kontrola ręcznych przewodów sterowniczych', async ({ page }) => {
  const k = await id(page, 'Bojler – taryfa G12'),
    f = await id(page, 'Podgrzewacz wody');
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  const sevOf = (a, b) =>
    page.evaluate(
      ([a, b]) => {
        S.conn.push({ id: 'w9999', a, b });
        const r = wireCheck();
        S.conn.pop();
        return [r.bad.w9999 || 'ok', (r.why.w9999 || '').replace(/<[^>]+>/g, '')];
      },
      [a, b]
    );
  const A1 = { k: 'dev', id: k, side: 'top', c: 'A1' },
    A2 = { k: 'dev', id: k, side: 'bot', c: 'A2' };
  expect((await sevOf({ k: 'bar', bar: 'PE' }, A2))[0]).toBe('crit'); // PE na cewkę
  expect(await sevOf({ k: 'wlz', ph: 'L1' }, A1)).toEqual([
    'crit',
    'Przewód WLZ → -K2 cewka A1 zasila obwód sterowania bez zabezpieczenia nadprądowego.'
  ]);
  expect((await sevOf({ k: 'bar', bar: 'N' }, A1))[0]).toBe('warn'); // N na A1
  expect((await sevOf({ k: 'dev', id: f, side: 'bot', i: 0 }, A2))[0]).toBe('warn'); // faza na A2
  expect((await sevOf({ k: 'dev', id: f, side: 'bot', i: 0 }, A1))[0]).toBe('ok'); // A1 z wyjścia wyłącznika obwodu
  const rcdN = await page.evaluate(() => 'N:' + Object.values(S.dev).find(d => d.t === 'rcd').id);
  expect((await sevOf({ k: 'bar', bar: rcdN }, A2))[0]).toBe('crit'); // N cewki z innej strefy niż sygnał G12
});

test('zaciski sterownicze w pliku projektu: zapis nazwą, błędne odrzucane', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  const j = await page.evaluate(() => exportData());
  const ctl = j.S.conn.filter(w => w.a.c || w.b.c || w.a.ph === 'G12');
  expect(ctl.length).toBe(2);
  j.S.conn.push({ id: 'w8000', a: { k: 'wlz', ph: 'G12' }, b: { k: 'dev', id: ctl[0].b.id, side: 'top', c: 'Z9' } });
  j.S.name = 'Sterowanie';
  await page.setInputFiles('#fOpen', {
    name: 'x.rozdz.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(j))
  });
  await expect(page.locator('.toast')).toContainText('Wczytano projekt „Sterowanie”');
  expect(
    await page.evaluate(() => [S.conn.length, S.conn.filter(w => w.b.c === 'A1' || w.b.c === 'A2').length])
  ).toEqual([44, 2]);
  expect((await found(page)).filter(x => !x.startsWith('info'))).toEqual([]);
});
