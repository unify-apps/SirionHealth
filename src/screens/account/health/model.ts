/* Health model for TransAmerica: the six areas, their 21 inputs and 18 months of area scores.
   Ported from legacy/src/screen-account.js (areaInputs, areaDriver, coverage, bandRun, facts, evidenceFor). */
import { AREAS, TA_REAL, TA_RECORD, taEvidence } from '@/data/legacy'
import { BAND_LABEL, bandOf, isMissing } from '@/components/health'

export type AreaKey = 'commercial' | 'adoption' | 'support' | 'engagement' | 'sentiment' | 'renewalRisk'

/** One scored input. score is null when the source sent no value (-1 in AHI). */
export type Input = { area: AreaKey; areaName: string; name: string; field: string; score: number | null; reason: string }

export type Month = { ym: string; label: string; short: string; final: number; areas: Record<AreaKey, number> }

export type Area = {
  key: AreaKey; name: string; shortName: string; ai: boolean
  score: number; delta: number; series: number[]
  inputs: Input[]; scored: Input[]; missing: Input[]
  weakest: Input | null; strongest: Input | null
  band: { label: string; run: number; all: boolean }
}

export const ymLabel = (ym: string) =>
  new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
const ymShort = (ym: string) =>
  new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'short' }) + ' ' + ym.slice(2, 4)

export const shortArea = (name: string) => name.replace(' and enhancement requests', '')

export function months(): Month[] {
  const f = TA_REAL.monthlyFields as string[]
  const rows = TA_REAL.monthly as (string | number)[][]
  if (!rows?.length) throw new Error('No monthly scored records')
  return rows.map(r => {
    const areas = {} as Record<AreaKey, number>
    f.slice(2).forEach((k, i) => { areas[k as AreaKey] = r[i + 2] as number })
    const ym = r[0] as string
    return { ym, label: ymLabel(ym), short: ymShort(ym), final: r[1] as number, areas }
  })
}

export function areaInputs(key: AreaKey): Input[] {
  const name = (AREAS as string[][]).find(a => a[0] === key)?.[1] ?? key
  const raw = ((TA_RECORD.kpis as Record<string, (string | number)[][]>)[key] ?? [])
  return raw.map(i => ({
    area: key, areaName: name, name: i[0] as string, field: i[1] as string,
    score: isMissing(i[2] as number) ? null : (i[2] as number), reason: i[3] as string,
  }))
}

/** Missing inputs never count: they are left out of the weakest/strongest drivers. */
const byScore = (a: Input, b: Input) => (a.score as number) - (b.score as number)

/** How long the area has sat in its current band, counting back from the latest month. */
export function bandRun(series: number[]) {
  const b = bandOf(series[series.length - 1])
  let n = 0
  for (let i = series.length - 1; i >= 0 && bandOf(series[i]) === b; i--) n++
  return { label: BAND_LABEL[b], run: n, all: n === series.length }
}

export function buildAreas(ms: Month[]): Area[] {
  const last = ms[ms.length - 1], prev = ms[ms.length - 2]
  return (AREAS as string[][]).map(([k, name]) => {
    const key = k as AreaKey
    const inputs = areaInputs(key)
    const scored = inputs.filter(i => i.score != null).sort(byScore)
    const series = ms.map(m => m.areas[key])
    const strongest = scored.length ? scored[scored.length - 1] : null
    return {
      key, name, shortName: shortArea(name), ai: key === 'sentiment',
      score: last.areas[key], delta: prev ? last.areas[key] - prev.areas[key] : 0, series,
      inputs, scored, missing: inputs.filter(i => i.score == null),
      weakest: scored[0] ?? null, strongest: strongest && strongest !== scored[0] ? strongest : null,
      band: bandRun(series),
    }
  })
}

/** Every input once per area: 21 for TransAmerica. Weakest first, inputs with no data last. */
export function allInputs(areas: Area[]): Input[] {
  return areas.flatMap(a => a.inputs).sort((a, b) =>
    (a.score == null ? 1 : 0) - (b.score == null ? 1 : 0) || (a.score ?? 0) - (b.score ?? 0))
}

export type HealthData = { months: Month[]; areas: Area[]; inputs: Input[] }

export function loadHealth(): HealthData {
  const ms = months()
  const areas = buildAreas(ms)
  return { months: ms, areas, inputs: allInputs(areas) }
}

/* ---- sentiment explainability: the strong negatives the AI read (not the dropped Evidences section) ---- */
export type Statement = { ym: string; text: string; date: Date | null; who: string[]; tickets: string[] }

export function strongNegatives(): Statement[] {
  return (taEvidence() as (Statement & { kind: string; strong: boolean })[])
    .filter(e => e.kind === 'neg' && e.strong)
    .sort((a, b) => b.ym.localeCompare(a.ym) || (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
}

export const CAP = {
  code: TA_RECORD.overrideCode as string, reason: TA_RECORD.overrideReason as string,
  weighted: TA_RECORD.weightedHealth as number, final: TA_RECORD.finalHealth as number,
  snapshot: TA_RECORD.snapshot as string, scoredOn: TA_RECORD.scoredOn as string,
}
