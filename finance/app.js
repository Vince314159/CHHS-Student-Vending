const KEY='vendingFinanceBoard.v2';
const empty={receipts:[],machines:[],funding:[],monthlyExpenses:[],moneyGained:[]};
const legacy=(()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return {receipts:Array.isArray(raw.receipts)?raw.receipts:[],machines:Array.isArray(raw.machines)?raw.machines:[],funding:Array.isArray(raw.funding)?raw.funding:[]}}catch{return {...empty}}})();
let state={...empty};
let page='home';
const $=s=>document.querySelector(s), main=$('#appMain'), title=$('#pageTitle');
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'No date';
const machineProfit=m=>Number(m.sales||0)-Number(m.refunds||0)-Number(m.cogs||0)-Number(m.processing||0)-Number(m.platform||0)-Number(m.commission||0)-Number(m.maintenance||0)-Number(m.other||0);

/* Quick entries are stored on this device; shared data continues to come from GitHub.
   Stable IDs make later migration into the shared file duplicate-safe. */
const QUICK_KEY='vendingFinanceBoard.quickEntries.v1';
const quick=(()=>{try{const v=JSON.parse(localStorage.getItem(QUICK_KEY)||'{}');return {monthlyExpenses:Array.isArray(v.monthlyExpenses)?v.monthlyExpenses:[],moneyGained:Array.isArray(v.moneyGained)?v.moneyGained:[]}}catch{return {monthlyExpenses:[],moneyGained:[]}}})();
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const uniqueId=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const periods=window.VendingMonths;
const currentState=()=>periods.current(state);
const visibleState=()=>periods.visible(state);
function combineQuick(base){
  const joined={...empty,...base};
  ['receipts','machines','funding','monthlyExpenses','moneyGained'].forEach(k=>{if(!Array.isArray(joined[k]))joined[k]=[]});
  for(const key of ['monthlyExpenses','moneyGained']){
    const ids=new Set(joined[key].map(r=>r.id));
    joined[key]=[...joined[key],...quick[key].filter(r=>!ids.has(r.id))];
  }
  return joined;
}
function cashTotals(){
  const records=visibleState();
  const gained=records.moneyGained.reduce((n,r)=>n+(Number(r.amount)||0),0);
  const spent=records.monthlyExpenses.reduce((n,r)=>n+(Number(r.amount)||0),0);
  return {gained:Math.round(gained*100)/100,spent:Math.round(spent*100)/100,net:Math.round((gained-spent)*100)/100};
}
function metrics(data=state){
 let sales=0,cogs=0,fees=0,profit=0,gross=0;
 data.machines.forEach(m=>{sales+=Number(m.sales)||0;cogs+=Number(m.cogs)||0;fees+=(Number(m.processing)||0)+(Number(m.platform)||0)+(Number(m.commission)||0)+(Number(m.maintenance)||0)+(Number(m.other)||0);gross+=(Number(m.sales)||0)-(Number(m.refunds)||0)-(Number(m.cogs)||0);profit+=machineProfit(m)});
 let funded=0,repaid=0;
 data.funding.forEach(t=>t.type==='funding'?funded+=Number(t.amount)||0:repaid+=Number(t.amount)||0);
 return {sales,cogs,fees,gross,profit,funded,repaid,owed:Math.max(0,funded-repaid),expenses:data.receipts.reduce((a,r)=>a+(Number(r.total)||0),0)};
}
const emptyState=(icon,h,p)=>`<div class="empty"><div class="empty-icon">${icon}</div><h3>${h}</h3><p>${p}</p></div>`;
function cashBanner(){
 const c=cashTotals(),remaining=c.gained>0?Math.min(100,Math.max(0,(c.net/c.gained)*100)):0;
 return `<section class="net-board"><div class="net-line"><div><p class="eyebrow">MONEY MADE AFTER EXPENSES</p><h2 class="${c.net<0?'net-negative':''}">${money(c.net)}</h2><p>Money gained minus monthly expenses</p></div><span class="net-pill">ALL TIME</span></div><div class="net-track" role="progressbar" aria-label="Percentage of gained money remaining after expenses" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(remaining)}"><div style="width:${remaining}%"></div></div><div class="net-numbers"><span>Money gained <strong>${money(c.gained)}</strong></span><span>Expenses <strong>${money(c.spent)}</strong></span></div></section>`;
}
function quickForms(){
 return `<section class="entry-grid"><article class="entry-card"><div class="entry-title"><div class="entry-symbol expense-symbol">−</div><div><h3>Monthly Expenses</h3><p>Add expenses one at a time</p></div></div><form data-quick="expense" class="entry-form"><label for="expenseAmount">Amount ($)</label><input id="expenseAmount" name="amount" type="number" inputmode="decimal" min="0.01" max="999999999" step="0.01" placeholder="0.00" required><input name="note" type="text" maxlength="100" aria-label="Expense description" placeholder="What was it for? (optional)"><button type="submit" class="quick-submit expense-submit">Add expense</button></form></article><article class="entry-card"><div class="entry-title"><div class="entry-symbol gain-symbol">+</div><div><h3>Money Gained</h3><p>Record money received</p></div></div><form data-quick="gain" class="entry-form"><label for="gainAmount">Amount ($)</label><input id="gainAmount" name="amount" type="number" inputmode="decimal" min="0.01" max="999999999" step="0.01" placeholder="0.00" required><input name="note" type="text" maxlength="100" aria-label="Money gained description" placeholder="Source (optional)"><button type="submit" class="quick-submit gain-submit">Add money gained</button></form></article></section><p class="entry-note">Entries made here stay in this browser until exported and shared with ChatGPT. Net money made uses only these two entry categories, so existing machine and receipt records are not counted twice.</p>`;
}
function home(){
 const current=currentState(),m=metrics(current);
 const gross=current.moneyGained.reduce((n,r)=>n+(Number(r.amount)||0),0);
 const expenses=current.monthlyExpenses.reduce((n,r)=>n+(Number(r.amount)||0),0);
 const now=new Date(),defaultName=now.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 const existing=periods.all().filter(x=>x.name===defaultName).length;
 const proposedName=existing?defaultName+' ('+(existing+1)+')':defaultName;
 main.innerHTML=
  cashBanner()+quickForms()+
  '<section class="month-save-section"><div class="month-save-head"><div><h3>Save This Month</h3><p>Archive all current totals and start a fresh Home. Your top lifetime balance never resets.</p></div><span class="month-save-icon">▣</span></div>'+
  '<div class="month-current-summary"><span>Gross gained <b>'+money(gross)+'</b></span><span>Expenses <b>'+money(expenses)+'</b></span><span>Current net <b>'+money(gross-expenses)+'</b></span></div>'+
  '<label for="monthSaveName">Month name</label><div class="month-save-actions"><input type="text" maxlength="80" id="monthSaveName" value="'+esc(proposedName)+'" placeholder="Example: November 2026"><button type="button" id="saveMonthBtn" class="save-month-btn">Save Month</button></div></section>'+
  '<section class="hero"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">CURRENT PERIOD · BUSINESS SNAPSHOT</p><h2>'+money(m.profit)+'</h2><p>Machine operating profit since the last saved month</p></div><div class="period-chip">Current unsaved period</div></div><div class="metric-grid"><div class="metric"><small>Machine Revenue</small><strong>'+money(m.sales)+'</strong><span class="trend">Current period</span></div><div class="metric"><small>Machine Gross Profit</small><strong>'+money(m.gross)+'</strong><span class="trend">After COGS</span></div><div class="metric"><small>Receipts Logged</small><strong>'+money(m.expenses)+'</strong><span class="trend">Current period</span></div><div class="metric"><small>Funding Added</small><strong>'+money(m.funded)+'</strong><span class="trend">Current period</span></div></div></section>'+
  '<section class="section-card"><div class="section-head"><div class="section-title"><span class="badge-icon" style="background:linear-gradient(145deg,#2474ff,#19a4db)">☷</span><div><h3>Activity</h3><p class="subtle">All current entries. Remove an expense or money gained before you save the month.</p></div></div></div>'+recent()+'</section>';
}
function recent(){
 const data=currentState();
 const actions=[
  ...data.receipts.map(r=>({d:r.date,t:r.vendor||'Receipt',s:r.category||'Receipt',a:-(Number(r.total)||0),i:'▤'})),
  ...data.machines.map(m=>({d:m.end,t:m.name||'Machine',s:m.location||'Machine finances',a:machineProfit(m),i:'▣'})),
  ...data.funding.map(t=>({d:t.date,t:t.source||'Funding',s:t.type==='funding'?'Funding received':'Repayment',a:t.type==='funding'?Number(t.amount):-Number(t.amount),i:'$'})),
  ...data.monthlyExpenses.map(r=>({d:r.date,t:r.note||'Expense',s:'Monthly Expenses',a:-(Number(r.amount)||0),i:'−',kind:'monthlyExpenses',id:periods.identity(r),sort:r.createdAt||''})),
  ...data.moneyGained.map(r=>({d:r.date,t:r.note||'Money gained',s:'Money Gained',a:Number(r.amount)||0,i:'+',kind:'moneyGained',id:periods.identity(r),sort:r.createdAt||''}))
 ].filter(x=>x.d).sort((a,b)=>String(b.d+' '+(b.sort||'')).localeCompare(String(a.d+' '+(a.sort||''))));
 if(!actions.length)return emptyState('◎','No current activity','The Home activity resets after each Save Month. All saved history stays in Months.');
 return '<div class="list">'+actions.map(x=>'<div class="list-row"><div class="row-left"><div class="row-icon" style="background:'+(x.a<0?'#fff0f1':'#eef8ff')+';color:'+(x.a<0?'#df3340':'#2474ff')+'">'+x.i+'</div><div class="row-main"><strong>'+esc(x.t)+'</strong><small>'+esc(x.s)+' · '+date(x.d)+'</small></div></div><div class="row-right"><strong style="color:'+(x.a<0?'#d52f3b':'#0a9c59')+'">'+(x.a<0?'-':'+')+money(Math.abs(x.a))+'</strong>'+(x.kind?'<button type="button" class="remove-action" data-remove-kind="'+x.kind+'" data-remove-id="'+esc(x.id)+'" aria-label="Remove '+esc(x.t)+'">Remove</button>':'')+'</div></div>').join('')+'</div>';
}
function receipts(){main.innerHTML=`<section class="hero" style="background:linear-gradient(125deg,#263779,#4d3ec6 52%,#ec4b8f)"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">RECEIPTS & EXPENSES</p><h2>${money(metrics().expenses)}</h2><p>Total saved receipt value</p></div></div><div class="metric-grid"><div class="metric"><small>Receipts</small><strong>${state.receipts.length}</strong><span class="trend">Saved records</span></div><div class="metric"><small>Needs Review</small><strong>${state.receipts.filter(r=>r.status==='needs-review').length}</strong><span class="trend">Check fields</span></div></div></section><section class="section-card"><div class="toolbar"><input id="q" class="search" placeholder="Search vendor, category, note…"><select id="rf" class="select"><option value="all">All</option><option value="reviewed">Reviewed</option><option value="needs-review">Needs review</option></select></div><div id="receiptList">${receiptRows(state.receipts)}</div></section>`;$('#q').oninput=filterReceipts;$('#rf').onchange=filterReceipts}
function filterReceipts(){let q=$('#q').value.toLowerCase(),f=$('#rf').value;$('#receiptList').innerHTML=receiptRows(state.receipts.filter(r=>(!q||`${r.vendor} ${r.category} ${r.notes}`.toLowerCase().includes(q))&&(f==='all'||r.status===f)))}
function receiptRows(rows){if(!rows.length)return emptyState('▤','No receipts yet','No receipt records yet. Ask ChatGPT to add verified receipt records.','receipt','Upload Receipt');return`<div class="list">${[...rows].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="list-row"><div class="row-left"><div class="row-icon" style="background:${r.status==='needs-review'?'#fff5e6':'#ecfbf4'};color:${r.status==='needs-review'?'#e27600':'#0aa45c'}">${r.status==='needs-review'?'!':'✓'}</div><div class="row-main"><strong>${esc(r.vendor)}</strong><small>${date(r.date)} · ${esc(r.category)}</small><div style="margin-top:7px"><span class="pill ${r.status}">${r.status==='needs-review'?'Needs Review':'Reviewed'}</span></div></div></div><div class="row-right"><strong>${money(r.total)}</strong></div></div>`).join('')}</div>`}
function machines(){let m=metrics();main.innerHTML=`<section class="hero" style="background:linear-gradient(120deg,#253274,#353895 52%,#7c35b6)"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">MACHINE PERFORMANCE</p><h2>${money(m.profit)}</h2><p>Operating profit from all recorded periods</p></div></div><div class="metric-grid"><div class="metric"><small>Gross Sales</small><strong>${money(m.sales)}</strong><span class="trend">Before refunds</span></div><div class="metric"><small>COGS</small><strong>${money(m.cogs)}</strong><span class="trend">Product cost sold</span></div><div class="metric"><small>Fees & Costs</small><strong>${money(m.fees)}</strong><span class="trend">Operating costs</span></div><div class="metric"><small>Gross Profit</small><strong>${money(m.gross)}</strong><span class="trend">After COGS</span></div></div></section><section class="section-card"><div class="section-head"><div class="section-title"><span class="badge-icon" style="background:linear-gradient(145deg,#00b5d8,#2475ff)">▣</span><div><h3>Machine Records</h3><p class="subtle">One record per reporting period</p></div></div></div>${machineRows()}</section>`}
function machineRows(){if(!state.machines.length)return emptyState('▣','No machine periods yet','Record sales, COGS, processing fees, commissions and other costs. Profit is calculated automatically.','machine','Record Machine Period');return[...state.machines].sort((a,b)=>b.end.localeCompare(a.end)).map(m=>`<article class="machine-card"><div class="machine-top"><div><h3 style="margin:0">${esc(m.name)}</h3><p class="subtle">${esc(m.location||'No location')} · ${date(m.start)} → ${date(m.end)}</p></div><div class="row-right"><small>Operating Profit</small><div class="machine-profit" style="color:${machineProfit(m)>=0?'#0a9c59':'#d62f3c'}">${money(machineProfit(m))}</div></div></div><div class="mini-grid"><div class="mini-box"><span>Gross Sales</span><strong>${money(m.sales)}</strong></div><div class="mini-box"><span>COGS</span><strong>${money(m.cogs)}</strong></div><div class="mini-box"><span>Fees + Commission</span><strong>${money((+m.processing||0)+(+m.platform||0)+(+m.commission||0)+(+m.maintenance||0)+(+m.other||0))}</strong></div><div class="mini-box"><span>Refunds</span><strong>${money(m.refunds)}</strong></div></div></article>`).join('')}
function funding(){let m=metrics(),pct=m.funded?Math.min(100,Math.round(m.repaid/m.funded*100)):0;main.innerHTML=`<section class="funding-hero"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">FUNDING & PAYBACK</p><h2 style="margin:6px 0 4px;font-size:31px">${money(m.owed)}</h2><p style="color:#ffffffbf">Remaining balance</p></div><div class="period-chip">${pct}% repaid</div></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="stats-line"><div><span>Total Funding</span><strong>${money(m.funded)}</strong></div><div><span>Total Repaid</span><strong>${money(m.repaid)}</strong></div></div></section><section class="section-card"><div class="section-head"><div class="section-title"><span class="badge-icon" style="background:linear-gradient(145deg,#17b475,#28caa1)">↺</span><div><h3>Funding Ledger</h3><p class="subtle">Funding and repayment history</p></div></div></div>${fundRows()}</section>`}
function fundRows(){if(!state.funding.length)return emptyState('$','No funding records yet','Record the actual money contributed or loaned to the vending operation.','funding','Add Funding');return`<div class="list">${[...state.funding].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<div class="list-row"><div class="row-left"><div class="row-icon" style="background:${t.type==='funding'?'#eef6ff':'#f3edff'};color:${t.type==='funding'?'#2574f5':'#7c41e9'}">${t.type==='funding'?'+':'−'}</div><div class="row-main"><strong>${esc(t.source)}</strong><small>${date(t.date)} · ${t.type==='funding'?'Funding received':'Repayment'}</small>${t.notes?`<small>${esc(t.notes)}</small>`:''}</div></div><div class="row-right"><strong>${t.type==='funding'?'+':'−'}${money(t.amount)}</strong></div></div>`).join('')}</div>`}
function monthlyExpenses(){
 const records=[...visibleState().monthlyExpenses].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
 const month=localDate().slice(0,7),groups=new Map();
 for(const record of records){const key=String(record.date||'').slice(0,7)||'Unknown';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record)}
 const total=records.reduce((sum,r)=>sum+(Number(r.amount)||0),0);
 const current=(currentState().monthlyExpenses).reduce((sum,r)=>sum+(Number(r.amount)||0),0);
 const pretty=k=>/^\d{4}-\d{2}$/.test(k)?new Date(k+'-01T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}):'Undated';
 const expenseHistory=records.length?[...groups].map(([key,items])=>'<div class="expense-month"><div class="expense-month-title"><h3>'+esc(pretty(key))+'</h3><strong>'+money(items.reduce((n,r)=>n+(Number(r.amount)||0),0))+'</strong></div><div class="list">'+items.map(r=>{
  const archived=periods.isArchived('monthlyExpenses',r);
  return '<div class="list-row"><div class="row-left"><div class="row-icon expense-row-icon">−</div><div class="row-main"><strong>'+esc(r.note||'Expense')+'</strong><small>'+date(r.date)+(archived?' · Saved month':' · Current period')+'</small></div></div><div class="row-right"><strong>−'+money(r.amount)+'</strong>'+(archived?'<small>Archived</small>':'<button type="button" class="remove-action" data-remove-kind="monthlyExpenses" data-remove-id="'+esc(periods.identity(r))+'">Remove</button>')+'</div></div>'
 }).join('')+'</div></div>').join(''):emptyState('▤','No monthly expenses yet','Add expenses from Home. Archived entries remain visible here.');
 main.innerHTML='<section class="hero monthly-hero"><div class="hero-top"><div><p class="eyebrow" style="color:#ffffffaa">MONTHLY EXPENSES</p><h2>'+money(current)+'</h2><p>Unsaved expenses for this period</p></div><div class="period-chip">'+records.length+' recorded</div></div><div class="metric-grid"><div class="metric"><small>Lifetime Expenses</small><strong>'+money(total)+'</strong><span class="trend">Includes archived</span></div><div class="metric"><small>Current Period</small><strong>'+money(current)+'</strong><span class="trend">Resets after Save Month</span></div></div></section><section class="section-card"><div class="section-head"><div class="section-title"><div><h3>Expense History</h3><p class="subtle">All expenses, including saved months</p></div></div></div>'+expenseHistory+'</section><section class="section-card"><h3>Export Finance History</h3><p class="subtle">Download this browser’s entries, saved months and removals so ChatGPT can update the shared records.</p><button id="exportQuickEntries" class="export-entries" type="button">Export Entries + Months</button></section>';
}
function months(){
 const archives=periods.all();
 const renderEntries=(list,label,amountField)=>!(list||[]).length?'':'<div class="archived-entry-group"><h4>'+label+'</h4>'+(list||[]).map(x=>'<div class="archive-line"><span>'+esc(x.note||x.name||x.vendor||x.source||label.replace(/s$/,''))+' <small>'+esc(x.date||x.end||'')+'</small></span><b>'+money(amountField==='total'?x.total:amountField==='sales'?x.sales:x.amount)+'</b></div>').join('')+'</div>';
 main.innerHTML='<section class="months-header"><p class="eyebrow">PERMANENT HISTORY</p><h2>Saved Months</h2><p>Every saved month stays here permanently. Open a month to inspect its snapshot, or rename it.</p><div class="months-count">'+archives.length+' saved month'+(archives.length===1?'':'s')+'</div></section>'+
 (archives.length?'<div class="month-archive-list">'+archives.map(m=>{
  const t=m.totals||{}, e=m.entries||{},profit=(Number(t.machineGross)||0)-(Number(t.machineCosts)||0);
  return '<details class="month-archive-card"><summary><div><span class="month-archive-date">'+esc(String(m.savedAt||'').slice(0,10))+'</span><h3>'+esc(m.name||'Unnamed Month')+'</h3><p>Gross '+money(t.grossGained)+' · Expenses '+money(t.expenses)+'</p></div><div class="month-archive-net"><strong>'+money(t.net)+'</strong><span>Net · View details</span></div></summary><div class="month-detail"><div class="month-figures">'+
    '<div><small>Gross Money Gained</small><strong>'+money(t.grossGained)+'</strong></div><div><small>Monthly Expenses</small><strong>'+money(t.expenses)+'</strong></div><div><small>Net for This Month</small><strong>'+money(t.net)+'</strong></div><div><small>Machine Gross Sales</small><strong>'+money(t.machineGross)+'</strong></div><div><small>Machine Operating Profit</small><strong>'+money(profit)+'</strong></div><div><small>Receipt Expenses Logged</small><strong>'+money(t.receipts)+'</strong></div><div><small>Funding Added</small><strong>'+money(t.funding)+'</strong></div><div><small>Funding Repayments</small><strong>'+money(t.repayments)+'</strong></div></div>'+
   '<p class="archive-explanation">Net = money gained − monthly expenses. Separate machine and receipt totals are shown for context, not counted twice.</p>'+
   renderEntries(e.moneyGained,'Money Gained','amount')+renderEntries(e.monthlyExpenses,'Expenses','amount')+renderEntries(e.machines,'Machine Records','sales')+renderEntries(e.receipts,'Receipts','total')+renderEntries(e.funding,'Funding Records','amount')+
   '<button type="button" class="rename-month-btn" data-rename-month="'+esc(m.id)+'">Rename Month</button></div></details>'
 }).join('')+'</div>':emptyState('▣','No saved months yet','Use Save Month on Home once you have entries. Previous saved months will never be deleted automatically.'))+
 '<section class="section-card"><h3>Keep a Backup</h3><p class="subtle">Months saved here are stored in this browser. Export them if you want ChatGPT to manage or back them up across devices.</p><button id="exportQuickEntries" class="export-entries" type="button">Export Entries + Months</button></section>';
}
function render(){
 const names={home:'Home',receipts:'Receipts',machines:'Machines',funding:'Funding',monthly:'Monthly Expenses',months:'Months'};
 title.textContent=names[page]||'Home';
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 ( {home,receipts,machines,funding,monthly:monthlyExpenses,months}[page]||home )();
}
/* ChatGPT manages shared data through GitHub; the two requested entry forms save locally. */
const recordCount=data=>['receipts','machines','funding','monthlyExpenses','moneyGained'].reduce((n,key)=>n+(Array.isArray(data?.[key])?data[key].length:0),0);
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

document.addEventListener('submit',e=>{
  const form=e.target.closest('form[data-quick]');if(!form)return;
  e.preventDefault();
  const key=form.dataset.quick==='expense'?'monthlyExpenses':'moneyGained';
  const d=new FormData(form),amount=Math.round(Number(d.get('amount'))*100)/100;
  if(!Number.isFinite(amount)||amount<=0||amount>999999999){alert('Enter an amount greater than $0.');return}
  const entry={id:uniqueId(),date:localDate(),amount,note:String(d.get('note')||'').trim().slice(0,100),createdAt:new Date().toISOString()};
  const newer={monthlyExpenses:[...quick.monthlyExpenses],moneyGained:[...quick.moneyGained]};
  newer[key].push(entry);
  try{localStorage.setItem(QUICK_KEY,JSON.stringify(newer))}catch{alert('Could not save on this device. Check browser storage settings.');return}
  quick[key]=newer[key];
  state=combineQuick(state);
  render();
  notice('Entry saved in this browser. Review Activity or save this month; export history to share with ChatGPT.','warning',recordCount(legacy)>0);
});
function downloadFinanceHistory(){
  const hidden=periods.removed();
  const validEntries={
    monthlyExpenses:quick.monthlyExpenses.filter(r=>!hidden.monthlyExpenses.includes(periods.identity(r))),
    moneyGained:quick.moneyGained.filter(r=>!hidden.moneyGained.includes(periods.identity(r)))
  };
  const blob=new Blob([JSON.stringify({schemaVersion:2,exportedAt:new Date().toISOString(),...validEntries,...periods.export()},null,2)],{type:'application/json'});
  const link=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=link;a.download='vending-finance-backup-'+localDate()+'.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(link),1000);
}
document.addEventListener('click',e=>{
  if(e.target.closest('#exportQuickEntries'))downloadFinanceHistory();
});

document.addEventListener('click',event=>{
 const remove=event.target.closest('[data-remove-kind][data-remove-id]');
 if(remove){
   const kind=remove.dataset.removeKind,id=remove.dataset.removeId;
   const entry=(state[kind]||[]).find(r=>periods.identity(r)===id);
   if(!entry)return;
   if(periods.isArchived(kind,entry)){alert('Saved months are preserved. This archived entry cannot be removed here.');return}
   if(!confirm('Remove this '+(kind==='monthlyExpenses'?'expense':'money gained')+' entry of '+money(entry.amount)+'? This will update your lifetime balance.'))return;
   try{periods.remove(kind,id)}catch{alert('Could not save the removal. Check browser storage.');return}
   render();
   notice('Entry removed from this browser view. Export history to reconcile any GitHub copies.','warning',recordCount(legacy)>0);
   return;
 }
 const save=event.target.closest('#saveMonthBtn');
 if(save){
   const name=String($('#monthSaveName')?.value||'').trim();
   if(!name){alert('Give the month a name before saving.');return}
   if(!confirm('Save "'+name+'" to Months and reset the current Home figures? Your all-time money bar will not reset.'))return;
   try{const saved=periods.create(state,name);
     let backupDownloaded=false;
     try{downloadFinanceHistory();backupDownloaded=true}catch(error){/* Month still saved; export can be retried from Months. */}
     render();
     notice('Saved "'+saved.name+'" in Months. Home reset; the lifetime money bar was preserved.'+(backupDownloaded?' A finance backup was downloaded.':' Use Export Entries + Months to create a backup.'),'warning',recordCount(legacy)>0);
   }catch(err){alert(err.message||'Could not save the month.')}
   return;
 }
 const rename=event.target.closest('[data-rename-month]');
 if(rename){
   const month=periods.all().find(m=>String(m.id)===rename.dataset.renameMonth);
   if(!month)return;
   const newName=prompt('Rename saved month:',month.name||'');
   if(newName===null)return;
   try{periods.rename(month.id,newName);render()}catch(err){alert(err.message||'Could not rename month.')}
 }
});

async function init(){
  notice('Loading financial records from GitHub…');
  try{
    const response=await fetch('./data.json?refresh='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('GitHub data request failed');
    const shared=await response.json();
    if(!shared||!['receipts','machines','funding'].every(key=>Array.isArray(shared[key])))throw new Error('Invalid finance data');
    periods.setShared(shared.savedMonths);
    const hasShared=recordCount(shared)>0;
    const hasLegacy=recordCount(legacy)>0;
    state=combineQuick(hasShared?shared:hasLegacy?legacy:shared);
    if(hasLegacy&&!hasShared){
      notice('Showing older records saved only in this browser. They are not synced across devices. Download the backup and upload it in ChatGPT to migrate them.','warning',true);
    }else if(hasLegacy){
      notice('Showing the GitHub-managed board. This browser also has older records that have not been merged. Download the legacy backup to review them.','warning',true);
    }else if(!hasShared){
      notice(recordCount(quick)>0?'Showing quick entries stored in this browser. Export them to share with ChatGPT.':'No shared financial records yet. Add quick entries here or ask ChatGPT to update shared records.',recordCount(quick)>0?'warning':'info');
    }else{
      const stamp=shared.updatedAt&&!Number.isNaN(Date.parse(shared.updatedAt))?' · Last data update '+new Date(shared.updatedAt).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}):'';
      notice('Showing GitHub-managed financial records'+stamp+'. New quick entries are saved in this browser.','success');
    }
    render();
  }catch(error){
    if(recordCount(legacy)>0||recordCount(quick)>0){
      state=combineQuick(recordCount(legacy)>0?legacy:empty);
      notice('GitHub records could not be loaded. Showing only records saved in this browser; totals may be incomplete.','warning',recordCount(legacy)>0);
      render();
    }else{
      notice('Unable to load finance data from GitHub. Refresh the page to retry; no financial totals are being shown.','error');
      main.innerHTML='<section class="section-card"><div class="empty"><h3>Finance data unavailable</h3><p>We could not load the shared financial records. No amounts are displayed to avoid misleading totals.</p></div></section>';
      document.querySelectorAll('.nav-item').forEach(button=>button.disabled=true);
    }
  }
}
init();
