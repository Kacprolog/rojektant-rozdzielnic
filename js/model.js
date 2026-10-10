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
  case 'rcbo':return `${TNAME.rcbo} ${p.curve}${p.In} / ${p.idn} mA, ${p.poles==2?'1P+N':'3P+N'}, typ ${p.kind}`;
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
  case 'rcbo':r.push(['Norma','PN-EN 61009-1'],['Prąd In',p.In+' A'],['Charakterystyka',p.curve],['IΔn',p.idn+' mA, typ '+p.kind],['Zdolność Icn','6 kA'],['Bieguny',p.poles==2?'1P+N':'3P+N']);break;
  case 'sw':r.push(['Norma','PN-EN 60947-3'],['Napięcie Ue','400 V AC'],['Prąd In',p.In+' A'],['Kategoria','AC-22A'],['Bieguny',p.poles+'P']);break;
  case 'spd':r.push(['Norma','PN-EN 61643-11'],['Typ',p.cls],['Układ',p.sys],['Uc','275 V AC'],['In (8/20)','20 kA / biegun'],...(p.cls==='T1+T2'?[['Iimp (10/350)','12,5 kA / biegun']]:[]),['Up','≤ 1,5 kV'],['Sygnalizacja','okienko stanu wkładki']);break;
  case 'meter':r.push(['Dyrektywa','MID'+(p.mid?' (legalizacja)':' – brak')],['Klasa dokładności','B (1)'],['Zasilanie',p.ph==3?'3 × 230/400 V':'230 V'],['Prąd ref. (maks.)',p.ph==3?'5 (80) A':'5 (45) A'],['Pomiar','bezpośredni']);break;
  case 'contactor':r.push(['Norma','PN-EN 61095'],['Prąd AC-7a',p.In+' A'],['Styki',p.poles+'NO'],['Cewka','230 V AC, praca cicha']);break;
  case 'lamp':r.push(['Napięcie','3 × 230 V AC'],['Źródło','LED']);break;
  case 'socket':r.push(['Norma','PN-IEC 60884-1'],['Znamionowo','16 A 250 V'],['Typ','2P+Z (francuskie)']);break;
  case 'timer':r.push(['Zasilanie','12–240 V AC/DC'],['Funkcje','opóźnione zał./wył., cykl, impuls'],['Zakres','0,1 s – 100 h']);break;
  case 'psu':r.push(['Wejście','100–240 V AC'],['Wyjście','24 V DC, '+fmt(p.W/24,2)+' A'],['Moc',p.W+' W']);break;
  case 'relay':r.push(['Kontrola','zanik, kolejność, asymetria faz'],['Napięcie','3 × 400 V AC'],['Wyjście','1 × CO, 5 A']);break;}
  r.push(['Szerokość',fmt(width(d))+' mod. ('+fmt(width(d)*18)+' mm)']);return r;}

/* ---------- state ---------- */
function newDev(t,m,p,c,name){const d={id:'d'+(uid++),t,m,p:{...p},name:name||TNAME[t]};
  if(t==='mcb'||t==='rcbo'){d.c={kind:'gniazda',P:1,cable:2.5,ph:'L1',len:15,...(c||{})};}
  if(t==='mcb')d.rcd=null;return d;}
function enc(){return ENC[S.enc.mfr].find(e=>e.id===S.enc.series)||ENC[S.enc.mfr][0];}
function sample(){
  uid=1;S={name:'Dom jednorodzinny – rozdzielnica RG',enc:{mfr:'hager',series:'volta',rows:3},
    set:{moc:22,przedl:32,ks:0.5,cos:0.95,siec:'TN-C-S'},rows:[[],[],[]],dev:{},wmode:'auto',conn:[],sel:null,active:1,mfr:'hager',tab:'aparat',q:''};
  const add=(r,d)=>{S.dev[d.id]=d;S.rows[r].push(d.id);return d;};
  const m='hager';
  add(0,newDev('sw',m,{In:63,poles:3},null,'Rozłącznik główny'));
  add(0,newDev('spd',m,{cls:'T1+T2',sys:'3P+N'},null,'Ochrona przepięciowa'));
  add(0,newDev('lamp',m,{},null,'Kontrolki faz'));
  add(0,newDev('meter',m,{ph:3,mid:true},null,'Podlicznik pompy ciepła'));
  add(0,newDev('relay',m,{},null,'Kontrola faz PC'));
  add(0,newDev('contactor',m,{In:25,poles:2},null,'Bojler – taryfa G12'));
  const r1=add(1,newDev('rcd',m,{In:40,poles:4,idn:30,kind:'A',sel:false},null,'RCD obwody ogólne'));
  const c1=[['B',10,'oswietlenie',0.4,1.5,'L1','Oświetlenie parter'],['B',10,'oswietlenie',0.4,1.5,'L2','Oświetlenie piętro'],
    ['B',16,'gniazda',2,2.5,'L3','Gniazda salon'],['B',16,'kuchnia',2,2.5,'L1','Gniazda kuchnia'],['B',16,'lazienka',2,2.5,'L2','Łazienka'],
    ['B',16,'kuchnia',2.2,2.5,'L3','Pralka'],['B',16,'kuchnia',2,2.5,'L2','Zmywarka'],['B',16,'gniazda',1.8,2.5,'L1','Gniazda pokoje piętro']];
  const LEN=[22,28,14,9,12,8,9,26];
  c1.forEach(([cu,In,k,P,cab,ph,nm],ix)=>{const d=newDev('mcb',m,{In,curve:cu,poles:1,icn:6},{kind:k,P,cable:cab,ph,len:LEN[ix]},nm);d.rcd=r1.id;add(1,d);});
  const r2=add(2,newDev('rcd',m,{In:40,poles:4,idn:30,kind:'B',sel:false},null,'RCD ładowarka EV'));
  let d=newDev('mcb',m,{In:20,curve:'C',poles:3,icn:6},{kind:'ev',P:11,cable:6,len:24},'Ładowarka EV 11 kW');d.rcd=r2.id;add(2,d);
  d=newDev('mcb',m,{In:16,curve:'B',poles:3,icn:6},{kind:'plyta',P:7.2,cable:2.5,len:10},'Płyta indukcyjna');d.rcd=r1.id;add(2,d);
  add(2,newDev('rcbo',m,{In:16,curve:'B',poles:2,idn:30,kind:'A'},{kind:'zewn',P:1.5,cable:2.5,ph:'L3',len:30},'Gniazda garaż / ogród'));
  add(2,newDev('mcb',m,{In:16,curve:'B',poles:1,icn:6},{kind:'bojler',P:2,cable:2.5,ph:'L3'},'Podgrzewacz wody'));
  add(2,newDev('mcb',m,{In:16,curve:'C',poles:3,icn:6},{kind:'pc',P:5,cable:2.5,len:18},'Pompa ciepła'));
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
  if(isCirc(d))p.curve=oneOf(p.curve,['B','C','D']);
  if(d.t==='rcd'||d.t==='rcbo')p.kind=oneOf(p.kind,['A','AC','F','B']);
  if(d.t==='rcd')p.sel=!!p.sel;
  if(d.t==='meter')p.mid=!!p.mid;
  if(d.t==='spd'){p.cls=oneOf(p.cls,['T1+T2','T2']);p.sys=oneOf(p.sys,['3P+N','1P+N']);}
  if(isCirc(d)){const c=d.c;c.kind=KINDS[c.kind]?c.kind:'inne';c.P=Math.max(0,num(c.P,0));c.cable=num(c.cable,2.5);c.ph=oneOf(c.ph,['L1','L2','L3']);if(c.len!=null)c.len=Math.max(0,num(c.len,15));}}
/* Uzupełnia brakujące pola wartościami domyślnymi (zgodność wstecz) i porządkuje odwołania. Wymaga valid(s). */
function cleanEp(s,e){if(!e||typeof e!=='object')return null;
  if(e.k==='dev')return own(s.dev,e.id)&&(e.side==='top'||e.side==='bot')&&typeof e.i==='number'&&e.i>=0&&e.i<8?{k:'dev',id:e.id,side:e.side,i:Math.floor(e.i)}:null;
  if(e.k==='bar'){const b=String(e.bar);return b==='PE'||b==='N'||(b.slice(0,2)==='N:'&&own(s.dev,b.slice(2)))?{k:'bar',bar:b}:null;}
  if(e.k==='wlz')return ['L1','L2','L3','N','PE'].indexOf(e.ph)>=0?{k:'wlz',ph:e.ph}:null;
  return null;}
function cleanConn(s){const out=[],seen={};(Array.isArray(s.conn)?s.conn:[]).forEach(w=>{if(!w||!/^w\d+$/.test(w.id)||seen[w.id])return;const a=cleanEp(s,w.a),b=cleanEp(s,w.b);if(a&&b){seen[w.id]=1;out.push({id:w.id,a:a,b:b});}});return out;}
function normalize(s){
  s.name=typeof s.name==='string'?s.name:'Projekt';
  const set=Object.assign({moc:22,przedl:32,ks:0.5,cos:0.95,siec:'TN-C-S'},s.set||{});
  s.set={moc:num(set.moc,22)||22,przedl:num(set.przedl,32)||32,ks:num(set.ks,0.5)||0.5,cos:num(set.cos,0.95)||0.95,siec:oneOf(set.siec,['TN-C-S','TN-S','TT'])};
  const list=ENC[s.enc.mfr];s.enc={mfr:s.enc.mfr,series:list.some(e=>e.id===s.enc.series)?s.enc.series:list[0].id,rows:s.rows.length};
  const used={};s.rows.forEach(r=>r.forEach(id=>used[id]=1));Object.keys(s.dev).forEach(id=>{if(!used[id])delete s.dev[id];});
  Object.values(s.dev).forEach(d=>{cleanDev(d);if(d.t==='mcb'&&!(d.rcd&&s.dev[d.rcd]&&s.dev[d.rcd].t==='rcd'))d.rcd=null;});
  s.wmode=oneOf(s.wmode,['auto','manual']);s.conn=cleanConn(s);
  if(!s.sel||!s.dev[s.sel])s.sel=null;
  s.active=Math.max(0,Math.min(num(s.active,0),s.rows.length-1));
  if(!MFR[s.mfr])s.mfr='hager';
  s.tab=oneOf(s.tab,TABS);if(typeof s.q!=='string')s.q='';s.wires=!!s.wires;
  return s;}
/* Licznik id musi być większy od każdego istniejącego 'dN'. */
function fixUid(s,u){let m=num(u,1);Object.keys(s.dev).concat((s.conn||[]).map(w=>w.id)).forEach(id=>{const n=+id.slice(1);if(n>=m)m=n+1;});return m;}
/* Lista projektów: localStorage['rozdz-v2'] = { version:2, cur:<id>, list:[{ id, S, uid, mod }] }. S to zawsze projekt PR.cur. */
const KEY='rozdz-v2',KEY1='rozdz-v1';
const PR={cur:null,list:[]};
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
  wirePick=wireSel=null;HIST.cur=s;HIST.tag=null;render();}
function undo(){if(!HIST.u.length)return;HIST.r.push(HIST.cur);histApply(HIST.u.pop());toast('Cofnięto zmianę');}
function redo(){if(!HIST.r.length)return;HIST.u.push(HIST.cur);histApply(HIST.r.pop());toast('Ponowiono zmianę');}
function save(){histTrack();try{const cur=PR.list.find(x=>x.id===PR.cur);if(cur){cur.S=S;cur.uid=uid;cur.mod=Date.now();}
  localStorage.setItem(KEY,JSON.stringify({version:2,cur:PR.cur,list:PR.list}));}catch(e){}}
function load(){PR.list=[];PR.cur=null;
  try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&Array.isArray(j.list)){PR.list=j.list.filter(x=>x&&typeof x.id==='string'&&valid(x.S));PR.cur=j.cur;}}catch(e){}
  if(!PR.list.length){/* migracja z wersji jednoprojektowej (klucz rozdz-v1) */
    try{const j=JSON.parse(localStorage.getItem(KEY1));if(j&&valid(j.S)){PR.list=[{id:pid(),S:j.S,uid:j.uid}];localStorage.removeItem(KEY1);}}catch(e){}}
  if(!PR.list.length)return false;
  const cur=PR.list.find(x=>x.id===PR.cur)||PR.list[0];PR.cur=cur.id;S=normalize(cur.S);uid=fixUid(S,cur.uid);return true;}

/* ---------- calculations ---------- */
function designations(){const cnt={},map={};S.rows.forEach(r=>r.forEach(id=>{const d=S.dev[id];const pf=PREFIX[d.t];cnt[pf]=(cnt[pf]||0)+1;map[id]='-'+pf+cnt[pf];}));return map;}
function ib(d){if(!isCirc(d))return 0;const P=+d.c.P||0,cos=+S.set.cos||0.95;return is3(d)?P*1000/(Math.sqrt(3)*400*cos):P*1000/(230*cos);}
function iz(d){const t=is3(d)?IZ3:IZ2;return t[d.c.cable]||0;}
function protRcd(d){if(d.t==='rcbo')return d;if(d.t==='mcb'&&d.rcd&&S.dev[d.rcd])return S.dev[d.rcd];return null;}
function phases(d){return is3(d)?['L1','L2','L3']:[d.c.ph];}
function phaseLoads(filter){const L={L1:0,L2:0,L3:0};Object.values(S.dev).forEach(d=>{if(!isCirc(d)||(filter&&!filter(d)))return;const i=ib(d);phases(d).forEach(p=>L[p]+=i);});return L;}
function rowUse(i){return S.rows[i].reduce((a,id)=>a+width(S.dev[id]),0);}
function totals(){let P=0;Object.values(S.dev).forEach(d=>{if(isCirc(d))P+=+d.c.P||0;});const Pd=P*S.set.ks;const Ibm=Pd*1000/(Math.sqrt(3)*400*S.set.cos);
  const e=enc(),cap=e.mpr*S.enc.rows;let used=0;S.rows.forEach((r,i)=>used+=rowUse(i));return {P,Pd,Ibm,cap,used};}

function checks(){const out=[],D=designations(),e=enc(),T=totals(),devs=Object.values(S.dev);
  const add=(sev,msg,ref,id)=>out.push({sev,msg,ref,id});
  S.rows.forEach((r,i)=>{const u=rowUse(i);if(u>e.mpr)add('crit',`<b>Rząd ${i+1}</b> jest przepełniony: ${fmt(u)} z ${e.mpr} modułów.`,'Przenieś aparaty do innego rzędu lub wybierz większą obudowę.');
    const ms=new Set(r.map(id=>S.dev[id].m).filter(Boolean));if(ms.size>1)add('info',`<b>Rząd ${i+1}</b> łączy aparaty kilku producentów.`,'Sprawdź, czy szyna grzebieniowa pasuje do wszystkich aparatów w rzędzie.');});
  if(!devs.length){add('info','Obudowa jest pusta. Dodaj aparaty z biblioteki.');return out;}
  const sws=devs.filter(d=>d.t==='sw');
  if(!sws.length)add('warn','Brak <b>rozłącznika głównego</b>.','Rozdzielnica powinna mieć łącznik odłączający całą instalację (PN-HD 60364-5-53).');
  if(!devs.some(d=>d.t==='spd'))add('warn','Brak <b>ogranicznika przepięć</b>.','PN-HD 60364-4-443 wymaga oceny ryzyka; w budynkach mieszkalnych SPD stosuje się standardowo.');
  devs.filter(isCirc).forEach(d=>{const i=ib(d),z=iz(d),n=D[d.id]+' '+esc(d.name);
    if(i>d.p.In)add('crit',`<b>${n}</b>: prąd obciążenia ${fmt(i)} A przekracza In ${d.p.In} A.`,'Warunek Ib ≤ In. Zwiększ prąd zabezpieczenia lub podziel obwód.',d.id);
    if(z&&d.p.In>z)add('crit',`<b>${n}</b>: In ${d.p.In} A > Iz ${fmt(z)} A przewodu ${fmt(d.c.cable)} mm².`,'Warunek In ≤ Iz. Zwiększ przekrój przewodu lub zmniejsz In.',d.id);
    const r=protRcd(d);
    if(NEED30.includes(d.c.kind)&&(!r||r.p.idn>30))add('crit',`<b>${n}</b> (${KINDS[d.c.kind]}) nie ma ochrony różnicowoprądowej 30 mA.`,'Wymóg ochrony uzupełniającej, PN-HD 60364-4-41 p. 411.3.3 oraz części 7xx.',d.id);
    if(d.c.kind==='ev'&&r&&r.p.kind!=='B')add('warn',`<b>${n}</b>: ładowarka EV za RCD typu ${r.p.kind}.`,'PN-HD 60364-7-722: RCD typu B albo typ A z modułem RDC-DD 6 mA DC w ładowarce.',d.id);
    if(r&&r.p.kind==='AC')add('info',`<b>${n}</b> chroniony RCD typu AC.`,'Dla odbiorników z elektroniką zalecany jest typ A lub F.',d.id);});
  devs.filter(d=>d.t==='rcd').forEach(r=>{const L=phaseLoads(d=>d.t==='mcb'&&d.rcd===r.id);const mx=Math.max(L.L1,L.L2,L.L3)*S.set.ks;
    const nn=devs.filter(d=>d.t==='mcb'&&d.rcd===r.id).length;
    if(!nn)add('info',`<b>${D[r.id]} ${esc(r.name)}</b> nie ma przypisanych obwodów.`,'Przypisz obwody w panelu aparatu (pole „Ochrona RCD”).',r.id);
    if(mx>r.p.In)add('warn',`<b>${D[r.id]} ${esc(r.name)}</b>: obciążenie szczytowe ${fmt(mx)} A > In ${r.p.In} A.`,'Rozdziel obwody na kilka wyłączników różnicowoprądowych.',r.id);
    if(r.p.poles==2){const ph=rcdPh(r);devs.filter(d=>d.t==='mcb'&&d.rcd===r.id&&!is3(d)&&d.c.ph!==ph).forEach(d=>add('crit',`<b>${D[d.id]} ${esc(d.name)}</b> ma fazę ${d.c.ph}, a ${D[r.id]} 2P podaje fazę ${ph}.`,'Obwody za RCD 2P muszą być na tej samej fazie co różnicówka.',d.id));}
    if(r.p.poles==2&&devs.some(d=>d.t==='mcb'&&d.rcd===r.id&&is3(d)))add('crit',`<b>${D[r.id]}</b> 2P zasila obwód trójfazowy.`,'Obwody 3F wymagają RCD 4P.',r.id);});
  const maxIn=Math.max(0,...devs.filter(isCirc).map(d=>d.p.In));
  if(maxIn&&maxIn*1.6>S.set.przedl)add('warn',`Zabezpieczenie przedlicznikowe ${S.set.przedl} A może nie być selektywne względem ${maxIn} A w obwodach.`,'Przyjmuje się stosunek prądów co najmniej 1,6 : 1 dla selektywności nadprądowej.');
  sws.forEach(s=>{if(s.p.In<S.set.przedl)add('crit',`<b>${D[s.id]} rozłącznik ${s.p.In} A</b> ma mniejszy prąd niż zabezpieczenie przedlicznikowe ${S.set.przedl} A.`,'In rozłącznika ≥ In zabezpieczenia przed nim.',s.id);});
  if(T.Ibm>S.set.przedl)add('crit',`Prąd szczytowy ${fmt(T.Ibm)} A przekracza zabezpieczenie przedlicznikowe ${S.set.przedl} A.`,'Zmniejsz moc obwodów, sprawdź współczynnik jednoczesności lub wnioskuj o większą moc.');
  if(T.Pd>S.set.moc)add('warn',`Moc szczytowa ${fmt(T.Pd)} kW przekracza moc przyłączeniową ${fmt(S.set.moc)} kW.`,'Zmień warunki przyłączenia u OSD lub ogranicz moc.');
  const L=phaseLoads(),mx=Math.max(L.L1,L.L2,L.L3),mn=Math.min(L.L1,L.L2,L.L3);
  if(mx>5&&(mx-mn)/mx>0.25)add('warn',`Asymetria obciążenia faz ${fmt((mx-mn)/mx*100,0)}% (L1 ${fmt(L.L1)} A, L2 ${fmt(L.L2)} A, L3 ${fmt(L.L3)} A).`,'Użyj „Rozłóż fazy” albo zmień fazy obwodów ręcznie.');
  if(T.cap&&(T.cap-T.used)/T.cap<0.2)add('info',`Rezerwa miejsca ${fmt(Math.max(0,T.cap-T.used))} mod. to mniej niż 20%.`,'Zostaw miejsce na rozbudowę instalacji.');
  wireCheck().out.forEach(x=>out.push(x));
  return out;}

