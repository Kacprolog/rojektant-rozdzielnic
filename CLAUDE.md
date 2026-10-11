# Projektant Rozdzielnic — kontekst dla Claude Code

Interaktywny konfigurator rozdzielnic modułowych (szyna DIN TH35, 1 moduł = 18 mm) dla instalacji niskiego napięcia w Polsce. Użytkownik wybiera obudowę, układa aparaty kilku producentów na szynach, ustawia parametry obwodów, a aplikacja liczy obciążenia, sprawdza projekt według PN-HD 60364, rysuje okablowanie i generuje zestawienie materiałów.

Język interfejsu, komunikatów i dokumentacji: **polski**. Identyfikatory w kodzie: angielskie lub skróty (patrz niżej), komentarze po polsku.

Szczegóły przekazania, znane problemy i plan prac: `HANDOFF.md`. Dziennik zmian (wpis na każdy commit: co, dlaczego, jak sprawdzono): `CHANGELOG.md`. Reguły elektryczne: `docs/DOMAIN.md`. Model danych: `docs/DATA_MODEL.md`.

## Uruchamianie

```bash
npm start            # serwer statyczny bez zależności: http://localhost:4173
npm install          # tylko dla testów (@playwright/test)
npx playwright install chromium webkit   # raz, jeśli nie ma przeglądarek
npm test             # 55 testów × 3 projekty: desktop 1600 px i telefon 390 px (Chromium), safari (WebKit)
node scripts/podglad-druku.js            # PDF i zrzuty stron wydruku w test-results/druk/
```

Firefox jest w konfiguracji tylko dla CI albo `PW_FIREFOX=1` (na komputerze użytkownika Firefox z Playwright nie startuje; użytkownik pracuje w Operze, czyli na silniku Chromium).

`index.html` działa też po zwykłym otwarciu z dysku (`file://`): nie ma kroku budowania, modułów ES ani zależności w czasie działania. Jedyny zasób zewnętrzny to Google Fonts (z fallbackiem systemowym).

## Struktura

```
index.html          znaczniki: nagłówek, pasek projektu, panel obudowy/biblioteki, obudowa, panel boczny
css/styles.css      tokeny kolorów (jasny + ciemny motyw), układ, wygląd aparatów, sekcja druku (#print, @media print)
js/data.js          katalog: MFR, SER, ENC (obudowy), TNAME, PREFIX, KINDS, NEED30, IZ2/IZ3, PRESETS
js/model.js         stan S, newDev, sample(), valid/normalize, lista projektów PR + save/load, historia HIST (cofnij/ponów),
                    width(), rate/desc/specs, obliczenia, checks()
js/render.js        render(), renderTop/Enc/Lib/Board/Tabs/Panel, panele: aparat, kontrola, bilans, struktura, zestawienie,
                    printView() (druk / PDF)
js/wiring.js        terms(), buildConns(), drawWires() (routing SVG), panelKable(), materiały przewodów
js/sim.js           symulacja: simCalc() (kto ma napięcie), dźwignie, test RCD, awarie, pasek renderSim()
js/app.js           akcje (dodaj/przenieś/usuń/rozłóż fazy/kopiuj), plik projektu, lista projektów, ask(), zdarzenia, boot()
scripts/serve.js    serwer statyczny (Node, bez zależności)
scripts/podglad-druku.js   PDF i zrzuty stron wydruku (Playwright)
tests/smoke.spec.js testy dymne: start, okablowanie, zakładki, migracja starego stanu
tests/okablowanie.spec.js   okablowanie ręczne i alerty złego podłączenia
tests/obliczenia.spec.js    spadki napięcia, pętla zwarcia, Icn, prąd szczytowy faz (z rachunkiem ręcznym)
tests/naprawy.spec.js       naprawy z kontroli, pasek szybkiej edycji
tests/symulacja.spec.js     symulacja, awarie, przeciąganie przewodów
tests/p0.spec.js    plik projektu, lista projektów, cofanie, druk
.github/workflows/pages.yml   CI: testy w 3 silnikach, potem publikacja na GitHub Pages
```

Skrypty są **klasyczne** i ładowane po kolei. Wszystkie `const`/`function` z najwyższego poziomu są globalne i współdzielone między plikami. Kolejność w `index.html` ma znaczenie tylko dla kodu wykonywanego od razu (rejestracja zdarzeń i `boot()` w `app.js` muszą być ostatnie).

## Jak działa aplikacja

- **Jeden obiekt stanu `S`** (+ licznik `uid`). Każda zmiana: zmodyfikuj `S`, wywołaj `render()` (albo `render(true)`, żeby nie przerysowywać panelu bocznego, np. podczas pisania w polu). `render()` woła `save()`, które dopisuje migawkę do historii cofania i zapisuje listę projektów do `localStorage` pod kluczem `rozdz-v2`.
- **Dane a widok.** `DATA_KEYS` (`name, enc, set, rows, dev, wmode, conn`) to dane projektu: trafiają do pliku `.rozdz.json` i do historii cofania. Reszta `S` (`sel, active, mfr, tab, q, wires, wf, sim`) to stan widoku. Nowe pole danych dopisz do `DATA_KEYS` i do `normalize()`.
- **Lista projektów `PR`**: `S` to zawsze projekt `PR.cur`. Przełączaj tylko przez `projUse()` (normalizuje stan i resetuje historię).
- **Cofanie** działa samo dla każdej akcji, która kończy się `render()` albo `save()`. Dla pól pisanych znak po znaku ustaw wcześniej `histTag`, żeby seria zmian była jednym krokiem.
- **Pełne przerysowanie przez `innerHTML`** + delegacja zdarzeń na kontenerach (`#board`, `#panel`, `#libList`, `#tabs`). Nie podpinaj nasłuchiwaczy do elementów, które są przerysowywane.
- **Wartości pochodne nie są przechowywane**: oznaczenia (`designations()`), prądy (`ib`, `iz`), połączenia (`buildConns()`), materiały liczone są zawsze od nowa z `S`.
- **Pola formularzy w panelu** mają `data-k="ścieżka"` (np. `p.In`, `c.cable`, `rcd`, `row`) albo `data-s="klucz"` (ustawienia zasilania). Obsługa w `panel.addEventListener('change')` w `app.js` przez `setPath()` + `parseV()`.
- **Widok okablowania** (`S.wires`) jest nakładką SVG mierzoną z DOM po wyrenderowaniu obudowy; `drawWires()` sam ustawia marginesy obudowy (`style.padding*`, `marginTop` rzędów) tak, żeby każdy przewód miał własny tor. Opis algorytmu: `docs/DATA_MODEL.md` → „Routing przewodów”.
- **Symulacja** (`S.sim`, `js/sim.js`): `renderBoard()` liczy `SIMC=simCalc()` i na tej podstawie nadaje klasy `s-on/off/dead/part` aparatom, a `paint()` w `drawWires()` wygasza przewody bez napięcia i dodaje animację prądu. To stan widoku: żadna akcja symulacji nie może zmieniać `DATA_KEYS`.
- **Ustawienia zasilania** czytaj przez `sv(klucz)` (wartość domyślna z `SET_DEF`), nie wprost z `S.set`: starsze projekty nie mają nowszych pól.
- **Naprawy**: uwaga z `checks()` / `wireCheck()` może mieć `fix = { l: etykieta, f: funkcja }`. `f` tylko zmienia `S`; `render()` woła obsługa kliknięcia, więc naprawa jest jednym krokiem cofania. Dodawaj `fix` tylko wtedy, gdy zmiana jest jednoznaczna.
- **Druk**: `printView()` renderuje obudowę w `#board` dwa razy (front, okablowanie), kopiuje HTML do `#print` i przywraca widok. `#print` jest widoczny tylko w `@media print`.

## Zasady przy zmianach

1. **Zgodność wstecz zapisanego stanu.** Użytkownicy mają projekty w `localStorage` i w plikach. Nowe pola dodawaj z wartością domyślną przy odczycie (`normalize()`, wzór: `clen(d)` dla `d.c.len`). Gdy zmiana schematu jest niezgodna, dodaj migrację w `load()` (wzór: `rozdz-v1` → `rozdz-v2`) i podnieś wersję w kluczu tylko z migracją; dla plików podnieś `FILE_VERSION` i dopisz migrację w `importData()`.
2. **Dane z zewnątrz.** Wszystko, co przychodzi z pliku lub `localStorage`, przechodzi przez `valid()` i `normalize()`. Pole wstawiane do HTML bez `esc()` musi być tam sprowadzone do słownika albo liczby (`cleanDev()`).
3. **Bez `?.` i `??`** oraz innych świeżych API bez sprawdzenia wsparcia. Testy przechodzą w WebKit, ale przyczyna dawnego zgłoszenia „nie ładuje się” nie została potwierdzona (patrz `HANDOFF.md`).
4. **Kolory tylko przez tokeny CSS** z `:root` (+ oba bloki ciemnego motywu). Kolory żył: `--l1` brązowy, `--l2` czarny, `--l3` szary, `--n` niebieski, `--pe`/`--pe2` zielono-żółty, `--cu` szyna grzebieniowa.
5. **Teksty dla użytkownika po polsku**, rzeczowo, z jednostkami (A, mA, kW, mm², m) i odwołaniem do normy przy regułach kontroli.
6. **Nie ma `alert/confirm/prompt`.** Potwierdzenia budujemy na stronie przez `ask(komunikat, etykieta, akcja)`. Komunikaty krótkie przez `toast()`.
7. **Ukrywanie elementów** atrybutem `hidden` (globalna reguła `[hidden]{display:none!important}`).
8. **Liczby**: `fmt()` (format `pl-PL`), w tabelach `font-variant-numeric: tabular-nums`. CSV z separatorem `;` i przecinkiem dziesiętnym.
9. **Po każdej zmianie** uruchom `npm test`, dopisz test dla nowej funkcji i wpis w `CHANGELOG.md`. Gdy zmieniasz model przykładu, zaktualizuj oczekiwania w teście „model połączeń dla przykładu jest stabilny” (obecnie 42 połączenia, szyny `3F8` i `3F3`). Zmiany wyglądu sprawdzaj wzrokowo (zrzut ekranu, `scripts/podglad-druku.js`): testy nie wykryły kiedyś paska widocznego mimo `hidden`.
10. Dane katalogowe są orientacyjne. Nie wpisuj numerów katalogowych ani cen z pamięci; tylko z dostarczonych przez użytkownika katalogów/cenników.

## Słowniczek skrótów w kodzie

`S` stan, `D` mapa oznaczeń (`-F3`), `t` typ aparatu, `m` producent, `p` parametry aparatu, `c` parametry obwodu, `mcb` nadprądowy, `rcd` różnicowoprądowy, `rcbo` różnicowonadprądowy, `sw` rozłącznik, `spd` ogranicznik przepięć, `lamp` kontrolki faz, `meter` licznik, `relay` przekaźnik kontroli faz, `psu` zasilacz, `In` prąd znamionowy, `idn` IΔn, `icn` zdolność zwarciowa, `mpr` modułów na rząd, `przedl` zabezpieczenie przedlicznikowe, `ks` współczynnik jednoczesności, `wlz` wewnętrzna linia zasilająca, `comb` szyna grzebieniowa, `wf` filtr żył, `ch` korytko (kanał) między rzędami, `PR` lista projektów, `HIST` historia cofania (`u` cofnij, `r` ponów), `pv` kontener wydruku.
