import { Bar, BarChart, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { BarsSkeleton, DonutSkeleton, EmptyState, LoadingLabel, WidgetError, type WidgetStatus } from '../states/widget-states'
import { GRR, KPIS, STAGES } from './data'

const stageConfig = { carr: { label: 'CARR ($M)', color: 'var(--chart-1)' } } satisfies ChartConfig

export function StagesChart({ status, onRetry, stage, onStage }: {
  status: WidgetStatus; onRetry: () => void; stage: string; onStage: (s: string) => void
}) {
  const data = STAGES
  const pick = (s: string) => onStage(stage === s ? 'all' : s)
  return (
    <Card>
      <CardHeader>
        <CardTitle>CARR by stage</CardTitle>
        <CardDescription>$M. Select a stage to filter.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'loading' && <><LoadingLabel what="CARR by stage" /><BarsSkeleton /></>}
        {status === 'error' && <WidgetError title="Stage data didn't load" sub="AHI's stage chart timed out. Other sections are up to date." onRetry={onRetry} />}
        {status === 'ready' && data.every(d => !d.carr) && <EmptyState title="No CARR by stage" sub="No live accounts carry CARR in any stage." />}
        {status === 'ready' && data.some(d => d.carr) && (
          <>
            <ChartContainer config={stageConfig} className="aspect-auto h-[232px] w-full">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }} accessibilityLayer>
                <XAxis type="number" dataKey="carr" hide />
                <YAxis type="category" dataKey="stage" width={150} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
                <Bar dataKey="carr" fill="var(--color-carr)" radius={4} barSize={18} className="cursor-pointer"
                  onClick={(d: { payload?: { stage: string } }) => d.payload && pick(d.payload.stage)}>
                  {data.map(d => (
                    <Cell key={d.stage} fillOpacity={stage === 'all' || stage === d.stage ? 1 : 0.3} />
                  ))}
                  <LabelList dataKey="carr" position="right" className="fill-foreground tabular-nums" fontSize={12}
                    formatter={(v: unknown) => `$${v}M`} />
                </Bar>
              </BarChart>
            </ChartContainer>
            {/* keyboard path to the same filter the bars offer by click */}
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by stage">
              {data.map(d => (
                <button key={d.stage} type="button" aria-pressed={stage === d.stage} onClick={() => pick(d.stage)}
                  className={cn('rounded-md border px-2 py-0.5 text-xs outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
                    stage === d.stage ? 'border-signal/50 bg-signal-soft text-foreground' : 'border-hairline text-foreground')}>
                  {d.stage}
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const grrConfig = {
  accounts: { label: 'Accounts' },
  under90: { label: 'Under 90%', color: 'var(--chart-1)' },
  mid: { label: '90 to 99%', color: 'var(--chart-2)' },
  full: { label: '100% or more', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function GrrChart({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  const total = GRR.reduce((a, g) => a + g.accounts, 0)
  const data = GRR.map(g => ({ ...g, fill: `var(--color-${g.key})` }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gross retention</CardTitle>
        <CardDescription>Accounts by GRR band</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'loading' && <><LoadingLabel what="gross retention" /><DonutSkeleton /></>}
        {status === 'error' && <WidgetError title="Retention data didn't load" sub="AHI's GRR feed timed out. Other sections are up to date." onRetry={onRetry} />}
        {status === 'ready' && total === 0 && <EmptyState title="No GRR data" sub="No account in the book reports GRR yet." />}
        {status === 'ready' && total > 0 && (
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative size-40 shrink-0">
              <ChartContainer config={grrConfig} className="aspect-square size-40"
                role="img" aria-label={`${KPIS.grr100} of ${total} accounts retain 100% or more`}>
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
                  <Pie data={data} dataKey="accounts" nameKey="key" innerRadius={52} outerRadius={72} strokeWidth={2} stroke="var(--card)" paddingAngle={1} />
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                <span className="text-2xl tabular-nums tracking-[-0.02em]">{Math.round((KPIS.grr100 / total) * 100)}%</span>
                <span className="text-xs text-muted-foreground">at 100%+</span>
              </div>
            </div>
            <ul className="grid min-w-40 flex-1 gap-2.5 text-sm">
              {GRR.map(g => (
                <li key={g.key} className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full" style={{ background: grrConfig[g.key].color }} aria-hidden="true" />
                  <span className="flex-1">{g.label}</span>
                  <span className="tabular-nums font-medium">{g.accounts}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round((g.accounts / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
