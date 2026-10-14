// Diagnostyka wydajności rysowania (CI, WebKit): średni czas klatki w widoku frontu i okablowania w kilku wariantach stylu.
// Użycie: node scripts/ci-klatki.js [webkit|chromium]. Wynik w konsoli; nie jest testem.
const pw = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const VARIANTS = {
  'bez zmian': '',
  'bez cieni': '*{box-shadow:none !important}',
  'obudowa bez cieni': '.cabinet{box-shadow:none !important}',
  'karty bez cieni': '.card,.top,.side{box-shadow:none !important}'
};
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, 'serve.js'), '4196'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const b = await pw[process.argv[2] || 'webkit'].launch();
  try {
    for (const [name, css] of Object.entries(VARIANTS)) {
      const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
      await p.goto('http://localhost:4196/');
      if (css) await p.addStyleTag({ content: css });
      const frames = () =>
        p.evaluate(
          () =>
            new Promise(res => {
              const t = [];
              let last = performance.now(),
                n = 0;
              const f = now => {
                t.push(now - last);
                last = now;
                /* coś zmieniamy w każdej klatce, żeby wymusić przerysowanie (jak przy przewijaniu i najechaniu myszą) */
                document.body.style.outline = n % 2 ? '1px solid transparent' : '';
                if (++n < 12) requestAnimationFrame(f);
                else res(Math.round(t.slice(2).reduce((a, x) => a + x, 0) / (t.length - 2)));
              };
              requestAnimationFrame(f);
            })
        );
      const front = await frames();
      await p.evaluate(() => {
        S.wires = true;
        render(true);
      });
      const wires = await frames();
      console.log(
        `${name.padEnd(28)} front ${String(front).padStart(5)} ms   okablowanie ${String(wires).padStart(5)} ms`
      );
      await p.close();
    }
  } finally {
    await b.close();
    srv.kill();
  }
})();
