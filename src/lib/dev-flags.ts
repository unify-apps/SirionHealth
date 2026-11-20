import { useSyncExternalStore } from 'react'

/** Prototype-only switches for comparing design options. Kept in localStorage, and the URL wins (?flat=1, ?layout=rail),
 *  so a reviewer can be sent straight to an option. Each flag lands as data-<flag> on <html> for CSS to read. */
export type Flag = 'flat'
export const FLAGS: { id: Flag; label: string; hint: string }[] = [
  { id: 'flat', label: 'Flat detail page', hint: 'Account page without card blocks: sections sit on the page, split by rules' },
]

/** Account detail page layout options. 'tabsfirst' is the default; the rest are kept for comparison. */
export type Layout = 'current' | 'rail' | 'brief' | 'tabsfirst' | 'masthead' | 'runway' | 'ledger'
export const LAYOUTS: { id: Layout; label: string; hint: string }[] = [
  { id: 'current', label: 'Previous', hint: 'Verdict card and KPIs above pill tabs' },
  { id: 'rail', label: 'A · Record + rail', hint: 'Sticky left rail holds the account facts; content and tabs on the right' },
  { id: 'brief', label: 'B · Briefing', hint: 'One long read, no tabs: chapters with a sticky contents list' },
  { id: 'tabsfirst', label: 'D · Tabs first (default)', hint: 'Segmented tabs under the title; verdict and KPIs live in Summary' },
  { id: 'masthead', label: 'E · Masthead', hint: 'One big score and verdict sentence on an open page; ruled sections, no cards' },
  { id: 'runway', label: 'F · Runway', hint: 'The renewal runway chart is the hero, with the countdown at its end' },
  { id: 'ledger', label: 'G · Ledger', hint: 'A score strip over dense rows with inline bars; everything scans in lines' },
]

const KEY = (f: string) => `sah-flag-${f}`
/** Default detail page layout. The key carries a version so a change of default resets earlier picks. */
export const DEFAULT_LAYOUT: Layout = 'tabsfirst'
const LAYOUT_KEY = 'layout-v2'
const q = (k: string) => new URLSearchParams(location.search).get(k)
const read = (f: Flag) => {
  const v = q(f)
  if (v === '1' || v === '0') return v === '1'
  try { return localStorage.getItem(KEY(f)) === '1' } catch { return false }
}
const readLayout = (): Layout => {
  const ok = (v: string | null): v is Layout => LAYOUTS.some(l => l.id === v)
  const v = q('layout')
  if (ok(v)) return v
  try { const s = localStorage.getItem(KEY(LAYOUT_KEY)); return ok(s) ? s : DEFAULT_LAYOUT } catch { return DEFAULT_LAYOUT }
}

type State = Record<Flag, boolean> & { layout: Layout }
let state: State = { flat: read('flat'), layout: readLayout() }
const subs = new Set<() => void>()
const apply = () => {
  const el = document.documentElement
  ;(Object.keys(state) as (keyof State)[]).forEach(f => {
    if (f === 'layout') el.dataset.layout = state.layout
    else el.toggleAttribute(`data-${f}`, state[f])
  })
}
apply()

const set = (patch: Partial<State>, key: string, val: string) => {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY(key), val) } catch {}
  apply()
  subs.forEach(s => s())
}
export const setFlag = (f: Flag, on: boolean) => set({ [f]: on }, f, on ? '1' : '0')
export const setLayout = (l: Layout) => set({ layout: l }, LAYOUT_KEY, l)
export const useFlags = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => state)
