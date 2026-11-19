/* Score charts. Series use --chart-1; green/amber/red stay on the numbers and pills, never on a series. */
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BAND_LABEL, bandOf, bandText } from '@/components/health'
import { cn } from '@/lib/utils'
import type { Month } from './model'

const config = { score: { label: 'Score', color: 'var(--chart-1)' } } satisfies ChartConfig

/** 18-month sparkline for an area card. Decorative: the card text carries the numbers. */
export function Spark({ values, className }: { values: number[]; className?: string }) {
  const data = values.map((v, i) => ({ i, score: v }))
  return (
    <ChartContainer config={config} className={cn('aspect-auto h-10 w-full', className)} aria-hidden="true"
      initialDimension={{ width: 240, height: 40 }}>
      <AreaChart data={data} margin={{ top: 3, right: 2, bottom: 0, left: 2 }} accessibilityLayer={false}>
        <YAxis domain={[0, 100]} hide />
        <Area dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={1.5} fill="var(--color-score)" fillOpacity={0.08}
          isAnimationActive animationDuration={700} dot={false} activeDot={false} />
      </AreaChart>
    </ChartContainer>
  )
}

/** Monthly area score with the Watch (70) and At risk (40) thresholds. Hover or arrow-key a month for its value. */
export function TrendChart({ months, area, name, className }: {
  months: Month[]; area: keyof Month['areas']; name: string; className?: string
}) {
  const data = months.map(m => ({ month: m.short, label: m.label, score: m.areas[area] }))
  const summary = `${name} score by month: ` + data.map(d => `${d.label} ${d.score}`).join(', ')
  return (
    <ChartContainer config={{ score: { label: name, color: 'var(--chart-1)' } }}
      className={cn('aspect-auto h-56 w-full', className)} role="img" aria-label={summary}>
      <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} strokeDasharray="0" stroke="var(--hairline)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} tickLine={false} axisLine={false} width={40} />
        <ReferenceLine y={70} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="3 4"
          label={{ value: 'Watch below 70', position: 'insideTopLeft', fill: 'var(--muted-foreground)', fontSize: 11 }} />
        <ReferenceLine y={40} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="3 4"
          label={{ value: 'At risk below 40', position: 'insideTopLeft', fill: 'var(--muted-foreground)', fontSize: 11 }} />
        <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={
          <ChartTooltipContent hideIndicator labelFormatter={(_, p) => p?.[0]?.payload?.label}
            formatter={v => {
              const n = Number(v), b = bandOf(n)
              return (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className={cn('font-medium tabular-nums', bandText[b])}>{n}</span>
                    <span className="text-muted-foreground">{BAND_LABEL[b]}</span>
                  </span>
                </div>
              )
            }} />
        } />
        <Area dataKey="score" type="linear" stroke="var(--color-score)" strokeWidth={2} fill="var(--color-score)" fillOpacity={0.06}
          dot={{ r: 2.5, fill: 'var(--card)', stroke: 'var(--color-score)', strokeWidth: 1.5 }}
          activeDot={{ r: 4, fill: 'var(--color-score)', stroke: 'var(--card)', strokeWidth: 2 }}
          animationDuration={900} />
      </AreaChart>
    </ChartContainer>
  )
}
