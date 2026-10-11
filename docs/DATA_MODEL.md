# Model danych

## Stan projektu `S`

```js
S = {
  name: 'Dom jednorodzinny – rozdzielnica RG',   // nazwa projektu (edytowalna w nagłówku)
  enc:  { mfr: 'hager', series: 'volta', rows: 3 }, // obudowa → ENC[mfr].find(id===series)
  set:  { moc: 22, przedl: 32, ks: 0.5, cos: 0.95, siec: 'TN-C-S' }, // kW, A, -, -, 'TN-C-S'|'TN-S'|'TT'
  rows: [['d1','d2',...], [...], [...]],          // kolejność aparatów na szynach, od lewej
  dev:  { d1: Device, ... },                      // wszystkie aparaty po id
  sel: 'd7' | null,      // zaznaczony aparat
  active: 1,             // aktywny rząd (tu trafia aparat kliknięty w bibliotece)
  mfr: 'hager',          // producent wybrany w bibliotece
  tab: 'aparat'|'kontrola'|'bilans'|'struktura'|'kable'|'bom',
  q: '',                 // wyszukiwanie w bibliotece
  wires: false,          // widok okablowania
  wf: { L1:1, L2:1, L3:1, N:1, PE:1 }, // filtr żył (może nie istnieć w starym stanie)
  sim: null | { on:true, off:{ d7:1 }, dead:{ L2:1 }, log:[{ sev, msg }] }  // symulacja: wyłączone aparaty, zanik fazy, dziennik; zerowane przy wczytaniu
}
uid  // licznik do id aparatów: 'd' + uid++
```

Pola `name, enc, set, rows, dev` to **dane projektu** (`DATA_KEYS`); pozostałe to stan widoku.

## Przechowywanie w przeglądarce

```js
localStorage['rozdz-v2'] = { version: 2, cur: 'p…', list: [ { id: 'p…', S, uid, mod } ] }
PR = { cur, list }   // to samo w pamięci; S jest zawsze projektem PR.cur
```

- `load()` czyta `rozdz-v2` i pomija wpisy niespełniające `valid()`. Gdy lista jest pusta, migruje `rozdz-v1` (`{ S, uid }`, wersje do 0.4.0) i usuwa stary klucz. Gdy nadal jest pusta, aplikacja startuje z przykładem.
- `valid(s)`: rzędy są tablicami; każdy id ma postać `dN`, występuje raz i wskazuje aparat znanego typu z `p` (oraz `c` dla obwodów); producent obudowy jest w katalogu.
- `normalize(s)`: wartości domyślne ustawień i widoku, seria obudowy z katalogu, `enc.rows = rows.length`, usunięcie aparatów spoza rzędów i odwołań do nieistniejących RCD, `cleanDev()` (liczby oraz słowniki faz, charakterystyk i typów).
- `fixUid(s, u)`: licznik większy od każdego istniejącego id.

## Plik projektu `.rozdz.json`

```js
{ app: 'projektant-rozdzielnic', version: 1, saved: '2026-10-10T…Z', uid: 23, S: { name, enc, set, rows, dev } }
```

`importData()` odrzuca: nie-JSON, inne `app`, brak wersji, wersję nowszą niż `FILE_VERSION`, strukturę niespełniającą `valid()`. Poprawny plik staje się nowym projektem na liście i niczego nie nadpisuje.

## Historia cofania

`HIST = { u, r, cur, t, tag }`: `cur` to bieżąca migawka (JSON z `DATA_KEYS` i `uid`), `u` stos cofania (limit 50), `r` stos ponawiania. `histTrack()` jest wołane w `save()`: gdy migawka się zmieniła, poprzednia trafia na `u`, a `r` jest czyszczone. Zmiany z tym samym `histTag` w odstępie do 1,5 s są jednym krokiem (pisanie w polu). Historia nie jest zapisywana i jest resetowana przy zmianie projektu (`projUse()`).

## Aparat `Device`

```js
{ id: 'd12', t: 'mcb', m: 'hager', name: 'Gniazda salon',
  p: { ... },                       // parametry zależne od typu (tabela niżej)
  c: { kind, P, cable, ph, len },   // tylko mcb i rcbo: obwód
  rcd: 'd7' | null }                // tylko mcb: różnicówka, za którą jest obwód
```

| `t` | Nazwa | `p` | Szerokość (`width()`) |
|---|---|---|---|
| `mcb` | Wyłącznik nadprądowy | `In, curve:'B'|'C'|'D', poles:1–4, icn:6|10` | `poles` |
| `rcd` | Różnicowoprądowy | `In, poles:2|4, idn, kind:'AC'|'A'|'F'|'B', sel:bool` | `poles` |
| `rcbo` | Różnicowonadprądowy | `In, curve, poles:2|4 (1P+N/3P+N), idn, kind` | 2 lub 4 |
| `sw` | Rozłącznik izolacyjny | `In, poles` | `poles` |
| `spd` | Ogranicznik przepięć | `cls:'T1+T2'|'T2', sys:'1P+N'|'3P+N'` | 2 lub 4 |
| `lamp` | Kontrolki faz | – | 1 |
| `meter` | Licznik energii | `ph:1|3, mid:bool` | 1 lub 4 |
| `contactor` | Stycznik | `In, poles:2|4` (NO) | 1–3 |
| `relay` | Kontrola faz | – | 1 |
| `timer` | Przekaźnik czasowy | – | 1 |
| `psu` | Zasilacz 24 V | `W:30|60` | 2 lub 4 |
| `socket` | Gniazdo modułowe | – | 2,5 |

Obwód `c`: `kind` – klucz z `KINDS` (oswietlenie, gniazda, kuchnia, lazienka, plyta, ev, pc, klima, bojler, zewn, inne); `P` – moc w kW; `cable` – przekrój Cu w mm²; `ph` – faza dla obwodów 1F (`L1|L2|L3`); `len` – długość kabla w m (domyślnie 15 przez `clen(d)`).

Oznaczenia są liczone, nie zapisywane: `designations()` numeruje aparaty w kolejności rzędów według `PREFIX` (F – zabezpieczenia i SPD, Q – rozłącznik, H – kontrolki, P – licznik, K – styczniki i przekaźniki, X – gniazdo, T – zasilacz).

## Katalog (`js/data.js`)

- `MFR` – producenci: nazwa, skrót na aparacie, kolor znaku firmowego.
- `SER[mfr][t]` – nazwa serii pokazywana w bibliotece i zestawieniu (orientacyjna).
- `ENC[mfr]` – obudowy: `mpr` modułów na rząd, dozwolone `rows`, IP, montaż, materiał, klasa, front.
- `PRESETS` – pozycje biblioteki: grupa `g`, typ `t`, parametry `p`, opcjonalny obwód `c`, domyślna nazwa i etykieta `l`. Producenta dokłada wybrany chip w bibliotece.
- `IZ2`, `IZ3` – obciążalność Cu/PVC, metoda A1, 2 i 3 żyły obciążone.

## Połączenia (`buildConns()` w `js/wiring.js`)

**Tryby.** `S.wmode === 'auto'`: połączenia wylicza `autoConns()` (reguły niżej). `S.wmode === 'manual'`: `buildConns()` zwraca zworki szyn grzebieniowych z `autoConns()` oraz przewody użytkownika z `S.conn` (`userConns()`, każdy z `user: 1` i `id`). Zapisany przewód: `{ id: 'w12', a, b }`, gdzie koniec to `{k:'dev', id, side, i}` (`i` = numer zacisku od lewej), `{k:'bar', bar}` albo `{k:'wlz', ph}`. `epLive()` zamienia zapisany koniec na koniec z nazwą żyły i odrzuca przewody do nieistniejących zacisków. Kontrola: `wireCheck()` (reguły w `docs/DOMAIN.md`). Stan przejściowy poza `S`: `wirePick` (wybrany pierwszy zacisk), `wireSel` (zaznaczony przewód).

`terms(d)` zwraca zaciski `{ top:[...], bot:[...] }` z nazwami żył (`L1 L2 L3 N PE`). Aparaty bez zacisków mocy (licznik, stycznik, zasilacz, gniazdo, przekaźnik czasowy) nie są na razie okablowane.

`buildConns()` zwraca:

```js
{ C: [ { a: Endpoint, b: Endpoint, ph: 'L1'|..|'PE', mm: 10, kind: 'wlz'|'wire'|'jumper'|'mostek' } ],
  combs: [ { rcd: 'd7', ids: ['d8',...], phs: ['L1','L2','L3'], type: '3F'|'1F', mod: 8 } ] }

Endpoint =
  { k:'dev', id, side:'top'|'bot', ph }   // zacisk aparatu
| { k:'bar', bar:'PE'|'N'|'N:<idRCD>' }  // listwa PE, główna N, N za daną różnicówką
| { k:'wlz', ph }                          // przewód zasilający
| { k:'comb', rcd, ph }                    // szyna grzebieniowa za różnicówką
```

Reguły:
1. WLZ → rozłącznik główny (fazy); PE WLZ → listwa PE. W TN-C-S przewód PEN trafia na listwę PE, a z niej mostek (`kind:'mostek'`) do N rozłącznika lub listwy N.
2. Wyjście rozłącznika (każda faza) → wejścia: SPD, kontrolek, przekaźnika kontroli faz, różnicówek, RCBO i MCB bez przypisanej różnicówki. N tych aparatów z listwy N. SPD: wyjście PE → listwa PE.
3. Różnicówka: MCB przypisane do niej i stojące **bezpośrednio za nią w tym samym rzędzie** tworzą szynę grzebieniową zasilaną zworkami (`jumper`) z wyjść RCD. Pozostałe przypisane MCB dostają osobne przewody. Wyjście N RCD → osobna listwa `N:<id>`.
4. Przekroje: WLZ według zabezpieczenia przedlicznikowego (`wlzMm`), zasilanie aparatów według prądu (`inMm`), SPD T1+T2 10 mm² (PE 16 mm²), SPD T2 6 mm², kontrolki 1,5 mm².
5. Długość przewodu w rozdzielnicy (`connLen`): |Δmodułów|·18 mm + |Δrzędów|·150 mm + 250 mm zapasu, zaokrąglone w górę do 5 cm.

## Routing przewodów (`drawWires()`)

1. Każdy przewód (poza zworkami i mostkiem) dostaje **kanał** startowy i końcowy: kanał `i` to pas nad rzędem `i`, kanał `n` to pas pod ostatnim rzędem (tam są listwy).
2. Liczba przewodów w każdym kanale ustala wysokość pasa (`SP = 6 px` na tor + 24 px na wyprowadzenia z dołu aparatów). Obudowa dostaje te odstępy jako style inline.
3. Przewód w obrębie jednego kanału: pion z zacisku → własny tor poziomy → pion do celu.
4. Przewód między kanałami: tor w kanale startowym → **pion w korytku bocznym** (lewym albo prawym, zależnie od środka przewodu względem połowy szerokości szyny) → tor w kanale docelowym → zacisk. Każdy przewód ma osobny pion.
5. Na listwach każdy przewód dostaje osobny zacisk (`barX`, co 12 px, najbliższy wolny).
6. Kropka oznacza rozgałęzienie z zacisku, z którego wychodzi kilka przewodów.
7. Filtr `S.wf` ukrywa żyły; zaznaczenie aparatu (`S.sel`) przygasza przewody, które go nie dotyczą.
8. Rysowanie jest w `try/catch` w `renderBoard()`: błąd routingu nie blokuje aplikacji.

## Zestawienie materiałów (`bomRows()`)

Aparaty zgrupowane po producencie i opisie + akcesoria: obudowa, szyny grzebieniowe (`combRows`, docięte na liczbę modułów), zaślepki (wolne moduły), listwy N/PE, opisówka, przewody H07V-K według przekroju i koloru (`wireMat`), kable obwodowe YDYp/YDY z zapasem 10% (`cableMat`).
