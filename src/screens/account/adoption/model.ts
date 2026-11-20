/* Adoption and support facts for TransAmerica. Ported from legacy renderAccount (T.adopt, T.support,
   entity split, ticket priority split, T.themes) and trendChart (TA_REAL.monthly). */
import {
  BadgeCheck, CircleAlert, ClockCheck, FileText, GraduationCap, KeyRound, LifeBuoy, ListTodo, Megaphone, RotateCcw, Timer, Users, Workflow, type LucideIcon,
} from 'lucide-react'
import { ACCOUNT, T } from '@/data/legacy'
import { months, type Month } from '../health/model'
import type { Account } from '../facts'

export type StatRow = {
  label: string; value: string; hint: string
  icon?: LucideIcon
  /** draw a meter: value against max (over max shows a tick at max) */
  meter?: { value: number; max: number }
  /** change against a reference, neutral (these are usage figures, not health scores) */
  delta?: { value: number; label: string }
}

/** Icon, meter and delta per figure. Numbers come from the source rows and AHI's scored record (T.adopt, T.support, TA_RECORD.kpis). */
const F = (ACCOUNT as unknown as Account).facts
const DECOR: Record<string, Omit<StatRow, 'label' | 'value' | 'hint'>> = {
  'Monthly active users': { icon: Users, delta: { value: F.mau[0] - F.mau[1], label: `vs 12-mo avg ${F.mau[1].toLocaleString()}` } },
  'Licence use': { icon: KeyRound, meter: { value: F.licence.used, max: F.licence.bought } },
  'Onboarding': { icon: GraduationCap, meter: { value: F.onboarding, max: 100 } },
  'Contracts processed': { icon: FileText, delta: { value: F.contracts[0] - F.contracts[1], label: `vs 12-mo avg ${F.contracts[1].toLocaleString()}` } },
  'Approval cycles closed': { icon: Workflow, delta: { value: F.approvals[0] - F.approvals[1], label: `vs 12-mo avg ${F.approvals[1]}` } },
  'Time to go-live': { icon: Timer },
  'Tickets': { icon: LifeBuoy },
  'SLA met': { icon: ClockCheck, meter: { value: F.sla, max: 100 } },
  'P1 incidents': { icon: CircleAlert },
  'Exec escalations': { icon: Megaphone },
  'Reopen rate': { icon: RotateCcw, meter: { value: F.reopen, max: 100 } },
  'Open enhancement requests': { icon: ListTodo },
}
const decorate = (r: StatRow): StatRow => ({ ...r, ...(DECOR[r.label] ?? { icon: BadgeCheck }) })
export type Part = { key: string; label: string; value: number }

const stats = (rows: string[][] | undefined, what: string): StatRow[] => {
  if (!rows?.length) throw new Error(`No ${what} figures in the source`)
  return rows.map(r => decorate({ label: r[0], value: r[1], hint: r[2] ?? '' }))
}

export type AdoptionData = {
  months: Month[]
  adopt: StatRow[]
  repository: Part[]
  support: StatRow[]
  priority: Part[]
  themes: { name: string; tickets: number }[]
  themeCount: number
}

export function loadAdoption(): AdoptionData {
  const t = T as unknown as { adopt: string[][]; support: string[][]; themes: [string, number][] }
  return {
    months: months(),
    // monthly active users lead the grid (AHI's scored record: 222 this month, 12-mo avg 215); the source's peak moves to its hint
    adopt: stats(t.adopt, 'adoption').map(r => r.label === 'Peak monthly users'
      ? decorate({ label: 'Monthly active users', value: F.mau[0].toLocaleString(), hint: `Peak ${r.value} · ${r.hint}` }) : r),
    // repository records by entity type (legacy #entity split)
    repository: [
      { key: 'contracts', label: 'Contracts', value: F.repository[0] },
      { key: 'requests', label: 'Contract requests', value: F.repository[1] },
    ],
    support: stats(t.support, 'support').map(r => r.label === 'Tickets' ? { ...r, hint: `Lifetime · ${F.ticketsThisMonth} this month` } : r),
    // lifetime tickets by priority (legacy #impact split); P1 is zero
    priority: [
      { key: 'p1', label: 'P1', value: F.priority[0] },
      { key: 'p2', label: 'P2', value: F.priority[1] },
      { key: 'p3', label: 'P3', value: F.priority[2] },
      { key: 'p4', label: 'P4', value: F.priority[3] },
    ],
    themes: (t.themes ?? []).map(([name, tickets]) => ({ name, tickets })),
    themeCount: F.themeCount,
  }
}
