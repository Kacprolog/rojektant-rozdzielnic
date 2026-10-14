// Generuje ikony PNG aplikacji z icons/icon.svg (Playwright, Chromium). Uruchom po zmianie ikony: node scripts/ikony.js
// maskable: ikona pomniejszona do 80 % na pełnym tle, bo Android przycina ją do koła lub zaokrąglonego kwadratu.
// apple-touch-icon: pełne tło (iOS wypełnia przezroczystość czernią i sam zaokrągla rogi).
const { chromium } = require('@playwright/test');
const fs = require('fs'),
  path = require('path');
const dir = path.join(__dirname, '..', 'icons');
const svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
const out = [
  ['icon-192.png', 192, 1, false],
  ['icon-512.png', 512, 1, false],
  ['icon-maskable-512.png', 512, 0.8, true],
  ['apple-touch-icon.png', 180, 1, true]
];
(async () => {
  const b = await chromium.launch();
  try {
    for (const [name, size, scale, full] of out) {
      const p = await b.newPage({ viewport: { width: size, height: size } });
      const inner = Math.round(size * scale),
        off = (size - inner) / 2;
      await p.setContent(
        `<body style="margin:0;background:${full ? '#2b3238' : 'transparent'}"><div style="position:absolute;left:${off}px;top:${off}px;width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`
      );
      await p.screenshot({ path: path.join(dir, name), omitBackground: !full });
      await p.close();
      console.log('zapisano', name);
    }
  } finally {
    await b.close();
  }
})();
