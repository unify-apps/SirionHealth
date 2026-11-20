/* Shared TransAmerica account facts, ported from legacy/src/screen-account.js (facts, areaInputs, areaDriver,
   coverage, inputsFlat, topInputs, evidenceFor, jrItems). Pure TS: no DOM, no React. Other tabs may import these. */
import {
  ACCOUNT, AREAS, DAY, daysBetween, money, RULES, TA_EVENTS, TA_RECORD, TODAY, taEpisode, taFlags,
} from '@/data/legacy'
import { summarise } from './activity/model'
import { evidence as stakeEvidence } from './stakeholders/model'
import { fmtFull as fmtDY, fmtMonth as ymLabel, fmtShort as fmtD, parseISO as isoDate } from '@/lib/dates'

/* ---------- formatting ---------- */
export { fmtShort as fmtD, fmtFull as fmtDY, fmtMonth as ymLabel, parseISO as isoDate } from '@/lib/dates'

/* ---------- areas ---------- */
export type AreaKey = 'commercial' | 'adoption' | 'support' | 'engagement' | 'sentiment' | 'renewalRisk'
export const AREA_KEYS = (AREAS as [AreaKey, string][]).map(a => a[0])
export const AREA_NAME = Object.fromEntries(AREAS as [AreaKey, string][]) as Record<AreaKey, string>
export const AREA_SHORT: Record<AreaKey, string> = {
  commercial: 'Commercial', adoption: 'Adoption', support: 'Support',
  engagement: 'Engagement', sentiment: 'Sentiment', renewalRisk: 'Renewal risk',
}
/** Sentiment is scored by AI from emails; every other area by rules from source data. */
export const AREA_SOURCE: Record<AreaKey, 'ai' | 'rule'> = {
  commercial: 'rule', adoption: 'rule', support: 'rule', engagement: 'rule', sentiment: 'ai', renewalRisk: 'rule',
}

/** One scored input. `score` is null when the source sent no value (stored as -1): it reads "No data". */
export type Input = { area: AreaKey; name: string; field: string; score: number | null; note: string }

export function areaInputs(key: AreaKey): Input[] {
  const rows = ((TA_RECORD.kpis as unknown as Record<string, [string, string, number, string][]>)[key]) || []
  return rows.map(([name, field, v, note]) => ({ area: key, name, field, score: v < 0 ? null : v, note }))
}
/** The lowest-scoring input with data: what pulls the area down. */
export function areaDriver(key: AreaKey): Input | null {
  return areaInputs(key).filter(i => i.score != null).sort((a, b) => a.score! - b.score!)[0] ?? null
}
/** The highest-scoring input with data: what holds the area up. */
export function areaHolder(key: AreaKey): Input | null {
  return areaInputs(key).filter(i => i.score != null).sort((a, b) => b.score! - a.score!)[0] ?? null
}
/** [inputs with data, all inputs] */
export function areaCoverage(key: AreaKey): [number, number] {
  const ins = areaInputs(key)
  return [ins.filter(i => i.score != null).length, ins.length]
}
/** Every input with data, once (an input shared by two areas counts for the first). */
export function inputsFlat(): Input[] {
  const seen = new Set<string>()
  return AREA_KEYS.flatMap(areaInputs).filter(i => i.score != null && !seen.has(i.field) && !!seen.add(i.field))
}
/** dir 1 = strongest first, -1 = weakest first; one per area, three at most. */
export function topInputs(dir: 1 | -1): Input[] {
  const used = new Set<AreaKey>()
  return inputsFlat().sort((a, b) => dir * (b.score! - a.score!)).filter(x => !used.has(x.area) && !!used.add(x.area)).slice(0, 3)
}

/* ---------- monthly history ---------- */
export type Month = {
  ym: string; date: Date; final: number; areas: Record<AreaKey, number>
  model: boolean; early: boolean; lowAreas: AreaKey[]; drop: number
}
export const months: Month[] = taFlags() as Month[]
export const latest = months[months.length - 1]
export const previous = months[months.length - 2]
export const areaDelta = (k: AreaKey) => latest.areas[k] - previous.areas[k]
export const areaSeries = (k: AreaKey) => months.map(m => ({ ym: m.ym, label: ymLabel(m.ym), value: m.areas[k] }))

/* ---------- score ---------- */
export const score = {
  final: TA_RECORD.finalHealth as number,
  weighted: TA_RECORD.weightedHealth as number,
  cap: (TA_RECORD.weightedHealth - TA_RECORD.finalHealth) as number,
  overrideReason: TA_RECORD.overrideReason as string,
  overrideCode: TA_RECORD.overrideCode as string,
  snapshot: isoDate(TA_RECORD.snapshot),
  scoredOn: isoDate(TA_RECORD.scoredOn),
  /** Days to renewal at the snapshot, as the record states it. */
  snapshotDays: +(/(\d+) days/.exec(TA_RECORD.overrideReason)?.[1] ?? 0),
}
export const SCORED_LINE = `Scored ${fmtDY(score.scoredOn)} from the ${fmtD(score.snapshot)} snapshot`
export const RULE_TEXT = RULES as Record<'model' | 'early', { label: string; text: string }>

/* ---------- renewal ---------- */
export const RENEWAL = isoDate(TA_RECORD.renewal)
const ep = taEpisode('model') as (Month & { cleared: Month[] }) | null
export const renewal = {
  date: RENEWAL,
  daysLeft: daysBetween(TODAY, RENEWAL) as number,
  carr: TA_RECORD.carr / 1000,
  carrLabel: money(TA_RECORD.carr / 1000) as string,
  autoRenew: TA_RECORD.autoRenew as boolean,
  signed: TA_RECORD.signedCommitment as boolean,
  tfc: TA_RECORD.tfc as boolean,
  expansionLabel: money(TA_RECORD.expansion / 1000) as string,
  orderForms: ACCOUNT.facts.orderForms as { id: string; value: number }[],
  /** the last 90 days before the renewal */
  windowStart: new Date(RENEWAL.getTime() - 90 * DAY),
}
/** The current flagged run (model rule: under 70), from its first flagged month to the renewal. */
export const runway = ep ? {
  firstFlag: ep.date, firstFlagValue: ep.final, cleared: ep.cleared,
  used: daysBetween(ep.date, TODAY) as number,
  left: renewal.daysLeft,
  total: daysBetween(ep.date, RENEWAL) as number,
} : null

/* ---------- evidence: every sentence of the monthly summaries (AI) ---------- */
export type Evidence = {
  ym: string; kind: 'pos' | 'neg'; text: string; date: Date | null; tickets: string[]; who: string[]; strong: boolean
}
export const evidence = (): Evidence[] => stakeEvidence()
export const strongThisMonth = () => evidence().filter(e => e.ym === latest.ym && e.strong)

/** Negative statements relevant to one area, strongest and newest first. */
export function areaEvidence(key: AreaKey): Evidence[] {
  const pick: Record<AreaKey, (e: Evidence) => boolean> = {
    sentiment: () => true,
    engagement: e => /handed over|MBR|executive|champion|declined|no longer|out of office|touchbase|weekly calls/i.test(e.text),
    support: e => e.tickets.length > 0 || /RCA|integration|API|fix/i.test(e.text),
    adoption: e => /dashboard|PowerBI|adoption|intake|Action Module|workflow|repository|errors/i.test(e.text),
    commercial: e => /renewal|threatened|Auto-Redlining|estimate/i.test(e.text),
    renewalRisk: e => /renewal|threatened/i.test(e.text),
  }
  return evidence().filter(e => e.kind === 'neg' && pick[key](e))
    .sort((a, b) => (+b.strong - +a.strong) || b.ym.localeCompare(a.ym))
}

/* ---------- key events ---------- */
export type EventKind = 'pos' | 'neg' | 'neu' | 'flag' | 'goal' | 'end'
export type KeyEvent = { iso: string; date: Date; kind: EventKind; text: string; source: string; ai: boolean }
export const events: KeyEvent[] = (TA_EVENTS as [string, EventKind, string, string][]).map(([iso, kind, text, source]) => ({
  iso, date: isoDate(iso), kind, text, source, ai: /sentiment|AI insight/.test(source),
}))
/** Plain-words source label: "sentiment Oct 2026" -> "Monthly summary, Oct 2026". */
export const sourceLabel = (s: string) => { s = s.replace(/^sentiment /, 'Monthly summary, ').replace(/^AHI record/, 'Health record'); return s[0].toUpperCase() + s.slice(1) }
/** Summary statements within two days of an event: the evidence behind it. */
export const eventEvidence = (e: KeyEvent) =>
  evidence().filter(v => v.ym === e.iso.slice(0, 7) && v.date && Math.abs(+v.date - +e.date) < 2 * DAY)
export const EVENT_LABEL: Record<EventKind, string> = {
  neg: 'Risk event', pos: 'Positive event', neu: 'Engagement', flag: 'Health flag', goal: 'Target', end: 'Renewal',
}

/* ---------- activity: key events plus every dated summary statement ---------- */
export type Channel = 'meeting' | 'email' | 'ticket' | 'record' | 'file' | 'ai' | 'teams' | 'call' | 'note'
export type ActivityItem = {
  id: string; date: Date; kind: EventKind; key: boolean; title: string; desc: string; source: string
  channel: Channel; who: string[]; tickets: string[]
}
/** Same rules as jrChannel in activity/model.ts: a role change is a note, and a statement with ticket IDs is a ticket. */
export function channelOf(text: string, src: string, tickets: string[] = []): Channel {
  if (/AHI record/.test(src)) return 'record'
  if (/order forms/.test(src)) return 'file'
  if (/AI insight/.test(src)) return 'ai'
  if (/handed over|hand(ed)? (her|his|their) role|left (the|her|his|their) role|stepped down|no longer (in|with|at)\b/i.test(text)) return 'note'
  if (/Last email/.test(text)) return 'email'
  if (/Last meeting/.test(text)) return 'meeting'
  if (/\b(on|via|in a) (MS )?Teams\b|Teams (message|chat)/i.test(text)) return 'teams'
  if (/\b(after|on|during) a call\b|\bcall with\b|\bphone\b/i.test(text)) return 'call'
  if (tickets.length || /INC-|SR-|#|ticket|RCA|Jira/i.test(text)) return 'ticket'
  if (/meeting|MBR|business review|call|QBR|check-in|session|demo|workshop/i.test(text)) return 'meeting'
  if (/email|replied|thread|wrote|forward|asked|sent|notice/i.test(text)) return 'email'
  return 'note'
}
function statementTitle(e: Evidence) {
  if (e.tickets.length) return `Ticket ${e.tickets[0]}`
  if (/MBR|business review/i.test(e.text)) return 'Monthly business review'
  // same one-line summary the Activity tab uses, so an event reads the same everywhere
  return summarise(e.text, 70) || 'Account update'
}
export function activityItems(): ActivityItem[] {
  const ev = evidence().filter(v => v.date), used = new Set<Evidence>()
  const items: ActivityItem[] = events.map(e => {
    const match = /^sentiment/.test(e.source)
      ? ev.find(v => !used.has(v) && v.kind === e.kind && Math.abs(+v.date! - +e.date) <= 2 * DAY) : undefined
    if (match) used.add(match)
    return {
      id: 'k' + e.iso + e.text.slice(0, 12), date: e.date, kind: e.kind, key: true, title: e.text,
      desc: match ? match.text : sourceLabel(e.source) + '.', source: sourceLabel(e.source),
      channel: channelOf(match ? match.text : e.text, e.source, match?.tickets), who: match?.who ?? [], tickets: match?.tickets ?? [],
    }
  })
  ev.filter(v => !used.has(v)).forEach(v => items.push({
    id: 's' + v.date!.toISOString() + v.text.slice(0, 12), date: v.date!, kind: v.kind, key: false, title: statementTitle(v),
    desc: v.text, source: 'Monthly summary, ' + ymLabel(v.ym), channel: channelOf(v.text, '', v.tickets), who: v.who, tickets: v.tickets,
  }))
  return items
}

/* ---------- KPI strip (renderAccount) ---------- */
const [mauNow, mauAvg] = ACCOUNT.facts.mau as [number, number]
export const kpis = {
  nrr: TA_RECORD.nrr as number, grr: TA_RECORD.grr as number,
  mau: mauNow, mauAvg, mauChange: Math.round((mauNow / mauAvg - 1) * 100),
  licence: ACCOUNT.facts.licence as { pct: number; used: number; bought: number },
  emails: TA_RECORD.emailsThisMonth as number,
  openJira: TA_RECORD.openJira as number, perAging: TA_RECORD.perAging as number,
  approvalCycles: TA_RECORD.approvalCycles as [number, number],
}

export { TODAY }

/** The account this page shows: TransAmerica, or a mock pack (data/mock-accounts.js). `copy` is null for TransAmerica,
 *  whose prose lives in the screen modules; a mock pack brings its own. */
export type AccountCopy = {
  keyCopy: Record<string, [string, string]>; insight: string
  brief: [string, string][]; well: [string, string, string, AreaKey][]; attn: [string, string, string, AreaKey][]
  refs: Record<string, { kind: 'person'; email: string } | { kind: 'ev'; match: string }>
  cause: Partial<Record<AreaKey, string>>
}
export type Account = {
  id: string; name: string; ind: string; seg: string; region: string; stage: string
  sponsorEmail: string | null; sponsorNote: string
  facts: {
    licence: { pct: number; used: number; bought: number }; mau: [number, number]; onboarding: number
    contracts: [number, number]; approvals: [number, number]; sla: number; reopen: number
    orderForms: { id: string; value: number }[]; repository: [number, number]; priority: [number, number, number, number]
    themeCount: number; ticketsThisMonth: number; tickets: string; exec: string
  }
  copy: AccountCopy | null
}
export const ACCT = ACCOUNT as unknown as Account
/** Renewal already passed (the contract is running unsigned). */
export const overdue = () => renewal.daysLeft < 0
