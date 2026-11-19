/* Activity: every dated statement from Sirion's monthly summaries plus the key events from the order forms and the
   scored record. Ported from legacy screen-account.js (JR, jrChannel, jrTitle, jrItems, jrText, KEY_COPY, renderJourney). */
import { DAY, TA_EVENTS, TA_REAL, TA_RECORD, taFlags, TODAY } from '@/data/legacy'
import { evidence, isGone, people, peopleIndex, shortRole, type Evidence } from '../stakeholders/model'
import type { RoleState } from '../stakeholders/store'
import { dayISO, ymLabel } from './shared'

export type Channel = 'email' | 'meeting' | 'teams' | 'call' | 'ticket' | 'record' | 'file' | 'ai' | 'note'
export const CH_NAME: Record<Channel, string> = {
  email: 'Email', meeting: 'Meeting', teams: 'Teams', call: 'Call', ticket: 'Ticket', record: 'AHI record', file: 'Order form', ai: 'Account insight', note: 'Summary note',
}
export type EventKind = 'pos' | 'neg' | 'flag' | 'goal' | 'end' | 'neu'
export type Cat = 'risk' | 'positive' | 'general'
export const catOf = (k: EventKind): Cat => k === 'neg' || k === 'flag' ? 'risk' : k === 'pos' ? 'positive' : 'general'
export const CAT_LABEL: Record<Cat, string> = { risk: 'Risk', positive: 'Positive', general: 'General' }

export function jrChannel(text: string, src: string): Channel {
  if (/AHI record/.test(src)) return 'record'
  if (/order forms/i.test(src)) return 'file'
  if (/AI insight/.test(src)) return 'ai'
  if (/Last email/.test(text)) return 'email'
  if (/Last meeting/.test(text)) return 'meeting'
  if (/\b(on|via|in a) (MS )?Teams\b|Teams (message|chat)/i.test(text)) return 'teams'
  if (/\b(after|on|during) a call\b|\bcall with\b|\bphone\b/i.test(text)) return 'call'
  if (/INC-|SR-|#|ticket|RCA|Jira/i.test(text)) return 'ticket'
  if (/meeting|MBR|business review|call|QBR|check-in|session|demo|workshop/i.test(text)) return 'meeting'
  if (/email|replied|thread|wrote|forward|asked|sent|notice/i.test(text)) return 'email'
  return 'note'
}
function jrTitle(e: Evidence) {
  if (e.tickets.length) return `Ticket ${e.tickets[0]}`
  if (/MBR|business review/i.test(e.text)) return 'Monthly business review'
  const ch = jrChannel(e.text, '')
  return ({ meeting: 'Meeting', email: 'Email thread', ticket: 'Support ticket' } as Record<string, string>)[ch] ?? 'Account update'
}
const srcLabel = (s: string) => { s = s.replace(/^sentiment /, 'Monthly summary, '); return s[0].toUpperCase() + s.slice(1) }

/** Plain-language copy for key events that come from the record rather than a summary. */
const KEY_COPY: Record<string, [string, string]> = {
  '2026-10-31': ['Health capped at 50', 'Renewal in 59 days with auto-renew off · AHI record, Oct 31'],
  '2026-12-30': ['Renewal due · $330K CARR', '2 order forms, auto-renew off'],
  '2026-11-26': ['Commitment target date', 'Suggested by the account insight: get a signed renewal commitment'],
}
/** What the record itself says, for events that come from it rather than from a summary. */
const RECORD_DETAIL = {
  record: ['AHI scored record, Oct 31 snapshot', `Final health ${TA_RECORD.finalHealth}, weighted ${TA_RECORD.weightedHealth}. Override ${TA_RECORD.overrideCode}: ${TA_RECORD.overrideReason}.`],
  file: ['Order forms and AHI record', 'Renewal Dec 30, 2026 for $330K CARR (CU0213 OF 001 $275K, OF 002 $55K). Auto-renew: No. Signed commitment: No.'],
  ai: ['Account insight in AHI', '“Within 7 days, engage contact stakeholders to secure signed renewal commitment for the $330,000 CARR prior to the Dec 30, 2026 renewal date (42 days remaining).”'],
} as Partial<Record<Channel, [string, string]>>

export interface Item {
  id: string; date: Date; kind: EventKind; cat: Cat; key: boolean; title: string; desc: string; src: string; ch: Channel
  who: string[]; internal: string[]; external: [string, string][]; tickets: string[]; record: [string, string] | null; fromSummary: boolean
}
export interface Touch { kind: 'meeting' | 'email'; date: Date }
export interface ActivityData { items: Item[]; snapshot: Touch[]; ev: Evidence[] }

export function loadActivity(): ActivityData {
  const ev = evidence(), dated = ev.filter(v => v.date), used = new Set<Evidence>(), idx = peopleIndex()
  const P = people()
  const tagged = Object.fromEntries(P.map(p => [p.name, p]))
  const roleOf = (n: string, st?: RoleState): string => {
    const p = tagged[n]; if (!p) return ''
    if (st?.roles[p.email]) return st.roles[p.email]
    return p.tagged ? p.tagged.replace(' / CXO', '') : p.suggested && !isGone(p.suggested) ? shortRole(p.suggested) : p.suggested ?? ''
  }
  const split = (who: string[]) => ({ internal: who.filter(n => idx[n] === 'sirion'), external: who.filter(n => idx[n] !== 'sirion').map(n => [n, roleOf(n)] as [string, string]) })
  const events = TA_EVENTS as unknown as [string, EventKind, string, string][]
  const items: Item[] = events.filter(e => !/engagement snapshot/.test(e[3])).map(([d, k, text, src]) => {
    const dt = new Date(d + 'T00:00:00')
    const match = /^sentiment/.test(src) ? dated.find(v => !used.has(v) && v.kind === k && Math.abs(+v.date! - +dt) <= 2 * DAY) ?? null : null
    if (match) used.add(match)
    const who = match ? match.who : [], ch = jrChannel(match ? match.text : text, src), kc = KEY_COPY[d]
    return {
      id: 'k' + d + text.slice(0, 12), date: dt, kind: k, cat: catOf(k), key: true,
      title: kc && !who.length ? kc[0] : text, desc: match ? match.text : kc && !who.length ? kc[1] : '', src: srcLabel(src), ch,
      who, ...split(who), tickets: match ? match.tickets : [], record: !match ? RECORD_DETAIL[ch] ?? null : null, fromSummary: !!match,
    }
  })
  dated.filter(v => !used.has(v)).forEach(v => items.push({
    id: 's' + v.date!.toISOString() + v.text.slice(0, 12), date: v.date!, kind: v.kind, cat: catOf(v.kind), key: false, title: jrTitle(v), desc: v.text,
    src: 'Monthly summary, ' + ymLabel(v.ym), ch: jrChannel(v.text, ''), who: v.who, ...split(v.who), tickets: v.tickets, record: null, fromSummary: true,
  }))
  const snapshot = events.filter(e => /engagement snapshot/.test(e[3]))
    .map(e => ({ kind: /email/i.test(e[2]) ? 'email' : 'meeting', date: new Date(e[0] + 'T00:00:00') }) as Touch)
  return { items, snapshot, ev }
}

/** Re-labels customer participants with any role set on the Stakeholders tab. */
export function withRoles(items: Item[], st: RoleState): Item[] {
  if (!Object.keys(st.roles).length) return items
  const byName = Object.fromEntries(people().map(p => [p.name, p.email]))
  return items.map(i => ({ ...i, external: i.external.map(([n, r]) => [n, st.roles[byName[n]] ?? r] as [string, string]) }))
}

/** A short line under the title that never repeats it. */
export function rowText(i: Item) {
  let d = i.desc.replace(/^On \w+ \d{1,2},? /, '')
  d = d.charAt(0).toUpperCase() + d.slice(1)
  if (d.toLowerCase().startsWith(i.title.toLowerCase())) {
    d = d.slice(i.title.length).replace(/^[\s,.:;–-]+/, '').replace(/^on \w+ \d{1,2},? /i, '')
    d = d.length < 25 ? '' : d.charAt(0).toUpperCase() + d.slice(1)
  }
  return d
}

/* ---- timeline to renewal: one dot per month, May 2025 to the Dec 2026 renewal ---- */
export interface JourneyMonth { ym: string; state: 'neg' | 'pos' | 'quiet' | 'now' | 'up'; health: number | null; events: string[]; neg: number; pos: number }
export function journey(): JourneyMonth[] {
  const fl = taFlags() as { ym: string; final: number }[], by = Object.fromEntries(fl.map(f => [f.ym, f.final]))
  const nowYm = dayISO(TODAY).slice(0, 7), out: JourneyMonth[] = []
  const events = TA_EVENTS as unknown as [string, EventKind, string, string][]
  for (let m = new Date(2025, 4, 1); m <= new Date(2026, 11, 30); m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const ym = dayISO(m).slice(0, 7), ev = events.filter(e => e[0].startsWith(ym) && e[1] !== 'end' && !/engagement snapshot/.test(e[3]))
    const state = ym === nowYm ? 'now' : ym > nowYm ? 'up' : ev.some(e => e[1] === 'neg') ? 'neg' : ev.some(e => e[1] === 'pos') ? 'pos' : 'quiet'
    out.push({ ym, state, health: by[ym] ?? null, events: ev.map(e => e[2]), neg: ev.filter(e => e[1] === 'neg' || e[1] === 'flag').length, pos: ev.filter(e => e[1] === 'pos').length })
  }
  return out
}

/* ---- monthly sentiment: positive and negative drivers per month, with the month's sentiment score ---- */
export interface SentimentMonth { ym: string; score: number | null; prev: number | null; pos: Evidence[]; neg: Evidence[] }
export function sentimentMonths(ev: Evidence[]): SentimentMonth[] {
  const R = TA_REAL as unknown as { monthly: (string | number)[][]; monthlyFields: string[]; sentiment: string[][] }
  const si = R.monthlyFields.indexOf('sentiment')
  const score = Object.fromEntries(R.monthly.map(r => [r[0] as string, r[si] as number]))
  const yms = R.sentiment.map(s => s[0])
  const prevYm = (ym: string) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 2, 1); return dayISO(d).slice(0, 7) }
  return yms.map(ym => ({
    ym, score: score[ym] ?? null, prev: score[prevYm(ym)] ?? null,
    pos: ev.filter(e => e.ym === ym && e.kind === 'pos'), neg: ev.filter(e => e.ym === ym && e.kind === 'neg'),
  })).sort((a, b) => b.ym.localeCompare(a.ym))
}
