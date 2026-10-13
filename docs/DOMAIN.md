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

## Spadki napięcia i zwarcia (`netCalc()`, `circCalc()`)

Uproszczenia: tylko rezystancja przewodów Cu, γ = 56 m/(Ω·mm²), bez reaktancji; pętla zwarcia z rezystancją × 1,25 (nagrzanie); przewód ochronny o przekroju fazowego; spadek napięcia przy cos φ ≈ 1; U0 = 230 V, U = 400 V.

| Wielkość | Wzór |
|---|---|
| Pętla zwarcia w rozdzielnicy | Zs,R = Zs,złącze + 1,25 · 2 · L_WLZ / (γ · S_WLZ) |
| Pętla zwarcia na końcu obwodu | Zs = Zs,R + 1,25 · 2 · L / (γ · S) |
| Prąd zwarcia jednofazowego | Ik1 = U0 / Zs |
| Próg wyzwalania | Ia = k · In, k = 5 (B), 10 (C), 20 (D) |
| Warunek samoczynnego wyłączenia (TN) | Zs · Ia ≤ U0 |
| Prąd zwarciowy trójfazowy w rozdzielnicy | Ik = U / (√3 · (U / (√3 · Ik,złącze) + L_WLZ / (γ · S_WLZ))) |
| Spadek napięcia 1F / 3F | ΔU% = 200 · P · L / (γ · S · U0²) / ΔU% = 100 · P · L / (γ · S · U²) |
| Spadek napięcia w WLZ | jak 3F, z mocą szczytową Pd |

Dane wejściowe w `S.set` (czytane przez `sv()`): `zs0` 0,3 Ω, `ik0` 6 kA, `wlzLen` 15 m, `duObw` 3%, `duWlz` 0,5%.

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
| uwaga | Prąd szczytowy jednej fazy (z ks) > zabezpieczenie przedlicznikowe | – |
| info | Licznik albo stycznik poza torem obwodu | – |
| błąd | In stycznika < In zabezpieczenia obwodu; stycznik 2NO albo licznik 1F w obwodzie 3F | – |
| uwaga | Stycznik sterowany przekaźnikiem kontroli faz, którego nie ma | – |
| uwaga | Spadek napięcia w obwodzie > `duObw`; w WLZ > `duWlz` | PN-HD 60364-5-52 zał. G |
| błąd / uwaga | Zs · Ia > U0 (uwaga, gdy obwód ma RCD) | PN-HD 60364-4-41 p. 411.4 |
| błąd | Układ TT: obwód bez RCD | PN-HD 60364-4-41 p. 411.5 |
| błąd | Icn aparatu < Ik w rozdzielnicy | PN-HD 60364-4-43 p. 434.5.1 |

## Kontrola okablowania ręcznego (`wireCheck()`)

Działa tylko w trybie „Ręczne”. Każdy zacisk ma żyłę (`L1 L2 L3 N PE`) i strefę: `pre` przed rozłącznikiem głównym, `main` za nim, albo id różnicówki za jej wyjściem (wyjście RCD, jej listwa N, wejścia MCB przypisanych do niej).

| Poziom | Reguła | Podstawa |
|---|---|---|
| błąd | Przewód łączy dwie różne fazy | zwarcie międzyfazowe 400 V |
| błąd | Przewód łączy fazę z N albo fazę z PE | zwarcie / zwarcie doziemne |
| błąd | N–PE poza punktem podziału PEN (dozwolone tylko: listwa PE → główna listwa N albo wejście N rozłącznika, w TN-C-S) | PN-HD 60364-5-54 p. 543.4 |
| błąd | Jakiekolwiek połączenie N–PE w TN-S / TT | PN-HD 60364-5-54 |
| błąd | Przewód łączy strefę `pre` z inną (omija rozłącznik główny) | PN-HD 60364-5-53 |
| błąd | Przewód fazowy łączy różne strefy (obwód omija swoją różnicówkę albo łączy dwie różnicówki) | PN-HD 60364-4-41 |
| błąd | Przewód N łączy różne strefy (wspólny N za różnicówkami) | błędne wyzwalanie lub brak zadziałania RCD |
| uwaga | Przewód w dolnym zacisku wyłącznika obwodowego | zacisk odejścia na kabel obwodowy |
| błąd | Zacisk wejściowy aparatu (albo PE ogranicznika) bez ciągłości do WLZ | – |
| błąd | Listwa PE bez połączenia z przewodem ochronnym WLZ | PN-HD 60364-5-54 |
| uwaga | Główna listwa N niezasilona; listwa N za różnicówką z obwodami niepołączona z jej wyjściem N | – |
| info | Tryb ręczny bez żadnego przewodu | – |
| błąd | Izolacja zielono-żółta na przewodzie innym niż PE/PEN; przewód PE/PEN w innym kolorze | PN-EN 60445 |
| uwaga | Izolacja niebieska na przewodzie fazowym; przewód N w kolorze innym niż niebieski | PN-EN 60445 |
| info | Przewód fazowy w barwie innej fazy (zalecane L1 brązowy, L2 czarny, L3 szary) | PN-HD 308 S2 |
| uwaga | Przekrój ustawiony ręcznie mniejszy niż dobrany | PN-HD 60364-4-43 |

### Przekrój przewodu a zaciski aparatu (`termRange()`, `termFit()`, `termIssues()`)

Błąd, gdy przekrój przewodu wpiętego w aparat (albo kabla obwodowego) jest poza zakresem zacisku. Działa w obu trybach okablowania. Zakresy są **orientacyjne** i wymagają sprawdzenia w karcie katalogowej:

| Aparat | Zakres [mm²] |
|---|---|
| MCB, RCBO | 1–25 (MCB powyżej 63 A: 2,5–50) |
| RCD, rozłącznik | 1,5–25 (powyżej 63 A: 2,5–50) |
| SPD T1+T2 / T2 | 2,5–35 / 1,5–25 |
| Kontrolki faz | 0,5–6 |
| Przekaźnik kontroli faz, czasowy, zasilacz | 0,5–2,5 |
| Licznik / stycznik do 25 A / stycznik większy / gniazdo | 1,5–25 / 1–6 / 2,5–25 / 1–4 |

Na rysunku grubość linii rośnie z przekrojem (`WIRE_W`).

PEN w TN-C-S (żyła ochronno-neutralna WLZ, mostek PEN) jest rysowany jako zielono-żółty z niebieskimi końcami. Kolory żył są takie same w jasnym i ciemnym motywie.

Ciągłość liczona jest po grafie: przewody + tory wewnątrz rozłącznika, RCD, MCB, RCBO (wejście ↔ wyjście tej samej żyły) + szyny grzebieniowe.

## Symulacja (`simCalc()`, `simFault()` w `js/sim.js`)

Liczy wyłącznie ciągłość torów: przewody + szyny grzebieniowe + tory wewnątrz **załączonych** aparatów (rozłącznik, RCD, MCB, RCBO), od żył WLZ bez zaniku. Nie liczy czasów zadziałania, impedancji pętli ani prądów zwarciowych.

| Zdarzenie | Skutek w symulacji |
|---|---|
| Dźwignia | Aparat przerywa wszystkie swoje tory (także N w RCD i RCBO) |
| Przycisk T | Wybija RCD / RCBO, tylko gdy jest załączony i ma napięcie |
| Zwarcie w obwodzie | Wyłącza wyłącznik tego obwodu; ostrzeżenie, gdy zabezpieczenie przedlicznikowe < 1,6 × In obwodu |
| Przeciążenie | Wyłącza wyłącznik tego obwodu; błąd, gdy In > Iz przewodu |
| Upływ do PE | Wyłącza RCD chroniący obwód (albo RCBO); bez RCD nic nie zadziała; uwaga dla IΔn > 30 mA |
| Zanik fazy | Obwody 1F tej fazy bez napięcia, obwody 3F oznaczone jako zasilane niepełnie; przekaźnik kontroli faz rozłącza styczniki ze sterowaniem „przekaźnik” |
| Taryfa G12 | Przełącznik w pasku: styczniki ze sterowaniem „taryfa G12” zamknięte (noc) albo rozłączone (dzień) |
| Stycznik ręczny | Dźwignia stycznika zamyka i rozłącza tor |

Obwód jednofazowy jest „zasilony”, gdy ma fazę **i** N (z wyjścia RCBO, z listwy N swojej różnicówki albo z głównej listwy N).

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

Czas samoczynnego wyłączenia, reaktancja przewodów, przekrój PE inny niż fazowy, rezystancja uziemienia w TT, współczynniki poprawkowe (temperatura, grupowanie), selektywność według charakterystyk, rozpływ prądu w przewodzie N, dobór SPD do strefy LPZ, ciepło wydzielane w obudowie. To jest w planie w `HANDOFF.md`.
