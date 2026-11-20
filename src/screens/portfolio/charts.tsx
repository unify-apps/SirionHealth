import { ChartBar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Term } from '../account/overview/bits'
import { BarsSkeleton, EmptyState, LoadingLabel, WidgetError, type WidgetStatus } from '../states/widget-states'
import { STAGES } from './data'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Whole percent, with small non-zero shares shown as under 1%. */
const share = (v: number, total: number) => { const p = Math.round((v / total) * 100); return p < 1 ? 'Under 1%' : `${p}%` }

/** A tooltip only when there is something the row doesn't already show. */
function Tip({ tip, children }: { tip?: string; children: React.ReactElement }) {
  if (!tip) return children
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent className="tabular-nums">{tip}</TooltipContent></Tooltip>
}

function ChartCard({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="h-full gap-0 py-0">
      {header}
      <div className="flex flex-1 flex-col justify-center px-5 py-4">{children}</div>
    </Card>
  )
}

/** Stages in the order an account moves through them; anything unlisted goes last. */
const ORDER = ['Pending kick-off', 'Implementation', 'BAU + Implementation', 'BAU', 'Expected churn', 'Churned']
const lifecycle = (stage: string) => { const i = ORDER.indexOf(stage); return i < 0 ? ORDER.length : i }

export function StagesChart({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  const data = [...STAGES].sort((a, b) => lifecycle(a.stage) - lifecycle(b.stage))
  const max = Math.max(...data.map(d => d.carr), 0.0001)
  const total = data.reduce((a, d) => a + d.carr, 0)
  return (
    <ChartCard header={<BlockHeader icon={ChartBar} title={<><Term>CARR</Term> by stage</>} sub="$M, in lifecycle order" />}>
      {status === 'loading' && <><LoadingLabel what="CARR by stage" /><BarsSkeleton /></>}
      {status === 'error' && <WidgetError title="Stage data didn't load" sub="The stage chart timed out. Other sections are up to date." onRetry={onRetry} />}
      {status === 'ready' && data.every(d => !d.carr) && <EmptyState title="No CARR by stage" sub="No live accounts carry CARR in any stage." />}
      {status === 'ready' && data.some(d => d.carr) && (
        <ul className="grid gap-0.5" aria-label="CARR by stage">
          {data.map(d => (
            <li key={d.stage}>
              <Tip tip={d.carr ? `${share(d.carr, total)} of CARR` : undefined}>
                <span tabIndex={d.carr ? 0 : undefined} className={cn('grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-3 rounded-md py-1.5 text-sm', focusRing)}>
                  <span className="truncate">{d.stage}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    {d.carr
                      ? <span className="h-3 rounded-r-[3px] bg-chart-1" style={{ width: `${Math.max(1, (d.carr / max) * 80)}%` }} />
                      : null}
                    <span className={cn('shrink-0 text-xs tabular-nums', !d.carr && 'text-muted-foreground')}>{d.carr ? `$${d.carr}M` : '$0'}</span>
                  </span>
                </span>
              </Tip>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
