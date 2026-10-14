// Powiększanie obudowy i przenoszenie aparatów palcem.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
});

// Największa odległość [px ekranu] między środkiem klikalnego zacisku na rysunku a środkiem śruby aparatu, do której należy.
const terminalError = page =>
  page.evaluate(() => {
    let worst = 0;
    document.querySelectorAll('#board .slot').forEach(slot => {
      const id = slot.dataset.id,
        screws = [...slot.querySelectorAll('.trm:not(.b) .scr')];
      screws.forEach((s, i) => {
        const t = document.querySelector(`svg.wires [data-ep='${JSON.stringify({ k: 'dev', id, side: 'top', i })}']`);
        if (!t) return;
        const a = s.getBoundingClientRect(),
          b = t.getBoundingClientRect();
        worst = Math.max(
          worst,
          Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)),
          Math.abs(a.top + a.height / 2 - (b.top + b.height / 2))
        );
      });
    });
    return worst;
  });

test('powiększenie: przyciski, dopasowanie do szerokości, przewody nadal trafiają w zaciski', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  await expect(page.locator('#zoomVal')).toHaveText('100%');
  // Przy 100% różnica nie jest zerowa: kontrolki faz mają 3 śruby na 4 zaciski. Powiększenie ma ją tylko przeskalować.
  const base = await terminalError(page);
  expect(base).toBeLessThan(6);
  const size = () =>
    page.evaluate(() => {
      const b = document.querySelector('#board'),
        r = b.getBoundingClientRect(),
        w = document.querySelector('#boardZoom').getBoundingClientRect();
      return [b.offsetWidth, r.width, w.width, w.height, b.offsetHeight];
    });

  await page.click('[data-zoom="-"]');
  await page.click('[data-zoom="-"]');
  await expect(page.locator('#zoomVal')).toHaveText('67%');
  let [ow, rw, ww, wh, oh] = await size();
  expect(rw).toBeCloseTo(ow * 0.67, 0);
  expect(Math.abs(ww - ow * 0.67)).toBeLessThan(2); // obszar przewijania ma wymiary po skalowaniu
  expect(Math.abs(wh - oh * 0.67)).toBeLessThan(2);
  expect(await terminalError(page)).toBeLessThan(base * 0.67 + 1.5);
  expect(await page.locator('svg.wires path.w').count()).toBeGreaterThan(30);

  for (let i = 0; i < 4; i++) await page.click('[data-zoom="+"]');
  await expect(page.locator('#zoomVal')).toHaveText('150%');
  expect(await terminalError(page)).toBeLessThan(base * 1.5 + 1.5);

  // Kliknięcie zacisków w powiększeniu nadal dodaje przewód we właściwe miejsce.
  const n = await page.evaluate(() => S.conn.length);
  const d = await page.evaluate(() => {
    const m = {};
    Object.values(S.dev).forEach(x => {
      m[x.name] = x.id;
    });
    return m;
  });
  const ep = e => page.locator(`svg.wires [data-ep='${JSON.stringify(e)}']`);
  await ep({ k: 'dev', id: d['Rozłącznik główny'], side: 'bot', i: 0 }).click();
  await ep({ k: 'dev', id: d['RCD obwody ogólne'], side: 'top', i: 1 }).click();
  await expect(page.locator('.toast')).toContainText('dwie różne fazy (L1 i L2)');
  expect(await page.evaluate(() => S.conn.length)).toBe(n + 1);

  // Środkowy przycisk: przy innym powiększeniu wraca do 100%, przy 100% dopasowuje do szerokości.
  await page.click('[data-zoom="fit"]');
  await expect(page.locator('#zoomVal')).toHaveText('100%');
  await page.click('[data-zoom="fit"]');
  const fit = await page.evaluate(() => [
    S.zoom,
    document.querySelector('#board').getBoundingClientRect().width,
    document.querySelector('#boardScroll').clientWidth
  ]);
  expect(fit[0]).toBeLessThanOrEqual(1);
  expect(fit[1]).toBeLessThanOrEqual(fit[2] + 1);

  // Powiększenie to stan widoku: nie tworzy kroków cofania (jest jeden: dodany przewód) i nie trafia do pliku.
  expect(await page.evaluate(() => 'zoom' in exportData().S)).toBe(false);
  // Wydruk jest zawsze w skali własnej, niezależnie od powiększenia na ekranie.
  await page.evaluate(() => {
    window.print = () => {};
    S.zoom = 1.5;
    render(true);
  });
  await page.click('#bPrint');
  expect(await page.evaluate(() => /scale\(1\.5\)/.test(document.querySelector('#print').innerHTML))).toBe(false);
  await expect(page.locator('#zoomVal')).toHaveText('150%');
  expect(errors).toEqual([]);
});

test('Ctrl + kółko myszy nad obudową zmienia powiększenie', async ({ page }) => {
  await page.locator('#board').hover();
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -100);
  await page.keyboard.up('Control');
  await expect(page.locator('#zoomVal')).toHaveText('125%');
});

test('przenoszenie aparatu palcem: przytrzymanie, linia upuszczenia, nowe miejsce; krótki ruch przewija', async ({
  page
}) => {
  await page.evaluate(() => {
    COARSE = true;
    render();
  });
  await expect(page.locator('#board .slot[draggable="true"]')).toHaveCount(0);
  const d = await page.evaluate(() => {
    const m = {};
    Object.values(S.dev).forEach(x => {
      m[x.name] = x.id;
    });
    return m;
  });
  const touch = (type, sel, x, y) =>
    page.evaluate(
      ([t, s, cx, cy]) => {
        const el = s ? document.querySelector(s) : document.querySelector('#board');
        const ev = new Event(t, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, 'touches', { value: t === 'touchend' ? [] : [{ clientX: cx, clientY: cy }] });
        el.dispatchEvent(ev);
      },
      [type, sel, x, y]
    );
  const center = async sel => {
    const l = page.locator(sel);
    await l.scrollIntoViewIfNeeded();
    const b = await l.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2, b];
  };
  const src = `#board .slot[data-id="${d['Podgrzewacz wody']}"]`;
  const rowOfDev = () => page.evaluate(id => S.rows.findIndex(r => r.includes(id)), d['Podgrzewacz wody']);
  expect(await rowOfDev()).toBe(2);

  // Ruch bez przytrzymania: to przewijanie, aparat zostaje.
  let [x, y] = await center(src);
  await touch('touchstart', src, x, y);
  await touch('touchmove', src, x, y - 60);
  await touch('touchend', src, x, y - 60);
  expect(await rowOfDev()).toBe(2);

  // Przytrzymanie, przeciągnięcie nad wolne miejsce rzędu 1 i puszczenie.
  [x, y] = await center(src);
  await touch('touchstart', src, x, y);
  await page.waitForTimeout(450);
  await expect(page.locator(src)).toHaveClass(/lifting/);
  const [bx, by] = await center('#board .rail[data-row="0"] .blank');
  await touch('touchmove', src, bx, by);
  await expect(page.locator('#board .rail[data-row="0"] .dropline')).toHaveCount(1);
  await touch('touchend', src, bx, by);
  expect(await rowOfDev()).toBe(0);
  expect(await page.evaluate(id => S.rows[0].indexOf(id), d['Podgrzewacz wody'])).toBe(6); // na końcu rzędu 1
  await expect(page.locator('#board .dropline')).toHaveCount(0);
  await page.click('#bUndo');
  expect(await rowOfDev()).toBe(2);
});

// Prawdziwe zdarzenia dotyku przeglądarki (Chromium DevTools Protocol, emulacja telefonu z ekranem dotykowym),
// a nie zdarzenia tworzone w skrypcie strony. Sprawdza ścieżkę, którą przechodzi palec na telefonie.
test.describe('dotyk w emulacji telefonu', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test.skip(({ browserName }) => browserName !== 'chromium', 'zdarzenia dotyku przez CDP są dostępne tylko w Chromium');

  const touch = async (cdp, type, x, y) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const center = async (page, sel) => {
    const l = page.locator(sel);
    await l.scrollIntoViewIfNeeded();
    const b = await l.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };

  test('przytrzymanie i przeciągnięcie aparatu palcem przenosi go do innego rzędu', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    expect(await page.evaluate(() => [matchMedia('(pointer: coarse)').matches, COARSE])).toEqual([true, true]);
    await expect(page.locator('#board .slot[draggable="true"]')).toHaveCount(0);
    const id = await page.evaluate(() => Object.values(S.dev).find(d => d.name === 'Podgrzewacz wody').id);
    const src = `#board .slot[data-id="${id}"] .rt`;
    let [x, y] = await center(page, src);
    await touch(cdp, 'touchStart', x, y);
    await page.waitForTimeout(450);
    await expect(page.locator(`#board .slot[data-id="${id}"]`)).toHaveClass(/lifting/);
    const [bx, by] = await center(page, '#board .rail[data-row="0"] .blank');
    for (let i = 1; i <= 6; i++) await touch(cdp, 'touchMove', x + ((bx - x) * i) / 6, y + ((by - y) * i) / 6);
    await expect(page.locator('#board .rail[data-row="0"] .dropline')).toHaveCount(1);
    await touch(cdp, 'touchEnd');
    expect(await page.evaluate(i => S.rows.findIndex(r => r.includes(i)), id)).toBe(0);
  });

  test('krótki ruch palcem przewija stronę i niczego nie przenosi', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const id = await page.evaluate(() => Object.values(S.dev).find(d => d.name === 'Podgrzewacz wody').id);
    const [x, y] = await center(page, `#board .slot[data-id="${id}"] .rt`);
    await touch(cdp, 'touchStart', x, y);
    for (let i = 1; i <= 4; i++) await touch(cdp, 'touchMove', x, y - 30 * i);
    await touch(cdp, 'touchEnd');
    await page.waitForTimeout(200);
    expect(await page.evaluate(i => S.rows.findIndex(r => r.includes(i)), id)).toBe(2);
    await expect(page.locator('#board .slot.lifting')).toHaveCount(0);
  });

  test('przewód przeciągnięty palcem od zacisku do zacisku', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await page.click('[data-view="wires"]');
    await page.click('[data-wmode="manual"]');
    const q = await page.evaluate(() => Object.values(S.dev).find(d => d.t === 'sw').id);
    const a = `svg.wires [data-ep='${JSON.stringify({ k: 'wlz', ph: 'L1' })}']`,
      b = `svg.wires [data-ep='${JSON.stringify({ k: 'dev', id: q, side: 'top', i: 0 })}']`;
    // oba zaciski są blisko siebie: przewijamy do pierwszego i bierzemy współrzędne obu bez kolejnego przewijania
    await page.locator(a).evaluate(e => e.scrollIntoView({ block: 'start' }));
    const box = async s => {
      const r = await page.locator(s).boundingBox();
      return [r.x + r.width / 2, r.y + r.height / 2];
    };
    const [ax, ay] = await box(a),
      [bx, by] = await box(b);
    await touch(cdp, 'touchStart', ax, ay);
    for (let i = 1; i <= 8; i++) await touch(cdp, 'touchMove', ax + ((bx - ax) * i) / 8, ay + ((by - ay) * i) / 8);
    await touch(cdp, 'touchEnd');
    await expect(page.locator('.toast')).toHaveText('Dodano przewód');
    expect(await page.evaluate(() => S.conn.length)).toBe(1);
  });
});
