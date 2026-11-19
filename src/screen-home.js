/* ---------- Home: what changed since you last looked ---------- */
const LAST_LOOKED = "2026-11-12"; // example: when Rahul last opened AHI
function homeChanges(){
  const F = facts(), d = k => { const v = F.delta(k); return v>0 ? "+"+v : "−"+(-v) }, p = k => F.prev.areas[k], n = k => F.last.areas[k];
  return [
    { id:"cap", title:`Health capped from ${TA_RECORD.weightedHealth} to ${TA_RECORD.finalHealth}`, size:`−${TA_RECORD.weightedHealth-TA_RECORD.finalHealth}`, tag:TAG.rule,
      why:`Renewal cap: ${TA_RECORD.overrideReason}. Lifts once the renewal is signed or auto-renew is on.`, to:"s-summary", play:"commit" },
    { id:"renew", title:"Renewal is now under 60 days", size:`${F.left} days left`, tag:TAG.rule,
      why:"Dec 30, 2026 · $330K CARR · auto-renew off · no signed commitment.", to:"runway", play:"commit" },
    { id:"eng", title:`Customer engagement fell from ${p("engagement")} to ${n("engagement")}`, size:`${d("engagement")}`, tag:TAG.rule,
      why:"Champion Bailey Laske handed over her role on Oct 21. CSM touchpoints 5 this month (12-month average 199).", to:"s-stake", play:"champion" },
    { id:"exec", title:"No executive contact this month", size:"0 vs 11", tag:TAG.rule,
      why:"Executive sponsor engagement 0 in the Oct 31 record (12-month average 11). Lawrence Kane was last named on Feb 11, accepting the MBR.", to:"s-stake", play:"sponsor" },
    { id:"sent", title:`Sentiment fell from ${p("sentiment")} to ${n("sentiment")}`, size:`${d("sentiment")}`, tag:TAG.ai,
      why:`${F.strongOct.length} strong negative in October: the champion handed over after chasing the INC-177010 RCA.`, to:"s-journey", play:null },
    { id:"appr", title:"Approval cycles fell from 12 to 0", size:"−12", tag:TAG.rule,
      why:"Active workflows score 2. Contracts processed 155 against a 12-month average of 171.", to:"area:adoption", play:null },
  ];
}
function playFor(id){ return STATE.plays.find(p => p.id===id) }
function changeOpen(c){ const pl = c.play && playFor(c.play); return !(pl && pl.status!=="suggested") && !STATE.seen[c.id] }
function openAccountAt(to){
  go("account");
  if(to.startsWith("area:")){ showTab("s-health", false); openArea(to.slice(5)); return }
  if(to==="runway"){ showTab("s-summary", false); setTimeout(()=>$(".runway").scrollIntoView({block:"center"}), 50); return }
  showTab(to, false); if(to!=="s-summary") setTimeout(()=>$("#secnav").scrollIntoView(), 50);
}
let HOME_GRP = [];
function renderHome(){
  const all = homeChanges(), open = all.filter(changeOpen), done = all.filter(c => !changeOpen(c));
  const item = c => { const pl = c.play && playFor(c.play);
    return `<article class="chg-card">
      <div class="chg-top">${c.tag}<span class="chg-size${/^[−-]/.test(c.size)?" neg":""}">${esc(c.size)}</span></div>
      <h3>${esc(c.title)}</h3><p>${esc(c.why)}</p>
      ${pl ? `<p class="chg-play">Suggested play: <b>${esc(pl.title)}</b> · ${esc(pl.owner)} ${TAG.ex}</p>` : ""}
      <div class="row-actions">${pl ? `<button class="btn" type="button" data-start="${c.play}">Start play</button>` : `<button class="btn" type="button" data-seen="${c.id}">Mark as seen</button>`}
        <button class="btn" type="button" data-goto="${c.to}">Open ${c.to==="s-journey"?"activity":c.to==="s-stake"?"stakeholders":c.to.startsWith("area")?"adoption inputs":"account"}</button></div>
    </article>` };
  $("#home-list").innerHTML = `<div class="chg-acct"><b>TransAmerica</b><span class="sub">$330K CARR · renews Dec 30 · health 50</span><button class="link" type="button" data-go="account">Open account</button></div>` + (open.length ? open.map(item).join("") : `<div class="card empty"><h4>You're up to date</h4><p>Nothing new on TransAmerica since ${fmtD(new Date(LAST_LOOKED+"T00:00:00"))}.</p></div>`)
    + (done.length ? `<details class="fold handled"><summary>Handled (${done.length})</summary>${done.map(c => { const pl = c.play && playFor(c.play);
        return `<div class="ps"><span class="avatar">✓</span><div><div class="t">${esc(c.title)}</div><div class="d">${pl ? `Play started: ${esc(pl.title)} · ${esc(pl.stage)}` : "Marked as seen"}</div></div></div>` }).join("")}</details>` : "");
  const needs = ROWS.filter(r => !/Churn/.test(r.stage) && (r.health < 40 || rel(r.renew).days <= 90)).sort((a,b) => (b.name==="TransAmerica")-(a.name==="TransAmerica") || rel(a.renew).days-rel(b.renew).days).slice(0,6);
  $("#home-needs").innerHTML = needs.map(r => { const rr = rel(r.renew); return `<button class="ps nm-row" type="button" data-row="${ROWS.indexOf(r)}">${mring(r.health)}<div style="min-width:0; text-align:left"><div class="t">${esc(r.name)}</div><div class="d"><span class="${rr.c}">${rr.t}</span> · ${money(r.carr)}</div></div></button>` }).join("");
  renderRows();
  const badge = $("#home-badge"); if(badge){ badge.textContent = open.length; badge.hidden = !open.length }
  const h = new Date().getHours(); $("#greet-time").textContent = h<12 ? "Good morning" : h<17 ? "Good afternoon" : "Good evening";
  const live = ROWS.filter(r => !/Churn/.test(r.stage)), cnt = f => live.filter(f).length, soon = live.filter(r => { const d = rel(r.renew).days; return d>=0 && d<=90 });
  $("#home-sub").innerHTML = `Heads up — <b>${open.length} new change${open.length===1?"":"s"}</b> on TransAmerica since you last looked on ${fmtDY(new Date(LAST_LOOKED+"T00:00:00"))}. $330K renews in ${facts().left} days with nothing signed. Start with “Secure the renewal commitment”.<span class="illus">Owners, due dates and the last-visit date are illustrative.</span>`;
  const IC = { doc:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>', grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    warn:'<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>', clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>', ok:'<circle cx="12" cy="12" r="8.5"/><path d="m8 12 3 3 5-6"/>', cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>' };
  const tile = (k, ic, n, l, sub, go) => `<button class="tile ${k}" type="button" ${go}><span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${IC[ic]}</svg></span><div><div class="tn">${n}</div><div class="tl">${l}</div><div class="ts">${sub}</div></div></button>`;
  $("#home-tiles").innerHTML = tile("", "doc", open.length, "New changes", "on TransAmerica", 'data-go="account"') + tile("", "grid", ROWS.length, "Accounts", "of 260 in your book", 'data-hview="all"')
    + tile("bad", "warn", cnt(r=>r.health<40), "At risk", "health under 40", 'data-hview="risk"') + tile("warn", "clock", cnt(r=>r.health>=40&&r.health<70), "Watch", "health 40 to 69", 'data-hview="watch"')
    + tile("good", "ok", cnt(r=>r.health>=70), "Healthy", "health 70 and over", 'data-hview="healthy"') + tile("date", "cal", soon.length, "Renewing ≤ 90 days", money(soon.reduce((a,r)=>a+r.carr,0))+" CARR", 'data-hview="renew"');
  const grp = [["bad","Churned accounts",ROWS.filter(r=>/Churn/.test(r.stage)),'<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'],["slate","Past renewal date",live.filter(r=>rel(r.renew).days<0),'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'],["warn","Still implementing",live.filter(r=>/Implementation/.test(r.stage)),'<path d="M9 6v12M15 6v12"/>']];
  $("#home-ins").innerHTML = grp.map(([k,l,rows,ic],gi) => `<button class="ins-card" type="button" data-hgrp="${gi}"><span class="ii ${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></span><div><b>${rows.length}</b><span class="l">${l}</span></div><span class="chev" aria-hidden="true">›</span></button>`).join("")
    + `<button class="ins-card" type="button" data-go="portfolio"><span class="ii" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg></span><div><b>$103.6M</b><span class="l">Portfolio · 260 accounts</span></div><span class="chev" aria-hidden="true">›</span></button>`;
  HOME_GRP = grp;
}
document.addEventListener("click", e => {
  const s = e.target.closest("[data-start]"); if(s){ const pl = playFor(s.dataset.start); Object.assign(pl, { status:"task", stage:"Plan in place", stageOn:TODAY_ISO }); renderPlays(); renderHome(); return }
  const v = e.target.closest("[data-seen]"); if(v){ STATE.seen[v.dataset.seen] = true; renderHome(); return }
  const g = e.target.closest("[data-goto]"); if(g){ openAccountAt(g.dataset.goto); return }
  const h = e.target.closest("#v-home [data-go]"); if(h){ go(h.dataset.go); return }
  const r = e.target.closest("[data-row]"); if(r){ openRow(+r.dataset.row); return }
  const hv = e.target.closest("[data-hview]"); if(hv){ curView = hv.dataset.hview; renderViews(); renderRows(); go("accounts"); return }
  const hg = e.target.closest("[data-hgrp]"); if(hg){ const [k,l,rows] = HOME_GRP[+hg.dataset.hgrp];
    openPanel(`<div class="dr-head"><div><p class="sub">Insights</p><h2>${esc(l)} · ${rows.length}</h2></div></div><div class="dr-sec">${rows.length ? rows.map(r => `<button class="ps nm-row" type="button" data-row="${ROWS.indexOf(r)}">${mring(r.health)}<div style="min-width:0; text-align:left"><div class="t">${esc(r.name)}</div><div class="d">${esc(r.stage)} · ${money(r.carr)} · renewal ${esc(rel(r.renew).t.toLowerCase())}</div></div></button>`).join("") : `<p class="sub">No accounts in this group.</p>`}</div>`); return }
});
