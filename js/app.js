/* Akcje użytkownika, zdarzenia, start aplikacji — Projektant Rozdzielnic. Skrypt klasyczny (bez modułów ES), ładowany w kolejności z index.html. */
/* ---------- actions ---------- */
function rowOf(id){return S.rows.findIndex(r=>r.includes(id));}
function autoRcd(d,row,idx){if(d.t!=='mcb')return;const r=S.rows[row];for(let i=Math.min(idx,r.length)-1;i>=0;i--){const x=S.dev[r[i]];if(x.t==='rcd'){d.rcd=x.id;return;}}
  for(let k=row-1;k>=0;k--){const rr=S.rows[k];for(let i=rr.length-1;i>=0;i--){const x=S.dev[rr[i]];if(x.t==='rcd'){d.rcd=x.id;return;}}}}
function addPreset(i,row,idx){const p=PRESETS[i];const d=newDev(p.t,S.mfr,p.p,p.c,p.name);S.dev[d.id]=d;
  if(idx==null)idx=S.rows[row].length;S.rows[row].splice(idx,0,d.id);autoRcd(d,row,idx);S.sel=d.id;S.active=row;S.tab='aparat';render();toast(`Dodano ${desc(d)} do rzędu ${row+1}`);}
function moveDev(id,row,idx){const fr=rowOf(id),fi=S.rows[fr].indexOf(id);S.rows[fr].splice(fi,1);if(fr===row&&fi<idx)idx--;S.rows[row].splice(Math.max(0,Math.min(idx,S.rows[row].length)),0,id);render();}
function delDev(id){const r=rowOf(id);if(r<0)return;S.rows[r].splice(S.rows[r].indexOf(id),1);delete S.dev[id];Object.values(S.dev).forEach(d=>{if(d.rcd===id)d.rcd=null;});if(S.sel===id)S.sel=null;render();}
function balance(){const L={L1:0,L2:0,L3:0};const devs=Object.values(S.dev).filter(isCirc);
  devs.filter(is3).forEach(d=>{const i=ib(d);L.L1+=i;L.L2+=i;L.L3+=i;});
  devs.filter(d=>!is3(d)).sort((a,b)=>ib(b)-ib(a)).forEach(d=>{const p=Object.keys(L).sort((a,b)=>L[a]-L[b])[0];d.c.ph=p;L[p]+=ib(d);});
  render();toast('Obwody jednofazowe rozłożone na L1–L3');}
let tt;function toast(m){let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2200);}
function copy(text,label){const done=()=>toast(label+' skopiowano do schowka');
  const fallback=()=>{$('#copyOut').innerHTML=`<p class="note">Schowek jest niedostępny. Zaznacz tekst i skopiuj ręcznie.</p><textarea class="copyarea" id="copyTa" readonly></textarea>`;const ta=$('#copyTa');ta.value=text;ta.focus();ta.select();};
  try{navigator.clipboard.writeText(text).then(done,fallback);}catch(e){fallback();}}

/* ---------- events ---------- */
$('#pname').addEventListener('input',e=>{S.name=e.target.value;save();});
$('#encMfr').addEventListener('change',e=>{S.enc.mfr=e.target.value;S.enc.series=ENC[S.enc.mfr][0].id;fixRows();render();});
$('#encSeries').addEventListener('change',e=>{S.enc.series=e.target.value;fixRows();render();});
$('#encRows').addEventListener('change',e=>{S.enc.rows=+e.target.value;fixRows();render();});
function fixRows(){const e=enc();if(!e.rows.includes(S.enc.rows))S.enc.rows=Math.min(S.enc.rows,Math.max(...e.rows));
  while(S.rows.length<S.enc.rows)S.rows.push([]);while(S.rows.length>S.enc.rows){const last=S.rows.pop();S.rows[S.rows.length-1].push(...last);}
  if(S.active>=S.rows.length)S.active=S.rows.length-1;}
$('#mfrChips').addEventListener('click',e=>{const b=e.target.closest('[data-mfr]');if(!b)return;S.mfr=b.dataset.mfr;render(true);});
$('#libSearch').addEventListener('input',e=>{S.q=e.target.value;renderLib();});
$('#libList').addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(b)addPreset(+b.dataset.preset,S.active);});
$('#libList').addEventListener('dragstart',e=>{const b=e.target.closest('[data-preset]');if(!b)return;dragInfo={preset:+b.dataset.preset};e.dataTransfer.setData('text/plain','preset');e.dataTransfer.effectAllowed='copy';});
const board=$('#board');
board.addEventListener('click',e=>{const s=e.target.closest('.slot');if(s){S.sel=s.dataset.id;S.active=rowOf(s.dataset.id);S.tab='aparat';render();return;}
  const r=e.target.closest('[data-row]');if(r){S.active=+r.dataset.row;render(true);}});
board.addEventListener('dragstart',e=>{const s=e.target.closest('.slot');if(!s)return;dragInfo={id:s.dataset.id};e.dataTransfer.setData('text/plain','move');e.dataTransfer.effectAllowed='move';});
function dropIndex(rail,x){const slots=[...rail.querySelectorAll('.slot')].filter(s=>s.dataset.id!==(dragInfo&&dragInfo.id));let idx=slots.length,pos=null;
  for(let i=0;i<slots.length;i++){const r=slots[i].getBoundingClientRect();if(x<r.left+r.width/2){idx=i;pos=r.left;break;}}
  const rr=rail.getBoundingClientRect();if(pos==null){const last=slots[slots.length-1];pos=last?last.getBoundingClientRect().right:rr.left;}
  const ids=slots.map(s=>s.dataset.id);return {idx,px:pos-rr.left,ids};}
board.addEventListener('dragover',e=>{const rail=e.target.closest('.rail');if(!rail||!dragInfo)return;e.preventDefault();const {px}=dropIndex(rail,e.clientX);
  board.querySelectorAll('.dropline').forEach(x=>x.remove());const l=document.createElement('div');l.className='dropline';l.style.left=(px-1)+'px';rail.appendChild(l);});
board.addEventListener('dragleave',e=>{if(!board.contains(e.relatedTarget))board.querySelectorAll('.dropline').forEach(x=>x.remove());});
board.addEventListener('drop',e=>{const rail=e.target.closest('.rail');if(!rail||!dragInfo)return;e.preventDefault();const row=+rail.dataset.row;const {idx,ids}=dropIndex(rail,e.clientX);
  if(dragInfo.preset!=null)addPreset(dragInfo.preset,row,idx);
  else{const id=dragInfo.id,fr=rowOf(id);S.rows[fr].splice(S.rows[fr].indexOf(id),1);const target=row===fr?ids:S.rows[row];
    const before=target[idx];const at=before?S.rows[row].indexOf(before):S.rows[row].length;S.rows[row].splice(at,0,id);S.active=row;render();}
  dragInfo=null;});
document.addEventListener('dragend',()=>{dragInfo=null;board.querySelectorAll('.dropline').forEach(x=>x.remove());});
$('#tabs').addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(!t)return;S.tab=t.dataset.tab;renderTabs();renderPanel();save();});
const panel=$('#panel');
panel.addEventListener('click',e=>{const a=e.target.closest('[data-act]');
  if(a){const act=a.dataset.act,id=S.sel;
    if(act==='csv'){const r=bomRows();copy(['Lp;Producent;Seria;Pozycja;Moduly;Ilosc',...r.map((x,i)=>[i+1,x.m,x.s,x.d,x.w===''?'':String(x.w).replace('.',','),x.n].join(';'))].join('\n'),'Zestawienie');return;}
    if(act==='wcsv'){const {C}=buildConns(),D=designations();copy(['Od;Do;Zyla;Przekroj mm2;Rodzaj;Dlugosc m',...C.map(c=>[epName(c.a,D),epName(c.b,D),c.kind==='mostek'?'mostek PEN':PHN[c.ph],String(c.mm).replace('.',','),c.kind,c.kind==='wlz'?'':connLen(c).toFixed(2).replace('.',',')].join(';'))].join('\n'),'Listę połączeń');return;}
    if(act==='wview'){S.wires=true;render();return;}
    if(act==='txt'){const D=designations();copy(S.rows.map((r,i)=>`Rząd ${i+1}: `+r.map(id=>`${D[id]} ${S.dev[id].name} (${rate(S.dev[id]).join(' ').trim()})`).join(' | ')).join('\n'),'Opisówkę');return;}
    if(!id)return;const r=rowOf(id),i=S.rows[r].indexOf(id);
    if(act==='left'&&i>0){S.rows[r].splice(i,1);S.rows[r].splice(i-1,0,id);render();}
    if(act==='right'&&i<S.rows[r].length-1){S.rows[r].splice(i,1);S.rows[r].splice(i+1,0,id);render();}
    if(act==='dup'){const d=JSON.parse(JSON.stringify(S.dev[id]));d.id='d'+(uid++);S.dev[d.id]=d;S.rows[r].splice(i+1,0,d.id);S.sel=d.id;render();}
    if(act==='del')delDev(id);return;}
  const n=e.target.closest('[data-id]');if(n&&S.dev[n.dataset.id]){S.sel=n.dataset.id;S.active=rowOf(S.sel);S.tab='aparat';render();}});
function setPath(obj,path,v){const k=path.split('.');let o=obj;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=v;}
function parseV(v){if(v==='true')return true;if(v==='false')return false;if(v!==''&&!isNaN(v)&&!/^L\d$/.test(v))return +v;return v;}
panel.addEventListener('input',e=>{const t=e.target;const d=S.dev[S.sel];
  if(t.dataset.k==='name'&&d){d.name=t.value;render(true);return;}
  if(t.dataset.k==='c.P'&&d){d.c.P=Math.max(0,+t.value||0);render(true);updCalc();return;}
  if(t.dataset.k==='c.len'&&d){d.c.len=Math.max(0,+t.value||0);save();return;}});
function updCalc(){const d=S.dev[S.sel];if(!d)return;const c=panel.querySelector('.calc');if(!c)return;const tmp=document.createElement('div');tmp.innerHTML=panelDev();const nc=tmp.querySelector('.calc'),nn=tmp.querySelector('.calc + .note'),on=panel.querySelector('.calc + .note');if(nc)c.replaceWith(nc);if(nn&&on)on.replaceWith(nn);}
panel.addEventListener('change',e=>{const t=e.target,d=S.dev[S.sel];
  if(t.dataset.s){const v=t.dataset.s==='siec'?t.value:+t.value;if(t.dataset.s==='siec'||v>0)S.set[t.dataset.s]=v;render();return;}
  const k=t.dataset.k;if(!k||!d||k==='name'||k==='c.P'||k==='c.len'){if(k==='c.P')render();return;}
  if(k==='row'){const r=+t.value;moveDev(d.id,r,S.rows[r].length);S.active=r;render();return;}
  if(k==='rcd'){d.rcd=t.value||null;render();return;}
  setPath(d,k,parseV(t.value));
  if(d.t==='rcbo'||d.t==='mcb'){/* keep values sane */}
  render();});
document.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&S.sel&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();delDev(S.sel);}});
$('#bSample').addEventListener('click',()=>{sample();render();toast('Wczytano przykładowy projekt domu jednorodzinnego');});
$('#bBalance').addEventListener('click',balance);
$('#wireFilter').addEventListener('click',e=>{const b=e.target.closest('[data-wf]');if(b){S.wf[b.dataset.wf]=S.wf[b.dataset.wf]?0:1;render(true);return;}
  if(e.target.closest('[data-wsel]')){S.sel=null;render();}});
$('#viewSeg').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;S.wires=b.dataset.view==='wires';render(true);});
$('#bClear').addEventListener('click',()=>{$('#confirm').hidden=false;});
$('#cNo').addEventListener('click',()=>{$('#confirm').hidden=true;});
$('#cYes').addEventListener('click',()=>{S.rows=S.rows.map(()=>[]);S.dev={};S.sel=null;$('#confirm').hidden=true;render();toast('Obudowa wyczyszczona');});

function boot(){
  if(!load())sample();
  if(S.q===undefined)S.q='';
  try{render();}
  catch(err){console.error(err);sample();try{localStorage.removeItem('rozdz-v1');}catch(e){}render();toast('Zapisany projekt był niezgodny z nową wersją. Wczytano przykład.');}
}
try{boot();}catch(err){document.querySelector('.app').insertAdjacentHTML('afterbegin','<div class="confirm" role="alert">Nie udało się uruchomić projektanta: '+String(err&&err.message||err).replace(/</g,'&lt;')+'</div>');}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{try{if(S&&S.wires)renderBoard();}catch(e){}});
