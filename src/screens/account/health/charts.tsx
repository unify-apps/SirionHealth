/* Score charts, from the shared kit. Series use --chart-1; green/amber/red stay on the numbers and pills, never on a series. */
import { ScoreTrend, Sparkline } from '@/components/charts'
import type { Month } from './model'

/** 18-month sparkline for an area card. The card text carries the numbers; hover gives first, last and range. */
export function Spark({ values, className }: { values: number[]; className?: string }) {
  const tip = values.length
    ? `${values.length} months: ${values[0]} → ${values[values.length - 1]} · low ${Math.min(...values)}, high ${Math.max(...values)}`
    : undefined
  return <Sparkline values={values} tip={tip} className={className} />
}

/** Monthly area score with the Watch (70) and At risk (40) thresholds. Hover or arrow-key a month for its value. */
export function TrendChart({ months, area, name, className }: {
  months: Month[]; area: keyof Month['areas']; name: string; className?: string
}) {
  const data = months.map(m => ({ tick: m.short, label: m.label, value: m.areas[area] }))
  return <ScoreTrend data={data} name={name} className={className} />
}
