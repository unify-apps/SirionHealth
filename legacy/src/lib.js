/* lib.js: shared helpers (formatting, health bands, mini ring). */
const $=s=>document.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const band=s=>s==null?"":s>=70?"g":s>=40?"w":"b";
const col=s=>({g:"var(--good)",w:"var(--warn)",b:"var(--bad)"})[band(s)]||"var(--faint)";
const money=k=>!k?"$0":k>=1000?"$"+(k/1000).toFixed(k>=10000?0:1).replace(/\.0$/,"")+"M":"$"+(k%1?k.toFixed(1):k)+"K";
const fmtDate=d=>d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
function rel(d){const days=Math.round((d-TODAY)/864e5); if(days<0){const m=Math.round(-days/30); return {t:m<1?`Overdue ${-days} days`:`Overdue ${m} mo`,c:"b",days}}
  if(days<=60) return {t:`${days} days`,c:"b",days}; if(days<=180) return {t:`${Math.round(days/30)} months`,c:"w",days};
  if(days<730) return {t:`${Math.round(days/30)} months`,c:"",days}; return {t:"2+ years",c:"",days}}
function mring(v){const r=10,c=2*Math.PI*r; return `<span class="mring"><svg viewBox="0 0 26 26" aria-hidden="true"><circle class="t" cx="13" cy="13" r="${r}"/><circle cx="13" cy="13" r="${r}" stroke="${col(v)}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-(v||0)/100)}" stroke-linecap="round"/></svg><b class="${band(v)}" data-sk>${v}</b></span>`}

