# Przekazanie projektu: Projektant Rozdzielnic

Stan na 10.10.2026, wersja 0.4.0. Projekt powstał w czacie z Claude jako pojedyncza strona (artefakt claude.ai) i został podzielony na pliki, żeby dalej rozwijać go w Claude Code i uruchamiać jako zwykłą stronę w przeglądarce.

![Widok frontu](docs/front.png)

## Cel

Narzędzie dla elektryka lub projektanta do wstępnego zaprojektowania rozdzielnicy mieszkaniowej / małej komercyjnej: dobór obudowy, rozmieszczenie aparatów różnych producentów, kontrola zgodności z podstawowymi wymaganiami PN-HD 60364, okablowanie wnętrza i zestawienie materiałów do zamówienia.

## Co działa (zweryfikowane testami, `npm test`, 16/16)

**Obudowa i aparaty**
- 5 producentów: Hager, Schneider Electric, ABB, Eaton, Legrand; 9 serii obudów (12–24 mod./rząd, 1–6 rzędów, IP40–IP65).
- 26 presetów aparatów: rozłączniki, SPD, kontrolki, RCD (A/B, 30/300 mA, S), RCBO, MCB B/C, liczniki MID, styczniki, przekaźniki, zasilacz, gniazdo.
- Przeciąganie z biblioteki i między rzędami (mysz), kliknięcie dodaje do aktywnego rzędu, Delete usuwa, przyciski ← → duplikuj.
- Front aparatów w skali (1 moduł = 34 px), opisówka z oznaczeniem i kropkami faz, rezerwa i przekroczenie szyny.

**Panel boczny (6 zakładek)**
- Aparat: parametry aparatu, obwód (rodzaj, moc, przekrój, faza, długość kabla, przypisanie RCD), Ib/In/Iz, dane techniczne.
- Kontrola: 19 reguł (lista w `docs/DOMAIN.md`), klik przenosi do aparatu.
- Bilans: obciążenie faz (wykres SVG) względem zabezpieczenia przedlicznikowego, ustawienia zasilania (moc, przedlicznikowe, ks, cos φ, układ sieci).
- Struktura: drzewo zasilania WLZ → rozłącznik → RCD → obwody.
- Kable: WLZ, kable obwodowe, przewody w rozdzielnicy według przekroju i koloru, lista połączeń, kopiowanie CSV.
- Zestawienie: aparaty + akcesoria + przewody, kopiowanie CSV i opisówki.

**Okablowanie** (przełącznik Front / Okablowanie)

![Widok okablowania](docs/okablowanie.png)

- Każdy przewód we własnym torze, korytka po obu stronach, osobne zaciski na listwach, kropki rozgałęzień.
- Szyny grzebieniowe automatycznie dla obwodów stojących za swoją różnicówką.
- Listwa PE (podział PEN dla TN-C-S), główna N, osobna N za każdą różnicówką.
- Filtr żył L1/L2/L3/N/PE, wyróżnianie przewodów zaznaczonego aparatu, opis przewodu po najechaniu.

**Inne**
- Jasny i ciemny motyw (systemowy), układ od 390 px szerokości.
- Zapis automatyczny w `localStorage` (`rozdz-v1`), migracja starszego stanu, awaryjny start z przykładem przy uszkodzonym zapisie.

## Historia decyzji

| Decyzja | Powód |
|---|---|
| Czysty HTML/CSS/JS bez frameworka i budowania | Artefakt claude.ai musiał być jednym plikiem; teraz pozwala otworzyć `index.html` z dysku. Migracja do Vite + TS jest w planie (P2), po rozbudowie testów. |
| Pełne przerysowanie `innerHTML` przy każdej zmianie | Prosty model, mało stanu w DOM; przy ~50 aparatach wydajność jest wystarczająca. |
| Wartości pochodne liczone zawsze od nowa | Brak rozjazdów między modelem a widokiem. |
| Okablowanie jako nakładka SVG mierzona z DOM | Front aparatów to HTML/CSS; przewody muszą trafiać w rzeczywiste położenie zacisków. |
| Każdy przewód we własnym torze, piony po obu stronach | Pierwsza wersja (wspólne tory) była nieczytelna. Użytkownik poprosił, żeby wszystkie kable były widoczne. |
| Usunięcie `?.` i `??` | Po wersji 3 użytkownik zgłosił „nie ładuje się”. Nie udało się odtworzyć w Chromium; podejrzenie: stary Safari/WebKit. |
| Potwierdzenia na stronie zamiast `confirm()` | Ograniczenie artefaktu; zostaje jako lepszy UX. |
| Brak numerów katalogowych i cen | Nie podajemy danych katalogowych z pamięci; czekamy na cenniki od użytkownika. |

## Znane problemy i ograniczenia

1. **Niepotwierdzona przyczyna „nie ładuje się”** (zgłoszenie z wersji w claude.ai). Do sprawdzenia w WebKit/Safari i Firefox (dodać projekty w `playwright.config.js`). Nie wiadomo, na jakim urządzeniu użytkownik otwierał stronę.
2. **Przeciąganie nie działa na ekranach dotykowych** (HTML5 drag and drop). Kliknięcie w bibliotece działa.
3. **Brak zapisu projektu do pliku**, brak wielu projektów, brak cofania (undo).
4. **Brak widoku do druku / PDF** (w artefakcie było to niemożliwe; w przeglądarce już można).
5. **Licznik, stycznik, przekaźnik czasowy, zasilacz, gniazdo nie są okablowane**, więc np. „Podlicznik pompy ciepła” i „Bojler – taryfa G12” w przykładzie nie są w torze zasilania obwodów.
6. **Szyna grzebieniowa tylko dla ciągłego bloku MCB bezpośrednio za RCD.** Nie sprawdzamy zgodności szyn między producentami ani rozstawu biegunów.
7. **Uproszczone obliczenia**: brak spadku napięcia, impedancji pętli, Ik vs Icn, współczynników poprawkowych.
8. **Szerokości aparatów uproszczone** (np. RCBO 1P+N zawsze 2 mod., choć są wersje 1-modułowe).
9. **Przy wielu obwodach obudowa w widoku okablowania robi się wysoka**; brak powiększania i przesuwania.
10. W `css/styles.css` reguły `.cabinet.wiring { padding … }` i `.cabinet.wiring .rowwrap { margin-top … }` są nadpisywane przez style inline z `drawWires()`; do uporządkowania.
11. Faza RCD 2P jest wyznaczana z pierwszego przypisanego obwodu 1F (`rcdPh`), a nie ustawiana jawnie.

## Plan prac

Kolejność według wartości dla użytkownika. Każde zadanie kończy się zielonym `npm test` i nowymi testami dla nowej funkcji.

### P0 — stabilnie w przeglądarce

1. **Testy w WebKit i Firefox.** Dodaj projekty `safari` i `firefox` w `playwright.config.js`, napraw różnice. *Gotowe, gdy:* 8 testów przechodzi w 3 silnikach.
2. **Zapis i odczyt pliku projektu** (`.rozdz.json`): przyciski „Zapisz projekt” (pobranie pliku) i „Otwórz projekt” (input file + przeciągnij plik na stronę), walidacja i migracja wersji (pole `version` w pliku). *Gotowe, gdy:* zapisany plik po wczytaniu daje identyczne `buildConns()` i `bomRows()`.
3. **Lista projektów** w `localStorage` (nowy, duplikuj, zmień nazwę, usuń z potwierdzeniem na stronie). Migracja z klucza `rozdz-v1`.
4. **Cofnij / Ponów** (Ctrl+Z / Ctrl+Shift+Z, przyciski w nagłówku): stos migawek `S` (limit 50), z pominięciem zmian widoku (`tab`, `sel`, `wires`, `wf`, `q`).
5. **Widok do druku / PDF** (`@media print` + przycisk „Drukuj”): strona 1 front z opisówką, strona 2 okablowanie, strona 3 schemat/struktura, strona 4 zestawienie i lista kabli; nagłówek z nazwą projektu i datą, A4 poziomo.
6. **Hosting**: GitHub Pages (workflow `.github/workflows/pages.yml` publikujący katalog główny) albo Netlify. Uruchom testy w CI przed publikacją.

### P1 — merytoryka

7. **Schemat jednokreskowy** generowany z modelu (SVG): WLZ, rozłącznik, SPD, RCD, obwody z oznaczeniami, przekrojami, długościami i mocami. Eksport do druku.
8. **Katalog w JSON** (`data/catalog/*.json`): numery katalogowe, ceny, szerokości i warianty per producent; import cennika CSV od użytkownika; wartość zestawienia.
9. **Rozszerzone obliczenia**: spadek napięcia (ΔU ≤ 3% obwody odbiorcze, ≤ 0,5% WLZ – parametry do ustawienia), impedancja pętli i warunek samoczynnego wyłączenia, Ik w miejscu instalacji vs Icn, współczynniki poprawkowe Iz. Każde jako reguła w `checks()` z odwołaniem do normy.
10. **Obwody sterowania i pomiaru**: licznik w torze obwodu (np. pompa ciepła), stycznik dla bojlera z sygnałem taryfy G12, przekaźnik kontroli faz z cewką stycznika. Zaciski sterownicze w `terms()`, przewody 1,5 mm².
11. **Obsługa dotyku**: przeciąganie na Pointer Events, powiększanie i przesuwanie obudowy, większe cele dotyku.

### P2 — technika

12. **Migracja do Vite + TypeScript** (moduły ES, typy `Device`, `Conn`, `Endpoint`), testy jednostkowe modelu w Vitest (`checks`, `buildConns`, `bomRows`, `ib/iz`). Zachować działanie bez serwera przez `vite build` z jednym plikiem wynikowym (np. `vite-plugin-singlefile`), jeśli otwieranie z dysku ma zostać.
13. **PWA** (manifest, service worker), praca offline, instalacja na telefonie.
14. Porządek w CSS (punkt 10 z listy problemów), podział `render.js` na komponenty.

## Jak sprawdzić, że wszystko działa

```bash
npm install && npx playwright install chromium
npm test
npm start   # otwórz http://localhost:4173, kliknij „Okablowanie”, potem zakładki Kontrola, Kable, Zestawienie
```

Ręczny scenariusz: wczytaj przykład → kliknij rząd 3, potem w bibliotece „RCD 25 A / 30 mA, 2P” (trafi na koniec rzędu) → w Kontroli pojawi się informacja, że różnicówka nie ma obwodów → zaznacz „Podgrzewacz wody” i w polu „Ochrona RCD” wybierz nową różnicówkę → informacja zniknie, a w Okablowaniu pojawi się osobna listwa N za tą różnicówką i przewód L3 do wyłącznika.
