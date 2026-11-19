import { fmtDate, money, P, rel, ROWS } from '@/data/legacy'
import { bandOf, isMissing, type Band } from '@/components/health'

export type Row = {
  name: string; ind: string; seg: string; stage: string; health: number | null
  carr: number; nrr: number | null; grr: number | null; repo: number; renew: Date; lic: number | null
}
export type Runway = { t: string; c: '' | 'b' | 'w'; days: number }

export const rows = ROWS as Row[]
export const runway = (r: Row): Runway => rel(r.renew) as Runway

export const isTA = (r: Row) => r.name === 'TransAmerica'
export const live = (r: Row) => !/Churn/.test(r.stage)
const h = (r: Row) => (isMissing(r.health) ? null : r.health)
const lt = (r: Row, n: number) => h(r) != null && h(r)! < n
const renewing90 = (r: Row) => { const d = runway(r).days; return live(r) && d >= 0 && d <= 90 }

/* ---------- saved views (legacy order; "Needs me first" is the landing view) ---------- */
export type ViewId = 'needs' | 'all' | 'risk' | 'watch' | 'healthy' | 'renew' | 'impl'
export const VIEWS: { id: ViewId; label: string; band?: Band; test: (r: Row) => boolean }[] = [
  { id: 'needs', label: 'Needs me first', test: r => isTA(r) || (live(r) && (lt(r, 40) || runway(r).days <= 90)) },
  { id: 'all', label: 'All accounts', test: () => true },
  { id: 'risk', label: 'At risk', band: 'bad', test: r => live(r) && lt(r, 40) },
  { id: 'watch', label: 'Watch', band: 'warn', test: r => live(r) && h(r) != null && h(r)! >= 40 && h(r)! < 70 },
  { id: 'healthy', label: 'Healthy', band: 'good', test: r => live(r) && h(r) != null && h(r)! >= 70 },
  { id: 'renew', label: 'Renewing in 90 days', test: renewing90 },
  { id: 'impl', label: 'In implementation', test: r => /Implementation/.test(r.stage) },
]

/* ---------- filters ---------- */
export type FilterId = 'h70' | 'h40' | 'r90' | 'bau' | 'impl' | 'ent' | 'mid'
export const FILTERS: { id: FilterId; label: string; group: string; test: (r: Row) => boolean }[] = [
  { id: 'h70', group: 'Health', label: 'Health under 70', test: r => lt(r, 70) },
  { id: 'h40', group: 'Health', label: 'Health under 40', test: r => lt(r, 40) },
  { id: 'r90', group: 'Renewal', label: 'Renews within 90 days', test: renewing90 },
  { id: 'bau', group: 'Stage', label: 'Stage: BAU', test: r => /BAU/.test(r.stage) },
  { id: 'impl', group: 'Stage', label: 'Stage: Implementation', test: r => /Implementation/.test(r.stage) },
  { id: 'ent', group: 'Segment', label: 'Segment: Enterprise', test: r => r.seg === 'Enterprise' },
  { id: 'mid', group: 'Segment', label: 'Segment: Mid market or SMB', test: r => r.seg !== 'Enterprise' },
]

/* ---------- columns + sort ---------- */
export type ColId = 'signals' | 'stage' | 'repo' | 'lic'
export const OPTIONAL_COLS: { id: ColId; label: string }[] = [
  { id: 'signals', label: 'Signals' }, { id: 'stage', label: 'Stage' },
  { id: 'repo', label: 'Repository' }, { id: 'lic', label: 'Licence use' },
]
export type SortKey = 'name' | 'health' | 'carr' | 'renew' | 'repo' | 'lic'
export const SORT_NAME: Record<SortKey, string> = {
  name: 'Account', health: 'Health', carr: 'ARR', renew: 'Renewal', repo: 'Repository', lic: 'Licence use',
}
/** First click direction per column: worst/soonest/alphabetical first, biggest first otherwise. */
export const FIRST_DIR: Record<SortKey, 'asc' | 'desc'> = {
  name: 'asc', health: 'asc', renew: 'asc', carr: 'desc', repo: 'desc', lic: 'desc',
}
const KEY: Record<SortKey, (r: Row) => string | number | null> = {
  name: r => r.name.toLowerCase(), health: h, carr: r => r.carr, renew: r => +r.renew, repo: r => r.repo, lic: r => r.lic,
}

export function sortRows(list: Row[], key: SortKey, dir: 'asc' | 'desc', priority: boolean) {
  const out = [...list]
  if (priority) return out.sort((a, b) => +isTA(b) - +isTA(a) || runway(a).days - runway(b).days)
  const k = KEY[key], m = dir === 'asc' ? 1 : -1
  // missing values ("No data") always sink to the bottom, whatever the direction
  return out.sort((a, b) => {
    const x = k(a), y = k(b)
    if (x == null || y == null) return x == null && y == null ? 0 : x == null ? 1 : -1
    return (x > y ? 1 : x < y ? -1 : 0) * m
  })
}

/* ---------- signals: ranked, the first one is the main signal ---------- */
export type Tone = 'bad' | 'warn' | 'good' | 'neutral'
export type Signal = { tone: Tone; text: string }
export function signals(r: Row): Signal[] {
  if (!live(r)) return [{ tone: 'bad', text: 'Churned' }]
  const d = runway(r).days, s: Signal[] = []
  if (isTA(r)) s.push({ tone: 'bad', text: 'Renewal unsigned' }, { tone: 'bad', text: 'Champion handed over' })
  else if (d < 0) s.push({ tone: 'bad', text: 'Overdue renewal' })
  else if (d <= 90) s.push({ tone: 'warn', text: 'Renewal imminent' })
  if (lt(r, 40)) s.push({ tone: 'bad', text: 'Low health' })
  if (r.nrr != null && r.nrr > 100) s.push({ tone: 'good', text: 'NRR expanding' })
  else if (r.nrr != null && r.nrr < 100) s.push({ tone: 'warn', text: 'NRR contracting' })
  if (/Implementation/.test(r.stage)) s.push({ tone: 'neutral', text: 'In implementation' })
  if (r.lic != null && r.lic > 100) s.push({ tone: 'good', text: 'Over licence' })
  const rank: Record<Tone, number> = { bad: 0, warn: 1, neutral: 2, good: 3 }
  return s.sort((a, b) => rank[a.tone] - rank[b.tone])
}

/* ---------- insights (TransAmerica: brief from the account record; others: rule summary) ---------- */
// ported from legacy screen-account.js BRIEF, citation refs stripped
const BRIEF: [string, string][] = [
  ['Where we stand', 'Health is 50, capped from 62 because the $330K renewal is 41 days out with auto-renew off. Usage is steady: licence use 111% and 222 monthly users.'],
  ["What's in play", 'The renewal closes Dec 30 on two order forms with nothing signed. The account insight says to secure a signed commitment within 7 days. $85K of expansion is open and unsigned.'],
  ["What's at stake", 'The champion, Bailey Laske, handed over on Oct 21 and leadership threatened the renewal on Aug 28. Executive engagement is 0 this month; Nick Cavazos is the likely new day-to-day owner.'],
]
export type Insights = { tag: 'AI' | 'Rule'; rows: [string, string][] }
export function insights(r: Row): Insights {
  if (isTA(r)) return { tag: 'AI', rows: BRIEF }
  const rr = runway(r), d = rr.days, hv = h(r)
  const nr = r.nrr == null ? 'NRR and GRR have no data' : `NRR ${r.nrr}% and GRR ${r.grr}%`
  const hs = hv == null ? 'Health has no data' : `Health ${hv} (${hv >= 70 ? 'healthy' : hv >= 40 ? 'watch' : 'at risk'})`
  return {
    tag: 'Rule',
    rows: [
      ['Where we stand', `${hs} on ${money(r.carr)} CARR, stage ${r.stage}. ${nr}.`],
      ["What's in play", !live(r) ? 'Churned this financial year.'
        : d < 0 ? `The renewal date (${fmtDate(r.renew)}) has passed: ${rr.t.toLowerCase()}.`
        : `Renews ${fmtDate(r.renew)}, ${rr.t} away.${r.lic != null ? ` Licence use ${r.lic}%.` : ''}`],
      ["What's at stake", lt(r, 40) ? `${money(r.carr)} at renewal risk with health under 40.`
        : d >= 0 && d <= 90 ? `${money(r.carr)} renews within 90 days; confirm the paper path.`
        : 'Nothing urgent in the list data. Only TransAmerica has full account detail in this build.'],
    ],
  }
}

/* ---------- headline tiles (book of 260; the list below holds the 25 captured rows) ---------- */
const bookArr = P.pods.reduce((a: number, p: unknown[]) => a + (p[2] as number), 0) // $M
const bookCount = P.pods.reduce((a: number, p: unknown[]) => a + (p[1] as number), 0)
export const BOOK = {
  owner: 'Rahul Dev Sharma',
  count: bookCount,
  arr: `$${bookArr.toFixed(1)}M`,
  arrPer: money(Math.round((bookArr * 1000) / bookCount)),
  atRisk: '$3.81M',
  pipeline: '$8.47M',
  opps: 57,
  avgHealth: 55,
}
export const avgBand = bandOf(BOOK.avgHealth)
