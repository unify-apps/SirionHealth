import { BarList, Donut, seqColors } from '@/components/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BarsSkeleton, DonutSkeleton, EmptyState, LoadingLabel, WidgetError, type WidgetStatus } from '../states/widget-states'
import { GRR, KPIS, STAGES } from './data'

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
            <BarList data={data.map(d => ({ label: d.stage, value: d.carr }))} name="CARR" format={v => `$${v}M`}
              labelWidth={150} rowHeight={Math.max(28, Math.floor(232 / data.length))}
              selected={stage === 'all' ? null : stage} onSelect={pick} />
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

export function GrrChart({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  const total = GRR.reduce((a, g) => a + g.accounts, 0)
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
          <Donut data={GRR.map(g => ({ key: g.key, label: g.label, value: g.accounts }))} colors={seqColors(GRR.length)}
            center={{ value: `${Math.round((KPIS.grr100 / total) * 100)}%`, label: 'at 100%+' }}
            label={`${KPIS.grr100} of ${total} accounts retain 100% or more`} />
        )}
      </CardContent>
    </Card>
  )
}
