/* Okablowanie: zaciski, lista połączeń, routing przewodów (SVG), materiały — Projektant Rozdzielnic. Skrypt klasyczny (bez modułów ES), ładowany w kolejności z index.html. */
/* ---------- okablowanie ---------- */
const PHN={L1:'L1 brązowy',L2:'L2 czarny',L3:'L3 szary',N:'N niebieski',PE:'PE zielono-żółty'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rcdPh(r){const m=S.rows.flat().map(id=>S.dev[id]).find(d=>d.t==='mcb'&&d.rcd===r.id&&!is3(d));return m?m.c.ph:'L1';}
function terms(d){const p=d.p,L3=['L1','L2','L3'];switch(d.t){
  case 'mcb':{const t=is3(d)?L3.slice():[d.c.ph];if(p.poles==2||p.poles==4)t.push('N');return {top:t,bot:t};}
  case 'rcd':{const t=p.poles==4?[...L3,'N']:[rcdPh(d),'N'];return {top:t,bot:t};}
  case 'rcbo':{const t=p.poles==4?[...L3,'N']:[d.c.ph,'N'];return {top:t,bot:t};}
  case 'sw':{const t=[['L1'],['L1','N'],L3,[...L3,'N']][p.poles-1];return {top:t,bot:t};}
  case 'spd':return {top:p.sys==='3P+N'?[...L3,'N']:['L1','N'],bot:['PE']};
  case 'lamp':return {top:[...L3,'N'],bot:[]};
  case 'relay':return {top:L3,bot:[]};
  /* licznik i stycznik mają zaciski mocy dopiero w torze obwodu: fazy obwodu, licznik zawsze z N, stycznik z N na wolnym biegunie */
  case 'meter':case 'contactor':{const cd=S.dev[d.circ];if(!cd||!isCirc(cd))break;const ph=phases(cd);
    if(d.t==='meter'){const t=(p.ph==3?ph:ph.slice(0,1)).concat('N');return {top:t,bot:t};}
    const t=ph.slice(0,p.poles);if(p.poles>t.length)t.push('N');return {top:t,bot:t};}}
  return {top:[],bot:[]};}
function wlzMm(){const t=[[20,4],[25,6],[40,10],[63,16],[80,25],[100,35]];return (t.find(x=>S.set.przedl<=x[0])||[0,50])[1];}
function wlzType(){const m=fmt(wlzMm());return S.set.siec==='TN-C-S'?`YKY 4×${m} mm² (PEN)`:`YKY 5×${m} mm²`;}
function inMm(I){return I<=20?4:I<=25?6:I<=40?10:I<=63?16:25;}
function cableType(d){const c=+d.c.cable,cs=fmt(c);return is3(d)?(c<=4?'YDYp 5×':'YDY 5×')+cs:(c<=4?'YDYp 3×':'YDY 3×')+cs;}
/* ---------- okablowanie ręczne ---------- */
/* S.wmode: 'auto' (połączenia wylicza autoConns) albo 'manual' (przewody S.conn dodaje użytkownik; szyny grzebieniowe
   i ich zworki nadal wynikają z ustawienia aparatów). Zapisany koniec przewodu: {k:'dev',id,side,i} (i = numer zacisku
   od lewej, więc zmiana fazy obwodu nie przepina przewodu), {k:'bar',bar}, {k:'wlz',ph}. */
let wirePick=null,wireSel=null,wireMove=null;
let BAR_STATS={};   /* ostatnie rysowanie: na każdej listwie liczba przewodów i zajętych zacisków (powinny być równe) */
function wireReset(){wirePick=wireSel=wireMove=null;}
const WIRE_MM=[1.5,2.5,4,6,10,16,25,35];
/* Grubość linii na rysunku rośnie z przekrojem przewodu [mm² → px]. */
const WIRE_W={1.5:1.6,2.5:2,4:2.4,6:2.8,10:3.2,16:3.7,25:4.2,35:4.6};
const wireW=mm=>WIRE_W[mm]||(mm>35?5:2.2);
/* Czy przekrój przewodu mieści się w zaciskach aparatów na jego końcach. Zwraca [komunikat, wskazówka, idAparatu] albo null. */
function termFit(c,D){const E=[c.a,c.b];for(let i=0;i<2;i++){const e=E[i];if(e.k!=='dev')continue;const d=S.dev[e.id],r=termRange(d);
  if(c.mm>r[1]||c.mm<r[0])return ['Przewód <b>'+esc(epName(c.a,D))+' → '+esc(epName(c.b,D))+'</b> '+fmt(c.mm)+' mm² nie pasuje do zacisku <b>'+D[d.id]+' '+esc(d.name)+'</b> (zakres '+fmt(r[0])+'–'+fmt(r[1])+' mm²).',
    c.mm>r[1]?'Za gruby przewód nie wejdzie w zacisk. Zastosuj blok rozdzielczy albo aparat o większych zaciskach; nie wolno odcinać drutów żyły.':'Za cienki przewód nie zostanie pewnie dociśnięty. Zwiększ przekrój albo zastosuj tulejkę zgodnie z kartą aparatu.',d.id];}return null;}
/* Przekroje a zaciski dla połączeń wyliczonych przez program i dla kabli obwodowych (przewody ręczne sprawdza wireCheck). */
function termIssues(){const out=[],D=designations();
  buildConns().C.forEach(c=>{if(c.user||c.kind==='jumper')return;const t=termFit(c,D);if(t)out.push({sev:'crit',msg:t[0],ref:t[1],id:t[2]});});
  S.rows.flat().map(id=>S.dev[id]).filter(isCirc).forEach(d=>{const r=termRange(d),mm=+d.c.cable;if(mm>r[1]||mm<r[0])out.push({sev:'crit',msg:'<b>'+D[d.id]+' '+esc(d.name)+'</b>: kabel obwodowy '+fmt(mm)+' mm² nie pasuje do zacisków aparatu (zakres '+fmt(r[0])+'–'+fmt(r[1])+' mm²).',ref:'Dobierz aparat o odpowiednich zaciskach albo zmień przekrój kabla.',id:d.id});});
  return out;}
const epPh=e=>e.k==='bar'?(e.bar==='PE'?'PE':'N'):e.ph;
const epKey=e=>e.k==='dev'?e.id+'/'+e.side+'/'+e.ph:e.k==='bar'?'bar/'+e.bar:e.k==='comb'?'comb/'+e.rcd+'/'+e.ph:'wlz/'+e.ph;
/* Zapisany koniec → koniec z nazwą żyły; null, gdy zacisk już nie istnieje (usunięty aparat, mniej biegunów). */
function epLive(e){
  if(e.k==='dev'){const d=S.dev[e.id];if(!d)return null;const ph=terms(d)[e.side][e.i];return ph?{k:'dev',id:e.id,side:e.side,ph}:null;}
  if(e.k==='bar'){const r=S.dev[e.bar.slice(2)];return (e.bar==='PE'||e.bar==='N'||(r&&r.t==='rcd'))?{k:'bar',bar:e.bar}:null;}
  return (e.ph==='N'&&S.set.siec==='TN-C-S')?null:{k:'wlz',ph:e.ph};}
function epStore(e){return e.k==='dev'?{k:'dev',id:e.id,side:e.side,i:terms(S.dev[e.id])[e.side].indexOf(e.ph)}:e.k==='bar'?{k:'bar',bar:e.bar}:{k:'wlz',ph:e.ph};}
/* Przekrój przewodu dodanego ręcznie: te same zasady co w autoConns (docs/DOMAIN.md). */
/* Aparaty w torze obwodu d w kolejności połączeń: wyjście wyłącznika → licznik(i) → stycznik(i) → kabel obwodowy. */
function chainOf(d){return S.rows.flat().map(id=>S.dev[id]).filter(x=>x.circ===d.id&&(x.t==='meter'||x.t==='contactor')&&terms(x).top.length).sort((a,b)=>(a.t==='meter'?0:1)-(b.t==='meter'?0:1));}
function userMm(a,b){const P=S.set.przedl,E=[a,b],ds=E.filter(e=>e.k==='dev').map(e=>S.dev[e.id]);
  const inTor=ds.find(d=>d.circ&&S.dev[d.circ]);if(inTor)return +S.dev[inTor.circ].c.cable;    /* za wyłącznikiem obwodu: przekrój kabla obwodowego */
  if(E.some(e=>e.k==='wlz')||(a.k==='bar'&&b.k==='bar'))return wlzMm();
  if(ds.some(d=>d.t==='lamp'||d.t==='relay'))return 1.5;
  const spd=ds.find(d=>d.t==='spd');if(spd)return spd.p.cls==='T1+T2'?(E.some(e=>e.k==='dev'&&e.ph==='PE')?16:10):6;
  if(ds.some(d=>d.t==='sw')&&E.some(e=>e.k==='bar'))return wlzMm();
  const r=E.find(e=>e.k==='dev'&&e.side==='bot'&&S.dev[e.id].t==='rcd');
  return inMm(r?Math.min(S.dev[r.id].p.In,P):P);}
function userConns(){const out=[];(S.conn||[]).forEach(w=>{let a=epLive(w.a),b=epLive(w.b);if(!a||!b)return;
  let flip=false;if(b.k==='wlz'||(b.k==='bar'&&b.bar==='PE'&&a.k!=='wlz')){const t=a;a=b;b=t;flip=true;}
  const pen=a.k==='bar'&&a.bar==='PE'&&epPh(b)==='N';
  out.push({id:w.id,user:1,a,b,ph:pen?'N':(a.k==='bar'?epPh(b):epPh(a)),mm:w.mm||userMm(a,b),mmAuto:userMm(a,b),col:w.col||'',flip,kind:pen?'mostek':a.k==='wlz'?'wlz':'wire'});});return out;}
function buildConns(){const A=autoConns();if(S.wmode!=='manual')return A;
  return {C:A.C.filter(c=>c.kind==='jumper').concat(userConns()),combs:A.combs};}
/* Kontrola okablowania ręcznego. Zwraca { out: uwagi jak w checks(), bad: {idPrzewodu: 'crit'|'warn'}, why: {idPrzewodu: komunikat} }. */
function wireCheck(){const out=[],bad={},why={};if(S.wmode!=='manual')return {out,bad,why};
  const {C,combs}=buildConns(),D=designations(),devs=S.rows.flat().map(id=>S.dev[id]),U=C.filter(c=>c.user),tncs=S.set.siec==='TN-C-S',sw=devs.find(d=>d.t==='sw');
  /* domyślna naprawa uwagi do przewodu ręcznego to jego usunięcie; fix pozwala podać inną */
  const rank={crit:3,warn:2,info:1},add=(sev,msg,ref,id,c,fix)=>{out.push({sev,msg,ref,id,fix:fix||(c?{l:'Usuń ten przewód',f:()=>{S.conn=S.conn.filter(w=>w.id!==c.id);}}:undefined)});if(c&&!(rank[bad[c.id]]>=rank[sev])){bad[c.id]=sev;why[c.id]=msg;}};
  if(!U.length){add('info','Okablowanie ręczne jest puste.','W widoku Okablowanie kliknij zacisk, a potem drugi, aby połączyć je przewodem, albo użyj „Przejmij automatyczne”.',undefined,undefined,{l:'Przejmij automatyczne',f:()=>{wireAdopt();}});return {out,bad,why};}
  const isL=p=>p.charAt(0)==='L',devId=c=>c.a.k==='dev'?c.a.id:c.b.k==='dev'?c.b.id:undefined;
  const zn=z=>z==='pre'?'przed rozłącznikiem głównym':z==='main'?'przed różnicówkami':'za różnicówką '+D[z];
  /* Strefa zacisku: 'pre' przed rozłącznikiem, 'main' za nim, id różnicówki za jej wyjściem; null = nie dotyczy. */
  const zone=e=>{const p=epPh(e);if(p==='PE')return null;const swHas=!!sw&&terms(sw).top.indexOf(p)>=0;
    if(e.k==='wlz')return swHas?'pre':'main';
    if(e.k==='bar')return e.bar==='N'?'main':e.bar.slice(2);
    const d=S.dev[e.id];
    if(d.circ&&(d.t==='meter'||d.t==='contactor')){if(p!=='N'||e.side==='bot')return null;const cd=S.dev[d.circ];return (cd&&cd.rcd&&S.dev[cd.rcd])?cd.rcd:'main';}   /* N aparatu w torze: strefa jego obwodu */
    if(d===sw)return e.side==='top'?'pre':'main';
    if(d.t==='rcd')return e.side==='top'?'main':d.id;
    if(isCirc(d)&&e.side==='bot')return null;
    if(d.t==='mcb')return (d.rcd&&S.dev[d.rcd])?d.rcd:'main';
    return 'main';};
  const COL={L1:'brązową',L2:'czarną',L3:'szarą',N:'niebieską',PE:'zielono-żółtą'};
  const unset=(c,k)=>()=>{const w=S.conn.find(x=>x.id===c.id);if(w)delete w[k];};
  U.forEach(c=>{const fixCol={l:'Przywróć kolor wg normy',f:unset(c,'col')},fixMm={l:'Ustaw przekrój automatycznie',f:unset(c,'mm')};const pa=epPh(c.a),pb=epPh(c.b),nm='Przewód <b>'+esc(epName(c.a,D))+' → '+esc(epName(c.b,D))+'</b>',id=devId(c);
    /* kolor izolacji zmieniony ręcznie: zgodność z PN-EN 60445 (żyła przewodu = c.ph, dla mostka PEN i PE: ochronna) */
    if(c.col&&(pa===pb||c.kind==='mostek')){const fn=c.kind==='mostek'?'PE':c.ph,ref='Kolory wg PN-EN 60445 (PN-HD 308 S2): L1 brązowy, L2 czarny, L3 szary, N niebieski, PE i PEN zielono-żółty.';
      if(c.col!==fn){
        if(c.col==='PE')add('crit',nm+' ma izolację zielono-żółtą, a nie jest przewodem ochronnym.','Kombinacja zielono-żółta jest zastrzeżona wyłącznie dla PE i PEN. '+ref,id,c,fixCol);
        else if(fn==='PE')add('crit',nm+' jest przewodem ochronnym, a ma izolację '+COL[c.col]+'.','Przewód PE i PEN musi być zielono-żółty na całej długości. '+ref,id,c,fixCol);
        else if(c.col==='N')add('warn',nm+' ma izolację niebieską, a jest przewodem fazowym '+fn+'.','Kolor niebieski jest przeznaczony dla przewodu neutralnego. '+ref,id,c,fixCol);
        else if(fn==='N')add('warn',nm+' jest przewodem neutralnym, a ma izolację '+COL[c.col]+'.','Przewód N powinien być niebieski. '+ref,id,c,fixCol);
        else add('info',nm+' (faza '+fn+') ma izolację '+COL[c.col]+'.','Dopuszczalne, ale zalecana kolejność to L1 brązowy, L2 czarny, L3 szary; oznacz końce przewodu. '+ref,id,c,fixCol);}}
    if(c.mm<c.mmAuto)add('warn',nm+' ma przekrój '+fmt(c.mm)+' mm², mniejszy niż dobrany '+fmt(c.mmAuto)+' mm².','Przekrój przewodu w rozdzielnicy musi odpowiadać zabezpieczeniu przed nim (In ≤ Iz, PN-HD 60364-4-43).',id,c,fixMm);
    const tf=termFit(c,D);if(tf)add('crit',tf[0],tf[1],tf[2],c,c.mm!==c.mmAuto?fixMm:undefined);
    if(c.kind==='mostek'){
      if(!tncs)add('crit',nm+' łączy N z PE w układzie '+esc(S.set.siec)+'.','W tym układzie przewody N i PE muszą być rozdzielone w całej instalacji (PN-HD 60364-5-54).',id,c);
      else if(!(c.b.k==='bar'&&c.b.bar==='N')&&!(c.b.k==='dev'&&S.dev[c.b.id]===sw&&c.b.side==='top'))add('crit',nm+' łączy N z PE poza punktem podziału PEN.','Za punktem podziału (listwa PE → główna listwa N) przewodów N i PE nie wolno ponownie łączyć (PN-HD 60364-5-54 p. 543.4).',id,c);
      return;}
    if(pa!==pb){const m=isL(pa)&&isL(pb)?'łączy dwie różne fazy ('+pa+' i '+pb+'): zwarcie międzyfazowe 400 V.':(pa==='PE'||pb==='PE')?(isL(pa)||isL(pb)?'łączy fazę z PE: zwarcie doziemne.':'łączy N z PE poza punktem podziału PEN.'):'łączy fazę z przewodem neutralnym: zwarcie.';
      add('crit',nm+' '+m,'Przewód musi łączyć zaciski tej samej żyły (oznaczenia wg PN-EN 60445). Usuń go i poprowadź do właściwego zacisku.',id,c);return;}
    /* wyjście wyłącznika obwodu wolno połączyć tylko z wejściem licznika lub stycznika stojącego w torze tego obwodu */
    const cb=[c.a,c.b].find(e=>e.k==='dev'&&e.side==='bot'&&isCirc(S.dev[e.id]));
    if(cb){const o=cb===c.a?c.b:c.a;if(o.k==='dev'&&o.side==='top'&&S.dev[o.id].circ===cb.id)return;}
    const ct=[c.a,c.b].find(e=>e.k==='dev'&&e.side==='top'&&S.dev[e.id].circ&&isL(epPh(e)));
    if(ct&&!cb){const o=ct===c.a?c.b:c.a,cid=S.dev[ct.id].circ;
      if(!(o.k==='dev'&&o.side==='bot'&&S.dev[o.id].circ===cid))add('crit',nm+' zasila aparat w torze obwodu '+D[cid]+' z pominięciem jego zabezpieczenia.','Licznik i stycznik obwodu podłącz do wyjścia wyłącznika tego obwodu.',id,c);
      return;}
    if([c.a,c.b].some(e=>e.k==='dev'&&e.side==='bot'&&isCirc(S.dev[e.id]))){add('warn',nm+' jest wpięty w zacisk odejścia obwodu.','Dolne zaciski wyłączników obwodowych są przeznaczone na kabel obwodowy.',id,c);return;}
    const za=zone(c.a),zb=zone(c.b);if(!za||!zb||za===zb)return;
    if(za==='pre'||zb==='pre')add('crit',nm+' omija rozłącznik główny.','Aparaty zasilaj z wyjścia rozłącznika, inaczej nie da się odłączyć całej instalacji (PN-HD 60364-5-53).',id,c);
    else if(pa==='N')add('crit',nm+' łączy przewody N z różnych stref ('+zn(za)+' / '+zn(zb)+').','Wspólny N powoduje błędne wyzwalanie albo brak zadziałania RCD. N obwodów za różnicówką prowadź tylko z jej wyjścia i jej listwy N.',id,c);
    else add('crit',nm+' łączy tory z różnych stref ('+zn(za)+' / '+zn(zb)+').','Obwód przypisany do różnicówki musi być zasilany z jej wyjścia; inaczej omija ochronę różnicowoprądową (PN-HD 60364-4-41).',id,c);});
  /* Ciągłość: każdy zacisk wejściowy musi mieć połączenie z WLZ (przewody + tory wewnątrz aparatów + szyny grzebieniowe). */
  const par={},find=k=>{while(par[k]&&par[k]!==k)k=par[k];return k;},uni=(a,b)=>{a=find(a);b=find(b);if(a!==b)par[a]=b;};
  C.forEach(c=>uni(epKey(c.a),epKey(c.b)));
  devs.forEach(d=>{if(['sw','rcd','mcb','rcbo','meter','contactor'].indexOf(d.t)<0)return;const t=terms(d);t.top.forEach(p=>{if(t.bot.indexOf(p)>=0)uni(d.id+'/top/'+p,d.id+'/bot/'+p);});});
  combs.forEach(cb=>cb.ids.forEach(id=>terms(S.dev[id]).top.forEach(p=>{if(cb.phs.indexOf(p)>=0)uni('comb/'+cb.rcd+'/'+p,id+'/top/'+p);})));
  const src={};['L1','L2','L3','N','PE'].forEach(p=>src[find('wlz/'+p)]=1);
  const live=k=>!!src[find(k)];
  devs.forEach(d=>{const miss=terms(d).top.filter(p=>!live(d.id+'/top/'+p)).map(p=>'wej. '+p);
    if(d.t==='spd'&&!live(d.id+'/bot/PE'))miss.push('wyj. PE');
    if(miss.length)add('crit','<b>'+D[d.id]+' '+esc(d.name)+'</b>: brak połączenia z zasilaniem na zaciskach '+miss.join(', ')+'.','Poprowadź przewód od wyjścia aparatu poprzedzającego albo od właściwej listwy.',d.id);});
  if(!live('bar/PE'))add('crit','<b>Listwa PE</b> nie jest połączona z przewodem ochronnym zasilania (WLZ).','PN-HD 60364-5-54.');
  if(!live('bar/N'))add('warn','<b>Listwa N</b> nie jest zasilona.',tncs?'W układzie TN-C-S połącz ją mostkiem z listwą PE (punkt podziału PEN).':'Połącz ją z przewodem N zasilania.');
  devs.filter(d=>d.t==='rcd').forEach(r=>{if(devs.some(m=>m.t==='mcb'&&m.rcd===r.id)&&!live('bar/N:'+r.id))add('warn','<b>Listwa N '+D[r.id]+'</b> nie jest połączona z wyjściem N różnicówki.','Obwody za tą różnicówką nie mają przewodu neutralnego.',r.id);});
  return {out,bad,why};}
/* Akcje okablowania ręcznego (wołane z app.js). */
function setWmode(m){if(S.wmode===m)return;S.wmode=m;wireReset();render();toast(m==='manual'?'Okablowanie ręczne: Kontrola sprawdza teraz Twoje połączenia':'Okablowanie automatyczne');}
function wireAdopt(){S.conn=autoConns().C.filter(c=>c.kind!=='jumper').map(c=>({id:'w'+(uid++),a:epStore(c.a),b:epStore(c.b)}));wireReset();render();toast('Przejęto '+S.conn.length+' przewodów z okablowania automatycznego');}
function wireDel(){if(!wireSel)return;S.conn=S.conn.filter(w=>w.id!==wireSel);wireSel=null;render();toast('Usunięto przewód');}
function wireAct(a){
  if(a==='adopt'){if(S.conn.length)ask('Zastąpić ręczne okablowanie ('+S.conn.length+' przewodów) automatycznym?','Zastąp',wireAdopt);else wireAdopt();}
  if(a==='clear'&&S.conn.length)ask('Usunąć wszystkie ręcznie dodane przewody ('+S.conn.length+')?','Usuń przewody',()=>{S.conn=[];wireReset();render();toast('Usunięto przewody');});
  if((a==='movea'||a==='moveb')&&wireSel){/* początek/koniec jak na ekranie; userConns mógł zamienić końce (flip) */
    const c=buildConns().C.find(x=>x.id===wireSel);if(!c)return;wireMove={id:wireSel,end:((a==='movea')!==!!c.flip)?'a':'b'};wirePick=null;render(true);}
  if(a==='del')wireDel();}
/* Kliknięcie zacisku: pierwsze wybiera początek, drugie dodaje przewód i od razu zgłasza złe podłączenie. */
function wireClick(ep){const k=JSON.stringify(ep),same=(x,y)=>S.conn.some(w=>{const p=JSON.stringify(w.a),q=JSON.stringify(w.b);return (p===x&&q===y)||(p===y&&q===x);});
  if(wireMove){/* przepinanie końca zaznaczonego przewodu */
    const w=S.conn.find(x=>x.id===wireMove.id),end=wireMove.end;wireMove=null;if(!w){render(true);return;}
    const other=JSON.stringify(end==='a'?w.b:w.a);
    if(other===k||same(k,other)){render(true);toast(other===k?'Oba końce przewodu nie mogą być w tym samym zacisku':'Taki przewód już istnieje');return;}
    w[end]=ep;wireSel=w.id;render();wireAlert(w.id,'Przepięto przewód');return;}
  wireSel=null;
  if(!wirePick){wirePick=ep;render(true);return;}
  const a=wirePick,ka=JSON.stringify(a);wirePick=null;
  if(ka===k){render(true);return;}
  if(same(ka,k)){render(true);toast('Taki przewód już istnieje');return;}
  const id='w'+(uid++);S.conn.push({id,a,b:ep});render();wireAlert(id,'Dodano przewód');}
/* Po zmianie przewodu: czerwony alert, jeśli kontrola ma do niego błąd lub uwagę; w przeciwnym razie zwykły komunikat. */
function wireAlert(id,ok){const wc=wireCheck(),sev=wc.bad[id];
  if(sev==='crit'||sev==='warn'){const t=document.createElement('div');t.innerHTML=wc.why[id];toast((sev==='crit'?'Złe podłączenie: ':'Uwaga: ')+t.textContent,7000,true);}
  else toast(ok);}
/* Właściwości zaznaczonego przewodu: przekrój (mm) i kolor izolacji (col); pusta wartość = dobór automatyczny / wg normy. */
function wireSet(prop,val){const w=S.conn.find(x=>x.id===wireSel);if(!w)return;
  if(prop==='mm'){const v=+val;if(WIRE_MM.indexOf(v)>=0)w.mm=v;else delete w.mm;}
  if(prop==='col'){if(PHN[val])w.col=val;else delete w.col;}
  render();wireAlert(w.id,prop==='mm'?'Zmieniono przekrój przewodu':'Zmieniono kolor przewodu');}
function autoConns(){const C=[],combs=[],devs=S.rows.flat().map(id=>S.dev[id]),P=S.set.przedl;
  const E=(id,side,ph)=>({k:'dev',id,side,ph}),B=bar=>({k:'bar',bar}),W=ph=>({k:'wlz',ph});
  const add=(a,b,ph,mm,kind)=>C.push({a,b,ph,mm,kind});
  const sw=devs.find(d=>d.t==='sw'),wl=wlzMm(),tncs=S.set.siec==='TN-C-S';
  add(W('PE'),B('PE'),'PE',wl,'wlz');
  const swN=sw&&terms(sw).top.includes('N'),nTop=tncs?B('PE'):W('N');
  if(sw)terms(sw).top.filter(p=>p!=='N').forEach(ph=>add(W(ph),E(sw.id,'top',ph),ph,wl,'wlz'));
  if(swN){add(nTop,E(sw.id,'top','N'),'N',wl,tncs?'mostek':'wlz');add(E(sw.id,'bot','N'),B('N'),'N',wl,'wire');}
  else add(nTop,B('N'),'N',wl,tncs?'mostek':'wlz');
  const src=ph=>sw&&terms(sw).bot.includes(ph)?E(sw.id,'bot',ph):W(ph);
  devs.forEach(d=>{if(d===sw)return;let mm;
    if(d.t==='spd')mm=d.p.cls==='T1+T2'?10:6;else if(d.t==='lamp'||d.t==='relay')mm=1.5;
    else if(d.t==='rcd'||d.t==='rcbo'||(d.t==='mcb'&&!(d.rcd&&S.dev[d.rcd])))mm=inMm(P);else return;
    terms(d).top.forEach(ph=>add(ph==='N'?B('N'):src(ph),E(d.id,'top',ph),ph,mm,'wire'));
    if(d.t==='spd')add(E(d.id,'bot','PE'),B('PE'),'PE',d.p.cls==='T1+T2'?16:6,'wire');});
  devs.filter(d=>d.t==='rcd').forEach(r=>{const mm=inMm(Math.min(r.p.In,P)),row=rowOf(r.id),ids=S.rows[row];let i=ids.indexOf(r.id)+1;const run=[];
    while(i<ids.length){const m=S.dev[ids[i]];if(m.t==='mcb'&&m.rcd===r.id){run.push(m.id);i++;}else break;}
    const rt=terms(r).bot;
    if(run.length){const phs=[...new Set(run.flatMap(id=>terms(S.dev[id]).top.filter(p=>p!=='N')))].filter(p=>rt.includes(p)).sort();
      combs.push({rcd:r.id,ids:run,phs,type:(phs.length>1||run.some(id=>is3(S.dev[id])))?'3F':'1F',mod:run.reduce((a,id)=>a+width(S.dev[id]),0)});
      phs.forEach(ph=>add(E(r.id,'bot',ph),{k:'comb',rcd:r.id,ph},ph,mm,'jumper'));
      run.forEach(id=>{if(terms(S.dev[id]).top.includes('N'))add(E(r.id,'bot','N'),E(id,'top','N'),'N',mm,'wire');});}
    devs.filter(m=>m.t==='mcb'&&m.rcd===r.id&&!run.includes(m.id)).forEach(m=>terms(m).top.forEach(ph=>add(E(r.id,'bot',rt.includes(ph)?ph:rt[0]),E(m.id,'top',ph),ph,mm,'wire')));
    add(E(r.id,'bot','N'),B('N:'+r.id),'N',mm,'wire');});
  /* tor obwodu: wyjście wyłącznika → licznik → stycznik; N z wyjścia poprzedniego aparatu albo z listwy N obwodu */
  devs.filter(isCirc).forEach(d=>{let prev=d;const nsrc=d.t==='rcbo'?E(d.id,'bot','N'):(d.rcd&&S.dev[d.rcd])?B('N:'+d.rcd):B('N'),mm=+d.c.cable;
    chainOf(d).forEach(x=>{const pb=terms(prev).bot;
      terms(x).top.forEach(ph=>{if(pb.indexOf(ph)>=0)add(E(prev.id,'bot',ph),E(x.id,'top',ph),ph,mm,'wire');else if(ph==='N')add(nsrc,E(x.id,'top','N'),'N',mm,'wire');});prev=x;});});
  return {C,combs};}
function epName(e,D){if(e.k==='dev')return `${D[e.id]} ${e.side==='top'?'wej.':'wyj.'} ${e.ph}`;
  if(e.k==='bar')return e.bar==='PE'?'Listwa PE':e.bar==='N'?'Listwa N':'Listwa N '+D[e.bar.slice(2)];
  if(e.k==='comb')return 'Szyna grzeb. za '+D[e.rcd];return 'WLZ';}
function modPos(id){const r=rowOf(id);let x=0;for(const j of S.rows[r]){if(j===id)return {row:r,x:x+width(S.dev[j])/2};x+=width(S.dev[j]);}return {row:r,x:0};}
function epPos(e,o){if(e.k==='dev')return modPos(e.id);if(e.k==='comb')return modPos(e.rcd);if(e.k==='bar')return {row:S.rows.length,x:o?o.x:0};return {row:-.5,x:0};}
function connLen(c){if(c.kind==='jumper')return 0.2;let pa=c.a.k==='bar'?null:epPos(c.a);const pb=epPos(c.b,pa);if(!pa)pa=epPos(c.a,pb);
  return Math.ceil((Math.abs(pa.x-pb.x)*18+Math.abs(pa.row-pb.row)*150+250)/50)*0.05;}
function wireMat(){const {C}=buildConns(),m={};C.filter(c=>c.kind!=='wlz').forEach(c=>{const col=c.col||(c.kind==='mostek'?'PE':c.ph),k=c.mm+'|'+col;m[k]=(m[k]||0)+connLen(c);});
  return Object.entries(m).map(([k,v])=>{const [mm,col]=k.split('|');return {mm:+mm,col,m:Math.ceil(v*2)/2};}).sort((a,b)=>a.mm-b.mm||a.col.localeCompare(b.col));}
function cableMat(){const t={};S.rows.flat().map(id=>S.dev[id]).filter(isCirc).forEach(d=>{const k=cableType(d);t[k]=(t[k]||0)+(+(clen(d))||0);});return Object.entries(t).map(([k,v])=>({k,m:Math.ceil(v*1.1)}));}
function combRows(){const g={};buildConns().combs.forEach(c=>{const k=c.type+'|'+Math.ceil(c.mod);g[k]=(g[k]||0)+1;});
  return Object.entries(g).map(([k,n])=>{const [t,m]=k.split('|');return {m:'—',s:'—',d:`Szyna grzebieniowa ${t==='3F'?'3-fazowa':'1-fazowa'}, docięta na ${m} mod.`,w:'',n,acc:1};});}
function wireRows(){return [...wireMat().map(w=>({m:'—',s:'—',d:`Przewód H07V-K (LgY) ${fmt(w.mm)} mm², ${PHN[w.col]}`,w:'',n:fmt(w.m)+' m',acc:1})),
  ...cableMat().map(c=>({m:'—',s:'—',d:`Kabel obwodowy ${c.k} (z zapasem 10%)`,w:'',n:c.m+' m',acc:1}))];}

function drawWires(){const cab=$('#board');
  cab.style.paddingLeft=cab.style.paddingRight=cab.style.paddingTop=cab.style.paddingBottom='';
  if(!S.wires)return;
  const {C,combs}=buildConns(),D=designations(),n=S.rows.length,SP=6;
  const man=S.wmode==='manual',wc=man?wireCheck():{bad:{},why:{}};
  const wf=S.wf||{L1:1,L2:1,L3:1,N:1,PE:1};
  // 1. logiczny przydział torów: każdy przewód dostaje własny tor w korytku i własny pion
  const chOf=e=>e.k==='dev'?(e.side==='top'?rowOf(e.id):rowOf(e.id)+1):e.k==='bar'?n:0;
  const routed=C.filter(c=>c.kind!=='jumper'&&!(c.a.k==='bar'&&c.b.k==='bar'));
  const ord={L1:0,L2:1,L3:2,N:3,PE:4};
  routed.sort((a,b)=>ord[a.ph]-ord[b.ph]);
  const cnt=new Array(n+1).fill(0);let nr=0,nrR=0;const half=enc().mpr/2;
  routed.forEach(c=>{c._ca=chOf(c.a);c._cb=chOf(c.b);if(c._ca===c._cb)cnt[c._ca]++;else{cnt[c._ca]++;cnt[c._cb]++;
    let pa=c.a.k==='bar'?null:epPos(c.a);const pb=epPos(c.b,pa);if(!pa)pa=epPos(c.a,pb);
    const right=c.a.k!=='wlz'&&(pa.x+pb.x)/2>half;c._side=right?'R':'L';c._r=right?nrR++:nr++;}});
  // 2. odstępy obudowy dopasowane do liczby przewodów
  const STUB=24;
  cab.style.paddingLeft=(30+nr*SP)+'px';cab.style.paddingRight=(30+nrR*SP)+'px';
  cab.style.paddingTop=(30+cnt[0]*SP+12)+'px';
  cab.querySelectorAll('.rowwrap').forEach((rw,i)=>{rw.style.marginTop=i?(STUB+cnt[i]*SP+12)+'px':'0px';});
  const botH=STUB+cnt[n]*SP+10;
  cab.style.paddingBottom=(botH+18+30+30)+'px';
  // 3. pomiar
  /* pomiar w układzie obudowy: przy powiększeniu prostokąty z DOM są przeskalowane, więc dzielimy przez zf() */
  const z=zf(),cr=cab.getBoundingClientRect(),ox=cr.left+cab.clientLeft*z,oy=cr.top+cab.clientTop*z;
  const rel=el=>{const r=el.getBoundingClientRect();return {l:(r.left-ox)/z,r:(r.right-ox)/z,t:(r.top-oy)/z,b:(r.bottom-oy)/z,w:r.width/z};};
  const rails=[...cab.querySelectorAll('.rail')].map(rel);if(!rails.length)return;
  let W=cab.clientWidth;const H=cab.clientHeight;
  const ch=[];for(let i=0;i<=n;i++){const start=i?rails[i-1].b+4+STUB:30;ch.push({start,c:0});}
  const lane=i=>ch[i].start+(ch[i].c++)*SP;
  const railR=Math.max(...rails.map(r=>r.r)),x0=30+nr*SP,nY=ch[n].start+cnt[n]*SP+22,peY=nY+30;
  const rcds=S.rows.flat().filter(id=>S.dev[id].t==='rcd');
  const segs=[{k:'N',lab:'N'}].concat(rcds.map(id=>({k:'N:'+id,lab:'N '+D[id]})));
  /* Każdy przewód dostaje na listwie własny zacisk co 12 px. Listwy są tak długie, żeby zmieściły wszystkie swoje przewody;
     gdy nie mieszczą się w obudowie, obudowa jest poszerzana z prawej strony. */
  const onBar={};C.forEach(c=>[c.a,c.b].forEach(e=>{if(e.k==='bar')onBar[e.bar]=(onBar[e.bar]||0)+1;}));
  const need=s=>((onBar[s.k]||0)+1)*12,needN=segs.reduce((a,s)=>a+need(s),0)+(segs.length-1)*14;
  const x1=Math.max(railR,x0+260,x0+needN,x0+((onBar.PE||0)+1)*12),spare=(x1-x0-needN)/segs.length;
  let xs=x0;segs.forEach(s=>{s.x0=xs;s.x1=xs+need(s)+spare;xs=s.x1+14;});
  if(x1+30>W){cab.style.paddingRight=(parseFloat(cab.style.paddingRight)+x1+30-W)+'px';W=cab.clientWidth;}
  const devEl={};cab.querySelectorAll('.slot').forEach(s=>devEl[s.dataset.id]=rel(s.querySelector('.dev')));
  const slots={};BAR_STATS={};const barX=(key,want,lo,hi)=>{const u=slots[key]||(slots[key]=new Set());let best=null;
    const st=BAR_STATS[key]||(BAR_STATS[key]={wires:0,points:0});st.wires++;
    for(let x=lo+6;x<=hi-6;x+=12){if(u.has(x))continue;if(best===null||Math.abs(x-want)<Math.abs(best-want))best=x;}
    if(best===null)best=lo+6;u.add(best);st.points=u.size;return best;};
  const pt=(e,o)=>{
    if(e.k==='dev'){const d=S.dev[e.id],r=devEl[e.id],t=terms(d)[e.side];let k=t.indexOf(e.ph);if(k<0)k=0;
      return {x:r.l+r.w*(k+.5)/t.length,y:e.side==='top'?r.t+7:r.b-7};}
    if(e.k==='bar'){if(e.bar==='PE')return {x:barX('PE',o?o.x:x0,x0,x1),y:peY};
      const s=segs.find(z=>z.k===e.bar)||segs[0];return {x:barX(s.k,o?o.x:s.x0,s.x0,s.x1),y:nY};}
    return {x:x0+8+ord[e.ph]*SP,y:0};};
  const touches=c=>!S.sel||!!SIMC||[c.a,c.b].some(e=>e.id===S.sel||e.rcd===S.sel||e.bar==='N:'+S.sel);
  const shown=c=>wf[(c.kind==='mostek')?'PE':c.ph];
  /* c (opcjonalnie): przewód dodany ręcznie – dostaje data-w do zaznaczania oraz obwódkę błędu / zaznaczenia. */
  const paint=(d,ph,mm,title,pe,dim,c)=>{const w=wireW(mm),u=c&&c.user,bad=u?wc.bad[c.id]:'',sel=u&&wireSel===c.id,at=u?` data-w="${c.id}" tabindex="0" role="button" aria-label="${esc(title)}"`:'';
    const mark=bad==='crit'||bad==='warn';
    /* symulacja: przewód bez napięcia jest przygaszony, a po przewodzie z prądem przesuwają się kreski */
    const sd=!!(SIMC&&c&&!SIMC.live(epKey(c.a))),fl=SIMC&&c&&SIMC.flows(c)?`<path class="flow" d="${d}" fill="none" stroke="var(--wire-hl)" stroke-opacity=".9" stroke-width="${Math.max(1,w*.42).toFixed(2)}" stroke-dasharray="3 11" stroke-linecap="round" pointer-events="none"/>`:'';
    if(bad){const t=document.createElement('div');t.innerHTML=wc.why[c.id];title+=' · '+(bad==='crit'?'ZŁE PODŁĄCZENIE: ':'UWAGA: ')+t.textContent;}
    /* kolor izolacji: ustawiony ręcznie albo wg żyły; PEN (TN-C-S) = zielono-żółty z niebieskimi końcami (PN-EN 60445) */
    const col=c&&c.col?c.col:(pe?'PE':ph),pen=!!c&&!c.col&&S.set.siec==='TN-C-S'&&(c.kind==='mostek'||(c.a.k==='wlz'&&c.a.ph==='PE'));
    let s=`<g opacity="${sd?.2:dim&&!sel&&!mark?.16:1}">`+(mark||sel?`<path class="halo" d="${d}" fill="none" stroke="var(--${sel?'accent':bad==='crit'?'crit':'warn'})" stroke-width="${w+7}" stroke-linejoin="round" opacity=".6"/>`:'')+`<path class="sh" d="${d}" transform="translate(1.6 2.4)" fill="none" stroke="var(--wire-sh)" stroke-opacity=".24" stroke-width="${w+1.2}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="var(--wire-edge)" stroke-width="${w+2}" stroke-linejoin="round"/>`;
    /* połysk: wąska jasna linia przesunięta ku górze-lewej daje wrażenie okrągłego przewodu */
    const hl=`<path class="hl" d="${d}" transform="translate(${(-w*.2).toFixed(2)} ${(-w*.2).toFixed(2)})" fill="none" stroke="var(--wire-hl)" stroke-opacity=".4" stroke-width="${Math.max(.6,w*.28).toFixed(2)}" stroke-linejoin="round" pointer-events="none"/>`;
    if(col==='PE')s+=`<path d="${d}" fill="none" stroke="var(--pe2)" stroke-width="${w}" stroke-linejoin="round"/><path class="w"${at} d="${d}" fill="none" stroke="var(--pe)" stroke-width="${w}" stroke-dasharray="5 5" stroke-linejoin="round"><title>${esc(title)}</title></path>`
      +(pen?`<path class="pen" d="${d}" pathLength="1000" fill="none" stroke="var(--n)" stroke-width="${w}" stroke-dasharray="90 820 90" pointer-events="none"/>`:'');
    else s+=`<path class="w"${at} d="${d}" fill="none" stroke="var(--${col.toLowerCase()})" stroke-width="${w}" stroke-linejoin="round"><title>${esc(title)}</title></path>`;return s+hl+fl+'</g>';};
  let out='';
  // listwy
  out+=`<rect x="${x0+2}" y="${peY-1}" width="${x1-x0}" height="8" rx="2" fill="var(--wire-sh)" opacity=".22"/><rect x="${x0}" y="${peY-4}" width="${x1-x0}" height="8" rx="2" fill="var(--pe)"/><rect x="${x0}" y="${peY-1}" width="${x1-x0}" height="2" fill="var(--pe2)"/><text x="${x0}" y="${peY+20}" font-size="10.5" font-weight="600" fill="var(--ink)">Listwa PE${S.set.siec==='TN-C-S'?' · punkt podziału PEN':''}</text>`;
  segs.forEach(s=>{out+=`<rect x="${s.x0+2}" y="${nY-1}" width="${s.x1-s.x0}" height="8" rx="2" fill="var(--wire-sh)" opacity=".22"/><rect x="${s.x0}" y="${nY-4}" width="${s.x1-s.x0}" height="8" rx="2" fill="var(--n)"/><rect x="${s.x0+1}" y="${nY-3.4}" width="${s.x1-s.x0-2}" height="1.6" rx=".8" fill="var(--wire-hl)" opacity=".4"/><text x="${s.x1}" y="${nY+18}" text-anchor="end" font-size="10.5" font-weight="600" fill="var(--ink)">Listwa ${esc(s.lab)}</text>`;
    for(let x=s.x0+6;x<=s.x1-6;x+=12)out+=`<circle cx="${x}" cy="${nY}" r="1.6" fill="var(--cabinet)"/>`;});
  for(let x=x0+6;x<=x1-6;x+=12)out+=`<circle cx="${x}" cy="${peY}" r="1.6" fill="var(--cabinet)"/>`;
  out+=`<text x="${x0+44}" y="14" font-size="11" font-weight="600" fill="var(--ink)">WLZ: ${esc(wlzType())} · zab. przedlicznikowe ${S.set.przedl} A · ${esc(S.set.siec)}</text>`;
  // przewody
  const srcCount={},key=e=>e.k==='dev'?e.id+e.side+e.ph:'';
  routed.forEach(c=>{const k=key(c.a);if(k)srcCount[k]=(srcCount[k]||0)+1;});
  const dots=[];
  /* połączenia listwa–listwa: mostek PEN (pion) albo ręczny mostek między listwami N (łuk nad listwami) */
  C.filter(c=>c.a.k==='bar'&&c.b.k==='bar').forEach(c=>{if(!shown(c))return;const A=pt(c.a),B=pt(c.b,A),pen=c.kind==='mostek';
    const d=A.y===B.y?`M${A.x} ${A.y}v-10H${B.x}v10`:A.x===B.x?`M${A.x} ${A.y}V${B.y}`:`M${A.x} ${A.y}V${(A.y+B.y)/2}H${B.x}V${B.y}`;
    out+=paint(d,'N',c.mm,pen&&c.b.bar==='N'?'Mostek PEN: listwa PE → listwa N':`${epName(c.a,D)} → ${epName(c.b,D)} · ${fmt(c.mm)} mm²`,pen,!touches(c),c);});
  routed.forEach(c=>{let A,B;
    if(c.a.k==='bar'){B=pt(c.b);A=pt(c.a,B);}else{A=pt(c.a);B=pt(c.b,A);}
    let d;const ya=lane(c._ca);
    if(c._ca===c._cb)d=`M${A.x} ${A.y}V${ya}H${B.x}V${B.y}`;
    else{const yb=lane(c._cb),rx=c._side==='R'?railR+14+c._r*SP:24+c._r*SP;d=`M${A.x} ${A.y}V${ya}H${rx}V${yb}H${B.x}V${B.y}`;}
    if(!shown(c))return;
    const dim=!touches(c),pe=c.ph==='PE'||c.kind==='mostek';
    out+=paint(d,c.ph,c.mm,`${epName(c.a,D)} → ${epName(c.b,D)} · ${c.kind==='mostek'?'mostek PEN':PHN[c.ph]} · ${fmt(c.mm)} mm²`,pe,dim,c);
    if(srcCount[key(c.a)]>1)dots.push(`<circle cx="${A.x}" cy="${ya}" r="3" fill="var(--${pe?'pe':c.ph.toLowerCase()})" stroke="var(--cabinet)" stroke-width="1.2" opacity="${dim?.16:1}"/>`);});
  out+=dots.join('');
  // szyny grzebieniowe i zworki
  combs.forEach(cb=>{const els=cb.ids.map(id=>devEl[id]),rr=devEl[cb.rcd],l=els[0].l+2,r=els[els.length-1].r-2,y=els[0].t+3,gx=(rr.r+els[0].l)/2;
    const dim=!SIMC&&S.sel&&S.sel!==cb.rcd&&!cb.ids.includes(S.sel);
    C.filter(c=>c.kind==='jumper'&&c.b.rcd===cb.rcd).forEach((c,k)=>{if(!shown(c))return;const A=pt(c.a);
      out+=paint(`M${A.x} ${A.y}V${rr.b+4+k*4}H${gx}V${y+3.5}H${l+4+k*5}`,c.ph,c.mm,`${epName(c.a,D)} → szyna grzebieniowa · ${PHN[c.ph]} · ${fmt(c.mm)} mm²`,false,dim,c);});
    out+=`<g opacity="${dim?.25:1}"><rect class="w" x="${l}" y="${y}" width="${r-l}" height="7" rx="1.5" fill="var(--cu)" stroke="var(--cu-edge)"><title>Szyna grzebieniowa ${cb.type==='3F'?'3-fazowa':'1-fazowa'}, ${fmt(cb.mod)} mod., zasilana z ${D[cb.rcd]}</title></rect>`;
    cb.ids.forEach(id=>{const d=S.dev[id],e=devEl[id],t=terms(d).top;t.forEach((ph,k)=>{if(ph==='N')return;out+=`<circle cx="${e.l+e.w*(k+.5)/t.length}" cy="${y+3.5}" r="2.4" fill="var(--${ph.toLowerCase()})" stroke="var(--cu-edge)" stroke-width=".8"/>`;});});out+='</g>';});
  // odejścia do obwodów
  /* odejście do kabla obwodowego: z wyłącznika albo z ostatniego aparatu w torze obwodu (licznik, stycznik) */
  S.rows.forEach(row=>row.forEach(id=>{const d=S.dev[id];if(!isCirc(d))return;const ch=chainOf(d),tg=ch.length?ch[ch.length-1]:d,e=devEl[tg.id],t=terms(tg).bot,yb=rails[rowOf(tg.id)].b+10;
    const dim=SIMC?SIMC.dev[id].st!=='on':(S.sel&&S.sel!==id&&S.sel!==d.rcd);let g='';
    t.forEach((ph,k)=>{if(ph==='N'&&tg===d&&d.t!=='rcbo')return;if(!wf[ph])return;const x=e.l+e.w*(k+.5)/t.length,col=`var(--${ph.toLowerCase()})`;
      g+=`<path d="M${x} ${e.b-7}V${yb}" stroke="${col}" stroke-width="2" fill="none"/><path d="M${x-3} ${yb-3}L${x} ${yb+1}L${x+3} ${yb-3}" stroke="${col}" stroke-width="1.6" fill="none"/>`;});
    const ct=cableType(d).split(' ')[1];g+=`<text x="${e.l+e.w/2}" y="${yb+11}" font-size="8.5" text-anchor="middle" fill="var(--ink)" font-family="JetBrains Mono, monospace">${ct}<title>${esc(D[id]+' '+d.name+': '+cableType(d)+', '+(clen(d))+' m')}</title></text>`;
    out+=`<g opacity="${dim?.25:1}">${g}</g>`;}));
  /* tryb ręczny: klikalne zaciski aparatów, listew i WLZ (data-ep = zapisany koniec przewodu) */
  if(man){const on=wirePick?JSON.stringify(wirePick):'';
    const tp=(e,x,y,t,r)=>{const s=JSON.stringify(e);return `<circle class="tp${s===on?' on':''}" data-ep="${esc(s)}" tabindex="0" role="button" aria-label="${esc(t)}" cx="${x}" cy="${y}" r="${r}"><title>${esc(t)}</title></circle>`;};
    S.rows.flat().forEach(id=>{const t=terms(S.dev[id]);['top','bot'].forEach(side=>t[side].forEach((ph,i)=>{const e={k:'dev',id,side,ph},P=pt(e);out+=tp({k:'dev',id,side,i},P.x,P.y,'Zacisk '+epName(e,D),6);}));});
    const bt=(bar,xa,xb,y,lab)=>{const s=JSON.stringify({k:'bar',bar});out+=`<rect class="tp${s===on?' on':''}" data-ep="${esc(s)}" tabindex="0" role="button" aria-label="${esc(lab)}" x="${xa}" y="${y-7}" width="${xb-xa}" height="14" rx="3"><title>${esc(lab)}</title></rect>`;};
    segs.forEach(s=>bt(s.k,s.x0,s.x1,nY,'Listwa '+s.lab));bt('PE',x0,x1,peY,'Listwa PE');
    ['L1','L2','L3','N','PE'].forEach(ph=>{if(ph==='N'&&S.set.siec==='TN-C-S')return;const e={k:'wlz',ph};out+=tp(e,pt(e).x,6+(ord[ph]%2)*11,'WLZ '+(ph==='PE'&&S.set.siec==='TN-C-S'?'PEN':ph),5);});}
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','wires');svg.setAttribute('width',W);svg.setAttribute('height',H);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('aria-label','Schemat połączeń w rozdzielnicy');svg.innerHTML=out;cab.appendChild(svg);}

function panelKable(){const {C,combs}=buildConns(),D=designations();const circ=S.rows.flat().map(id=>S.dev[id]).filter(isCirc);
  const nsrc=d=>d.t==='rcbo'?D[d.id]+' wyj. N':(d.rcd&&S.dev[d.rcd])?'listwa N '+D[d.rcd]:'listwa N';
  const int=C.filter(c=>c.kind!=='wlz');
  return `<dl class="specs" style="margin-top:0"><dt>Zasilanie (WLZ)</dt><dd>${esc(wlzType())}</dd><dt>Układ sieci</dt><dd>${esc(S.set.siec)}${S.set.siec==='TN-C-S'?' · podział PEN na listwie PE':''}</dd><dt>Połączenia wewnętrzne</dt><dd>${int.length}</dd><dt>Szyny grzebieniowe</dt><dd>${combs.length}</dd></dl>
  <div class="tools"><button class="btn sm pri" data-act="wcsv">Kopiuj listę połączeń (CSV)</button>${S.wires?'':'<button class="btn sm" data-act="wview">Pokaż na obudowie</button>'}</div>
  <h3>Kable obwodowe</h3><div class="tbl"><table><thead><tr><th>Ozn.</th><th>Obwód</th><th>Kabel</th><th style="text-align:right">Dł.</th><th>N / PE</th></tr></thead><tbody>
  ${circ.map(d=>`<tr data-id="${d.id}" style="cursor:pointer"><td><code>${D[d.id]}</code></td><td>${esc(d.name)}</td><td>${esc(cableType(d))}</td><td class="n">${clen(d)} m</td><td>${esc(nsrc(d))} · listwa PE</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Brak obwodów</td></tr>'}</tbody></table></div>
  <h3>Przewody w rozdzielnicy (H07V-K / LgY)</h3><div class="tbl"><table><thead><tr><th>Przekrój</th><th>Żyła</th><th style="text-align:right">Ilość</th></tr></thead><tbody>
  ${wireMat().map(w=>`<tr><td>${fmt(w.mm)} mm²</td><td><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${w.col==='PE'?'linear-gradient(90deg,var(--pe) 50%,var(--pe2) 50%)':'var(--'+w.col.toLowerCase()+')'};margin-right:6px"></i>${PHN[w.col]}</td><td class="n">${fmt(w.m)} m</td></tr>`).join('')}</tbody></table></div>
  <p class="note">Długości szacowane z położenia aparatów (18 mm na moduł, ok. 150 mm między rzędami, 250 mm zapasu na połączenie). WLZ dobrany do zabezpieczenia przedlicznikowego; przewody do SPD wg PN-HD 60364-5-534 (T1+T2: 10 mm², PE 16 mm²).</p>
  <h3>Lista połączeń</h3><div class="tbl"><table><thead><tr><th>Od</th><th>Do</th><th>Żyła</th><th style="text-align:right">mm²</th></tr></thead><tbody>
  ${C.map(c=>`<tr><td>${esc(epName(c.a,D))}</td><td>${esc(epName(c.b,D))}</td><td>${c.kind==='mostek'?'mostek PEN':PHN[c.ph]}</td><td class="n">${fmt(c.mm)}</td></tr>`).join('')}</tbody></table></div><div id="copyOut"></div>`;}

