/* People model for TransAmerica: who is who, their role tags, how recently Sirion's monthly summaries named them,
   and the tone of what was said. Ported from legacy screen-account.js (stakeRows, orbitPeople, lastNamed…). */
import { daysBetween, monthEnd, TA_NEWS_PEOPLE, taEvidence, taMonths, taPeople, taPeopleIndex, TODAY } from '@/data/legacy'
import { fmtDY } from '../activity/shared'
import type { RoleState } from './store'

export interface Evidence { ym: string; kind: 'pos' | 'neg'; text: string; date: Date | null; tickets: string[]; who: string[]; strong: boolean }
export interface Person {
  email: string; name: string; title: string; org: string; sources: string[]; mentions: number; lastMentioned: string | null
  tagged: string | null; suggested: string | null; basis: string | null; confidence: string | null; customer: boolean; cards: number
}
export interface NewsPerson { name: string; title: string; org: string; suggested: string; basis: string; source: string }

export const ROLE_OPTS = ['Executive Sponsor', 'Champion', 'Decision Maker', 'Influencer', 'Technical Owner', 'IT and Security Contact',
  'System Administrator', 'Key User', 'Procurement', 'Legal', 'Former Champion', 'Left the Role'] as const

/** Role names read as titles everywhere ("Key User", "IT and Security Contact"), whatever casing the source or a saved choice used. */
const SMALL = new Set(['and', 'or', 'of', 'the', 'to', 'in', 'for'])
export const roleCase = (s: string | null | undefined) => !s ? '' : s.split(/(\s+|\/)/).map((w, i) =>
  /^(it|cxo|vp|cio|cfo|ceo|cto|hr)$/i.test(w) ? w.toUpperCase() : i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)).join('')

/** Summary statements are written by AI with long month names ("on October 21"); show them in the app's one format ("on Oct 21"). */
const LONG_DATE = /\b(January|February|March|April|June|July|August|September|October|November|December) (?=\d{1,2}\b)/g
let evCache: { src: unknown; out: Evidence[] } | null = null
export const evidence = (): Evidence[] => {
  const src = taEvidence()
  if (evCache?.src !== src) evCache = { src, out: (src as unknown as Evidence[]).map(e => ({ ...e, text: e.text.replace(LONG_DATE, m => m.slice(0, 3) + ' ')})) }
  return evCache.out
}
export const people = () => taPeople() as unknown as Person[]
const newsCache = (TA_NEWS_PEOPLE as unknown as NewsPerson[]).map(n => ({ ...n, basis: n.basis.replace(/AHI's contacts/g, "the account's contacts") }))
export const newsPeople = () => newsCache
export const peopleIndex = () => taPeopleIndex() as Record<string, string>
export const MONTHS_18 = () => (taMonths() as { ym: string }[]).map(m => m.ym)

export const isGone = (r: string | null | undefined) => /Former|Left/.test(r || '')
export function seniority(t: string | null | undefined) {
  t = t || ''
  return /chief|cxo|ceo|cfo|coo|evp|president/i.test(t) ? 'C-suite' : /\bvp\b|vice president|head of/i.test(t) ? 'VP / Head'
    : /director/i.test(t) ? 'Director' : /manager|lead/i.test(t) ? 'Manager' : t ? 'Individual contributor' : ''
}
export type Persona = 'sponsor' | 'champion' | 'tech' | 'former' | 'user'
export function persona(r: string): Persona {
  return /Sponsor/i.test(r) ? 'sponsor' : /Champion/i.test(r) && !/Former/i.test(r) ? 'champion' : /Technical|IT|security|admin/i.test(r) ? 'tech' : /Former|Left/i.test(r) ? 'former' : 'user'
}
export const shortRole = (s: string) => /likely new champion/i.test(s) ? 'Champion' : s.split(',')[0]

/** When Sirion's monthly summaries last named this person (the statement date, else the month end). */
export function lastNamed(name: string, ev: Evidence[]) {
  const ds = ev.filter(e => e.who.includes(name)).map(e => +(e.date || monthEnd(e.ym)))
  return ds.length ? new Date(Math.max(...ds)) : null
}

export type Kind = 'tagged' | 'suggested' | 'departed' | 'other'
export type Engagement = 'active' | 'warm' | 'quiet' | 'none'
export type Tone = 'pos' | 'neg' | 'mix' | 'none'
export type GapLevel = 'ok' | 'warn' | 'info' | 'none'

export interface StakeRow {
  key: string; name: string; title: string; org: string; email: string | null; sources: string[]
  kind: Kind; label: string; source: 'mine' | 'tagged' | 'confirmed' | 'inferred' | 'news' | 'none'
  aiRole: string | null; basis: string | null; confidence: string | null
  eng: Engagement; tone: Tone; pos: number; neg: number; months: number[]; mentions: number
  gap: [GapLevel, string]; days: number | null; last: Date | null; sen: string; news: NewsPerson | null
}

export const ENG_LABEL: Record<Engagement, string> = { active: 'Active', warm: 'Warm', quiet: 'Quiet', none: 'No data' }
export const TONE_LABEL: Record<Tone, string> = { pos: 'Positive', neg: 'Negative', mix: 'Mixed', none: 'No data' }
export const KIND_LABEL: Record<Kind, string> = { tagged: 'Tagged', suggested: 'Suggested', departed: 'Departed', other: 'No role' }

const SPONSOR_EMAIL = 'lawrence.kane@transamerica.com'

export interface Base { people: Person[]; ev: Evidence[]; months: string[]; news: NewsPerson[]; idx: Record<string, string> }
export const loadBase = (): Base => ({ people: people(), ev: evidence(), months: MONTHS_18(), news: newsPeople(), idx: peopleIndex() })

/** Every customer contact (plus people found in public news), with role, engagement, tone and the gap to act on. */
export function stakeRows(b: Base, st: RoleState): StakeRow[] {
  const rows: StakeRow[] = b.people.filter(p => p.customer).map(p => {
    const gone = isGone(p.suggested), conf = !!st.confirmed[p.email], last = lastNamed(p.name, b.ev), days = last ? daysBetween(last, TODAY) : null
    const mine = st.roles[p.email]
    const kind: Kind = mine ? (isGone(mine) ? 'departed' : 'tagged') : p.tagged ? (isGone(p.tagged) ? 'departed' : 'tagged') : gone ? 'departed' : p.suggested ? 'suggested' : 'other'
    const label = mine || (p.tagged ? p.tagged.replace(' / CXO', '') : gone ? p.suggested! : p.suggested ? shortRole(p.suggested) : '')
    const source: StakeRow['source'] = mine ? 'mine' : p.tagged ? 'tagged' : p.suggested ? (gone || conf ? 'confirmed' : 'inferred') : 'none'
    const eng: Engagement = days == null ? 'none' : days <= 30 ? 'active' : days <= 90 ? 'warm' : 'quiet'
    const said = b.ev.filter(e => e.who.includes(p.name)), pos = said.filter(e => e.kind === 'pos').length, neg = said.length - pos
    const tone: Tone = !said.length ? 'none' : pos && !neg ? 'pos' : neg && !pos ? 'neg' : 'mix'
    const months = b.months.map(ym => said.filter(e => e.ym === ym).length)
    const tagLabel = roleCase((p.tagged || '').replace(' / CXO', ''))
    const gap: [GapLevel, string] = p.email === SPONSOR_EMAIL ? ['warn', `Executive Sponsor last named ${last ? fmtDY(last) : 'never'}; no executive contact this month (12-month average 11)`]
      : p.tagged && !isGone(p.tagged) && (days == null || days > 90) ? ['warn', `Tagged ${tagLabel} but ${days == null ? 'never named in a summary' : 'not named since ' + fmtDY(last!)}`]
      : gone || (p.tagged && isGone(p.tagged)) ? ['warn', 'Left the role: hand over the relationship']
      : p.suggested && !conf && !mine ? ['info', `Suggested from ${p.mentions} summar${p.mentions === 1 ? 'y' : 'ies'}; confirm the role`]
      : days != null && days <= 30 ? ['ok', `Active: named ${said.filter(e => e.ym >= '2026-08').length} times in the last 3 months`]
      : p.mentions ? ['info', `Named in ${p.mentions} summar${p.mentions === 1 ? 'y' : 'ies'}`] : ['none', 'Contact card only']
    return {
      key: p.email, name: p.name, title: p.title, org: p.org, email: p.email, sources: p.sources, kind, label: roleCase(label), source,
      aiRole: p.suggested && !p.tagged && !gone ? roleCase(shortRole(p.suggested)) : null, basis: p.basis, confidence: p.confidence,
      eng, tone, pos, neg, months, mentions: p.mentions, gap, days, last, sen: seniority(p.title), news: null,
    }
  })
  b.news.forEach(n => {
    const key = 'news:' + n.name, mine = st.roles[key], conf = !!st.confirmed[key]
    rows.push({
      key, name: n.name, title: n.title, org: n.org, email: null, sources: [], kind: mine ? (isGone(mine) ? 'departed' : 'tagged') : 'suggested',
      label: roleCase(mine || n.suggested), source: mine ? 'mine' : conf ? 'confirmed' : 'news', aiRole: roleCase(n.suggested), basis: n.basis, confidence: null,
      eng: 'none', tone: 'none', pos: 0, neg: 0, months: b.months.map(() => 0), mentions: 0,
      gap: ['warn', `From public news (${n.source}); not in the account's contacts yet`], days: null, last: null, sen: seniority(n.title), news: n,
    })
  })
  return rows
}

export type SortKey = 'role' | 'recent' | 'mentions' | 'name'
const ORDER: Record<Kind, number> = { tagged: 0, suggested: 1, departed: 2, other: 3 }
export const SORTS: Record<SortKey, [string, (a: StakeRow, b: StakeRow) => number]> = {
  role: ['Role', (a, b) => ORDER[a.kind] - ORDER[b.kind] || b.mentions - a.mentions || a.name.localeCompare(b.name)],
  recent: ['Last named', (a, b) => (a.days ?? 1e9) - (b.days ?? 1e9)],
  mentions: ['Most named', (a, b) => b.mentions - a.mentions],
  name: ['Name', (a, b) => a.name.localeCompare(b.name)],
}

/* ---- relationship orbit: rings by how recently someone was named ---- */
export const RINGS = [['Last 30 days', 30], ['30 to 90 days', 90], ['Quiet over 90 days', Infinity]] as const
export type OrbitState = 'active' | 'quiet' | 'ai'
export interface OrbitPerson { key: string; name: string; role: string; state: OrbitState; ring: number; mentions: number; last: Date | null; tagged: boolean }
export function orbitPeople(rows: StakeRow[]): OrbitPerson[] {
  return rows.filter(r => r.label && (r.source === 'tagged' || r.source === 'mine' || r.kind === 'departed' || r.news || r.mentions >= 2 || (r.days != null && r.days <= 90)))
    .map(r => {
      const ring = r.days == null ? 2 : RINGS.findIndex(x => r.days! <= x[1])
      const state: OrbitState = r.source === 'news' ? 'ai' : r.kind === 'departed' || ring === 2 ? 'quiet' : r.source === 'inferred' ? 'ai' : 'active'
      const role = r.kind === 'departed' ? (/Former champion/.test(r.label) ? 'Champion, handed over' : r.label) : r.source === 'inferred' || r.source === 'news' ? `Suggested · ${r.label}` : r.label
      return { key: r.key, name: r.name, role, state, ring, mentions: r.mentions, last: r.last, tagged: r.source === 'tagged' }
    })
}

/* ---- non-customer people: Sirion, UnifyApps, partners and system senders ---- */
export interface InternalRow { key: string; name: string; email: string | null; org: string; group: 'Sirion' | 'UnifyApps' | 'Partner' | 'System sender' | 'Other'; sources: string[]; mentions: number }
export function internalRows(b: Base): InternalRow[] {
  const group = (org: string): InternalRow['group'] => /internal/.test(org) ? 'UnifyApps' : /partner/.test(org) ? 'Partner' : org === 'System sender' ? 'System sender' : 'Other'
  const rows: InternalRow[] = b.people.filter(p => !p.customer).map(p => ({
    key: p.email, name: p.name, email: p.email, org: p.org.replace(' (partner)', '').replace(' (internal)', ''), group: group(p.org), sources: p.sources, mentions: p.mentions,
  }))
  Object.entries(b.idx).filter(([, v]) => v === 'sirion').forEach(([name]) => rows.push({
    key: 'sirion:' + name, name, email: null, org: 'Sirion', group: 'Sirion', sources: ['Monthly summaries'], mentions: b.ev.filter(e => e.who.includes(name)).length,
  }))
  const order = { Sirion: 0, UnifyApps: 1, Partner: 2, Other: 3, 'System sender': 4 }
  return rows.sort((a, b) => order[a.group] - order[b.group] || b.mentions - a.mentions || a.name.localeCompare(b.name))
}

export function toCsv(rows: StakeRow[]) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [['Name', 'Seniority', 'Title', 'Persona', 'Role source', 'Engagement', 'Tone', 'Mentions', 'Last named', 'Email'].join(',')]
    .concat(rows.map(r => [r.name, r.sen, r.title, r.label, r.source, ENG_LABEL[r.eng], TONE_LABEL[r.tone], r.mentions, r.last ? fmtDY(r.last) : '', r.email ?? ''].map(q).join(',')))
    .join('\n')
}
export function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
