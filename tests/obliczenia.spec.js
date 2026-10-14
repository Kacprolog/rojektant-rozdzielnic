// Spadki napięcia, pętla zwarcia, prąd zwarciowy względem zdolności wyłączalnej.
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
const found = page =>
  page.evaluate(() =>
    checks()
      .filter(c => c.sev !== 'info')
      .map(c => c.sev + ': ' + c.msg.replace(/<[^>]+>/g, ''))
  );
const set = (page, id, path, v) =>
  page.evaluate(
    ([i, k, x]) => {
      const [a, b] = k.split('.');
      S.dev[i][a][b] = x;
      render();
    },
    [id, path, v]
  );
const fix = (page, label) => page.locator('#panel [data-fix]', { hasText: label });

test('przykład: wielkości sieci zgodne z ręcznym rachunkiem i brak nowych uwag', async ({ page }) => {
  expect(await found(page)).toEqual([]);
  const n = await page.evaluate(() => netCalc());
  // WLZ 15 m, 10 mm²: Zs = 0,3 + 1,25·2·15/(56·10) = 0,367 Ω; Ik = 400/(√3·(0,0385 + 0,0268)) = 3,54 kA; ΔU = 100·19750·15/(56·10·400²) = 0,33%.
  expect(n.zsB).toBeCloseTo(0.367, 3);
  expect(n.ikB).toBeCloseTo(3.54, 2);
  expect(n.duWlz).toBeCloseTo(0.331, 3);
  const d = await ids(page);
  // Gniazda salon: 2 kW, 14 m, 2,5 mm², B16. ΔU = 200·2000·14/(56·2,5·230²) = 0,756%; Zs = 0,367 + 1,25·28/140 = 0,617 Ω; Ia = 80 A.
  const c = await page.evaluate(id => circCalc(S.dev[id]), d['Gniazda salon']);
  expect(c.du).toBeCloseTo(0.756, 3);
  expect(c.zs).toBeCloseTo(0.617, 3);
  expect(c.ia).toBe(80);
  expect(c.trip).toBe(true);
});

test('za długi obwód: spadek napięcia z naprawą przekroju', async ({ page }) => {
  const d = await ids(page),
    id = d['Gniazda pokoje piętro'];
  await set(page, id, 'c.len', 120);
  const out = await found(page);
  expect(out.length).toBe(1);
  expect(out[0]).toContain(
    'warn: -F10 Gniazda pokoje piętro: spadek napięcia 5,83% przekracza 3% (120 m, 2,5 mm², 1,8 kW).'
  );
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Zwiększ przewód do 6 mm²').click();
  expect(await found(page)).toEqual([]);
  expect(await page.evaluate(i => S.dev[i].c.cable, id)).toBe(6);
});

test('samoczynne wyłączenie: błąd bez różnicówki, uwaga z różnicówką', async ({ page }) => {
  const d = await ids(page);
  // Pompa ciepła C16, 2,5 mm², bez RCD, 100 m: Zs = 0,367 + 1,25·200/140 = 2,15 Ω > 230/160 = 1,44 Ω.
  await set(page, d['Pompa ciepła'], 'c.len', 100);
  let out = await found(page);
  expect(out.length).toBe(1);
  expect(out[0]).toContain(
    'crit: -F16 Pompa ciepła: pętla zwarcia 2,15 Ω daje prąd zwarcia 107 A, mniej niż próg wyzwalania 160 A (C16).'
  );
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Zwiększ przewód do 6 mm²').click();
  expect(await found(page)).toEqual([]);

  // Ładowarka EV C20 za różnicówką, 200 m: wyłączenie zapewnia RCD, więc to uwaga (oraz osobna uwaga o spadku napięcia).
  await set(page, d['Ładowarka EV 11 kW'], 'c.len', 200);
  out = await found(page);
  expect(out.filter(x => x.startsWith('crit'))).toEqual([]);
  expect(out.some(x => x.includes('pętla zwarcia') && x.includes('Wyłączenie przy zwarciu do PE zapewnia -F11.'))).toBe(
    true
  );
  expect(out.some(x => x.includes('-F12') && x.includes('spadek napięcia'))).toBe(true);
});

test('zdolność zwarciowa aparatów względem prądu zwarciowego w rozdzielnicy', async ({ page }) => {
  await page.click('[data-tab="bilans"]');
  await page.fill('#sIk', '10');
  await page.locator('#sIk').blur();
  await page.fill('#sWl', '2');
  await page.locator('#sWl').blur();
  await expect(page.locator('#netSpecs')).toContainText('8,7 kA');
  let out = await found(page);
  expect(out.length).toBe(13); // 12 wyłączników nadprądowych 6 kA i wyłącznik różnicowonadprądowy
  expect(out[0]).toContain('zdolność zwarciowa 6 kA jest mniejsza niż prąd zwarciowy w rozdzielnicy 8,7 kA');
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Ustaw Icn 10 kA').first().click();
  out = await found(page);
  expect(out.length).toBe(12);
  // Ustawienia sieci są danymi projektu: trafiają do pliku i cofają się.
  expect(await page.evaluate(() => exportData().S.set.ik0)).toBe(10);
  await page.click('#bUndo');
  await page.click('#bUndo');
  await page.click('#bUndo');
  expect(await found(page)).toEqual([]);
});

test('układ TT: obwody bez różnicówki są błędem, pętla zwarcia nie jest oceniana', async ({ page }) => {
  const d = await ids(page);
  await set(page, d['Pompa ciepła'], 'c.len', 100);
  await page.evaluate(() => {
    S.set.siec = 'TT';
    render();
  });
  const out = await found(page);
  expect(
    out.filter(x => x.includes('w układzie TT samoczynne wyłączenie zasilania wymaga wyłącznika różnicowoprądowego'))
      .length
  ).toBe(2); // podgrzewacz, pompa ciepła
  expect(out.some(x => x.includes('pętla zwarcia'))).toBe(false);
});

test('panel aparatu pokazuje ΔU, Zs i Ik1 i odświeża je podczas wpisywania długości', async ({ page }) => {
  const d = await ids(page);
  await page.locator(`#board .slot[data-id="${d['Gniazda salon']}"] .rt`).click();
  const box = page.locator('#calcBox');
  await expect(box).toContainText('0,76 %');
  await expect(box).toContainText('0,62 Ω');
  await expect(box).toContainText('Zs ≤ 2,88 Ω');
  await expect(box).toContainText('spełnione');
  await page.fill('#cLen', '250');
  await expect(box).toContainText('13,5 %');
  await expect(box).toContainText('niespełnione');
  await expect(page.locator('#cLen')).toBeFocused();
  await expect(page.locator('#stats')).toContainText('uwagi');
});

test('starszy projekt bez danych sieci dostaje wartości domyślne', async ({ page }) => {
  await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('rozdz-v2'));
    ['zs0', 'ik0', 'wlzLen', 'duObw', 'duWlz'].forEach(k => delete j.list[0].S.set[k]);
    localStorage.setItem('rozdz-v2', JSON.stringify(j));
  });
  await page.reload();
  expect(await page.evaluate(() => [sv('zs0'), sv('ik0'), sv('wlzLen'), sv('duObw'), sv('duWlz')])).toEqual([
    0.3, 6, 15, 3, 0.5
  ]);
  expect(await found(page)).toEqual([]);
});

test('symulacja zwarcia korzysta z obliczonego prądu', async ({ page }) => {
  const d = await ids(page);
  await set(page, d['Pompa ciepła'], 'c.len', 100);
  await page.click('#bSim');
  await page.locator(`#board .slot[data-id="${d['Pompa ciepła']}"] .rt`).click();
  await page.click('[data-sim="short"]');
  await expect(page.locator('#simBar .simlog')).toContainText(
    'prąd zwarcia na końcu obwodu ok. 107 A jest mniejszy niż próg 160 A, więc człon zwarciowy nie zadziała'
  );
});

test('prąd szczytowy każdej fazy osobno względem zabezpieczenia przedlicznikowego', async ({ page }) => {
  // Przykład mieści się na każdej fazie (L1 27,2 A, L2 31,1 A, L3 31,8 A przy 32 A).
  const peak = await page.evaluate(() => {
    const L = phaseLoads();
    return ['L1', 'L2', 'L3'].map(p => +(L[p] * S.set.ks).toFixed(1));
  });
  expect(peak).toEqual([27.2, 31.1, 31.8]);
  expect(await found(page)).toEqual([]);
  // Przeniesienie gniazd garażowych z L2 na L3 przeciąża L3, choć średni prąd trzech faz się nie zmienia.
  const d = await ids(page);
  await set(page, d['Gniazda garaż / ogród'], 'c.ph', 'L3');
  expect(await found(page)).toEqual([
    'warn: Prąd szczytowy fazy L3 (35,2 A) przekracza zabezpieczenie przedlicznikowe 32 A.'
  ]);
  await page.click('[data-tab="kontrola"]');
  await fix(page, 'Rozłóż fazy').click();
  expect(await found(page)).toEqual([]);
});
