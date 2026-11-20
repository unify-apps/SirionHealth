/* Score charts, from the shared kit. Series use --chart-1; green/amber/red stay on the numbers and pills, never on a series. */
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  ANIM_MS, AREA_FILL_OPACITY, activeDotProps, gridProps, ScoreTrend, SERIES, thresholdLine, xAxisProps, yAxisProps,
} from '@/components/charts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { isMissing } from '@/components/health'
import { cn } from '@/lib/utils'
import type { Month } from './model'

/** 18-month sparkline for an area card. Hover (or arrow keys) gives each month's value and band. */
export function Spark({ values, labels, name = 'Score', className }: { values: number[]; labels?: string[]; name?: string; className?: string }) {
  const data = values.map((value, i) => ({ tick: labels?.[i] ?? String(i + 1), label: labels?.[i] ?? `Month ${i + 1}`, value }))
  return <ScoreTrend data={data} name={name} compact thresholds={false} className={cn('h-10', className)} />
}

/** Runs of months with no value, e.g. [{ from: 'Jul 26', to: 'Oct 26', text: 'No data Jul–Oct' }]. Derived from the data, never hardcoded. */
export function dataGaps(points: { tick: string; label: string; value: number | null }[]) {
  const gaps: { from: string; to: string; text: string }[] = []
  let start = -1
  const close = (end: number) => {
    const a = points[start], b = points[end]
    const mon = (l: string) => l.split(' ')[0], yr = (l: string) => l.split(' ')[1]
    gaps.push({ from: a.tick, to: b.tick, text: `No data ${mon(a.label)}${yr(a.label) !== yr(b.label) ? ' ' + yr(a.label) : ''}–${mon(b.label)}${yr(a.label) !== yr(b.label) ? ' ' + yr(b.label) : ''}` })
    start = -1
  }
  points.forEach((p, i) => {
    if (isMissing(p.value)) { if (start < 0) start = i } else if (start >= 0) close(i - 1)
  })
  if (start >= 0) close(points.length - 1)
  return gaps
}

/** Monthly area score with the Watch (70) and At risk (40) thresholds. Hover or arrow-key a month for its value.
 *  Months with no value are shaded and labelled ("No data Jul–Oct") instead of drawn as a zero or left unexplained. */
export function TrendChart({ months, area, name, className }: {
  months: Month[]; area: keyof Month['areas']; name: string; className?: string
}) {
  const points = months.map(m => ({ tick: m.short, label: m.label, value: isMissing(m.areas[area]) ? null : m.areas[area] }))
  const gaps = dataGaps(points)
  if (!gaps.length) return <ScoreTrend data={points as { tick: string; label: string; value: number }[]} name={name} className={className} />
  const config = { value: { label: name, color: SERIES[0] } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className={cn('aspect-auto h-56 w-full', className)} role="img"
      aria-label={`${name} score by month. ${gaps.map(g => g.text).join('. ')}`}>
      <AreaChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="tick" {...xAxisProps} minTickGap={24} />
        <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} {...yAxisProps} />
        <ReferenceLine y={70} {...thresholdLine} />
        <ReferenceLine y={40} {...thresholdLine} />
        {gaps.map(g => (
          <ReferenceArea key={g.from} x1={g.from} x2={g.to} fill="var(--muted)" fillOpacity={0.6} stroke="none" ifOverflow="visible"
            label={{ value: g.text, position: 'insideTop', fontSize: 11, fill: 'var(--muted-foreground)' }} />
        ))}
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, p) => p?.[0]?.payload?.label} />} />
        <Area dataKey="value" type="linear" connectNulls={false} stroke="var(--color-value)" strokeWidth={2}
          fill="var(--color-value)" fillOpacity={AREA_FILL_OPACITY} dot={false} activeDot={activeDotProps} animationDuration={ANIM_MS} />
      </AreaChart>
    </ChartContainer>
  )
}
