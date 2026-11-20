/* Summary copy (BRIEF, WELL, ATTN, SUM_REFS, renderCLM), rewritten so each fact appears once on the page:
   the header owns the score, the cap, the renewal date/CARR/days and the KPI numbers; the brief owns what is next;
   the lists own the evidence behind strengths and risks; the order-form block owns the paper. */
import { TA_RECORD } from '@/data/legacy'
import { kpis, renewal, score, type AreaKey } from '../facts'

export type Ref =
  | { kind: 'rec'; label: string; text: string; ai?: boolean }
  | { kind: 'ev'; match: string }
  | { kind: 'person'; email: string }

export const SUM_REFS: Record<string, Ref> = {
  cap: { kind: 'rec', label: 'Scored health record, Oct 31 snapshot', text: `Final health ${score.final}, weighted ${score.weighted}. The renewal cap holds it down: the contract renews in ${score.snapshotDays} days and auto-renew is off, so health cannot go above ${score.final}.` },
  renew: { kind: 'rec', label: 'Order forms and health record', text: `Renewal Dec 30, 2026 for ${renewal.carrLabel} CARR (CU0213 OF 001 $275K, OF 002 $55K). Auto-renew: No. Signed commitment: No.` },
  adopt: { kind: 'rec', label: 'Scored health record, adoption inputs', text: `Licence use ${kpis.licence.pct}% (${kpis.licence.used} of ${kpis.licence.bought} seats). Monthly active users ${kpis.mau} (12-month average ${kpis.mauAvg}). Onboarding 97%.` },
  approvals: { kind: 'rec', label: 'Scored health record, active workflows', text: `Approval cycles closed ${kpis.approvalCycles[1]} this period (12-month average ${kpis.approvalCycles[0]}). Contracts processed 155 (12-month average 171).` },
  insight: { kind: 'rec', ai: true, label: 'Strategic insight from the live app (AI)', text: '“Within 7 days, engage contact stakeholders to secure signed renewal commitment for the $330,000 CARR prior to the Dec 30, 2026 renewal date (42 days remaining).”' },
  comm: { kind: 'rec', label: 'Scored health record, commercial inputs', text: `NRR ${TA_RECORD.nrr}%, GRR ${TA_RECORD.grr}%. Open invoices: no overdue invoices (input score 100).` },
  sup: { kind: 'rec', label: 'Scored health record, support inputs', text: 'Ticket reopen rate: 0 reopened (input score 100). Tickets by priority: P1 0, P2 7, P3 29, P4 90.' },
  exec: { kind: 'rec', label: 'Scored health record, engagement inputs', text: 'Executive sponsor engagement 0 this month (12-month average 11). CSM touchpoints 5 (12-month average 199).' },
  per: { kind: 'rec', label: 'Scored health record, support inputs', text: `Open Jira enhancement requests ${kpis.openJira}, average age ${kpis.perAging} days (12-month average 434).` },
  handover: { kind: 'ev', match: 'handed over her role' },
  threat: { kind: 'ev', match: 'threatened renewal' },
  nick: { kind: 'person', email: 'nick.cavazos@transamerica.com' },
}

/** [heading, text with {ref} markers]. AI-written. */
export const BRIEF: [string, string][] = [
  ['Where we stand', 'Usage and commercials are sound. The unsigned renewal and a thinner relationship hold the score down {cap}.'],
  ['Next', 'Get a signed renewal commitment by Nov 26 {insight}. Nick Cavazos is the likely new owner {nick}.'],
  ['At stake', 'Leadership threatened the renewal on Aug 28 {threat}. The champion has since handed over {handover}.'],
]

/** [heading, text, metric, area] */
export type ListItem = [string, string, string, AreaKey]
export const WELL: ListItem[] = [
  ['Usage is above its 12-month average', 'More seats are in use than were bought, and 97% of users have completed onboarding {adopt}.', '97% onboarded', 'adoption'],
  ['Commercials are clean', 'No invoice is overdue and nothing has contracted {comm}.', '0 overdue', 'commercial'],
  ['Support quality holds', 'No ticket has been reopened and there are no P1 incidents {sup}.', '0 reopened', 'support'],
]
export const ATTN: ListItem[] = [
  ['No executive contact this month', 'Executive sponsor engagement is 0 against a 12-month average of 11, and CSM touchpoints fell to 5 against 199 {exec}.', '0 exec contacts', 'engagement'],
  ['Workflows have stalled', 'Approval cycles closed fell from 12 to 0, and 155 contracts were processed against an average of 171 {approvals}.', '0 cycles', 'adoption'],
  ['Enhancement requests are aging', `${kpis.openJira} open Jira enhancement requests have waited ${kpis.perAging} days on average {per}.`, `${kpis.perAging} days`, 'support'],
]

/** renderCLM rows: [label, value, detail, opens area, status] */
export const CLM: [string, string, string, AreaKey | null, 'good' | 'bad' | null][] = [
  ['Renewal paper', `${renewal.orderForms.length} order forms`, renewal.orderForms.map(o => `${o.id.replace('CU0213 ', '')} $${o.value}K`).join(' · '), null, null],
  ['Commitment', renewal.signed ? 'Signed' : 'Not signed', renewal.signed ? 'Signature on file' : 'No signature on file', 'commercial', renewal.signed ? 'good' : 'bad'],
  ['Termination for convenience', renewal.tfc ? 'Clause included' : 'No clause', '', null, null],
]

/** Numbers each source once, in order of first use in the brief (the lists show no paragraphs). */
export const REF_ORDER: string[] = (() => {
  const order: string[] = []
  BRIEF.map(b => b[1]).forEach(t =>
    t.replace(/\{(\w+)\}/g, (_, k) => { if (!order.includes(k)) order.push(k); return '' }))
  return order
})()
