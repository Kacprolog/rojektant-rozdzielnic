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
  case 'relay':return {top:L3,bot:[]};}
  return {top:[],bot:[]};}
function wlzMm(){const t=[[20,4],[25,6],[40,10],[63,16],[80,25],[100,35]];return (t.find(x=>S.set.przedl<=x[0])||[0,50])[1];}
function wlzType(){const m=fmt(wlzMm());return S.set.siec==='TN-C-S'?`YKY 4×${m} mm² (PEN)`:`YKY 5×${m} mm²`;}
function inMm(I){return I<=20?4:I<=25?6:I<=40?10:I<=63?16:25;}
function cableType(d){const c=+d.c.cable,cs=fmt(c);return is3(d)?(c<=4?'YDYp 5×':'YDY 5×')+cs:(c<=4?'YDYp 3×':'YDY 3×')+cs;}
function buildConns(){const C=[],combs=[],devs=S.rows.flat().map(id=>S.dev[id]),P=S.set.przedl;
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
  return {C,combs};}
function epName(e,D){if(e.k==='dev')return `${D[e.id]} ${e.side==='top'?'wej.':'wyj.'} ${e.ph}`;
  if(e.k==='bar')return e.bar==='PE'?'Listwa PE':e.bar==='N'?'Listwa N':'Listwa N '+D[e.bar.slice(2)];
  if(e.k==='comb')return 'Szyna grzeb. za '+D[e.rcd];return 'WLZ';}
function modPos(id){const r=rowOf(id);let x=0;for(const j of S.rows[r]){if(j===id)return {row:r,x:x+width(S.dev[j])/2};x+=width(S.dev[j]);}return {row:r,x:0};}
function epPos(e,o){if(e.k==='dev')return modPos(e.id);if(e.k==='comb')return modPos(e.rcd);if(e.k==='bar')return {row:S.rows.length,x:o?o.x:0};return {row:-.5,x:0};}
function connLen(c){if(c.kind==='jumper')return 0.2;let pa=c.a.k==='bar'?null:epPos(c.a);const pb=epPos(c.b,pa);if(!pa)pa=epPos(c.a,pb);
  return Math.ceil((Math.abs(pa.x-pb.x)*18+Math.abs(pa.row-pb.row)*150+250)/50)*0.05;}
function wireMat(){const {C}=buildConns(),m={};C.filter(c=>c.kind!=='wlz').forEach(c=>{const col=c.kind==='mostek'?'PE':c.ph,k=c.mm+'|'+col;m[k]=(m[k]||0)+connLen(c);});
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
  const cr=cab.getBoundingClientRect(),ox=cr.left+cab.clientLeft,oy=cr.top+cab.clientTop;
  const rel=el=>{const r=el.getBoundingClientRect();return {l:r.left-ox,r:r.right-ox,t:r.top-oy,b:r.bottom-oy,w:r.width};};
  const rails=[...cab.querySelectorAll('.rail')].map(rel);if(!rails.length)return;
  const W=cab.clientWidth,H=cab.clientHeight;
  const ch=[];for(let i=0;i<=n;i++){const start=i?rails[i-1].b+4+STUB:30;ch.push({start,c:0});}
  const lane=i=>ch[i].start+(ch[i].c++)*SP;
  const railR=Math.max(...rails.map(r=>r.r)),x0=30+nr*SP,x1=Math.max(railR,x0+260),nY=ch[n].start+cnt[n]*SP+22,peY=nY+30;
  const rcds=S.rows.flat().filter(id=>S.dev[id].t==='rcd');
  const segs=[{k:'N',lab:'N'}].concat(rcds.map(id=>({k:'N:'+id,lab:'N '+D[id]})));const sw=(x1-x0-(segs.length-1)*14)/segs.length;
  segs.forEach((s,i)=>{s.x0=x0+i*(sw+14);s.x1=s.x0+sw;});
  const devEl={};cab.querySelectorAll('.slot').forEach(s=>devEl[s.dataset.id]=rel(s.querySelector('.dev')));
  const slots={};const barX=(key,want,lo,hi)=>{const u=slots[key]||(slots[key]=new Set());let best=null;
    for(let x=lo+6;x<=hi-6;x+=12){if(u.has(x))continue;if(best===null||Math.abs(x-want)<Math.abs(best-want))best=x;}
    if(best===null)best=lo+6;u.add(best);return best;};
  const pt=(e,o)=>{
    if(e.k==='dev'){const d=S.dev[e.id],r=devEl[e.id],t=terms(d)[e.side];let k=t.indexOf(e.ph);if(k<0)k=0;
      return {x:r.l+r.w*(k+.5)/t.length,y:e.side==='top'?r.t+7:r.b-7};}
    if(e.k==='bar'){if(e.bar==='PE')return {x:barX('PE',o?o.x:x0,x0,x1),y:peY};
      const s=segs.find(z=>z.k===e.bar)||segs[0];return {x:barX(s.k,o?o.x:s.x0,s.x0,s.x1),y:nY};}
    return {x:x0+8+ord[e.ph]*SP,y:0};};
  const touches=c=>!S.sel||[c.a,c.b].some(e=>e.id===S.sel||e.rcd===S.sel||e.bar==='N:'+S.sel);
  const shown=c=>wf[(c.kind==='mostek')?'PE':c.ph];
  const paint=(d,ph,mm,title,pe,dim)=>{const w=mm>=10?3:2.2;let s=`<g opacity="${dim?.16:1}"><path d="${d}" fill="none" stroke="var(--cabinet)" stroke-width="${w+3}" stroke-linejoin="round"/>`;
    if(pe)s+=`<path d="${d}" fill="none" stroke="var(--pe2)" stroke-width="${w}" stroke-linejoin="round"/><path class="w" d="${d}" fill="none" stroke="var(--pe)" stroke-width="${w}" stroke-dasharray="5 5" stroke-linejoin="round"><title>${esc(title)}</title></path>`;
    else s+=`<path class="w" d="${d}" fill="none" stroke="var(--${ph.toLowerCase()})" stroke-width="${w}" stroke-linejoin="round"><title>${esc(title)}</title></path>`;return s+'</g>';};
  let out='';
  // listwy
  out+=`<rect x="${x0}" y="${peY-4}" width="${x1-x0}" height="8" rx="2" fill="var(--pe)"/><rect x="${x0}" y="${peY-1}" width="${x1-x0}" height="2" fill="var(--pe2)"/><text x="${x0}" y="${peY+20}" font-size="10.5" font-weight="600" fill="var(--ink)">Listwa PE${S.set.siec==='TN-C-S'?' · punkt podziału PEN':''}</text>`;
  segs.forEach(s=>{out+=`<rect x="${s.x0}" y="${nY-4}" width="${s.x1-s.x0}" height="8" rx="2" fill="var(--n)"/><text x="${s.x1}" y="${nY+18}" text-anchor="end" font-size="10.5" font-weight="600" fill="var(--ink)">Listwa ${esc(s.lab)}</text>`;
    for(let x=s.x0+6;x<=s.x1-6;x+=12)out+=`<circle cx="${x}" cy="${nY}" r="1.6" fill="var(--cabinet)"/>`;});
  for(let x=x0+6;x<=x1-6;x+=12)out+=`<circle cx="${x}" cy="${peY}" r="1.6" fill="var(--cabinet)"/>`;
  out+=`<text x="${x0+44}" y="14" font-size="11" font-weight="600" fill="var(--ink)">WLZ: ${esc(wlzType())} · zab. przedlicznikowe ${S.set.przedl} A · ${esc(S.set.siec)}</text>`;
  // przewody
  const srcCount={},key=e=>e.k==='dev'?e.id+e.side+e.ph:'';
  routed.forEach(c=>{const k=key(c.a);if(k)srcCount[k]=(srcCount[k]||0)+1;});
  const dots=[];
  C.filter(c=>c.kind==='mostek'&&c.a.k==='bar'&&c.b.k==='bar').forEach(c=>{if(!shown(c))return;const x=barX('PE',x0,x0,x1);if(slots[segs[0].k])slots[segs[0].k].add(x);out+=paint(`M${x} ${peY}V${nY}`,'N',c.mm,'Mostek PEN: listwa PE → listwa N',true,!touches(c));});
  routed.forEach(c=>{let A,B;
    if(c.a.k==='bar'){B=pt(c.b);A=pt(c.a,B);}else{A=pt(c.a);B=pt(c.b,A);}
    let d;const ya=lane(c._ca);
    if(c._ca===c._cb)d=`M${A.x} ${A.y}V${ya}H${B.x}V${B.y}`;
    else{const yb=lane(c._cb),rx=c._side==='R'?railR+14+c._r*SP:24+c._r*SP;d=`M${A.x} ${A.y}V${ya}H${rx}V${yb}H${B.x}V${B.y}`;}
    if(!shown(c))return;
    const dim=!touches(c),pe=c.ph==='PE'||c.kind==='mostek';
    out+=paint(d,c.ph,c.mm,`${epName(c.a,D)} → ${epName(c.b,D)} · ${c.kind==='mostek'?'mostek PEN':PHN[c.ph]} · ${fmt(c.mm)} mm²`,pe,dim);
    if(srcCount[key(c.a)]>1)dots.push(`<circle cx="${A.x}" cy="${ya}" r="3" fill="var(--${pe?'pe':c.ph.toLowerCase()})" stroke="var(--cabinet)" stroke-width="1.2" opacity="${dim?.16:1}"/>`);});
  out+=dots.join('');
  // szyny grzebieniowe i zworki
  combs.forEach(cb=>{const els=cb.ids.map(id=>devEl[id]),rr=devEl[cb.rcd],l=els[0].l+2,r=els[els.length-1].r-2,y=els[0].t+3,gx=(rr.r+els[0].l)/2;
    const dim=S.sel&&S.sel!==cb.rcd&&!cb.ids.includes(S.sel);
    C.filter(c=>c.kind==='jumper'&&c.b.rcd===cb.rcd).forEach((c,k)=>{if(!shown(c))return;const A=pt(c.a);
      out+=paint(`M${A.x} ${A.y}V${rr.b+4+k*4}H${gx}V${y+3.5}H${l+4+k*5}`,c.ph,c.mm,`${epName(c.a,D)} → szyna grzebieniowa · ${PHN[c.ph]} · ${fmt(c.mm)} mm²`,false,dim);});
    out+=`<g opacity="${dim?.25:1}"><rect class="w" x="${l}" y="${y}" width="${r-l}" height="7" rx="1.5" fill="var(--cu)" stroke="var(--cu-edge)"><title>Szyna grzebieniowa ${cb.type==='3F'?'3-fazowa':'1-fazowa'}, ${fmt(cb.mod)} mod., zasilana z ${D[cb.rcd]}</title></rect>`;
    cb.ids.forEach(id=>{const d=S.dev[id],e=devEl[id],t=terms(d).top;t.forEach((ph,k)=>{if(ph==='N')return;out+=`<circle cx="${e.l+e.w*(k+.5)/t.length}" cy="${y+3.5}" r="2.4" fill="var(--${ph.toLowerCase()})" stroke="var(--cu-edge)" stroke-width=".8"/>`;});});out+='</g>';});
  // odejścia do obwodów
  S.rows.forEach((row,ri)=>row.forEach(id=>{const d=S.dev[id];if(!isCirc(d))return;const e=devEl[id],t=terms(d).bot,yb=rails[ri].b+10;
    const dim=S.sel&&S.sel!==id&&S.sel!==d.rcd;let g='';
    t.forEach((ph,k)=>{if(ph==='N'&&d.t!=='rcbo')return;if(!wf[ph])return;const x=e.l+e.w*(k+.5)/t.length,col=`var(--${ph.toLowerCase()})`;
      g+=`<path d="M${x} ${e.b-7}V${yb}" stroke="${col}" stroke-width="2" fill="none"/><path d="M${x-3} ${yb-3}L${x} ${yb+1}L${x+3} ${yb-3}" stroke="${col}" stroke-width="1.6" fill="none"/>`;});
    const ct=cableType(d).split(' ')[1];g+=`<text x="${e.l+e.w/2}" y="${yb+11}" font-size="8.5" text-anchor="middle" fill="var(--ink)" font-family="JetBrains Mono, monospace">${ct}<title>${esc(D[id]+' '+d.name+': '+cableType(d)+', '+(clen(d))+' m')}</title></text>`;
    out+=`<g opacity="${dim?.25:1}">${g}</g>`;}));
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

