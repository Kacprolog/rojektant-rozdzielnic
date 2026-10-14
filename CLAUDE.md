# Projektant Rozdzielnic — kontekst dla Claude Code

Interaktywny konfigurator rozdzielnic modułowych (szyna DIN TH35, 1 moduł = 18 mm) dla instalacji niskiego napięcia w Polsce. Użytkownik wybiera obudowę, układa aparaty kilku producentów na szynach, ustawia parametry obwodów, a aplikacja liczy obciążenia, sprawdza projekt według PN-HD 60364, rysuje okablowanie i generuje zestawienie materiałów.

Język interfejsu, komunikatów i dokumentacji: **polski**. Identyfikatory w kodzie: angielskie lub skróty (patrz niżej), komentarze po polsku.

Szczegóły przekazania, znane problemy i plan prac: `HANDOFF.md`. Dziennik zmian (wpis na każdy commit: co, dlaczego, jak sprawdzono): `CHANGELOG.md`. Reguły elektryczne: `docs/DOMAIN.md`. Model danych: `docs/DATA_MODEL.md`.

## Uruchamianie

```bash
npm start            # serwer statyczny bez zależności: http://localhost:4173 (testy używają własnego na 4174)
npm install          # tylko dla testów (@playwright/test)
npx playwright install chromium webkit   # raz, jeśli nie ma przeglądarek
npm run format       # Prettier (CI sprawdza: npm run format:check)
npm run typecheck    # TypeScript w trybie checkJs: sprawdza typy w js/*.js i sw.js, niczego nie kompiluje
npm test             # 98 testów × 3 projekty: desktop 1600 px i telefon 390 px (Chromium), safari (WebKit)
node scripts/podglad-druku.js            # PDF i zrzuty stron wydruku w test-results/druk/
```

Firefox jest w konfiguracji tylko dla CI albo `PW_FIREFOX=1` (na komputerze użytkownika Firefox z Playwright nie startuje; użytkownik pracuje w Operze, czyli na silniku Chromium).

`index.html` działa też po zwykłym otwarciu z dysku (`file://`): nie ma kroku budowania, modułów ES ani zależności w czasie działania. Strona nie pobiera nic z zewnątrz: czcionki (Barlow, Barlow Condensed, JetBrains Mono, licencja OFL) są w `fonts/`, opisane w `css/fonts.css`. Nowe pliki potrzebne stronie dopisz też do kroku kopiowania w `.github/workflows/pages.yml` i do `ASSETS` w `sw.js` (praca offline; test to sprawdza). Zmieniając pliki strony, podnieś wersję w `CACHE` w `sw.js`, żeby stara kopia została usunięta.

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
js/schemat.js       schemat jednokreskowy: schemGroups() (kolumny), schemSvg() (widok „Schemat” i strona wydruku)
sw.js               service worker (offline, „najpierw sieć”); lista ASSETS; manifest.webmanifest, icons/ (scripts/ikony.js)
js/app.js           akcje (dodaj/przenieś/usuń/rozłóż fazy/kopiuj), plik projektu, lista projektów, ask(), zdarzenia, boot()
scripts/serve.js    serwer statyczny (Node, bez zależności)
scripts/podglad-druku.js   PDF i zrzuty stron wydruku (Playwright)
tests/smoke.spec.js testy dymne: start, okablowanie, zakładki, migracja starego stanu
tests/okablowanie.spec.js   okablowanie ręczne i alerty złego podłączenia
tests/obliczenia.spec.js    spadki napięcia, pętla zwarcia, Icn, prąd szczytowy faz (z rachunkiem ręcznym)
tests/dotyk.spec.js         powiększanie obudowy, przenoszenie aparatów dotykiem
tests/tor.spec.js           licznik i stycznik w torze obwodu, sterowanie stycznika
tests/odpornosc.spec.js     złe dane: HTML w nazwach, parametry spoza zakresu, uszkodzone wpisy
tests/przeglad.spec.js      poprawki z przeglądu: rozkład faz, listwy, projekty nie do wczytania, klawiatura, Icn RCBO, czcionki
tests/naprawy.spec.js       naprawy z kontroli, pasek szybkiej edycji
tests/symulacja.spec.js     symulacja, awarie, przeciąganie przewodów
tests/p0.spec.js    plik projektu, lista projektów, cofanie, druk
tests/schemat.spec.js       schemat jednokreskowy
tests/pwa.spec.js           manifest, lista plików service workera, instalacja, start bez sieci
tests/sterowanie.spec.js    przewody sterownicze: cewka, przekaźnik, G12, kontrola, symulacja, plik
tests/jednofazowe.spec.js   zasilanie jednofazowe: przełączenie, naprawy, obliczenia, okablowanie, plik
tests/podpisy.spec.js       rozwijane podpisy aparatów i ich adnotacje
types/projekt.d.ts  typy danych (State, Device, Endpoint, Wire, Conn…) tylko dla sprawdzania typów; strona go nie ładuje
tsconfig.json, tsconfig.sw.json   konfiguracja sprawdzania typów (strona) i service workera (typy WebWorker)
.github/workflows/pages.yml   CI: testy w 3 silnikach, potem publikacja na GitHub Pages
```

Skrypty są **klasyczne** i ładowane po kolei. Wszystkie `const`/`function` z najwyższego poziomu są globalne i współdzielone między plikami. Kolejność w `index.html` ma znaczenie tylko dla kodu wykonywanego od razu (rejestracja zdarzeń i `boot()` w `app.js` muszą być ostatnie).

## Jak działa aplikacja

- **Jeden obiekt stanu `S`** (+ licznik `uid`). Każda zmiana: zmodyfikuj `S`, wywołaj `render()` (albo `render(true)`, żeby nie przerysowywać panelu bocznego, np. podczas pisania w polu). `render()` woła `save()`, które dopisuje migawkę do historii cofania i zapisuje listę projektów do `localStorage` pod kluczem `rozdz-v2`.
- **Dane a widok.** `DATA_KEYS` (`name, enc, set, rows, dev, wmode, conn`) to dane projektu: trafiają do pliku `.rozdz.json` i do historii cofania. Reszta `S` (`sel, active, mfr, tab, q, wires, schem, wf, sim, zoom`) to stan widoku. Nowe pole danych dopisz do `DATA_KEYS` i do `normalize()`.
- **Lista projektów `PR`**: `S` to zawsze projekt `PR.cur`. Przełączaj tylko przez `projUse()` (normalizuje stan i resetuje historię).
- **Cofanie** działa samo dla każdej akcji, która kończy się `render()` albo `save()`. Dla pól pisanych znak po znaku ustaw wcześniej `histTag`, żeby seria zmian była jednym krokiem.
- **Pełne przerysowanie przez `innerHTML`** + delegacja zdarzeń na kontenerach (`#board`, `#panel`, `#libList`, `#tabs`). Nie podpinaj nasłuchiwaczy do elementów, które są przerysowywane.
- **Wartości pochodne nie są przechowywane**: oznaczenia (`designations()`), prądy (`ib`, `iz`), połączenia (`buildConns()`), materiały liczone są zawsze od nowa z `S`.
- **Pola formularzy w panelu** mają `data-k="ścieżka"` (np. `p.In`, `c.cable`, `rcd`, `row`) albo `data-s="klucz"` (ustawienia zasilania). Obsługa w `panel.addEventListener('change')` w `app.js` przez `setPath()` + `parseV()`.
- **Widok okablowania** (`S.wires`) jest nakładką SVG mierzoną z DOM po wyrenderowaniu obudowy; `drawWires()` sam ustawia marginesy obudowy (`style.padding*`, `marginTop` rzędów) tak, żeby każdy przewód miał własny tor. Opis algorytmu: `docs/DATA_MODEL.md` → „Routing przewodów”.
- **Powiększenie** (`S.zoom`, `zf()`): obudowa jest skalowana przez `transform`. Każdy kod, który przelicza `getBoundingClientRect()` na współrzędne wewnątrz obudowy (SVG przewodów, pozycje `left` w szynie), musi dzielić przez `zf()`.
- **Tor obwodu**: licznik i stycznik mają `d.circ` (id wyłącznika obwodu). `terms()` daje im zaciski dopiero w torze; `chainOf(obwód)` zwraca aparaty toru w kolejności połączeń; `autoConns()` łączy wyłącznik → licznik → stycznik, a odejście do kabla rysowane jest z końca toru. Zaciski sterownicze (cewka A1/A2, styki 11/14 i 15/18) daje osobno `ctlTerms()`; `allTerms(d, strona)` to zaciski mocy i sterownicze w kolejności rysowania. Koniec przewodu na zacisku sterowniczym jest zapisany nazwą (`{k:'dev', id, side, c:'A1'}`), żyła takiego przewodu to `'S'`.
- **Symulacja** (`S.sim`, `js/sim.js`): `renderBoard()` liczy `SIMC=simCalc()` i na tej podstawie nadaje klasy `s-on/off/dead/part` aparatom, a `paint()` w `drawWires()` wygasza przewody bez napięcia i dodaje animację prądu. To stan widoku: żadna akcja symulacji nie może zmieniać `DATA_KEYS`.
- **Zasilanie jednofazowe** (`S.set.faz` = 1 albo 3, domyślnie 3): fazy dostępne w złączu daje `supPh()`, a `is1F()` mówi, czy zasilanie jest jednofazowe. Nie wpisuj na sztywno `['L1', 'L2', 'L3']` tam, gdzie chodzi o fazy zasilania (WLZ, źródła w symulacji, wybór fazy obwodu, wykres obciążenia).
- **Podpisy aparatów**: przycisk `.tag[data-tag]` pod aparatem rozwija opis `tagPop()` (jeden naraz, `tagOpen`; Escape i kliknięcie obok zwijają). Adnotację liczy `annot()` w `js/render.js` z danych projektu (moc i faza obwodu, chronione obwody różnicówki, tor licznika i stycznika); nie jest zapisywana.
- **Biblioteka aparatów** (z wyborem obudowy) to szuflada `#lib` otwierana przyciskiem `#bLib` „Dodaj aparat”; `libOpen` (null = automatycznie: otwarta w pustym projekcie) i `libShown()` w `js/render.js`. W testach przed użyciem biblioteki: `if (await page.locator('#lib').isHidden()) await page.click('#bLib')`.
- **Ustawienia zasilania** czytaj przez `sv(klucz)` (wartość domyślna z `SET_DEF`), nie wprost z `S.set`: starsze projekty nie mają nowszych pól.
- **Kontrola** (`checks()` w `js/model.js`) to ciąg grup reguł `checkRows`, `checkMainDevices`, `checkCircuitLoad`, `checkCircuitRcd`, `checkCircuitNet`, `checkWlz`, `checkRcds`, `checkSupply`, `checkTor` (+ `wireCheck`, `termIssues`). Nową regułę dopisz do właściwej grupy; kolejność grup to kolejność uwag.
- **Naprawy**: uwaga z `checks()` / `wireCheck()` może mieć `fix = { l: etykieta, f: funkcja }`. `f` tylko zmienia `S`; `render()` woła obsługa kliknięcia, więc naprawa jest jednym krokiem cofania. Dodawaj `fix` tylko wtedy, gdy zmiana jest jednoznaczna.
- **Druk**: `printView()` renderuje obudowę w `#board` dwa razy (front, okablowanie), kopiuje HTML do `#print` i przywraca widok. `#print` jest widoczny tylko w `@media print`.

## Zasady przy zmianach

1. **Zgodność wstecz zapisanego stanu.** Użytkownicy mają projekty w `localStorage` i w plikach. Nowe pola dodawaj z wartością domyślną przy odczycie (`normalize()`, wzór: `clen(d)` dla `d.c.len`). Gdy zmiana schematu jest niezgodna, dodaj migrację w `load()` (wzór: `rozdz-v1` → `rozdz-v2`) i podnieś wersję w kluczu tylko z migracją; dla plików podnieś `FILE_VERSION` i dopisz migrację w `importData()`.
2. **Dane z zewnątrz.** Wszystko, co przychodzi z pliku lub `localStorage`, przechodzi przez `valid()` i `normalize()`. Pole wstawiane do HTML bez `esc()` musi być tam sprowadzone do słownika albo liczby (`cleanDev()`). Nazwy (aparatu, projektu) są tekstem dowolnym: **zawsze** przez `esc()`; opcje list tylko przez `opt()`, które escapuje samo. Parametr, od którego zależy `terms()` albo `width()` (bieguny, fazy), musi mieć w `cleanDev()` zamkniętą listę wartości. Projektu, którego nie da się wczytać, nie wolno usuwać ani nadpisywać: trafia do `PR.bad`.
3. **Typy w JSDoc.** Parametr będący aparatem opisz `/** @param {Device} d */`; nowe pole danych dopisz też do `types/projekt.d.ts`. Literały, które TypeScript poszerza do `string` (np. `['top', 'bot']`), rzutuj w JSDoc zamiast zmieniać kod.
4. **Wygląd według systemu projektowego** „Projektant Rozdzielnic” (https://claude.ai/artifact/Vpoe9YowNQmZ8BExgihHkm): fioletowy akcent `--accent` tylko do wyboru i działania (nie przypomina żadnej żyły), neutralne chłodne tła, przyciski 36 px / promień 10 px, przełączniki i chipy w kształcie pigułki, karty z promieniem 16 px. Szerokość modułu to zmienna CSS `--M` (44 px, telefon 34 px); w JS czytaj ją przez `modPx()`, wymiary aparatu i szyny licz od niej.
5. **Bez `?.` i `??`** oraz innych świeżych API bez sprawdzenia wsparcia. Testy przechodzą w WebKit, ale przyczyna dawnego zgłoszenia „nie ładuje się” nie została potwierdzona (patrz `HANDOFF.md`).
6. **Kolory tylko przez tokeny CSS** z `:root` (+ oba bloki ciemnego motywu). Kolory żył: `--l1` brązowy, `--l2` czarny, `--l3` szary, `--n` niebieski, `--pe`/`--pe2` zielono-żółty, `--s` przewód sterowniczy (czerwony), `--cu` szyna grzebieniowa.
7. **Teksty dla użytkownika po polsku**, rzeczowo, z jednostkami (A, mA, kW, mm², m) i odwołaniem do normy przy regułach kontroli.
8. **Nie ma `alert/confirm/prompt`.** Potwierdzenia budujemy na stronie przez `ask(komunikat, etykieta, akcja)`. Komunikaty krótkie przez `toast()`.
9. **Ukrywanie elementów** atrybutem `hidden` (globalna reguła `[hidden]{display:none!important}`).
10. **Liczby**: `fmt()` (format `pl-PL`), w tabelach `font-variant-numeric: tabular-nums`. CSV z separatorem `;` i przecinkiem dziesiętnym.
11. **Po każdej zmianie** uruchom `npm run format`, `npm run typecheck` i `npm test`; commituj tylko przy zerowym kodzie wyjścia testów (nie przez potok, który go gubi), dopisz test dla nowej funkcji i wpis w `CHANGELOG.md`. Gdy zmieniasz model przykładu, zaktualizuj oczekiwania w teście „model połączeń dla przykładu jest stabilny” (obecnie 50 połączeń, w tym 2 przewody cewki stycznika, szyny `3F8` i `3F3`). Zmiany wyglądu sprawdzaj wzrokowo (zrzut ekranu, `scripts/podglad-druku.js`): testy nie wykryły kiedyś paska widocznego mimo `hidden`.
12. Dane katalogowe są orientacyjne. Nie wpisuj numerów katalogowych ani cen z pamięci; tylko z dostarczonych przez użytkownika katalogów/cenników.

## Słowniczek skrótów w kodzie

`S` stan, `D` mapa oznaczeń (`-F3`), `t` typ aparatu, `m` producent, `p` parametry aparatu, `c` parametry obwodu, `mcb` nadprądowy, `rcd` różnicowoprądowy, `rcbo` różnicowonadprądowy, `sw` rozłącznik, `spd` ogranicznik przepięć, `lamp` kontrolki faz, `meter` licznik, `relay` przekaźnik kontroli faz, `psu` zasilacz, `In` prąd znamionowy, `idn` IΔn, `icn` zdolność zwarciowa, `mpr` modułów na rząd, `przedl` zabezpieczenie przedlicznikowe, `ks` współczynnik jednoczesności, `wlz` wewnętrzna linia zasilająca, `comb` szyna grzebieniowa, `wf` filtr żył, `ch` korytko (kanał) między rzędami, `PR` lista projektów, `HIST` historia cofania (`u` cofnij, `r` ponów), `pv` kontener wydruku.
