/* ---------- My accounts ---------- */
const isTA=r=>r.name==="TransAmerica", live=r=>!/Churn/.test(r.stage);
const VIEWS=[["needs","Needs me first",r=>isTA(r)||(live(r)&&(r.health<40||rel(r.renew).days<=90)),""],["all","All accounts",()=>true,""],
  ["risk","At risk",r=>live(r)&&r.health<40,"b"],["watch","Watch",r=>live(r)&&r.health>=40&&r.health<70,"w"],["healthy","Healthy",r=>live(r)&&r.health>=70,"g"],
  ["renew","Renewing in 90d",r=>live(r)&&rel(r.renew).days>=0&&rel(r.renew).days<=90,""],["impl","In implementation",r=>/Implementation/.test(r.stage),""]];
let curView="needs", sortKey="health", sortDir="asc", q="", pinned=true, active=[];
const FILTERS=[["h70","Health under 70",r=>r.health<70],["h40","Health under 40",r=>r.health<40],["r90","Renews within 90 days",r=>live(r)&&rel(r.renew).days>=0&&rel(r.renew).days<=90],["bau","Stage: BAU",r=>/BAU/.test(r.stage)],["impl","Stage: Implementation",r=>/Implementation/.test(r.stage)],["ent","Segment: Enterprise",r=>r.seg==="Enterprise"],["mid","Segment: Mid market or SMB",r=>r.seg!=="Enterprise"]];
const COLS=[["signals","Signals"],["stage","Stage"],["repo","Repository"],["lic","Licence use"]];
const SORT_NAME={name:"Account",health:"Health",carr:"ARR",renew:"Renewal",repo:"Repository",lic:"Licence use"};
let hidden=new Set();
const mono=r=>r.name.replace(/[^A-Za-z ]/g,"").trim()[0].toUpperCase();
function meter(v){ const n=Math.max(1,Math.ceil((v||0)/25)), b=band(v); return `<span class="hm" aria-hidden="true">${[0,1,2,3].map(k=>`<i class="${k<n?"on "+b:""}"></i>`).join("")}</span>` }
function signals(r){
  if(!live(r)) return [["b","Churned"]];
  const d=rel(r.renew).days, s=[];
  if(isTA(r)) s.push(["b","Renewal unsigned"],["b","Champion handed over"]);
  else { if(d<0) s.push(["b","Overdue renewal"]); else if(d<=90) s.push(["w","Renewal imminent"]); }
  if(r.health<40) s.push(["b","Low health"]);
  if(r.nrr!=null&&r.nrr>100) s.push(["g","NRR expanding"]); else if(r.nrr!=null&&r.nrr<100) s.push(["w","NRR contracting"]);
  if(/Implementation/.test(r.stage)) s.push(["n","In implementation"]);
  if(r.lic!=null&&r.lic>100) s.push(["g","Over licence"]);
  return s;
}
function insights(r){ // TransAmerica gets its real brief; other rows get a rule summary of what the list knows
  if(isTA(r)) return {tag:"AI", rows:BRIEF.map(([h,t])=>[h,t.replace(/\s?\{\w+\}/g,"")])};
  const rr=rel(r.renew), d=rr.days, nr=r.nrr==null?"NRR and GRR have no data":`NRR ${r.nrr}% and GRR ${r.grr}%`;
  return {tag:"Rule", rows:[
    ["Where we stand", `Health ${r.health} (${r.health>=70?"healthy":r.health>=40?"watch":"at risk"}) on ${money(r.carr)} CARR, stage ${r.stage}. ${nr}.`],
    ["What's in play", !live(r)?"Churned this financial year.":d<0?`The renewal date (${fmtDate(r.renew)}) has passed: ${rr.t.toLowerCase()}.`:`Renews ${fmtDate(r.renew)}, ${rr.t} away.${r.lic!=null?` Licence use ${r.lic}%.`:""}`],
    ["What's at stake", r.health<40?`${money(r.carr)} at renewal risk with health under 40.`:d>=0&&d<=90?`${money(r.carr)} renews within 90 days; confirm the paper path.`:"Nothing urgent in the list data. Only TransAmerica has full account detail in this build."]]};
}
function renderFilters(){
  $("#fadd").innerHTML=`<option value="">Filter</option>`+FILTERS.filter(f=>!active.includes(f[0])).map(f=>`<option value="${f[0]}">${f[1]}</option>`).join("");
  $("#fchips").innerHTML=active.length?active.map(k=>`<span class="fchip">${FILTERS.find(f=>f[0]===k)[1]}<button type="button" data-unf="${k}" aria-label="Remove filter ${FILTERS.find(f=>f[0]===k)[1]}">×</button></span>`).join("")+`<button class="link" type="button" data-unf="*">Clear all</button>`:"";
  $("#fchips").hidden=!active.length;
}
function renderViews(){ $("#saved-views").innerHTML=VIEWS.map(v=>`<button type="button" aria-pressed="${v[0]===curView}" data-v="${v[0]}">${v[3]?`<i class="vdot ${v[3]}"></i>`:""}${v[1]}<span>${ROWS.filter(v[2]).length}</span></button>`).join("");
  qsa("#saved-views button").forEach(b=>b.onclick=()=>{curView=b.dataset.v; renderViews(); renderRows()}); }
function renderCols(){ if(!$("#colpop")) return;
  $("#colpop").innerHTML=COLS.map(([k,l])=>`<label class="ck"><input type="checkbox" data-col="${k}" ${hidden.has(k)?"":"checked"}><span>${l}</span></label>`).join("");
  qsa("#v-accounts [data-c]").forEach(el=>el.hidden=hidden.has(el.dataset.c));
}
function renderRows(){
  const f=VIEWS.find(v=>v[0]===curView)[2];
  let rows=ROWS.filter(f).filter(r=>active.every(k=>FILTERS.find(x=>x[0]===k)[2](r))).filter(r=>!q||(r.name+" "+r.ind+" "+r.seg).toLowerCase().includes(q));
  const key={name:r=>r.name.toLowerCase(),health:r=>r.health,carr:r=>r.carr,renew:r=>+r.renew,repo:r=>r.repo,lic:r=>r.lic??-1}[sortKey];
  const priority=pinned&&curView==="needs";
  rows.sort(priority?(a,b)=>isTA(b)-isTA(a)||rel(a.renew).days-rel(b.renew).days:(a,b)=>(key(a)>key(b)?1:key(a)<key(b)?-1:0)*(sortDir==="asc"?1:-1));
  qsa("#v-accounts th button").forEach(b=>{ if(!priority&&b.dataset.sort===sortKey) b.dataset.dir=sortDir; else delete b.dataset.dir});
  $("#sortby").innerHTML=priority?`<span aria-hidden="true">⇅</span> Sorted by what needs you first`:`<span aria-hidden="true">⇅</span> Sorted by ${SORT_NAME[sortKey]} ${sortDir==="asc"?"↑":"↓"}`;
  const empty=$("#list-empty");
  if(!rows.length){ $("#rows").innerHTML=""; empty.hidden=false;
    empty.innerHTML=`<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4M8.5 11h5"/></svg><h4>${q?`No accounts match “${q.replace(/[<>&]/g,"")}”`:"No accounts match these filters"}</h4><p>Search and filters apply within the ${VIEWS.find(v=>v[0]===curView)[1].toLowerCase()} view.</p><button class="btn" type="button" id="clear-q">Reset search and filters</button></div>`;
    $("#clear-q").onclick=resetList; $("#foot").textContent=""; return }
  empty.hidden=true;
  $("#rows").innerHTML=rows.map(r=>{const churn=!live(r), rr=churn?{t:"Churned",c:"",days:9999}:rel(r.renew); const i=ROWS.indexOf(r), sg=signals(r);
    const nrr=r.nrr==null?`<span class="nodata">No NRR data</span>`:`<span class="nrr ${r.nrr>100?"up":r.nrr<100?"dn":""}">${r.nrr>100?"↑":r.nrr<100?"↓":"→"} NRR ${r.nrr}%</span>`;
    return `<tr data-i="${i}" tabindex="0">
    <td><div class="acct"><span class="mono-s">${mono(r)}</span><div><div class="n" data-sk ${isTA(r)&&priority?'title="Pinned first because it changed since you last looked"':""}>${r.name}</div><div class="m">${r.seg} · ${r.ind}</div></div></div></td>
    <td><div class="hcell"><b class="hv ${band(r.health)}">${r.health}</b><button class="ins-btn" type="button" data-ins="${i}" aria-label="Insights for ${r.name}" title="Insights"><i class=spk></i></button></div></td>
    <td class="num" data-sk><b>${money(r.carr)}</b><div class="sub2">${nrr}</div></td>
    <td class="renew"><div class="r ${rr.c}">${rr.t}</div><div class="d">${churn?"":fmtDate(r.renew)}</div></td>
    <td data-c="signals"><div class="sigs">${sg.slice(0,2).map(([c,t])=>`<span class="sig ${c}">${t}</span>`).join("")}${sg.length>2?`<span class="sig more" title="${sg.slice(2).map(s=>s[1]).join(", ")}">+${sg.length-2}</span>`:""}${sg.length?"":`<span class="sub">—</span>`}</div></td>
    <td data-c="stage"><span class="stg">${r.stage}</span></td>
    <td class="num" data-c="repo">${r.repo.toLocaleString()}</td><td class="num" data-c="lic">${r.lic==null?`<span class="nodata">No data</span>`:r.lic+"%"}</td></tr>`}).join("");
  renderCols();
  $("#foot").textContent=`Showing ${rows.length} of ${ROWS.length}`;
  qsa("#rows tr").forEach(tr=>{tr.onclick=e=>{ if(e.target.closest("[data-ins]")) return; openRow(+tr.dataset.i)}; tr.onkeydown=e=>{if(e.key==="Enter"&&!e.target.closest("[data-ins]"))openRow(+tr.dataset.i)}});
}
function resetList(){ q=""; $("#q").value=""; active=[]; pinned=true; curView="needs"; sortKey="health"; sortDir="asc"; renderFilters(); renderViews(); renderRows() }
function openInsights(i, anchor, focus=true){
  const r=ROWS[i], ins=insights(r), p=$("#ins-pop"), b=anchor.getBoundingClientRect();
  p.innerHTML=`<span class="ins-caret" aria-hidden="true"></span><div class="ip-h"><span class="spark-ic" aria-hidden="true"><i class=spk></i></span><div><b>Insights</b><span>${esc(r.name)} · ${ins.tag==="AI"?"written from the account's record and summaries":"summarised by rule from the list data"}</span></div><span class="tag ${ins.tag==="AI"?"ai":"rule"}">${ins.tag}</span><button class="ip-x" type="button" data-ipx aria-label="Close insights">×</button></div>
    <div class="ip-body">${ins.rows.map(([h,t],k)=>`<div class="ip-s ${k===2?"stake":""}"><h4>${h}</h4><p>${esc(t)}</p></div>`).join("")}
    <button class="btn sm" type="button" data-ipopen="${i}">${isTA(r)?"Open account":"Preview account"}</button></div>`;
  p.hidden=false; p.dataset.i=i; const body=p.querySelector(".ip-body"); body.style.maxHeight=""; p.classList.remove("up","down");
  const w=p.offsetWidth, h=p.offsetHeight, x=Math.min(window.innerWidth-w-12, Math.max(12, b.left+b.width/2-28));
  const roomBelow=window.innerHeight-b.bottom-20, roomAbove=b.top-20, down = h<=roomBelow || roomBelow>=roomAbove;
  const mh=Math.max(160, Math.min(h, down?roomBelow:roomAbove));
  body.style.maxHeight=Math.max(80, mh-(h-body.offsetHeight))+"px"; p.classList.add(down?"down":"up"); const ph=p.offsetHeight;
  p.style.left=x+"px"; p.style.top=(down ? b.bottom+10 : b.top-10-ph)+"px";
  p.style.setProperty("--caret", Math.max(14, Math.min(w-22, b.left+b.width/2-x-6))+"px");
  window.__insAt=Date.now(); if(focus) p.querySelector("[data-ipx]").focus({preventScroll:true});
}
/* the popover opens on hover or focus of the health score, and on click; it lives on <body> so the app frame never clips it */
document.body.appendChild($("#ins-pop"));
let insT=null; const insCancel=()=>{clearTimeout(insT); insT=null};
document.addEventListener("mouseover",e=>{
  const c=e.target.closest("#rows .hcell"); if(c){ insCancel(); const btn=c.querySelector("[data-ins]"); if($("#ins-pop").hidden || $("#ins-pop").dataset.i!==btn.dataset.ins) insT=setTimeout(()=>openInsights(+btn.dataset.ins, btn, false), 220); return }
  if(e.target.closest("#ins-pop")){ insCancel(); return }
});
document.addEventListener("mouseout",e=>{
  const from=e.target.closest("#rows .hcell, #ins-pop"), to=e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest("#rows .hcell, #ins-pop");
  if(from && !to){ insCancel(); insT=setTimeout(closeInsights, 250) }
});
document.addEventListener("focusin",e=>{ const btn=e.target.closest("#rows [data-ins]"); if(btn) openInsights(+btn.dataset.ins, btn, false) });
window.addEventListener("scroll",()=>{ if(!$("#ins-pop").hidden && Date.now()-(window.__insAt||0)>400) closeInsights() }, {passive:true});
function closeInsights(){ $("#ins-pop").hidden=true }
function openRow(i){const r=ROWS[i]; closeInsights(); if(!$("#drawer").classList.contains("open")) window.__drawerFrom=document.activeElement; if(r.name==="TransAmerica"){go("account"); return}
  const rr=rel(r.renew), d=$("#drawer"), ins=insights(r), sg=signals(r);
  d.innerHTML=`<button class="x" type="button" id="dx" aria-label="Close preview"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
   <div style="display:flex; gap:12px; align-items:center"><span class="mono-s lg">${mono(r)}</span><div><h2>${r.name}</h2><p class="sub" style="margin-top:2px">${r.seg} · ${r.ind} · ${r.stage}</p></div></div>
   <div class="hcell"><b class="hv ${band(r.health)}" style="font-size:28px">${r.health}</b><span class="sub">${r.health>=70?"Healthy":r.health>=40?"Watch":"At risk"}</span></div>
   <div class="sigs">${sg.map(([c,t])=>`<span class="sig ${c}">${t}</span>`).join("")}</div>
   <dl><dt>CARR</dt><dd>${money(r.carr)}</dd><dt>NRR / GRR</dt><dd>${r.nrr==null?"No data":r.nrr+"% / "+r.grr+"%"}</dd><dt>Renewal</dt><dd class="${rr.c}">${rr.t} · ${fmtDate(r.renew)}</dd><dt>Repository</dt><dd>${r.repo.toLocaleString()}</dd><dt>Licence use</dt><dd>${r.lic==null?"No data":r.lic+"%"}</dd></dl>
   <div class="dr-sec">${ins.rows.map(([h,t])=>`<h3>${h} <span class="tag rule">Rule</span></h3><p>${esc(t)}</p>`).join("")}</div>
   <button class="btn primary" type="button" id="dopen">Open account</button><p class="sub">Only TransAmerica has a full account page in this build.</p>`;
  d.classList.add("open"); d.setAttribute("aria-hidden","false"); $("#scrim").classList.add("open"); $("#dx").focus();
  $("#dx").onclick=closeDrawer; $("#dopen").onclick=()=>{closeDrawer(); go("account")};
}
function closeDrawer(){ const d=$("#drawer"); if(!d.classList.contains("open")) return; d.classList.remove("open"); d.setAttribute("aria-hidden","true"); $("#scrim").classList.remove("open"); const f=window.__drawerFrom; window.__drawerFrom=null; if(f&&f.isConnected&&f.focus) f.focus() }
$("#scrim").onclick=closeDrawer; document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer(); closeInsights()}});
$("#q").addEventListener("input",e=>{q=e.target.value.trim().toLowerCase(); renderRows()});
$("#fadd").onchange=e=>{ if(e.target.value){active.push(e.target.value); renderFilters(); renderRows()} };
$("#reset").onclick=resetList;
document.addEventListener("click",e=>{
  const ib=e.target.closest("[data-ins]"); if(ib){ e.stopPropagation(); openInsights(+ib.dataset.ins, ib); return }
  if(e.target.closest("[data-ipx]")){ closeInsights(); return }
  const io=e.target.closest("[data-ipopen]"); if(io){ openRow(+io.dataset.ipopen); return }
  if(!e.target.closest("#ins-pop")) closeInsights();
  const u=e.target.closest("[data-unf]"); if(!u) return; active=u.dataset.unf==="*"?[]:active.filter(k=>k!==u.dataset.unf); renderFilters(); renderRows(); $("#fadd").focus()});
qsa("#v-accounts th button[data-sort]").forEach(b=>b.onclick=()=>{ pinned=false; if(sortKey===b.dataset.sort) sortDir=sortDir==="asc"?"desc":"asc"; else {sortKey=b.dataset.sort; sortDir=b.dataset.sort==="name"||b.dataset.sort==="renew"||b.dataset.sort==="health"?"asc":"desc"} renderRows()});
