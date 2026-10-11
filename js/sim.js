/* Symulacja: stan łączników, napięcie na zaciskach, zdarzenia awaryjne — Projektant Rozdzielnic. Skrypt klasyczny, ładowany po wiring.js.
   S.sim = { on, off:{idAparatu:1}, dead:{faza:1}, log:[{sev,msg}] } to stan widoku: nie trafia do pliku ani do historii cofania.
   Symulacja jest uproszczona: liczy tylko ciągłość torów (kto ma napięcie). Nie liczy czasów zadziałania, impedancji pętli
   ani prądów zwarciowych. */
let SIMC=null;                                   /* wynik simCalc() dla bieżącego rysowania obudowy (null = symulacja wyłączona) */
const SIM_SW=['sw','rcd','mcb','rcbo'];          /* aparaty, które przerywają tor */
function simOn(){return !!(S.sim&&S.sim.on);}
function simLog(sev,msg){S.sim.log.push({sev,msg});if(S.sim.log.length>30)S.sim.log.shift();}
function simToggle(){S.sim=simOn()?null:{on:true,off:{},dead:{},log:[]};render();toast(simOn()?'Symulacja włączona: klikaj dźwignie aparatów':'Symulacja wyłączona');}
/* Kto ma napięcie. Graf: przewody + szyny grzebieniowe + tory wewnątrz ZAŁĄCZONYCH aparatów; źródła: żyły WLZ bez zaniku.
   Zwraca { live(kluczZacisku), dev:{id:{st,lv}}, load:{L1,L2,L3}, nOn, nAll, flows(przewód) }.
   st: 'on' zasilony, 'off' wyłączony, 'dead' bez napięcia, 'part' brak fazy lub N, 'none' aparat bez zacisków mocy. */
function simCalc(){const {C,combs}=buildConns(),devs=S.rows.flat().map(id=>S.dev[id]),off=S.sim.off,par={};
  const find=k=>{while(par[k]&&par[k]!==k)k=par[k];return k;},uni=(a,b)=>{a=find(a);b=find(b);if(a!==b)par[a]=b;};
  C.forEach(c=>uni(epKey(c.a),epKey(c.b)));
  devs.forEach(d=>{if(SIM_SW.indexOf(d.t)<0||off[d.id])return;const t=terms(d);t.top.forEach(p=>{if(t.bot.indexOf(p)>=0)uni(d.id+'/top/'+p,d.id+'/bot/'+p);});});
  combs.forEach(cb=>cb.ids.forEach(id=>terms(S.dev[id]).top.forEach(p=>{if(cb.phs.indexOf(p)>=0)uni('comb/'+cb.rcd+'/'+p,id+'/top/'+p);})));
  const src={};['L1','L2','L3','N','PE'].forEach(p=>{if(!S.sim.dead[p])src[find('wlz/'+p)]=1;});
  const live=k=>!!src[find(k)],dev={},load={L1:0,L2:0,L3:0};let nOn=0,nAll=0;
  devs.forEach(d=>{const t=terms(d),phs=t.top.filter(p=>p!=='N'&&p!=='PE'),lv=phs.filter(p=>live(d.id+'/top/'+p));
    let st=!t.top.length?'none':off[d.id]?'off':!lv.length?'dead':lv.length<phs.length?'part':'on';
    if(isCirc(d)){nAll++;
      /* obwód jednofazowy potrzebuje też N: z wyjścia RCBO, z listwy N swojej różnicówki albo z głównej listwy N */
      if(st==='on'&&!is3(d)&&!live(d.t==='rcbo'?d.id+'/top/N':(d.rcd&&S.dev[d.rcd])?'bar/N:'+d.rcd:'bar/N'))st='part';
      if(st==='on'){nOn++;const i=ib(d);phases(d).forEach(p=>load[p]+=i);}}
    dev[d.id]={st,lv};});
  const circOn=id=>!!dev[id]&&dev[id].st==='on'&&isCirc(S.dev[id])&&+S.dev[id].c.P>0;
  /* Czy przewodem fazowym płynie prąd: jest pod napięciem i za nim pracuje jakiś odbiornik. */
  const flows=c=>{if(c.ph.charAt(0)!=='L'||c.kind==='mostek'||!live(epKey(c.a)))return false;
    const e=(c.b.k==='dev'||c.b.k==='comb')?c.b:c.a;
    if(e.k==='comb')return combs.some(cb=>cb.rcd===e.rcd&&cb.ids.some(id=>circOn(id)&&phases(S.dev[id]).indexOf(c.ph)>=0));
    if(e.k!=='dev')return false;const d=S.dev[e.id];
    if(d.t==='sw')return !off[d.id]&&load[c.ph]>0;
    if(d.t==='rcd')return devs.some(m=>m.t==='mcb'&&m.rcd===d.id&&circOn(m.id)&&phases(m).indexOf(c.ph)>=0);
    if(isCirc(d))return circOn(d.id);
    return d.t==='lamp'||d.t==='relay';};
  return {live,dev,load,nOn,nAll,flows};}
/* Kliknięcie dźwigni: załącz / wyłącz aparat. */
function simLever(id){const d=S.dev[id];if(!d||SIM_SW.indexOf(d.t)<0)return;const D=designations();
  if(S.sim.off[id]){delete S.sim.off[id];simLog('info',D[id]+' '+d.name+': załączony.');}
  else{S.sim.off[id]=1;simLog('info',D[id]+' '+d.name+': wyłączony ręcznie.');}
  render(true);}
/* Przycisk TEST różnicówki: działa tylko na załączonym aparacie pod napięciem. */
function simTest(id){const d=S.dev[id],D=designations(),a=simCalc();
  if(S.sim.off[id]||!a.dev[id].lv.length){toast('Przycisk TEST działa tylko na załączonym aparacie pod napięciem');return;}
  S.sim.off[id]=1;const b=simCalc();
  simLog('info','Test '+D[id]+' '+d.name+': wyłącznik zadziałał prawidłowo. Bez zasilania: '+(a.nOn-b.nOn)+' obw.');render(true);toast('Test '+D[id]+': zadziałał');}
/* Awaria w zaznaczonym obwodzie: 'short' zwarcie, 'over' przeciążenie, 'leak' upływ do PE. */
function simFault(type){const d=S.dev[S.sel],D=designations();
  if(!d||!isCirc(d)){toast('Zaznacz obwód: kliknij wyłącznik nadprądowy albo różnicowonadprądowy');return;}
  const a=simCalc(),nm=D[d.id]+' '+d.name,n0=S.sim.log.length;
  if(a.dev[d.id].st!=='on')simLog('info',nm+': obwód nie jest zasilony, więc nic się nie dzieje.');
  else if(type==='short'){S.sim.off[d.id]=1;
    const cc=circCalc(d);
    if(S.set.siec!=='TT'&&!cc.trip)simLog('crit','Zwarcie w obwodzie '+nm+': prąd zwarcia na końcu obwodu ok. '+fmt(cc.ik1,0)+' A jest mniejszy niż próg '+fmt(cc.ia,0)+' A, więc człon zwarciowy nie zadziała. '+D[d.id]+' wyłączy dopiero członem termicznym, po dłuższym czasie.');
    else simLog('crit','Zwarcie w obwodzie '+nm+': zadziałał '+D[d.id]+' (człon zwarciowy, '+d.p.curve+d.p.In+').'+(S.set.siec!=='TT'?' Prąd zwarcia ok. '+fmt(cc.ik1,0)+' A.':''));
    if(S.set.przedl<1.6*d.p.In)simLog('warn','Brak selektywności: zabezpieczenie przedlicznikowe '+S.set.przedl+' A może zadziałać razem z '+D[d.id]+' i wyłączyć całą instalację.');}
  else if(type==='over'){S.sim.off[d.id]=1;const z=iz(d);
    simLog('warn','Przeciążenie obwodu '+nm+': zadziałał '+D[d.id]+' (człon termiczny, po czasie zależnym od krotności prądu).');
    if(z&&d.p.In>z)simLog('crit','Przewód '+fmt(d.c.cable)+' mm² (Iz '+fmt(z)+' A) jest słabszy niż zabezpieczenie '+d.p.In+' A: nagrzeje się ponad dopuszczalną temperaturę, zanim wyłącznik zadziała.');}
  else if(type==='leak'){const r=protRcd(d);
    if(!r)simLog('crit','Upływ do PE w obwodzie '+nm+': obwód nie ma wyłącznika różnicowoprądowego, więc nic go nie wyłączy. Zagrożenie porażeniem.');
    else{S.sim.off[r.id]=1;simLog(r.p.idn>30?'warn':'crit','Upływ do PE w obwodzie '+nm+': zadziałał '+D[r.id]+' (IΔn '+r.p.idn+' mA).'+(r.p.idn>30?' Wyłącznik powyżej 30 mA nie chroni przed porażeniem.':''));}}
  const lost=a.nOn-simCalc().nOn,first=S.sim.log[n0];
  if(lost>1)simLog('info','Razem bez zasilania: '+lost+' obw. (wszystkie za wyłączonym aparatem).');
  render(true);toast(first.msg,6000,first.sev==='crit');}
/* Zanik fazy w zasilaniu ('' = przywrócenie). */
function simPhase(ph){const a=simCalc();S.sim.dead={};if(ph)S.sim.dead[ph]=1;const b=simCalc(),D=designations();
  if(ph){const part=Object.keys(b.dev).filter(id=>b.dev[id].st==='part'&&isCirc(S.dev[id])).map(id=>D[id]);
    simLog('crit','Zanik fazy '+ph+' w zasilaniu: zasilonych obwodów '+b.nOn+' z '+a.nOn+'.'+(part.length?' Niepełne zasilanie odbiorników trójfazowych: '+part.join(', ')+' (ryzyko uszkodzenia silników).':''));
    const k=S.rows.flat().map(id=>S.dev[id]).find(d=>d.t==='relay');
    if(k)simLog('info',D[k.id]+' '+k.name+' wykrywa zanik fazy. Aplikacja nie ma jeszcze obwodów sterowania, więc niczego nie wyłącza.');}
  else simLog('info','Zasilanie przywrócone na wszystkich fazach.');
  render(true);}
function simReset(){S.sim.off={};S.sim.dead={};S.sim.log=[];render(true);toast('Załączono wszystkie aparaty');}
/* Pasek symulacji nad obudową. */
function renderSim(){const bar=$('#simBar');$('#bSim').setAttribute('aria-pressed',String(simOn()));bar.hidden=!simOn();if(!simOn())return;
  const st=SIMC||simCalc(),P=S.set.przedl,dead=Object.keys(S.sim.dead)[0]||'',over=['L1','L2','L3'].some(p=>st.load[p]>P);
  bar.innerHTML=`<div class="simrow"><b id="simCount">Zasilone obwody: ${st.nOn}/${st.nAll}</b>
      <span class="simload">Pobór przy wszystkich odbiornikach naraz:${['L1','L2','L3'].map(p=>`<span class="${st.load[p]>P?'over':''}"><i style="background:var(--${p.toLowerCase()})"></i>${p} ${fmt(st.load[p])} A</span>`).join('')}<span>zab. ${P} A</span></span></div>
    ${over?`<p class="simwarn">Przy wszystkich odbiornikach naraz prąd przekracza zabezpieczenie przedlicznikowe ${P} A. W praktyce ogranicza to współczynnik jednoczesności (zakładka Bilans).</p>`:''}
    <div class="simrow"><span class="encsub">Awaria w zaznaczonym obwodzie:</span><button class="chip" data-sim="short">Zwarcie</button><button class="chip" data-sim="over">Przeciążenie</button><button class="chip" data-sim="leak">Upływ do PE</button>
      <label class="encsub">Zanik fazy <select data-simph aria-label="Zanik fazy">${opt('',dead,'brak')}${['L1','L2','L3'].map(p=>opt(p,dead)).join('')}</select></label>
      <button class="chip" data-sim="reset">Załącz wszystko</button></div>
    ${S.sim.log.length?`<ol class="simlog">${S.sim.log.slice(-5).map(l=>`<li class="${l.sev}">${esc(l.msg)}</li>`).join('')}</ol>`
      :'<p class="encsub">Kliknij dźwignię aparatu, aby go wyłączyć lub załączyć. Przycisk T testuje różnicówkę. Zaznacz obwód i wywołaj awarię.</p>'}
    <p class="encsub">Symulacja uproszczona: pokazuje, co zostaje bez napięcia, i nie liczy czasów zadziałania. Prądy zwarcia są szacowane z danych sieci w zakładce Bilans.</p>`;}
