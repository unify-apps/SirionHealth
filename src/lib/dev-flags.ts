import { useSyncExternalStore } from 'react'

/** Prototype-only design switch. Each style restyles the whole app (palette, type, surfaces, tables, toolbars) and the
 *  account page layout. Kept in localStorage; ?layout=ledger in the URL wins, so a reviewer can be sent straight to one.
 *  The choice lands as data-layout on <html> for CSS to read. */
export type Layout = 'tabsfirst' | 'ledger'
export const LAYOUTS: { id: Layout; label: string; hint: string }[] = [
  { id: 'tabsfirst', label: 'Studio', hint: 'Cards on a warm white page, violet accent; account tabs lead, standing in Summary' },
  { id: 'ledger', label: 'Ledger', hint: 'No cards: ruled rows, editorial type, cobalt accent; everything scans in lines' },
]

const KEY = (f: string) => `sah-flag-${f}`
/** Default style. The key carries a version so a change of default resets earlier picks. */
export const DEFAULT_LAYOUT: Layout = 'tabsfirst'
const LAYOUT_KEY = 'layout-v3'

const readLayout = (): Layout => {
  const ok = (v: string | null): v is Layout => LAYOUTS.some(l => l.id === v)
  const v = new URLSearchParams(location.search).get('layout')
  if (ok(v)) return v
  try { const s = localStorage.getItem(KEY(LAYOUT_KEY)); return ok(s) ? s : DEFAULT_LAYOUT } catch { return DEFAULT_LAYOUT }
}

type State = { layout: Layout }
let state: State = { layout: readLayout() }
const subs = new Set<() => void>()
const apply = () => { document.documentElement.dataset.layout = state.layout }
apply()

export const setLayout = (l: Layout) => {
  state = { layout: l }
  try { localStorage.setItem(KEY(LAYOUT_KEY), l) } catch {}
  apply()
  subs.forEach(s => s())
}
export const useFlags = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => state)
