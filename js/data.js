/* Katalog: producenci, serie, obudowy, presety aparatów, tabele obciążalności — Projektant Rozdzielnic. Skrypt klasyczny (bez modułów ES), ładowany w kolejności z index.html. */
const MFR = {
  hager: { n: 'Hager', s: 'HAGER', c: '#d0702a' },
  schneider: { n: 'Schneider Electric', s: 'SCHNEIDER', c: '#3aa655' },
  abb: { n: 'ABB', s: 'ABB', c: '#d8352a' },
  eaton: { n: 'Eaton', s: 'EATON', c: '#2f5fae' },
  legrand: { n: 'Legrand', s: 'LEGRAND', c: '#7d2346' }
};
const SER = {
  hager: { mcb: 'MBN', rcd: 'CDA', rcbo: 'ADA', spd: 'SPN', sw: 'SBN', contactor: 'ESC' },
  schneider: {
    mcb: 'Acti9 iC60N',
    rcd: 'Acti9 iID',
    rcbo: 'Acti9 iDPN N Vigi',
    spd: 'Acti9 iPRF1',
    sw: 'Acti9 iSW',
    lamp: 'Acti9 iIL',
    contactor: 'Acti9 iCT',
    meter: 'iEM3000',
    socket: 'Acti9 iPC',
    relay: 'Zelio RM22'
  },
  abb: {
    mcb: 'S200',
    rcd: 'F200',
    rcbo: 'DS201',
    spd: 'OVR T1+2',
    sw: 'SD200',
    lamp: 'E219',
    contactor: 'ESB',
    meter: 'EQ B21/B23',
    relay: 'CM-PFE'
  },
  eaton: {
    mcb: 'xPole PL6',
    rcd: 'xPole PF6',
    rcbo: 'xPole CKN6',
    spd: 'SPBT12',
    sw: 'xPole IS',
    lamp: 'Z-L',
    contactor: 'Z-SCH'
  },
  legrand: { mcb: 'DX³ 6000', rcd: 'DX³-ID', rcbo: 'DX³ RCBO', contactor: 'CX³', meter: 'EMDX³' }
};
const ENC = {
  hager: [
    {
      id: 'volta',
      n: 'Volta',
      mpr: 18,
      rows: [1, 2, 3, 4],
      ip: 'IP41',
      mount: 'natynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi przezroczyste'
    },
    {
      id: 'golf',
      n: 'Golf',
      mpr: 12,
      rows: [1, 2, 3, 4],
      ip: 'IP65',
      mount: 'natynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi przezroczyste, uszczelka'
    }
  ],
  schneider: [
    {
      id: 'resi9',
      n: 'Resi9',
      mpr: 13,
      rows: [1, 2, 3, 4],
      ip: 'IP40',
      mount: 'natynkowa / podtynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi białe lub dymione'
    },
    {
      id: 'kaedra',
      n: 'Kaedra',
      mpr: 12,
      rows: [1, 2, 3, 4],
      ip: 'IP65',
      mount: 'natynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi dymione, uszczelka'
    }
  ],
  abb: [
    {
      id: 'mistral41',
      n: 'Mistral41',
      mpr: 12,
      rows: [1, 2, 3, 4],
      ip: 'IP41',
      mount: 'natynkowa / podtynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi przezroczyste lub pełne'
    },
    {
      id: 'mistral65',
      n: 'Mistral65',
      mpr: 12,
      rows: [1, 2, 3, 4],
      ip: 'IP65',
      mount: 'natynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi przezroczyste, uszczelka'
    }
  ],
  eaton: [
    {
      id: 'xboard',
      n: 'xBoard BC',
      mpr: 12,
      rows: [1, 2, 3, 4],
      ip: 'IP40',
      mount: 'natynkowa / podtynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi pełne'
    }
  ],
  legrand: [
    {
      id: 'practibox',
      n: 'Practibox S',
      mpr: 18,
      rows: [1, 2, 3, 4],
      ip: 'IP40',
      mount: 'natynkowa / podtynkowa',
      mat: 'tworzywo',
      cls: 'II',
      door: 'drzwi pełne lub przezroczyste'
    },
    {
      id: 'xl3',
      n: 'XL³ 160',
      mpr: 24,
      rows: [1, 2, 3, 4, 5, 6],
      ip: 'IP40',
      mount: 'natynkowa',
      mat: 'stal malowana',
      cls: 'I',
      door: 'drzwi stalowe'
    }
  ]
};
const TNAME = {
  mcb: 'Wyłącznik nadprądowy',
  rcd: 'Wyłącznik różnicowoprądowy',
  rcbo: 'Wyłącznik różnicowonadprądowy',
  sw: 'Rozłącznik izolacyjny',
  spd: 'Ogranicznik przepięć',
  lamp: 'Kontrolki obecności faz',
  meter: 'Licznik energii',
  contactor: 'Stycznik modułowy',
  socket: 'Gniazdo modułowe',
  timer: 'Przekaźnik czasowy',
  psu: 'Zasilacz 24 V DC',
  relay: 'Przekaźnik kontroli faz'
};
const PREFIX = {
  mcb: 'F',
  rcd: 'F',
  rcbo: 'F',
  spd: 'F',
  sw: 'Q',
  lamp: 'H',
  meter: 'P',
  contactor: 'K',
  timer: 'K',
  relay: 'K',
  socket: 'X',
  psu: 'T'
};
const KINDS = {
  oswietlenie: 'Oświetlenie',
  gniazda: 'Gniazda ogólne',
  kuchnia: 'Kuchnia / AGD',
  lazienka: 'Łazienka',
  plyta: 'Płyta / piekarnik',
  ev: 'Ładowarka EV',
  pc: 'Pompa ciepła',
  klima: 'Klimatyzacja',
  bojler: 'Podgrzewacz wody',
  zewn: 'Obwód zewnętrzny',
  inne: 'Inne'
};
const NEED30 = ['gniazda', 'kuchnia', 'lazienka', 'ev', 'zewn'];
const IZ2 = { 1.5: 14.5, 2.5: 19.5, 4: 26, 6: 34, 10: 46, 16: 61 };
const IZ3 = { 1.5: 13.5, 2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56 };

const PRESETS = [
  {
    g: 'Zasilanie i ochrona',
    t: 'sw',
    p: { In: 63, poles: 3 },
    name: 'Rozłącznik główny',
    l: 'Rozłącznik izolacyjny 63 A 3P'
  },
  {
    g: 'Zasilanie i ochrona',
    t: 'sw',
    p: { In: 100, poles: 4 },
    name: 'Rozłącznik główny',
    l: 'Rozłącznik izolacyjny 100 A 4P'
  },
  {
    g: 'Zasilanie i ochrona',
    t: 'spd',
    p: { cls: 'T1+T2', sys: '3P+N' },
    name: 'Ochrona przepięciowa',
    l: 'Ogranicznik przepięć T1+T2 3P+N'
  },
  {
    g: 'Zasilanie i ochrona',
    t: 'spd',
    p: { cls: 'T2', sys: '1P+N' },
    name: 'Ochrona przepięciowa',
    l: 'Ogranicznik przepięć T2 1P+N'
  },
  { g: 'Zasilanie i ochrona', t: 'lamp', p: {}, name: 'Kontrolki faz', l: 'Kontrolki L1–L3' },
  {
    g: 'Różnicowoprądowe',
    t: 'rcd',
    p: { In: 40, poles: 4, idn: 30, kind: 'A', sel: false },
    name: 'Różnicówka obwodów ogólnych',
    l: 'RCD 40 A / 30 mA, 4P, typ A'
  },
  {
    g: 'Różnicowoprądowe',
    t: 'rcd',
    p: { In: 25, poles: 2, idn: 30, kind: 'A', sel: false },
    name: 'Różnicówka',
    l: 'RCD 25 A / 30 mA, 2P, typ A'
  },
  {
    g: 'Różnicowoprądowe',
    t: 'rcd',
    p: { In: 40, poles: 4, idn: 30, kind: 'B', sel: false },
    name: 'Różnicówka EV',
    l: 'RCD 40 A / 30 mA, 4P, typ B'
  },
  {
    g: 'Różnicowoprądowe',
    t: 'rcd',
    p: { In: 63, poles: 4, idn: 300, kind: 'A', sel: true },
    name: 'Różnicówka ppoż.',
    l: 'RCD 63 A / 300 mA, 4P, typ A, S'
  },
  {
    g: 'Różnicowoprądowe',
    t: 'rcbo',
    p: { In: 16, curve: 'B', poles: 2, idn: 30, kind: 'A' },
    c: { kind: 'gniazda', P: 2, cable: 2.5 },
    name: 'Gniazda',
    l: 'RCBO B16 / 30 mA, 1P+N, typ A'
  },
  {
    g: 'Różnicowoprądowe',
    t: 'rcbo',
    p: { In: 10, curve: 'B', poles: 2, idn: 30, kind: 'A' },
    c: { kind: 'oswietlenie', P: 0.5, cable: 1.5 },
    name: 'Oświetlenie',
    l: 'RCBO B10 / 30 mA, 1P+N, typ A'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 10, curve: 'B', poles: 1, icn: 6 },
    c: { kind: 'oswietlenie', P: 0.5, cable: 1.5 },
    name: 'Oświetlenie',
    l: 'MCB B10 1P · oświetlenie'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 16, curve: 'B', poles: 1, icn: 6 },
    c: { kind: 'gniazda', P: 2, cable: 2.5 },
    name: 'Gniazda',
    l: 'MCB B16 1P · gniazda'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 20, curve: 'B', poles: 1, icn: 6 },
    c: { kind: 'kuchnia', P: 3, cable: 4 },
    name: 'Kuchnia',
    l: 'MCB B20 1P · AGD'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 16, curve: 'B', poles: 3, icn: 6 },
    c: { kind: 'plyta', P: 7.2, cable: 2.5 },
    name: 'Płyta indukcyjna',
    l: 'MCB B16 3P · płyta'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 20, curve: 'C', poles: 3, icn: 6 },
    c: { kind: 'ev', P: 11, cable: 6 },
    name: 'Ładowarka EV',
    l: 'MCB C20 3P · ładowarka 11 kW'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 16, curve: 'C', poles: 3, icn: 6 },
    c: { kind: 'pc', P: 5, cable: 2.5 },
    name: 'Pompa ciepła',
    l: 'MCB C16 3P · pompa ciepła'
  },
  {
    g: 'Nadprądowe',
    t: 'mcb',
    p: { In: 32, curve: 'C', poles: 4, icn: 10 },
    c: { kind: 'inne', P: 15, cable: 10 },
    name: 'Zasilanie podrozdzielnicy',
    l: 'MCB C32 4P · WLZ do podrozdzielnicy'
  },
  { g: 'Sterowanie i pomiar', t: 'meter', p: { ph: 3, mid: true }, name: 'Podlicznik', l: 'Licznik energii 3F, MID' },
  { g: 'Sterowanie i pomiar', t: 'meter', p: { ph: 1, mid: true }, name: 'Podlicznik', l: 'Licznik energii 1F, MID' },
  { g: 'Sterowanie i pomiar', t: 'contactor', p: { In: 25, poles: 2 }, name: 'Stycznik', l: 'Stycznik 25 A 2NO' },
  { g: 'Sterowanie i pomiar', t: 'contactor', p: { In: 40, poles: 4 }, name: 'Stycznik', l: 'Stycznik 40 A 4NO' },
  { g: 'Sterowanie i pomiar', t: 'relay', p: {}, name: 'Kontrola faz', l: 'Przekaźnik kontroli faz' },
  { g: 'Sterowanie i pomiar', t: 'timer', p: {}, name: 'Przekaźnik czasowy', l: 'Przekaźnik czasowy wielofunkcyjny' },
  { g: 'Sterowanie i pomiar', t: 'psu', p: { W: 30 }, name: 'Zasilacz 24 V', l: 'Zasilacz DIN 24 V DC 30 W' },
  { g: 'Sterowanie i pomiar', t: 'socket', p: {}, name: 'Gniazdo serwisowe', l: 'Gniazdo modułowe 16 A' }
];
