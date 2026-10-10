# Pierwszy prompt dla Claude Code

Rozpakuj paczkę, wejdź do folderu `rozdzielnica` w terminalu, uruchom `claude` i wklej:

---

Przejmujesz projekt „Projektant Rozdzielnic” – konfigurator rozdzielnic modułowych w czystym HTML/CSS/JS. Najpierw przeczytaj `CLAUDE.md`, `HANDOFF.md`, `docs/DATA_MODEL.md` i `docs/DOMAIN.md`.

Potem:
1. Zainicjuj repozytorium git i zrób pierwszy commit stanu wyjściowego.
2. Zainstaluj zależności (`npm install`, `npx playwright install chromium webkit firefox`) i uruchom `npm test`. Wszystkie testy muszą przejść przed jakąkolwiek zmianą.
3. Zrealizuj zadania P0 z `HANDOFF.md` po kolei (1 → 6). Po każdym zadaniu: nowe testy dla tej funkcji, zielony `npm test`, osobny commit z opisem po polsku, aktualizacja sekcji „Co działa” i „Znane problemy” w `HANDOFF.md`.
4. Przestrzegaj zasad z `CLAUDE.md`, zwłaszcza zgodności wstecz zapisanego stanu i zakazu `?.`/`??` do czasu przejścia testów w WebKit.
5. Przy zadaniu 6 (hosting) zapytaj mnie, czy wolę GitHub Pages czy Netlify, zanim cokolwiek opublikujesz.

Po zakończeniu P0 pokaż mi podsumowanie zmian i zaproponuj kolejność zadań P1.

---

## Krótsze polecenia na później

- „Uruchom `npm start` i otwórz projekt w przeglądarce.”
- „Zrób zadanie P1.7 (schemat jednokreskowy) z HANDOFF.md.”
- „Mam cennik Hagera w pliku `cenniki/hager.xlsx`. Zrób zadanie P1.8 i podepnij ceny do zestawienia.”
- „Dodaj regułę kontroli spadku napięcia dla obwodów (P1.9) z testem.”
