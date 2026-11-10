const KEY='vendingFinanceBoard.v2';
const empty={receipts:[],machines:[],funding:[]};
const legacy=(()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return {receipts:Array.isArray(raw.receipts)?raw.receipts:[],machines:Array.isArray(raw.machines)?raw.machines:[],funding:Array.isArray(raw.funding)?raw.funding:[]}}catch{return {...empty}}})();
let state={...empty};
let page='home';
const $=s=>document.querySelector(s), main=$('#appMain'), title=$('#pageTitle');
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'No date';
const machineProfit=m=>Number(m.sales||0)-Number(m.refunds||0)-Number(m.cogs||0)-Number(m.processing||0)-Number(m.platform||0)-Number(m.commission||0)-Number(m.maintenance||0)-Number(m.other||0);
function metrics(){let sales=0,cogs=0,fees=0,profit=0,gross=0;state.machines.forEach(m=>{sales+=+m.sales||0;cogs+=+m.cogs||0;fees+=(+m.processing||0)+(+m.platform||0)+(+m.commission||0)+(+m.maintenance||0)+(+m.other||0);gross+=(+m.sales||0)-(+m.refunds||0)-(+m.cogs||0);profit+=machineProfit(m)});let funded=0,repaid=0;state.funding.forEach(t=>t.type==='funding'?funded+=+t.amount:repaid+=+t.amount);return{sales,cogs,fees,gross,profit,funded,repaid,owed:Math.max(0,funded-repaid),expenses:state.receipts.reduce((a,r)=>a+(+r.total||0),0)}}
const emptyState=(icon,h,p)=>`<div class="empty"><div class="empty-icon">${icon}</div><h3>${h}</h3><p>${p}</p></div>`;
function home(){let m=metrics();main.innerHTML=`<section class="hero"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">BUSINESS SNAPSHOT</p><h2>${money(m.profit)}</h2><p>Operating profit from recorded machine periods</p></div><div class="period-chip">All recorded periods</div></div><div class="metric-grid"><div class="metric"><small>Revenue</small><strong>${money(m.sales)}</strong><span class="trend">Recorded sales</span></div><div class="metric"><small>Gross Profit</small><strong>${money(m.gross)}</strong><span class="trend">After COGS</span></div><div class="metric"><small>Expenses Logged</small><strong>${money(m.expenses)}</strong><span class="trend">Receipt records</span></div><div class="metric"><small>Amount Owed</small><strong>${money(m.owed)}</strong><span class="trend">Funding balance</span></div></div></section><section class="section-card"><div class="section-head"><div class="section-title"><span class="badge-icon" style="background:linear-gradient(145deg,#2474ff,#19a4db)">☷</span><div><h3>Recent Activity</h3><p class="subtle">Newest financial records</p></div></div></div>${recent()}</section>`}
function recent(){let a=[...state.receipts.map(r=>({d:r.date,t:r.vendor,s:r.category,a:-r.total,i:'▤'})),...state.machines.map(m=>({d:m.end,t:m.name,s:m.location||'Machine finances',a:machineProfit(m),i:'▣'})),...state.funding.map(t=>({d:t.date,t:t.source,s:t.type==='funding'?'Funding received':'Repayment',a:t.type==='funding'?+t.amount:-t.amount,i:'$'}))].filter(x=>x.d).sort((a,b)=>b.d.localeCompare(a.d)).slice(0,7);if(!a.length)return emptyState('◎','No financial activity yet','Your real receipts, machine periods, funding and repayments will appear here.');return`<div class="list">${a.map(x=>`<div class="list-row"><div class="row-left"><div class="row-icon" style="background:${x.a<0?'#fff0f1':'#eef8ff'};color:${x.a<0?'#df3340':'#2474ff'}">${x.i}</div><div class="row-main"><strong>${esc(x.t)}</strong><small>${esc(x.s)} · ${date(x.d)}</small></div></div><div class="row-right"><strong style="color:${x.a<0?'#d52f3b':'#0a9c59'}">${x.a<0?'-':'+'}${money(Math.abs(x.a))}</strong></div></div>`).join('')}</div>`}
function receipts(){main.innerHTML=`<section class="hero" style="background:linear-gradient(125deg,#263779,#4d3ec6 52%,#ec4b8f)"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">RECEIPTS & EXPENSES</p><h2>${money(metrics().expenses)}</h2><p>Total saved receipt value</p></div></div><div class="metric-grid"><div class="metric"><small>Receipts</small><strong>${state.receipts.length}</strong><span class="trend">Saved records</span></div><div class="metric"><small>Needs Review</small><strong>${state.receipts.filter(r=>r.status==='needs-review').length}</strong><span class="trend">Check fields</span></div></div></section><section class="section-card"><div class="toolbar"><input id="q" class="search" placeholder="Search vendor, category, note…"><select id="rf" class="select"><option value="all">All</option><option value="reviewed">Reviewed</option><option value="needs-review">Needs review</option></select></div><div id="receiptList">${receiptRows(state.receipts)}</div></section>`;$('#q').oninput=filterReceipts;$('#rf').onchange=filterReceipts}
function filterReceipts(){let q=$('#q').value.toLowerCase(),f=$('#rf').value;$('#receiptList').innerHTML=receiptRows(state.receipts.filter(r=>(!q||`${r.vendor} ${r.category} ${r.notes}`.toLowerCase().includes(q))&&(f==='all'||r.status===f)))}
function receiptRows(rows){if(!rows.length)return emptyState('▤','No receipts yet','Upload your first real receipt. The receipt date—not upload time—drives the history.','receipt','Upload Receipt');return`<div class="list">${[...rows].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="list-row"><div class="row-left"><div class="row-icon" style="background:${r.status==='needs-review'?'#fff5e6':'#ecfbf4'};color:${r.status==='needs-review'?'#e27600':'#0aa45c'}">${r.status==='needs-review'?'!':'✓'}</div><div class="row-main"><strong>${esc(r.vendor)}</strong><small>${date(r.date)} · ${esc(r.category)}</small><div style="margin-top:7px"><span class="pill ${r.status}">${r.status==='needs-review'?'Needs Review':'Reviewed'}</span></div></div></div><div class="row-right"><strong>${money(r.total)}</strong></div></div>`).join('')}</div>`}
function machines(){let m=metrics();main.innerHTML=`<section class="hero" style="background:linear-gradient(120deg,#253274,#353895 52%,#7c35b6)"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">MACHINE PERFORMANCE</p><h2>${money(m.profit)}</h2><p>Operating profit from all recorded periods</p></div></div><div class="metric-grid"><div class="metric"><small>Gross Sales</small><strong>${money(m.sales)}</strong><span class="trend">Before refunds</span></div><div class="metric"><small>COGS</small><strong>${money(m.cogs)}</strong><span class="trend">Product cost sold</span></div><div class="metric"><small>Fees & Costs</small><strong>${money(m.fees)}</strong><span class="trend">Operating costs</span></div><div class="metric"><small>Gross Profit</small><strong>${money(m.gross)}</strong><span class="trend">After COGS</span></div></div></section><section class="section-card"><div class="section-head"><div class="section-title"><span class="badge-icon" style="background:linear-gradient(145deg,#00b5d8,#2475ff)">▣</span><div><h3>Machine Records</h3><p class="subtle">One record per reporting period</p></div></div></div>${machineRows()}</section>`}
function machineRows(){if(!state.machines.length)return emptyState('▣','No machine periods yet','Record sales, COGS, processing fees, commissions and other costs. Profit is calculated automatically.','machine','Record Machine Period');return[...state.machines].sort((a,b)=>b.end.localeCompare(a.end)).map(m=>`<article class="machine-card"><div class="machine-top"><div><h3 style="margin:0">${esc(m.name)}</h3><p class="subtle">${esc(m.location||'No location')} · ${date(m.start)} → ${date(m.end)}</p></div><div class="row-right"><small>Operating Profit</small><div class="machine-profit" style="color:${machineProfit(m)>=0?'#0a9c59':'#d62f3c'}">${money(machineProfit(m))}</div></div></div><div class="mini-grid"><div class="mini-box"><span>Gross Sales</span><strong>${money(m.sales)}</strong></div><div class="mini-box"><span>COGS</span><strong>${money(m.cogs)}</strong></div><div class="mini-box"><span>Fees + Commission</span><strong>${money((+m.processing||0)+(+m.platform||0)+(+m.commission||0)+(+m.maintenance||0)+(+m.other||0))}</strong></div><div class="mini-box"><span>Refunds</span><strong>${money(m.refunds)}</strong></div></div></article>`).join('')}
function funding(){let m=metrics(),pct=m.funded?Math.min(100,Math.round(m.repaid/m.funded*100)):0;main.innerHTML=`<section class="funding-hero"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">FUNDING & PAYBACK</p><h2 style="margin:6px 0 4px;font-size:31px">${money(m.owed)}</h2><p style="color:#ffffffbf">Remaining balance</p></div><div class="period-chip">${pct}% repaid</div></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="stats-line"><div><span>Total Funding</span><strong>${money(m.funded)}</strong></div><div><span>Total Repaid</span><strong>${money(m.repaid)}</strong></div></div></section><section class="section-card"><div class="section-head"><div class="section-title"><span class="badge-icon" style="background:linear-gradient(145deg,#17b475,#28caa1)">↺</span><div><h3>Funding Ledger</h3><p class="subtle">Funding and repayment history</p></div></div></div>${fundRows()}</section>`}
function fundRows(){if(!state.funding.length)return emptyState('$','No funding records yet','Record the actual money contributed or loaned to the vending operation.','funding','Add Funding');return`<div class="list">${[...state.funding].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<div class="list-row"><div class="row-left"><div class="row-icon" style="background:${t.type==='funding'?'#eef6ff':'#f3edff'};color:${t.type==='funding'?'#2574f5':'#7c41e9'}">${t.type==='funding'?'+':'−'}</div><div class="row-main"><strong>${esc(t.source)}</strong><small>${date(t.date)} · ${t.type==='funding'?'Funding received':'Repayment'}</small>${t.notes?`<small>${esc(t.notes)}</small>`:''}</div></div><div class="row-right"><strong>${t.type==='funding'?'+':'−'}${money(t.amount)}</strong></div></div>`).join('')}</div>`}
function render(){title.textContent=page[0].toUpperCase()+page.slice(1);document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));({home,receipts,machines,funding}[page])()}

/* Finance data is managed through GitHub commits made from authorized ChatGPT sessions.
   No browser forms can modify the shared ledger. */
const recordCount=data=>['receipts','machines','funding'].reduce((n,key)=>n+(Array.isArray(data?.[key])?data[key].length:0),0);
function notice(message,kind='info',allowBackup=false){
  const el=$('#dataNotice');
  if(!el)return;
  el.className='sync-notice visible '+kind;
  el.replaceChildren();
  const label=document.createElement('span');
  label.textContent=message;
  el.append(label);
  if(allowBackup){
    const b=document.createElement('button');
    b.type='button';
    b.className='backup-btn';
    b.textContent='Download legacy backup';
    b.addEventListener('click',()=>{
      const blob=new Blob([JSON.stringify(legacy,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='vending-finance-legacy-backup.json';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    el.append(b);
  }
}
document.addEventListener('click',event=>{
  const navigation=event.target.closest('[data-page]');
  if(navigation){
    page=navigation.dataset.page;
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
});
async function init(){
  notice('Loading financial records from GitHub…');
  try{
    const response=await fetch('./data.json?refresh='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('GitHub data request failed');
    const shared=await response.json();
    if(!shared||!['receipts','machines','funding'].every(key=>Array.isArray(shared[key])))throw new Error('Invalid finance data');
    const hasShared=recordCount(shared)>0;
    const hasLegacy=recordCount(legacy)>0;
    state=hasShared?shared:hasLegacy?legacy:shared;
    if(hasLegacy&&!hasShared){
      notice('Showing older records saved only in this browser. They are not synced across devices. Download the backup and upload it in ChatGPT to migrate them.','warning',true);
    }else if(hasLegacy){
      notice('Showing the GitHub-managed board. This browser also has older records that have not been merged. Download the legacy backup to review them.','warning',true);
    }else if(!hasShared){
      notice('No shared financial records yet. Tell ChatGPT what to add; this page is view-only.','info');
    }else{
      const stamp=shared.updatedAt&&!Number.isNaN(Date.parse(shared.updatedAt))?' · Last data update '+new Date(shared.updatedAt).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}):'';
      notice('Showing GitHub-managed financial records'+stamp+'.','success');
    }
    render();
  }catch(error){
    if(recordCount(legacy)>0){
      state=legacy;
      notice('GitHub data could not be loaded. Showing only this browser’s legacy records. These are not synced.','warning',true);
      render();
    }else{
      notice('Unable to load finance data from GitHub. Refresh the page to retry; no financial totals are being shown.','error');
      main.innerHTML='<section class="section-card"><div class="empty"><h3>Finance data unavailable</h3><p>We could not load the shared financial records. No amounts are displayed to avoid misleading totals.</p></div></section>';
      document.querySelectorAll('.nav-item').forEach(button=>button.disabled=true);
    }
  }
}
init();
