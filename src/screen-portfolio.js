/* ---------- Portfolio ---------- */
function renderPortfolio(){
  $("#psplit").innerHTML=[["$33.3M",33.3,"var(--good)"],["$65.2M",65.2,"var(--warn)"],["$5.1M",5.1,"var(--bad)"]].map(s=>`<div style="flex-grow:${s[1]}; background:${s[2]}${s[2]==="var(--warn)"?"; color:#0B1821":""}" title="${s[0]}">${s[1]>8?s[0]:""}</div>`).join("");
  const maxR=Math.max(...P.pods.map(p=>p[5]));
  $("#pods").innerHTML=[...P.pods].sort((a,b)=>b[5]-a[5]).map(p=>`<tr><td><b style="font-weight:600">${p[0]}</b></td><td class="num">${p[1]}</td><td class="num">$${p[2]}M</td>
    <td class="num">${p[3]==null?`<span class="nodata">No data</span>`:`<b class="${band(p[3])}">${p[3]}</b>`}</td><td class="num">${p[4]}</td>
    <td class="num"><b>${p[5]?money(p[5]*1000):"$0"}</b><span class="inline-bar"><i style="width:${p[5]/maxR*100}%"></i></span></td><td class="num">${p[6]}</td><td class="num">${p[7]?money(p[7]*1000):"$0"}</td></tr>`).join("");
  $("#stages").innerHTML=P.stages.map(s=>`<div class="hbar"><span>${s[0]}</span><div class="t"><i style="width:${s[1]/44.8*100}%"></i></div><span>${s[1]}</span></div>`).join("");
  const tot=P.grr.reduce((a,g)=>a+g[1],0), r=40, c=2*Math.PI*r; let off=0;
  $("#grr").innerHTML=`<svg viewBox="0 0 110 110" role="img" aria-label="221 of 237 accounts retain 100% or more">${P.grr.map(g=>{const l=c*g[1]/tot; const s=`<circle cx="55" cy="55" r="${r}" stroke="${g[2]}" stroke-dasharray="${l} ${c-l}" stroke-dashoffset="${-off}"/>`; off+=l; return s}).join("")}</svg>
    <div class="stack" style="gap:8px">${P.grr.map(g=>`<div style="display:flex; gap:10px; align-items:center; font-size:13px"><span class="dot" style="color:${g[2]}"></span><span style="min-width:96px">${g[0]}</span><b>${g[1]}</b></div>`).join("")}</div>`;
}

