/* The only place a user-visible date is formatted (audit B36). "Today" is the app's TODAY constant, never the real clock.
   full  "Oct 27, 2026"  sheets, tooltips, anything without a date header
   short "Oct 27"        only when the year is the data year (TODAY's); other years fall back to full
   month "Oct 2026"      monthly summaries      monthLong "October 2026"      month headers
   tick  "Oct 26"        chart axis ticks (month + 2-digit year), same on every chart
   when  "3 days ago" / "in 41 days" / "Today" within 7 days of TODAY, else short or full
   ISO strings are for ids, URLs, keys and CSV only: isoDay / isoMonth / parseISO. */
import { DAY, TODAY } from '@/data/legacy'

const EN = 'en-US'
const ymDate = (ym: string) => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1)
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const DATA_YEAR: number = TODAY.getFullYear()

export const fmtFull = (d: Date) => d.toLocaleDateString(EN, { month: 'short', day: 'numeric', year: 'numeric' })
export const fmtShort = (d: Date) =>
  d.getFullYear() === DATA_YEAR ? d.toLocaleDateString(EN, { month: 'short', day: 'numeric' }) : fmtFull(d)
export const fmtMonth = (ym: string) => ymDate(ym).toLocaleDateString(EN, { month: 'short', year: 'numeric' })
export const fmtMonthLong = (ym: string) => ymDate(ym).toLocaleDateString(EN, { month: 'long', year: 'numeric' })
/** Month name only, for use next to a year or a group header ("Oct"). */
export const fmtMonthName = (ym: string) => ymDate(ym).toLocaleDateString(EN, { month: 'short' })
export const fmtMonthNarrow = (ym: string) => ymDate(ym).toLocaleDateString(EN, { month: 'narrow' })
/** Chart axis tick, from a month key or a Date or a timestamp: "Oct 26". */
export const fmtTick = (t: string | number | Date) => {
  const d = typeof t === 'string' ? ymDate(t) : new Date(t)
  return d.toLocaleDateString(EN, { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2)
}

/** Whole days from TODAY to d (negative = past). */
export const daysFromToday = (d: Date) => Math.round((+midnight(d) - +midnight(TODAY)) / DAY)
export const isRelative = (d: Date) => Math.abs(daysFromToday(d)) <= 7
export const fmtRel = (d: Date) => {
  const n = daysFromToday(d)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}
/** Relative within 7 days of TODAY, otherwise short (or full with `full`). Show fmtFull(d) in a tooltip when isRelative(d). */
export const fmtWhen = (d: Date, full = false) => (isRelative(d) ? fmtRel(d) : full ? fmtFull(d) : fmtShort(d))

/* ISO: ids, URLs, keys, CSV. Never render these. */
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const isoMonth = (d: Date) => isoDay(d).slice(0, 7)
export const parseISO = (s: string) => new Date(s + 'T00:00:00')
