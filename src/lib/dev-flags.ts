import { useSyncExternalStore } from 'react'

/** Prototype-only switches for comparing design options. Kept in localStorage, and ?flat=1 / ?flat=0 in the URL wins,
 *  so a reviewer can be sent straight to an option. Each flag lands as data-<flag> on <html> for CSS to read. */
export type Flag = 'flat'
export const FLAGS: { id: Flag; label: string; hint: string }[] = [
  { id: 'flat', label: 'Flat detail page', hint: 'Account page without card blocks: sections sit on the page, split by rules' },
]

const KEY = (f: Flag) => `sah-flag-${f}`
const read = (f: Flag) => {
  const q = new URLSearchParams(location.search).get(f)
  if (q === '1' || q === '0') return q === '1'
  try { return localStorage.getItem(KEY(f)) === '1' } catch { return false }
}
let state: Record<Flag, boolean> = { flat: read('flat') }
const subs = new Set<() => void>()
const apply = () => (Object.keys(state) as Flag[]).forEach(f => document.documentElement.toggleAttribute(`data-${f}`, state[f]))
apply()

export function setFlag(f: Flag, on: boolean) {
  state = { ...state, [f]: on }
  try { localStorage.setItem(KEY(f), on ? '1' : '0') } catch {}
  apply()
  subs.forEach(s => s())
}
export const useFlags = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => state)
