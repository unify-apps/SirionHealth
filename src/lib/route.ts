import { useEffect, useState, useSyncExternalStore } from 'react'

export type Route = 'accounts' | 'account' | 'portfolio' | 'states'
const ROUTES: Route[] = ['accounts', 'account', 'portfolio', 'states']

// ponytail: hash routing, four screens; swap for a router if deep links with params appear
const read = (): Route => {
  // '#account/health' is the account screen on its Health tab (see screens/account/tab.ts);
  // '#account/health?sheet=area:commercial' adds an open side sheet (see openSheet below)
  const h = location.hash.slice(1).split(/[/?]/)[0] as Route
  return ROUTES.includes(h) ? h : 'accounts'
}

export function go(r: Route) {
  location.hash = r
  window.scrollTo(0, 0)
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

/* ---------------------------------------------------------------- side sheets in the URL
   `#account/<tab>?sheet=<type>:<id>&from=<type>:<id>`, e.g. `#account/stakeholders?sheet=person:jane@transamerica.com`.
   `from` is the parent of a nested sheet (All inputs → area, How scores work → area); Esc and the back button return to it.
   Opening a sheet pushes one history entry, so browser Back closes it. Paging (prev/next), drilling in and going
   back replace that entry. Closing pops the entry it pushed, or strips the sheet from the URL after a reload. */

export type SheetRef = { type: string; id: string }
export type SheetState = SheetRef & { from: SheetRef | null }

const parseRef = (s: string | null): SheetRef | null => {
  if (!s) return null
  const i = s.indexOf(':')
  return i < 0 ? { type: s, id: '' } : { type: s.slice(0, i), id: s.slice(i + 1) }
}
const refText = (r: SheetRef) => (r.id ? `${r.type}:${r.id}` : r.type)
const split = () => {
  const h = location.hash.slice(1), q = h.indexOf('?')
  return q < 0 ? { path: h, params: new URLSearchParams() } : { path: h.slice(0, q), params: new URLSearchParams(h.slice(q + 1)) }
}

let cacheKey = '', cacheVal: SheetState | null = null
function readSheet(): SheetState | null {
  const { params } = split()
  const key = params.toString()
  if (key !== cacheKey) {
    cacheKey = key
    const s = parseRef(params.get('sheet'))
    cacheVal = s ? { ...s, from: parseRef(params.get('from')) } : null
  }
  return cacheVal
}

// true while the open sheet's history entry was pushed by this page (so closing can pop it)
let pushed = false
const subscribe = (f: () => void) => {
  const on = () => { if (!readSheet()) pushed = false; f() }
  window.addEventListener('hashchange', on)
  return () => window.removeEventListener('hashchange', on)
}

/** The open sheet, read from the URL. Every account-page sheet derives its open state from this. */
export const useSheet = () => useSyncExternalStore(subscribe, readSheet)

function write(path: string, params: URLSearchParams, mode: 'push' | 'replace') {
  const q = params.toString()
  const hash = '#' + path + (q ? '?' + q : '')
  if (hash === location.hash) return
  if (mode === 'push') { location.hash = hash; return }
  history.replaceState(history.state, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** Opens a sheet. `replace` swaps the open one in place (paging, drilling in, back); `from` makes it nested;
 *  `tab` opens it on another account tab (a person link opens on Stakeholders). */
export function openSheet(type: string, id = '', opts: { from?: SheetRef | null; replace?: boolean; tab?: string } = {}) {
  const { path, params } = split()
  const target = opts.tab ? (opts.tab === 'overview' ? 'account' : `account/${opts.tab}`) : path
  const next = new URLSearchParams()
  next.set('sheet', refText({ type, id }))
  if (opts.from) next.set('from', refText(opts.from))
  const replace = !!opts.replace && !!readSheet()
  // a link to another tab is a new place: Back returns to the sheet it came from, Close stays on the new tab
  if (!replace) pushed = !opts.tab && !params.get('sheet')
  write(target, next, replace ? 'replace' : 'push')
}

/** Closes whatever sheet is open: pops the entry its opening pushed, else strips it from the URL. */
export function closeSheet() {
  if (!readSheet()) return
  if (pushed) { pushed = false; history.back(); return }
  const { path } = split()
  write(path, new URLSearchParams(), 'replace')
}

/** onOpenChange for a URL-driven sheet. */
export const sheetOpenChange = (o: boolean) => { if (!o) closeSheet() }
