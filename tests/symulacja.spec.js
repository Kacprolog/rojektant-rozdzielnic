// Symulacja (żywa rozdzielnica), awarie i przeciąganie przewodów.
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
const slot = (page, id) => page.locator(`#board .slot[data-id="${id}"]`);
const count = page => page.locator('#simCount');
const log = page => page.locator('#simBar .simlog');

test('symulacja jest domyślnie wyłączona; po włączeniu wszystkie obwody są zasilone', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await expect(page.locator('#simBar')).toBeHidden();
  await expect(page.locator('#bSim')).toHaveAttribute('aria-pressed', 'false');
  await page.click('#bSim');
  await expect(page.locator('#bSim')).toHaveAttribute('aria-pressed', 'true');
  await expect(count(page)).toHaveText('Zasilone obwody: 13/13');
  await expect(page.locator('#board .slot.s-on')).toHaveCount(21); // także licznik i stycznik, bo stoją w torach obwodów
  await expect(page.locator('#board .slot.s-none')).toHaveCount(0);
  // W widoku okablowania po przewodach z prądem przesuwają się kreski.
  await page.click('[data-view="wires"]');
  expect(await page.locator('svg.wires path.flow').count()).toBeGreaterThan(15);
  await page.click('#bSim');
  await expect(page.locator('#simBar')).toBeHidden();
  await expect(page.locator('svg.wires path.flow')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('dźwignie: różnicówka gasi swoje obwody, rozłącznik główny gasi wszystko', async ({ page }) => {
  await page.click('#bSim');
  const d = await ids(page);
  const r1 = d['RCD obwody ogólne'],
    q = d['Rozłącznik główny'];

  await slot(page, r1).locator('.lever').click();
  await expect(count(page)).toHaveText('Zasilone obwody: 4/13'); // 8 obwodów w rzędzie 2 i płyta indukcyjna są za tą różnicówką
  await expect(slot(page, r1)).toHaveClass(/s-off/);
  await expect(slot(page, r1).locator('.lever')).toHaveClass(/off/);
  await expect(slot(page, d['Gniazda salon'])).toHaveClass(/s-dead/);
  await expect(slot(page, d['Płyta indukcyjna'])).toHaveClass(/s-dead/);
  await expect(slot(page, d['Ładowarka EV 11 kW'])).toHaveClass(/s-on/);

  await slot(page, r1).locator('.lever').click();
  await expect(count(page)).toHaveText('Zasilone obwody: 13/13');

  await slot(page, q).locator('.lever').click();
  await expect(count(page)).toHaveText('Zasilone obwody: 0/13');
  await expect(slot(page, d['Kontrolki faz']).locator('.leds i.dim')).toHaveCount(3);
  // Przycisk TEST nie działa bez napięcia.
  await slot(page, r1).locator('.tbtn').click();
  await expect(page.locator('.toast')).toContainText('tylko na załączonym aparacie pod napięciem');
  await page.click('[data-sim="reset"]');
  await expect(count(page)).toHaveText('Zasilone obwody: 13/13');
  await slot(page, r1).locator('.tbtn').click();
  await expect(count(page)).toHaveText('Zasilone obwody: 4/13');
  await expect(log(page)).toContainText(
    'Test -F2 RCD obwody ogólne: wyłącznik zadziałał prawidłowo. Bez zasilania: 9 obw.'
  );
});

test('awarie: zwarcie, upływ z różnicówką i bez niej, przeciążenie', async ({ page }) => {
  await page.click('#bSim');
  const d = await ids(page);
  // Bez zaznaczonego obwodu jest podpowiedź.
  await page.click('[data-sim="short"]');
  await expect(page.locator('.toast')).toContainText('Zaznacz obwód');

  // Zwarcie wyłącza tylko swój wyłącznik.
  await slot(page, d['Gniazda salon']).locator('.rt').click();
  await page.click('[data-sim="short"]');
  await expect(count(page)).toHaveText('Zasilone obwody: 12/13');
  await expect(log(page)).toContainText('Zwarcie w obwodzie -F5 Gniazda salon: zadziałał -F5 (człon zwarciowy, B16).');
  await expect(page.locator('.toast')).toHaveClass(/alert/);
  // Ten sam obwód po wyłączeniu: nic się nie dzieje.
  await page.click('[data-sim="leak"]');
  await expect(log(page)).toContainText('obwód nie jest zasilony');
  await page.click('[data-sim="reset"]');

  // Upływ w obwodzie za wspólną różnicówką gasi 9 obwodów.
  await slot(page, d['Gniazda kuchnia']).locator('.rt').click();
  await page.click('[data-sim="leak"]');
  await expect(count(page)).toHaveText('Zasilone obwody: 4/13');
  await expect(log(page)).toContainText('zadziałał -F2 (IΔn 30 mA)');
  await expect(log(page)).toContainText('Razem bez zasilania: 9 obw.');
  await page.click('[data-sim="reset"]');

  // RCBO wyłącza tylko siebie.
  await slot(page, d['Gniazda garaż / ogród']).locator('.rt').click();
  await page.click('[data-sim="leak"]');
  await expect(count(page)).toHaveText('Zasilone obwody: 12/13');
  await page.click('[data-sim="reset"]');

  // Obwód bez różnicówki: nic go nie wyłączy.
  await slot(page, d['Podgrzewacz wody']).locator('.rt').click();
  await page.click('[data-sim="leak"]');
  await expect(count(page)).toHaveText('Zasilone obwody: 13/13');
  await expect(log(page)).toContainText('nie ma wyłącznika różnicowoprądowego, więc nic go nie wyłączy');

  // Przeciążenie przy przewodzie słabszym niż zabezpieczenie.
  await page.evaluate(id => {
    S.dev[id].c.cable = 1.5;
    render();
  }, d['Podgrzewacz wody']);
  await page.click('[data-sim="over"]');
  await expect(log(page)).toContainText('człon termiczny');
  await expect(log(page)).toContainText('Przewód 1,5 mm² (Iz 14,5 A) jest słabszy niż zabezpieczenie 16 A');

  // Brak selektywności: obwód 25 A przy zabezpieczeniu przedlicznikowym 32 A.
  await page.click('[data-sim="reset"]');
  await page.evaluate(id => {
    S.dev[id].p.In = 25;
    S.dev[id].c.cable = 4;
    render();
  }, d['Gniazda salon']);
  await slot(page, d['Gniazda salon']).locator('.rt').click();
  await page.click('[data-sim="short"]');
  await expect(log(page)).toContainText('Brak selektywności: zabezpieczenie przedlicznikowe 32 A');
});

test('zanik fazy gasi obwody jednofazowe tej fazy i zostawia trójfazowe z niepełnym zasilaniem', async ({ page }) => {
  await page.click('#bSim');
  const d = await ids(page);
  await page.selectOption('[data-simph]', 'L2');
  // L2: oświetlenie piętro, łazienka, zmywarka, gniazda garaż (bez napięcia) oraz 3 obwody trójfazowe (niepełne).
  await expect(count(page)).toHaveText('Zasilone obwody: 6/13');
  await expect(slot(page, d['Łazienka'])).toHaveClass(/s-dead/);
  await expect(slot(page, d['Pompa ciepła'])).toHaveClass(/s-part/);
  await expect(slot(page, d['Kontrolki faz']).locator('.leds i.dim')).toHaveCount(1);
  await expect(log(page)).toContainText('Zanik fazy L2');
  await expect(log(page)).toContainText('-K1 Kontrola faz PC wykrywa zanik fazy');
  await page.selectOption('[data-simph]', '');
  await expect(count(page)).toHaveText('Zasilone obwody: 13/13');
});

test('symulacja nie zmienia projektu: brak kroków cofania, brak w pliku, wyłączona po przeładowaniu', async ({
  page
}) => {
  await page.click('#bSim');
  const d = await ids(page);
  await slot(page, d['RCD obwody ogólne']).locator('.lever').click();
  await expect(page.locator('#bUndo')).toBeDisabled();
  expect(await page.evaluate(() => 'sim' in exportData().S)).toBe(false);
  await page.reload();
  await expect(page.locator('#simBar')).toBeHidden();
  await expect(page.locator('#board .lever.off')).toHaveCount(0);
  // Poza symulacją kliknięcie dźwigni zaznacza aparat, a nie go wyłącza.
  await slot(page, d['RCD obwody ogólne']).locator('.lever').click();
  await expect(slot(page, d['RCD obwody ogólne'])).toHaveClass(/sel/);
});

test('symulacja w okablowaniu ręcznym: bez przewodów nic nie ma napięcia', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('#bSim');
  await expect(count(page)).toHaveText('Zasilone obwody: 0/13');
  await page.click('[data-wact="adopt"]');
  await expect(count(page)).toHaveText('Zasilone obwody: 13/13');
});

test('przeciąganie przewodu: gumka, zielone i czerwone zaciski, nowy przewód po puszczeniu', async ({ page }) => {
  await page.click('[data-view="wires"]');
  await page.click('[data-wmode="manual"]');
  await page.click('[data-wact="adopt"]');
  const d = await ids(page);
  const ep = e => page.locator(`svg.wires [data-ep='${JSON.stringify(e)}']`);
  const from = ep({ k: 'dev', id: d['Rozłącznik główny'], side: 'bot', i: 0 }); // wyj. L1
  const bad = ep({ k: 'dev', id: d['RCD obwody ogólne'], side: 'top', i: 1 }); // wej. L2
  const n = await page.evaluate(() => S.conn.length);
  const center = async l => {
    await l.scrollIntoViewIfNeeded();
    const b = await l.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };

  let [x, y] = await center(from);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 20, y + 20, { steps: 3 });
  await expect(page.locator('svg.wires line.rb')).toHaveCount(1);
  await expect(bad).toHaveClass(/bad/);
  await expect(ep({ k: 'dev', id: d['RCD ładowarka EV'], side: 'top', i: 0 })).toHaveClass(/ok/);
  expect(await page.locator('svg.wires .tp.ok').count()).toBeGreaterThan(3);
  expect(await page.locator('svg.wires .tp.bad').count()).toBeGreaterThan(20);
  const [bx, by] = await center(bad);
  await page.mouse.move(bx, by, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('.toast')).toContainText('dwie różne fazy (L1 i L2)');
  expect(await page.evaluate(() => S.conn.length)).toBe(n + 1);
  await expect(page.locator('svg.wires line.rb')).toHaveCount(0);

  // Puszczenie poza zaciskiem niczego nie dodaje.
  [x, y] = await center(from);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 40, { steps: 3 });
  await page.mouse.up();
  expect(await page.evaluate(() => S.conn.length)).toBe(n + 1);
  await expect(page.locator('svg.wires .tp.bad')).toHaveCount(0);
});
