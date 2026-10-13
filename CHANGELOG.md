# Dziennik zmian

Każdy wpis odpowiada jednemu commitowi. Format: co zrobiono, dlaczego, jak sprawdzono.

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
