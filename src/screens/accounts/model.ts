import { rel, ROWS } from '@/data/legacy'
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
/** renews within 90 days, or the date has already passed unsigned */
export const renewing90 = (r: Row) => live(r) && runway(r).days <= 90
export const lowHealth = (r: Row) => live(r) && lt(r, 40)

/* ---------- saved views (legacy order; "Needs me first" is the landing view) ---------- */
export type ViewId = 'needs' | 'all' | 'risk' | 'watch' | 'healthy' | 'renew'
export const VIEWS: { id: ViewId; label: string; band?: Band; test: (r: Row) => boolean }[] = [
  { id: 'needs', label: 'Needs me first', test: r => isTA(r) || renewing90(r) || lowHealth(r) },
  { id: 'all', label: 'All accounts', test: () => true },
  { id: 'risk', label: 'At risk', band: 'bad', test: lowHealth },
  { id: 'watch', label: 'Watch', band: 'warn', test: r => live(r) && h(r) != null && h(r)! >= 40 && h(r)! < 70 },
  { id: 'healthy', label: 'Healthy', band: 'good', test: r => live(r) && h(r) != null && h(r)! >= 70 },
  { id: 'renew', label: 'Renewing in 90 days', test: renewing90 },
]

/* ---------- filters: dimension -> checkable options (any of the checked values matches) ---------- */
export type DimId = 'band' | 'renew' | 'stage' | 'arr' | 'seg' | 'ind'
export type FilterState = Record<DimId, string[]>
export const NO_FILTERS: FilterState = { band: [], renew: [], stage: [], arr: [], seg: [], ind: [] }
export type FilterOption = { value: string; label: string; test: (r: Row) => boolean }
export type FilterDim = { id: DimId; label: string; options: FilterOption[] }

const renewWindow = (r: Row) => {
  if (!live(r)) return 'churned'
  const d = runway(r).days
  return d < 0 ? 'overdue' : d <= 30 ? '30' : d <= 90 ? '90' : d <= 180 ? '180' : 'later'
}
const distinct = (f: (r: Row) => string) => [...new Set(rows.map(f))].sort((a, b) => a.localeCompare(b))

export const FILTER_DIMS: FilterDim[] = [
  { id: 'band', label: 'Health band', options: (['bad', 'warn', 'good', 'none'] as Band[]).map(b => ({
    value: b, label: b === 'bad' ? 'At risk (under 40)' : b === 'warn' ? 'Watch (40 to 69)' : b === 'good' ? 'Healthy (70+)' : 'No data',
    test: r => bandOf(r.health) === b,
  })) },
  { id: 'renew', label: 'Renewal window', options: ([
    ['overdue', 'Overdue'], ['30', 'Within 30 days'], ['90', '31 to 90 days'], ['180', '91 to 180 days'], ['later', 'Over 180 days'], ['churned', 'Churned'],
  ] as const).map(([value, label]) => ({ value, label, test: r => renewWindow(r) === value })) },
  { id: 'stage', label: 'Stage', options: distinct(r => r.stage).map(v => ({ value: v, label: v, test: r => r.stage === v })) },
  // carr is in $K
  { id: 'arr', label: 'ARR size', options: ([
    ['lt100', 'Under $100K', (k: number) => k < 100], ['100-500', '$100K to $500K', (k: number) => k >= 100 && k < 500],
    ['500-1000', '$500K to $1M', (k: number) => k >= 500 && k < 1000], ['gt1000', '$1M and over', (k: number) => k >= 1000],
  ] as const).map(([value, label, test]) => ({ value, label, test: r => test(r.carr) })) },
  { id: 'seg', label: 'Segment', options: distinct(r => r.seg).map(v => ({ value: v, label: v, test: r => r.seg === v })) },
  { id: 'ind', label: 'Industry', options: distinct(r => r.ind).map(v => ({ value: v, label: v, test: r => r.ind === v })) },
]

/** A row passes when, for every dimension with checked values, it matches one of them. */
export const passes = (r: Row, f: FilterState) =>
  FILTER_DIMS.every(d => !f[d.id].length || d.options.some(o => f[d.id].includes(o.value) && o.test(r)))
export const filterCount = (f: FilterState) => FILTER_DIMS.reduce((n, d) => n + f[d.id].length, 0)

/* ---------- columns + sort ---------- */
/** Hidden until turned on in the Columns menu; their values also sit in the preview sheet. */
export const DEFAULT_HIDDEN: ColId[] = ['nrr', 'stage', 'repo', 'lic']
export type ColId = 'nrr' | 'stage' | 'repo' | 'lic'
export const OPTIONAL_COLS: { id: ColId; label: string }[] = [
  { id: 'nrr', label: 'NRR' }, { id: 'stage', label: 'Stage' },
  { id: 'repo', label: 'Repository' }, { id: 'lic', label: 'Licence use' },
]
export type SortKey = 'name' | 'health' | 'carr' | 'nrr' | 'renew' | 'repo' | 'lic'
export const SORT_NAME: Record<SortKey, string> = {
  name: 'Account', health: 'Health', carr: 'ARR', nrr: 'NRR', renew: 'Renewal', repo: 'Repository', lic: 'Licence use',
}
/** First click direction per column: worst/soonest/alphabetical first, biggest first otherwise. */
export const FIRST_DIR: Record<SortKey, 'asc' | 'desc'> = {
  name: 'asc', health: 'asc', renew: 'asc', carr: 'desc', nrr: 'desc', repo: 'desc', lic: 'desc',
}
const KEY: Record<SortKey, (r: Row) => string | number | null> = {
  name: r => r.name.toLowerCase(), health: h, carr: r => r.carr, nrr: r => r.nrr, renew: r => +r.renew, repo: r => r.repo, lic: r => r.lic,
}

export function sortRows(list: Row[], key: SortKey, dir: 'asc' | 'desc', priority: boolean) {
  const out = [...list]
  if (priority) {
    const g = (r: Row) => (reason(r).group === 'renewal' ? 0 : 1)
    return out.sort((a, b) => g(a) - g(b) || (g(a) ? (h(a) ?? 0) - (h(b) ?? 0) : runway(a).days - runway(b).days))
  }
  const k = KEY[key], m = dir === 'asc' ? 1 : -1
  // missing values ("No data") always sink to the bottom, whatever the direction
  return out.sort((a, b) => {
    const x = k(a), y = k(b)
    if (x == null || y == null) return x == null && y == null ? 0 : x == null ? 1 : -1
    return (x > y ? 1 : x < y ? -1 : 0) * m
  })
}

export type Tone = 'bad' | 'warn' | 'good' | 'neutral'

/* ---------- account brief: TransAmerica only (ported from legacy screen-account.js BRIEF, citation refs stripped) ---------- */
const BRIEF: [string, string][] = [
  ['Where we stand', 'Health is 50, capped from 62 because the $330K renewal is 41 days out with auto-renew off. Usage is steady: licence use 111% and 222 monthly users.'],
  ["What's in play", 'The renewal closes Dec 30 on two order forms with nothing signed. $85K of expansion is open and unsigned.'],
  ["What's at stake", 'The champion, Bailey Laske, handed over on Oct 21. Executive engagement is 0 this month; Nick Cavazos is the likely new day-to-day owner.'],
]
export const brief = (r: Row) => (isTA(r) ? BRIEF : null)

/* ---------- why a row needs attention: the main reason in full, plus the next step ---------- */
export type Group = 'renewal' | 'health'
export type Reason = { tone: Tone; text: string; next?: string; group?: Group }
export function reason(r: Row): Reason {
  if (!live(r)) return { tone: 'neutral', text: 'Churned this year' }
  const rr = runway(r), d = rr.days
  if (isTA(r)) return { tone: 'bad', text: `Renewal unsigned, champion handed over`, next: 'Get a signed commitment this week', group: 'renewal' }
  if (d < 0) return { tone: 'bad', text: `Renewal ${rr.t.toLowerCase()}`, next: 'Chase the signature', group: 'renewal' }
  if (d <= 90) return { tone: 'warn', text: `Renews in ${rr.t}`, next: 'Confirm the paper path', group: 'renewal' }
  if (lt(r, 40)) return { tone: 'bad', text: `Health ${h(r)}, under 40`, next: 'Book a recovery call', group: 'health' }
  if (r.nrr != null && r.nrr < 100) return { tone: 'warn', text: `NRR ${r.nrr}%, contracting`, next: 'Review the downsell' }
  if (r.nrr != null && r.nrr > 100) return { tone: 'good', text: `NRR ${r.nrr}%, expanding`, next: 'Look for expansion' }
  return { tone: 'neutral', text: 'Nothing urgent' }
}
export const GROUP_LABEL: Record<Group, string> = { renewal: 'Renewals at risk', health: 'Low health' }

/* ---------- headline tiles: computed from the same 25 rows as the table, so the numbers reconcile ---------- */
const sum = (l: Row[]) => l.reduce((a, r) => a + r.carr, 0)
export function summary(list: Row[]) {
  const renew = list.filter(renewing90), low = list.filter(lowHealth)
  const scored = list.filter(r => live(r) && h(r) != null)
  const avg = scored.length ? Math.round(scored.reduce((a, r) => a + h(r)!, 0) / scored.length) : null
  const bands = (['bad', 'warn', 'good'] as const).map(b => ({ band: b, n: scored.filter(r => bandOf(r.health) === b).length }))
  return {
    arr: sum(list.filter(live)),
    renew: { arr: sum(renew), n: renew.length, overdue: renew.filter(r => runway(r).days < 0).length },
    low: { arr: sum(low), n: low.length },
    health: { avg, n: scored.length, bands },
  }
}
export const OWNER = 'Rahul Dev Sharma'
