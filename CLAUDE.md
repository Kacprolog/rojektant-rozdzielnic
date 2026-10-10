# Projektant Rozdzielnic — kontekst dla Claude Code

Interaktywny konfigurator rozdzielnic modułowych (szyna DIN TH35, 1 moduł = 18 mm) dla instalacji niskiego napięcia w Polsce. Użytkownik wybiera obudowę, układa aparaty kilku producentów na szynach, ustawia parametry obwodów, a aplikacja liczy obciążenia, sprawdza projekt według PN-HD 60364, rysuje okablowanie i generuje zestawienie materiałów.

Język interfejsu, komunikatów i dokumentacji: **polski**. Identyfikatory w kodzie: angielskie lub skróty (patrz niżej), komentarze po polsku.

Szczegóły przekazania, znane problemy i plan prac: `HANDOFF.md`. Reguły elektryczne: `docs/DOMAIN.md`. Model danych: `docs/DATA_MODEL.md`.

## Uruchamianie

```bash
npm start            # serwer statyczny bez zależności: http://localhost:4173
npm install          # tylko dla testów (@playwright/test)
npx playwright install chromium   # raz, jeśli nie ma przeglądarki
npm test             # 8 testów dymnych × 2 widoki (desktop 1600 px, telefon 390 px)
```

`index.html` działa też po zwykłym otwarciu z dysku (`file://`): nie ma kroku budowania, modułów ES ani zależności w czasie działania. Jedyny zasób zewnętrzny to Google Fonts (z fallbackiem systemowym).

## Struktura

```
index.html          znaczniki: nagłówek, panel obudowy/biblioteki, obudowa, panel boczny
css/styles.css      tokeny kolorów (jasny + ciemny motyw), układ, wygląd aparatów
js/data.js          katalog: MFR, SER, ENC (obudowy), TNAME, PREFIX, KINDS, NEED30, IZ2/IZ3, PRESETS
js/model.js         stan S, newDev, sample(), save/load, width(), rate/desc/specs, obliczenia, checks()
js/render.js        render(), renderTop/Enc/Lib/Board/Tabs/Panel, panele: aparat, kontrola, bilans, struktura, zestawienie
js/wiring.js        terms(), buildConns(), drawWires() (routing SVG), panelKable(), materiały przewodów
js/app.js           akcje (dodaj/przenieś/usuń/rozłóż fazy/kopiuj), obsługa zdarzeń, boot()
scripts/serve.js    serwer statyczny (Node, bez zależności)
tests/smoke.spec.js testy Playwright
```

Skrypty są **klasyczne** i ładowane po kolei. Wszystkie `const`/`function` z najwyższego poziomu są globalne i współdzielone między plikami. Kolejność w `index.html` ma znaczenie tylko dla kodu wykonywanego od razu (rejestracja zdarzeń i `boot()` w `app.js` muszą być ostatnie).

## Jak działa aplikacja

- **Jeden obiekt stanu `S`** (+ licznik `uid`). Każda zmiana: zmodyfikuj `S`, wywołaj `render()` (albo `render(true)`, żeby nie przerysowywać panelu bocznego, np. podczas pisania w polu). `render()` zapisuje stan do `localStorage` pod kluczem `rozdz-v1`.
- **Pełne przerysowanie przez `innerHTML`** + delegacja zdarzeń na kontenerach (`#board`, `#panel`, `#libList`, `#tabs`). Nie podpinaj nasłuchiwaczy do elementów, które są przerysowywane.
- **Wartości pochodne nie są przechowywane**: oznaczenia (`designations()`), prądy (`ib`, `iz`), połączenia (`buildConns()`), materiały liczone są zawsze od nowa z `S`.
- **Pola formularzy w panelu** mają `data-k="ścieżka"` (np. `p.In`, `c.cable`, `rcd`, `row`) albo `data-s="klucz"` (ustawienia zasilania). Obsługa w `panel.addEventListener('change')` w `app.js` przez `setPath()` + `parseV()`.
- **Widok okablowania** (`S.wires`) jest nakładką SVG mierzoną z DOM po wyrenderowaniu obudowy; `drawWires()` sam ustawia marginesy obudowy (`style.padding*`, `marginTop` rzędów) tak, żeby każdy przewód miał własny tor. Opis algorytmu: `docs/DATA_MODEL.md` → „Routing przewodów”.

## Zasady przy zmianach

1. **Zgodność wstecz zapisanego stanu.** Użytkownicy mają projekty w `localStorage`. Nowe pola dodawaj z wartością domyślną przy odczycie (wzór: `clen(d)` dla `d.c.len`, `S.wf` tworzone w `renderWireFilter`). Gdy zmiana schematu jest niezgodna, dodaj migrację w `load()` i podnieś wersję w kluczu tylko z migracją.
2. **Bez `?.` i `??`** dopóki nie potwierdzimy, na jakim Safari użytkownik otwiera stronę (podejrzenie starego WebKitu, patrz `HANDOFF.md`). Unikaj innych świeżych API bez sprawdzenia wsparcia.
3. **Kolory tylko przez tokeny CSS** z `:root` (+ oba bloki ciemnego motywu). Kolory żył: `--l1` brązowy, `--l2` czarny, `--l3` szary, `--n` niebieski, `--pe`/`--pe2` zielono-żółty, `--cu` szyna grzebieniowa.
4. **Teksty dla użytkownika po polsku**, rzeczowo, z jednostkami (A, mA, kW, mm², m) i odwołaniem do normy przy regułach kontroli.
5. **Nie ma `alert/confirm/prompt`.** Potwierdzenia budujemy na stronie (wzór: `#confirm` przy „Wyczyść”). Komunikaty krótkie przez `toast()`.
6. **Liczby**: `fmt()` (format `pl-PL`), w tabelach `font-variant-numeric: tabular-nums`. CSV z separatorem `;` i przecinkiem dziesiętnym.
7. **Po każdej zmianie** uruchom `npm test`. Gdy zmieniasz model przykładu, zaktualizuj oczekiwania w teście „model połączeń dla przykładu jest stabilny” (obecnie 42 połączenia, szyny `3F8` i `3F3`).
8. Dane katalogowe są orientacyjne. Nie wpisuj numerów katalogowych ani cen z pamięci; tylko z dostarczonych przez użytkownika katalogów/cenników.

## Słowniczek skrótów w kodzie

`S` stan, `D` mapa oznaczeń (`-F3`), `t` typ aparatu, `m` producent, `p` parametry aparatu, `c` parametry obwodu, `mcb` nadprądowy, `rcd` różnicowoprądowy, `rcbo` różnicowonadprądowy, `sw` rozłącznik, `spd` ogranicznik przepięć, `lamp` kontrolki faz, `meter` licznik, `relay` przekaźnik kontroli faz, `psu` zasilacz, `In` prąd znamionowy, `idn` IΔn, `icn` zdolność zwarciowa, `mpr` modułów na rząd, `przedl` zabezpieczenie przedlicznikowe, `ks` współczynnik jednoczesności, `wlz` wewnętrzna linia zasilająca, `comb` szyna grzebieniowa, `wf` filtr żył, `ch` korytko (kanał) między rzędami.
