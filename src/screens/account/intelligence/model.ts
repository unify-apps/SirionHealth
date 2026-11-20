/* Intelligence: AHI's own inputs, strongest and weakest, and what isn't scored; plus public news.
   Ported from legacy screen-account.js (inputsFlat, renderIntel, T.market). */
import { AREAS, T, TA_RECORD } from '@/data/legacy'

type Kpi = [string, string, number, string]
export interface Input { area: string; areaName: string; name: string; v: number; note: string }
export interface Unscored { area: string; areaName: string; name: string; note: string }
export interface NewsEvent { date: string | null; text: string }
export interface Theme { title: string; relevance: number | null; events: NewsEvent[]; why: string }

const areas = AREAS as unknown as [string, string][]
const kpis = (TA_RECORD as unknown as { kpis: Record<string, Kpi[]> }).kpis
const areaName = (k: string) => (areas.find(a => a[0] === k)?.[1] ?? k).replace(' and enhancement requests', '')

export function loadIntel() {
  const seen = new Set<string>(), inputs: Input[] = [], unscored: Unscored[] = []
  areas.forEach(([k]) => (kpis[k] ?? []).forEach(([name, id, v, note]) => {
    if (v < 0) { unscored.push({ area: k, areaName: areaName(k), name, note }); return }
    if (seen.has(id)) return
    seen.add(id); inputs.push({ area: k, areaName: areaName(k), name, v, note })
  }))
  const market = (T as unknown as { market: [string, number | null, string, string][] }).market
  const news: Theme[] = market.map(([title, relevance, text, why]) => ({
    title, relevance, why,
    events: text.split(/(?<=\.)\s+(?=[A-Z][a-z]{2} \d)/).filter(Boolean).map(e => {
      const m = e.match(/^([A-Z][a-z]{2} \d{1,2}):\s*(.*)$/)
      return m ? { date: `${m[1]}, 2026`, text: m[2] } : { date: null, text: e }
    }),
  }))
  return {
    strongest: [...inputs].sort((a, b) => b.v - a.v).slice(0, 4),
    weakest: [...inputs].sort((a, b) => a.v - b.v).slice(0, 4),
    unscored, news,
  }
}
export type IntelData = ReturnType<typeof loadIntel>
