/* ta.js: TransAmerica's story. REAL values come from TA_REAL (generated) and the live record below;
   rules derive flags, evidence and key people from them; TA_EXAMPLE holds the only invented data. */

/* ---- real: latest scored record (ahi_kpi_daily_store_past_data, snapshot Oct 31 2026, scored Nov 18 2026) ---- */
const TA_RECORD = {
  snapshot: "2026-10-31", scoredOn: "2026-11-18",
  finalHealth: 50, weightedHealth: 62, band: "AMBER",
  overrideReason: "Renewal in 59 days, auto-renew off (max 50.0)", overrideCode: "O7",
  renewal: "2026-12-30", autoRenew: false, signedCommitment: false, tfc: false,
  carr: 330000, nrr: 100, grr: 100, expansion: 85000,
  // sub-scores (0-100); -1 means the source sent no value
  kpis: {
    commercial: [["Renewal proximity","renewalProximityHealth",39,"Renewal in 59 days at snapshot"],["Open invoices","openInvoicesHealth",100,"No overdue invoices"],["Expansion (upsell)","expansionArrHealth",0,"$85K open, nothing signed"]],
    adoption: [["Monthly active users","mauHealth",80,"222 users (12-mo avg 215)"],["Licence use","licenceUtilisationHealth",100,"663 of 593 seats"],["Contract volume","contractVolumeHealth",62,"155 processed (12-mo avg 171)"],["Active workflows","activeWorkflowsHealth",2,"0 approval cycles closed (12-mo avg 12)"],["Time to first value","timeToFirstValueHealth",-1,"241 days, not scored"]],
    support: [["SLA compliance","slaComplianceHealth",-1,"Freshservice sent no SLA value"],["Ticket reopen rate","reopenRateHealth",100,"0 reopened"],["Tickets created","ticketsCreatedHealth",99,"1 this month (12-mo avg 35)"],["Enhancement request age","jiraAvgAgeHealth",16,"423 days, 11 open Jira (12-mo avg 434)"],["Critical incidents","criticalIncidentCountHealth",-1,"0 counted, not scored"]],
    engagement: [["Executive sponsor engagement","execEngagementHealth",-1,"0 this month (12-mo avg 11)"],["Champion stability","championDepartureHealth",-1,"Champion touchpoints 0 (12-mo avg 0)"],["CSM touchpoints","csmTouchpointsHealth",15,"5 this month (12-mo avg 199)"],["Onboarding completion","onboardingCompletionHealth",97,"LMS 97%"]],
    sentiment: [["Communication sentiment trend","sentimentHealth",50,"From 23 emails this month"],["Support ticket sentiment","supportTicketSentimentHealth",-1,"No ticket sentiment scored"],["Escalations","execEscalationsHealth",-1,"0 exec Sev1 escalations, not scored"]],
    renewalRisk: [["Expansion signed","expansionArrHealth",0,"No expansion ARR signed"]],
  },
  coverage: { commercial: 1, adoption: 75, support: 0, engagement: 0, sentiment: 0, renewalRisk: 1 }, // raw cat_*_coverage values as stored
  emailsThisMonth: 23, openJira: 11, perAging: 423, approvalCycles: [12, 0],
};

const AREAS = [
  ["commercial","Commercial"],["adoption","Product adoption"],["support","Support and enhancement requests"],
  ["engagement","Customer engagement"],["sentiment","Sentiment"],["renewalRisk","Renewal risk"]];

/* ---- real: event timeline (source named on each) ---- */
const TA_EVENTS = [
  ["2025-05-15","pos","MBR accepted by Matthew Krigbaum, Bailey Laske and Jaime Jones","sentiment May 2025"],
  ["2025-10-17","neg","Meeting on confidential contract access: stakeholders could not view contracts","sentiment Oct 2025"],
  ["2025-11-10","neg","Integration failure on Parent Agreement fields (Gunalan Gnanasekaran)","sentiment Nov 2025"],
  ["2026-01-13","neg","Rhonda Kepley asked for another impact report on INC-126066 (TPRM gaps)","sentiment Jan 2026"],
  ["2026-01-30","pos","MBR showed strong adoption and a stable integration","sentiment Jan 2026"],
  ["2026-02-11","neg","Jaime Jones declined the MBR: no longer in this role, asked to add Nick Cavazos","sentiment Feb 2026"],
  ["2026-02-17","neg","Callie Borders: no dashboard access, inaccurate Contract Request Analytics","sentiment Feb 2026"],
  ["2026-07-08","neg","Bailey Laske: Transamerica built its own PowerBI dashboards instead of using CLM","sentiment Jul 2026"],
  ["2026-07-23","neg","Escalation confirmed after repeated Action Module issues","sentiment Jul 2026"],
  ["2026-08-28","neg","Transamerica leadership threatened the renewal","sentiment Aug 2026"],
  ["2026-09-09","pos","Nick Cavazos accepted the monthly business review","sentiment Sep 2026"],
  ["2026-10-21","neg","Champion Bailey Laske handed over her role","sentiment Oct 2026"],
  ["2026-10-31","flag","Health capped to 50: renewal in 59 days, auto-renew off","AHI record Oct 31"],
  ["2026-11-12","neu","Last meeting","engagement snapshot"],
  ["2026-11-16","neu","Last email","engagement snapshot"],
  ["2026-11-26","goal","Commitment target: 7 days from today, as the account insight recommends","AI insight (suggested)"],
  ["2026-12-30","end","Renewal: $330K CARR, 2 order forms","order forms"],
];

/* ---- rules ---- */
const RULES = {
  model: { label: "Current AHI model", text: "Flags when the composite health is under 70 (Watch) or under 40 (At risk). A renewal within 60 days with auto-renew off caps the composite at 50." },
  early: { label: "Early-warning rule (proposed)", text: "Flags when any of the six areas is under 50, or the composite falls 8 points or more in a month." },
};
const monthEnd = ym => { const [y,m]=ym.split("-").map(Number); return new Date(y, m, 0) };
function taMonths(){
  const f = TA_REAL.monthlyFields;
  return TA_REAL.monthly.map(r => { const o = {ym:r[0], date:monthEnd(r[0]), final:r[1], areas:{}}; f.slice(2).forEach((k,i)=>o.areas[k]=r[i+2]); return o });
}
function taFlags(){
  const ms = taMonths();
  return ms.map((m,i) => {
    const prev = i ? ms[i-1].final : null;
    const lowAreas = Object.entries(m.areas).filter(([k,v]) => k!=="renewalRisk" && v<50).map(([k])=>k);
    const drop = prev!=null ? prev - m.final : 0;
    return { ...m, model: m.final < 70, early: lowAreas.length>0 || drop>=8, lowAreas, drop };
  });
}
/* the current risk run: flagged months ending at the latest month, allowing one clear month inside it
   (TransAmerica cleared once, Sep 2026 at 73, between flags). Returns the start and the months that cleared. */
function taEpisode(key="model"){
  const fl = taFlags(); if(!fl[fl.length-1][key]) return null;
  let i = fl.length-1; const cleared = [];
  while(i>0){
    if(fl[i-1][key]) { i--; continue }
    if(i>1 && fl[i-2][key]) { cleared.push(fl[i-1]); i-=2; continue }
    break;
  }
  return { ...fl[i], cleared };
}
const DAY = 864e5;
const daysBetween = (a,b) => Math.round((b-a)/DAY);

/* evidence: every sentence of the real monthly sentiment summaries, with its date, people and ticket IDs */
const STRONG = /threatened|escalation|urgent|ASAP|handed over|not running|failure|unable|no dashboard access|inaccurate|errors|not user.friendly|blocked|declined|no longer|chasing|still not received|still pending/i;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function taPeopleIndex(){
  const idx = {};
  TA_REAL.contacts.forEach(c => { const n = bestName(c[0], c[2]); if(/\s/.test(n)) idx[n] = c[2].toLowerCase() });
  ["Rahul Kumar","Umang Sood"].forEach(n => idx[n] = "sirion");   // Sirion staff named in the summaries
  return idx;
}
/* a card with only an email or a first name takes its name from the email's local part (callie.borders -> Callie Borders) */
function bestName(n, email){
  const d = displayName(n), local = email.split("@")[0];
  if((!/\s/.test(d) || /@/.test(d)) && /^[a-z]+\.[a-z-]+$/i.test(local)) return local.split(".").map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(" ");
  return d;
}
function displayName(n){ n = n.replace(/\s+-\s.*$/,"").replace(/\(.*\)/,"").trim(); if(/,/.test(n)){ const [l,f]=n.split(",").map(s=>s.trim()); n = f+" "+l } return n.replace(/\b([A-Z])([A-Z]+)\b/g,(m,a,b)=>a+b.toLowerCase()) }
function taEvidence(){
  const people = taPeopleIndex(), names = Object.keys(people).sort((a,b)=>b.length-a.length);
  const out = [];
  TA_REAL.sentiment.forEach(([ym,pos,neg]) => {
    [["pos",pos],["neg",neg]].forEach(([kind,text]) => {
      text.split(/(?<=\.)\s+(?=[A-Z])/).forEach(s => {
        const dm = s.match(new RegExp("(" + MONTHS.join("|") + ")\\s+(\\d{1,2})"));
        const y = +ym.slice(0,4);
        const date = dm ? new Date(y, MONTHS.indexOf(dm[1]), +dm[2]) : null;
        const tickets = [...new Set((s.match(/#?(SR-?\d{4,}|INC-?\d{4,}|PER-\d+|CDR\d+|CHG\d+)/g)||[]).map(t=>t.replace("#","")))];
        const who = names.filter(n => s.includes(n));
        out.push({ ym, kind, text:s, date, tickets, who, strong: kind==="neg" && STRONG.test(s) });
      });
    });
  });
  return out;
}

/* key people: merge duplicate cards, sort by organisation and role, suggest roles from the evidence */
const ORG = {
  "transamerica.com":"Transamerica","aegon.com":"Aegon (parent)","aegonusa.com":"Aegon (parent)",
  "unifyapps.com":"UnifyApps (internal)","processunity.com":"ProcessUnity (partner)","beeline.com":"Beeline (partner)",
  "whatfix.com":"Whatfix (partner)","castlehillrisk.com":"Castle Hill (partner)","sap.com":"SAP Ariba (partner)","mindtickle.com":"Mindtickle (partner)",
};
const SYSTEM = /no-?reply|noreply|^contracts@|^clmadmin@|^sharibaadmin@|^email@|^admin@/i;
/* suggestions read from the evidence; in production this is the AI step, here written from the real summaries */
const SUGGEST = {
  "nick.cavazos@transamerica.com": ["Day-to-day owner, likely new champion","Named in 6 of the 9 monthly summaries since Feb 2026; Jaime Jones asked to add him in her place (Feb 11); accepted the Sep MBR and pushed INC-172670 in Oct."],
  "bailey.laske@transamerica.com": ["Former champion","Handed over her role on Oct 21, 2026 after 18 months as the most active contact."],
  "callie.borders@transamerica.com": ["Key user, process owner","Raised workflow and analytics issues; confirmed the Early Engagement step on Oct 27."],
  "gunalan.gnanasekaran@transamerica.com": ["Technical owner, integrations","Owns the CLM to Ariba integration threads (Jun 2025 to Aug 2026)."],
  "amanda.urbancic@transamerica.com": ["System administrator","Introduced on Sep 2, 2026 to support system administration."],
  "aditya.raj@transamerica.com": ["Reporting contact","Weekly calls to match internal data to MBR data (Jul 2026)."],
  "rhonda.kepley@transamerica.com": ["Key user, third-party risk","Asked for the INC-126066 impact report (Jan 2026)."],
  "jaime.jones@transamerica.com": ["Left the role","Declined the Feb 2026 MBR: no longer works in this space."],
  "alper.alper@aegon.com": ["IT and security contact","Asked about the host-key change (Sep 24, 2026)."],
  "bonny.bailey@transamerica.com": ["Key user, integrations","Reported the ProcessUnity API not running (Jun 8, 2026)."],
};
function taPeople(){
  const ev = taEvidence(), byEmail = new Map();
  TA_REAL.contacts.forEach(([name,title,email,role,src]) => {
    const k = email.toLowerCase(), dom = k.split("@")[1], p = byEmail.get(k) || {email:k, names:new Set(), title:"", role:"", sources:new Set(), cards:0};
    p.names.add(bestName(name, email)); if(title) p.title = title; if(role) p.role = role; src.split("+").forEach(s=>p.sources.add(s)); p.cards++;
    p.org = SYSTEM.test(k) || /google\.com|microsoft$/.test(dom) ? "System sender" : (ORG[dom] || "Other");
    byEmail.set(k, p);
  });
  return [...byEmail.values()].map(p => {
    const name = [...p.names].find(n=>/\s/.test(n) && !/@/.test(n)) || [...p.names][0];
    const mentions = ev.filter(e => e.who.includes(name));
    const last = mentions.map(e=>e.ym).sort().pop() || null;
    const s = SUGGEST[p.email];
    const conf = mentions.length>=6 ? "high" : mentions.length>=3 ? "medium" : mentions.length ? "low" : null;
    return { ...p, name, sources:[...p.sources], mentions:mentions.length, lastMentioned:last,
      tagged: p.role || null, suggested: s ? s[0] : null, basis: s ? s[1] : null, confidence: s ? (conf||"low") : null,
      customer: /Transamerica|Aegon/.test(p.org) };
  });
}

/* ---- real, from public news (market signals tab): suggested people who are not in AHI's contacts ---- */
const TA_NEWS_PEOPLE = [
  { name:"Jay Orlandi", title:"EVP, Chief Legal & Corporate Affairs Officer", org:"Transamerica", suggested:"Sponsor",
    basis:"Named EVP and Chief Legal & Corporate Affairs Officer on Mar 1, 2026, with oversight of Procurement, Sirion's buying centre. Not in AHI's contacts and never named in a monthly summary.", source:"Public news, Mar 1, 2026" },
];

/* ---- examples: the only invented data. Every item carries example:true and the UI labels it. ---- */
const TA_EXAMPLE = {
  plays: [
    { id:"commit", flag:"Renewal unsigned, auto-renew off", since:"2026-10-31", sinceSrc:"Renewal cap applied in the Oct 31 record", title:"Secure the renewal commitment", steps:["Confirm the paper path with procurement","Send the renewal summary to Nick Cavazos","Agree a signature date before Dec 15"], owner:"Rahul Dev Sharma", due:"2026-11-26", outcome:null, example:true },
    { id:"sponsor", flag:"No executive contact this month", since:"2026-10-31", sinceSrc:"Executive sponsor engagement 0 in the Oct 31 record", title:"Re-engage Lawrence Kane", steps:["Book a 30-minute executive check-in","Bring the Aug 28 monitoring answer","Introduce the new Chief Legal Officer's team"], owner:"Rahul Sinha", due:"2026-12-03", outcome:null, example:true },
    { id:"champion", flag:"Champion handed over", since:"2026-10-21", sinceSrc:"Bailey Laske handed over, Oct 2026 summary", title:"Name a new champion", steps:["Confirm Nick Cavazos as day-to-day owner","Run a handover call with Bailey Laske","Update the role in AHI"], owner:"Rahul Dev Sharma", due:"2026-12-03", outcome:null, example:true },
    { id:"per", flag:"Enhancement requests aging 423 days", since:"2026-10-31", sinceSrc:"PER age 423 days in the Oct 31 record", title:"Clear the enhancement request backlog", steps:["Review the 11 open Jira items with product","Share dates for the top 3","Close or decline the rest"], owner:"Shinu Abraham", due:"2026-12-10", outcome:null, example:true },
  ],
  changed: [ // timestamps are examples; the changes themselves are real
    { at:"2026-11-18T06:10", what:"Health capped to 50", why:"Renewal in 59 days with auto-renew off (cap rule O7). Weighted score is 62.", go:"s-health", example:true },
    { at:"2026-11-18T06:10", what:"Renewal now under 60 days", why:"Dec 30, 2026; no signed commitment.", go:"runway", example:true },
    { at:"2026-10-21T09:00", what:"Champion handed over", why:"Bailey Laske handed over her role on Oct 21.", go:"s-people", example:true },
    { at:"2026-11-01T06:00", what:"Approval cycles fell from 12 to 0", why:"Active workflows score 2; contracts processed 155 vs 171 average.", go:"s-adoption", example:true },
  ],
};
