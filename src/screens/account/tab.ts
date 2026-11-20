import { useSyncExternalStore } from 'react'

/** Active account tab, kept in the URL hash (`#account/health`) so reload, links and Back all keep it.
 *  Shared so any widget can switch tabs (e.g. "View all in Activity"). */
export const TAB_IDS = ['overview', 'health', 'adoption', 'activity', 'stakeholders', 'intelligence']

const read = () => {
  // '?sheet=…' after the tab is an open side sheet (lib/route.ts)
  const [route, tab] = location.hash.slice(1).split('?')[0].split('/')
  return route === 'account' && TAB_IDS.includes(tab) ? tab : 'overview'
}

export function setTab(value: string) {
  if (value === read()) return
  location.hash = value === 'overview' ? 'account' : `account/${value}`
}

const subscribe = (f: () => void) => {
  window.addEventListener('hashchange', f)
  return () => window.removeEventListener('hashchange', f)
}

export const useTab = () => useSyncExternalStore(subscribe, read)
