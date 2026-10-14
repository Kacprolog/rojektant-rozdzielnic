// Generuje PDF wydruku i zrzuty stron do kontroli wzrokowej: `node scripts/podglad-druku.js [katalog]` (domyślnie test-results/druk).
const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs'),
  path = require('path');
(async () => {
  const out = path.resolve(process.argv[2] || 'test-results/druk');
  fs.mkdirSync(out, { recursive: true });
  const srv = spawn(process.execPath, [path.join(__dirname, 'serve.js'), '4199'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
    await p.goto('http://localhost:4199/');
    await p.screenshot({ path: path.join(out, 'ekran.png') });
    // Zrzuty samej obudowy: front i okablowanie (do kontroli wyglądu i do docs/).
    await p.locator('#board').screenshot({ path: path.join(out, 'front.png') });
    await p.click('[data-view="wires"]');
    await p.locator('#board').screenshot({ path: path.join(out, 'okablowanie.png') });
    // Symulacja: upływ do PE w obwodzie za wspólną różnicówką.
    await p.click('#bSim');
    await p.locator('#board .slot', { hasText: 'Gniazda kuchnia' }).locator('.rt').click();
    await p.click('[data-sim="leak"]');
    await p.locator('.boardcol').screenshot({ path: path.join(out, 'symulacja.png') });
    await p.click('#bSim');
    await p.click('[data-view="front"]');
    await p.evaluate(() => {
      window.print = () => {};
    });
    await p.click('#bPrint');
    await p.emulateMedia({ media: 'print' });
    await p.setViewportSize({ width: 1047, height: 718 });
    const n = await p.locator('#print .ppage').count();
    for (let i = 0; i < n; i++)
      await p
        .locator('#print .ppage')
        .nth(i)
        .screenshot({ path: path.join(out, 'strona' + (i + 1) + '.png') });
    // page.pdf() wywołuje zdarzenie afterprint, które czyści #print, dlatego PDF powstaje na końcu.
    await p.pdf({ path: path.join(out, 'druk.pdf'), preferCSSPageSize: true, printBackground: true });
    console.log('Zapisano w ' + out);
  } finally {
    await b.close();
    srv.kill();
  }
})();
