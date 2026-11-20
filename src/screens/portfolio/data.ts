import { P, ROWS, rel } from '@/data/legacy'
import type { Band } from '@/components/health'

/* Portfolio facts, read from today's AHI portfolio view (Nov 19, 2026). */

export const BOOK = { arr: 103.6, accounts: 260, asOf: 'Nov 19, 2026' }

export const BANDS: { band: Exclude<Band, 'none'>; arr: number; label: string; range: string }[] = [
  { band: 'good', arr: 33.3, label: 'Healthy', range: '70+' },
  { band: 'warn', arr: 65.2, label: 'Watch', range: '40 to 69' },
  { band: 'bad', arr: 5.1, label: 'At risk', range: 'under 40' },
]

export const KPIS = {
  avgHealth: 55,
  arrAtRisk: '$3.81M',
  arrAtRiskM: 3.81,
  renewing60: 16,
  grr100: 221,
  grrWithData: 237,
}

export type Pod = {
  name: string; region: string; accounts: number; carr: number; health: number | null
  atRisk: number; carrAtRisk: number; renewing: number; renewalAtRisk: number
}

const REGION: Record<string, string> = {
  'CS – NA': 'North America', 'CS – AMEA': 'AMEA', 'CS – Europe': 'Europe',
}

/** P.pods rows: [name, accounts, CARR $M, avg health, at-risk count, CARR at risk $M, renewing <60d, renewal ARR at risk $M] */
export const PODS: Pod[] = (P.pods as (string | number | null)[][]).map(p => ({
  name: p[0] as string,
  region: REGION[p[0] as string] ?? 'Global',
  accounts: p[1] as number,
  carr: p[2] as number,
  health: p[3] as number | null,
  atRisk: p[4] as number,
  carrAtRisk: p[5] as number,
  renewing: p[6] as number,
  renewalAtRisk: p[7] as number,
}))


export const STAGES: { stage: string; carr: number }[] = (P.stages as [string, number][]).map(([stage, carr]) => ({ stage, carr }))

/** GRR bands, worst first: accounts in each. */
export const GRR: { key: 'under90' | 'mid' | 'full'; label: string; accounts: number }[] = [
  { key: 'under90', label: 'Under 90%', accounts: (P.grr as [string, number][])[0][1] },
  { key: 'mid', label: '90 to 99%', accounts: (P.grr as [string, number][])[1][1] },
  { key: 'full', label: '100% or more', accounts: (P.grr as [string, number][])[2][1] },
]

/** $M with one decimal under 10, e.g. 1.4 -> "$1.4M", 0.4233 -> "$423K". */
export function moneyM(m: number) {
  if (!m) return '$0'
  if (m < 1) return `$${Math.round(m * 1000)}K`
  return `$${m.toFixed(m >= 10 ? 1 : 2).replace(/0$/, '').replace(/\.$/, '')}M`
}

export type Row = { name: string; ind: string; seg: string; stage: string; health: number; carr: number; renew: Date; grr: number | null }
export const rows = ROWS as Row[]
export const isLive = (r: Row) => !/Churn/.test(r.stage)
export const renewal = (r: Row) => rel(r.renew) as { t: string; c: string; days: number }
