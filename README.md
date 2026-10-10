# Projektant Rozdzielnic

Interaktywny konfigurator rozdzielnic modułowych: obudowy i aparaty Hager, Schneider Electric, ABB, Eaton i Legrand, kontrola projektu według PN-HD 60364, bilans faz, widok okablowania z szynami grzebieniowymi i listwami N/PE, lista kabli i zestawienie materiałów.

![Okablowanie](docs/okablowanie.png)

## Uruchomienie

**Najprościej:** otwórz `index.html` dwuklikiem w Chrome, Edge, Firefoksie lub Safari. Nie trzeba niczego instalować.

**Z serwerem lokalnym** (wymaga Node.js 18+):

```bash
npm start
```

i otwórz http://localhost:4173.

**Publikacja w internecie:**
- *Netlify:* przeciągnij cały folder na https://app.netlify.com/drop.
- *GitHub Pages:* wypchnij repozytorium na GitHub, w Settings → Pages wybierz gałąź `main` i katalog `/ (root)`.

## Testy

```bash
npm install
npx playwright install chromium
npm test
```

## Dokumentacja

- `HANDOFF.md` – stan projektu, decyzje, znane problemy, plan prac
- `CLAUDE.md` – kontekst dla Claude Code: architektura i zasady zmian
- `docs/DATA_MODEL.md` – model danych, połączenia, algorytm prowadzenia przewodów
- `docs/DOMAIN.md` – reguły elektryczne i tabele

Parametry aparatów są orientacyjne. Projekt wymaga weryfikacji przez osobę z uprawnieniami SEP.
