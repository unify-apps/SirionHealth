import { useSyncExternalStore } from 'react'
import { TODAY } from '@/data/legacy'

/** The account page date range, shared by every widget that reads it. Kept in the URL (?range=90d) so a view can be linked. */
export const RANGES = [
  { id: '30d', label: 'Last 30 days', days: 30, months: 1 },
  { id: '90d', label: 'Last 90 days', days: 90, months: 3 },
  { id: '180d', label: 'Last 180 days', days: 180, months: 6 },
  { id: '12m', label: 'Last 12 months', days: 365, months: 12 },
  { id: 'all', label: 'Lifetime', days: null, months: null },
] as const
export type Range = (typeof RANGES)[number]

const read = (): Range => RANGES.find(r => r.id === new URLSearchParams(location.search).get('range')) ?? RANGES[4]
let current = read()
const subs = new Set<() => void>()

export function setRange(id: Range['id']) {
  const u = new URL(location.href)
  if (id === 'all') u.searchParams.delete('range'); else u.searchParams.set('range', id)
  history.replaceState(history.state, '', u)
  current = read()
  subs.forEach(f => f())
}
export const useRange = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => current)
export const getRange = () => current

/** First day inside the range, or null for lifetime. */
export const rangeStart = (r: Range) => (r.days == null ? null : new Date(+TODAY - r.days * 864e5))
