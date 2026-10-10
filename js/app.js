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

/* ---------- plik projektu (.rozdz.json) ---------- */
function fileName(){return (S.name||'').replace(/[\\/:*?"<>|]+/g,' ').trim().slice(0,60)||'projekt';}
function exportData(){const o={app:FILE_APP,version:FILE_VERSION,saved:new Date().toISOString(),uid:uid,S:{}};DATA_KEYS.forEach(k=>o.S[k]=S[k]);return o;}
function saveFile(){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,1)],{type:'application/json'}));
  a.href=url;a.download=fileName()+'.rozdz.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Zapisano plik '+a.download);}
/* Zwraca '' albo komunikat błędu. Poprawny plik staje się nowym projektem na liście (niczego nie nadpisuje). */
function importData(text){let j;try{j=JSON.parse(text);}catch(e){return 'Plik nie jest poprawnym plikiem JSON.';}
  if(!j||j.app!==FILE_APP)return 'To nie jest plik Projektanta Rozdzielnic.';
  if(!(j.version>=1))return 'Plik nie ma numeru wersji.';
  if(j.version>FILE_VERSION)return 'Plik pochodzi z nowszej wersji aplikacji (wersja pliku '+j.version+').';
  if(!valid(j.S))return 'Plik projektu jest uszkodzony lub niepełny.';
  /* migracje starszych wersji pliku: tutaj, gdy FILE_VERSION wzrośnie */
  projAdd(j.S,j.uid);return '';}

/* ---------- lista projektów ---------- */
function projUse(p){PR.cur=p.id;S=normalize(p.S);uid=fixUid(S,p.uid);histReset();$('#confirm').hidden=true;render();}
function projAdd(s,u){save();const p={id:pid(),S:s,uid:u};PR.list.push(p);projUse(p);}
function projDup(){projAdd(Object.assign(JSON.parse(JSON.stringify(S)),{name:S.name+' (kopia)'}),uid);toast('Utworzono kopię projektu');}
function projDel(){ask('Usunąć projekt „'+S.name+'” z tej przeglądarki? Tej operacji nie można cofnąć. Kopię możesz wcześniej pobrać przyciskiem „Zapisz projekt”.','Usuń projekt',()=>{
  PR.list=PR.list.filter(x=>x.id!==PR.cur);if(!PR.list.length)PR.list.push({id:pid(),S:blankS(),uid:1});projUse(PR.list[0]);toast('Projekt usunięty');});}
$('#projSel').addEventListener('change',e=>{const p=PR.list.find(x=>x.id===e.target.value);if(p){save();projUse(p);}});
$('#bNew').addEventListener('click',()=>{projAdd(blankS(),1);toast('Utworzono pusty projekt');});
$('#bDup').addEventListener('click',projDup);
$('#bDel').addEventListener('click',projDel);
/* Potwierdzenie na stronie zamiast confirm(): komunikat, etykieta przycisku, akcja. */
let askFn=null;
function ask(msg,yes,fn){$('#cMsg').textContent=msg;$('#cYes').textContent=yes;askFn=fn;$('#confirm').hidden=false;}
function readFile(f){if(!f)return;const r=new FileReader();
  r.onload=()=>{const err=importData(String(r.result));toast(err||'Wczytano projekt „'+S.name+'”');};
  r.onerror=()=>toast('Nie udało się odczytać pliku.');r.readAsText(f);}
$('#bSave').addEventListener('click',saveFile);
$('#bOpen').addEventListener('click',()=>$('#fOpen').click());
$('#fOpen').addEventListener('change',e=>{readFile(e.target.files[0]);e.target.value='';});
const hasFiles=e=>!!e.dataTransfer&&Array.prototype.indexOf.call(e.dataTransfer.types||[],'Files')>=0;
document.addEventListener('dragover',e=>{if(hasFiles(e))e.preventDefault();});
document.addEventListener('drop',e=>{if(!hasFiles(e))return;e.preventDefault();readFile(e.dataTransfer.files[0]);});

/* ---------- events ---------- */
$('#pname').addEventListener('input',e=>{S.name=e.target.value;histTag='pname';save();renderTop();});
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
  if(t.dataset.k==='name'&&d){d.name=t.value;histTag='name:'+d.id;render(true);return;}
  if(t.dataset.k==='c.P'&&d){d.c.P=Math.max(0,+t.value||0);histTag='P:'+d.id;render(true);updCalc();return;}
  if(t.dataset.k==='c.len'&&d){d.c.len=Math.max(0,+t.value||0);histTag='len:'+d.id;save();renderTop();return;}});
function updCalc(){const d=S.dev[S.sel];if(!d)return;const c=panel.querySelector('.calc');if(!c)return;const tmp=document.createElement('div');tmp.innerHTML=panelDev();const nc=tmp.querySelector('.calc'),nn=tmp.querySelector('.calc + .note'),on=panel.querySelector('.calc + .note');if(nc)c.replaceWith(nc);if(nn&&on)on.replaceWith(nn);}
panel.addEventListener('change',e=>{const t=e.target,d=S.dev[S.sel];
  if(t.dataset.s){const v=t.dataset.s==='siec'?t.value:+t.value;if(t.dataset.s==='siec'||v>0)S.set[t.dataset.s]=v;render();return;}
  const k=t.dataset.k;if(!k||!d||k==='name'||k==='c.P'||k==='c.len'){if(k==='c.P')render();return;}
  if(k==='row'){const r=+t.value;moveDev(d.id,r,S.rows[r].length);S.active=r;render();return;}
  if(k==='rcd'){d.rcd=t.value||null;render();return;}
  setPath(d,k,parseV(t.value));
  if(d.t==='rcbo'||d.t==='mcb'){/* keep values sane */}
  render();});
document.addEventListener('keydown',e=>{const inField=/INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!inField){const k=e.key.toLowerCase();if(k==='z'||k==='y'){e.preventDefault();if(k==='y'||e.shiftKey)redo();else undo();return;}}
  if((e.key==='Delete'||e.key==='Backspace')&&S.sel&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();delDev(S.sel);}});
$('#bSample').addEventListener('click',()=>{sample();render();toast('Wczytano przykładowy projekt domu jednorodzinnego');});
$('#bBalance').addEventListener('click',balance);
$('#bPrint').addEventListener('click',printView);
window.addEventListener('afterprint',()=>{const pv=$('#print');if(pv)pv.innerHTML='';});
$('#bUndo').addEventListener('click',undo);
$('#bRedo').addEventListener('click',redo);
$('#wireFilter').addEventListener('click',e=>{const b=e.target.closest('[data-wf]');if(b){S.wf[b.dataset.wf]=S.wf[b.dataset.wf]?0:1;render(true);return;}
  if(e.target.closest('[data-wsel]')){S.sel=null;render();}});
$('#viewSeg').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;S.wires=b.dataset.view==='wires';render(true);});
$('#bClear').addEventListener('click',()=>ask('Usunąć wszystkie aparaty z obudowy?','Usuń wszystko',()=>{S.rows=S.rows.map(()=>[]);S.dev={};S.sel=null;render();toast('Obudowa wyczyszczona');}));
$('#cNo').addEventListener('click',()=>{askFn=null;$('#confirm').hidden=true;});
$('#cYes').addEventListener('click',()=>{const fn=askFn;askFn=null;$('#confirm').hidden=true;if(fn)fn();});

function boot(){
  if(!load()){sample();PR.list=[{id:pid(),S:S,uid:uid}];PR.cur=PR.list[0].id;}
  histReset();
  try{render();}
  catch(err){console.error(err);sample();histReset();render();toast('Zapisany projekt był niezgodny z nową wersją. Wczytano przykład.');}
}
try{boot();}catch(err){document.querySelector('.app').insertAdjacentHTML('afterbegin','<div class="confirm" role="alert">Nie udało się uruchomić projektanta: '+String(err&&err.message||err).replace(/</g,'&lt;')+'</div>');}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{try{if(S&&S.wires)renderBoard();}catch(e){}});
