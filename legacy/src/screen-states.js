/* ---------- States ---------- */
function renderStates(){
  const sk=w=>`<div style="height:12px; width:${w}; border-radius:6px; background:linear-gradient(90deg,var(--sk) 25%,var(--sk-hi) 50%,var(--sk) 75%); background-size:300% 100%; animation:shimmer 1.2s linear infinite"></div>`;
  const specs=[
   ["First load","Placeholders take the shape of the real content, so nothing jumps when data arrives. Numbers count up, charts draw in.",
    `<div class="card" style="display:grid; gap:10px">${sk("40%")}${sk("70%")}<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px">${sk("100%")}${sk("100%")}${sk("100%")}</div></div>`],
   ["Refreshing","When a filter or date changes, the current numbers stay readable and dim slightly while a thin bar runs along the top. Never blank, never stale without a signal.",
    `<div class="card" style="position:relative; overflow:hidden"><div style="position:absolute; top:0; left:0; height:2px; width:60%; background:var(--teal)"></div><div class="refreshing"><div class="sub">Total ARR</div><div style="font-size:28px; font-weight:600">$103.6M</div></div></div>`],
   ["Nothing matches","A search or filter with no results says what was searched and offers the way back.",
    `<div class="card"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4M8.5 11h5"/></svg><h4>No accounts match “zzqx”</h4><p>Search looks at account names and industries.</p><button class="btn" type="button">Clear search</button></div></div>`],
   ["No data in this period","A section with no data for the chosen dates says so and offers a wider range, instead of an empty chart or builder text.",
    `<div class="card"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><h4>No support tickets in the last 30 days</h4><p>BNP has 0 tickets in this period.</p><button class="btn" type="button">Show lifetime</button></div></div>`],
   ["Missing metric","A metric the source does not provide shows “No data”, in grey, and is left out of averages and risk drivers. Never −1, “-” or undefined.",
    `<div class="card"><div class="dim" style="border:0"><div><div class="n">SLA compliance</div><div class="why">Freshservice does not report SLA for this account</div></div><div class="bar"></div><div class="s"><span class="nodata">No data</span></div></div></div>`],
   ["Section failed","If one data source fails, only its section shows the error, with what failed and a retry. The rest of the page keeps working.",
    `<div class="errbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg><div><b style="font-size:13px">Support data didn't load</b><p>Freshservice timed out after 20 seconds. Other sections are up to date.</p><button class="btn" type="button" style="margin-top:8px">Try again</button></div></div>`],
   ["Account not found","A link to an account that doesn't exist or you can't access gets a real page, not a half-built one.",
    `<div class="card"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 10l6 6M15 10l-6 6"/></svg><h4>This account isn't in your book</h4><p>It may have been merged or reassigned, or the link is incomplete.</p><button class="btn" type="button">Back to my accounts</button></div></div>`],
   ["Churned account","Churned accounts get a closed-out view: a final summary and win-back context instead of renewal alarms and onboarding advice.",
    `<div class="card" style="display:flex; gap:12px; align-items:center"><span class="chip bad">Churned prior FY</span><p class="sub">BNP left on Apr 4, 2025. Last CARR $0. Renewal countdown hidden.</p></div>`]];
  $("#states").innerHTML=specs.map(s=>`<div class="spec card"><h3>${s[0]}</h3><p class="rule">${s[1]}</p><div class="demo">${s[2]}</div></div>`).join("");
}

