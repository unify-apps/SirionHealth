/* Adoption and support facts for TransAmerica. Ported from legacy renderAccount (T.adopt, T.support,
   entity split, ticket priority split, T.themes) and trendChart (TA_REAL.monthly). */
import { T } from '@/data/legacy'
import { months, type Month } from '../health/model'

export type StatRow = { label: string; value: string; hint: string }
export type Part = { key: string; label: string; value: number }

const stats = (rows: string[][] | undefined, what: string): StatRow[] => {
  if (!rows?.length) throw new Error(`No ${what} figures in the source`)
  return rows.map(r => ({ label: r[0], value: r[1], hint: r[2] ?? '' }))
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
    adopt: stats(t.adopt, 'adoption'),
    // repository records by entity type (legacy #entity split)
    repository: [
      { key: 'contracts', label: 'Contracts', value: 3461 },
      { key: 'requests', label: 'Contract requests', value: 2553 },
    ],
    support: stats(t.support, 'support'),
    // lifetime tickets by priority (legacy #impact split); P1 is zero
    priority: [
      { key: 'p1', label: 'P1', value: 0 },
      { key: 'p2', label: 'P2', value: 7 },
      { key: 'p3', label: 'P3', value: 29 },
      { key: 'p4', label: 'P4', value: 90 },
    ],
    themes: (t.themes ?? []).map(([name, tickets]) => ({ name, tickets })),
    themeCount: 16,
  }
}
