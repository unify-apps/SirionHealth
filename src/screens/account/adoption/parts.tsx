import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Stat, Empty } from '@/components/page'
import { cn } from '@/lib/utils'
import type { Part, StatRow } from './model'

const SERIES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
const fmt = (n: number) => n.toLocaleString('en-US')

export function ChartCard({ title, sub, children, className }: {
  title: string; sub?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className="gap-0.5">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {sub && <CardDescription className="text-xs">{sub}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function StatGrid({ rows }: { rows: StatRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {rows.map(r => <Stat key={r.label} label={r.label} value={r.value} hint={r.hint || undefined} />)}
    </div>
  )
}

export function StatGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <Card key={i} className="gap-2 px-5 py-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-16" /><Skeleton className="h-3 w-28" /></Card>
      ))}
    </div>
  )
}

/** A 100% split bar with a legend. Each segment has a tooltip and is reachable by keyboard. Zero parts show only in the legend. */
export function SplitBar({ parts, unit, label }: { parts: Part[]; unit: string; label: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (!total) return <Empty title={`No ${unit}`} className="py-6" />
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="list" aria-label={label}>
        {parts.map((p, i) => p.value > 0 && (
          <Tooltip key={p.key}>
            <TooltipTrigger asChild>
              <span role="listitem" tabIndex={0} aria-label={`${p.label}: ${fmt(p.value)} ${unit}, ${pct(p.value)}`}
                className={cn('h-full outline-none transition-[flex-grow,opacity] duration-700 hover:opacity-80 focus-visible:opacity-80 focus-visible:ring-2 focus-visible:ring-ring', SERIES[i % SERIES.length])}
                style={{ flexGrow: p.value }} />
            </TooltipTrigger>
            <TooltipContent><span className="tabular-nums">{p.label}: {fmt(p.value)} {unit} · {pct(p.value)}</span></TooltipContent>
          </Tooltip>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {parts.map((p, i) => (
          <li key={p.key} className="inline-flex items-center gap-1.5">
            <span className={cn('size-2 rounded-sm', SERIES[i % SERIES.length], !p.value && 'opacity-30')} aria-hidden="true" />
            <span className="text-muted-foreground">{p.label}</span>
            <span className="font-medium tabular-nums">{fmt(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const themeConfig = { tickets: { label: 'Tickets', color: 'var(--chart-1)' } } satisfies ChartConfig

/** Ticket themes as horizontal bars, most tickets first. Hover or arrow-key a bar for its count. */
export function ThemeBars({ themes }: { themes: { name: string; tickets: number }[] }) {
  if (!themes.length) return <Empty title="No ticket themes" sub="No tickets have been grouped into themes yet." className="py-6" />
  return (
    <ChartContainer config={themeConfig} className="aspect-auto w-full" style={{ height: themes.length * 30 + 8 }}
      role="img" aria-label={'Tickets by theme: ' + themes.map(t => `${t.name} ${t.tickets}`).join(', ')}>
      <BarChart data={themes} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={8}>
        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={128}
          tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
        <XAxis type="number" dataKey="tickets" hide domain={[0, 'dataMax']} />
        <ChartTooltip cursor={{ fill: 'var(--accent)' }} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="tickets" fill="var(--color-tickets)" radius={3} background={{ fill: 'var(--muted)', radius: 3 }} animationDuration={800}>
          <LabelList dataKey="tickets" position="right" offset={8} className="fill-foreground tabular-nums" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-4', className)} aria-hidden="true">
      <CardHeader className="gap-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-72 max-w-full" /></CardHeader>
      <CardContent><Skeleton className="h-48 w-full" /></CardContent>
    </Card>
  )
}
