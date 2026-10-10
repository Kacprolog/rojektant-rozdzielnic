/* Renderowanie: nagłówek, obudowa, biblioteka, front aparatów, panele boczne — Projektant Rozdzielnic. Skrypt klasyczny (bez modułów ES), ładowany w kolejności z index.html. */
/* ---------- render ---------- */
function render(skipPanel){save();renderTop();renderEnc();renderLib();renderBoard();renderTabs();if(!skipPanel)renderPanel();}
function renderTop(){const pn=$('#pname');if(document.activeElement!==pn)pn.value=S.name;const T=totals(),ck=checks();
  $('#bUndo').disabled=!HIST.u.length;$('#bRedo').disabled=!HIST.r.length;
  $('#projSel').innerHTML=PR.list.map(p=>`<option value="${esc(p.id)}" ${p.id===PR.cur?'selected':''}>${esc((p.id===PR.cur?S.name:p.S.name)||'(bez nazwy)')}</option>`).join('');
  const nc=ck.filter(c=>c.sev==='crit').length,nw=ck.filter(c=>c.sev==='warn').length;
  $('#stats').innerHTML=`<div class="stat"><div class="k">Moduły</div><div class="v">${fmt(T.used)}<small> / ${T.cap}</small></div></div>
  <div class="stat"><div class="k">Moc zainst.</div><div class="v">${fmt(T.P)}<small> kW</small></div></div>
  <div class="stat"><div class="k">Moc szczyt.</div><div class="v">${fmt(T.Pd)}<small> kW · ${fmt(T.Ibm)} A</small></div></div>
  <div class="stat"><div class="k">Kontrola</div><div class="v" style="color:${nc?'var(--crit)':nw?'var(--warn)':'var(--ok)'}">${nc?nc+' błędy':nw?nw+' uwagi':'OK'}</div></div>`;}
function renderEnc(){const e=enc();
  $('#encMfr').innerHTML=Object.keys(ENC).map(k=>`<option value="${k}" ${k===S.enc.mfr?'selected':''}>${MFR[k].n}</option>`).join('');
  $('#encSeries').innerHTML=ENC[S.enc.mfr].map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${x.n} · ${x.mpr} mod.</option>`).join('');
  $('#encRows').innerHTML=e.rows.map(r=>`<option value="${r}" ${r==S.enc.rows?'selected':''}>${r} × ${e.mpr} = ${r*e.mpr} mod.</option>`).join('');
  $('#encSpecs').innerHTML=[['Stopień ochrony',e.ip],['Montaż',e.mount],['Materiał',e.mat],['Klasa ochronności',e.cls],['Front',e.door],['Szerokość rzędu',e.mpr+' × 18 mm = '+e.mpr*18+' mm']].map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('#encTitle').textContent=`${MFR[S.enc.mfr].n} ${e.n} · ${S.enc.rows} × ${e.mpr} mod.`;
  $('#encSub').textContent=`${e.ip}, ${e.mount}, klasa ${e.cls} · sieć ${S.set.siec}`;}
function renderLib(){
  $('#mfrChips').innerHTML=Object.keys(MFR).map(k=>`<button class="chip" data-mfr="${k}" aria-pressed="${k===S.mfr}"><span class="dot" style="background:${MFR[k].c}"></span>${MFR[k].n}</button>`).join('');
  const q=(S.q||'').toLowerCase();const groups={};
  PRESETS.forEach((p,i)=>{if(q&&!(p.l+' '+p.g+' '+TNAME[p.t]).toLowerCase().includes(q))return;(groups[p.g]=groups[p.g]||[]).push([p,i]);});
  const html=Object.entries(groups).map(([g,arr])=>`<h3>${g}</h3>`+arr.map(([p,i])=>{const d={t:p.t,p:p.p,m:S.mfr};const w=width(d);
    const bars=Array.from({length:Math.ceil(w)},(_,k)=>`<i class="${(k===Math.ceil(w)-1&&w%1)?'half':''}"></i>`).join('');
    return `<button class="libitem" draggable="true" data-preset="${i}"><span class="mods">${bars}</span><span class="t"><b>${esc(p.l)}</b><span>${MFR[S.mfr].s==='LEGRAND'?'Legrand':MFR[S.mfr].n} ${esc(series(d))}</span></span><span class="w">${fmt(w)} mod</span></button>`;}).join('')).join('');
  $('#libList').innerHTML=html||'<p class="empty">Brak aparatów pasujących do wyszukiwania.</p>';}
function screws(n){return Array.from({length:Math.max(1,Math.round(n))},()=>'<span class="scr"></span>').join('');}
function face(d){const w=width(d);switch(d.t){
  case 'mcb':return `<div class="lever ${w>1?'wide':''}"></div>`;
  case 'rcbo':return `<div class="lever ${w>2?'wide':''}"></div><span class="tbtn">T</span>`;
  case 'rcd':return `<div class="lever wide blue"></div><span class="tbtn">T</span>`;
  case 'sw':return `<div class="lever wide red"></div>`;
  case 'spd':return `<div class="spdwin">${'<i></i>'.repeat(d.p.sys==='1P+N'?2:4)}</div>`;
  case 'meter':return d.p.ph==3?`<div class="lcd">01284,7</div>`:`<div class="lcd" style="font-size:7px">0412</div>`;
  case 'lamp':return `<div class="leds"><i></i><i></i><i></i></div>`;
  case 'contactor':return `<div class="lever" style="width:12px;height:18px"></div>`;
  case 'socket':return `<div class="sock"></div>`;
  case 'timer':case 'relay':return `<div class="dial"></div>`;
  case 'psu':return `<div class="lcd" style="background:#cfd2cc;color:#333">DC OK</div>`;}return '';}
function screwsFor(d,side){const w=width(d),t=terms(d);let n=t[side].length||(side==='bot'&&t.top.length?0:Math.ceil(w));if(!n)return '';return screws(Math.min(n,Math.max(1,Math.floor(w*34/10))));}
function renderWireFilter(){const f=$('#wireFilter');f.hidden=!S.wires;if(!S.wires)return;const wf=S.wf||(S.wf={L1:1,L2:1,L3:1,N:1,PE:1});
  const bg={L1:'var(--l1)',L2:'var(--l2)',L3:'var(--l3)',N:'var(--n)',PE:'linear-gradient(90deg,var(--pe) 50%,var(--pe2) 50%)'};
  f.innerHTML='<span class="encsub" style="align-self:center">Pokaż żyły:</span>'+Object.keys(bg).map(k=>`<button class="chip" data-wf="${k}" aria-pressed="${!!wf[k]}"><span class="dot" style="background:${bg[k]}"></span>${k}</button>`).join('')
    +(S.sel&&S.dev[S.sel]?`<button class="chip" data-wsel="1" aria-pressed="true">Wyróżnione: ${designations()[S.sel]} ✕</button>`:'');}
function renderBoard(){const e=enc(),D=designations(),M=34;$('#board').className='cabinet'+(S.wires?' wiring':'');
  $('#viewSeg').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.view==='wires')===!!S.wires)));$('#wireHint').hidden=!S.wires;renderWireFilter();
  $('#board').innerHTML=S.rows.map((r,i)=>{const u=rowUse(i),wpx=Math.max(e.mpr,u)*M;
    const devs=r.map(id=>{const d=S.dev[id],w=width(d),[a,b]=rate(d);
      const phs=isCirc(d)?phases(d).map(p=>`<i style="background:var(--${p.toLowerCase()})"></i>`).join(''):'';
      return `<div class="slot ${S.sel===id?'sel':''}" draggable="true" data-id="${id}" style="width:${w*M}px" title="${esc(D[id]+' '+d.name+' · '+desc(d))}">
        <div class="dev"><div class="trm">${screwsFor(d,'top')}</div><div class="mk" style="--b:${MFR[d.m].c}">${w>=2?MFR[d.m].s:MFR[d.m].s.slice(0,4)}</div>
        <div class="rt">${esc(a)}</div><div class="sub">${esc(b)}</div>${face(d)}<div class="trm b">${screwsFor(d,'bot')}</div></div>
        <div class="tag"><b>${D[id]}</b><span>${esc(d.name)}</span><span class="ph">${phs}</span></div></div>`;}).join('');
    const free=e.mpr-u;
    const blank=free>0?`<div class="blank" style="width:${free*M}px">${free>=2?'rezerwa<br>'+fmt(free)+' mod.':''}</div>`:'';
    const limit=u>e.mpr?`<div class="limit" style="left:${e.mpr*M}px"><span>koniec szyny</span></div>`:'';
    return `<div class="rowwrap"><div class="rowlab" data-row="${i}"><b>Rząd ${i+1}</b><span class="fill ${u>e.mpr?'over':''}">${fmt(u)} / ${e.mpr} mod.</span>${S.active===i?'<span class="act">aktywny</span>':''}</div>
      <div class="rail ${S.active===i?'active':''}" data-row="${i}" style="width:${wpx}px">${devs}${blank}${limit}</div></div>`;}).join('');
  try{drawWires();}catch(err){console.error(err);}}
function renderTabs(){const ck=checks(),nc=ck.filter(c=>c.sev==='crit').length,nw=ck.filter(c=>c.sev==='warn').length;
  const T=[['aparat','Aparat'],['kontrola','Kontrola'],['bilans','Bilans'],['struktura','Struktura'],['kable','Kable'],['bom','Zestawienie']];
  $('#tabs').innerHTML=T.map(([k,l])=>`<button class="tab" role="tab" data-tab="${k}" aria-selected="${S.tab===k}">${l}${k==='kontrola'&&(nc||nw)?`<span class="badge ${nc?'crit':'warn'}">${nc||nw}</span>`:''}</button>`).join('');}
function opt(v,cur,l){return `<option value="${v}" ${String(v)===String(cur)?'selected':''}>${l==null?v:l}</option>`;}
function fsel(id,label,k,opts,cur){return `<div class="fld"><label for="${id}">${label}</label><select id="${id}" data-k="${k}">${opts.map(o=>Array.isArray(o)?opt(o[0],cur,o[1]):opt(o,cur)).join('')}</select></div>`;}
function renderPanel(){const P=$('#panel');
  if(S.tab==='aparat')P.innerHTML=panelDev();
  else if(S.tab==='kontrola')P.innerHTML=panelChecks();
  else if(S.tab==='bilans')P.innerHTML=panelBal();
  else if(S.tab==='struktura')P.innerHTML=panelTree();
  else if(S.tab==='kable')P.innerHTML=panelKable();
  else P.innerHTML=panelBom();}
function panelDev(){const d=S.dev[S.sel];
  if(!d)return `<p class="empty">Kliknij aparat na szynie, aby zobaczyć jego dane techniczne i ustawić parametry obwodu.</p>
    <h3>Jak pracować</h3><ol class="note" style="padding-left:18px;margin:0;font-size:13px;color:var(--muted)"><li>Wybierz obudowę i liczbę rzędów.</li><li>Wybierz producenta aparatów i przeciągnij je na szyny.</li><li>Ustaw moc, przekrój i fazę każdego obwodu.</li><li>Sprawdź zakładki Kontrola i Bilans, a na koniec pobierz zestawienie.</li></ol>`;
  const D=designations(),p=d.p;let f='';
  f+=`<div class="fld"><label for="iName">Opis (opisówka)</label><input id="iName" data-k="name" value="${esc(d.name)}"></div>`;
  f+=`<div class="fld2">${fsel('iMfr','Producent','m',Object.keys(MFR).map(k=>[k,MFR[k].n]),d.m)}${fsel('iRow','Rząd','row',S.rows.map((_,i)=>[i,'Rząd '+(i+1)]),S.rows.findIndex(r=>r.includes(d.id)))}</div>`;
  const pf=[];
  if(d.t==='mcb'){pf.push(fsel('pIn','Prąd In [A]','p.In',[6,10,13,16,20,25,32,40,50,63],p.In),fsel('pCurve','Charakterystyka','p.curve',['B','C','D'],p.curve),fsel('pPoles','Bieguny','p.poles',[1,2,3,4],p.poles),fsel('pIcn','Zdolność Icn','p.icn',[[6,'6 kA'],[10,'10 kA']],p.icn));}
  if(d.t==='rcd'){pf.push(fsel('pIn','Prąd In [A]','p.In',[25,40,63,80,100],p.In),fsel('pIdn','IΔn [mA]','p.idn',[10,30,100,300,500],p.idn),fsel('pKind','Typ','p.kind',['AC','A','F','B'],p.kind),fsel('pPoles','Bieguny','p.poles',[2,4],p.poles),fsel('pSel','Zwłoka','p.sel',[['false','bezzwłoczny'],['true','selektywny S']],String(!!p.sel)));}
  if(d.t==='rcbo'){pf.push(fsel('pIn','Prąd In [A]','p.In',[6,10,13,16,20,25,32,40],p.In),fsel('pCurve','Charakterystyka','p.curve',['B','C'],p.curve),fsel('pIdn','IΔn [mA]','p.idn',[10,30,100],p.idn),fsel('pKind','Typ','p.kind',['AC','A','F','B'],p.kind),fsel('pPoles','Bieguny','p.poles',[[2,'1P+N'],[4,'3P+N']],p.poles));}
  if(d.t==='sw'){pf.push(fsel('pIn','Prąd In [A]','p.In',[32,40,63,80,100,125],p.In),fsel('pPoles','Bieguny','p.poles',[1,2,3,4],p.poles));}
  if(d.t==='spd'){pf.push(fsel('pCls','Typ','p.cls',['T1+T2','T2'],p.cls),fsel('pSys','Układ','p.sys',['1P+N','3P+N'],p.sys));}
  if(d.t==='meter'){pf.push(fsel('pPh','Fazy','p.ph',[[1,'1-fazowy'],[3,'3-fazowy']],p.ph),fsel('pMid','Legalizacja','p.mid',[['true','MID'],['false','bez MID']],String(!!p.mid)));}
  if(d.t==='contactor'){pf.push(fsel('pIn','Prąd AC-7a [A]','p.In',[20,25,40,63],p.In),fsel('pPoles','Styki','p.poles',[[2,'2NO'],[4,'4NO']],p.poles));}
  if(d.t==='psu'){pf.push(fsel('pW','Moc','p.W',[[30,'30 W'],[60,'60 W']],p.W));}
  if(pf.length)f+=`<h3>Parametry aparatu</h3><div class="fld2">${pf.join('')}</div>`;
  let calc='';
  if(isCirc(d)){const i=ib(d),z=iz(d),c=d.c;
    f+=`<h3>Obwód</h3><div class="fld2">${fsel('cKind','Rodzaj obwodu','c.kind',Object.entries(KINDS),c.kind)}
      <div class="fld"><label for="cP">Moc [kW]</label><input id="cP" type="number" min="0" step="0.1" data-k="c.P" value="${c.P}"></div>
      ${fsel('cCable','Przewód Cu [mm²]','c.cable',[1.5,2.5,4,6,10,16],c.cable)}
      ${is3(d)?'<div class="fld"><label>Faza</label><select disabled><option>L1+L2+L3</option></select></div>':fsel('cPh','Faza','c.ph',['L1','L2','L3'],c.ph)}
      <div class="fld"><label for="cLen">Długość kabla [m]</label><input id="cLen" type="number" min="0" step="1" data-k="c.len" value="${clen(d)}"></div>
      <div class="fld"><label for="cType">Kabel do obwodu</label><input id="cType" disabled value="${esc(cableType(d))}"></div></div>`;
    if(d.t==='mcb'){const rcds=Object.values(S.dev).filter(x=>x.t==='rcd');
      f+=fsel('iRcd','Ochrona RCD','rcd',[['','— brak —'],...rcds.map(r=>[r.id,`${D[r.id]} ${r.p.In} A / ${r.p.idn} mA typ ${r.p.kind} · ${r.name}`])],d.rcd||'');}
    const r=protRcd(d);
    calc=`<div class="calc"><div class="${i>p.In?'bad':'good'}"><div class="k">Ib obciążenia</div><div class="v">${fmt(i)} A</div></div>
      <div><div class="k">In zabezp.</div><div class="v">${p.In} A</div></div>
      <div class="${p.In>z?'bad':'good'}"><div class="k">Iz przewodu</div><div class="v">${fmt(z)} A</div></div></div>
      <p class="note">Warunek Ib ≤ In ≤ Iz ${i<=p.In&&p.In<=z?'<b style="color:var(--ok)">spełniony</b>':'<b style="color:var(--crit)">niespełniony</b>'}. ${is3(d)?'Obwód trójfazowy, 3 żyły obciążone.':'Obwód jednofazowy, 2 żyły obciążone.'} Ochrona różnicowoprądowa: ${r?r.p.idn+' mA typ '+r.p.kind:'brak'}.</p>`;}
  return `<div class="insp-h"><span class="code">${D[d.id]}</span><div><div class="nm">${esc(desc(d))}</div><div class="mf">${MFR[d.m].n} · seria ${esc(series(d))}</div></div></div>
    <div class="tools"><button class="btn sm" data-act="left">← W lewo</button><button class="btn sm" data-act="right">W prawo →</button><button class="btn sm" data-act="dup">Duplikuj</button><button class="btn sm danger" data-act="del">Usuń</button></div>
    ${calc}${f}<h3>Dane techniczne</h3><dl class="specs">${specs(d).map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="note">Oznaczenie serii jest orientacyjne. Numer katalogowy dobierz w katalogu producenta.</p>`;}
function panelChecks(){const ck=checks();const order={crit:0,warn:1,info:2};ck.sort((a,b)=>order[a.sev]-order[b.sev]);
  const L={crit:'błąd',warn:'uwaga',info:'info'};
  if(!ck.length)return `<ul class="issues"><li class="issue"><span class="sev ok">OK</span><span class="msg">Projekt przeszedł wszystkie kontrole.</span></li></ul>`;
  return `<ul class="issues">${ck.map(c=>`<li class="issue" ${c.id?`data-id="${c.id}"`:''}><span class="sev ${c.sev}">${L[c.sev]}</span><span class="msg">${c.msg}</span>${c.ref?`<span class="ref">${c.ref}</span>`:''}</li>`).join('')}</ul>
  <p class="note">Kliknij pozycję powiązaną z aparatem, aby go zaznaczyć.</p>`;}
function panelBal(){const L=phaseLoads(),T=totals(),ks=S.set.ks;
  const vals=['L1','L2','L3'].map(p=>[p,L[p]*ks,L[p]]);const max=Math.max(S.set.przedl,...vals.map(v=>v[1]))*1.15||1;
  const W=320,lx=34,bw=W-lx-10,sx=v=>lx+v/max*bw;
  const ticks=[];const step=max>80?20:max>40?10:5;for(let t=0;t<=max;t+=step)ticks.push(t);
  const svg=`<svg viewBox="0 0 ${W} 150" width="100%" role="img" aria-label="Obciążenie faz">
    ${ticks.map(t=>`<line x1="${sx(t)}" x2="${sx(t)}" y1="8" y2="120" stroke="var(--line)"/><text x="${sx(t)}" y="136" font-size="10" text-anchor="middle" fill="var(--muted)" font-family="JetBrains Mono, monospace">${t}</text>`).join('')}
    ${vals.map(([p,v,raw],i)=>{const y=14+i*36;return `<text x="0" y="${y+15}" font-size="12" font-weight="600" fill="var(--ink)">${p}</text>
      <rect x="${lx}" y="${y}" width="${Math.max(0,sx(raw)-lx)}" height="22" rx="3" fill="var(--${p.toLowerCase()})" opacity=".22"/>
      <rect x="${lx}" y="${y}" width="${Math.max(0,sx(v)-lx)}" height="22" rx="3" fill="var(--${p.toLowerCase()})"/>
      <text x="${Math.min(sx(v)+5,W-40)}" y="${y+15}" font-size="11" fill="var(--ink)" font-family="JetBrains Mono, monospace">${fmt(v)} A</text>`;}).join('')}
    <line x1="${sx(S.set.przedl)}" x2="${sx(S.set.przedl)}" y1="4" y2="122" stroke="var(--crit)" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="${sx(S.set.przedl)-4}" y="148" font-size="10" text-anchor="end" fill="var(--crit)">zab. przedlicznikowe ${S.set.przedl} A</text></svg>`;
  return `<h3 style="margin-top:0">Obciążenie faz [A]</h3>${svg}
    <p class="note">Słupek pełny: prąd szczytowy z ks = ${fmt(ks,2)}. Słupek jasny: suma prądów wszystkich obwodów.</p>
    <dl class="specs" style="margin-top:10px"><dt>Moc zainstalowana</dt><dd>${fmt(T.P)} kW</dd><dt>Moc szczytowa</dt><dd>${fmt(T.Pd)} kW</dd><dt>Prąd szczytowy (3F)</dt><dd>${fmt(T.Ibm)} A</dd><dt>Wykorzystanie mocy przył.</dt><dd>${fmt(T.Pd/S.set.moc*100,0)}%</dd></dl>
    <h3>Dane zasilania</h3><div class="fld2">
      <div class="fld"><label for="sMoc">Moc przyłączeniowa [kW]</label><input id="sMoc" type="number" step="0.5" min="1" data-s="moc" value="${S.set.moc}"></div>
      ${fsel('sPrz','Zab. przedlicznikowe [A]','',[16,20,25,32,40,50,63],S.set.przedl).replace('data-k=""','data-s="przedl"')}
      <div class="fld"><label for="sKs">Wsp. jednoczesności ks</label><input id="sKs" type="number" step="0.05" min="0.1" max="1" data-s="ks" value="${S.set.ks}"></div>
      <div class="fld"><label for="sCos">cos φ</label><input id="sCos" type="number" step="0.01" min="0.5" max="1" data-s="cos" value="${S.set.cos}"></div>
      ${fsel('sSiec','Układ sieci','',['TN-C-S','TN-S','TT'],S.set.siec).replace('data-k=""','data-s="siec"')}</div>`;}
function panelTree(){const D=designations(),devs=S.rows.flat().map(id=>S.dev[id]);
  const node=d=>`<span class="node" data-id="${d.id}"><code>${D[d.id]}</code>${esc(d.name)}<small>${esc(rate(d).join(' '))}${isCirc(d)?' · '+fmt(+d.c.P)+' kW · '+(is3(d)?'3F':d.c.ph):''}</small></span>`;
  const sw=devs.filter(d=>d.t==='sw'),aux=devs.filter(d=>!['sw','rcd','mcb'].includes(d.t));
  const rcds=devs.filter(d=>d.t==='rcd');const bare=devs.filter(d=>d.t==='mcb'&&!(d.rcd&&S.dev[d.rcd]));
  const inner=[...aux.map(d=>`<li>${node(d)}</li>`),...rcds.map(r=>`<li>${node(r)}<ul>${devs.filter(d=>d.t==='mcb'&&d.rcd===r.id).map(d=>`<li>${node(d)}</li>`).join('')||'<li class="empty">brak obwodów</li>'}</ul></li>`),
    ...(bare.length?[`<li><span class="node"><small>bez ochrony różnicowoprądowej</small></span><ul>${bare.map(d=>`<li>${node(d)}</li>`).join('')}</ul></li>`]:[])].join('');
  return `<ul class="tree"><li><span class="node"><code>WLZ</code>Zasilanie ${esc(S.set.siec)}<small>zab. przedlicznikowe ${S.set.przedl} A · ${fmt(S.set.moc)} kW</small></span>
    <ul>${sw.length?sw.map(s=>`<li>${node(s)}<ul>${inner}</ul></li>`).join(''):`<li><span class="node"><small>brak rozłącznika głównego</small></span><ul>${inner}</ul></li>`}</ul></li></ul>
    <p class="note">Struktura zasilania wynika z przypisań RCD w panelu aparatu.</p>`;}
function bomRows(){const g={};S.rows.flat().forEach(id=>{const d=S.dev[id];const k=d.m+'|'+desc(d);(g[k]=g[k]||{m:MFR[d.m].n,s:series(d),d:desc(d),w:width(d),n:0}).n++;});
  const rows=Object.values(g).sort((a,b)=>a.m.localeCompare(b.m)||a.d.localeCompare(b.d));const e=enc(),T=totals();
  const acc=[{m:MFR[S.enc.mfr].n,s:e.n,d:`Obudowa ${S.enc.rows} × ${e.mpr} mod., ${e.ip}, ${e.mount}`,w:'',n:1,acc:1},
    ...combRows(),...wireRows(),
    {m:'—',s:'—',d:'Zaślepki modułowe (łącznie modułów)',w:'',n:Math.max(0,Math.round(T.cap-T.used)),acc:1},
    {m:'—',s:'—',d:'Listwa zaciskowa N + PE',w:'',n:1,acc:1},{m:'—',s:'—',d:'Opisówka obwodów + schemat w drzwiach',w:'',n:1,acc:1}];
  return rows.concat(acc);}
function panelBom(){const r=bomRows();
  return `<div class="tools" style="margin-top:0"><button class="btn sm pri" data-act="csv">Kopiuj CSV</button><button class="btn sm" data-act="txt">Kopiuj opisówkę</button></div>
  <div class="tbl"><table><thead><tr><th>Lp.</th><th>Producent / seria</th><th>Pozycja</th><th style="text-align:right">Mod.</th><th style="text-align:right">Szt.</th></tr></thead>
  <tbody>${r.map((x,i)=>`<tr class="${x.acc?'acc':''}"><td class="n">${i+1}</td><td>${esc(x.m)}<br><small>${esc(x.s)}</small></td><td>${esc(x.d)}</td><td class="n">${x.w===''?'':fmt(x.w)}</td><td class="n">${x.n}</td></tr>`).join('')}</tbody></table></div><div id="copyOut"></div>`;}

