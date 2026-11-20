// prints what the rules derive from TransAmerica's real data (node tools/check-ta.mjs)
import fs from "node:fs"; import vm from "node:vm";
const ctx = {}; vm.createContext(ctx);
for (const f of ["src/data-ta.js","src/ta.js"]) vm.runInContext(fs.readFileSync(f,"utf8"), ctx);
const r = vm.runInContext(`(() => {
  const TODAY = new Date(2026,10,19), fl = taFlags(), ep = taEpisode("model"), epE = taEpisode("early");
  const threat = new Date(2026,7,28), renew = new Date(2026,11,30);
  const ev = taEvidence(), ppl = taPeople();
  return {
    months: fl.map(f=>f.ym+" "+f.final+(f.model?" M":"")+(f.early?" E":"")+(f.lowAreas.length?" low:"+f.lowAreas.join("/"):"")),
    modelEpisodeStart: ep && ep.ym, cleared: ep && ep.cleared.map(c=>c.ym+" "+c.final), earlyEpisodeStart: epE && epE.ym,
    firstFlagDate: ep && ep.date.toDateString(), leadDaysToThreat: ep && daysBetween(ep.date, threat),
    daysUsed: ep && daysBetween(ep.date, TODAY), daysLeft: daysBetween(TODAY, renew), runwayTotal: ep && daysBetween(ep.date, renew),
    evidence: ev.length, strongNegatives: ev.filter(e=>e.strong).map(e=>e.ym+" | "+e.text.slice(0,70)+" | "+e.tickets.join(",")+" | "+e.who.join(",")),
    people: ppl.length, byOrg: ppl.reduce((a,p)=>(a[p.org]=(a[p.org]||0)+1,a),{}),
    top: ppl.filter(p=>p.customer).sort((a,b)=>b.mentions-a.mentions).slice(0,10).map(p=>p.name+" | "+p.mentions+" | "+(p.tagged||"-")+" | "+(p.suggested||"-")+" | "+(p.confidence||"-")),
  } })()`, ctx);
console.log(JSON.stringify(r, null, 1));
