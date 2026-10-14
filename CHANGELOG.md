# Dziennik zmian

Każdy wpis odpowiada jednemu commitowi. Format: co zrobiono, dlaczego, jak sprawdzono.

## 0.23.2 (14.10.2026) — CI: każda przeglądarka na osobnej maszynie

- 0.23.1 na `main` nadal zatrzymało CI (3 testy Safari, 3 dopiero za drugim razem), choć sam WebKit na gałęzi testowej
  przeszedł 94/94: na `main` cztery silniki testowały się równolegle na jednej maszynie i WebKit dostawał mniej mocy.
  Zadanie testów ma teraz macierz `project` (desktop, phone, safari, firefox): każdy silnik na osobnej maszynie,
  instalowana tylko jego przeglądarka, artefakty `playwright-wyniki-<projekt>`. Publikacja czeka na wszystkie.
- Cień bryły aparatu z mniejszym rozmyciem (4–5 px zamiast 12–16 px). Lokalnie WebKit: klatka 25 ms (front), 26 ms
  (okablowanie), prawie jak bez żadnych cieni (20 i 25 ms).

## 0.23.1 (14.10.2026) — szybsze rysowanie (publikacja nowego wyglądu)

- Publikację 0.21–0.23 zatrzymało CI: w WebKit na Linuksie (bez akceleracji grafiki) klatka rysowała się ponad 2 s,
  więc sprawdzanie stabilności elementów przed kliknięciem trwało 4–5 s i testy przekraczały limit czasu (31 testów
  Safari). Wyłączenie animacji (`reducedMotion`) nie pomogło; pomiar `scripts/ci-klatki.js` (czas klatki w wariantach
  stylu) wskazał rozmyte cienie: wewnątrz obudowy (po powiększeniu modułu duża powierzchnia) i pod kartami.
- Cień obudowy z małym promieniem rozmycia, cień paneli (`--shadow-raised`) bez rozmycia. Wygląd praktycznie bez zmian.
  Lokalnie WebKit: klatka 43 → 25 ms (front), 43 → 27 ms (okablowanie); 0.20.0 miała 36 i 28 ms. Na maszynie CI:
  211 ms i 334 ms (bez żadnych cieni 64 i 180 ms: dalsze przyspieszenie możliwe przez cienie aparatów).
- Znacznik kontroli w nagłówku ma atrybut `data-ck` zamiast `data-tab` (selektor `[data-tab="kontrola"]` trafiał w niego
  zamiast w zakładkę). Testy działają z `reducedMotion: reduce` (aplikacja nie animuje wtedy przepływu prądu).
- Gałęzie `ci-*`: pomiar klatek, potem testy WebKit raz. Na CI: 94 z 94 testów Safari w 7,2 min.

## 0.23.0 (14.10.2026) — nowy wygląd, etap 3: rozwijane podpisy aparatów

- Pod aparatem mały przycisk z oznaczeniem, kropkami faz i strzałką (`.tag[data-tag]`). Kliknięcie albo Enter rozwija
  opis: oznaczenie, nazwa, adnotacja i dane aparatu. Rozwinięty jest jeden opis naraz; Escape, ponowne kliknięcie
  i kliknięcie obok zwijają go. W ostatnim rzędzie opis otwiera się w górę. Rozwinięcie nie zmienia danych projektu.
- Adnotacja liczona z projektu (`annot()` w `js/render.js`): obwód – moc, faza albo „trójfazowy”, różnicówka przed nim; różnicówka –
  chronione obwody; rozłącznik, ogranicznik, kontrolki, przekaźnik – ich zadanie; licznik i stycznik – obwód, w którego
  torze stoją, i sposób sterowania.
- Zakres oznaczeń tylko dla kolejnych numerów (`-F3 … -F10, -F13`): pierwsza wersja pisała „-F3 … -F13”, co sugerowało
  też -F11 i -F12 (wykrył to nowy test).
- Rezerwa w rzędzie ma wysokość aparatu przy nowym module.
- Testy `tests/podpisy.spec.js` (3). Zrzuty w jasnym i ciemnym motywie.
- Poprawka dziennika: we wpisie 0.22.0 brakowało nazwy przycisku `#bLib` (powłoka zinterpretowała odwrócone apostrofy).

## 0.22.0 (14.10.2026) — nowy wygląd, etap 2: układ

- Nagłówek jako karta: opis obudowy i zasilania (np. „Hager Volta · 3 × 18 mod. · TN-C-S · 3 × 400 V”), nazwa projektu,
  moc i prąd szczytowy, zajęte moduły, znacznik stanu kontroli (kliknięcie otwiera zakładkę Kontrola), Cofnij, Ponów,
  Drukuj. Odmiana liczebników: „1 błąd”, „2 błędy”, „5 błędów” (było „1 błędy”).
- Pasek projektu: projekty, pliki, „Wczytaj przykład” i „Wyczyść”. „Rozłóż fazy” przeniesione do narzędzi obudowy.
- Biblioteka aparatów razem z wyborem obudowy to szuflada otwierana przyciskiem „+ Dodaj aparat” (`#bLib`, zamykana ✕).
  W pustym projekcie otwarta od razu; zamknięta oddaje obudowie całą środkową szerokość.
- Zakładki panelu bocznego w siatce 3 × 2, aktywna na tle akcentu.
- Testy korzystające z biblioteki najpierw ją otwierają; test liczebnika oczekuje „1 błąd”. Zrzuty komputer i telefon.

## 0.21.0 (14.10.2026) — nowy wygląd, etap 1: paleta, moduł 44 px, kontrolki

- Wdrożenie zaakceptowanego systemu projektowego (https://claude.ai/artifact/Vpoe9YowNQmZ8BExgihHkm) i projektu ekranów
  (https://claude.ai/artifact/LwhTd3aNMpabQJnzNAhw78). Etap 1 z 3.
- Paleta interfejsu w obu motywach: chłodne neutralne tła, fioletowy akcent (wybór, aktywny widok, zaznaczenie; nie
  przypomina żadnej żyły), nowe kolory stanów. Nazwy tokenów bez zmian; nowe: `--line-strong` (obramowania kontrolek,
  min. 3:1), `--accent-hover`, `--shadow-raised`, `--shadow-overlay`. Kolory żył, obudowy i aparatów bez zmian.
- Moduł 44 px zamiast 34 px (`--M`; na telefonie 34 px): wysokość aparatu, położenie szyny, wysokość rzędu i nadruki
  frontu liczone od `--M`; `renderBoard()` czyta szerokość przez `modPx()`. Okablowanie, powiększenie i wydruk mierzą
  DOM, więc działają bez zmian.
- Kontrolki: przyciski 36 px z promieniem 10 px, przełączniki segmentowe i chipy w kształcie pigułki, pola 36 px
  z etykietami wielkimi literami, karty z promieniem 16 px i cieniem.
- Test powiększenia: próg zgodności śrub z zaciskami skalowany szerokością modułu (6 px przy 34 px; niedokładność
  kontrolek faz, 3 śruby na 4 zaciski, rośnie proporcjonalnie). Zrzuty: jasny, ciemny, telefon, wydruk.

## 0.20.0 (14.10.2026) — zasilanie jednofazowe

- Nowe ustawienie `S.set.faz` (3 albo 1; projekty bez niego są trójfazowe), pole „Zasilanie” w zakładce Bilans.
  `is1F()` i `supPh()` w `js/model.js` zastępują stałą listę L1–L3 tam, gdzie chodzi o fazy zasilania.
- Przełączenie na jednofazowe (`setSupply()`) przenosi obwody jednofazowe na L1, w trybie ręcznym razem z przewodami.
  Aparatów trójfazowych program nie zmienia sam: `checkSupply1F()` zgłasza je z naprawami (obwód trójfazowy, faza L2/L3,
  rozłącznik 3P/4P, różnicówka 4P, ogranicznik 3P+N, licznik 3F, przekaźnik kontroli faz, kontrolki L1–L3).
- Obliczenia przy 230 V: prąd szczytowy, spadek w WLZ, prąd zwarciowy L–N do sprawdzania Icn. WLZ YKY 2× (PEN) albo 3×.
- Okablowanie i symulacja: brak żył L2/L3 w WLZ (bez połączeń, zacisków i źródeł), w kontroli ciągłości nie dublujemy
  uwag o brakujących fazach. Wybór fazy obwodu, pasek szybkiej edycji, wykres obciążenia, zanik fazy w symulacji i schemat
  pokazują tylko L1. „Rozłóż fazy” przy jednofazowym tylko informuje.
- Testy `tests/jednofazowe.spec.js` (4): przełączenie i wszystkie naprawy, obliczenia z rachunkiem ręcznym, zapis
  w pliku i wartość spoza listy, powrót do trójfazowego. Zrzuty Bilansu i okablowania sprawdzone wzrokowo.

## 0.19.0 (14.10.2026) — sprawdzanie typów

- `npm run typecheck`: TypeScript 5.6.3 w trybie `checkJs` sprawdza `js/*.js` (`tsconfig.json`) i `sw.js`
  (`tsconfig.sw.json`, typy WebWorker, tryb `strict`). Nic nie jest kompilowane: strona dalej działa z dysku
  (`file://`), bez kroku budowania. CI uruchamia sprawdzanie przed testami.
- Dlaczego nie przejście na Vite + TypeScript: wymagałoby kroku budowania i modułów ES, a to psuje otwieranie
  `index.html` z dysku (jedno z założeń projektu) i zmienia każdy plik naraz. Sprawdzanie typów w JSDoc daje większość
  korzyści (literówki w polach, złe argumenty, porównania z nieistniejącym typem aparatu) bez tych kosztów; przejście na
  pliki `.ts` można zrobić później po jednym pliku.
- `types/projekt.d.ts`: typy `State`, `Device`, `DevType`, `DevParams`, `CircParams`, `Endpoint`, `Wire`, `Conn`,
  `ProjectList`, `UndoHistory`. Adnotacje JSDoc przy stanie `S`, liście projektów, historii, `newDev()`, `PRESETS`
  i funkcjach przyjmujących aparat (`terms`, `width`, `rate`, `ib`, `iz`, `circCalc`…). Sprawdzone na celowo
  błędnym pliku: wykrywa `d.t === 'contacter'`, `d.nme`, złą liczbę argumentów.
- Znalezione i poprawione: `sw.js` przy braku kopii `index.html` przekazywał `undefined` do `respondWith()` (wyjątek
  zamiast zwykłego błędu sieci); nieużywany parametr w `totals()`.
- Opcja `strictNullChecks` na razie wyłączona: ok. 70 zgłoszeń, prawie wszystkie po wcześniejszym sprawdzeniu wartości
  (np. `S.dev[S.sel]`), a w JS nie ma operatora `!`. Zapisane w HANDOFF.md jako możliwy następny krok.

## 0.18.0 (14.10.2026) — przewody sterownicze

- Zaciski sterownicze osobno od zacisków mocy (`ctlTerms()`, `allTerms()` w `js/wiring.js`): stycznik w torze obwodu ma
  cewkę A1/A2, przekaźnik kontroli faz styk 11–14, przekaźnik czasowy A1/A2 i 15–18. Osobno, żeby nie zmieniać obliczeń
  prądów, torów mocy ani dotychczasowych kontroli. Front aparatu ma śruby także dla tych zacisków.
- Okablowanie automatyczne rysuje obwody cewek: przewód 1,5 mm², żyła „S”, kolor czerwony (token `--s`). Źródło A1 zależy od
  sterowania (wyjście wyłącznika obwodu, sygnał G12 z licznika OSD, styk 14 przekaźnika kontroli faz), A2 idzie do N tej
  samej strefy. Tabela w `docs/DOMAIN.md` → „Obwody sterowania”.
- Okablowanie ręczne: zaciski sterownicze i koniec „Sygnał taryfy G12” są klikalne; koniec zapisany nazwą (`c: 'A1'`),
  `cleanEp()` przyjmuje tylko nazwy z `CTL_T`. Kolor „czerwony (sterowniczy)” w edytorze przewodu, filtr żyły „S”.
- Kontrola: PE na zacisku sterowniczym, obwód sterowania bez wyłącznika nadprądowego, N cewki z innej strefy (błędy);
  N na A1, faza na A2 lub na wyjściu styku, nietypowe połączenie styków (uwagi); kolor inny niż czerwony (informacja);
  cewka bez A1 lub A2 – uwaga z naprawą „Dodaj przewody cewki”.
- Symulacja: stycznik zamyka tor, gdy jego cewka ma napięcie; przekaźnik kontroli faz zamyka styk 11–14, gdy widzi trzy
  fazy; sygnał G12 jest źródłem zależnym od przełącznika w pasku. Obliczenie powtarzane do ustalenia stanu. Przy okablowaniu
  automatycznym wynik jest taki sam jak wcześniej (dotychczasowe testy symulacji bez zmian).
- Poprawka w trakcie: w trybie ręcznym przewód od sygnału G12 był traktowany jak WLZ i wypadał z zestawienia materiałów
  (wykrył to test „Przejmij automatyczne daje to samo okablowanie”).
- Przykład: 50 połączeń (było 48), 44 przewody po przejęciu (było 42); testy zaktualizowane. Nowe testy
  `tests/sterowanie.spec.js` (4). Zrzut okablowania sprawdzony wzrokowo.
- Nie zrobione: zaciski zasilacza 24 V, funkcja czasowa przekaźnika czasowego w symulacji.

## 0.17.0 (14.10.2026) — praca bez internetu i instalacja (PWA)

- `manifest.webmanifest` (nazwa, język, tryb osobnego okna, ikony) i `sw.js` (service worker). Strategia „najpierw
  sieć”: z internetem zawsze najnowsza wersja, bez internetu strona działa z kopii zapisanej przy poprzedniej wizycie.
  Wybrana zamiast „najpierw kopia”, bo przy częstych wydaniach użytkownik nie utknie na starej wersji. Projekty były i są
  w localStorage, więc offline nic nie ginie.
- Service worker rejestrowany tylko przez http(s); otwarcie `index.html` z dysku działa jak dotąd.
- Przycisk „Zainstaluj” w nagłówku: widoczny dopiero, gdy przeglądarka zgłosi możliwość instalacji (Chrome, Edge,
  Opera; `beforeinstallprompt`). Na iPhonie: Udostępnij → „Do ekranu początkowego” (ikona `apple-touch-icon`).
- Ikony: `icons/icon.svg` (trzy aparaty na szynie) i PNG 192/512, maskowalna 512 (z marginesem na przycięcie przez
  Androida), 180 dla iOS. PNG generuje `node scripts/ikony.js`.
- `scripts/serve.js`: typ `application/manifest+json`; CI kopiuje nowe pliki na stronę.
- `playwright.config.js`: service worker domyślnie zablokowany w testach (`page.route()` nie widzi zapytań, które on
  obsługuje; test odporności podmienia `render.js`). Test offline włącza go u siebie.
- Testy `tests/pwa.spec.js` (4): lista plików service workera zawiera wszystko, co strona wczytuje (skrypty, style,
  czcionki, ikony), i każdy plik istnieje; manifest; przycisk instalacji; start bez sieci po pierwszej wizycie (Chromium;
  Playwright WebKit nie obsługuje trybu offline dla service workera).

## 0.16.0 (14.10.2026) — schemat jednokreskowy

### Schemat jednokreskowy (widok „Schemat” i strona wydruku)
- Nowy plik `js/schemat.js`: `schemGroups()` układa kolumny (aparaty pomocnicze, różnicówki z obwodami, obwody bez
  różnicówki i RCBO), `schemSvg(fit)` rysuje SVG. Schemat powstaje z tych samych danych co kontrola i zestawienie, więc
  zawsze odpowiada projektowi; nic nie jest zapisywane.
- Rysunek: zabezpieczenie przedlicznikowe i WLZ, granica rozdzielnicy, rozłącznik główny, szyna zbiorcza, różnicówki
  z szynami obwodów, wyłączniki, aparaty w torze obwodu (licznik kWh, stycznik ze sposobem sterowania), odejścia z
  oznaczeniem, nazwą, kablem, długością, mocą i prądem Ib; trzy kreski dla obwodów trójfazowych, faza dla jednofazowych.
  Symbole uproszczone według PN-EN 60617.
- Trzeci przycisk widoku „Schemat” (`S.schem`, stan widoku jak `S.wires`). Kliknięcie obwodu lub aparatu zaznacza go
  i otwiera jego parametry; każdy element ma niewidoczne pole kliknięcia (cienkie linie i tekst to za mały cel,
  szczególnie na dotyku; WebKit w testach trafiał w tło). Powiększenie działa jak dla obudowy.
- Wydruk ma piątą stronę „Schemat jednokreskowy” (bez zaznaczenia aparatu).
- Testy `tests/schemat.spec.js` (3: zawartość schematu przykładu i brak zmian danych, kliknięcie, pusta obudowa
  i zapamiętanie widoku); test druku oczekuje 5 stron. Zrzut schematu i strony wydruku sprawdzone wzrokowo.

## 0.15.0 (14.10.2026) — wszystkie sugestie z przeglądu kodu

Każdy punkt to osobny commit; numeracja jak w przeglądzie (HANDOFF.md → „Z przeglądu kodu 0.14.1”).

### 1–2. „Rozłóż fazy” w okablowaniu ręcznym, miejsce na listwach
- `rephase()`: zmiana fazy obwodu jednofazowego w okablowaniu ręcznym przepina przewód zasilający jego wejście na zacisk
  nowej fazy tego samego aparatu (np. wyjście rozłącznika L3 → L1). Dotyczy „Rozłóż fazy”, paska szybkiej edycji i pola
  „Faza” w panelu. Wcześniej „Rozłóż fazy” zostawiało przewody na starej fazie, czyli tworzyło błędy „dwie różne fazy”.
- „Rozłóż fazy” nie przenosi obwodów za różnicówką 2P (ich fazę narzuca różnicówka); wcześniej tworzyło błąd faz także
  w trybie automatycznym.
- Listwy N i PE mają długość wynikającą z liczby przewodów (zacisk co 12 px); gdy nie mieszczą się, obudowa jest
  poszerzana. Wcześniej przy wielu różnicówkach kolejne przewody trafiały w ten sam punkt listwy. `BAR_STATS` pozwala to
  sprawdzić w testach.
- Testy `tests/przeglad.spec.js` (3); zrzut przy 6 różnicówkach i 4 RCBO sprawdzony wzrokowo.

### 3. Projekty, których nie udało się wczytać
- Gdy w pamięci przeglądarki są takie projekty (`PR.bad`), pasek projektu pokazuje ich liczbę i trzy przyciski:
  „Pobierz” (plik `projekty-nie-do-wczytania.json` z pełnymi danymi), „Spróbuj wczytać” (np. po aktualizacji aplikacji;
  projekt, który nadal się nie rysuje, wraca do zachowanych) i „Usuń” (z potwierdzeniem).
- Ponowna próba jest tylko ręczna: automatyczna przy każdym starcie mogłaby w kółko dokładać przykład za projekt,
  którego nie da się narysować.
- Test w `tests/przeglad.spec.js`.

### 4 i 6. Klawiatura, Backspace
- **Okablowanie z klawiatury:** zaciski i przewody są osiągalne klawiszem Tab (`tabindex`, `role=button`, opis dla czytnika
  ekranu). Enter lub spacja na zacisku działa jak kliknięcie, na przewodzie go zaznacza (Delete usuwa), na aparacie go
  zaznacza (w symulacji przełącza dźwignię). Po przerysowaniu fokus wraca na ten sam element.
- **Zakładki** wg wzorca ARIA: `aria-controls`, panel `role=tabpanel` z `aria-labelledby`, w kolejności Tab tylko wybrana
  zakładka, przełączanie strzałkami oraz Home i End.
- **Backspace** nie usuwa już aparatu ani przewodu (poza Makiem, gdzie to jedyny klawisz kasowania); usuwa Delete.
  Poza polami tekstowymi Backspace jest blokowany: silnik WebKit cofał nim stronę w historii (wykrył to nowy test).
- Testy w `tests/przeglad.spec.js` (2).

### 7. Zdolność zwarciowa RCBO
- Wyłącznik różnicowonadprądowy ma pole „Zdolność Icn” (6 albo 10 kA) jak wyłącznik nadprądowy; dotąd przyjmowane
  było na stałe 6 kA. Kontrola Icn ≥ Ik i naprawa „Ustaw Icn 10 kA” obejmują oba typy. Opis RCBO w zestawieniu zawiera
  Icn. Starsze projekty i pliki dostają 6 kA.
- Test w `tests/przeglad.spec.js`.

### 5. Czcionki bez Google Fonts
- Barlow, Barlow Condensed i JetBrains Mono są w `fonts/` (16 plików woff2, podzbiory latin i latin-ext z polskimi znakami,
  razem ok. 300 KB) wraz z licencjami SIL OFL 1.1, która pozwala na redystrybucję. `css/fonts.css` je opisuje.
- Strona nie łączy się już z żadnym serwerem zewnętrznym: adres IP odwiedzającego nie trafia do Google, a aplikacja
  wygląda tak samo bez internetu. Workflow kopiuje `fonts/` do publikacji; serwer deweloperski zna typ `font/woff2`.
- Test: brak żądań poza własny serwer i dostępność trzech krojów z polskimi znakami; wygląd porównany na zrzucie.

### 9. Dotyk na prawdziwych zdarzeniach przeglądarki — i błąd, który to ujawniło
- Nowe testy w `tests/dotyk.spec.js` używają emulacji telefonu z ekranem dotykowym i zdarzeń dotyku wysyłanych przez
  protokół DevTools Chromium (tak jak palec), a nie zdarzeń tworzonych w skrypcie strony. Tylko Chromium (Opera, Chrome).
- **Naprawiony błąd:** ciągnięcie przewodu palcem w okablowaniu ręcznym nie działało na telefonie. Przeglądarka uznawała
  gest za przewijanie i przerywała zdarzenia wskaźnika (`pointercancel`); reguła CSS `touch-action` nie działa na elementach
  SVG. Teraz gest rozpoczęty na zacisku blokuje przewijanie (`touchmove` z `preventDefault`). Porównanie: bez poprawki test
  nie przechodzi, z poprawką 10 na 10 prób.
- Przenoszenie aparatu palcem i przewijanie krótkim ruchem działały poprawnie także na prawdziwych zdarzeniach.
- Nadal nie sprawdzono na fizycznym telefonie.

### CI: wyniki szukania przyczyny niestabilnych testów w WebKit (Linux)
- Dwie rundy eksperymentów na gałęziach `ci-*` (każdy test WebKit 3 razy, bez ponownych prób, ok. 240 prób na wariant):
  bez zmian / bez fokusu klawiatury / bez własnych czcionek / bez fokusu tylko na rysunku / fokus wędrujący po aparatach.
- Wynik: zawieszenia akcji Playwright (czekanie na nieruchomy element albo na przewinięcie przed kliknięciem) zdarzają się
  rzadko i losowo w różnych testach, także w wariancie bez fokusu na aparatach. Hipotezy o fokusie i czcionkach odrzucone;
  to zachowanie WebKit na maszynie CI, a nie błąd aplikacji (Chromium i Firefox bez powtórek, lokalnie nie występuje).
- Przy okazji znaleziony i naprawiony prawdziwy błąd testu: sprawdzanie stanu przed zakończeniem odczytu pliku (`FileReader`).
- Zostaje jedna ponowna próba w CI; testy przechodzące dopiero za drugim razem raport oznacza jako niestabilne.
  Wariant „fokus wędrujący” nie wszedł do aplikacji, bo nie miał wpływu na problem.

### CI: gałęzie diagnostyczne
- Push na gałąź `ci-*` uruchamia tylko testy WebKit (każdy 3 razy, bez ponownych prób) i niczego nie publikuje. Służy do
  szukania przyczyny niestabilnych testów w Safari-WebKit na Linuksie.

### CI: dwa testy w WebKit na Linuksie
- Publikacja 0.15.0 została zatrzymana przez CI: dwa najcięższe testy (okablowanie ręczne w powiększeniu; wszystkie
  zakładki, symulacja i wydruk) przekroczyły 30 s w WebKit na Linuksie, czekając, aż przycisk przestanie się przesuwać.
  Firefox i Chromium przeszły (312 testów). Lokalnie nie da się tego odtworzyć (16 na 16 powtórzeń), więc przyczyna nie jest
  potwierdzona; najbardziej prawdopodobna to wolna maszyna CI (uruchomienie trwało ok. 8–10 min zamiast 5–6).
- Zmiany: te dwa testy mają potrojony limit czasu (`test.slow()`), a w CI każdy test ma jedną ponowną próbę; Playwright
  oznacza wtedy test jako niestabilny (flaky) zamiast go ukrywać. Raport CI zapisuje nieudane testy jako publiczne adnotacje.

### 8. Czytelność kodu
- **Prettier** (`.prettierrc.json`: 120 znaków w linii, apostrofy) sformatował cały kod JS, CSS, HTML, testy i skrypty.
  Linii dłuższych niż 200 znaków jest 41 zamiast 123 (zostały długie teksty komunikatów). `npm run format` formatuje,
  `npm run format:check` sprawdza; CI odrzuca niesformatowany kod przed testami. Commit formatowania nie zmienia działania.
- **`checks()`** podzielona na nazwane grupy reguł: `checkRows`, `checkMainDevices`, `checkCircuitLoad`, `checkCircuitRcd`,
  `checkCircuitNet`, `checkWlz`, `checkRcds`, `checkSupply`, `checkTor`, ze wspólnym kontekstem `k`. Kolejność uwag bez zmian.
- **Błąd w mojej procedurze:** pierwszy commit formatowania przeszedł mimo 3 nieudanych testów, bo łańcuch poleceń nie
  sprawdzał kodu wyjścia testów. Przyczyną był test, który wstrzykiwał błąd przez podmianę dokładnego tekstu
  `function renderEnc(){` (po formatowaniu jest spacja); poprawiony w następnym commicie i od tej pory commit wykonuje się
  tylko przy zerowym kodzie wyjścia testów.
- Nie zmieniono: wspólnej przestrzeni globalnej i klasycznych skryptów (to zadanie P2: Vite + TypeScript).
- Sprawdzenie: `npm test` → 237 przechodzi, 3 pominięte (testy dotyku przez protokół Chromium w projekcie Safari).

## 0.14.1 (13.10.2026) — poprawki z przeglądu całego kodu

Przegląd objął `js/`, `css/`, `index.html`, `scripts/`, `tests/` i workflow. Każde znalezisko poniżej zostało najpierw
odtworzone skryptem, potem naprawione i pokryte testem w `tests/odpornosc.spec.js`.

- **Wstrzyknięcie HTML przez nazwę aparatu (naprawione).** Lista „Ochrona RCD” wstawiała nazwę różnicówki bez
  escapowania, więc nazwa z kodem HTML wykonywała skrypt, także po wczytaniu cudzego pliku projektu. `opt()`
  escapuje teraz wartość i etykietę każdej opcji w jednym miejscu.
- **Utrata projektu przy starcie (naprawione).** Wpis listy projektów, który nie przechodził walidacji, był pomijany,
  a następny zapis usuwał go z pamięci przeglądarki. Takie wpisy trafiają teraz do `PR.bad` i są zapisywane z powrotem
  bez zmian (`localStorage['rozdz-v2'].bad`).
- **Nadpisanie projektu przykładem (naprawione).** Gdy projektu nie dało się narysować, był zastępowany przykładem
  i zapisywany. Teraz zepsuty wpis zostaje w `PR.bad`, a przykład jest nowym projektem.
- **Parametry spoza typoszeregu (naprawione).** Plik z np. 7 biegunami rozłącznika przechodził walidację i wywracał
  rysowanie. `cleanDev()` sprowadza bieguny, fazy licznika, moc zasilacza, Icn i In do dozwolonych wartości;
  `importData()` wycofuje projekt, którego nie da się wyświetlić.
- **ks i cos φ poza zakresem (naprawione).** Dało się wpisać ks = 5 albo cos φ = 3; teraz ks ∈ 0,05–1, cos φ ∈ 0,5–1.
- **Nieudany zapis** w pamięci przeglądarki (np. brak miejsca) pokazuje komunikat zamiast przechodzić po cichu.
- **„Wyczyść”** usuwa też ręczne przewody.
- **Serwer deweloperski:** błędny adres (`%E0%A4%A`) kończył proces; teraz odpowiada 400. Słucha tylko na 127.0.0.1,
  a kontrola ścieżki uwzględnia separator katalogu.
- **Testy** uruchamiają własny serwer na porcie 4174 (`reuseExistingServer: false`), żeby nie trafić w serwer działający
  z innej kopii projektu.
- Pomiar wydajności (nie wymagał zmian): render przykładu 1,4 ms (front) i 7 ms (okablowanie), 106 aparatów 22 ms.
- Nienaprawione, opisane w `HANDOFF.md`: „Rozłóż fazy” w okablowaniu ręcznym tworzy błędy faz; zaciski listew mogą się
  nakładać przy bardzo wielu przewodach; okablowanie tylko myszą lub dotykiem (brak klawiatury); czcionki z Google Fonts.
- Sprawdzenie: `npm test` → 207/207.

## 0.14.0 (13.10.2026) — licznik i stycznik w torze obwodu, sterowanie stycznika w symulacji

Powód: zadanie P1.10 z planu. Licznik i stycznik stały na szynie, ale nie były okablowane, więc „Podlicznik pompy
ciepła” i „Bojler – taryfa G12” z przykładu nie brały udziału w zasilaniu obwodów.

- **Tor obwodu.** Licznik i stycznik mają pole „W torze obwodu” (`d.circ` = id wyłącznika). Aparat w torze dostaje
  zaciski faz obwodu (licznik zawsze z N, stycznik z N na wolnym biegunie) i jest wpinany za wyłącznik:
  wyłącznik → licznik → stycznik → kabel obwodowy. Przewody mają przekrój kabla obwodowego. N pochodzi z wyjścia
  poprzedniego aparatu albo z listwy N obwodu (głównej lub za różnicówką).
- **Przykład:** podlicznik jest w torze pompy ciepła, stycznik w torze bojlera; połączeń jest 48 zamiast 42.
- **Sterowanie cewki stycznika** (`p.ctl`): ręczne, sygnał taryfy G12 albo przekaźnik kontroli faz. Działa w symulacji:
  przełącznik „Taryfa G12” w pasku rozłącza styczniki taryfowe; przy zaniku fazy przekaźnik kontroli faz rozłącza swoje
  styczniki, więc pompa ciepła jest odłączona zamiast pracować na dwóch fazach. Obwód z załączonym wyłącznikiem
  i rozłączonym stycznikiem ma własny stan (`s-ctl`) i nie liczy się jako zasilony.
- **Kontrola:** aparat poza torem (informacja), prąd stycznika mniejszy niż zabezpieczenie obwodu (błąd), stycznik 2NO
  albo licznik jednofazowy w obwodzie trójfazowym (błąd z naprawą), sterowanie przekaźnikiem bez przekaźnika (uwaga).
  W okablowaniu ręcznym: zasilenie aparatu w torze z pominięciem wyłącznika obwodu jest błędem.
- **Poprawka dla Safari:** chwytanie zacisku przy przeciąganiu przewodu blokuje domyślne zaznaczanie. Bez tego WebKit
  czasem przerywał gest (`pointercancel`) i przewód nie powstawał; test przeciągania zawodził raz na kilka prób.
  Po poprawce 48 na 48 powtórzeń.
- Zgodność: starsze projekty i pliki nie mają `circ`, więc ich liczniki i styczniki zostają poza torem (jak dotąd),
  a kontrola podpowiada, jak je wpiąć.
- **Czego nie ma:** przewodów sterowniczych (cewka A1/A2, styk przekaźnika) na rysunku i w zestawieniu; przekaźnika
  czasowego, zasilacza i gniazda w torze; obciążalności styków licznika.
- Testy `tests/tor.spec.js` (5) i zaktualizowane liczby w pozostałych testach.
- Sprawdzenie: `npm test` → 189/189; wzrokowo na zrzucie okablowania (przewody do licznika i stycznika, odejścia
  z końca toru).

## 0.13.0 (13.10.2026) — powiększanie obudowy i przenoszenie aparatów palcem

Powód: kolejny krok planu interaktywności; bez tego aplikacja była niewygodna na telefonie i tablecie.

- **Powiększenie obudowy:** przyciski − / + nad obudową (40%–200%) oraz Ctrl + kółko myszy. Środkowy przycisk pokazuje
  bieżącą skalę; kliknięty przy 100% dopasowuje obudowę do szerokości okna, a przy innej skali wraca do 100%.
  Powiększoną obudowę przewija się w obu kierunkach.
- **Przenoszenie aparatu palcem:** przytrzymaj aparat ok. 0,35 s (uniesie się), przeciągnij na miejsce i puść; linia
  pokazuje, gdzie trafi. Zwykłe przesunięcie palcem dalej przewija stronę. Dotyczy ekranów dotykowych; myszą działa
  dotychczasowe przeciąganie.
- **Komunikaty nie przechwytują kliknięć** (`.toast{pointer-events:none}`): komunikat u dołu ekranu potrafił zasłonić
  zacisk albo przycisk na kilka sekund. Wykryte przez test przeciągania przewodu na szerokości telefonu.
- Większe przyciski paska szybkiej edycji i przełączników na ekranach dotykowych.
- Technicznie: `S.zoom` to stan widoku (nie trafia do pliku ani historii). `renderBoard()` ustawia `transform: scale`
  na `#board` i wymiary `#boardZoom`; `drawWires()`, linia upuszczenia i gumka przewodu dzielą pomiary z DOM przez
  `zf()`. Wydruk zawsze powstaje w skali 1. `COARSE` (ekran dotykowy) wyłącza atrybut `draggable`, żeby HTML5 drag and
  drop nie kolidował z obsługą dotyku.
- Testy `tests/dotyk.spec.js` (3): zaciski na rysunku pokrywają się ze śrubami aparatów przy 67% i 150%, dodanie przewodu
  w powiększeniu, dopasowanie do szerokości, Ctrl + kółko, przeniesienie aparatu dotykiem (zdarzenia dotyku są w teście
  symulowane; na fizycznym telefonie nie sprawdzano).
- Sprawdzenie: `npm test` → 174/174; wzrokowo na zrzucie 390 px (obudowa w całości przy 41%).

## 0.12.0 (11.10.2026) — obliczenia: spadek napięcia, pętla zwarcia, zdolność zwarciowa

Powód: zadanie P1.9 z planu; bez tych obliczeń kontrola i symulacja nie były wiarygodne dla elektryka.

- **Dane sieci** w zakładce Bilans (nowe pola projektu w `S.set`): pętla zwarcia w złączu `zs0` (domyślnie 0,3 Ω),
  prąd zwarciowy w złączu `ik0` (6 kA), długość WLZ `wlzLen` (15 m), dopuszczalny ΔU w WLZ `duWlz` (0,5%)
  i w obwodach `duObw` (3%). Wartości domyślne są przykładowe; właściwe podaje operator sieci albo pomiar.
  Starsze projekty i pliki dostają wartości domyślne (`sv()`).
- **Obliczenia** (`netCalc()`, `circCalc()` w `js/model.js`): spadek napięcia w WLZ i w każdym obwodzie, pętla zwarcia
  w rozdzielnicy i na końcu obwodu, prąd zwarcia jednofazowego, prąd zwarciowy trójfazowy w rozdzielnicy.
- **Nowe reguły kontroli:** spadek napięcia w obwodzie i w WLZ (uwaga), warunek samoczynnego wyłączenia Zs·Ia ≤ U0
  (błąd; uwaga, gdy wyłączenie przy zwarciu do PE zapewnia różnicówka), zdolność zwarciowa Icn ≥ Ik (błąd),
  w układzie TT obwód bez różnicówki (błąd; pętla zwarcia nie jest wtedy oceniana).
  Naprawy: „Zwiększ przewód do … mm²”, „Ustaw Icn 10 kA”.
- **Nowa reguła: prąd szczytowy każdej fazy osobno** względem zabezpieczenia przedlicznikowego (uwaga, naprawa
  „Rozłóż fazy”). Dotąd sprawdzany był tylko średni prąd trzech faz, więc przeciążenie jednej fazy przechodziło jako „OK”.
  **Przykładowy projekt sam łamał tę regułę** (L3 35,2 A przy 32 A); gniazda garażowe przeniesiono z L3 na L2
  (teraz L1 27,2 A, L2 31,1 A, L3 31,8 A). Wykryte na zrzucie wykresu w zakładce Bilans, nie w testach.
- **Panel aparatu** pokazuje ΔU, Zs i Ik1 obwodu oraz dopuszczalne Zs; wyniki odświeżają się podczas wpisywania mocy
  i długości. **Symulacja zwarcia** korzysta z obliczonego prądu: gdy jest mniejszy niż próg członu zwarciowego, dziennik
  mówi, że wyłącznik zadziała dopiero termicznie.
- **Uproszczenia, które trzeba znać:** tylko rezystancja przewodów miedzianych (γ = 56 m/(Ω·mm²)), bez reaktancji;
  pętla zwarcia z rezystancją × 1,25; przewód ochronny o przekroju fazowego; spadek napięcia przy cos φ ≈ 1;
  próg wyzwalania to górna granica charakterystyki (B 5×, C 10×, D 20× In). Bez współczynników poprawkowych Iz,
  bez selektywności wg charakterystyk czasowo-prądowych. Wyniki nie zastępują pomiarów odbiorczych.
- Testy `tests/obliczenia.spec.js` (9), z rachunkiem ręcznym w komentarzach: wielkości sieci i obwodu przykładu,
  za długi obwód, samoczynne wyłączenie z RCD i bez, zdolność zwarciowa, układ TT, panel na żywo, starszy projekt,
  symulacja, prąd szczytowy faz.
- Sprawdzenie: `npm test` → 165/165; wzrokowo na zrzutach paneli Aparat i Bilans.

## 0.11.0 (11.10.2026) — kontrola z naprawami, szybka edycja na aparacie

Powód: kolejne dwa kroki z planu interaktywności (HANDOFF.md); użytkownik polecił kontynuować.

- **Naprawy w zakładce Kontrola.** Uwaga, którą da się rozwiązać jedną zmianą, ma przycisk z nazwą tej zmiany:
  „Ustaw In 25 A i przewód 4 mm²”, „Zwiększ przewód do 2,5 mm²”, „Przypisz do -F11”, „Dodaj różnicówkę 40 A / 30 mA
  typ A” (wstawiana bezpośrednio przed obwodem, żeby powstała szyna grzebieniowa), „Dodaj rozłącznik”, „Dodaj ogranicznik”,
  „Zmień typ RCD”, „Zmień fazę obwodu”, „Ustaw In rozłącznika”, „Rozłóż fazy”, a dla przewodów ręcznych „Usuń ten
  przewód”, „Przywróć kolor wg normy”, „Ustaw przekrój automatycznie”, „Przejmij automatyczne”.
  Każda naprawa to jeden krok cofania. Uwagi bez jednoznacznej naprawy (przepełniony rząd, prąd szczytowy, brak zasilania
  zacisku) nie mają przycisku.
- Naprawa obwodu nie obiecuje naprawy instalacji: po zwiększeniu In może pozostać np. błąd prądu szczytowego.
- **Pasek szybkiej edycji** pod zaznaczonym aparatem (widok frontu, poza symulacją): faza L1/L2/L3 dla obwodów
  jednofazowych, prąd znamionowy − / + po typoszeregu, charakterystyka, przesunięcie w lewo / prawo, kopia, usunięcie.
  Panel boczny zostaje dla pozostałych parametrów.
- Technicznie: `add()` w `checks()` i `wireCheck()` przyjmuje `fix = { l, f }`; `panelChecks()` zapisuje uwagi w `CK`
  i rysuje przyciski `data-fix`; pomocnicze `cableFor()`, `rowWithRoom()`, `putDev()`; `quickBar()` i `quickAct()`.
- Testy `tests/naprawy.spec.js` (4). Trzy asercje w pierwszej wersji testów były błędne (oczekiwały braku uwag tam, gdzie
  aplikacja słusznie zgłasza prąd szczytowy i asymetrię); poprawione zostały testy, nie aplikacja.
- Sprawdzenie: `npm test` → 138/138; wzrokowo na zrzucie ekranu (pasek i przyciski napraw).

## 0.10.0 (11.10.2026) — żywa rozdzielnica: symulacja, awarie, przeciąganie przewodów

Powód: użytkownik chce bardzo interaktywnej aplikacji i dał wolną rękę; wybrany kierunek z burzy mózgów to
„rozdzielnica odpowiada”, a nie tylko „wygodniejszy edytor”.

- **Symulacja** (przycisk „▶ Symulacja”, działa we froncie i w okablowaniu, w trybie automatycznym i ręcznym):
  kliknięcie dźwigni wyłącza albo załącza aparat; aparaty bez napięcia szarzeją, kontrolki faz gasną osobno dla każdej
  fazy, przewody bez napięcia są wygaszone, a po przewodach z prądem przesuwają się kreski. Pasek pokazuje liczbę
  zasilonych obwodów i pobór na fazach przy wszystkich odbiornikach naraz.
- **Przycisk T** na różnicówce i RCBO wybija aparat, ale tylko gdy jest załączony i pod napięciem.
- **Awarie** w zaznaczonym obwodzie: zwarcie (wyłącza swój wyłącznik; ostrzega o braku selektywności z zabezpieczeniem
  przedlicznikowym), przeciążenie (ostrzega, gdy przewód jest słabszy niż zabezpieczenie), upływ do PE (wybija
  różnicówkę i pokazuje, ile obwodów zgasło; bez różnicówki mówi wprost, że nic nie wyłączy). **Zanik fazy** w zasilaniu
  gasi obwody jednofazowe tej fazy i oznacza trójfazowe jako zasilane niepełnie. Dziennik pokazuje 5 ostatnich zdarzeń.
- **Przeciąganie przewodu** w trybie ręcznym (mysz i dotyk): ciągniesz od zacisku, a pozostałe zaciski świecą na zielono
  (poprawne), żółto (uwaga) albo czerwono (błąd), zanim puścisz. Klikanie dwóch zacisków działa jak dotąd.
- Technicznie: nowy plik `js/sim.js` (`simCalc()` liczy ciągłość torów tym samym grafem co kontrola okablowania, z otwartymi
  łącznikami). `S.sim` to stan widoku: nie trafia do pliku ani do historii cofania i jest zerowany przy wczytaniu.
  W symulacji zaznaczenie aparatu nie przygasza przewodów (pierwsza wersja to robiła i przewody pod napięciem wyglądały
  jak martwe; wykryte na zrzucie, poprawione).
- **Symulacja jest uproszczona:** pokazuje, co zostaje bez napięcia. Nie liczy czasów zadziałania, impedancji pętli ani
  prądów zwarciowych i nie wolno jej traktować jako dowodu selektywności. Informacja o tym jest stale widoczna w pasku.
- Testy `tests/symulacja.spec.js` (7): dźwignie, test różnicówki, cztery rodzaje awarii, zanik fazy, brak wpływu na
  projekt, symulacja przy pustym okablowaniu ręcznym, przeciąganie z podglądem.
- Sprawdzenie: `npm test` → 126/126; wzrokowo na zrzucie `docs/symulacja.png`.

## Publikacja (11.10.2026)

- Strona działa pod https://kacprolog.github.io/rojektant-rozdzielnic/ (GitHub Pages włączone przez użytkownika).
- Sprawdzenie po publikacji wersji 0.9.0: strona otwarta w przeglądarce, 21 aparatów przykładu, 42 przewody w widoku
  okablowania, przełącznik trybu ręcznego, style producentów, brak błędów w konsoli. Testy w CI obejmują Firefoksa.

## 0.9.0 (11.10.2026) — fronty aparatów wg producenta

Powód: użytkownik poprosił o modele aparatów wszystkich producentów.

- **Modeli producentów nie pobrano i nie wbudowano.** Pliki CAD są udostępniane po zalogowaniu (Schneider przez
  TraceParts; portale ABB i Eatona prosiły o rejestrację), a znalezione warunki zastrzegają prawa i nie pozwalają na dalsze
  rozpowszechnianie. Repozytorium i strona są publiczne. Dla Hagera i Legranda warunków nie znaleziono.
  Użytkownik wybrał wariant: własne rysunki frontów.
- **Własne, uproszczone fronty** dla Hager, Schneider Electric, ABB, Eaton i Legrand: inna barwa korpusu, forma znaku
  (pasek, pełne tło, pogrubienie, podkreślenie, obwódka), kształt dźwigni i akcent (znacznik, pas, okienko stanu,
  punktowy wskaźnik, uchwyt etykiety). To nie są kopie materiałów producentów ani wierne odwzorowania serii.
- Technicznie: `.dev` dostaje klasę `m-<producent>` oraz `lv` dla aparatów z dźwignią; barwa znaku `--b` z `MFR`
  jest ustawiana na `.dev`; style w sekcji „Fronty aparatów wg producenta” w `css/styles.css`.
- Test: 21 aparatów Hagera w przykładzie, a ten sam MCB pięciu producentów ma pięć różnych wyglądów.
- Sprawdzenie: `npm test` → 105/105; wzrokowo na zrzucie `docs/marki.png` (5 marek × 6 typów aparatów).

## 0.8.0 (11.10.2026) — wygląd przestrzenny, przekroje a zaciski aparatów

Powód: użytkownik chce bardziej trójwymiarowych aparatów i przewodów oraz pilnowania przekrojów w aparaturze.

- **Aparaty:** bryła z boczną ścianką i cieniem, wypukły front, wgłębione zaciski i śruby, dźwignie i okienka z głębią,
  cień szyny i wnętrza obudowy. To cieniowanie CSS, a nie obracany model 3D: transformacje 3D zniekształciłyby pomiar
  położenia zacisków, z którego rysowane są przewody.
- **Przewody:** cień, obrys i połysk dają wrażenie okrągłej żyły; listwy N/PE też mają cień i połysk.
- **Grubość linii odpowiada przekrojowi:** 1,5 mm² → 1,6 px … 35 mm² → 4,6 px (`WIRE_W` w `js/wiring.js`).
- **Przekrój a zaciski:** każdy typ aparatu ma zakres przekrojów zacisku (`termRange()` w `js/model.js`, widoczny
  w „Danych technicznych” jako „Zaciski”). Kontrola zgłasza błąd, gdy przewód jest za gruby albo za cienki dla zacisku:
  dla przewodów ręcznych (`wireCheck()`, z czerwonym alertem i obwódką), dla przewodów wyliczonych i kabli obwodowych
  (`termIssues()`, w obu trybach).
- **Zakresy zacisków są orientacyjne** (typowe dla aparatury modułowej, wpisane bez kart katalogowych):
  MCB / RCBO 1–25 mm², RCD i rozłącznik do 63 A 1,5–25 mm² (powyżej 2,5–50), SPD T1+T2 2,5–35, SPD T2 1,5–25,
  kontrolki 0,5–6, przekaźnik 0,5–2,5 mm². Przed wykonaniem trzeba je sprawdzić w kartach producenta.
- `scripts/podglad-druku.js` zapisuje też zrzuty samej obudowy (`front.png`, `okablowanie.png`); odświeżone `docs/*.png`.
- Test: rosnąca grubość linii, warstwy cienia i połysku, zakres zacisków w panelu, alert dla 35 mm² w zacisku 25 mm²
  i 4 mm² w zacisku 2,5 mm², brak uwag dla przykładu.
- Sprawdzenie: `npm test` → 102/102; wzrokowo na zrzucie okablowania.

## 0.7.0 (10.10.2026) — kolory żył wg normy w każdym motywie, edycja przewodów

Powód: użytkownik wymaga okablowania w kolorach polskich norm i możliwości modyfikowania przewodów.

- **Kolory.** Barwy żył były zgodne z PN-EN 60445 (PN-HD 308 S2) tylko w jasnym motywie; w ciemnym były rozjaśniane
  (L2 nie był czarny). Teraz w obu motywach: L1 brązowy `#7b4a22`, L2 czarny `#232323`, L3 szary `#8c9195`,
  N niebieski `#2a62c9`, PE zielono-żółty. Żeby czarny przewód był widoczny, w ciemnym motywie obudowa zostaje jasna
  (jak aparaty), a tekst na niej ciemny.
- **PEN** (układ TN-C-S: żyła ochronno-neutralna WLZ i mostek PEN) jest zielono-żółty z niebieskim oznaczeniem końców.
  Legenda nazywa kolory i normę.
- **Edycja przewodu** (tryb „Ręczne”, po kliknięciu przewodu): przekrój (auto albo 1,5–35 mm²), kolor izolacji
  (wg normy albo wybrany), „Przepnij początek” / „Przepnij koniec” (potem kliknięcie nowego zacisku), „Usuń przewód”.
- **Nowe alerty** w `wireCheck()`: izolacja zielono-żółta na przewodzie innym niż PE/PEN (błąd), przewód ochronny
  w innym kolorze (błąd), niebieski na fazie albo N nie-niebieski (uwaga), faza w barwie innej fazy (informacja),
  przekrój mniejszy niż dobrany (uwaga). Przepięcie końca jest sprawdzane tak samo jak nowy przewód.
- Dane: przewód w `S.conn` ma opcjonalne `mm` i `col`; brak pola = dobór automatyczny / kolor wg normy. Zestawienie
  i lista przewodów liczą ustawiony przekrój i kolor.
- Testy (3 nowe, razem 12 w `tests/okablowanie.spec.js`): edycja przekroju i koloru z każdym poziomem alertu,
  przepinanie końców, identyczne barwy w jasnym i ciemnym motywie, oznaczenie PEN tylko w TN-C-S.
- Sprawdzenie: `npm test` → 99/99; ręcznie w przeglądarce w ciemnym motywie (zrzut ekranu).
- Ograniczenie: kontrola kolorów dotyczy izolacji przewodów w rozdzielnicy; nie obejmuje barw obwodów sterowniczych
  (PN-EN 60204-1), bo aplikacja nie ma jeszcze obwodów sterowania.

## 0.6.0 (10.10.2026) — okablowanie ręczne i alerty złego podłączenia

Powód: użytkownik zgłosił, że nie może sam dodawać przewodów ani dostać ostrzeżenia o złym podłączeniu
(dotąd przewody wyliczał wyłącznie program).

- Widok „Okablowanie” ma przełącznik **Automatyczne / Ręczne**. W trybie ręcznym każdy zacisk aparatu, każda listwa
  i każda żyła WLZ jest klikalna: kliknięcie zacisku, potem drugiego, dodaje przewód. Kliknięcie przewodu zaznacza go,
  Delete albo przycisk „Usuń przewód” go usuwa, Esc anuluje wybór.
- „Przejmij automatyczne” kopiuje wyliczone okablowanie jako punkt wyjścia do poprawek; „Usuń przewody” czyści
  (oba z potwierdzeniem, oba cofalne). Szyny grzebieniowe nadal wynikają z ustawienia aparatów.
- **Alerty** (`wireCheck()` w `js/wiring.js`): czerwony komunikat od razu po dodaniu przewodu, obwódka na rysunku,
  opis po najechaniu i wpis w zakładce Kontrola (liczony do licznika błędów w nagłówku). Wykrywane:
  zwarcie międzyfazowe, faza–N, faza–PE, N–PE poza punktem podziału PEN (albo w TN-S/TT), ominięcie rozłącznika głównego,
  ominięcie różnicówki, wspólny N różnych stref RCD, przewód w zacisku odejścia obwodu, aparat bez połączenia z zasilaniem,
  niepodłączona listwa PE, niezasilona listwa N, listwa N za różnicówką bez jej wyjścia N.
- Koniec przewodu na aparacie jest zapisany jako numer zacisku, więc zmiana fazy obwodu albo „Rozłóż fazy” nie przepina
  przewodów, tylko ujawnia złą fazę.
- Dane: nowe pola projektu `wmode` (`auto`/`manual`) i `conn` (lista przewodów) w `DATA_KEYS`, czyli w pliku
  `.rozdz.json`, w historii cofania i w `localStorage`. Stare projekty i pliki wczytują się jako `auto` z pustą listą;
  wersja pliku zostaje 1 (pola są dodatkowe). Końce przewodów z pliku przechodzą przez `cleanConn()`.
- W trybie ręcznym lista połączeń, materiały przewodów, zestawienie i wydruk biorą Twoje przewody.
- Testy `tests/okablowanie.spec.js` (9): klikanie zacisków, 10 rodzajów złych podłączeń, braki zasilania, zmiana fazy
  i układu sieci, przejęcie automatycznego bez żadnych uwag i z identycznymi materiałami, cofanie, plik, przeładowanie.
- Sprawdzenie: `npm test` → 90/90 (30 testów × desktop, telefon, safari); ręcznie w przeglądarce (alert, wpis w Kontroli).
- Ograniczenia: przekroju przewodu nie ustawia się ręcznie (wynika z reguł w `docs/DOMAIN.md`); nie ma jeszcze
  kontroli liczby przewodów w jednym zacisku ani okablowania liczników i styczników.

## 0.5.0 (10.10.2026) — zadania P0 z HANDOFF.md

### Przygotowanie środowiska
- Odtworzono strukturę folderów (`css/`, `js/`, `scripts/`, `tests/`, `docs/`) z plików przekazanych płasko.
- Zainstalowano Node.js 24 LTS i Git przez `winget` (za zgodą użytkownika), `npm install`, przeglądarki Playwright.
- Stan wyjściowy: 16/16 testów (Chromium, desktop + telefon). Commit „Stan wyjściowy”.

### P0.1 Testy w kolejnych silnikach
- `playwright.config.js`: nowy projekt `safari` (WebKit). Wynik: 8/8 bez żadnych poprawek w kodzie aplikacji.
- Firefox: przeglądarka dostarczana przez Playwright nie uruchamia się na tym komputerze
  (Windows Insider 26300, błąd SideBySide „mozglue”). To usterka środowiska, nie aplikacji.
  Projekt `firefox` włącza się w CI (Linux) albo lokalnie przez `PW_FIREFOX=1`.
- Użytkownik pracuje w Operze (silnik Chromium), więc pokrywają ją projekty `desktop` i `phone`.
- `npm test` używa czytelnego reportera `list`.
- Sprawdzenie: `npm test` → 24/24 (desktop, phone, safari).

### P0.2 Zapis i odczyt pliku projektu
- Nowy pasek pod nagłówkiem z przyciskami „Zapisz projekt” (pobiera `<nazwa>.rozdz.json`) i „Otwórz projekt”
  (wybór pliku albo przeciągnięcie pliku na stronę).
- Format pliku: `{ app: "projektant-rozdzielnic", version: 1, saved, uid, S: { name, enc, set, rows, dev } }`.
  Do pliku trafiają tylko dane projektu, bez stanu widoku (zaznaczenie, zakładka, filtr żył).
- `js/model.js`: `valid()` sprawdza strukturę, `normalize()` uzupełnia wartości domyślne, `cleanDev()` sprowadza pola
  do dozwolonych wartości (plik może pochodzić z zewnątrz, a część pól trafia do HTML), `fixUid()` pilnuje licznika id.
  Te same funkcje obsługują teraz odczyt z `localStorage`.
- Odrzucane z komunikatem: nie-JSON, obcy plik, nowsza wersja pliku, uszkodzona struktura.
- Testy (`tests/p0.spec.js`): zapis → wyczyszczenie → odczyt daje identyczne `buildConns()` i `bomRows()`;
  4 rodzaje błędnych plików; próba wstrzyknięcia HTML przez pole fazy.
- Sprawdzenie: `npm test` → 33/33.

### P0.3 Lista projektów
- Wiele projektów w jednej przeglądarce: lista wyboru „Projekt” oraz przyciski „Nowy”, „Duplikuj”, „Usuń”.
  Zmiana nazwy to edycja tytułu w nagłówku (lista odświeża się na bieżąco).
- Nowy klucz `localStorage['rozdz-v2'] = { version: 2, cur, list: [{ id, S, uid, mod }] }`.
  Migracja: jeśli nie ma `rozdz-v2`, a jest poprawny `rozdz-v1`, projekt trafia na listę, a stary klucz jest usuwany.
  Uszkodzone wpisy listy są pomijane; pusta lista oznacza start z przykładem.
- „Usuń” wymaga potwierdzenia na stronie (pasek `#confirm` jest teraz ogólny: funkcja `ask(komunikat, etykieta, akcja)`).
  Usunięcie ostatniego projektu zostawia pusty „Nowy projekt”.
- Zmiana względem P0.2: wczytany plik staje się **nowym** projektem na liście, niczego nie nadpisuje.
- Testy: pełny scenariusz listy z przeładowaniem strony, usunięcie ostatniego projektu, migracja v1 → v2
  (zaktualizowane testy dymne starego i uszkodzonego stanu).
- Sprawdzenie: `npm test` → 42/42.

### P0.4 Cofnij / Ponów
- Przyciski „↶ Cofnij” i „↷ Ponów” oraz skróty Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y (Cmd na Macu).
  W polach tekstowych skróty zostają przy natywnym cofaniu przeglądarki.
- `js/model.js`: stos migawek `HIST` (limit 50). Migawka to dane projektu (`name, enc, set, rows, dev`) i licznik `uid`;
  zmiany widoku (zakładka, zaznaczenie, okablowanie, filtr żył, wyszukiwanie) nie tworzą kroków.
  Migawka powstaje w `save()`, więc każda istniejąca akcja jest cofalna bez zmian w jej kodzie.
- Pisanie w jednym polu (nazwa, opis, moc, długość) skleja się w jeden krok (`histTag`, okno 1,5 s).
- Historia jest osobna dla każdego projektu i nie jest zapisywana (znika po przeładowaniu strony).
- „Wyczyść” i „Wczytaj przykład” da się teraz cofnąć; komunikat potwierdzenia nie straszy już nieodwracalnością.
- Testy: przyciski, skróty, pomijanie zmian widoku, sklejanie pisania, kasowanie „Ponów” po nowej zmianie, limit 50,
  identyczny model po cofnięciu „Wyczyść”.
- Sprawdzenie: `npm test` → 57/57.

### P0.5 Widok do druku / PDF
- Przycisk „Drukuj / PDF” otwiera okno druku przeglądarki (tam wybiera się „Zapisz jako PDF”). Strona A4 poziomo.
- Układ: 1 front z opisówką, 2 okablowanie, 3 struktura zasilania + kontrola projektu + dane zasilania,
  4 zestawienie materiałów, kable obwodowe, przewody i lista połączeń (długie tabele przechodzą na kolejne kartki).
  Każda część ma nagłówek z nazwą projektu, obudową, datą i numerem.
- `printView()` w `js/render.js` renderuje obudowę dwa razy (front, okablowanie), kopiuje ją z wymiarami
  i skaluje do strony; wydruk zawsze pokazuje wszystkie żyły bez wyróżnień, a widok na ekranie wraca do stanu sprzed druku.
- CSS: sekcja `#print` + `@media print` w `css/styles.css`.
- `scripts/podglad-druku.js`: generuje `test-results/druk/druk.pdf` i zrzuty stron do kontroli wzrokowej.
- **Naprawiony błąd sprzed przekazania:** atrybut `hidden` był nadpisywany przez `display:flex`, więc pasek
  „Usunąć wszystkie aparaty…” był widoczny od startu, a podpowiedź o przewodach także w widoku frontu.
  Dodano `[hidden]{display:none!important}` i test, który sprawdza ukrycie przed kliknięciem „Wyczyść”.
- Sprawdzenie wzrokowe PDF: pierwsza wersja przelewała stopkę na puste strony (12 kartek); po poprawce 9 kartek,
  front, okablowanie i struktura po jednej.
- Testy: 4 części, zawartość każdej, mieszczenie się na stronie, identyczność rysunku przewodów na ekranie i wydruku,
  brak wpływu na widok i historię cofania, widoczność w `@media print`.
- Sprawdzenie: `npm test` → 63/63.

### P0.6 Hosting (przygotowanie) i dokumentacja
- `.github/workflows/pages.yml`: testy w Chromium, WebKit i Firefox, a po sukcesie publikacja `index.html`, `css/`, `js/`
  na GitHub Pages. **Nie uruchomiono**: projekt nie ma jeszcze zdalnego repozytorium, wybór hostingu należy do użytkownika.
- `.claude/launch.json`: konfiguracja podglądu w aplikacji Claude (`node scripts/serve.js 4173`).
- Zaktualizowano `README.md`, `HANDOFF.md`, `CLAUDE.md`, `docs/DATA_MODEL.md`, zrzut `docs/front.png`; wersja 0.5.0.
- Podczas edycji `HANDOFF.md` skrypt omyłkowo wyciął dwie sekcje; plik został napisany od nowa na podstawie wersji z repozytorium.
- Sprawdzenie: `npm test` → 63/63; ręcznie w przeglądarce (lista projektów, cofanie, okablowanie).
