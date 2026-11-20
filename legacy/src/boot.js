/* ---------- routing + load ---------- */
function countUp(root){ if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  qsa("[data-count]",root).forEach(el=>{const to=+el.dataset.count,t0=performance.now(); const st=t=>{const k=Math.min(1,(t-t0)/900); el.textContent=Math.round(to*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(st)}; requestAnimationFrame(st)})}
function load(view){const app=$("#app"), pr=$("#progress");
  app.classList.remove("drawing"); app.classList.add("is-loading"); pr.classList.remove("run"); void pr.offsetWidth; pr.classList.add("run");
  setTimeout(()=>{app.classList.remove("is-loading"); void app.offsetWidth; app.classList.add("drawing"); countUp(view); pr.classList.remove("run")}, 950)}
const CRUMB={home:"<b>Home</b>",accounts:"<b>My accounts</b>",account:`<button type="button" data-go="accounts">My accounts</button> / <b>TransAmerica</b>`,portfolio:"<b>Portfolio</b>",states:"<b>States reference</b>"};
function go(v, animate=true){
  if(v==="home") v="accounts"; // Home page removed
  qsa(".view").forEach(s=>s.hidden=s.id!=="v-"+v);
  qsa(".rail button").forEach(b=>b.toggleAttribute("aria-current",b.dataset.go===(v==="account"?"accounts":v)));
  qsa(".rail button[aria-current]").forEach(b=>b.setAttribute("aria-current","page"));
  $("#crumb").innerHTML=CRUMB[v]; qsa("#crumb [data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  try{history.replaceState(null,"","#"+v)}catch(e){}
  window.scrollTo(0,0); if(animate){const el=$("#v-"+v); el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); load(el)}
}
qsa(".rail button[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
renderViews(); renderFilters(); renderRows(); renderAccount(); renderHome(); renderPortfolio(); renderStates();
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1); if(["home","accounts","account","portfolio","states"].includes(h)&&$("#v-"+h).hidden) go(h)});
const start=(location.hash||"").slice(1); go(["home","accounts","account","portfolio","states"].includes(start)?start:"accounts", false);

/* keep the sticky offset in step with the top bar's real height (it wraps on phones) */
(() => { const tb = document.querySelector(".topbar"); if(!tb) return;
  const set = () => document.documentElement.style.setProperty("--tb", tb.offsetHeight + "px");
  set(); new ResizeObserver(set).observe(tb); })();
