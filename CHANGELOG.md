# Dziennik zmian

Każdy wpis odpowiada jednemu commitowi. Format: co zrobiono, dlaczego, jak sprawdzono.

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
