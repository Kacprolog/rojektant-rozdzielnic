# Reguły elektryczne zaimplementowane w aplikacji

Wszystkie reguły są uproszczone i służą do wstępnego projektu. Ostateczna weryfikacja należy do osoby z uprawnieniami SEP. Każda nowa reguła w `checks()` powinna mieć: poziom (`crit` błąd, `warn` uwaga, `info`), komunikat z oznaczeniem aparatu, wskazówkę naprawy i odwołanie do normy.

## Obliczenia

| Wielkość | Wzór / źródło | Funkcja |
|---|---|---|
| Prąd obwodu 1F | Ib = P / (230 V · cos φ) | `ib()` |
| Prąd obwodu 3F | Ib = P / (√3 · 400 V · cos φ) | `ib()` |
| Obciążalność przewodu Iz | Cu/PVC, metoda A1, bez współczynników poprawkowych (`IZ2`, `IZ3`) | `iz()` |
| Moc szczytowa | Pd = ΣP · ks | `totals()` |
| Prąd szczytowy | Pd / (√3 · 400 V · cos φ) | `totals()` |
| Obciążenie faz | suma Ib obwodów 1F na fazie + Ib obwodów 3F na każdej fazie | `phaseLoads()` |

Tabela Iz [A] (A1, Cu, PVC):

| mm² | 1,5 | 2,5 | 4 | 6 | 10 | 16 |
|---|---|---|---|---|---|---|
| 2 żyły obciążone | 14,5 | 19,5 | 26 | 34 | 46 | 61 |
| 3 żyły obciążone | 13,5 | 18 | 24 | 31 | 42 | 56 |

## Kontrola projektu (`checks()`)

| Poziom | Reguła | Podstawa |
|---|---|---|
| błąd | Rząd przepełniony (suma modułów > `mpr`) | geometria obudowy |
| info | Kilku producentów w jednym rzędzie | zgodność szyn grzebieniowych |
| uwaga | Brak rozłącznika głównego | PN-HD 60364-5-53 |
| uwaga | Brak ogranicznika przepięć | PN-HD 60364-4-443 |
| błąd | Ib > In | warunek Ib ≤ In |
| błąd | In > Iz | warunek In ≤ Iz |
| błąd | Gniazda, kuchnia, łazienka, EV, obwody zewnętrzne bez RCD ≤ 30 mA (`NEED30`) | PN-HD 60364-4-41 p. 411.3.3, części 7xx |
| uwaga | Ładowarka EV za RCD innym niż typ B | PN-HD 60364-7-722 (typ B albo typ A + RDC-DD 6 mA DC) |
| info | RCD typu AC | zalecany typ A lub F |
| info | Różnicówka bez obwodów | – |
| uwaga | Obciążenie szczytowe za RCD > In RCD | – |
| błąd | Obwód za RCD 2P na innej fazie niż różnicówka | – |
| błąd | RCD 2P zasila obwód 3F | – |
| uwaga | Selektywność: zabezpieczenie przedlicznikowe < 1,6 × największe In obwodu | praktyka selektywności nadprądowej |
| błąd | In rozłącznika < zabezpieczenie przedlicznikowe | – |
| błąd | Prąd szczytowy > zabezpieczenie przedlicznikowe | – |
| uwaga | Moc szczytowa > moc przyłączeniowa | warunki przyłączenia OSD |
| uwaga | Asymetria faz > 25% | – |
| info | Rezerwa miejsca < 20% | dobra praktyka |

## Przekroje przewodów w rozdzielnicy

| Połączenie | Przekrój |
|---|---|
| WLZ (zab. przedlicznikowe ≤20/25/40/63/80/100 A) | 4/6/10/16/25/35 mm², YKY 4× (TN-C-S) lub 5× |
| Zasilanie aparatów od rozłącznika (wg prądu ≤20/25/40/63 A) | 4/6/10/16 mm² |
| SPD T1+T2 | 10 mm², PE 16 mm² (PN-HD 60364-5-534) |
| SPD T2 | 6 mm², PE 6 mm² |
| Kontrolki, przekaźnik kontroli faz | 1,5 mm² |
| Kabel obwodowy | YDYp 3×/5× do 4 mm², YDY powyżej |

Kolory żył (PN-EN 60445): L1 brązowy, L2 czarny, L3 szary, N niebieski, PE zielono-żółty.

## Czego jeszcze nie sprawdzamy

Spadek napięcia, impedancja pętli zwarcia i czas samoczynnego wyłączenia, prąd zwarciowy względem Icn, współczynniki poprawkowe (temperatura, grupowanie), selektywność według charakterystyk, rozpływ prądu w przewodzie N, dobór SPD do strefy LPZ, ciepło wydzielane w obudowie. To jest w planie w `HANDOFF.md`.
