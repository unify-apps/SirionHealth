import { P, ROWS, TODAY } from '@/data/legacy'

/* Placeholder book: every account the Portfolio page covers, one row per account with its pod, as the real
   account list will have it. The signed-in CSM's 25 accounts (ROWS, the ones on My accounts) are kept as they are;
   the rest are generated with a seeded PRNG so the page is the same on every load. Per pod it reproduces P.pods
   exactly for account count, CARR, accounts with health under 40 and their CARR, accounts renewing in 60 days and
   renewal CARR at risk or unsigned; book-level health, stage and GRR splits land close to P.stages and P.grr. */

export type Account = {
  name: string; ind: string; seg: string; stage: string
  /** 0 to 100, null when the account isn't scored */
  health: number | null
  /** CARR in $K, same unit as ROWS */
  carr: number
  renew: Date
  grr: number | null
  pod: string; region: string
  /** one of the signed-in person's accounts (on My accounts) */
  mine: boolean
  /** A renewal commitment for the next term is signed. "Renewal at risk or unsigned" = a live account renewing in
   *  0 to 60 days whose health is under 40 or whose renewal isn't signed (`signed` false). */
  signed: boolean
}

/* ---------------------------------------------------------------- seeded randomness */

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20261119)
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]
const shuffle = <T,>(xs: T[]) => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]] } return xs }
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd())
const r1 = (n: number) => Math.round(n * 10) / 10

/** `n` positive amounts in $K (0.1 precision) that add up to exactly `total`, log-normally spread. */
function splitTotal(total: number, n: number, spread = 0.9): number[] {
  if (!n) return []
  const w = Array.from({ length: n }, () => Math.exp(spread * gauss()))
  const s = w.reduce((a, b) => a + b, 0)
  const out = w.map(x => Math.max(0.1, r1((total * x) / s)))
  const big = out.indexOf(Math.max(...out))
  out[big] = r1(out[big] + total - out.reduce((a, b) => a + b, 0))
  return out
}

const daysOut = (d: number) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + d)

/* ---------------------------------------------------------------- names */

const ROOT_A = ['Aster', 'Bryn', 'Cal', 'Dra', 'Evan', 'Fal', 'Gren', 'Hol', 'Ister', 'Jas', 'Kor', 'Lyn', 'Mav', 'Nev', 'Ost', 'Pra', 'Quel', 'Ryl', 'Sav', 'Tor', 'Ulm', 'Ves', 'Wyn', 'Yor', 'Zan']
const ROOT_B = ['dane', 'vik', 'mere', 'holt', 'brook', 'crest', 'dell', 'gate', 'lund', 'mark', 'ora', 'stow', 'ven', 'wick', 'ridge', 'haven', 'field']
const SUFFIX: Record<string, string[]> = {
  'Consulting': ['Advisory', 'Partners', 'Consulting'],
  'Insurance': ['Mutual', 'Assurance', 'Insurance'],
  'Manufacturing': ['Industries', 'Precision', 'Manufacturing'],
  'Government': ['County Council', 'Revenue Office', 'Public Works'],
  'Health & Life Science': ['Therapeutics', 'Biosciences', 'Health'],
  'Transportation': ['Logistics', 'Freight', 'Rail'],
  'Financial services': ['Capital', 'Bancorp', 'Financial'],
  'Food & beverage': ['Foods', 'Brewing', 'Dairy'],
  'Automotive': ['Motors', 'Mobility', 'Components'],
  'Consumer goods': ['Brands', 'Household', 'Consumer'],
  'Energy & utilities': ['Energy', 'Power', 'Utilities'],
}
const usedRoots = new Set<string>()
const usedNames = new Set<string>((ROWS as { name: string }[]).map(r => r.name))
/** A fictional company name: a coined root used once in the book, plus a word that fits the industry. */
function companyName(ind: string) {
  for (;;) {
    const root = pick(ROOT_A) + pick(ROOT_B)
    const name = `${root} ${pick(SUFFIX[ind] ?? ['Group'])}`
    if (usedRoots.has(root) || usedNames.has(name)) continue
    usedRoots.add(root); usedNames.add(name)
    return name
  }
}

/* ---------------------------------------------------------------- the plan */

/** Values ROWS already use. Stages outside ROWS (Pending kick-off, Expected churn) come from P.stages. */
const INDUSTRIES = [...new Set((ROWS as { ind: string }[]).map(r => r.ind))]
const REGIONS = ['North America', 'Europe', 'AMEA']
export const POD_REGION: Record<string, string> = { 'CS – NA': 'North America', 'CS – AMEA': 'AMEA', 'CS – Europe': 'Europe' }
/** The signed-in CSM's pod: their accounts fit its at-risk, renewal and CARR totals. */
export const MY_POD = 'CS – NA'

/** How each pod's generated accounts split (counts; $K). Everything not listed comes from P.pods. */
type Plan = {
  riskRenew: number      // at risk and renewing in 60 days
  unsignedRenew: number  // healthy or watch, renewing in 60 days, not signed
  pending: number; pendingCarr: number // Pending kick-off: no GRR yet
  churned: number        // churned this FY, $0 CARR, GRR 0
  healthyCarr: number    // CARR to put in the Healthy band
  riskHealth: [number, number]
}
const PLAN: Record<string, Plan> = {
  'CS – NA': { riskRenew: 1, unsignedRenew: 3, pending: 4, pendingCarr: 900, churned: 0, healthyCarr: 7000, riskHealth: [14, 39] },
  'Eigen': { riskRenew: 2, unsignedRenew: 0, pending: 0, pendingCarr: 0, churned: 0, healthyCarr: 0, riskHealth: [6, 36] },
  'CS – AMEA': { riskRenew: 0, unsignedRenew: 1, pending: 2, pendingCarr: 400, churned: 1, healthyCarr: 2700, riskHealth: [14, 39] },
  'CS – Europe': { riskRenew: 1, unsignedRenew: 2, pending: 5, pendingCarr: 1100, churned: 1, healthyCarr: 13100, riskHealth: [14, 39] },
}

/** Lifecycle stages and the CARR ($K) P.stages puts in each. */
const STAGE_TARGET: Record<string, number> = Object.fromEntries((P.stages as [string, number][]).map(([s, m]) => [s, m * 1000]))

type Draft = Account & { risk: boolean; renewing: boolean; healthy: boolean; fixed: boolean }

function draft(pod: string, carr: number, over: Partial<Draft> = {}): Draft {
  const ind = pick(INDUSTRIES)
  const seg = carr >= 250 ? 'Enterprise' : carr >= 90 ? pick(['Enterprise', 'Mid market']) : pick(['Mid market', 'SMB'])
  return {
    name: companyName(ind), ind, seg, stage: '', health: null, carr, renew: daysOut(int(61, 1600)), grr: 100,
    pod, region: POD_REGION[pod] ?? pick(REGIONS), mine: false, signed: false,
    risk: false, renewing: false, healthy: false, fixed: false, ...over,
  }
}

function build(): Account[] {
  const all: Draft[] = []
  const mine: Draft[] = (ROWS as Omit<Account, 'pod' | 'region' | 'mine' | 'signed'>[]).map(r => ({
    name: r.name, ind: r.ind, seg: r.seg, stage: r.stage, health: r.health, carr: r.carr, renew: r.renew, grr: r.grr,
    pod: MY_POD, region: POD_REGION[MY_POD], mine: true,
    // TransAmerica's renewal commitment is unsigned (TA_RECORD.signedCommitment); no other mine row renews in 60 days
    signed: false,
    risk: false, renewing: false, healthy: false, fixed: true,
  }))

  for (const [pod, n, carrM, avg, riskN, riskM, renewN, renewRiskM] of P.pods as [string, number, number, number | null, number, number, number, number][]) {
    const carr = carrM * 1000, riskCarr = riskM * 1000, renewRisk = renewRiskM * 1000
    const own = pod === MY_POD ? mine : []
    all.push(...own)

    if (pod === 'Unassigned') {
      // no CSM yet: not scored, no revenue booked, no GRR
      for (let i = 0; i < n; i++) all.push(draft(pod, 0, { stage: 'Pending kick-off', grr: null, renew: daysOut(int(120, 700)), fixed: true }))
      continue
    }
    if (pod === 'Strategic Accounts') {
      all.push(draft(pod, 7400, { seg: 'Enterprise', stage: 'BAU + Implementation', health: 74, fixed: true }))
      all.push(draft(pod, carr - 7400, { seg: 'Enterprise', stage: 'BAU + Implementation', health: 56, fixed: true }))
      continue
    }

    const plan = PLAN[pod]
    // what the signed-in CSM's rows already contribute
    const ownRisk = own.filter(a => !a.stage.startsWith('Churned') && a.health != null && a.health < 40)
    const ownRenew = own.filter(a => { const d = Math.round((+a.renew - +TODAY) / 864e5); return !a.stage.startsWith('Churned') && d >= 0 && d <= 60 })
    const sum = (xs: Draft[]) => xs.reduce((s, a) => s + a.carr, 0)
    const left = {
      n: n - own.length, carr: carr - sum(own), risk: riskN - ownRisk.length, riskCarr: riskCarr - sum(ownRisk),
      renew: renewN - ownRenew.length,
      renewRisk: renewRisk - sum(ownRenew.filter(a => !a.signed || (a.health ?? 100) < 40)),
    }

    // at risk: some renew soon (counted in renewal at risk too), the rest don't
    const riskRenewCarr = plan.riskRenew ? (plan.unsignedRenew ? r1((left.riskCarr / left.risk) * plan.riskRenew) : left.renewRisk) : 0
    const riskRenewAmts = splitTotal(riskRenewCarr, plan.riskRenew, 0.3)
    const riskAmts = splitTotal(left.riskCarr - riskRenewCarr, left.risk - plan.riskRenew, 0.7)
    const unsignedAmts = splitTotal(r1(left.renewRisk - riskRenewCarr), plan.unsignedRenew, 0.5)
    const pendingAmts = splitTotal(plan.pendingCarr, plan.pending, 0.5)
    const restN = left.n - left.risk - plan.unsignedRenew - plan.pending - plan.churned
    const restAmts = splitTotal(r1(left.carr - left.riskCarr - (left.renewRisk - riskRenewCarr) - plan.pendingCarr), restN, 0.95)
    const signedRenewN = left.renew - plan.riskRenew - plan.unsignedRenew
    const soon = () => daysOut(int(3, 60))
    const [lo, hi] = plan.riskHealth

    riskRenewAmts.forEach(c => all.push(draft(pod, c, { risk: true, renewing: true, renew: soon(), health: int(lo, hi) })))
    riskAmts.forEach(c => all.push(draft(pod, c, { risk: true, health: int(lo, hi) })))
    unsignedAmts.forEach(c => all.push(draft(pod, c, { renewing: true, renew: soon() })))
    pendingAmts.forEach(c => all.push(draft(pod, c, { stage: 'Pending kick-off', grr: null })))
    for (let i = 0; i < plan.churned; i++) {
      all.push(draft(pod, 0, { stage: 'Churned this FY', grr: 0, renew: daysOut(-int(30, 300)), fixed: true }))
    }
    shuffle(restAmts).forEach((c, i) => all.push(draft(pod, c, i < signedRenewN ? { renewing: true, signed: true, renew: soon() } : {})))

    // Healthy band: walk the pod's other live accounts in random order until the planned CARR is reached
    const open = shuffle(all.filter(a => a.pod === pod && !a.fixed && !a.risk))
    let healthy = 0
    for (const a of open) {
      if (healthy + a.carr <= plan.healthyCarr + 150) { a.healthy = true; healthy += a.carr }
      a.health = a.healthy ? int(70, 88) : int(41, 68)
    }
    // then nudge scores inside their band until the pod's average matches P.pods
    if (avg != null) {
      const scoredIn = all.filter(a => a.pod === pod && !a.stage.startsWith('Churned') && a.health != null)
      const movable = scoredIn.filter(a => !a.fixed)
      const bounds = (a: Draft): [number, number] => (a.risk ? [lo, 39] : a.healthy ? [70, 95] : [40, 69])
      for (let guard = 0; guard < 20000; guard++) {
        const mean = scoredIn.reduce((s, a) => s + (a.health ?? 0), 0) / scoredIn.length
        if (Math.round(mean) === avg) break
        const a = pick(movable), step = mean < avg ? 1 : -1, [min, max] = bounds(a)
        if (a.health! + step >= min && a.health! + step <= max) a.health! += step
      }
    }
  }

  const gen = all.filter(a => !a.mine)

  // Expected churn: at-risk accounts not renewing soon, close to P.stages' CARR
  let churnLeft = STAGE_TARGET['Expected churn'] ?? 0
  for (const a of gen.filter(a => a.risk && !a.renewing && !a.stage).sort((x, y) => y.carr - x.carr)) {
    if (a.carr <= churnLeft + 20) { a.stage = 'Expected churn'; churnLeft -= a.carr }
    if (churnLeft < 20) break
  }

  // the other stages: largest accounts first, each to the stage furthest below its P.stages CARR
  const filled: Record<string, number> = {}
  for (const a of all) if (a.stage) filled[a.stage] = (filled[a.stage] ?? 0) + a.carr
  const MAIN = ['BAU + Implementation', 'BAU', 'Implementation']
  for (const a of gen.filter(a => !a.stage).sort((x, y) => y.carr - x.carr)) {
    const s = MAIN.reduce((best, k) => ((STAGE_TARGET[k] - (filled[k] ?? 0)) > (STAGE_TARGET[best] - (filled[best] ?? 0)) ? k : best))
    a.stage = s; filled[s] = (filled[s] ?? 0) + a.carr
  }

  // GRR: P.grr's under-90 and 90-99 counts, taken from at-risk accounts (expected churn first) and one watch account
  const [under90, mid] = (P.grr as [string, number][]).map(g => g[1])
  const grrOf = (lo: number, hi: number) => (a: Account) => a.grr != null && a.grr >= lo && a.grr <= hi
  let lowLeft = under90 - all.filter(grrOf(0, 89.9)).length
  for (const a of [...gen.filter(a => a.stage === 'Expected churn'), ...shuffle(gen.filter(a => a.risk && a.stage !== 'Expected churn'))]) {
    if (lowLeft-- <= 0) break
    a.grr = int(52, 89)
  }
  let midLeft = mid - all.filter(grrOf(90, 99.9)).length
  for (const a of shuffle(gen.filter(a => !a.risk && !a.healthy && a.grr === 100))) {
    if (midLeft-- <= 0) break
    a.grr = int(92, 98)
  }

  return all.map(a => ({
    name: a.name, ind: a.ind, seg: a.seg, stage: a.stage, health: a.health, carr: a.carr, renew: a.renew, grr: a.grr,
    pod: a.pod, region: a.region, mine: a.mine, signed: a.signed,
  }))
}

/** Every account in the book, in pod order (P.pods), the signed-in CSM's first within their pod. */
export const ACCOUNTS: readonly Account[] = build()

/** Month labels for the last six month-ends, oldest first, ending with TODAY's month. */
export const TREND_MONTHS = Array.from({ length: 6 }, (_, i) =>
  new Date(TODAY.getFullYear(), TODAY.getMonth() - 5 + i, 1).toLocaleDateString('en-US', { month: 'short' }))

/** A pod's average health at each of the last six month-ends, ending with `current`. Placeholder history: small moves
 *  seeded by the pod's name, so a pod always has the same past; the real system keeps one score per account per month. */
export function podHealthHistory(pod: string, current: number): number[] {
  let seed = 611
  for (const ch of pod) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0
  const step = mulberry32(seed)
  const values = [current]
  for (let i = 0; i < 5; i++) values.unshift(Math.max(0, Math.min(100, values[0] + Math.round((step() - 0.45) * 6))))
  return values
}
