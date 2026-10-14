/* Schemat jednokreskowy rozdzielnicy — Projektant Rozdzielnic. Skrypt klasyczny, ładowany po sim.js.
   Rysowany z modelu (te same dane co kontrola i zestawienie), więc zawsze zgodny z projektem.
   Symbole uproszczone wg PN-EN 60617: zestyk pochylony; wyłącznik nadprądowy z krzyżykiem, rozłącznik z kreską,
   stycznik z półokręgiem przy zestyku nieruchomym, różnicówka z przekładnikiem (elipsa), bezpiecznik jako prostokąt. */
const SCH = { col: 104, gap: 18, x0: 70, bus: 230, cb: 360, out: 560 };

/* Kolumny schematu od lewej: aparaty pomocnicze, różnicówki z obwodami, obwody bez różnicówki (w tym RCBO). */
function schemGroups() {
  const devs = S.rows.flat().map(id => S.dev[id]),
    g = [];
  devs.filter(d => ['spd', 'lamp', 'relay', 'psu', 'timer'].indexOf(d.t) >= 0).forEach(d => g.push({ k: 'aux', d }));
  devs
    .filter(d => d.t === 'rcd')
    .forEach(r => g.push({ k: 'rcd', d: r, circ: devs.filter(m => m.t === 'mcb' && m.rcd === r.id) }));
  devs.filter(d => isCirc(d) && !(d.t === 'mcb' && d.rcd && S.dev[d.rcd])).forEach(d => g.push({ k: 'circ', d }));
  return g;
}

/* SVG schematu. fit = true: do wydruku (skaluje się do szerokości strony). */
function schemSvg(fit) {
  const D = designations(),
    groups = schemGroups(),
    C = SCH.col,
    devs = S.rows.flat().map(id => S.dev[id]),
    sw = devs.find(d => d.t === 'sw');
  const L = (x1, y1, x2, y2, cls) => `<path class="${cls || 'ln'}" d="M${x1} ${y1}L${x2} ${y2}"/>`;
  const T = (x, y, s, cls) => `<text x="${x}" y="${y}"${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;
  /* zestyk od y (nieruchomy, u góry) do y + 36 (ruchomy, na dole); rodzaj: cb, rcbo, sw, k, rcd */
  const contact = (cx, y, kind) => {
    let s = L(cx, y + 36, cx - 14, y + 8);
    if (kind === 'cb' || kind === 'rcbo') s += L(cx - 4, y - 4, cx + 4, y + 4) + L(cx - 4, y + 4, cx + 4, y - 4);
    if (kind === 'sw') s += L(cx - 7, y, cx + 7, y);
    if (kind === 'k') s += `<path class="ln" d="M${cx - 6} ${y} A6 6 0 0 0 ${cx + 6} ${y}"/>`;
    if (kind === 'rcd' || kind === 'rcbo')
      s +=
        `<ellipse class="ln" cx="${cx}" cy="${y + 48}" rx="10" ry="4"/>` +
        `<path class="ln dash" d="M${cx + 10} ${y + 48}H${cx + 18}V${y + 22}H${cx - 6}"/>`;
    return s;
  };
  /* oznaczenie liczby przewodów: trzy kreski dla obwodu trójfazowego, nazwa fazy dla jednofazowego */
  const marks = (cx, y, three, ph) =>
    three
      ? [0, 5, 10].map(k => L(cx - 6, y + k + 4, cx + 6, y + k - 2)).join('') + T(cx + 9, y + 9, '3', 'sm')
      : T(cx + 6, y + 6, ph, 'sm');
  const label = (x, y, d, extra) =>
    T(x, y, D[d.id], 'b') + T(x, y + 12, rate(d).join(' ').trim(), 'sm') + (extra ? T(x, y + 24, extra, 'sm') : '');
  /* niewidoczne pole kliknięcia: cienkie linie i tekst są za małym celem, zwłaszcza na dotyku */
  const hit = (x, y, w, h) => `<rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  let x = SCH.x0 + 40,
    body = '',
    lastX = SCH.x0;

  /* obwód: wyłącznik, aparaty w torze (licznik, stycznik), odejście z opisem kabla */
  const circuit = (cx, d) => {
    let s =
      hit(cx - C / 2 + 4, SCH.cb - 12, C - 8, SCH.out - SCH.cb + 150) +
      contact(cx, SCH.cb, d.t === 'rcbo' ? 'rcbo' : 'cb') +
      label(cx + 10, SCH.cb + 4, d, d.t === 'rcbo' ? '' : d.p.poles + 'P');
    let y = SCH.cb + (d.t === 'rcbo' ? 58 : 36);
    chainOf(d).forEach(xd => {
      s += L(cx, y, cx, y + 12);
      y += 12;
      if (xd.t === 'meter') {
        s +=
          `<rect class="ln" x="${cx - 16}" y="${y}" width="32" height="22"/>` +
          T(cx, y + 15, 'kWh', 'sm mid') +
          label(cx + 20, y + 8, xd);
        y += 22;
      } else {
        s +=
          contact(cx, y, 'k') +
          label(cx + 10, y + 4, xd, { man: 'ręcznie', g12: 'taryfa G12', relay: 'kontrola faz' }[xd.p.ctl]);
        y += 36;
      }
    });
    s +=
      L(cx, y, cx, SCH.out) +
      `<path class="ln" d="M${cx - 4} ${SCH.out - 6}L${cx} ${SCH.out}L${cx + 4} ${SCH.out - 6}"/>`;
    s += marks(cx, SCH.out - 30, is3(d), d.c.ph);
    const lines = [
      [`${D[d.id]} ${cut(d.name, 26)}`, 'b'],
      [`${cableType(d)} · ${fmt(clen(d))} m`, ''],
      [`${fmt(+d.c.P)} kW · Ib ${fmt(ib(d))} A`, '']
    ];
    s += lines
      .map(
        ([t, cls], k) =>
          `<text class="${cls}" text-anchor="end" transform="translate(${cx - 12 + k * 12} ${SCH.out + 10}) rotate(-90)">${esc(t)}</text>`
      )
      .join('');
    return s;
  };
  const sel = id => (!fit && S.sel === id ? ' sel' : ''); /* wydruk bez zaznaczenia */

  groups.forEach(gr => {
    const d = gr.d,
      n = gr.k === 'rcd' ? Math.max(1, gr.circ.length) : 1,
      w = n * C,
      cx = x + w / 2;
    let s = '';
    if (gr.k === 'aux') {
      s += hit(cx - C / 2 + 4, 240, C - 8, 90) + L(cx, SCH.bus, cx, 262);
      if (d.t === 'spd')
        s +=
          `<rect class="ln" x="${cx - 9}" y="262" width="18" height="28"/>` +
          `<path class="ln" d="M${cx - 5} 268L${cx + 3} 276L${cx - 3} 278L${cx + 5} 286"/>` +
          L(cx, 290, cx, 306) +
          L(cx - 9, 306, cx + 9, 306) +
          L(cx - 6, 310, cx + 6, 310) +
          L(cx - 3, 314, cx + 3, 314);
      else if (d.t === 'lamp')
        s +=
          `<circle class="ln" cx="${cx}" cy="272" r="9"/>` + L(cx - 6, 266, cx + 6, 278) + L(cx - 6, 278, cx + 6, 266);
      else
        s +=
          `<rect class="ln" x="${cx - 15}" y="262" width="30" height="22"/>` +
          T(cx, 277, { relay: '3~', psu: '~/=', timer: 'T' }[d.t] || '', 'sm mid');
      s += label(cx + 14, 300, d, cut(d.name, 18));
    } else if (gr.k === 'rcd') {
      s +=
        hit(cx - 40, 240, 120, 60) +
        L(cx, SCH.bus, cx, 250) +
        contact(cx, 250, 'rcd') +
        label(cx + 22, 262, d, cut(d.name, 18)) +
        L(cx, 286, cx, 320);
      if (gr.circ.length) {
        const xs = gr.circ.map((_, k) => x + C / 2 + k * C);
        s += L(xs[0], 320, xs[xs.length - 1], 320, 'ln bus2');
        gr.circ.forEach((m, k) => {
          s +=
            `<g class="sg${sel(m.id)}" data-sid="${m.id}">` + L(xs[k], 320, xs[k], SCH.cb) + circuit(xs[k], m) + '</g>';
        });
      } else s += T(cx, 340, 'brak obwodów', 'sm mid');
    } else s += L(cx, SCH.bus, cx, SCH.cb) + circuit(cx, d);
    body += `<g class="sg${sel(d.id)}" data-sid="${d.id}">${s}</g>`;
    lastX = cx;
    x += w + SCH.gap;
  });

  const W = Math.max(x + 20, 520),
    H = SCH.out + 160,
    sx = SCH.x0;
  let head =
    T(16, 22, 'Schemat jednokreskowy · ' + S.name, 'h') +
    T(
      16,
      40,
      `Zasilanie: ${wlzType()}, ${fmt(+sv('wlzLen'))} m · ${S.set.siec} · moc szczytowa ${fmt(totals().Pd)} kW`,
      'sm'
    );
  /* zasilanie: bezpiecznik przedlicznikowy, granica rozdzielnicy, rozłącznik główny, szyna zbiorcza */
  head +=
    L(sx, 52, sx, 70) +
    `<rect class="ln" x="${sx - 5}" y="70" width="10" height="24"/>` +
    L(sx, 70, sx, 94) +
    T(sx + 12, 86, 'zab. przedlicznikowe ' + S.set.przedl + ' A', 'sm') +
    marks(sx, 98, true) +
    `<rect class="ln dash" x="${sx - 40}" y="118" width="${W - sx + 20}" height="${SCH.out - 126}"/>` +
    T(sx + 12, 132, 'Rozdzielnica', 'sm');
  if (sw)
    head +=
      `<g class="sg${sel(sw.id)}" data-sid="${sw.id}">` +
      hit(sx - 20, 140, 90, 56) +
      L(sx, 94, sx, 150) +
      contact(sx, 150, 'sw') +
      label(sx + 12, 162, sw) +
      L(sx, 186, sx, SCH.bus) +
      '</g>';
  else head += L(sx, 94, sx, SCH.bus) + T(sx + 12, 170, 'brak rozłącznika głównego', 'sm');
  head += L(sx, SCH.bus, Math.max(lastX, sx + 40), SCH.bus, 'ln bus');
  if (!groups.length) head += T(sx + 30, 300, 'Obudowa jest pusta.', 'sm');
  const size = fit ? `width="100%" style="max-height:570px"` : `width="${W}" height="${H}"`;
  return `<svg class="schem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${size} role="img" aria-label="Schemat jednokreskowy rozdzielnicy">${head}${body}</svg>`;
}
