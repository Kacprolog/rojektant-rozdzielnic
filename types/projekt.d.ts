/* Typy danych projektu dla sprawdzania typów (npm run typecheck, TypeScript w trybie checkJs).
   Plik nie jest ładowany przez stronę; opisuje kształt danych z docs/DATA_MODEL.md. */

type DevType =
  | 'mcb'
  | 'rcd'
  | 'rcbo'
  | 'sw'
  | 'spd'
  | 'lamp'
  | 'meter'
  | 'contactor'
  | 'socket'
  | 'timer'
  | 'psu'
  | 'relay';
type Phase = 'L1' | 'L2' | 'L3';

/** Parametry aparatu (p). Zestaw pól zależy od typu; cleanDev() sprowadza je do list dozwolonych wartości. */
interface DevParams {
  In?: number;
  poles?: number;
  ch?: string;
  idn?: number;
  type?: string;
  icn?: number;
  ph?: number;
  ctl?: 'man' | 'g12' | 'relay';
  cls?: string;
  sys?: string;
  W?: number;
  [k: string]: any;
}

/** Parametry obwodu (c) — tylko MCB i RCBO. */
interface CircParams {
  kind: string;
  P: number;
  cable: number;
  ph: Phase;
  len?: number;
  [k: string]: any;
}

interface Device {
  id: string;
  t: DevType;
  m: string;
  p: DevParams;
  name: string;
  c?: CircParams;
  /** MCB: id różnicówki, która go chroni */
  rcd?: string | null;
  /** licznik, stycznik: id wyłącznika obwodu, w którego torze stoi */
  circ?: string | null;
}

/** Koniec przewodu. Zapisany: dev z i (numer zacisku mocy) albo c (nazwa zacisku sterowniczego); żywy: dev z ph. */
interface Endpoint {
  k: 'dev' | 'bar' | 'wlz' | 'comb';
  id?: string;
  side?: 'top' | 'bot';
  i?: number;
  c?: string;
  ph?: string;
  bar?: string;
  rcd?: string;
}

/** Przewód dodany ręcznie (S.conn). */
interface Wire {
  id: string;
  a: Endpoint;
  b: Endpoint;
  mm?: number;
  col?: string;
}

/** Połączenie wyliczone (buildConns): przewód, zworka szyny grzebieniowej, mostek PEN albo żyła WLZ. */
interface Conn {
  id?: string;
  user?: number;
  a: Endpoint;
  b: Endpoint;
  ph: string;
  mm: number;
  mmAuto?: number;
  col?: string;
  flip?: boolean;
  kind: 'wire' | 'jumper' | 'mostek' | 'wlz';
  [k: string]: any;
}

/** Stan aplikacji S: dane projektu (DATA_KEYS) i stan widoku. */
interface State {
  name: string;
  enc: { mfr: string; series: string; rows: number };
  set: { moc: number; przedl: number; ks: number; cos: number; siec: string; [k: string]: any };
  rows: string[][];
  dev: Record<string, Device>;
  wmode: 'auto' | 'manual';
  conn: Wire[];
  sel?: string | null;
  active?: number;
  mfr?: string;
  tab?: string;
  q?: string;
  wires?: boolean;
  schem?: boolean;
  wf?: Record<string, number>;
  sim?: any;
  zoom?: number;
}

interface ProjectEntry {
  id: string;
  S: State;
  uid: number;
  mod?: number;
}

interface ProjectList {
  cur: string | null;
  list: ProjectEntry[];
  /** wpisy, których nie udało się wczytać; zapisywane z powrotem bez zmian */
  bad: any[];
}

interface UndoHistory {
  u: string[];
  r: string[];
  cur: string | null;
  t: number;
  tag: string | null;
}
