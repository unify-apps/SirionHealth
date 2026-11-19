/* ---------- Ask AI: answers composed from AHI's record, the order forms, the monthly summaries and public news ---------- */
const ASK = { msgs:[], busy:false };
const ASK_SUGGEST = ["Why is the health score 50?","What happens with the renewal?","Who should I talk to now?","What are customers unhappy about?","What should I do this week?","Which accounts need me first?"];
const bold = s => esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
const src = (label, attr) => `<button class="ask-src" type="button" ${attr}>${esc(label)}</button>`;
function askTopic(t){
  t = t.toLowerCase();
  if(/strongest|weakest|inputs/.test(t)) return /weak/.test(t) ? "weak" : "strong";
  if(/account|book|portfolio|which|list|first/.test(t) && !/transamerica/.test(t)) return "book";
  if(/happen|recent|activity|timeline/.test(t)) return "recent";
  if(/going well|good|positive/.test(t)) return "well";
  if(/attention|wrong|worry|bad/.test(t)) return "attn";
  if(/score|health|50|cap|weight|why is/.test(t)) return "score";
  if(/renew|sign|commit|contract|order form|dec 30/.test(t)) return "renewal";
  if(/who|people|champion|sponsor|stakeholder|contact|nick|bailey|lawrence|talk/.test(t)) return "people";
  if(/sentiment|unhappy|complain|negative|tone|feel|angry/.test(t)) return "sentiment";
  if(/do|next|action|play|plan|week|recommend/.test(t)) return "actions";
  if(/ticket|support|jira|incident|bug|enhancement/.test(t)) return "support";
  if(/usage|adoption|licen|users|seat|workflow/.test(t)) return "adoption";
  if(/news|market|external|aegon|press/.test(t)) return "news";
  if(/change|new|since|last week/.test(t)) return "changed";
  return null;
}
function askAnswer(topic, ctx){
  const F = facts(), cap = TA_RECORD.weightedHealth - TA_RECORD.finalHealth;
  if(ctx) return askContext(ctx);
  switch(topic){
    case "recent": { const L = jrItems().filter(i => i.date <= TODAY && !/Engagement snapshot/.test(i.src)).sort((a,b)=>b.date-a.date).slice(0,5);
      return { html:`<p>The latest activity on TransAmerica:</p><ul>${L.map(i=>`<li><span class="ask-d">${dayMon(i.date)}</span> <b>${esc(jrText(i).t)}</b>${jrText(i).d?` · ${esc(jrText(i).d)}`:""}</li>`).join("")}</ul><p>The renewal is due Dec 30 with nothing signed; the last email was Nov 16 and the last meeting Nov 12.</p>`, sources:[src("Activity",'data-jump="s-journey"')] }; }
    case "well": case "attn": { const L = topic==="well" ? WELL : ATTN; return { html:`<p>${topic==="well"?"Going well":"Needs attention"} on TransAmerica:</p><ul>${L.map(([h,t])=>`<li><b>${esc(h)}.</b> ${esc(t.replace(/\s?\{\w+\}/g,""))}</li>`).join("")}</ul>`, sources:[src("Summary",'data-jump="s-summary"')] }; }
    case "strong": case "weak": { const L = [...inputsFlat()].sort((a,b)=>topic==="strong"?b.v-a.v:a.v-b.v).slice(0,4); return { html:`<p>The ${topic==="strong"?"strongest":"weakest"} inputs in AHI's score:</p><ul>${L.map(x=>`<li><b>${esc(x.name)}</b> ${x.v} · ${esc(x.note)}</li>`).join("")}</ul>`, sources:[src("Intelligence",'data-jump="s-intel"')] }; }
    case "score": return { html:`<p>Health is <b>50</b>, Watch band. The six areas score ${AREAS.map(([k])=>`${({commercial:"commercial",adoption:"adoption",support:"support",engagement:"engagement",sentiment:"sentiment",renewalRisk:"renewal risk"})[k]} ${F.last.areas[k]}`).join(", ")}, which weight to <b>${TA_RECORD.weightedHealth}</b>.</p>
      <p>The renewal cap then takes off ${cap}: ${esc(TA_RECORD.overrideReason)}. It lifts once the renewal is signed or auto-renew is on.</p>
      <p>Pulling it down most:</p><ul>${topInputs(-1).map(x=>`<li><b>${esc(x.name)}</b> ${x.v} · ${esc(x.note)}</li>`).join("")}</ul>`,
      sources:[src("Scored record, Oct 31",'data-ref="cap"'), src("How we got to 50",'data-open="how"')] };
    case "renewal": { const pl = playFor("commit"); return { html:`<p><b>$330K</b> CARR renews on <b>Dec 30, 2026</b>, ${F.left} days from today, on two order forms ($275K and $55K). Auto-renew is off and nothing is signed.</p>
      <p>The model first flagged the account on ${fmtD(F.ep.date)}. The flag cleared in September at 73 and came back in October; Aug 28 is when leadership threatened the renewal.</p>
      <p>The account insight says to get a signed commitment within 7 days. ${pl.status==="suggested"?`That play, <b>${esc(pl.title)}</b>, has not been started.`:`That play is in <b>${esc(pl.stage)}</b>.`}</p>`,
      sources:[src("Order forms",'data-ref="renew"'), src("Account insight",'data-ref="insight"')] }; }
    case "people": { const P = taPeople(), get = n => P.find(p=>p.name===n), nick = get("Nick Cavazos"), lk = lastNamed("Lawrence Kane"), kb = lastNamed("Karen Ben-Alta");
      return { html:`<p>Start with <b>Nick Cavazos</b>. He is the likely new day-to-day owner: ${nick?nick.mentions:"several"} statements in Sirion's monthly summaries name him, most recently on ${fmtDY(lastNamed("Nick Cavazos"))}.</p>
      <ul><li><b>Lawrence Kane</b>, executive sponsor: last named ${lk?fmtDY(lk):"never"}, and executive engagement is 0 this month (average 11).</li>
      <li><b>Bailey Laske</b>, champion: handed over on Oct 21 after chasing the INC-177010 RCA.</li>
      <li><b>Karen Ben-Alta</b> and <b>Adrian Dragomir</b> are tagged champions but quiet: Karen last named ${kb?fmtDY(kb):"never"}, Adrian never.</li>
      <li><b>Jay Orlandi</b>, EVP and Chief Legal & Corporate Affairs Officer since Mar 1, now oversees Procurement. Public news suggests him as a sponsor; he is not in AHI's contacts.</li></ul>`,
      sources:[src("Stakeholders",'data-jump="s-stake"'), src("Nick Cavazos",'data-ref="nick"')] }; }
    case "sentiment": { const neg = taEvidence().filter(e=>e.kind==="neg" && e.date).sort((a,b)=>b.date-a.date).slice(0,3);
      return { html:`<p>Sentiment is <b>${F.last.areas.sentiment}</b>, down ${-F.delta("sentiment")} from September, scored from ${23} emails this month. The latest negative statements in Sirion's monthly summaries:</p>
      <ul>${neg.map(e=>`<li><span class="ask-d">${fmtD(e.date)}</span> ${esc(e.text)}</li>`).join("")}</ul>`,
      sources:[src("Activity, risk",'data-askjr="risk"'), src("Sentiment area",'data-open="area:sentiment"')] }; }
    case "actions": return { html:`<p>Four plays are open for TransAmerica, most urgent first:</p><ul>${STATE.plays.map(p=>{const m=ACT_META[p.id]||{sev:"medium",impact:""}; return `<li><b>${esc(p.title)}</b> · ${m.sev} · ${p.status==="suggested"?"not started":esc(p.stage)}<br><span class="ask-d">${esc(m.impact)}</span></li>`}).join("")}</ul>
      <p>If you do one thing this week, secure the renewal commitment: it is the only play that lifts the cap.</p>`, sources:[] };
    case "support": return { html:`<p>Support is <b>${F.last.areas.support}</b>. No ticket has been reopened, there are no P1s, and only 1 ticket was raised this month against an average of 35.</p>
      <p>The weak spot is <b>11 open Jira enhancement requests</b>, 423 days old on average. Most tickets are about ${T.themes.slice(0,3).map(t=>`${t[0].toLowerCase()} (${t[1]})`).join(", ")}.</p>`,
      sources:[src("Support inputs",'data-open="area:support"'), src("Scored record",'data-ref="per"')] };
    case "adoption": return { html:`<p>Adoption is <b>${F.last.areas.adoption}</b>. Usage is healthy: licence use 111% (663 of 593 seats) and 222 monthly users against an average of 215.</p>
      <p>Workflows have stalled: <b>0 approval cycles</b> closed this month against an average of 12, and 155 contracts processed against 171. Time to first value (241 days) is not scored.</p>`,
      sources:[src("Adoption inputs",'data-open="area:adoption"'), src("Scored record",'data-ref="approvals"')] };
    case "news": return { html:`<p>Four things in public news matter for the renewal:</p><ul>${T.market.filter(m=>m[1]!=null).map(m=>`<li><b>${esc(m[0])}</b> · ${esc(m[2])}<br><span class="ask-d">${esc(m[3])}</span></li>`).join("")}</ul>`,
      sources:[src("Intelligence",'data-jump="s-intel"')] };
    case "changed": { const ch = homeChanges(); return { html:`<p>Since you last looked on Nov 12, ${ch.length} things changed on TransAmerica:</p><ul>${ch.map(c=>`<li><b>${esc(c.title)}</b> · ${esc(c.why)}</li>`).join("")}</ul>`, sources:[src("TransAmerica",'data-askgo="account"')] }; }
    case "book": { const needs = ROWS.filter(r=>r.name==="TransAmerica"||(!/Churn/.test(r.stage)&&(r.health<40||rel(r.renew).days<=90))).sort((a,b)=>(b.name==="TransAmerica")-(a.name==="TransAmerica")||rel(a.renew).days-rel(b.renew).days);
      return { html:`<p>${needs.length} accounts need you first:</p><ul>${needs.map(r=>`<li><b>${esc(r.name)}</b> · health ${r.health} · ${money(r.carr)} · renewal ${rel(r.renew).t.toLowerCase()}</li>`).join("")}</ul><p>TransAmerica is first because it changed and renews in ${F.left} days. The other three are in the list with current state only.</p>`,
      sources:[src("My accounts",'data-askgo="accounts"')] }; }
  }
  return { html:`<p>I can answer about TransAmerica's score, renewal, people, sentiment, actions, support, adoption and news, and about which accounts need you first. Try one of these:</p>`, chips:true, sources:[] };
}
function askContext(ctx){
  const [kind, id] = ctx;
  if(kind==="jr"){ const i = jrItems().find(x=>x.id===id); if(!i) return askAnswer(null);
    const pl = i.play && playFor(i.play);
    const rec = /AHI record/.test(i.src) ? SUM_REFS.cap.text : /Order forms/.test(i.src) ? SUM_REFS.renew.text : /AI insight/.test(i.src) ? SUM_REFS.insight.text
      : /Engagement snapshot/.test(i.src) ? `This is the date of the latest ${/email/i.test(i.title)?"email":"meeting"} with Transamerica in AHI's engagement snapshot, which does not record who took part or what was discussed.` : null;
    const body = i.desc===i.src+"." && rec ? `${esc(i.title)}. ${esc(rec)}` : esc(i.desc);
    return { html:`<p>On <b>${fmtDY(i.date)}</b>: ${body}</p>${i.external.length||i.internal.length?`<p>People named: ${[...i.external.map(([n,r])=>esc(n)+(r?` (${esc(r)})`:"")), ...i.internal.map(n=>esc(n)+" (Sirion)")].join(", ")}.</p>`:""}
      <p>It counts as <b>${(JR_CAT[i.kind]||"General").toLowerCase()}</b> activity.${pl?` The related play is <b>${esc(pl.title)}</b>, ${pl.status==="suggested"?"not started yet":"now "+esc(pl.stage)}.`:""}</p>`, sources:[src(i.src,'data-askjr="all"')] }; }
  if(kind==="act"){ const p = playFor(id), m = ACT_META[id]||{};
    return { html:`<p><b>${esc(p.title)}</b> is ${m.sev}. The trigger: ${esc(p.flag.toLowerCase())}, at risk since ${fmtDY(new Date(p.since+"T00:00:00"))} (${esc(p.sinceSrc)}).</p><p>Expected impact: ${esc(m.impact)}</p><p>Steps:</p><ol>${p.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>`,
      sources:[] }; }
  if(kind==="sum"){ const [list, k] = id.split(":"), it = (list==="well"?WELL:ATTN)[+k];
    return { html:`<p><b>${esc(it[0])}.</b> ${esc(it[1].replace(/\s?\{\w+\}/g,""))}</p><p>The ${esc((AREAS.find(a=>a[0]===it[3])||[])[1]||"")} area scores <b>${facts().last.areas[it[3]]}</b>.</p>`,
      sources:[src("Area inputs",`data-open="area:${it[3]}"`)] }; }
  if(kind==="news"){ const m = T.market[+id];
    return { html:`<p><b>${esc(m[0])}.</b> ${esc(m[2])}</p>${m[3]?`<p>Why it matters for the renewal: ${esc(m[3])}</p>`:""}`, sources:[src("Public news",'data-jump="s-intel"')] }; }
  return askAnswer(null);
}
function renderAsk(){
  const el = $("#ask-log");
  el.innerHTML = `<div class="ask-m bot"><span class="ask-av" aria-hidden="true"><i class=spk></i></span><div><p>Hello Rahul. I have TransAmerica's record, its order forms, 18 monthly summaries and this year's public news ready. What do you want to know?</p>
      ${ASK.msgs.length ? "" : `<div class="ask-chips">${ASK_SUGGEST.map(q=>`<button type="button" data-askq="${esc(q)}">${esc(q)}</button>`).join("")}</div>`}</div></div>`
    + ASK.msgs.map(m => m.who==="me" ? `<div class="ask-m me"><p>${esc(m.text)}</p></div>`
      : m.typing ? `<div class="ask-m bot"><span class="ask-av" aria-hidden="true"><i class=spk></i></span><div class="ask-typing" aria-label="Composing an answer"><i></i><i></i><i></i></div></div>`
      : `<div class="ask-m bot"><span class="ask-av" aria-hidden="true"><i class=spk></i></span><div>${m.html}${m.chips?`<div class="ask-chips">${ASK_SUGGEST.map(q=>`<button type="button" data-askq="${esc(q)}">${esc(q)}</button>`).join("")}</div>`:""}${m.sources&&m.sources.length?`<div class="ask-srcs"><span>Sources</span>${m.sources.join("")}</div>`:""}</div></div>`).join("");
  el.scrollTop = el.scrollHeight;
}
function askSend(text, ctx){
  if(ASK.busy || !text.trim()) return;
  openAsk(); ASK.busy = true;
  ASK.msgs.push({ who:"me", text:text.trim() }, { who:"bot", typing:true }); renderAsk();
  const wait = matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 900 + Math.min(900, text.length*12);
  setTimeout(() => { ASK.msgs.pop(); ASK.msgs.push({ who:"bot", ...askAnswer(askTopic(text), ctx) }); ASK.busy = false; renderAsk(); $("#ask-in").focus() }, wait);
}
function openAsk(){ const p = $("#ask"); if(!p.classList.contains("open")){ p.classList.add("open"); p.setAttribute("aria-hidden","false"); renderAsk(); setTimeout(()=>$("#ask-in").focus(), 50) } $("#askbtn").setAttribute("aria-expanded","true") }
function closeAsk(){ $("#ask").classList.remove("open"); $("#ask").setAttribute("aria-hidden","true"); $("#askbtn").setAttribute("aria-expanded","false"); $("#askbtn").focus() }
$("#askbtn").onclick = () => $("#ask").classList.contains("open") ? closeAsk() : openAsk();
$("#ask-x").onclick = closeAsk;
$("#ask-new").onclick = () => { ASK.msgs = []; ASK.busy = false; renderAsk(); $("#ask-in").focus() };
$("#ask-form").onsubmit = e => { e.preventDefault(); const v = $("#ask-in").value; $("#ask-in").value = ""; askSend(v) };
document.addEventListener("keydown", e => { if(e.key==="Escape" && $("#ask").classList.contains("open") && !$("#drawer").classList.contains("open")) closeAsk() });
document.addEventListener("click", e => {
  const q = e.target.closest("[data-askq]"); if(q){ askSend(q.dataset.askq); return }
  const a = e.target.closest("[data-ask]"); if(a){ const [k, ...rest] = a.dataset.ask.split("|"); askSend(a.dataset.askLabel || "Tell me more", [k, rest.join("|")]); return }
  const g = e.target.closest("[data-askgo]"); if(g){ go(g.dataset.askgo); return }
  const j = e.target.closest("[data-askjr]"); if(j){ go("account"); JR.filter = j.dataset.askjr; JR.view = "all"; JR.shown = 15; showTab("s-journey", false); renderActivity(); $("#jv-timeline").hidden = false; $("#jv-reason").hidden = true; qsa("[data-jv]").forEach(b=>b.setAttribute("aria-pressed", b.dataset.jv==="all")); return }
  const r = e.target.closest("#ask [data-ref], #ask [data-open], #ask [data-jump]"); if(r && $("#v-account").hidden) go("account");
}, true);
