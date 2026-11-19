import { useSyncExternalStore } from 'react'

/** Active account tab, shared so any widget can switch tabs (e.g. "View all in Activity"). */
let current = 'overview'
const subs = new Set<() => void>()

export function setTab(value: string) {
  if (value === current) return
  current = value
  subs.forEach(f => f())
}

export const useTab = () =>
  useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f) } }, () => current)
