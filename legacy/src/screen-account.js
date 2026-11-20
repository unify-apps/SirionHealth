/* ---------- Account (v2): notice → understand → prove → act → judge ---------- */
const RENEWAL = new Date(2026,11,30);
const TAG = { rule:'<span class="tag rule">Rule</span>', ai:'<span class="tag ai">AI</span>', ex:'' }; // illustrative values are named once per page instead of on every row
const fmtD = d => d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
const fmtDY = d => d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const ymLabel = ym => new Date(+ym.slice(0,4), +ym.slice(5,7)-1, 1).toLocaleDateString("en-US",{month:"short",year:"numeric"});
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const ROLE_OPTS = ["Executive sponsor","Champion","Decision maker","Influencer","Technical owner","IT and security contact","System administrator","Key user","Procurement","Legal","Former champion","Left the role"];
const STATE = { roles:{}, plays: TA_EXAMPLE.plays.map(p=>({...p, status:"suggested", stage:"At risk", stageOn:p.since, note:""})), confirmed:{}, seen:{}, evFilter:"strong", evView:"reason", partners:false };

function ring(el){const v=+el.dataset.ring, r=40, c=2*Math.PI*r; el.style.setProperty("--circ",c);
  el.innerHTML=`<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="track" cx="48" cy="48" r="${r}"/><circle class="arc" cx="48" cy="48" r="${r}" stroke="${col(v)}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-v/100)}"/></svg><div class="val"><div><b data-count="${v}">${v}</b><span>of 100</span></div></div>`;
  el.setAttribute("role","img"); el.setAttribute("aria-label",`Score ${v} of 100`)}
function stats(a){return a.map(s=>`<div class="stat"><div class="l">${s[0]}</div><div class="v" data-sk>${s[1]}</div><div class="h">${s[2]||"&nbsp;"}</div></div>`).join("")}

/* ---- derived facts ---- */
function facts(){
  const ms = taMonths(), last = ms[ms.length-1], prev = ms[ms.length-2], ep = taEpisode("model");
  const ev = taEvidence();
  return { ms, last, prev, ep, ev,
    used: daysBetween(ep.date, TODAY), left: daysBetween(TODAY, RENEWAL), total: daysBetween(ep.date, RENEWAL),
    delta: k => last.areas[k] - prev.areas[k],
    strongOct: ev.filter(e => e.ym === last.ym && e.strong) };
}
function areaInputs(key){ return TA_RECORD.kpis[key] || [] }
function areaDriver(key){
  const ins = areaInputs(key).filter(k => k[2] >= 0).sort((a,b)=>a[2]-b[2]);
  return ins[0] || null;
}
function coverage(key){ const ins = areaInputs(key); return [ins.filter(k=>k[2]>=0).length, ins.length] }

/* ---- verdict band ---- */
function renderVerdict(F){
  $("#scores").innerHTML = `
    <button class="score" type="button" data-open="how" aria-label="Health 50 of 100, amber, capped from 62. See how we got to 50">
      <div class="ring" data-ring="${TA_RECORD.finalHealth}"></div>
      <div><div class="what">Watch · capped from ${TA_RECORD.weightedHealth}</div><div class="sb-more">How we got to ${TA_RECORD.finalHealth} →</div></div>
    </button>`;
  qsa("#scores [data-ring]").forEach(ring);
  const eng = TA_RECORD.kpis.engagement, sen = F.strongOct;
  const reasons = [
    { tag: TAG.rule, t:`Renewal in ${F.left} days, auto-renew off`, d:`$330K renews Dec 30 with no signed commitment yet.`, open:"area:commercial" },
    { tag: TAG.rule, t:`Engagement fell ${-F.delta("engagement")} points to ${F.last.areas.engagement}`, d:`Champion Bailey Laske handed over on Oct 21. No executive contact this month.`, open:"area:engagement" },
    { tag: TAG.ai, t:`Sentiment fell ${-F.delta("sentiment")} points to ${F.last.areas.sentiment}`, d:`${sen.length} strong negative${sen.length===1?"":"s"} in October, after the customer chased the INC-177010 root cause.`, open:"area:sentiment" },
  ];
  $("#reasons").innerHTML = reasons.map(r=>`<button class="reason" type="button" data-open="${r.open}" aria-describedby="rd-${r.open.replace(":","-")}"><div class="rt"><span>${r.t}</span></div><div class="rd" role="tooltip" id="rd-${r.open.replace(":","-")}">${r.d}</div></button>`).join("");
  const pc = d => (100*(F.total-d)/F.total).toFixed(1);
  if($("#rs-track")) $("#rs-track").innerHTML = `<i class="rs-used" style="width:${pc(F.left)}%"></i><i class="rs-today" style="left:${pc(F.left)}%"></i>${[90,60,30].map(d=>`<span class="rs-tick" style="left:${pc(d)}%">${d}d</span>`).join("")}`;
  $("#runway-line").innerHTML = `<b>First flagged ${fmtD(F.ep.date)}</b> · ${F.used} days used · ${F.left} left of ${F.total}${F.ep.cleared.length?` · flag cleared once (${F.ep.cleared.map(c=>ymLabel(c.ym)+" at "+c.final).join(", ")}) and came back`:""}`;
  if($("#rs-info")) $("#rs-info").dataset.tip = $("#runway-line").textContent;
}

/* ---- how we got to 50: area scores → weighted → cap → final, plus what holds it up and pulls it down ---- */
function inputsFlat(){
  const seen = new Set(), out = [];
  AREAS.forEach(([k,n]) => areaInputs(k).forEach(i => { if(i[2] < 0 || seen.has(i[1])) return; seen.add(i[1]); out.push({area:k, name:i[0], v:i[2], note:i[3]}) }));
  return out;
}
function topInputs(dir){ // dir 1 = highest first, -1 = lowest first; one per area
  const used = new Set();
  return inputsFlat().sort((a,b) => dir*(b.v-a.v)).filter(x => !used.has(x.area) && used.add(x.area)).slice(0,3);
}
function breakdown(F){
  const short = {commercial:"Commercial", adoption:"Adoption", support:"Support", engagement:"Engagement", sentiment:"Sentiment", renewalRisk:"Renewal risk"};
  const cap = TA_RECORD.weightedHealth - TA_RECORD.finalHealth;
  return `<ol class="sb">
    <li><span class="sb-n">1</span><div class="sb-b"><b>Six area scores</b><div class="sb-areas">${AREAS.map(([k]) => `<button type="button" class="sb-a" data-open="area:${k}"><span>${short[k]}</span><b class="${band(F.last.areas[k])}">${F.last.areas[k]}</b></button>`).join("")}</div></div></li>
    <li><span class="sb-n">2</span><div class="sb-b"><b>Weighted average</b><p>Sirion CS ops set the weight of each area. AHI doesn't store the weights, so points per area aren't shown.</p></div><span class="sb-v">${TA_RECORD.weightedHealth}</span></li>
    <li><span class="sb-n">3</span><div class="sb-b"><b>Renewal cap</b><p>The renewal was 59 days out at the Oct 31 snapshot with auto-renew off, so health is held at 50 or below. It lifts once the renewal is signed or auto-renew is on.</p></div><span class="sb-v neg">−${cap}</span></li>
    <li class="sb-total"><span class="sb-n">=</span><div class="sb-b"><b>Health score</b></div><span class="sb-v ${band(TA_RECORD.finalHealth)}">${TA_RECORD.finalHealth}</span></li>
  </ol>`;
}

/* ---- AI summary: every statement cites its source ---- */
const SUM_REFS = {
  cap: { kind:"rec", label:"AHI scored record, Oct 31 snapshot", text:`Final health ${TA_RECORD.finalHealth}, weighted ${TA_RECORD.weightedHealth}. Override ${TA_RECORD.overrideCode}: ${TA_RECORD.overrideReason}.` },
  renew: { kind:"rec", label:"Order forms and AHI record", text:"Renewal Dec 30, 2026 for $330K CARR (CU0213 OF 001 $275K, OF 002 $55K). Auto-renew: No. Signed commitment: No." },
  adopt: { kind:"rec", label:"AHI scored record, adoption inputs", text:"Licence use 111% (663 of 593 seats). Monthly active users 222 (12-month average 215). Onboarding 97%." },
  approvals: { kind:"rec", label:"AHI scored record, active workflows", text:"Approval cycles closed 0 this period (12-month average 12). Contracts processed 155 (12-month average 171)." },
  insight: { kind:"rec", label:"AHI strategic insight in the live app (AI)", text:"“Within 7 days, engage contact stakeholders to secure signed renewal commitment for the $330,000 CARR prior to the Dec 30, 2026 renewal date (42 days remaining).”" },
  handover: { kind:"ev", match:"handed over her role" },
  threat: { kind:"ev", match:"threatened renewal" },
  nick: { kind:"person", email:"nick.cavazos@transamerica.com" },
};
const BRIEF = [
  ["Where we stand", "Health is 50, capped from 62 because the $330K renewal is 41 days out with auto-renew off {cap}. Usage is steady: licence use 111% and 222 monthly users {adopt}."],
  ["What's in play", "The renewal closes Dec 30 on two order forms with nothing signed {renew}. The account insight says to secure a signed commitment within 7 days {insight}. $85K of expansion is open and unsigned {expan}."],
  ["What's at stake", "The champion, Bailey Laske, handed over on Oct 21 {handover} and leadership threatened the renewal on Aug 28 {threat}. Executive engagement is 0 this month {exec}; Nick Cavazos is the likely new day-to-day owner {nick}."],
];
const WELL = [
  ["Usage is above its 12-month average", "Licence use 111% (663 of 593 seats) and 222 monthly users against an average of 215 {adopt}.", "111% seats", "adoption"],
  ["Commercials are clean", "NRR and GRR are both 100% and no invoice is overdue {comm}.", "100% NRR", "commercial"],
  ["Support quality holds", "No ticket has been reopened, and P1s are at zero {sup}.", "0 reopened", "support"],
];
const ATTN = [
  ["Renewal unsigned with 41 days left", "$330K renews Dec 30 with auto-renew off {renew}, so health is capped from 62 to 50 {cap}.", "41 days", "commercial"],
  ["Champion gone, no executive contact", "Bailey Laske handed over on Oct 21 {handover}. Executive sponsor engagement is 0 this month {exec}.", "0 exec contacts", "engagement"],
  ["Workflows have stalled", "Approval cycles fell from 12 to 0 {approvals} and 11 enhancement requests have waited 423 days on average {per}.", "0 cycles", "adoption"],
];
Object.assign(SUM_REFS, {
  comm: { kind:"rec", label:"AHI scored record, commercial inputs", text:"NRR 100%, GRR 100%. Open invoices: no overdue invoices (input score 100)." },
  sup: { kind:"rec", label:"AHI scored record, support inputs", text:"Ticket reopen rate: 0 reopened (input score 100). Tickets by priority: P1 0, P2 7, P3 29, P4 90." },
  exec: { kind:"rec", label:"AHI scored record, engagement inputs", text:"Executive sponsor engagement 0 this month (12-month average 11). CSM touchpoints 5 (12-month average 199)." },
  per: { kind:"rec", label:"AHI scored record, support inputs", text:"Open Jira enhancement requests 11, average age 423 days (12-month average 434)." },
  expan: { kind:"rec", label:"AHI scored record, commercial inputs", text:"Expansion (upsell): $85K open, nothing signed (input score 0)." },
});
function renderSummary(){
  const order = []; const n = k => { if(!order.includes(k)) order.push(k); return order.indexOf(k)+1 };
  const cite = t => t.split(/(?<=[.!?])\s+/).map(sen => { // every source goes at the end of its sentence, after the full stop
    const ks = []; const body = sen.replace(/\s?\{(\w+)\}/g, (m,k) => { ks.push(k); return "" });
    ks.forEach(n); ks.sort((a,b) => n(a)-n(b));
    return esc(body) + (ks.length ? `<span class="fns">${ks.map(k => `<button class="fn" type="button" data-ref="${k}" aria-label="Source ${n(k)}">${n(k)}</button>`).join('<span aria-hidden="true">,</span>')}</span>` : "") }).join(" ");
  $("#brief").innerHTML = BRIEF.map(([h,t],i) => `<div class="br-col"><h3><span class="br-ic ${["s","p","k"][i]}" aria-hidden="true"></span>${h}</h3><p>${cite(t)}</p></div>`).join("");
  const li = list => ([h,t,m,area],k) => `<li><div class="wa-top"><b>${esc(h)}</b><span class="wa-m">${esc(m)}</span></div><p>${cite(t)}</p><div class="wa-acts"><button class="link wa-link" type="button" data-open="area:${area}">${esc((AREAS.find(a=>a[0]===area)||[])[1])} inputs ›</button></div></li>`;
  $("#well").innerHTML = WELL.map(li("well")).join(""); $("#attn").innerHTML = ATTN.map(li("attn")).join("");
  if($("#recent")){ const items = jrItems().filter(i => i.date <= TODAY && !/Engagement snapshot/.test(i.src)).sort((a,b)=>b.date-a.date);
    $("#recent").innerHTML = items.slice(0,4).map(i => `<div class="rc-row"><span class="jr-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${JR_IC[i.ch]}</svg></span>
      <div><div class="rc-t"><span class="jr-date">${i.date.toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span><b>${esc(i.title)}</b>${i.who.slice(0,1).map(w=>`<span class="jr-who">${esc(w)}</span>`).join("")}</div><p>${esc(i.key && i.desc===i.src+"." ? i.src : i.desc)}</p></div><span class="jr-cat ${i.kind}">${JR_CAT[i.kind]||"General"}</span></div>`).join("")
      + `<button class="link" type="button" data-jump="s-journey">View all ${items.length} in Activity ›</button>`; }
}
function openRef(k){
  const r = SUM_REFS[k]; let body = "";
  if(r.kind==="rec") body = `<div class="dr-sec"><h3>${esc(r.label)} ${/\(AI\)/.test(r.label)?TAG.ai:TAG.rule}</h3><p>${esc(r.text)}</p></div>`;
  if(r.kind==="ev") body = `<div class="dr-sec"><h3>Monthly summary ${TAG.ai}</h3>${taEvidence().filter(e=>e.text.includes(r.match)).map(evItem).join("")}</div>`;
  if(r.kind==="person"){ const p = taPeople().find(x=>x.email===r.email); body = `<div class="dr-sec"><h3>${esc(p.name)} · ${esc(p.suggested||"")} ${TAG.ai}</h3><p>${esc(p.basis||"")}</p><p class="sub">Named in ${p.mentions} monthly summaries, last ${ymLabel(p.lastMentioned)}.</p></div>` }
  openPanel(`<div class="dr-head"><div><p class="sub">Source</p><h2>Why the summary says this</h2></div></div>${body}`);
}

/* ---- contract signals ---- */
function renderCLM(){
  const tiles = [
    ["Renewal paper","2 order forms","$275K + $55K, renew Dec 30",null],
    ["Commitment","Not signed","Auto-renew off","area:commercial"],
    ["Termination for convenience","No","TFC clause in the contract",null],
  ];
  $("#clm").innerHTML = tiles.map(t => { const tagName = t[3] ? "button" : "div";
    return `<${tagName} class="clm-t" ${t[3]?`type="button" data-open="${t[3]}"`:""}><span class="l">${t[0]}</span><span class="v">${t[1]}</span><span class="d">${t[2]}</span></${tagName}>` }).join("");
}

/* ---- runway: monthly health on the same strip as the events ---- */
function renderRunway(F){
  const el = $("#runway-chart"), fl = taFlags();
  const W = Math.max(860, Math.round(el.closest(".rw-wrap").clientWidth || 860)), H = 236, L = 34, R = 18, T = 14, plotH = 120, evY = 182;
  const t0 = new Date(2025,4,1), t1 = new Date(2027,0,6), x = d => L + (d - t0) / (t1 - t0) * (W - L - R), y = v => T + (100 - v) / 100 * plotH;
  let s = "";
  [0,50,70,100].forEach(v => s += `<line class="gl" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${v||""}</text>`);
  fl.forEach(f => { if(f.model){ const a = new Date(f.date.getFullYear(), f.date.getMonth(), 1); s += `<rect class="flagband" x="${x(a)}" y="${T}" width="${x(f.date)-x(a)}" height="${plotH}"/><line class="flagedge" x1="${x(a)}" x2="${x(f.date)}" y1="${T}" y2="${T}"/>` } });
  const pts = fl.map(f => [x(f.date), y(f.final), f]);
  s += `<path class="hl" d="${pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ")}"/>`;
  const last = pts[pts.length-1];
  s += `<line class="future" x1="${last[0]}" x2="${x(RENEWAL)}" y1="${last[1]}" y2="${last[1]}"/>`;
  pts.forEach(p => s += `<circle class="pt${p[2].model?" f":""}" cx="${p[0]}" cy="${p[1]}" r="3.5"><title>${ymLabel(p[2].ym)}: ${p[2].final}${p[2].model?" (flagged)":""}</title></circle>`);
  // renewal window: the last 90 days before the renewal, ticks at 60 and 30 days (dates only, from the order forms)
  const wy = T + plotH + 18, w0 = new Date(RENEWAL - 90*DAY);
  s += `<rect class="rwin" x="${x(w0)}" y="${wy}" width="${x(RENEWAL)-x(w0)}" height="8" rx="2"><title>Renewal window: ${fmtD(w0)} to ${fmtD(RENEWAL)}</title></rect>`;
  [90,60,30].forEach(d => { const tx = x(new Date(RENEWAL - d*DAY)); s += `<line class="rwtick" x1="${tx}" x2="${tx}" y1="${wy-2}" y2="${wy+10}"/><text class="rwlbl" x="${tx}" y="${wy-5}" text-anchor="middle">${d}d</text>` });
  const ff = x(F.ep.date);
  s += `<text class="ff" x="${ff}" y="${y(F.ep.final)+20}" text-anchor="middle">First flag ${fmtD(F.ep.date)}</text>`;
  s += `<line class="ax" x1="${L}" x2="${W-R}" y1="${evY}" y2="${evY}"/>`;
  for(let m=new Date(t0); m<=t1; m=new Date(m.getFullYear(), m.getMonth()+3, 1)) s += `<text x="${x(m)}" y="${H+24}" text-anchor="middle">${m.toLocaleDateString("en-US",{month:"short",year:"numeric"})}</text>`;
  const tx = x(TODAY); s += `<line class="today" x1="${tx}" x2="${tx}" y1="${T}" y2="${evY+8}"/><text class="todaylbl" x="${tx}" y="${T-2}" text-anchor="middle">Today</text>`;
  const labelled = {"2026-08-28":["Renewal threatened","middle"],"2026-10-21":["Champion handed over","middle"],"2026-12-30":["Renewal $330K","end"]};
  const lanes = [];
  TA_EVENTS.forEach(([d,k,txt,src]) => {
    const dt = new Date(d+"T00:00:00"), cx = x(dt);
    s += `<g class="rwev ${k}" tabindex="0" data-ev="${d}"><circle cx="${cx}" cy="${evY}" r="${k==="end"?5.5:3.5}"/><title>${fmtDY(dt)}: ${esc(txt)} (${src})</title></g>`;
    if(labelled[d]){ const [lbl,anc] = labelled[d]; let lane = 0; while(lanes[lane] && cx - lanes[lane] < 150) lane++; lanes[lane] = cx; const lx = anc==="end" ? cx+6 : cx;
      s += `<text class="evlbl" x="${lx}" y="${evY+18+lane*24}" text-anchor="${anc}">${lbl}</text><text class="evsub" x="${lx}" y="${evY+30+lane*24}" text-anchor="${anc}">${fmtD(dt)}</text>` }
  });
  el.innerHTML = `<svg class="rw" viewBox="0 0 ${W} ${H+32}" width="${W}" height="${H+32}" role="img" aria-label="Monthly health from May 2025 to October 2026 with events up to the December 30 renewal. First flagged ${fmtDY(F.ep.date)}.">${s}</svg>`;
  qsa(".rwev", el).forEach(g => g.onclick = g.onkeydown = e => { if(e.type==="keydown" && e.key!=="Enter") return; openEvent(g.dataset.ev) });
}
function openEvent(d){
  const e = TA_EVENTS.find(x => x[0]===d), dt = new Date(d+"T00:00:00");
  const ym = d.slice(0,7), related = taEvidence().filter(v => v.ym===ym && (v.date && Math.abs(v.date-dt) < 2*DAY));
  openPanel(`<div class="dr-head"><div><p class="sub">${fmtDY(dt)}</p><h2>${esc(e[2])}</h2></div></div>
    <div class="dr-sec"><h3>Source</h3><p>${esc(e[3])}${/AI insight/.test(e[3])?" "+TAG.ai:""}</p></div>
    ${related.length?`<div class="dr-sec"><h3>Evidence</h3>${related.map(evItem).join("")}</div>`:""}`);
}

/* ---- trend over time: an area's monthly score, 18 months (real, from TA_REAL.monthly) ---- */
function trendChart(key){
  const F = facts(), ms = F.ms, vals = ms.map(m=>m.areas[key]), n = vals.length;
  const W=1100, H=200, L=34, R=16, T=18, B=26, x=i=>L+i*(W-L-R)/(n-1), y=v=>T+(100-v)*(H-T-B)/100;
  const d = vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ");
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(AREAS.find(a=>a[0]===key)[1])} score by month: ${vals.map((v,i)=>ymLabel(ms[i].ym)+" "+v).join(", ")}">`;
  [0,50,100].forEach(v => s += `<line class="gl" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`);
  [[70,"Watch below 70"],[40,"At risk below 40"]].forEach(([v,l]) => s += `<line class="th" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="tl" x="${L+6}" y="${y(v)+14}">${l}</text>`);
  s += `<path class="ar" d="${d} L${x(n-1)} ${y(0)} L${x(0)} ${y(0)} Z"/><path class="ln" d="${d}"/>`;
  vals.forEach((v,i) => { const lab = ymLabel(ms[i].ym);
    if(i%3===0 || i===n-1) s += `<text class="ax" x="${x(i)}" y="${H-6}" text-anchor="middle">${lab}</text>`;
    s += `<g class="pt${i===n-1?" last":""}" tabindex="0" aria-label="${lab}: ${v}"><title>${lab}: ${v}</title><rect class="hit" x="${x(i)-18}" y="${T}" width="36" height="${H-T-B}"/><circle cx="${x(i)}" cy="${y(v)}" r="3.5"/><text x="${x(i)}" y="${y(v)-10}" text-anchor="middle">${v}</text></g>` });
  return s + `</svg>`;
}
function renderTrends(){ ["adoption","support"].forEach(k => { const el = $("#tr-"+k); if(el) el.innerHTML = trendChart(k) }) }
/* ---- six areas ---- */
function spark(vals, color){
  const W=200, H=38, n=vals.length, x=i=>i*(W-4)/(n-1)+2, y=v=>H-3-(v/100)*(H-6);
  const d = vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${d} L${x(n-1)} ${H} L${x(0)} ${H} Z" fill="${color}"/><path d="${d}" stroke="${color}"/></svg>`;
}
const BAND_NAME = { g:"Healthy", w:"Watch", b:"At risk" };
function bandRun(series){ const b = band(series[series.length-1]); let n = 0; for(let i=series.length-1; i>=0 && band(series[i])===b; i--) n++; return [BAND_NAME[b], n, n===series.length] }
function renderAreas(F){
  $("#areas").innerHTML = AREAS.map(([k,name]) => {
    const v = F.last.areas[k], dl = F.delta(k), drv = areaDriver(k), [have,all] = coverage(k), series = F.ms.map(m=>m.areas[k]);
    const [bn, run, all18] = bandRun(series), hi = areaInputs(k).filter(i=>i[2]>=0).sort((a,b)=>b[2]-a[2])[0];
    return `<button class="area" type="button" data-open="area:${k}">
      <div class="top"><div class="n">${name}</div>${k==="sentiment"?TAG.ai:TAG.rule}</div>
      <div class="top"><div class="s ${band(v)}" data-sk>${v}</div><div class="chg">${dl===0?"No change":`${dl>0?"+":"−"}${Math.abs(dl)} vs Sep`}<br><span class="sub">${bn} for ${all18?"all 18":run} month${run>1?"s":""}</span></div></div>
      ${spark(series, col(v))}
      <div class="drv">${drv?`Pulling it down: <b>${drv[0]}</b> ${drv[2]} · ${drv[3]}`:"No inputs with data"}${hi && hi!==drv?`<br>Holding it up: <b>${hi[0]}</b> ${hi[2]}`:""}</div>
      <div class="cov"><span>${have} of ${all} inputs have data</span><span>18 months</span></div>
    </button>`}).join("");
}
function evidenceFor(key){
  const ev = taEvidence();
  const pick = { sentiment: e => true, engagement: e => /handed over|MBR|executive|champion|declined|no longer|out of office|touchbase|weekly calls/i.test(e.text),
    support: e => e.tickets.length || /RCA|integration|API|fix/i.test(e.text), adoption: e => /dashboard|PowerBI|adoption|intake|Action Module|workflow|repository|errors/i.test(e.text),
    commercial: e => /renewal|threatened|Auto-Redlining|estimate/i.test(e.text), renewalRisk: e => /renewal|threatened/i.test(e.text) }[key];
  return ev.filter(e => e.kind==="neg" && pick(e)).sort((a,b)=>(b.strong-a.strong)||b.ym.localeCompare(a.ym));
}
function openArea(key){
  const F = facts(), name = AREAS.find(a=>a[0]===key)[1], v = F.last.areas[key], ins = areaInputs(key), ev = evidenceFor(key);
  const isAI = key==="sentiment";
  const missing = ins.filter(k=>k[2]<0).length;
  openPanel(`<div class="dr-head"><div><p class="sub">${isAI?TAG.ai+" Scored by AI from emails":TAG.rule+" Scored by rules from source data"}</p><h2>${name}: <span class="${band(v)}">${v}</span></h2></div></div>
    <div class="dr-sec"><h3>Last 18 months</h3>${spark(F.ms.map(m=>m.areas[key]), col(v))}<p class="sub">${ymLabel(F.ms[0].ym)} ${F.ms[0].areas[key]} → ${ymLabel(F.last.ym)} ${v} · ${F.delta(key)>=0?"+":"−"}${Math.abs(F.delta(key))} vs September</p></div>
    <div class="dr-sec"><h3>Inputs (${ins.length-missing} of ${ins.length} have data)</h3>
      ${ins.map(k=>`<div class="kpi-row"><div><div>${k[0]}</div><div class="d">${k[3]}</div></div><div class="bar">${k[2]>=0?`<i class="bg-${band(k[2])}" style="width:${Math.max(k[2],2)}%"></i>`:""}</div><div class="sc ${k[2]>=0?band(k[2]):""}">${k[2]>=0?k[2]:'<span class="nodata">No data</span>'}</div></div>`).join("")}
      ${missing?`<p class="sub">${missing} input${missing>1?"s":""} sent no value. AHI stores them as −1; they are left out of this area's average and never count as healthy.</p>`:""}</div>
    ${key==="commercial"?`<div class="dr-sec"><h3>Cap rule</h3><p>${TAG.rule} ${TA_RECORD.overrideCode}: “${TA_RECORD.overrideReason}”. Weighted ${TA_RECORD.weightedHealth} → final ${TA_RECORD.finalHealth}.</p></div>`:""}
    ${key==="sentiment"?`<div class="dr-sec"><h3>Strong negatives in ${ymLabel(F.last.ym)} (${F.strongOct.length})</h3>
      ${F.strongOct.map(evItem).join("")||'<p class="sub">No strong negatives this month.</p>'}</div>`:""}
    ${key==="sentiment"?`<div class="dr-sec"><h3>Earlier strong negatives, ${ymLabel(F.ms[0].ym)} to ${ymLabel(F.prev.ym)} (${ev.filter(e=>e.strong && e.ym!==F.last.ym).length})</h3>${ev.filter(e=>e.strong && e.ym!==F.last.ym).map(evItem).join("")}</div>`:""}
    <p class="sub">Source: AHI's monthly sentiment summaries (AI) and the Oct 31 scored record. The original emails are not linked in AHI today.</p>`, true);
}
function evItem(e){
  return `<div class="ev-item ${e.kind}${e.strong?" strong":""}"><span class="bar2"></span><div><p>${esc(e.text)}</p>
    <div class="ev-meta">${e.strong?'<span class="chip sm bad">Strong negative</span>':""}<span>${e.date?fmtDY(e.date):ymLabel(e.ym)}</span>${e.who.map(w=>`<span class="cite">${esc(w)}</span>`).join("")}${e.tickets.map(t=>`<span class="cite">${t}</span>`).join("")}</div></div></div>`;
}

/* ---- evidence tab ---- */
/* risk reasons: each negative statement goes to the first reason whose rule matches it */
const EV_REASONS = [
  ["Champion and sponsor change", /handed over|declined|no longer|executive sponsor|champion|introduced/i],
  ["Renewal threat and escalations", /threatened|escalation/i],
  ["Unresolved incidents and requests", /INC-?\d|SR-?\d|RCA|urgent|ASAP|fix|moving|still pending|still not received/i],
  ["Integration failures", /integration|API|Ariba|ProcessUnity|failure|not running/i],
  ["Adoption and usability", /dashboard|PowerBI|errors|user.friendly|WOPI|intake|Action Module|inaccurate|access/i],
];
const RECENT = "2026-07"; // the last four scored months
function evReasons(){
  const groups = EV_REASONS.map(([name,re]) => ({ name, re, items:[] })).concat([{ name:"Other concerns", re:/./, items:[] }]);
  taEvidence().filter(e => e.kind==="neg").forEach(e => groups.find(g => g.re.test(e.text)).items.push(e));
  groups.forEach(g => {
    g.items.sort((a,b) => (b.strong-a.strong) || b.ym.localeCompare(a.ym));
    g.sev = g.items.some(e => e.strong && e.ym >= RECENT) ? "High" : g.items.some(e => e.strong) ? "Medium" : "Low";
    g.latest = g.items.map(e=>e.ym).sort().pop();
  });
  const rank = { High:0, Medium:1, Low:2 };
  return groups.filter(g => g.items.length).sort((a,b) => rank[a.sev]-rank[b.sev] || b.latest.localeCompare(a.latest));
}
function evQuote(e){ // cited = names a person or a ticket; otherwise it needs review before anyone acts on it
  const cited = e.who.length || e.tickets.length;
  return evItem(e).replace('<div class="ev-meta">', `<div class="ev-meta"><span class="state ${cited?"cited":"review"}">${cited?"Cited":"Needs review"}</span>`);
}
function renderEvidence(){
  const G = evReasons(), chip = n => `<span class="jr-who">${esc(n)}</span>`;
  const row = e => { const cited = e.who.length || e.tickets.length, k = e.kind==="neg" ? "risk" : e.kind==="pos" ? "positive" : "general";
    return `<div class="jr-row ev-r"><span class="jr-rail" aria-hidden="true"><span class="jr-dot ${e.kind}"></span></span><span class="jr-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${JR_IC.note}</svg></span>
      <span class="jr-date">${e.date ? dayMon(e.date) : ymLabel(e.ym)}</span>
      <div class="jr-main static"><span class="jr-d strong-txt">${esc(e.text)}</span><span class="jr-t sm">${[...e.who.map(chip), ...e.tickets.map(chip)].join("")}<span class="jr-cat ${k}">${k==="risk"?(e.strong?"Risk · strong":"Risk"):"Positive"}</span>${cited?"":`<span class="needs">Needs review</span>`}</span></div><span class="jr-act"></span></div>` };
  $("#ev-filters").innerHTML = "";
  $("#evidence").innerHTML = G.length ? G.map(g => `<div class="jr-group rg">${esc(g.name)} <span class="n">${g.items.length}</span><span class="sev ${g.sev}">${g.sev}</span><span class="jr-snap">latest ${ymLabel(g.latest)}</span></div>${g.items.map(row).join("")}`).join("")
    + `<p class="sub" style="margin-top:12px">${TAG.ai} Statements come from AHI's AI-written monthly summaries. ${TAG.rule} Reasons and severity are keyword rules: High means a strong negative in the last four months. “Needs review” means the statement names no person or ticket.</p>`
    : `<div class="jr-empty"><div><b>No risk reasons</b><p>No negative statements in the monthly summaries.</p></div></div>`;
}

/* ---- people ---- */
function renderPeople(){
  const P = taPeople(), cust = P.filter(p=>p.customer);
  const status = p => STATE.confirmed[p.email] ? "confirmed" : null;
  const roleChip = p => p.tagged ? `<span class="chip sm good">${esc(p.tagged)}</span> <span class="tag rule">Tagged</span>`
    : p.suggested ? (status(p) ? `<span class="chip sm good">${esc(p.suggested)}</span> <span class="tag ex">Confirmed here</span>` : `<span class="chip sm">${esc(p.suggested)}</span> ${TAG.ai} <span class="sub">${p.confidence} confidence</span>`) : "";
  const row = p => `<div class="prow"><span class="avatar">${p.name.split(" ").map(w=>w[0]).slice(0,2).join("")}</span>
    <div><div class="n">${esc(p.name)}</div><div class="t">${esc(p.title||p.org)}</div></div>
    <div class="basis">${roleChip(p)}<div>${p.basis?esc(p.basis):p.mentions?`Named in ${p.mentions} monthly summar${p.mentions>1?"ies":"y"}, last ${ymLabel(p.lastMentioned)}.`:"Not named in any monthly summary."}${p.email==="lawrence.kane@transamerica.com"?" No executive contact this month (12-month average 11).":""}</div></div>
    <div class="act">${p.suggested && !p.tagged && !status(p) && !/Former|Left/.test(p.suggested)?`<button class="btn" type="button" data-confirm="${p.email}">Confirm role</button>`:""}</div></div>`;
  const tagged = cust.filter(p=>p.tagged), sugg = cust.filter(p=>!p.tagged && p.suggested && !/Former|Left/.test(p.suggested)).sort((a,b)=>b.mentions-a.mentions);
  const gone = cust.filter(p=>/Former|Left/.test(p.suggested||"")), rest = cust.filter(p=>!p.tagged && !p.suggested).sort((a,b)=>b.mentions-a.mentions||a.name.localeCompare(b.name));
  const others = P.filter(p=>!p.customer), partners = others.filter(p=>/partner/.test(p.org)), internal = others.filter(p=>/internal/.test(p.org)), sys = others.filter(p=>p.org==="System sender");
  const cards = TA_REAL.contacts.length;
  if($("#people-note")) $("#people-note").textContent = `${cust.length} Transamerica and Aegon people from ${cards} contact cards (${cards-P.length} duplicates merged)`;
  if($("#people")) $("#people").innerHTML = `
    <div class="card pgroup"><h3>Sponsor and champions <span>Tagged in AHI</span></h3>${tagged.map(row).join("")}</div>
    <div class="card pgroup"><h3>Suggested roles <span>Inferred from the monthly summaries, confirm in one click</span></h3>${sugg.map(row).join("")}</div>
    <div class="card pgroup"><h3>Departed <span>No longer in the role</span></h3>${gone.map(row).join("")}</div>
    <div class="card pgroup">
      <details class="fold"><summary>Other Transamerica and Aegon contacts (${rest.length})</summary><div class="mini-list">${rest.map(p=>`<div>${esc(p.name)} <span>${p.org==="Transamerica"?"":"Aegon"}</span></div>`).join("")}</div></details>
      <details class="fold"><summary>UnifyApps staff (${internal.length})</summary><div class="mini-list">${internal.map(p=>`<div>${esc(p.name)}</div>`).join("")}</div></details>
      <details class="fold"><summary>System senders (${sys.length})</summary><div class="mini-list">${sys.map(p=>`<div>${esc(p.name)} <span>${esc(p.email)}</span></div>`).join("")}</div></details>
      <div style="padding-top:10px; border-top:1px solid var(--line)"><label class="switch"><input type="checkbox" id="partner-switch" ${STATE.partners?"checked":""}> Show partners (${partners.length})</label>
        ${STATE.partners?`<div class="mini-list">${partners.map(p=>`<div>${esc(p.name)} <span>${esc(p.org.replace(" (partner)",""))}</span></div>`).join("")}</div>`:""}</div>
    </div>`;
  if($("#partner-switch")) $("#partner-switch").onchange = e => { STATE.partners = e.target.checked; renderPeople() };
  renderOrbit(); renderStake();
  const short = [tagged.find(p=>/Sponsor/.test(p.tagged)), sugg[0], ...tagged.filter(p=>/Champion/.test(p.tagged)), gone.find(p=>/Former/.test(p.suggested))].filter(Boolean);
  if($("#people-short")) $("#people-short").innerHTML = short.map(p => `<div class="ps"><span class="avatar">${p.name.split(" ").map(w=>w[0]).slice(0,2).join("")}</span><div style="min-width:0"><div class="t">${esc(p.name)}</div><div class="d">${p.tagged?esc(p.tagged)+" · tagged":esc(p.suggested)+(STATE.confirmed[p.email]?" · confirmed":" · suggested")}${p.email==="lawrence.kane@transamerica.com"?" · no contact this month":""}</div></div></div>`).join("")
    + TA_NEWS_PEOPLE.map(n => `<div class="ps"><span class="avatar">${n.name.split(" ").map(w=>w[0]).join("")}</span><div style="min-width:0"><div class="t">${esc(n.name)}</div><div class="d">${STATE.confirmed["news:"+n.name]?`${n.suggested} · confirmed`:`Inferred ${n.suggested.toLowerCase()} · from public news`}</div></div></div>`).join("");
  if(typeof decorateSections==="function" && $("#secnav .seg")) decorateSections();
}

/* ---- stakeholders table: every customer contact, engagement and tone from Sirion's monthly summaries ---- */
const STK = { filter:"all", sort:"role", page:0, q:"" };
const STK_MONTHS = taMonths().map(m => m.ym);
function seniority(t){ t = t||""; return /chief|cxo|ceo|cfo|coo|evp|president/i.test(t) ? "C-suite" : /\bvp\b|vice president|head of/i.test(t) ? "VP / Head" : /director/i.test(t) ? "Director" : /manager|lead/i.test(t) ? "Manager" : t ? "Individual contributor" : "" }
function personaClass(r){ return /Sponsor/i.test(r) ? "p-sponsor" : /Champion/i.test(r) ? "p-champion" : /Technical|IT|security|admin/i.test(r) ? "p-tech" : /Former|Left/i.test(r) ? "p-former" : "p-user" }
function stakeRows(){
  const P = taPeople().filter(p => p.customer), keys = new Set(orbitPeople().map(x => x.key)), ev = taEvidence();
  const rows = P.map(p => {
    const gone = /Former|Left/.test(p.suggested||""), conf = STATE.confirmed[p.email], last = lastNamed(p.name), days = last ? daysBetween(last, TODAY) : null;
    const mine = STATE.roles[p.email];
    const kind = mine ? (/Former|Left/.test(mine) ? "departed" : "tagged") : p.tagged ? "tagged" : gone ? "departed" : p.suggested ? "suggested" : "other";
    const label = mine || (p.tagged ? p.tagged.replace(" / CXO","") : gone ? p.suggested : p.suggested ? shortRole(p.suggested) : "");
    const persona = label ? `<span class="persona ${personaClass(label)}">${esc(label)}${mine ? "" : p.suggested && !p.tagged && !conf && !gone ? ` <span class="ai-mark" title="Inferred from Sirion's monthly summaries, not confirmed">Inferred</span>` : ""}</span>` : "";
    const eng = days==null ? ["none","Not named"] : days<=30 ? ["active","Active"] : days<=90 ? ["warm","Warm"] : ["quiet","Quiet"];
    const said = ev.filter(e => e.who.includes(p.name)), pos = said.filter(e => e.kind==="pos").length, neg = said.length - pos;
    const tone = !said.length ? ["none","—"] : pos && !neg ? ["pos","Positive"] : neg && !pos ? ["neg","Negative"] : ["mix","Mixed"];
    const months = STK_MONTHS.map(ym => said.filter(e => e.ym===ym).length);
    const gap = p.email==="lawrence.kane@transamerica.com" ? ["warn",`Executive sponsor last named ${last?fmtDY(last):"never"}; no executive contact this month`]
      : p.tagged && (days==null || days>90) ? ["warn",`Tagged ${p.tagged.replace(" / CXO","")} but ${days==null?"never named in a summary":"not named since "+fmtDY(last)}`]
      : gone ? ["warn","Left the role: hand over the relationship"] : p.suggested && !conf ? ["info",`Suggested from ${p.mentions} summar${p.mentions===1?"y":"ies"}; confirm the role`]
      : days!=null && days<=30 ? ["ok",`Active: named ${said.filter(e=>e.ym>="2026-08").length} times in the last 3 months`] : p.mentions ? ["info",`Named in ${p.mentions} summar${p.mentions===1?"y":"ies"}`] : ["none","Contact card only"];
    return { p, kind, label, persona, eng, tone, pos, neg, months, gap, days, last, sen:seniority(p.title), open: keys.has(p.email), aiRole: p.suggested && !p.tagged && !gone ? shortRole(p.suggested) : null };
  });
  TA_NEWS_PEOPLE.forEach(n => { const k = "news:"+n.name, c = STATE.confirmed[k];
    rows.push({ p:{ name:n.name, title:n.title, email:k, mentions:0, tagged:null }, kind:"suggested", label:n.suggested, persona:`<span class="persona ${personaClass(n.suggested)}">${esc(n.suggested)}${c?"":` <span class="ai-mark" title="Inferred from public news, not confirmed">Inferred</span>`}</span>`,
      eng:["none","No contact"], tone:["none","—"], pos:0, neg:0, months:STK_MONTHS.map(()=>0), gap:["warn",`From public news (${n.source}); not in AHI's contacts yet`], days:null, last:null, sen:seniority(n.title), open:true, canConfirm:false }) });
  return rows;
}
const GAP_IC = { ok:'<path d="M5 12l4 4L19 6"/>', warn:'<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>', info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.5"/>', none:'<circle cx="12" cy="12" r="8.5"/>' };
function renderStake(){
  if(!$("#st-rows")) return;
  const order = {tagged:0, suggested:1, departed:2, other:3};
  const all = stakeRows(), cnt = k => all.filter(r => k==="all" || r.kind===k).length;
  $("#st-filters").innerHTML = [["all","All"],["tagged","Tagged"],["suggested","Inferred"],["departed","Departed"],["other","No role"]].map(([k,l]) => `<button type="button" data-stf="${k}" aria-pressed="${STK.filter===k}">${l} <span class="n">${cnt(k)}</span></button>`).join("");
  $("#st-sorts").innerHTML = `<span class="st-sorts-l">Sort</span>` + [["role","Role"],["recent","Last named"],["mentions","Most named"],["name","Name"]].map(([k,l]) => `<button type="button" data-sts="${k}" aria-pressed="${STK.sort===k}">${l}</button>`).join("");
  const rows = all.filter(r => (STK.filter==="all" || r.kind===STK.filter) && (!STK.q || (r.p.name+" "+(r.p.title||"")+" "+r.label).toLowerCase().includes(STK.q)));
  const by = { role:(a,b)=>order[a.kind]-order[b.kind] || b.p.mentions-a.p.mentions || a.p.name.localeCompare(b.p.name),
    recent:(a,b)=>(a.days??1e9)-(b.days??1e9), mentions:(a,b)=>b.p.mentions-a.p.mentions, name:(a,b)=>a.p.name.localeCompare(b.p.name) }[STK.sort];
  rows.sort(by); STK.rows = rows;
  const per = 10, pages = Math.max(1, Math.ceil(rows.length/per)); STK.page = Math.max(0, Math.min(STK.page, pages-1));
  const view = rows.slice(STK.page*per, STK.page*per+per), mx = Math.max(1, ...rows.flatMap(r => r.months));
  const strip = r => `<span class="mstrip" title="${r.p.mentions} mentions across ${STK_MONTHS.length} monthly summaries">${r.months.map((n,k) => `<i style="height:${n?4+Math.round(n/mx*14):2}px" class="${n?"on":""}" title="${ymLabel(STK_MONTHS[k])}: ${n}"></i>`).join("")}</span>`;
  $("#st-rows").innerHTML = view.length ? view.map(r => `<tr ${r.open?`data-person="${esc(r.p.email)}" tabindex="0"`:""}>
    <td><div class="st-c"><span class="avatar">${esc(r.p.name.split(" ").map(w=>w[0]).slice(0,2).join(""))}</span><div><b>${esc(r.p.name)}</b><span>${esc(r.sen || r.p.org || "")}</span></div></div></td>
    <td>${STK.edit===r.p.email ? `<select class="role-sel" data-rolesel="${esc(r.p.email)}" aria-label="Role for ${esc(r.p.name)}"><option value="">${r.label?"Choose a role":"No role yet"}</option>${r.aiRole && !STATE.roles[r.p.email] ? `<option value="${esc(r.aiRole)}">✓ Keep ${esc(r.aiRole)} (inferred)</option>` : ""}${ROLE_OPTS.map(o=>`<option ${o===r.label?"selected":""}>${o}</option>`).join("")}<option value="__clear">Clear role</option></select>`
      : `<span class="role-cell">${r.persona || `<button class="role-set" type="button" data-roleedit="${esc(r.p.email)}">+ Set role</button>`}${r.persona ? `<button class="role-edit" type="button" data-roleedit="${esc(r.p.email)}" aria-label="Edit role for ${esc(r.p.name)}" title="Edit role"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button>` : ""}</span>`}</td>
    <td><span class="pill-s ${r.eng[0]}">${r.eng[1]}</span></td>
    <td><span class="pill-s tone-${r.tone[0]}" title="${r.pos} positive, ${r.neg} negative statements naming them">${r.tone[1]}</span></td>
    <td>${strip(r)}<span class="st-last">${r.last?"Last "+fmtD(r.last):"Never named"}</span></td>
    <td class="st-act">${/@/.test(r.p.email)?`<a class="ic-btn" href="mailto:${esc(r.p.email)}" title="Email ${esc(r.p.name)}" aria-label="Email ${esc(r.p.name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg></a>`:""}</td></tr>`).join("")
    : `<tr><td colspan="6"><div class="jr-empty"><div><b>No stakeholders match</b><p>Change the search or the persona filter.</p></div></div></td></tr>`;
  const nums = Array.from({length:pages},(_,k)=>k).filter(k => k<2 || k>pages-3 || Math.abs(k-STK.page)<=1);
  $("#st-foot").innerHTML = `<span>Showing ${rows.length ? STK.page*per+1 : 0}–${STK.page*per+view.length} of ${rows.length} rows</span>
    <span class="pager"><button class="btn sm" type="button" data-stp="-1" ${STK.page?"":"disabled"} aria-label="Previous page">‹</button>${nums.map((k,x) => `${x && k-nums[x-1]>1?'<span class="sub">…</span>':""}<button class="btn sm ${k===STK.page?"on":""}" type="button" data-stpg="${k}" aria-current="${k===STK.page}">${k+1}</button>`).join("")}<button class="btn sm" type="button" data-stp="1" ${STK.page<pages-1?"":"disabled"} aria-label="Next page">›</button></span>`;
}
function exportStake(){
  const q = v => `"${String(v??"").replace(/"/g,'""')}"`;
  const csv = [["Name","Seniority","Title","Persona","Engagement","Tone","Mentions","Last named","Email"].join(",")].concat(STK.rows.map(r =>
    [r.p.name, r.sen, r.p.title||"", r.label, r.eng[1], r.tone[1], r.p.mentions, r.last?fmtDY(r.last):"", /@/.test(r.p.email)?r.p.email:""].map(q).join(","))).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"})); a.download = "transamerica-stakeholders.csv"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}

/* ---- journey tab: every dated activity (key events + summary statements), upcoming first, then newest ---- */
const JR = { filter:"all", open:null, view:"all", shown:15 };
const JR_CAT = { neg:"Risk", pos:"Positive", goal:"Target", end:"Renewal", flag:"Risk" };
const srcLabel = s => { s = s.replace(/^sentiment /, "Monthly summary, "); return s[0].toUpperCase()+s.slice(1) };
const JR_IC = {
  meeting:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  email:'<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  ticket:'<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="2 2"/>',
  record:'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  file:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  ai:'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/>',
  teams:'<path d="M4 6h10v10H4z"/><path d="M7 9h4M9 9v5"/><path d="M14 9h4.5a1.5 1.5 0 0 1 1.5 1.5V15a3 3 0 0 1-3 3h-1"/><circle cx="17.5" cy="5.5" r="1.8"/>',
  call:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  note:'<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>' };
const PLAY_FOR = { "2026-10-21":"champion", "2026-11-26":"commit" }; // one row per play, where acting on it makes sense
const CH_NAME = { email:"Email", meeting:"Meeting", teams:"Teams", call:"Call", ticket:"Ticket", record:"AHI record", file:"Order form", ai:"AI insight", note:"Summary note" };
function jrChannel(text, src){
  if(/AHI record/.test(src)) return "record"; if(/order forms/.test(src)) return "file"; if(/AI insight/.test(src)) return "ai";
  if(/Last email/.test(text)) return "email"; if(/Last meeting/.test(text)) return "meeting";
  if(/\b(on|via|in a) (MS )?Teams\b|Teams (message|chat)/i.test(text)) return "teams";
  if(/\b(after|on|during) a call\b|\bcall with\b|\bphone\b/i.test(text)) return "call";
  if(/INC-|SR-|#|ticket|RCA|Jira/i.test(text)) return "ticket";
  if(/meeting|MBR|business review|call|QBR|check-in|session|demo|workshop/i.test(text)) return "meeting";
  if(/email|replied|thread|wrote|forward|asked|sent|notice/i.test(text)) return "email";
  return "note";
}
function jrTitle(e){ // a short, honest heading for a summary statement
  if(e.tickets.length) return `Ticket ${e.tickets[0]}`;
  const ch = jrChannel(e.text, "");
  if(/MBR|business review/i.test(e.text)) return "Monthly business review";
  return { meeting:"Meeting", email:"Email thread", ticket:"Support ticket", note:"Account update" }[ch];
}
function jrItems(){
  const ev = taEvidence().filter(v => v.date), used = new Set(), idx = taPeopleIndex(), ppl = Object.fromEntries(taPeople().map(p => [p.name, p]));
  const role = n => { const p = ppl[n]; return p ? (p.tagged ? p.tagged.replace(" / CXO","") : p.suggested && !/Former|Left/.test(p.suggested) ? shortRole(p.suggested) : /Former/.test(p.suggested||"") ? "Former champion" : "") : "" };
  const split = who => ({ internal: who.filter(n => idx[n]==="sirion"), external: who.filter(n => idx[n]!=="sirion").map(n => [n, role(n)]) });
  const items = TA_EVENTS.map(([d,k,text,src]) => { const dt = new Date(d+"T00:00:00");
    const match = /^sentiment/.test(src) ? ev.find(v => !used.has(v) && v.kind===k && Math.abs(v.date-dt) <= 2*DAY) : null; if(match) used.add(match);
    const who = match ? match.who : [];
    return { id:"k"+d+text.slice(0,12), date:dt, kind:k, key:true, title:text, desc: match ? match.text : srcLabel(src)+".", src:srcLabel(src), ch:jrChannel(match?match.text:text, src), who, ...split(who), tickets: match?match.tickets:[], play:PLAY_FOR[d] } });
  ev.filter(v => !used.has(v)).forEach(v => items.push({ id:"s"+v.date.toISOString()+v.text.slice(0,12), date:v.date, kind:v.kind, key:false, title:jrTitle(v), desc:v.text, src:"Monthly summary, "+ymLabel(v.ym), ch:jrChannel(v.text,""), who:v.who, ...split(v.who), tickets:v.tickets, play:null }));
  return items;
}
const dayMon = d => d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).replace("Sept","Sep");
/* plain-language copy for key events that come from the record rather than a summary */
const KEY_COPY = { "2026-10-31":["Health capped at 50","Renewal in 59 days with auto-renew off · AHI record, Oct 31"],
  "2026-12-30":["Renewal due · $330K CARR","2 order forms, auto-renew off"],
  "2026-11-26":["Commitment target date","Suggested by the AI insight: get a signed renewal commitment"] };
function jrText(i){ // a short title and a description that never repeats it
  const kc = i.key && KEY_COPY[i.date.toISOString().slice(0,10)] || (i.key && KEY_COPY[dayISO(i.date)]);
  if(kc && !i.who.length) return { t:kc[0], d:kc[1] };
  let d = i.desc === i.src+"." ? "" : i.desc.replace(/^On \w+ \d{1,2},? /, "");
  d = d.charAt(0).toUpperCase()+d.slice(1);
  if(d.toLowerCase().startsWith(i.title.toLowerCase())){ d = d.slice(i.title.length).replace(/^[\s,.:;–-]+/,"").replace(/^on \w+ \d{1,2},? /i, ""); d = d.length < 25 ? "" : d.charAt(0).toUpperCase()+d.slice(1) }
  return { t:i.title, d };
}
const dayISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function renderActivity(){
  if(!$("#activity")) return;
  const all = jrItems().filter(i => !/Engagement snapshot/.test(i.src)), key = k => k==="neg"||k==="flag" ? "risk" : k==="pos" ? "positive" : "general";
  const counts = { all:all.length, risk:0, positive:0, general:0 }; all.forEach(i => counts[key(i.kind)]++);
  $("#jr-filters").hidden = JR.view==="reason";
  if(JR.view!=="reason") $("#jr-filters").innerHTML = [["all","All"],["risk","Risk"],["positive","Positive"],["general","General"]].map(([k,l]) => `<button type="button" data-jrf="${k}" aria-pressed="${JR.filter===k}">${l} <span class="n">${counts[k]}</span></button>`).join("");
  const list = all.filter(i => JR.filter==="all" || key(i.kind)===JR.filter);
  const up = list.filter(i => i.date > TODAY).sort((a,b)=>a.date-b.date), past = list.filter(i => i.date <= TODAY).sort((a,b)=>b.date-a.date);
  const chip = n => `<span class="jr-who">${esc(n)}</span>`;
  const row = i => { const open = JR.open===i.id, pl = i.play && playFor(i.play), k = key(i.kind), cat = {risk:"Risk", positive:"Positive", general:"General"}[k], tx = jrText(i);
    const recDetail = /AHI record/.test(i.src) ? SUM_REFS.cap.text : /Order forms/.test(i.src) ? SUM_REFS.renew.text : /AI insight/.test(i.src) ? SUM_REFS.insight.text : null;
    const steps = pl ? `<div class="jr-box wide next"><h4>Next steps: ${esc(pl.title)}</h4><ol>${pl.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>` : "";
    const nobody = !i.internal.length && !i.external.length;
    const more = !open ? "" : recDetail && !i.who.length ? `<div class="jr-more"><div class="jr-box wide"><h4>${esc(i.src)} ${/AI insight/.test(i.src)?TAG.ai:TAG.rule}</h4><p>${esc(recDetail)}</p></div>${steps}</div>`
      : `<div class="jr-more">${nobody ? `<div class="jr-box wide"><h4>Participants</h4><p>No participants recorded</p></div>` : `<div class="jr-box"><h4>Sirion participants</h4><p>${i.internal.length ? i.internal.map(esc).join(", ") : "None named"}</p></div>
        <div class="jr-box"><h4>Customer participants</h4><p>${i.external.length ? i.external.map(([n,r]) => `${esc(n)}${r?` <span class="jr-role">${esc(r)}</span>`:""}`).join(", ") : "None named"}</p></div>`}
        <div class="jr-box wide"><h4>What the summary says ${/Monthly summary/.test(i.src)?TAG.ai:""}</h4><p>${esc(i.desc)}</p><p class="sub">${esc(i.src)}${i.tickets.length?" · "+i.tickets.map(esc).join(", "):""}</p></div>${steps}</div>`;
    return `<div class="jr-row ${open?"open":""}"><span class="jr-rail" aria-hidden="true"><span class="jr-dot ${i.kind}"></span></span>
      <span class="jr-ic ch-${i.ch}" title="${CH_NAME[i.ch]}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${JR_IC[i.ch]}</svg></span>
      <span class="jr-date" id="jd-${esc(i.id).replace(/[^\w-]/g,"")}">${dayMon(i.date)}<span class="jr-ch">${CH_NAME[i.ch]}</span></span>
      <button type="button" class="jr-main" data-jr="${esc(i.id)}" aria-expanded="${open}" aria-describedby="jd-${esc(i.id).replace(/[^\w-]/g,"")}"><span class="jr-t"><span class="jr-tt">${esc(tx.t)}</span>${i.who.filter(w => !tx.t.includes(w)).slice(0,2).map(chip).join("")}<span class="jr-cat ${k}">${cat}</span></span>${tx.d?`<span class="jr-d">${esc(tx.d)}</span>`:""}</button>
      <span class="jr-act"></span>${more}</div>` };
  const snap = TA_EVENTS.filter(e => /engagement snapshot/.test(e[3])).map(e => `${/email/i.test(e[2])?"last email":"last meeting"} ${fmtD(new Date(e[0]+"T00:00:00"))}`).join(" · ");
  const empty = (t,s) => `<div class="jr-empty"><div><b>${t}</b><p>${s}</p></div></div>`;
  $("#activity").innerHTML = `<div class="jr-group">Upcoming <span class="n">${up.length}</span></div>${up.length ? up.map(row).join("") : empty("Nothing upcoming","Nothing is scheduled in this filter.")}
    <div class="jr-group">Past <span class="n">${past.length}</span>${snap?`<span class="jr-snap">· ${snap}</span>`:""}</div>${past.length ? past.slice(0, JR.shown).map(row).join("") : empty("No past activity","Nothing in this filter.")}
    ${past.length > JR.shown ? `<button class="link jr-moreb" type="button" data-jrmore>Show ${Math.min(15, past.length-JR.shown)} more of ${past.length-JR.shown}</button>` : ""}`;
}

/* ---- intelligence tab: AHI's own inputs, strongest and weakest, plus what is not scored; public news ---- */
function renderIntel(){
  if(!$("#int-up")) return;
  const all = inputsFlat(), name = k => (AREAS.find(a => a[0]===k)||[k,k])[1].replace(" and enhancement requests","");
  const li = x => `<li><div class="wa-top"><b>${esc(x.name)}</b><span class="sc-v ${band(x.v)}">${x.v}</span></div><span class="sc-bar"><i class="${band(x.v)}" style="width:${Math.max(2,x.v)}%"></i></span><p><span class="sc-area">${esc(name(x.area))}</span> ${esc(x.note)}</p></li>`;
  $("#int-up").innerHTML = [...all].sort((a,b)=>b.v-a.v).slice(0,4).map(li).join("");
  $("#int-down").innerHTML = [...all].sort((a,b)=>a.v-b.v).slice(0,4).map(li).join("");
  const miss = AREAS.flatMap(([k]) => areaInputs(k).filter(i => i[2]<0).map(i => [k, i]));
  if($("#int-miss")) $("#int-miss").innerHTML = miss.map(([k,i]) => `<li><b>${esc(i[0])}</b><p><span class="sc-area">${esc(name(k))}</span> ${esc(i[3])}</p></li>`).join("");
  const IC = { "Executive leadership":'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.6-6 7-6s6 2 7 6"/>', "Corporate and regulatory":'<path d="M4 20h16M6 20V9M10 20V9M14 20V9M18 20V9M3 9l9-5 9 5z"/>',
    "Financial and operational":'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>', "Security and incidents":'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>', "Procurement and legal tech":'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>' };
  $("#market").innerHTML = T.market.map((m, mi) => { const evs = m[2].split(/(?<=\.)\s+(?=[A-Z][a-z]{2} \d)/).filter(Boolean);
    return `<div class="nw-row"><span class="act-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${IC[m[0]]||IC["Procurement and legal tech"]}</svg></span>
      <div><div class="nw-h"><h3>${esc(m[0])}</h3>${m[1]==null?"":``}${m[1]==null?`<span class="pill-s none">No events</span>`:`<span class="nw-rel" title="How much this matters to the renewal, 0 to 100 (AI)">Relevance <span class="sc-bar sm"><i style="width:${m[1]}%"></i></span><b>${m[1]}</b></span>`}</div>
        ${evs.map(e => { const mm = e.match(/^([A-Z][a-z]{2} \d{1,2}):\s*(.*)$/); return `<div class="nw-ev${mm?"":" nodate"}">${mm?`<span class="jr-date">${mm[1]}, 2026</span><span>${esc(mm[2])}</span>`:`<span class="sub">${esc(e)}</span>`}</div>` }).join("")}
        ${m[3]?`<div class="impact"><span aria-hidden="true"><i class=spk></i></span><span><b>Why it matters:</b> ${esc(m[3])}</span></div>`:""}
        ${m[0]==="Executive leadership"?`<button class="link" type="button" data-person="news:Jay Orlandi">Jay Orlandi is a suggested sponsor in Stakeholders ›</button>`:""}</div></div>` }).join("");
}

/* ---- health tab: how the score is built, and every input as a scorecard ---- */
function openInputs(){ HS.area = "all";
  openPanel(`<div class="dr-head"><div><p class="sub">Health · updated <span class="ago">${ago()}</span></p><h2>All inputs</h2></div></div>
    <p class="sub">Every input behind the six areas, scored 0 to 100 against fixed thresholds, weakest first. Select a row for that area's evidence.</p>
    <div class="sc-filters-wrap"><div class="jr-filters" id="sc-filters" role="group" aria-label="Filter by area"></div></div>
    <div class="table-wrap"><table class="st-table sc-table" aria-label="All inputs"><thead><tr><th>Input</th><th>Value</th><th>Score</th><th>Status</th></tr></thead><tbody id="scorecard"></tbody></table></div>
    <p class="sub" id="sc-foot" style="margin-top:10px"></p>`, true);
  $("#drawer").classList.add("xwide"); renderScorecard();
}
const HS = { area:"all" };
function renderScorecard(){
  if(!$("#scorecard")) return;
  const rows = AREAS.flatMap(([k,n]) => areaInputs(k).map(i => ({ area:k, areaName:n, name:i[0], v:i[2], note:i[3] })));
  const seen = new Set(), uniq = rows.filter(r => { const id = r.area+r.name; if(seen.has(id)) return false; seen.add(id); return true });
  $("#sc-filters").innerHTML = [["all","All",uniq.length]].concat(AREAS.map(([k,n]) => [k, n.replace(" and enhancement requests",""), uniq.filter(r=>r.area===k).length]))
    .map(([k,l,c]) => `<button type="button" data-hsa="${k}" aria-pressed="${HS.area===k}">${esc(l)} · ${c}</button>`).join("");
  const list = uniq.filter(r => HS.area==="all" || r.area===HS.area).sort((a,b) => (a.v<0)-(b.v<0) || a.v-b.v);
  $("#scorecard").innerHTML = list.map(r => `<tr data-open="area:${r.area}" tabindex="0"><td><b>${esc(r.name)}</b><span class="sc-area">${esc(r.areaName)}</span></td><td class="sc-note">${esc(r.note)}</td>
    <td>${r.v<0 ? `<span class="nodata">No data</span>` : `<span class="sc-bar"><i class="${band(r.v)}" style="width:${Math.max(2,r.v)}%"></i></span><b class="sc-v ${band(r.v)}">${r.v}</b>`}</td>
    <td><span class="pill-s ${r.v<0?"none":r.v>=70?"active":r.v>=40?"warm":"tone-neg"}">${r.v<0?"Not scored":r.v>=70?"Holding up":r.v>=40?"Watch":"Pulling down"}</span></td></tr>`).join("");
  const miss = uniq.filter(r => r.v<0).length;
  $("#sc-foot").textContent = `${uniq.length} inputs, weakest first. ${miss} have no data and are left out of their area's average, never counted as healthy.`;
}

/* ---- relationship orbit: rings by how recently someone was named in Sirion's summaries ---- */
const RINGS = [["LAST 30 DAYS",30],["30 TO 90 DAYS",90],["QUIET OVER 90 DAYS",Infinity]];
function lastNamed(name){
  const ds = taEvidence().filter(e => e.who.includes(name)).map(e => e.date || monthEnd(e.ym));
  return ds.length ? new Date(Math.max(...ds)) : null;
}
function shortRole(s){ return /likely new champion/i.test(s) ? "Champion" : s.split(",")[0] }
function orbitPeople(){
  const P = taPeople().filter(p => p.customer && (p.tagged || p.suggested));
  const ppl = P.map(p => {
    const last = lastNamed(p.name), days = last ? daysBetween(last, TODAY) : null;
    const gone = /Former|Left/.test(p.suggested||""), confirmed = STATE.confirmed[p.email];
    const ring = days==null ? 2 : RINGS.findIndex(r => days <= r[1]);
    const state = gone || ring===2 ? "quiet" : (p.suggested && !p.tagged && !confirmed ? "ai" : "active");
    const role = STATE.roles[p.email] ? STATE.roles[p.email] : p.tagged ? p.tagged.replace(" / CXO","") : gone ? (/Former champion/.test(p.suggested) ? "Champion, handed over" : "Left the role")
      : confirmed ? shortRole(p.suggested) : "Inferred · " + shortRole(p.suggested);
    return { key:p.email, name:p.name, title:p.title||p.org, role, state, ring, days, last, mentions:p.mentions, p };
  }).filter(x => x.p.tagged || /handed over|Left/.test(x.role) || x.mentions >= 2 || (x.days != null && x.days <= 90)); // one-off mentions stay in the list below
  TA_NEWS_PEOPLE.forEach(n => { const k = "news:"+n.name, c = STATE.confirmed[k];
    ppl.push({ key:k, name:n.name, title:n.title, role: c ? n.suggested : "Inferred · "+n.suggested, state: c ? "quiet" : "ai", ring:2, days:null, last:null, mentions:0, news:n }) });
  return ppl;
}
function renderOrbit(){
  if(!$("#orbit")) return;
  const ppl = orbitPeople(), W = 760, H = 770, cx = 380, cy = 385, R = [118, 218, 312];
  let s = R.map((r,i) => `<circle class="ring${i===2?" outer":""}" cx="${cx}" cy="${cy}" r="${r}"/><text class="rl" x="${cx}" y="${cy-r-8}" text-anchor="middle">${RINGS[i][0]}</text>`).join("");
  // one angle slot per person, taken in turns across the rings so neighbours never share an angle; the top is left clear for the ring labels
  const byRing = [0,1,2].map(ri => ppl.filter(p => p.ring===ri).sort((a,b) => a.state.localeCompare(b.state) || b.mentions-a.mentions));
  const order = []; while(byRing.some(r => r.length)) [2,1,0].forEach(ri => byRing[ri].length && order.push(byRing[ri].shift()));
  const pos = {};
  order.forEach((p,i) => { const a = (-62 + 304*(i+.5)/order.length) * Math.PI/180; pos[p.key] = [cx + R[p.ring]*Math.cos(a), cy + R[p.ring]*Math.sin(a)] });
  ppl.forEach(p => { const [x,y] = pos[p.key], d = Math.hypot(x-cx, y-cy), ux = (x-cx)/d, uy = (y-cy)/d;
    s += `<line class="ln ${p.state}" x1="${cx+ux*48}" y1="${cy+uy*48}" x2="${x-ux*26}" y2="${y-uy*26}" style="stroke-width:${(1.2+Math.min(p.mentions,8)*.3).toFixed(1)}"/>` });
  s += `<g class="ctr"><circle cx="${cx}" cy="${cy}" r="46"/><text class="t1" x="${cx}" y="${cy+2}" text-anchor="middle">Sirion</text><text class="t2" x="${cx}" y="${cy+18}" text-anchor="middle">Account team</text></g>`;
  ppl.forEach(p => { const [x,y] = pos[p.key], ini = p.name.split(" ").map(w=>w[0]).slice(0,2).join("");
    const when = p.last ? `last named ${fmtDY(p.last)}` : p.news ? "from public news, never named in a summary" : "never named in a summary";
    s += `<g class="nd ${p.state}" tabindex="0" role="button" data-person="${esc(p.key)}" aria-label="${esc(p.name)}, ${esc(p.role)}, ${when}">
      <circle class="c" cx="${x}" cy="${y}" r="24"/><text class="ini" x="${x}" y="${y+4}" text-anchor="middle">${ini}</text>
      <text class="nm" x="${x}" y="${y+40}" text-anchor="middle">${esc(p.name)}</text><text class="rlab" x="${x}" y="${y+53}" text-anchor="middle">${esc(p.role)}</text></g>` });
  $("#orbit").innerHTML = `<div class="oh"><h3>Relationship orbit</h3>${TAG.ai}<span class="tag ai">Role inference</span>
      <p>Closer to the centre means named more recently in Sirion's meeting and email summaries. Line weight shows how often.</p></div>
    <div class="orbit-scroll"><svg class="orbit" viewBox="0 0 ${W} ${H}" role="group" aria-label="Relationship orbit for TransAmerica key people">${s}</svg></div>
    <div class="olegend"><span><i class="a"></i>Active contact</span><span><i class="q"></i>Quiet or no contact</span><span><i class="s"></i>Inferred, not confirmed</span></div>`;
  const by = r => ppl.filter(p => p.ring===r && p.state!=="quiet").length;
  const spon = ppl.find(p => /Executive Sponsor/.test(p.role)), gone = ppl.filter(p => /handed over|Left/.test(p.role)), sugg = ppl.filter(p => p.state==="ai");
  const quietChamps = ppl.filter(p => p.p && /Champion/.test(p.p.tagged||"") && p.state==="quiet");
  $("#orbit-side").innerHTML = `
    <div class="card att"><div class="head"><h2>Needs attention</h2>${TAG.rule}</div>
      ${spon && spon.state==="quiet" ? `<div class="ps"><span class="avatar">${spon.name.split(" ").map(w=>w[0]).join("")}</span><div><div class="t">${esc(spon.name)} · executive sponsor</div><div class="d">${spon.last ? `Last named ${fmtDY(spon.last)}, ${spon.mentions===1?"once":spon.mentions+" times"} in 18 monthly summaries` : "Never named in a monthly summary"}. No executive contact this month (12-month average 11).</div></div></div>` : ""}
      ${quietChamps.length ? `<div class="ps"><span class="avatar">CH</span><div><div class="t">${quietChamps.length} tagged champion${quietChamps.length>1?"s":""} gone quiet</div><div class="d">${quietChamps.map(p=>`<b>${esc(p.name)}</b> (${p.last?`last named ${fmtDY(p.last)}`:"never named in a summary"})`).join(", ")}. The tags may be out of date.</div></div></div>` : ""}
      ${gone.map(p => `<div class="ps"><span class="avatar">${p.name.split(" ").map(w=>w[0]).join("")}</span><div><div class="t">${esc(p.name)} · ${esc(p.role.toLowerCase())}</div><div class="d">${p.last?`Last named ${fmtDY(p.last)}.`:""}</div></div></div>`).join("")}
      <div class="ps"><span class="avatar">AI</span><div><div class="t">${sugg.length} role suggestion${sugg.length===1?"":"s"} to confirm</div><div class="d">${sugg.map(p=>`<b>${esc(p.name)}</b> (${esc(p.role.replace("Inferred · ","").toLowerCase())})`).join(", ")}</div></div></div></div>
    <div class="card"><div class="head"><h2>Coverage</h2><span class="sub">Key people, excluding quiet</span></div>
      <div class="stat-grid"><div class="stat"><div class="l">Last 30 days</div><div class="v">${by(0)}</div></div><div class="stat"><div class="l">30 to 90 days</div><div class="v">${by(1)}</div></div><div class="stat"><div class="l">Quiet or gone</div><div class="v">${ppl.filter(p=>p.state==="quiet").length}</div></div></div>
      <p class="sub" style="margin-top:8px">${by(0)+by(1) <= 1 ? "Single-threaded: one active contact or fewer." : `${by(0)+by(1)} people active in the last 90 days.`} Recency comes from the dates in AHI's monthly summaries, not from email metadata.</p></div>`;
}
function openPerson(k){
  const p = orbitPeople().find(x => x.key===k); if(!p) return;
  const canConfirm = p.state==="ai";
  openPanel(`<div class="dr-head"><div><p class="sub">${esc(p.title||"")}</p><h2>${esc(p.name)}</h2></div></div>
    <div class="dr-sec"><h3>Role ${p.role.startsWith("AI")?TAG.ai:p.p&&p.p.tagged?'<span class="tag rule">Tagged</span>':""}</h3><p>${esc(p.role)}</p><p class="sub">${esc(p.news ? p.news.basis : p.p.basis || (p.p.tagged ? "Tagged by hand in AHI." : ""))}</p>
      ${canConfirm ? `<div class="row-actions" style="margin-top:8px"><button class="btn primary" type="button" data-confirm="${esc(k)}">Confirm role</button></div>` : ""}</div>
    <div class="dr-sec"><h3>Contact</h3><p>${p.last ? `Last named ${fmtDY(p.last)} (${p.days} days ago), in ${p.mentions} monthly summar${p.mentions===1?"y":"ies"}.` : p.news ? `Source: ${esc(p.news.source)}. Not in AHI's contacts.` : "Never named in a monthly summary."}${p.p && p.p.sources.length ? ` Seen in ${p.p.sources.join(", ")}.` : ""}</p></div>
    ${p.p ? `<div class="dr-sec"><h3>Statements naming ${esc(p.name.split(" ")[0])}</h3>${taEvidence().filter(e=>e.who.includes(p.name)).sort((a,b)=>b.ym.localeCompare(a.ym)).slice(0,6).map(evItem).join("") || '<p class="sub">None.</p>'}</div>` : ""}`);
}

/* ---- plays → tasks ---- */
const OWNERS = ["Rahul Dev Sharma","Rahul Sinha","Shinu Abraham"];
/* a play is a tracked risk case: At risk → Plan in place → Saving → Recovered or Lost */
const STAGES = ["At risk","Plan in place","Saving","Recovered","Lost"];
const TODAY_ISO = "2026-11-19";
const dayN = iso => daysBetween(new Date(iso+"T00:00:00"), TODAY);
function stageBar(p){
  const i = STAGES.indexOf(p.stage), closed = i >= 3;
  const shown = closed ? STAGES.slice(0,3).concat([p.stage]) : STAGES.slice(0,3).concat(["Recovered or lost"]);
  return `<div class="stages" aria-label="Stage: ${p.stage}">${shown.map((s,k) => { const now = s===p.stage, done = !now && k < (closed?3:i);
    return `<span class="${now?"now"+(p.stage==="Recovered"?" g":p.stage==="Lost"?" b":""):done?"done":""}">${s}</span>` }).join("")}</div>`;
}
const ACT_META = {
  commit:{ sev:"critical", impact:"Lifts the renewal cap: health goes back to its weighted 62 once the renewal is signed or auto-renew is on.", icon:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 14l2 2 4-4"/>' },
  sponsor:{ sev:"high", impact:"Restores the executive engagement input, which is 0 this month against an average of 11.", icon:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.6-6 7-6s6 2 7 6"/>' },
  champion:{ sev:"high", impact:"Gives the renewal a named owner on the customer side after Bailey Laske's handover.", icon:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5M17 8v6M14 11h6"/>' },
  per:{ sev:"medium", impact:"Moves the oldest support input: 11 enhancement requests, 423 days old on average.", icon:'<path d="M4 6h16M4 12h10M4 18h7"/>' } };
function renderActions(){
  if(!$("#actions")) return;
  const ic = m => `<span class="act-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${m.icon}</svg></span>`;
  const due = p => { const d = daysBetween(TODAY, new Date(p.due+"T00:00:00")); return `${fmtD(new Date(p.due+"T00:00:00"))} · ${d<0?`${-d} days overdue`:d===0?"today":`in ${d} days`}` };
  const items = STATE.plays.map((p,i)=>[p,i]).filter(([p]) => p.status!=="suggested"), recs = STATE.plays.map((p,i)=>[p,i]).filter(([p]) => p.status==="suggested");
  const item = ([p,i]) => { const m = ACT_META[p.id] || {sev:"medium", impact:"", icon:""}, done = p.done || [], closed = p.stage==="Recovered" || p.stage==="Lost";
    return `<div class="act-row item">${ic(m)}
      <div><div class="act-t">${esc(p.title)}<span class="sev ${m.sev}">${m.sev[0].toUpperCase()+m.sev.slice(1)}</span></div>
        <div class="act-meta"><span class="owner"><span class="avatar xs">${esc(p.owner.split(" ").map(w=>w[0]).slice(0,2).join(""))}</span>${esc(p.owner)}</span><span>Due ${due(p)}</span><span>Started ${fmtD(new Date(p.stageOn+"T00:00:00"))}</span>${TAG.ex}</div>
        ${stageBar(p)}
        <div class="checks"><div class="ck-h">Steps · ${done.filter(Boolean).length} of ${p.steps.length} done</div>${p.steps.map((x,j) => `<label class="ck"><input type="checkbox" data-step="${i}:${j}" ${done[j]?"checked":""}><span>${esc(x)}</span></label>`).join("")}</div>
        ${closed ? `<label class="close-note">What happened (needed to close)<input type="text" data-f="note" data-i="${i}" value="${esc(p.note||"")}" placeholder="One line, e.g. signed on Dec 12"></label>` : ""}</div>
      <div class="act-btns col"><label class="sr-only" for="stg-${i}">Stage</label><select class="fadd" id="stg-${i}" data-f="stage" data-i="${i}">${STAGES.slice(1).map(o=>`<option ${o===p.stage?"selected":""}>${o}</option>`).join("")}</select></div></div>` };
  const rec = ([p,i]) => { const m = ACT_META[p.id] || {sev:"medium", impact:"", icon:""};
    return `<div class="act-row">${ic(m)}
      <div><div class="act-t">${esc(p.title)}<span class="sev ${m.sev}">${m.sev[0].toUpperCase()+m.sev.slice(1)}</span></div>
        <div class="act-why">${esc(p.flag)} · at risk since ${fmtD(new Date(p.since+"T00:00:00"))}, ${dayN(p.since)} days</div>
        <div class="impact"><span aria-hidden="true"><i class=spk></i></span><span><b>Expected impact:</b> ${esc(m.impact)}</span></div>
        <div class="act-src">Source: ${esc(p.sinceSrc)} · suggested owner ${esc(p.owner)}, due ${fmtD(new Date(p.due+"T00:00:00"))} ${TAG.ex}</div></div>
      <div class="act-btns"><button class="btn sm${recs[0]&&recs[0][1]===i?" primary":""}" type="button" data-take="${i}">Start play</button></div></div>` };
  $("#actions").innerHTML = `<section class="ac-sec"><div class="ac-h"><h3>Started plays ${infoTip("Plays someone has started. Move the stage as it progresses; closing as Recovered or Lost needs a one-line outcome.")}</h3><span class="ac-n">${items.length}</span></div>
      ${items.length ? items.map(item).join("") : `<div class="jr-empty"><span class="act-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12l4 4L19 6"/></svg></span><div><b>No plays started yet</b><p>Start a suggested play below.</p></div></div>`}</section>
    <section class="ac-sec"><div class="ac-h"><h3>Suggested plays ${infoTip("Prioritised plays for the risks AHI flagged. Severity and expected impact come from AHI's rules; owners and dates are examples.")}</h3><span class="ac-n">${recs.length}</span>${fresh("Plays are re-ranked on every sync from AHI's rules.")}</div>
      ${recs.length ? recs.map(rec).join("") : `<div class="jr-empty"><div><b>All suggested plays started</b><p>They are in Started plays above.</p></div></div>`}</section>`;
}
function renderPlays(){
  renderActions();
  if($("#plays-short")) $("#plays-short").innerHTML = STATE.plays.map((p,i)=>`<div class="ps"><span class="check" aria-hidden="true"></span><div style="min-width:0"><div class="t">${esc(p.title)}</div><div class="d">${p.status==="suggested"?"Suggested · at risk "+dayN(p.since)+" days":p.stage} · ${esc(p.owner)} · due ${fmtD(new Date(p.due+"T00:00:00"))}</div></div></div>`).join("") + `<p class="sub" style="margin-top:8px">${TAG.ex} Plays, owners and dates are examples. “At risk since” dates are real.</p>`;
  if(typeof renderHome === "function" && $("#home-list")) renderHome();
}

/* ---- how this score works ---- */
function openHow(){
  openPanel(`<div class="dr-head"><div><p class="sub">Last scored Nov 18, 2026 from the Oct 31 snapshot</p><h2>How this score works</h2></div></div>
    <div class="dr-sec">${breakdown(facts())}</div>
`, true);
}

/* ---- side panel ---- */
function openPanel(html, wide){
  if(!$("#drawer").classList.contains("open")) window.__drawerFrom = document.activeElement;
  const d = $("#drawer");
  d.classList.toggle("wide", !!wide); d.classList.remove("xwide");
  d.innerHTML = `<button class="x" type="button" id="dx" aria-label="Close panel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>${html}`;
  d.classList.add("open"); d.setAttribute("aria-hidden","false"); $("#scrim").classList.add("open"); $("#dx").focus(); $("#dx").onclick = closeDrawer;
}

/* ---- render ---- */
/* ---- customer journey: one dot per month to the renewal ---- */
function renderJourney(){
  if(!$("#journey")) return;
  const fl = taFlags(), byYm = Object.fromEntries(fl.map(f => [f.ym, f])), nowYm = TODAY_ISO.slice(0,7), dots = [];
  for(let m = new Date(2025,4,1); m <= RENEWAL; m = new Date(m.getFullYear(), m.getMonth()+1, 1)){
    const ym = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}`, ev = TA_EVENTS.filter(e => e[0].startsWith(ym) && e[1]!=="end");
    const k = ym===nowYm ? "now" : ym>nowYm ? "up" : ev.some(e => e[1]==="neg") ? "neg" : ev.some(e => e[1]==="pos") ? "pos" : "";
    const h = byYm[ym] ? ` · health ${byYm[ym].final}` : "";
    dots.push(`<span class="jdot ${k}" title="${ymLabel(ym)}${h}${ev.length ? " · "+esc(ev.map(e=>e[2]).join("; ")) : ym===nowYm ? " · now" : ym>nowYm ? " · renewal $330K, Dec 30" : ""}"></span>`);
  }
  const last = TA_EVENTS.filter(e => new Date(e[0]+"T00:00:00") <= TODAY && e[1]!=="end").pop();
  const nNeg = dots.filter(d => /jdot neg/.test(d)).length, nPos = dots.filter(d => /jdot pos/.test(d)).length, jlabel = `${dots.length} months from May 2025 to the Dec 30, 2026 renewal: ${nNeg} with risk events, ${nPos} with positive events`;
  $("#journey").innerHTML = `<div class="jhead"><h2 class="hlabel" style="margin:0">Timeline to renewal</h2>${infoTip("One dot per month from May 2025 to the renewal. Hover a dot for its health and events; the full runway is on Overview.")}</div>
    <div class="jbar"><span class="jlab">Timeline to renewal ${infoTip("One dot per month from May 2025 to the Dec 30 renewal. Hover a dot for its health and events; the full runway is on Summary.")}</span><div class="jrow" role="img" aria-label="${jlabel}">${dots.join('<span class="jseg"></span>')}</div></div>
    <div class="jfoot"><span><b>Now:</b> ${esc(last[2])} · ${fmtD(new Date(last[0]+"T00:00:00"))}</span><span><b>Next:</b> Renewal $330K · Dec 30, 2026</span>
      <span class="jleg"><span><i style="background:var(--bad)"></i>Risk event</span><span><i style="border:2px solid var(--teal)"></i>Positive</span><span><i style="background:#C9D1D6"></i>Quiet</span><span><i style="border:1.5px solid var(--faint)"></i>Upcoming</span><span><i style="border:2.5px solid var(--teal)"></i>Now</span></span></div>`;
}
/* ---- section titles: subtitle becomes an ⓘ tip, every section says when it was updated ---- */
function infoTip(t){ return `<button type="button" class="info" aria-label="About this: ${esc(t)}" data-tip="${esc(t)}">i</button>` }
/* one freshness format everywhere: "Updated 26 mins ago", ticking; the hover says what the section is built from */
const SYNC = new Date(Date.now() - 26*60000); // example: when AHI last synced this account
function ago(){ const m = Math.max(0, Math.round((Date.now()-SYNC)/60000)); return m<1 ? "just now" : m<60 ? `${m} min${m===1?"":"s"} ago` : `${Math.round(m/60)} h ago` }
const fresh = tip => `<span class="fresh">Updated <span class="ago">${ago()}</span> ${infoTip(tip)}</span>`;
setInterval(() => qsa(".ago").forEach(e => e.textContent = ago()), 60000);
const FRESH = { scored:["","Rebuilt from AHI's latest score (Nov 18, 2026, from the Oct 31 snapshot). Refreshes when AHI rescores the account."],
  summaries:["","Built from Sirion's monthly summaries of emails, meetings and tickets, written through October 2026."],
  news:["","Public news about Transamerica and Aegon, checked on each sync."] };
function freshFor(el){ const sec = el.closest(".section")?.id || "", t = el.textContent;
  if(/External/.test(t)) return FRESH.news; if(/at a glance/i.test(t)) return FRESH.summaries;
  if(sec==="s-journey" || sec==="s-stake" || /going well|needs attention/i.test(t)) return FRESH.summaries;
  return FRESH.scored }
function decorateSections(){
  qsa("#v-account .sec-title, #v-account .card > .head, #v-home .sec-title, #v-home .card > .head, #v-accounts .card > .head").forEach(h => {
    if(h.dataset.dec) return; h.dataset.dec = 1;
    const h2 = h.querySelector("h2"); if(!h2) return;
    const sub = h.querySelector(":scope > span:not(.tag):not(.fresh), :scope > .sub, :scope > div > p.sub");
    if(sub && sub.textContent.trim() && sub.id!=="people-note"){ h2.insertAdjacentHTML("beforeend", " "+infoTip(sub.textContent.trim())); sub.remove() }
    if(h.classList.contains("sec-title") && !h.querySelector(".chev")) h.insertAdjacentHTML("beforeend", `<button class="chev" type="button" data-collapse aria-expanded="true" aria-label="Collapse ${esc(h2.textContent.trim())}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>`);
    const [txt, tip] = freshFor(h2), link = h.querySelector(":scope > .link, :scope > .chev");
    const f = fresh(tip);
    link ? link.insertAdjacentHTML("beforebegin", f) : h.insertAdjacentHTML("beforeend", f);
  });
}
function renderAccount(){
  const F = facts();
  renderVerdict(F); renderRunway(F); renderAreas(F); renderSummary(); renderCLM(); renderPlays(); renderPeople(); renderEvidence(); renderJourney(); renderActivity(); renderIntel(); renderScorecard(); renderTrends(); if($("#hbuild")) $("#hbuild").innerHTML = breakdown(F);
  $("#acct-kpis").innerHTML = [["CARR","$330K","2 order forms"],["NRR / GRR","100% / 100%","Flat"],["Monthly active users","222","↗ 3% vs 12-mo avg"],["Licence use","111%","663 of 593 seats"],["Emails this month","23","sentiment input"]]
    .map(k=>`<div class="kpi"><div class="l">${k[0]}</div><div class="v" data-sk>${k[1]}</div><div class="h${k[2]?"":" none"}">${k[2]}</div></div>`).join("");
  $("#adopt").innerHTML=stats(T.adopt); $("#support").innerHTML=stats(T.support);
  $("#entity").innerHTML=`<i style="flex-grow:3461; background:var(--teal)"></i><i style="flex-grow:2553; background:var(--navy)"></i>`;
  $("#impact").innerHTML=`<i style="flex-grow:7; background:var(--bad)"></i><i style="flex-grow:29; background:var(--warn)"></i><i style="flex-grow:90; background:var(--faint)"></i>`;
  $("#themes").innerHTML=T.themes.map(t=>`<div class="hbar"><span>${t[0]}</span><div class="t"><i style="width:${t[1]/51*100}%"></i></div><span>${t[1]}</span></div>`).join("");
  if(false) $("#market").innerHTML=T.market.map(m=>`<div class="mkt-row"><div><h3>${m[0]}</h3><p>${m[2]}${m[3]?` <span>${m[3]}</span>`:""}</p>${m[0]==="Executive leadership"?`<button class="link" type="button" data-person="news:Jay Orlandi">Jay Orlandi is a suggested sponsor in People</button>`:""}</div><div>${m[1]==null?`<span class="chip sm">No events</span>`:`<span class="chip sm">${m[1]}</span>`}</div></div>`).join("");
  const secs=[["s-summary","Summary",'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 12h6M10 16h6"/>'],
    ["s-health","Health",'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'],
    ["s-adopt","Adoption",'<path d="M3 12h4l3-7 4 14 3-7h4"/>'],
    ["s-journey","Activity",'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
    ["s-stake","Stakeholders",'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.4.7 2.4 2.2 2.6 4.7"/>'],
    ["s-intel","Intelligence",'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>']];
  $("#secnav").innerHTML=`<div class="seg" role="tablist" aria-label="Account sections">${secs.map((s,i)=>`<button type="button" role="tab" id="tab-${s[0]}" data-jump="${s[0]}" aria-controls="${s[0]}" aria-selected="${!i}" tabindex="${i?-1:0}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${s[2]}</svg>${s[1]}</button>`).join("")}</div>`;
  secs.forEach(s=>{const p=document.getElementById(s[0]); p.setAttribute("role","tabpanel"); p.setAttribute("aria-labelledby","tab-"+s[0])});
  showTab("s-summary",false); decorateSections();
  // the runway draws at its real width once the account view is visible, and again on resize
  let lastW = 0; new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if(w && Math.abs(w-lastW) > 8){ lastW = w; renderRunway(facts()) } }).observe($(".rw-wrap"));
  $("#secnav").addEventListener("keydown",e=>{ if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key)) return; const tabs=qsa("#secnav [role=tab]"); let i=tabs.indexOf(document.activeElement); if(i<0) return;
    i=e.key==="Home"?0:e.key==="End"?tabs.length-1:(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length; tabs[i].focus(); showTab(tabs[i].dataset.jump); e.preventDefault()});
}
document.addEventListener("click",e=>{
  const re = e.target.closest("[data-roleedit]"); if(re){ e.stopPropagation(); STK.edit = re.dataset.roleedit; renderStake(); $(`[data-rolesel="${CSS.escape(STK.edit)}"]`)?.focus(); return }
  if(e.target.closest(".role-sel")){ e.stopPropagation(); return }
  const sf = e.target.closest("[data-stf]"); if(sf){ STK.filter = sf.dataset.stf; STK.page = 0; renderStake(); $(`[data-stf="${STK.filter}"]`)?.focus(); return }
  const ss = e.target.closest("[data-sts]"); if(ss){ STK.sort = ss.dataset.sts; STK.page = 0; renderStake(); $(`[data-sts="${STK.sort}"]`)?.focus(); return }
  if(e.target.closest("[data-runway]")){ showTab("s-summary", false); $(".card.runway").scrollIntoView({behavior:"smooth", block:"start"}); return }
  const o = e.target.closest("[data-open]"); if(o){ const v=o.dataset.open; if(v==="how") openHow(); else if(v.startsWith("area:")) openArea(v.slice(5)); return }
  const j = e.target.closest("[data-jump]"); if(j){ if(j.closest("#drawer")) closeDrawer(); showTab(j.dataset.jump); return }
  if(e.target.closest("[data-inputs]")){ openInputs(); return }
  const cl = e.target.closest("[data-collapse]"); if(cl){ const open = cl.getAttribute("aria-expanded")!=="false"; cl.setAttribute("aria-expanded", !open);
    for(let n = cl.closest(".sec-title").nextElementSibling; n && !n.classList.contains("sec-title"); n = n.nextElementSibling) n.hidden = open; return }
  const hs = e.target.closest("[data-hsa]"); if(hs){ HS.area = hs.dataset.hsa; renderScorecard(); return }
  const jf = e.target.closest("[data-jrf]"); if(jf){ JR.filter = jf.dataset.jrf; JR.shown = 15; renderActivity(); $(`[data-jrf="${JR.filter}"]`)?.focus(); return }
  if(e.target.closest("[data-jrmore]")){ const n = qsa("#activity .jr-main").length; JR.shown += 15; renderActivity(); qsa("#activity .jr-main")[n-2]?.focus(); return }
  const jr = e.target.closest("[data-jr]"); if(jr){ const id = jr.dataset.jr; JR.open = JR.open===id ? null : id; renderActivity(); qsa("#activity [data-jr]").find(b => b.dataset.jr===id)?.focus(); return }
  const jv = e.target.closest("[data-jv]"); if(jv){ JR.view = jv.dataset.jv; JR.filter = "all"; JR.shown = 15; qsa("[data-jv]").forEach(b=>b.setAttribute("aria-pressed", b===jv)); $("#jv-timeline").hidden = JR.view==="reason"; $("#jv-reason").hidden = JR.view!=="reason"; renderActivity(); if(JR.view==="reason") renderEvidence(); return }
  const sp = e.target.closest("[data-stp]"); if(sp){ STK.page += +sp.dataset.stp; renderStake(); return }
  const spg = e.target.closest("[data-stpg]"); if(spg){ STK.page = +spg.dataset.stpg; renderStake(); return }
  if(e.target.closest("#st-export")){ exportStake(); return }
  const f = e.target.closest("[data-evf]"); if(f){ STATE.evFilter = f.dataset.evf; renderEvidence(); return }
  const vv = e.target.closest("[data-evv]"); if(vv){ STATE.evView = vv.dataset.evv; renderEvidence(); return }
  const rf = e.target.closest("[data-ref]"); if(rf){ openRef(rf.dataset.ref); return }
  const c = e.target.closest("[data-confirm]"); if(c){ const k = c.dataset.confirm; STATE.confirmed[k] = true; renderPeople(); if(c.closest("#drawer")) openPerson(k); return }
  const pn = e.target.closest("[data-person]"); if(pn){ openPerson(pn.dataset.person); return }
  const t = e.target.closest("[data-take]"); if(t){ Object.assign(STATE.plays[+t.dataset.take], { status:"task", stage:"Plan in place", stageOn:TODAY_ISO }); renderPlays(); renderActivity(); return }
});
document.addEventListener("keydown",e=>{ const pn = e.target.closest && e.target.closest("[data-person]"); if(pn && (e.key==="Enter"||e.key===" ")){ e.preventDefault(); openPerson(pn.dataset.person) } });
document.addEventListener("change",e=>{
  const ck = e.target.closest("[data-step]"); if(ck){ const [i,j] = ck.dataset.step.split(":").map(Number), p = STATE.plays[i]; (p.done = p.done || [])[j] = ck.checked; renderActions(); return }
  const rs = e.target.closest("[data-rolesel]"); if(rs){ const k = rs.dataset.rolesel, v = rs.value; if(!v) return;
    if(v==="__clear") delete STATE.roles[k]; else { STATE.roles[k] = v; STATE.confirmed[k] = true }
    STK.edit = null; renderPeople(); qsa("[data-roleedit]").find(b => b.dataset.roleedit===k)?.focus(); return }
  const s = e.target.closest("[data-f]"); if(!s || !s.dataset.i) return; const p = STATE.plays[+s.dataset.i], f = s.dataset.f;
  if(f==="stage" && s.value!==p.stage) p.stageOn = TODAY_ISO;
  p[f] = f==="note" ? s.value.trim() : (s.value || null); renderPlays();
});
function showTab(id, animate=true){
  qsa("#secnav [role=tab]").forEach(b=>{const on=b.dataset.jump===id; b.setAttribute("aria-selected",on); b.tabIndex=on?0:-1});
  qsa("#v-account .section").forEach(p=>{p.hidden=p.id!==id; p.classList.remove("enter")});
  const p=document.getElementById(id); if(animate){void p.offsetWidth; p.classList.add("enter")}
  const top=$("#acct-kpis").getBoundingClientRect().bottom+window.scrollY; if(animate && window.scrollY>top) window.scrollTo(0,top);
}
document.addEventListener("focusout", e => { if(e.target.matches && e.target.matches(".role-sel")) setTimeout(() => { if(STK.edit && document.activeElement && !document.activeElement.matches(".role-sel")){ STK.edit = null; renderStake() } }, 150) });
document.addEventListener("keydown", e => { if(e.key==="Escape" && STK.edit){ const k = STK.edit; STK.edit = null; renderStake(); qsa("[data-roleedit]").find(b => b.dataset.roleedit===k)?.focus() } });
document.addEventListener("input", e => { if(e.target.id==="st-q"){ STK.q = e.target.value.trim().toLowerCase(); STK.page = 0; renderStake() } });
