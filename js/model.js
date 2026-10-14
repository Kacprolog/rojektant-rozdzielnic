/* Stan projektu, geometria aparatów, obliczenia i kontrola projektu — Projektant Rozdzielnic. Skrypt klasyczny (bez modułów ES), ładowany w kolejności z index.html. */
let S, uid=1, dragInfo=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=1)=>Number(n).toLocaleString('pl-PL',{maximumFractionDigits:d,minimumFractionDigits:0});

function width(d){const p=d.p;switch(d.t){
  case 'mcb':return p.poles;case 'rcd':return p.poles;case 'rcbo':return p.poles==2?2:4;case 'sw':return p.poles;
  case 'spd':return p.sys==='1P+N'?2:4;case 'meter':return p.ph==1?1:4;
  case 'contactor':return p.In<=25?(p.poles==2?1:2):(p.poles==2?2:3);
  case 'socket':return 2.5;case 'psu':return p.W<=30?2:4;default:return 1;}}
/* Zakres przekrojów przewodu w zaciskach aparatu [mm²]. Wartości orientacyjne, typowe dla aparatury modułowej; sprawdź w karcie katalogowej. */
function termRange(d){const In=(d.p&&d.p.In)||0;switch(d.t){
  case 'mcb':return In<=63?[1,25]:[2.5,50];case 'rcbo':return [1,25];
  case 'rcd':case 'sw':return In<=63?[1.5,25]:[2.5,50];
  case 'spd':return d.p.cls==='T1+T2'?[2.5,35]:[1.5,25];
  case 'lamp':return [0.5,6];case 'relay':case 'timer':case 'psu':return [0.5,2.5];
  case 'meter':return [1.5,25];case 'contactor':return In<=25?[1,6]:[2.5,25];case 'socket':return [1,4];}return [0.5,25];}
const series=d=>(SER[d.m]&&SER[d.m][d.t])||'seria modułowa';
const clen=d=>(d.c&&d.c.len!=null)?d.c.len:15;
const isCirc=d=>d.t==='mcb'||d.t==='rcbo';
const is3=d=>(d.t==='mcb'&&d.p.poles>=3)||(d.t==='rcbo'&&d.p.poles==4);
function rate(d){const p=d.p;switch(d.t){
  case 'mcb':return [p.curve+p.In,p.poles+'P'];
  case 'rcd':return [p.In+'A',p.idn+'mA '+p.kind+(p.sel?' S':'')];
  case 'rcbo':return [p.curve+p.In,p.idn+'mA '+p.kind];
  case 'sw':return [p.In+'A',p.poles+'P'];
  case 'spd':return [p.cls,p.sys];
  case 'meter':return ['kWh',p.ph==3?'3F':'1F'];
  case 'contactor':return [p.In+'A',p.poles+'NO'];
  case 'lamp':return ['L1-3',''];case 'socket':return ['16A',''];case 'timer':return ['T',''];
  case 'psu':return ['24V',p.W+'W'];case 'relay':return ['3~','kontr.'];}return ['',''];}
function desc(d){const p=d.p;switch(d.t){
  case 'mcb':return `${TNAME.mcb} ${p.curve}${p.In} ${p.poles}P, ${p.icn} kA`;
  case 'rcd':return `${TNAME.rcd} ${p.In} A / ${p.idn} mA, ${p.poles}P, typ ${p.kind}${p.sel?' selektywny S':''}`;
  case 'rcbo':return `${TNAME.rcbo} ${p.curve}${p.In} / ${p.idn} mA, ${p.poles==2?'1P+N':'3P+N'}, typ ${p.kind}, ${p.icn} kA`;
  case 'sw':return `${TNAME.sw} ${p.In} A ${p.poles}P`;
  case 'spd':return `${TNAME.spd} ${p.cls} ${p.sys}`;
  case 'meter':return `${TNAME.meter} ${p.ph==3?'3-fazowy':'1-fazowy'}${p.mid?', MID':''}`;
  case 'contactor':return `${TNAME.contactor} ${p.In} A ${p.poles}NO, cewka 230 V AC`;
  case 'psu':return `${TNAME.psu} ${p.W} W`;
  default:return TNAME[d.t];}}
function specs(d){const p=d.p,r=[];
  switch(d.t){
  case 'mcb':r.push(['Norma','PN-EN 60898-1'],['Napięcie Ue','230/400 V AC'],['Prąd In',p.In+' A'],['Charakterystyka',p.curve+({B:' · wyzw. 3–5 × In',C:' · wyzw. 5–10 × In',D:' · wyzw. 10–20 × In'}[p.curve])],['Zdolność Icn',p.icn+' kA'],['Klasa ogr. energii','3'],['Bieguny',p.poles+'P']);break;
  case 'rcd':r.push(['Norma','PN-EN 61008-1'],['Napięcie Ue',p.poles==2?'230 V AC':'400 V AC'],['Prąd In',p.In+' A'],['IΔn',p.idn+' mA'],['Typ',p.kind+' · '+({AC:'prąd przemienny',A:'+ pulsujący jednokierunkowy',F:'+ prądy o mieszanej częstotliwości',B:'+ prąd stały wygładzony'}[p.kind])],['Zwłoka',p.sel?'selektywny (S)':'bezzwłoczny'],['Uwaga','wymaga zabezpieczenia zwarciowego przed aparatem']);break;
  case 'rcbo':r.push(['Norma','PN-EN 61009-1'],['Prąd In',p.In+' A'],['Charakterystyka',p.curve],['IΔn',p.idn+' mA, typ '+p.kind],['Zdolność Icn',p.icn+' kA'],['Bieguny',p.poles==2?'1P+N':'3P+N']);break;
  case 'sw':r.push(['Norma','PN-EN 60947-3'],['Napięcie Ue','400 V AC'],['Prąd In',p.In+' A'],['Kategoria','AC-22A'],['Bieguny',p.poles+'P']);break;
  case 'spd':r.push(['Norma','PN-EN 61643-11'],['Typ',p.cls],['Układ',p.sys],['Uc','275 V AC'],['In (8/20)','20 kA / biegun'],...(p.cls==='T1+T2'?[['Iimp (10/350)','12,5 kA / biegun']]:[]),['Up','≤ 1,5 kV'],['Sygnalizacja','okienko stanu wkładki']);break;
  case 'meter':r.push(['Dyrektywa','MID'+(p.mid?' (legalizacja)':' – brak')],['Klasa dokładności','B (1)'],['Zasilanie',p.ph==3?'3 × 230/400 V':'230 V'],['Prąd ref. (maks.)',p.ph==3?'5 (80) A':'5 (45) A'],['Pomiar','bezpośredni']);break;
  case 'contactor':r.push(['Norma','PN-EN 61095'],['Prąd AC-7a',p.In+' A'],['Styki',p.poles+'NO'],['Cewka','230 V AC, praca cicha']);break;
  case 'lamp':r.push(['Napięcie','3 × 230 V AC'],['Źródło','LED']);break;
  case 'socket':r.push(['Norma','PN-IEC 60884-1'],['Znamionowo','16 A 250 V'],['Typ','2P+Z (francuskie)']);break;
  case 'timer':r.push(['Zasilanie','12–240 V AC/DC'],['Funkcje','opóźnione zał./wył., cykl, impuls'],['Zakres','0,1 s – 100 h']);break;
  case 'psu':r.push(['Wejście','100–240 V AC'],['Wyjście','24 V DC, '+fmt(p.W/24,2)+' A'],['Moc',p.W+' W']);break;
  case 'relay':r.push(['Kontrola','zanik, kolejność, asymetria faz'],['Napięcie','3 × 400 V AC'],['Wyjście','1 × CO, 5 A']);break;}
  const tr=termRange(d);r.push(['Zaciski','przewód '+fmt(tr[0])+'–'+fmt(tr[1])+' mm² (orientacyjnie)']);
  r.push(['Szerokość',fmt(width(d))+' mod. ('+fmt(width(d)*18)+' mm)']);return r;}

/* ---------- state ---------- */
function newDev(t,m,p,c,name){const d={id:'d'+(uid++),t,m,p:{...p},name:name||TNAME[t]};
  if(t==='mcb'||t==='rcbo'){d.c={kind:'gniazda',P:1,cable:2.5,ph:'L1',len:15,...(c||{})};}
  if(t==='mcb')d.rcd=null;
  if(t==='rcbo'&&!d.p.icn)d.p.icn=6;                     /* zdolność zwarciowa Icn [kA] */
  if(t==='meter'||t==='contactor')d.circ=null;          /* id obwodu (MCB / RCBO), w którego torze stoi aparat */
  if(t==='contactor'&&!d.p.ctl)d.p.ctl='man';            /* sterowanie cewki: man ręczne, g12 sygnał taryfy, relay przekaźnik kontroli faz */
  return d;}
function enc(){return ENC[S.enc.mfr].find(e=>e.id===S.enc.series)||ENC[S.enc.mfr][0];}
function sample(){
  uid=1;S={name:'Dom jednorodzinny – rozdzielnica RG',enc:{mfr:'hager',series:'volta',rows:3},
    set:{moc:22,przedl:32,ks:0.5,cos:0.95,siec:'TN-C-S'},rows:[[],[],[]],dev:{},wmode:'auto',conn:[],sel:null,active:1,mfr:'hager',tab:'aparat',q:''};
  const add=(r,d)=>{S.dev[d.id]=d;S.rows[r].push(d.id);return d;};
  const m='hager';
  add(0,newDev('sw',m,{In:63,poles:3},null,'Rozłącznik główny'));
  add(0,newDev('spd',m,{cls:'T1+T2',sys:'3P+N'},null,'Ochrona przepięciowa'));
  add(0,newDev('lamp',m,{},null,'Kontrolki faz'));
  const mt=add(0,newDev('meter',m,{ph:3,mid:true},null,'Podlicznik pompy ciepła'));
  add(0,newDev('relay',m,{},null,'Kontrola faz PC'));
  const kb=add(0,newDev('contactor',m,{In:25,poles:2,ctl:'g12'},null,'Bojler – taryfa G12'));
  const r1=add(1,newDev('rcd',m,{In:40,poles:4,idn:30,kind:'A',sel:false},null,'RCD obwody ogólne'));
  const c1=[['B',10,'oswietlenie',0.4,1.5,'L1','Oświetlenie parter'],['B',10,'oswietlenie',0.4,1.5,'L2','Oświetlenie piętro'],
    ['B',16,'gniazda',2,2.5,'L3','Gniazda salon'],['B',16,'kuchnia',2,2.5,'L1','Gniazda kuchnia'],['B',16,'lazienka',2,2.5,'L2','Łazienka'],
    ['B',16,'kuchnia',2.2,2.5,'L3','Pralka'],['B',16,'kuchnia',2,2.5,'L2','Zmywarka'],['B',16,'gniazda',1.8,2.5,'L1','Gniazda pokoje piętro']];
  const LEN=[22,28,14,9,12,8,9,26];
  c1.forEach(([cu,In,k,P,cab,ph,nm],ix)=>{const d=newDev('mcb',m,{In,curve:cu,poles:1,icn:6},{kind:k,P,cable:cab,ph,len:LEN[ix]},nm);d.rcd=r1.id;add(1,d);});
  const r2=add(2,newDev('rcd',m,{In:40,poles:4,idn:30,kind:'B',sel:false},null,'RCD ładowarka EV'));
  let d=newDev('mcb',m,{In:20,curve:'C',poles:3,icn:6},{kind:'ev',P:11,cable:6,len:24},'Ładowarka EV 11 kW');d.rcd=r2.id;add(2,d);
  d=newDev('mcb',m,{In:16,curve:'B',poles:3,icn:6},{kind:'plyta',P:7.2,cable:2.5,len:10},'Płyta indukcyjna');d.rcd=r1.id;add(2,d);
  add(2,newDev('rcbo',m,{In:16,curve:'B',poles:2,idn:30,kind:'A'},{kind:'zewn',P:1.5,cable:2.5,ph:'L2',len:30},'Gniazda garaż / ogród'));
  kb.circ=add(2,newDev('mcb',m,{In:16,curve:'B',poles:1,icn:6},{kind:'bojler',P:2,cable:2.5,ph:'L3'},'Podgrzewacz wody')).id;
  mt.circ=add(2,newDev('mcb',m,{In:16,curve:'C',poles:3,icn:6},{kind:'pc',P:5,cable:2.5,len:18},'Pompa ciepła')).id;
}
/* Dane projektu (trafiają do pliku i historii cofania) w odróżnieniu od stanu widoku (sel, active, mfr, tab, q, wires, wf). */
const DATA_KEYS=['name','enc','set','rows','dev','wmode','conn'];
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const TABS=['aparat','kontrola','bilans','struktura','kable','bom'];
const FILE_APP='projektant-rozdzielnic',FILE_VERSION=1;
const num=(v,d)=>{v=+v;return isFinite(v)?v:d;};
const oneOf=(v,a)=>a.indexOf(v)>=0?v:a[0];
/* Czy obiekt ma strukturę projektu: rzędy z istniejącymi, niepowtórzonymi aparatami znanych typów. */
function valid(s){try{
  if(!s||typeof s!=='object'||!Array.isArray(s.rows)||!s.rows.length||!s.dev||typeof s.dev!=='object'||!s.enc||!ENC[s.enc.mfr])return false;
  const seen={};return s.rows.every(r=>Array.isArray(r)&&r.every(id=>{const d=s.dev[id];
    if(!d||seen[id]||d.id!==id||!/^d\d+$/.test(id)||!TNAME[d.t]||!d.p||typeof d.p!=='object')return false;
    seen[id]=1;return !isCirc(d)||!!(d.c&&typeof d.c==='object');}));
  }catch(e){return false;}}
/* Sprowadza pola aparatu do dozwolonych wartości (plik projektu może pochodzić z zewnątrz). */
function cleanDev(d){const p=d.p;d.name=String(d.name==null?TNAME[d.t]:d.name);if(!MFR[d.m])d.m='hager';
  ['In','poles','idn','icn','W','ph'].forEach(k=>{if(k in p)p[k]=num(p[k],k==='poles'?1:k==='In'?16:0);});
  /* liczba biegunów i faz tylko z typoszeregu danego aparatu: terms() i width() zakładają te wartości */
  const POLES={mcb:[1,2,3,4],sw:[3,1,2,4],rcd:[4,2],rcbo:[2,4],contactor:[2,4]};
  if(POLES[d.t])p.poles=oneOf(p.poles,POLES[d.t]);
  if(d.t==='meter')p.ph=oneOf(p.ph,[3,1]);
  if(d.t==='psu')p.W=oneOf(p.W,[30,60]);
  if(['mcb','rcbo','rcd','sw','contactor'].indexOf(d.t)>=0&&!(p.In>0))p.In=16;
  if(isCirc(d))p.icn=oneOf(p.icn,[6,10]);
  if(d.t==='rcd'||d.t==='rcbo')p.idn=p.idn>0?p.idn:30;
  if(isCirc(d))p.curve=oneOf(p.curve,['B','C','D']);
  if(d.t==='rcd'||d.t==='rcbo')p.kind=oneOf(p.kind,['A','AC','F','B']);
  if(d.t==='rcd')p.sel=!!p.sel;
  if(d.t==='meter')p.mid=!!p.mid;
  if(d.t==='contactor')p.ctl=oneOf(p.ctl,['man','g12','relay']);
  if(d.t==='spd'){p.cls=oneOf(p.cls,['T1+T2','T2']);p.sys=oneOf(p.sys,['3P+N','1P+N']);}
  if(isCirc(d)){const c=d.c;c.kind=KINDS[c.kind]?c.kind:'inne';c.P=Math.max(0,num(c.P,0));c.cable=num(c.cable,2.5);c.ph=oneOf(c.ph,['L1','L2','L3']);if(c.len!=null)c.len=Math.max(0,num(c.len,15));}}
/* Uzupełnia brakujące pola wartościami domyślnymi (zgodność wstecz) i porządkuje odwołania. Wymaga valid(s). */
function cleanEp(s,e){if(!e||typeof e!=='object')return null;
  if(e.k==='dev')return own(s.dev,e.id)&&(e.side==='top'||e.side==='bot')&&typeof e.i==='number'&&e.i>=0&&e.i<8?{k:'dev',id:e.id,side:e.side,i:Math.floor(e.i)}:null;
  if(e.k==='bar'){const b=String(e.bar);return b==='PE'||b==='N'||(b.slice(0,2)==='N:'&&own(s.dev,b.slice(2)))?{k:'bar',bar:b}:null;}
  if(e.k==='wlz')return ['L1','L2','L3','N','PE'].indexOf(e.ph)>=0?{k:'wlz',ph:e.ph}:null;
  return null;}
function cleanConn(s){const out=[],seen={};(Array.isArray(s.conn)?s.conn:[]).forEach(w=>{if(!w||!/^w\d+$/.test(w.id)||seen[w.id])return;const a=cleanEp(s,w.a),b=cleanEp(s,w.b);if(a&&b){seen[w.id]=1;const c={id:w.id,a:a,b:b};
    if([1.5,2.5,4,6,10,16,25,35].indexOf(w.mm)>=0)c.mm=w.mm;                 /* przekrój ustawiony ręcznie */
    if(['L1','L2','L3','N','PE'].indexOf(w.col)>=0)c.col=w.col;              /* kolor izolacji ustawiony ręcznie */
    out.push(c);}});return out;}
/* Zakresy ustawień, których przekroczenie psuje wszystkie obliczenia (np. ks > 1 albo cos φ > 1). */
const SET_RANGE={ks:[0.05,1],cos:[0.5,1]};
function clampSet(k,v){const r=SET_RANGE[k];return r?Math.max(r[0],Math.min(r[1],v)):v;}
function normalize(s){
  s.name=typeof s.name==='string'?s.name:'Projekt';
  const set=Object.assign({moc:22,przedl:32,ks:0.5,cos:0.95,siec:'TN-C-S'},s.set||{});
  const extra={};['zs0','ik0','wlzLen','duObw','duWlz'].forEach(k=>{const v=num(set[k],0);if(v>0)extra[k]=v;});
  s.set={moc:num(set.moc,22)||22,przedl:num(set.przedl,32)||32,ks:clampSet('ks',num(set.ks,0.5)||0.5),cos:clampSet('cos',num(set.cos,0.95)||0.95),siec:oneOf(set.siec,['TN-C-S','TN-S','TT'])};Object.assign(s.set,extra);
  const list=ENC[s.enc.mfr];s.enc={mfr:s.enc.mfr,series:list.some(e=>e.id===s.enc.series)?s.enc.series:list[0].id,rows:s.rows.length};
  const used={};s.rows.forEach(r=>r.forEach(id=>used[id]=1));Object.keys(s.dev).forEach(id=>{if(!used[id])delete s.dev[id];});
  Object.values(s.dev).forEach(d=>{cleanDev(d);if(d.t==='meter'||d.t==='contactor')d.circ=(typeof d.circ==='string'&&own(s.dev,d.circ)&&isCirc(s.dev[d.circ]))?d.circ:null;if(d.t==='mcb'&&!(d.rcd&&s.dev[d.rcd]&&s.dev[d.rcd].t==='rcd'))d.rcd=null;});
  s.wmode=oneOf(s.wmode,['auto','manual']);s.conn=cleanConn(s);
  if(!s.sel||!s.dev[s.sel])s.sel=null;
  s.active=Math.max(0,Math.min(num(s.active,0),s.rows.length-1));
  if(!MFR[s.mfr])s.mfr='hager';
  s.sim=null;                                   /* symulacja zawsze startuje wyłączona */
  s.zoom=Math.max(0.3,Math.min(2,num(s.zoom,1)))||1;  /* powiększenie obudowy (stan widoku) */
  s.tab=oneOf(s.tab,TABS);if(typeof s.q!=='string')s.q='';s.wires=!!s.wires;
  return s;}
/* Licznik id musi być większy od każdego istniejącego 'dN'. */
function fixUid(s,u){let m=num(u,1);Object.keys(s.dev).concat((s.conn||[]).map(w=>w.id)).forEach(id=>{const n=+id.slice(1);if(n>=m)m=n+1;});return m;}
/* Lista projektów: localStorage['rozdz-v2'] = { version:2, cur:<id>, list:[{ id, S, uid, mod }] }. S to zawsze projekt PR.cur. */
const KEY='rozdz-v2',KEY1='rozdz-v1';
const PR={cur:null,list:[],bad:[]};   /* bad: wpisy, których nie udało się wczytać; są zapisywane z powrotem bez zmian */
function pid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function blankS(){return {name:'Nowy projekt',enc:{mfr:'hager',series:'volta',rows:3},set:{moc:22,przedl:32,ks:0.5,cos:0.95,siec:'TN-C-S'},rows:[[],[],[]],dev:{},wmode:'auto',conn:[]};}
/* Cofnij / Ponów: stos migawek danych projektu (DATA_KEYS + uid), limit 50. Zmiany widoku nie tworzą migawek.
   histTag ustawiony przed save() skleja serię zmian tego samego pola (pisanie w polu) w jeden krok. */
const HIST={u:[],r:[],cur:null,t:0,tag:null},HIST_MAX=50;
let histTag=null;
function snap(){const o={uid:uid};DATA_KEYS.forEach(k=>o[k]=S[k]);return JSON.stringify(o);}
function histReset(){HIST.u=[];HIST.r=[];HIST.cur=snap();HIST.t=0;HIST.tag=null;histTag=null;}
function histTrack(){const s=snap(),tag=histTag,now=Date.now();histTag=null;
  if(HIST.cur===null){HIST.cur=s;return;}
  if(s===HIST.cur)return;
  if(!(tag&&tag===HIST.tag&&now-HIST.t<1500)){HIST.u.push(HIST.cur);if(HIST.u.length>HIST_MAX)HIST.u.shift();}
  HIST.cur=s;HIST.r=[];HIST.t=now;HIST.tag=tag;}
function histApply(s){const o=JSON.parse(s);uid=o.uid;DATA_KEYS.forEach(k=>S[k]=o[k]);
  if(S.sel&&!S.dev[S.sel])S.sel=null;if(S.active>=S.rows.length)S.active=S.rows.length-1;
  wireReset();HIST.cur=s;HIST.tag=null;render();}
function undo(){if(!HIST.u.length)return;HIST.r.push(HIST.cur);histApply(HIST.u.pop());toast('Cofnięto zmianę');}
function redo(){if(!HIST.r.length)return;HIST.u.push(HIST.cur);histApply(HIST.r.pop());toast('Ponowiono zmianę');}
let saveFailed=false;                 /* komunikat o nieudanym zapisie pokazujemy raz, nie przy każdym renderze */
function save(){histTrack();try{const cur=PR.list.find(x=>x.id===PR.cur);if(cur){cur.S=S;cur.uid=uid;cur.mod=Date.now();}
  localStorage.setItem(KEY,JSON.stringify({version:2,cur:PR.cur,list:PR.list,bad:PR.bad}));saveFailed=false;}
  catch(e){if(!saveFailed){saveFailed=true;if(typeof toast==='function')toast('Nie udało się zapisać projektu w pamięci przeglądarki. Pobierz kopię przyciskiem „Zapisz projekt”.',8000,true);}}}
function load(){PR.list=[];PR.cur=null;PR.bad=[];
  try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&Array.isArray(j.list)){const ok=x=>x&&typeof x.id==='string'&&valid(x.S);
    PR.list=j.list.filter(ok);PR.bad=(Array.isArray(j.bad)?j.bad:[]).concat(j.list.filter(x=>!ok(x)));PR.cur=j.cur;}}catch(e){}
  if(!PR.list.length){/* migracja z wersji jednoprojektowej (klucz rozdz-v1) */
    try{const j=JSON.parse(localStorage.getItem(KEY1));if(j&&valid(j.S)){PR.list=[{id:pid(),S:j.S,uid:j.uid}];localStorage.removeItem(KEY1);}}catch(e){}}
  if(!PR.list.length)return false;
  const cur=PR.list.find(x=>x.id===PR.cur)||PR.list[0];PR.cur=cur.id;S=normalize(cur.S);uid=fixUid(S,cur.uid);return true;}

/* ---------- calculations ---------- */
function designations(){const cnt={},map={};S.rows.forEach(r=>r.forEach(id=>{const d=S.dev[id];const pf=PREFIX[d.t];cnt[pf]=(cnt[pf]||0)+1;map[id]='-'+pf+cnt[pf];}));return map;}
function ib(d){if(!isCirc(d))return 0;const P=+d.c.P||0,cos=+S.set.cos||0.95;return is3(d)?P*1000/(Math.sqrt(3)*400*cos):P*1000/(230*cos);}
function iz(d){const t=is3(d)?IZ3:IZ2;return t[d.c.cable]||0;}
/* ---------- spadki napięcia, pętla zwarcia, prądy zwarciowe ----------
   Uproszczenia: tylko rezystancja przewodów miedzianych (γ = 56 m/(Ω·mm²)), bez reaktancji (dopuszczalne do ok. 35 mm²);
   pętla zwarcia liczona z rezystancją × 1,25 (nagrzanie przewodu); przewód ochronny o przekroju fazowego;
   spadek napięcia przy cos φ ≈ 1. Dane sieci (Zs i Ik w złączu, długość WLZ) podaje użytkownik w zakładce Bilans. */
const SET_DEF={moc:22,przedl:32,ks:0.5,cos:0.95,siec:'TN-C-S',zs0:0.3,ik0:6,wlzLen:15,duObw:3,duWlz:0.5};
const sv=k=>(S.set[k]!=null&&S.set[k]!=='')?S.set[k]:SET_DEF[k];   /* ustawienie zasilania z wartością domyślną (starsze projekty nie mają nowych pól) */
const GAMMA=56,KT=1.25,TRIP={B:5,C:10,D:20};                          /* TRIP: górna krotność In członu zwarciowego wg charakterystyki */
/* Wielkości w rozdzielnicy: zsB pętla L–PE [Ω], ik1B prąd zwarcia jednofazowego [A], ikB prąd zwarcia trójfazowego [kA], duWlz spadek w WLZ [%]. */
function netCalc(){const Sw=wlzMm(),Lw=+sv('wlzLen'),T=totals();
  const zsB=+sv('zs0')+KT*2*Lw/(GAMMA*Sw),zk=400/(Math.sqrt(3)*sv('ik0')*1000)+Lw/(GAMMA*Sw);
  return {zsB,ik1B:230/zsB,ikB:400/(Math.sqrt(3)*zk)/1000,duWlz:100*T.Pd*1000*Lw/(GAMMA*Sw*160000)};}
/* Obwód (opcjonalnie dla innego przekroju mm): du spadek [%], zs pętla na końcu [Ω], ik1 prąd zwarcia [A], ia próg wyzwalania [A], trip: czy Zs·Ia ≤ U0. */
function circCalc(d,mm){const n=netCalc(),s=mm||+d.c.cable,L=+clen(d)||0,P=(+d.c.P||0)*1000;
  const du=is3(d)?100*P*L/(GAMMA*s*160000):200*P*L/(GAMMA*s*52900),zs=n.zsB+KT*2*L/(GAMMA*s),ia=(TRIP[d.p.curve]||5)*d.p.In;
  return {du,zs,ik1:230/zs,ia,zsMax:230/ia,trip:zs*ia<=230};}
function protRcd(d){if(d.t==='rcbo')return d;if(d.t==='mcb'&&d.rcd&&S.dev[d.rcd])return S.dev[d.rcd];return null;}
function phases(d){return is3(d)?['L1','L2','L3']:[d.c.ph];}
function phaseLoads(filter){const L={L1:0,L2:0,L3:0};Object.values(S.dev).forEach(d=>{if(!isCirc(d)||(filter&&!filter(d)))return;const i=ib(d);phases(d).forEach(p=>L[p]+=i);});return L;}
function rowUse(i){return S.rows[i].reduce((a,id)=>a+width(S.dev[id]),0);}
function totals(){let P=0;Object.values(S.dev).forEach(d=>{if(isCirc(d))P+=+d.c.P||0;});const Pd=P*S.set.ks;const Ibm=Pd*1000/(Math.sqrt(3)*400*S.set.cos);
  const e=enc(),cap=e.mpr*S.enc.rows;let used=0;S.rows.forEach((r,i)=>used+=rowUse(i));return {P,Pd,Ibm,cap,used};}

/* ---------- naprawy proponowane przez kontrolę ---------- */
/* Uwaga z checks() może mieć pole fix = { l: etykieta przycisku, f: funkcja zmieniająca S }. Po f() wołany jest render(),
   więc każda naprawa jest jednym krokiem cofania. */
const STD_IN=[6,10,13,16,20,25,32,40,50,63],STD_MM=[1.5,2.5,4,6,10,16],SW_IN=[32,40,63,80,100,125];
/* Najmniejszy przekrój kabla obwodu, dla którego Iz ≥ In; null, gdy tabela go nie zawiera. */
function cableFor(d,In){const t=is3(d)?IZ3:IZ2;return STD_MM.find(m=>t[m]>=In)||null;}
/* Rząd, w którym zmieści się aparat o szerokości w: najpierw wskazany, potem kolejne; -1, gdy brak miejsca. */
function rowWithRoom(w,pref){const m=enc().mpr,r=[pref].concat(S.rows.map((_,i)=>i)).find(i=>i>=0&&i<S.rows.length&&rowUse(i)+w<=m);return r==null?-1:r;}
function putDev(d,row,idx){S.dev[d.id]=d;S.rows[row].splice(idx==null?S.rows[row].length:idx,0,d.id);return d;}
function devRow(id){return S.rows.findIndex(r=>r.indexOf(id)>=0);}
function checks(){const out=[],D=designations(),e=enc(),T=totals(),devs=Object.values(S.dev);
  const add=(sev,msg,ref,id,fix)=>out.push({sev,msg,ref,id,fix});
  S.rows.forEach((r,i)=>{const u=rowUse(i);if(u>e.mpr)add('crit',`<b>Rząd ${i+1}</b> jest przepełniony: ${fmt(u)} z ${e.mpr} modułów.`,'Przenieś aparaty do innego rzędu lub wybierz większą obudowę.');
    const ms=new Set(r.map(id=>S.dev[id].m).filter(Boolean));if(ms.size>1)add('info',`<b>Rząd ${i+1}</b> łączy aparaty kilku producentów.`,'Sprawdź, czy szyna grzebieniowa pasuje do wszystkich aparatów w rzędzie.');});
  if(!devs.length){add('info','Obudowa jest pusta. Dodaj aparaty z biblioteki.');return out;}
  const sws=devs.filter(d=>d.t==='sw');
  if(!sws.length){const In=SW_IN.find(x=>x>=S.set.przedl)||125,row=rowWithRoom(3,0);
    add('warn','Brak <b>rozłącznika głównego</b>.','Rozdzielnica powinna mieć łącznik odłączający całą instalację (PN-HD 60364-5-53).',undefined,
      row<0?undefined:{l:'Dodaj rozłącznik '+In+' A 3P',f:()=>{putDev(newDev('sw',S.mfr,{In:In,poles:3},null,'Rozłącznik główny'),row,0);}});}
  if(!devs.some(d=>d.t==='spd')){const row=rowWithRoom(4,0);
    add('warn','Brak <b>ogranicznika przepięć</b>.','PN-HD 60364-4-443 wymaga oceny ryzyka; w budynkach mieszkalnych SPD stosuje się standardowo.',undefined,
      row<0?undefined:{l:'Dodaj ogranicznik T1+T2 3P+N',f:()=>{const ids=S.rows[row];let at=0;ids.forEach((id,k)=>{if(S.dev[id].t==='sw')at=k+1;});putDev(newDev('spd',S.mfr,{cls:'T1+T2',sys:'3P+N'},null,'Ochrona przepięciowa'),row,at);}});}
  const nB=netCalc();
  devs.filter(isCirc).forEach(d=>{const i=ib(d),z=iz(d),n=D[d.id]+' '+esc(d.name);
    if(i>d.p.In){const In2=STD_IN.find(x=>x>=i),mm2=In2?cableFor(d,In2):null,up=mm2&&mm2>d.c.cable;
      add('crit',`<b>${n}</b>: prąd obciążenia ${fmt(i)} A przekracza In ${d.p.In} A.`,'Warunek Ib ≤ In. Zwiększ prąd zabezpieczenia lub podziel obwód.',d.id,
        mm2?{l:'Ustaw In '+In2+' A'+(up?' i przewód '+fmt(mm2)+' mm²':''),f:()=>{d.p.In=In2;if(up)d.c.cable=mm2;}}:undefined);}
    if(z&&d.p.In>z){const mm2=cableFor(d,d.p.In);
      add('crit',`<b>${n}</b>: In ${d.p.In} A > Iz ${fmt(z)} A przewodu ${fmt(d.c.cable)} mm².`,'Warunek In ≤ Iz. Zwiększ przekrój przewodu lub zmniejsz In.',d.id,
        mm2?{l:'Zwiększ przewód do '+fmt(mm2)+' mm²',f:()=>{d.c.cable=mm2;}}:undefined);}
    const r=protRcd(d);
    if(NEED30.includes(d.c.kind)&&(!r||r.p.idn>30)){let fix;
      if(d.t==='rcbo')fix={l:'Ustaw IΔn 30 mA',f:()=>{d.p.idn=30;}};
      else{/* istniejąca różnicówka 30 mA pasująca do obwodu (4P albo 2P na tej samej fazie), najmniej obciążona */
        const cnt=id=>devs.filter(m=>m.t==='mcb'&&m.rcd===id).length;
        const ok=devs.filter(x=>x.t==='rcd'&&x.p.idn<=30&&(x.p.poles==4||(!is3(d)&&rcdPh(x)===d.c.ph))).sort((a,b)=>cnt(a.id)-cnt(b.id))[0];
        if(ok)fix={l:'Przypisz do '+D[ok.id],f:()=>{d.rcd=ok.id;}};
        else{const here=devRow(d.id),row=rowWithRoom(4,here);
          if(row>=0)fix={l:'Dodaj różnicówkę 40 A / 30 mA typ A',f:()=>{const nd=newDev('rcd',d.m,{In:40,poles:4,idn:30,kind:'A',sel:false},null,'Różnicówka');
            putDev(nd,row,row===here?S.rows[row].indexOf(d.id):undefined);d.rcd=nd.id;}};}}
      add('crit',`<b>${n}</b> (${KINDS[d.c.kind]}) nie ma ochrony różnicowoprądowej 30 mA.`,'Wymóg ochrony uzupełniającej, PN-HD 60364-4-41 p. 411.3.3 oraz części 7xx.',d.id,fix);}
    if(d.c.kind==='ev'&&r&&r.p.kind!=='B')add('warn',`<b>${n}</b>: ładowarka EV za RCD typu ${r.p.kind}.`,'PN-HD 60364-7-722: RCD typu B albo typ A z modułem RDC-DD 6 mA DC w ładowarce.',d.id,{l:'Zmień typ '+D[r.id]+' na B',f:()=>{r.p.kind='B';}});
    if(r&&r.p.kind==='AC')add('info',`<b>${n}</b> chroniony RCD typu AC.`,'Dla odbiorników z elektroniką zalecany jest typ A lub F.',d.id,{l:'Zmień typ '+D[r.id]+' na A',f:()=>{r.p.kind='A';}});
    /* spadek napięcia, samoczynne wyłączenie, zdolność zwarciowa */
    const cc=circCalc(d),lim=+sv('duObw'),bigger=test=>{const m=STD_MM.find(x=>x>d.c.cable&&test(circCalc(d,x)));return m?{l:'Zwiększ przewód do '+fmt(m)+' mm²',f:()=>{d.c.cable=m;}}:undefined;};
    if(cc.du>lim)add('warn',`<b>${n}</b>: spadek napięcia ${fmt(cc.du,2)}% przekracza ${fmt(lim)}% (${fmt(clen(d))} m, ${fmt(d.c.cable)} mm², ${fmt(+d.c.P)} kW).`,'PN-HD 60364-5-52 zał. G. Zwiększ przekrój albo skróć obwód.',d.id,bigger(x=>x.du<=lim));
    if(S.set.siec==='TT'){if(!r)add('crit',`<b>${n}</b>: w układzie TT samoczynne wyłączenie zasilania wymaga wyłącznika różnicowoprądowego.`,'PN-HD 60364-4-41 p. 411.5 (warunek RA·IΔn ≤ 50 V).',d.id);}
    else if(!cc.trip){const txt=`<b>${n}</b>: pętla zwarcia ${fmt(cc.zs,2)} Ω daje prąd zwarcia ${fmt(cc.ik1,0)} A, mniej niż próg wyzwalania ${fmt(cc.ia,0)} A (${d.p.curve}${d.p.In}).`,fix=bigger(x=>x.trip);
      if(r)add('warn',txt+' Wyłączenie przy zwarciu do PE zapewnia '+D[r.id]+'.','PN-HD 60364-4-41 p. 411.4. Zwarcie L–N nie zostanie wyłączone bezzwłocznie: skróć obwód, zwiększ przekrój albo zmień charakterystykę.',d.id,fix);
      else add('crit',txt,'Warunek samoczynnego wyłączenia Zs·Ia ≤ U0 nie jest spełniony (PN-HD 60364-4-41 p. 411.4).',d.id,fix);}
    const icn=+d.p.icn||6;
    if(icn<nB.ikB)add('crit',`<b>${n}</b>: zdolność zwarciowa ${icn} kA jest mniejsza niż prąd zwarciowy w rozdzielnicy ${fmt(nB.ikB,1)} kA.`,'Warunek Icn ≥ Ik (PN-HD 60364-4-43 p. 434.5.1).',d.id,nB.ikB<=10?{l:'Ustaw Icn 10 kA',f:()=>{d.p.icn=10;}}:undefined);});
  if(nB.duWlz>+sv('duWlz'))add('warn',`Spadek napięcia w WLZ ${fmt(nB.duWlz,2)}% przekracza ${fmt(+sv('duWlz'))}% (${fmt(+sv('wlzLen'))} m, ${fmt(wlzMm())} mm², moc szczytowa ${fmt(T.Pd)} kW).`,'Zwiększ przekrój WLZ (większe zabezpieczenie przedlicznikowe dobiera większy przekrój) albo zmniejsz moc szczytową.');
  devs.filter(d=>d.t==='rcd').forEach(r=>{const L=phaseLoads(d=>d.t==='mcb'&&d.rcd===r.id);const mx=Math.max(L.L1,L.L2,L.L3)*S.set.ks;
    const nn=devs.filter(d=>d.t==='mcb'&&d.rcd===r.id).length;
    if(!nn)add('info',`<b>${D[r.id]} ${esc(r.name)}</b> nie ma przypisanych obwodów.`,'Przypisz obwody w panelu aparatu (pole „Ochrona RCD”).',r.id);
    if(mx>r.p.In)add('warn',`<b>${D[r.id]} ${esc(r.name)}</b>: obciążenie szczytowe ${fmt(mx)} A > In ${r.p.In} A.`,'Rozdziel obwody na kilka wyłączników różnicowoprądowych.',r.id);
    if(r.p.poles==2){const ph=rcdPh(r);devs.filter(d=>d.t==='mcb'&&d.rcd===r.id&&!is3(d)&&d.c.ph!==ph).forEach(d=>add('crit',`<b>${D[d.id]} ${esc(d.name)}</b> ma fazę ${d.c.ph}, a ${D[r.id]} 2P podaje fazę ${ph}.`,'Obwody za RCD 2P muszą być na tej samej fazie co różnicówka.',d.id,{l:'Zmień fazę obwodu na '+ph,f:()=>{d.c.ph=ph;}}));}
    if(r.p.poles==2&&devs.some(d=>d.t==='mcb'&&d.rcd===r.id&&is3(d)))add('crit',`<b>${D[r.id]}</b> 2P zasila obwód trójfazowy.`,'Obwody 3F wymagają RCD 4P.',r.id);});
  const maxIn=Math.max(0,...devs.filter(isCirc).map(d=>d.p.In));
  if(maxIn&&maxIn*1.6>S.set.przedl)add('warn',`Zabezpieczenie przedlicznikowe ${S.set.przedl} A może nie być selektywne względem ${maxIn} A w obwodach.`,'Przyjmuje się stosunek prądów co najmniej 1,6 : 1 dla selektywności nadprądowej.');
  sws.forEach(s=>{if(s.p.In<S.set.przedl)add('crit',`<b>${D[s.id]} rozłącznik ${s.p.In} A</b> ma mniejszy prąd niż zabezpieczenie przedlicznikowe ${S.set.przedl} A.`,'In rozłącznika ≥ In zabezpieczenia przed nim.',s.id,{l:'Ustaw In rozłącznika '+(SW_IN.find(x=>x>=S.set.przedl)||125)+' A',f:()=>{s.p.In=SW_IN.find(x=>x>=S.set.przedl)||125;}});});
  if(T.Ibm>S.set.przedl)add('crit',`Prąd szczytowy ${fmt(T.Ibm)} A przekracza zabezpieczenie przedlicznikowe ${S.set.przedl} A.`,'Zmniejsz moc obwodów, sprawdź współczynnik jednoczesności lub wnioskuj o większą moc.');
  if(T.Pd>S.set.moc)add('warn',`Moc szczytowa ${fmt(T.Pd)} kW przekracza moc przyłączeniową ${fmt(S.set.moc)} kW.`,'Zmień warunki przyłączenia u OSD lub ogranicz moc.');
  const L=phaseLoads(),mx=Math.max(L.L1,L.L2,L.L3),mn=Math.min(L.L1,L.L2,L.L3);
  if(mx>5&&(mx-mn)/mx>0.25)add('warn',`Asymetria obciążenia faz ${fmt((mx-mn)/mx*100,0)}% (L1 ${fmt(L.L1)} A, L2 ${fmt(L.L2)} A, L3 ${fmt(L.L3)} A).`,'Użyj „Rozłóż fazy” albo zmień fazy obwodów ręcznie.',undefined,{l:'Rozłóż fazy',f:()=>{balance();}});
  /* prąd szczytowy każdej fazy osobno: średnia z trzech faz (T.Ibm) nie pokazuje przeciążenia jednej z nich */
  ['L1','L2','L3'].forEach(ph=>{const ip=L[ph]*S.set.ks;if(ip>S.set.przedl)add('warn',`Prąd szczytowy fazy ${ph} (${fmt(ip)} A) przekracza zabezpieczenie przedlicznikowe ${S.set.przedl} A.`,'Przenieś obwody jednofazowe na mniej obciążone fazy albo zmniejsz moc.',undefined,{l:'Rozłóż fazy',f:()=>{balance();}});});
  if(T.cap&&(T.cap-T.used)/T.cap<0.2)add('info',`Rezerwa miejsca ${fmt(Math.max(0,T.cap-T.used))} mod. to mniej niż 20%.`,'Zostaw miejsce na rozbudowę instalacji.');
  /* licznik i stycznik w torze obwodu */
  devs.filter(d=>d.t==='meter'||d.t==='contactor').forEach(x=>{const cd=S.dev[x.circ],nx='<b>'+D[x.id]+' '+esc(x.name)+'</b>';
    if(!cd||!isCirc(cd)){add('info',nx+' nie jest w torze żadnego obwodu.','W panelu aparatu wybierz obwód w polu „W torze obwodu”; wtedy aparat zostanie okablowany.',x.id);return;}
    if(x.t==='contactor'){
      if(x.p.In<cd.p.In)add('crit',nx+': prąd znamionowy '+x.p.In+' A jest mniejszy niż zabezpieczenie obwodu '+D[cd.id]+' ('+cd.p.In+' A).','Stycznik musi wytrzymać prąd, który przepuści zabezpieczenie przed nim.',x.id);
      if(is3(cd)&&x.p.poles<3)add('crit',nx+' ('+x.p.poles+'NO) nie rozłączy wszystkich faz obwodu trójfazowego '+D[cd.id]+'.','Zastosuj stycznik 4NO.',x.id,{l:'Zmień na stycznik 4NO',f:()=>{x.p.poles=4;}});
      if(x.p.ctl==='relay'&&!devs.some(d=>d.t==='relay'))add('warn',nx+' ma być sterowany przekaźnikiem kontroli faz, ale w rozdzielnicy go nie ma.','Dodaj przekaźnik kontroli faz albo zmień sterowanie cewki.',x.id);}
    if(x.t==='meter'&&is3(cd)&&x.p.ph!=3)add('crit',nx+' jest jednofazowy, a obwód '+D[cd.id]+' jest trójfazowy.','Zastosuj licznik trójfazowy.',x.id,{l:'Zmień na licznik 3-fazowy',f:()=>{x.p.ph=3;}});});
  wireCheck().out.forEach(x=>out.push(x));
  termIssues().forEach(x=>out.push(x));
  return out;}

