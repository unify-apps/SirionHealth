import { ChartBar, RefreshCw } from 'lucide-react'
import { Donut, seqColors } from '@/components/charts'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Term } from '../account/overview/bits'
import { BarsSkeleton, DonutSkeleton, EmptyState, LoadingLabel, WidgetError, type WidgetStatus } from '../states/widget-states'
import { GRR, KPIS, STAGES } from './data'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const pct = (v: number, total: number) => `${Math.round((v / total) * 100)}%`

/** Shared card frame: same height side by side, body vertically centred. */
function ChartCard({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="h-full gap-0 py-0">
      {header}
      <div className="flex flex-1 flex-col justify-center px-5 py-4">{children}</div>
    </Card>
  )
}

export function StagesChart({ status, onRetry, stage, onStage }: {
  status: WidgetStatus; onRetry: () => void; stage: string; onStage: (s: string) => void
}) {
  const data = STAGES
  const max = Math.max(...data.map(d => d.carr), 0.0001)
  const pick = (s: string) => onStage(stage === s ? 'all' : s)
  return (
    <ChartCard header={<BlockHeader icon={ChartBar} title={<><Term>CARR</Term> by stage</>} sub="$M · select a stage to filter" />}>
      {status === 'loading' && <><LoadingLabel what="CARR by stage" /><BarsSkeleton /></>}
      {status === 'error' && <WidgetError title="Stage data didn't load" sub="AHI's stage chart timed out. Other sections are up to date." onRetry={onRetry} />}
      {status === 'ready' && data.every(d => !d.carr) && <EmptyState title="No CARR by stage" sub="No live accounts carry CARR in any stage." />}
      {status === 'ready' && data.some(d => d.carr) && (
        <ul className="grid gap-0.5" aria-label="CARR by stage, select one to filter">
          {data.map(d => {
            const on = stage === d.stage
            const dim = stage !== 'all' && !on
            const empty = !d.carr
            return (
              <li key={d.stage}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-pressed={on} disabled={empty} onClick={() => pick(d.stage)}
                      aria-label={`${d.stage}: ${empty ? 'no CARR' : `$${d.carr}M CARR`}. ${on ? 'Clear the filter' : 'Filter to this stage'}`}
                      className={cn('-mx-2 grid w-[calc(100%+1rem)] grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        !empty && 'hover:bg-accent/60', on && 'bg-accent', focusRing, 'disabled:cursor-default')}>
                      <span className={cn('truncate', dim && 'opacity-60')}>{d.stage}</span>
                      <span className="flex min-w-0 items-center gap-2">
                        {empty
                          ? <span className="text-muted-foreground">—</span>
                          : <>
                              <span className={cn('h-3 rounded-r-[3px] bg-chart-1 transition-opacity', dim && 'opacity-30')}
                                style={{ width: `${Math.max(1, (d.carr / max) * 80)}%` }} />
                              <span className="shrink-0 text-xs tabular-nums">${d.carr}M</span>
                            </>}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="tabular-nums">
                    {empty ? `${d.stage}: no CARR` : `${d.stage}: $${d.carr}M · ${on ? 'click to clear' : 'click to filter'}`}
                  </TooltipContent>
                </Tooltip>
              </li>
            )
          })}
        </ul>
      )}
    </ChartCard>
  )
}

export function GrrChart({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  const total = GRR.reduce((a, g) => a + g.accounts, 0)
  const colors = seqColors(GRR.length)
  return (
    <ChartCard header={<BlockHeader icon={RefreshCw} title="Gross retention" sub={<>Accounts by <Term>GRR</Term> band</>} />}>
      {status === 'loading' && <><LoadingLabel what="gross retention" /><DonutSkeleton /></>}
      {status === 'error' && <WidgetError title="Retention data didn't load" sub="AHI's GRR feed timed out. Other sections are up to date." onRetry={onRetry} />}
      {status === 'ready' && total === 0 && <EmptyState title="No GRR data" sub="No account in the book reports GRR yet." />}
      {status === 'ready' && total > 0 && (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Donut compact legend={false} data={GRR.map(g => ({ key: g.key, label: g.label, value: g.accounts }))} colors={colors}
            center={{ value: `${Math.round((KPIS.grr100 / total) * 100)}%`, label: 'at 100%+' }}
            label={`${KPIS.grr100} of ${total} accounts retain 100% or more`} className="shrink-0" />
          <ul className="grid w-full min-w-0 flex-1 gap-1">
            {[...GRR].reverse().map(g => {
              const i = GRR.indexOf(g)
              return (
                <li key={g.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className={cn('grid grid-cols-[minmax(0,1fr)_auto_2.5rem_2.5rem] items-center gap-3 rounded-md py-1.5 text-sm', focusRing)}>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: colors[i] }} aria-hidden="true" />
                          <span className="truncate">{g.label}</span>
                        </span>
                        <span className="hidden h-1 w-[96px] overflow-hidden rounded-full bg-chart-5 sm:block" aria-hidden="true">
                          <span className="block h-full rounded-full" style={{ width: pct(g.accounts, total), background: colors[i] }} />
                        </span>
                        <span className="text-right font-medium tabular-nums">{g.accounts}</span>
                        <span className="text-right text-xs tabular-nums text-muted-foreground">{pct(g.accounts, total)}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="tabular-nums">{g.label} GRR: {g.accounts} of {total} accounts ({pct(g.accounts, total)})</TooltipContent>
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}
