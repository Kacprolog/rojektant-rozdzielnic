# Dziennik zmian

Każdy wpis odpowiada jednemu commitowi. Format: co zrobiono, dlaczego, jak sprawdzono.

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
