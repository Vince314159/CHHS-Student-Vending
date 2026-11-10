/* Month archive and removal overlays for the CHHS finance board.
   GitHub Pages is static: these changes persist only in this browser until exported. */
(function(root){
  'use strict';
  const STORE='vendingFinanceBoard.savedMonths.v1';
  const KINDS=['monthlyExpenses','moneyGained','receipts','machines','funding'];
  const CASH=['monthlyExpenses','moneyGained'];
  const empty=()=>({months:[],removed:{monthlyExpenses:[],moneyGained:[]}});
  let local=(()=>{try{const data=JSON.parse(localStorage.getItem(STORE)||'{}');return {
      months:Array.isArray(data.months)?data.months:[],
      removed:{monthlyExpenses:Array.isArray(data.removed?.monthlyExpenses)?data.removed.monthlyExpenses:[],
               moneyGained:Array.isArray(data.removed?.moneyGained)?data.removed.moneyGained:[]}
    }}catch{return empty()}})();
  let shared=[];
  const identity=row=>String(row?.id??'json:'+JSON.stringify(row));
  const dollars=rows=>Math.round((rows||[]).reduce((sum,row)=>sum+(Number(row.amount)||0),0)*100)/100;
  const moneyNum=n=>Math.round((Number(n)||0)*100)/100;
  const all=()=>{const dict=new Map();for(const m of shared)if(m?.id)dict.set(String(m.id),m);
    for(const m of local.months)if(m?.id)dict.set(String(m.id),m);
    return [...dict.values()].sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')));};
  const removedSet=kind=>new Set(local.removed[kind]||[]);
  function visible(data){
    const result={...data};
    for(const kind of KINDS){
      const rows=Array.isArray(data?.[kind])?data[kind]:[];
      result[kind]=CASH.includes(kind)?rows.filter(r=>!removedSet(kind).has(identity(r))):rows;
    }
    return result;
  }
  function current(data){
    const entries=visible(data);
    const archived={};
    for(const kind of KINDS)archived[kind]=new Set(all().flatMap(month=>month.captured?.[kind]||[]));
    const result={...entries};
    for(const kind of KINDS)result[kind]=(entries[kind]||[]).filter(row=>!archived[kind].has(identity(row)));
    return result;
  }
  function isArchived(kind,row){const id=identity(row);return all().some(m=>(m.captured?.[kind]||[]).includes(id))}
  function localPersist(next){localStorage.setItem(STORE,JSON.stringify(next));local=next}
  function create(data,name){
    const fresh=current(data);
    if(!KINDS.some(k=>fresh[k].length))throw Error('No new financial activity to save for this month.');
    const now=new Date();
    const selectedName=String(name||'').trim().slice(0,80);
    if(!selectedName)throw Error('Month name is required.');
    const gained=dollars(fresh.moneyGained),expenses=dollars(fresh.monthlyExpenses);
    const machines=fresh.machines||[],receipts=fresh.receipts||[],funding=fresh.funding||[];
    const report={
      id:(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'month-'+now.getTime()+'-'+Math.random().toString(36).slice(2),
      name:selectedName,
      savedAt:now.toISOString(),
      month:now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'),
      totals:{
        grossGained:gained,expenses,net:moneyNum(gained-expenses),
        machineGross:moneyNum(machines.reduce((n,r)=>n+(Number(r.sales)||0),0)),
        machineCosts:moneyNum(machines.reduce((n,r)=>n+['refunds','cogs','processing','platform','commission','maintenance','other'].reduce((p,k)=>p+(Number(r[k])||0),0),0)),
        receipts:moneyNum(receipts.reduce((n,r)=>n+(Number(r.total)||0),0)),
        funding:moneyNum(funding.filter(r=>r.type==='funding').reduce((n,r)=>n+(Number(r.amount)||0),0)),
        repayments:moneyNum(funding.filter(r=>r.type!=='funding').reduce((n,r)=>n+(Number(r.amount)||0),0))
      },
      captured:Object.fromEntries(KINDS.map(k=>[k,fresh[k].map(identity)])),
      entries:Object.fromEntries(KINDS.map(k=>[k,fresh[k].map(r=>{const copy={...r};delete copy.imageData;return copy})]))
    };
    localPersist({...local,months:[...local.months,report]});
    return report;
  }
  function rename(id,name){
    const nextName=String(name||'').trim().slice(0,80);
    if(!nextName)throw Error('Month name cannot be empty.');
    const existing=all().find(m=>String(m.id)===String(id));
    if(!existing)throw Error('Month not found.');
    const replaced={...existing,name:nextName};
    localPersist({...local,months:[...local.months.filter(m=>String(m.id)!==String(id)),replaced]});
    return replaced;
  }
  function remove(kind,id){
    if(!CASH.includes(kind))throw Error('Only quick-entry expenses and money gained can be removed here.');
    const next={...local,removed:{...local.removed,[kind]:[...new Set([...(local.removed[kind]||[]),String(id)])]}};
    localPersist(next);
  }
  const setShared=list=>{shared=Array.isArray(list)?list:[]};
  root.VendingMonths={all,current,visible,create,rename,remove,isArchived,identity,setShared,removed:()=>({...local.removed}),export:()=>({savedMonths:all(),removedEntryIds:{...local.removed}})};
})(window);
