import { P, rel } from '@/data/legacy'
import { isMissing, type Band } from '@/components/health'
import { ACCOUNTS, podHealthHistory, POD_REGION, TREND_MONTHS, type Account } from './book'

/* Every Portfolio figure is computed here from account rows (book.ts), one formula per figure. `summarise(accounts)`
   turns any set of rows (the whole book, a region, a pod) into everything the page shows, so a tile, the pods table
   total and the sheet that opens from either always show the same number for the same scope. CARR is in $K on
   accounts; figures in $M are those sums / 1000. */

export type Row = Account
export const book = ACCOUNTS
export const AS_OF = 'Nov 19, 2026'

/* ---------------------------------------------------------------- one definition each */

export const isLive = (a: Row) => !a.stage.startsWith('Churned')
/** Live and scored: the accounts every health figure covers. */
export const isScored = (a: Row) => isLive(a) && !isMissing(a.health)
export const isAtRisk = (a: Row) => isScored(a) && a.health! < 40
export const renewal = (r: Row) => rel(r.renew) as { t: string; c: string; days: number }
/** Live, renewal date 0 to 60 days out (an overdue date doesn't count, as on My accounts). */
export const isRenewing60 = (a: Row) => { const d = renewal(a).days; return isLive(a) && d >= 0 && d <= 60 }
/** Renewing in 60 days and either at risk (health under 40) or without a signed renewal commitment. */
export const isRenewalAtRisk = (a: Row) => isRenewing60(a) && (isAtRisk(a) || !a.signed)

/** CARR in $K, summed at 0.1K so floating point never shows. */
export const carrK = (list: readonly Row[]) => Math.round(list.reduce((s, a) => s + a.carr, 0) * 10) / 10
/** Mean health of the live scored accounts in `list`, rounded; null when none is scored. */
export function avgHealth(list: readonly Row[]): number | null {
  const s = list.filter(isScored)
  return s.length ? Math.round(s.reduce((t, a) => t + a.health!, 0) / s.length) : null
}
/** Gross retention, % to one decimal: each account's GRR weighted by its CARR, over accounts that have a GRR, i.e.
 *  sum(carr × grr) / sum(carr). Null when those accounts carry no CARR. Placeholder: the real figure divides retained
 *  revenue by starting ARR. */
export function grossRetention(list: readonly Row[]): number | null {
  const withGrr = list.filter(a => a.grr != null), c = carrK(withGrr)
  return c ? Math.round((withGrr.reduce((s, a) => s + a.carr * a.grr!, 0) / c) * 10) / 10 : null
}
export const byCarr = (a: Row, b: Row) => b.carr - a.carr || a.name.localeCompare(b.name)

/* ---------------------------------------------------------------- pods, regions, scope */

/** Pods in P.pods order. */
export const POD_NAMES = (P.pods as [string][]).map(p => p[0])
export const regionOf = (pod: string) => POD_REGION[pod] ?? 'Global'
/** Regions in order of their first pod, each with its pods. */
export const REGIONS: { name: string; pods: string[] }[] = POD_NAMES.reduce<{ name: string; pods: string[] }[]>((out, pod) => {
  const r = regionOf(pod), g = out.find(x => x.name === r)
  if (g) g.pods.push(pod); else out.push({ name: r, pods: [pod] })
  return out
}, [])

export type Scope = { kind: 'all' } | { kind: 'pod'; name: string } | { kind: 'region'; name: string }
export const ALL: Scope = { kind: 'all' }

/** `scope=pod:<name>` / `scope=region:<name>`; anything unknown falls back to all pods. */
export function parseScope(raw: string | null): Scope {
  const i = raw?.indexOf(':') ?? -1
  if (!raw || i < 0) return ALL
  const kind = raw.slice(0, i), name = raw.slice(i + 1)
  if (kind === 'pod' && POD_NAMES.includes(name)) return { kind, name }
  if (kind === 'region' && REGIONS.some(r => r.name === name)) return { kind, name }
  return ALL
}
export const scopeParam = (s: Scope) => (s.kind === 'all' ? null : `${s.kind}:${s.name}`)
/** What the button says. */
export const scopeLabel = (s: Scope) => (s.kind === 'all' ? 'All pods' : s.kind === 'region' ? `All ${s.name}` : s.name)
export const scopeAccounts = (s: Scope) =>
  s.kind === 'all' ? book : book.filter(a => (s.kind === 'pod' ? a.pod === s.name : regionOf(a.pod) === s.name))

/* ---------------------------------------------------------------- the summary */

export type Pod = {
  name: string; region: string; accounts: number; carr: number; health: number | null
  atRisk: number; carrAtRisk: number; renewing: number; renewalAtRisk: number
  /** carrAtRisk as a percentage of the pod's CARR */
  riskShare: number
}

/** The figures a pods row shows, for any set of accounts (one pod, or the table's total). $ in $M. */
export function podFigures(list: readonly Row[]): Omit<Pod, 'name' | 'region'> {
  const carr = carrK(list), atRisk = list.filter(isAtRisk), carrAtRisk = carrK(atRisk)
  return {
    accounts: list.length, carr: carr / 1000, health: avgHealth(list),
    atRisk: atRisk.length, carrAtRisk: carrAtRisk / 1000,
    renewing: list.filter(isRenewing60).length, renewalAtRisk: carrK(list.filter(isRenewalAtRisk)) / 1000,
    riskShare: carr ? Math.round((carrAtRisk / carr) * 100) : 0,
  }
}

export type BandInfo = { band: Exclude<Band, 'none'>; label: string; range: string; list: Row[]; carr: number; arr: number }
export type GrrBand = { key: 'under90' | 'mid' | 'full'; label: string; list: Row[]; accounts: number }
export type StageInfo = { stage: string; list: Row[]; accounts: number; carr: number; health: number | null }

/** Stages in the order an account moves through them. "Churned this FY" rows count as Churned. */
export const STAGE_ORDER = ['Pending kick-off', 'Implementation', 'BAU + Implementation', 'BAU', 'Expected churn', 'Churned'] as const
export const stageOf = (a: Row) => (a.stage.startsWith('Churned') ? 'Churned' : a.stage)

/** Month-end average health for a set of accounts, oldest first, the last point equal to avgHealth(list). Each pod
 *  has its own history; a region or the book weights its pods by scored accounts, shifted so the last point matches. */
function healthTrend(list: readonly Row[], pods: string[]): { month: string; value: number }[] {
  const now = avgHealth(list)
  if (now == null) return []
  const series = pods.map(p => {
    const rows = list.filter(a => a.pod === p), h = avgHealth(rows)
    return h == null ? null : { w: rows.filter(isScored).length, values: podHealthHistory(p, h) }
  }).filter(x => x != null)
  const w = series.reduce((s, x) => s + x.w, 0)
  const raw = TREND_MONTHS.map((_, i) => series.reduce((s, x) => s + x.values[i] * x.w, 0) / w)
  const shift = now - raw[raw.length - 1]
  return TREND_MONTHS.map((month, i) => ({ month, value: Math.round(raw[i] + shift) }))
}

/** Everything the Portfolio page shows, for one set of accounts. `name` is how wording refers to it ("of <name>"). */
export function summarise(list: readonly Row[], name = 'the book') {
  const carr = carrK(list)
  const pods = POD_NAMES.filter(p => list.some(a => a.pod === p))
  const podAccounts = (pod: string) => list.filter(a => a.pod === pod).sort(byCarr)

  const bandOfRow = (a: Row): Exclude<Band, 'none'> => (a.health! >= 70 ? 'good' : a.health! >= 40 ? 'warn' : 'bad')
  const scored = list.filter(isScored)
  // unscored accounts carry no CARR in this book (Unassigned), so the bands add up to the scope's CARR
  const bands: BandInfo[] = ([
    { band: 'good', label: 'Healthy', range: '70+' },
    { band: 'warn', label: 'Watch', range: '40 to 69' },
    { band: 'bad', label: 'At risk', range: 'under 40' },
  ] as const).map(b => { const rows = scored.filter(a => bandOfRow(a) === b.band).sort(byCarr), c = carrK(rows); return { ...b, list: rows, carr: c, arr: c / 1000 } })

  const grr: GrrBand[] = ([
    { key: 'under90', label: 'Under 90%', test: (g: number) => g < 90 },
    { key: 'mid', label: '90 to 99%', test: (g: number) => g >= 90 && g < 100 },
    { key: 'full', label: '100% or more', test: (g: number) => g >= 100 },
  ] as const).map(({ test, ...g }) => { const rows = list.filter(a => a.grr != null && test(a.grr)); return { ...g, list: rows, accounts: rows.length } })

  const renewing = list.filter(isRenewing60)
  const withGrr = list.filter(a => a.grr != null).length
  const kpis = {
    avgHealth: avgHealth(list),
    scored: scored.length,
    /** month-end averages, oldest first; the last is avgHealth */
    healthTrend: healthTrend(list, pods),
    renewing,
    renewing60: renewing.length,
    /** $K renewing in 60 days */
    renewingCarr: carrK(renewing),
    /** $K renewing in 60 days that is at risk or unsigned */
    renewalAtRisk: carrK(renewing.filter(isRenewalAtRisk)),
    belowGrr: list.filter(a => a.grr != null && a.grr < 100),
    grr100: grr.find(g => g.key === 'full')!.accounts,
    grrWithData: withGrr,
    grrNoData: list.length - withGrr,
    grrPct: grossRetention(list),
  }

  const stages: StageInfo[] = [
    ...STAGE_ORDER,
    ...[...new Set(list.map(stageOf))].filter(s => !(STAGE_ORDER as readonly string[]).includes(s)),
  ].map(stage => {
    const rows = list.filter(a => stageOf(a) === stage).sort(byCarr)
    return { stage, list: rows, accounts: rows.length, carr: carrK(rows), health: avgHealth(rows) }
  })

  return {
    name,
    accounts: list,
    book: { accounts: list.length, carr, arr: carr / 1000, mine: list.filter(a => a.mine).length },
    /** whole percent of this scope's CARR; 0% when it has none */
    share: (k: number) => `${carr ? Math.round((k / carr) * 100) : 0}%`,
    bands, grr, kpis, stages,
    pods: pods.map(p => ({ name: p, region: regionOf(p), ...podFigures(podAccounts(p)) })) as Pod[],
    podAccounts,
  }
}
export type Summary = ReturnType<typeof summarise>

/** The summary for a scope; `name` is the scope's own name, or "the book". */
export const summariseScope = (s: Scope) => summarise(scopeAccounts(s), s.kind === 'all' ? 'the book' : s.name)

/* ---------------------------------------------------------------- formats */

/** $M with one decimal from $10M, two under, e.g. 1.4 -> "$1.4M", 0.4233 -> "$423K". */
export function moneyM(m: number) {
  if (!m) return '$0'
  if (m < 1) return `$${Math.round(m * 1000)}K`
  return `$${m.toFixed(m >= 10 ? 1 : 2).replace(/0$/, '').replace(/\.$/, '')}M`
}
/** Same, from $K. */
export const moneyK = (k: number) => moneyM(k / 1000)
/** $M always to one decimal ($5.1M, $64.8M); under $1M in $K. For rows that should read as one column. */
export const money1 = (m: number) => (!m ? '$0' : m < 1 ? `$${Math.round(m * 1000)}K` : `$${m.toFixed(1)}M`)
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
