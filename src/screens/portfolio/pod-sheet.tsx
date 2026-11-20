import { BAND_LABEL, bandOf, HealthBar } from '@/components/health'
import { listPager, RecordSheet, RecordSheetBody, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { Meter } from '@/components/page'
import { openSheet, sheetOpenChange } from '@/lib/route'
import { cn } from '@/lib/utils'
import { EmptyState } from '../states/widget-states'
import { BOOK, moneyM, type Pod } from './data'

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function Fact({ label, value, sub, children }: { label: string; value: React.ReactNode; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg tabular-nums">{value}</dd>
      {children}
      {sub && <dd className="text-xs tabular-nums text-muted-foreground">{sub}</dd>}
    </div>
  )
}

/** `#portfolio?sheet=pod:<name>`: one pod's figures. `list` is the table as sorted and narrowed, for prev/next. */
export function PodSheet({ pod: current, list }: { pod: Pod | null; list: Pod[] }) {
  const pod = useKept(current)
  return (
    <RecordSheet open={!!current} onOpenChange={sheetOpenChange} size="md" view={pod?.name ?? ''}
      pager={listPager(list, pod, p => p.name, p => openSheet('pod', p.name, { replace: true }), 'pods')}>
      {pod && (
        <>
          <RecordSheetHeader eyebrow="Pod" title={pod.name}
            meta={`${pod.region} · ${pod.accounts} account${pod.accounts === 1 ? '' : 's'} · ${pct(pod.accounts, BOOK.accounts)}% of the book`} />
          <RecordSheetBody className="px-6 py-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Fact label="CARR" value={moneyM(pod.carr)} sub={`${pct(pod.carr, BOOK.arr)}% of $${BOOK.arr}M`} />
              <Fact label="Average health" value={pod.health == null ? 'No data' : <HealthBar value={pod.health} />}
                sub={pod.health == null ? 'No account in this pod is scored' : BAND_LABEL[bandOf(pod.health)]} />
              <Fact label="CARR at risk" value={<span className={cn(pod.carrAtRisk > 0 && 'text-bad')}>{moneyM(pod.carrAtRisk)}</span>}
                sub={`${pct(pod.carrAtRisk, pod.carr)}% of this pod · ${pod.atRisk} account${pod.atRisk === 1 ? '' : 's'} under 40`}>
                <Meter value={pod.carrAtRisk} max={pod.carr || 1} label="Share of this pod's CARR at risk" className="w-full" />
              </Fact>
              <Fact label="Renewing in 60 days" value={pod.renewing}
                sub={pod.renewing ? `${moneyM(pod.renewalAtRisk)} at risk or unsigned` : 'Nothing due'} />
            </dl>
            <h3 className="mt-7 mb-2 text-sm font-medium">Accounts</h3>
            <EmptyState title="No account list for this pod" sub="Account records don't carry a pod yet, so this pod's accounts can't be listed." />
          </RecordSheetBody>
        </>
      )}
    </RecordSheet>
  )
}
