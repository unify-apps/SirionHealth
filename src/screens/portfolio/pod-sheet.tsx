import { useState } from 'react'
import { BAND_LABEL, bandOf, bandText } from '@/components/health'
import { SplitBar } from '@/components/charts'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { listPager, RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { Button } from '@/components/ui/button'
import { openSheet, sheetOpenChange } from '@/lib/route'
import { cn } from '@/lib/utils'
import { AccountsTable, META, SheetListHead } from './accounts-table'
import { carrK, isAtRisk, isRenewing60, isScored, moneyK, moneyM, plural, type Pod, type Row } from './data'
import { changeScope, useScope } from './scope'


/** One of the three headline cells: label, large value, one muted line. */
function Cell({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="grid min-w-0 content-start gap-1 px-4 py-3 first:pl-0 last:pr-0">
      <dt className="text-xs text-pretty text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-normal tabular-nums tracking-[-0.02em]">{value}</dd>
      <dd className="text-xs text-pretty tabular-nums text-muted-foreground">{sub}</dd>
    </div>
  )
}

const BAND_PARTS = [
  { key: 'good', label: 'Healthy', color: 'var(--good)' },
  { key: 'warn', label: 'Watch', color: 'var(--warn)' },
  { key: 'bad', label: 'At risk', color: 'var(--bad)' },
] as const

type Slice = 'risk' | 'renewing' | 'all'

/** The pod's accounts, narrowed by a segmented control. Keyed per pod so the choice resets on paging. */
function PodAccounts({ pod, accounts }: { pod: Pod; accounts: Row[] }) {
  const slices: Record<Slice, Row[]> = { risk: accounts.filter(isAtRisk), renewing: accounts.filter(isRenewing60), all: accounts }
  const [slice, setSlice] = useState<Slice>(slices.risk.length ? 'risk' : 'all')
  const list = slices[slice]
  const title = slice === 'risk' ? `${plural(list.length, 'account')} at risk in ${pod.name}`
    : slice === 'renewing' ? `${plural(list.length, 'account')} in ${pod.name} renewing in 60 days`
    : `All ${plural(list.length, 'account')} in ${pod.name}`
  return (
    <>
      <ToggleGroup type="single" variant="outline" size="sm" value={slice} onValueChange={v => v && setSlice(v as Slice)} aria-label="Accounts to show" className="mb-4">
        <ToggleGroupItem value="risk" disabled={!slices.risk.length}>At risk <span className="tabular-nums text-muted-foreground">{slices.risk.length}</span></ToggleGroupItem>
        <ToggleGroupItem value="renewing" disabled={!slices.renewing.length}>Renewing <span className="tabular-nums text-muted-foreground">{slices.renewing.length}</span></ToggleGroupItem>
        <ToggleGroupItem value="all">All <span className="tabular-nums text-muted-foreground">{slices.all.length}</span></ToggleGroupItem>
      </ToggleGroup>
      <SheetListHead list={list} title={title} order="largest first" />
      <AccountsTable key={slice} list={list} meta={META.industryStage} />
    </>
  )
}

/** `#portfolio?sheet=pod:<name>`: one pod's figures and accounts. `list` is the table as sorted and narrowed, for prev/next. */
export function PodSheet({ pod: current, list }: { pod: Pod | null; list: Pod[] }) {
  const pod = useKept(current)
  const { scope, summary: S } = useScope()
  const accounts = pod ? S.podAccounts(pod.name) : []
  const scored = accounts.filter(isScored)
  const bands = BAND_PARTS.map(b => ({ ...b, value: carrK(scored.filter(a => bandOf(a.health) === b.key)) / 1000 }))
  return (
    <RecordSheet open={!!current} onOpenChange={sheetOpenChange} size="lg" view={pod?.name ?? ''}
      pager={listPager(list, pod, p => p.name, p => openSheet('pod', p.name, { replace: true }), 'pods')}>
      {pod && (
        <>
          <RecordSheetHeader eyebrow="Pod" title={pod.name}
            meta={`${pod.region} · ${plural(pod.accounts, 'account')} · ${moneyM(pod.carr)} CARR · ${S.share(pod.carr * 1000)} of ${S.name}`} />
          <RecordSheetBody className="px-6 py-5">
            <dl className="grid grid-cols-3 divide-x divide-hairline border-b border-hairline pb-1">
              <Cell label="At risk" value={<span className={cn(pod.carrAtRisk > 0 && 'text-bad')}>{moneyM(pod.carrAtRisk)}</span>}
                sub={`${plural(pod.atRisk, 'account')} · ${pod.riskShare}% of this pod`} />
              <Cell label="Renewing in 60 days" value={pod.renewing}
                sub={pod.renewing ? `${moneyM(pod.renewalAtRisk)} at risk or unsigned` : 'Nothing due'} />
              <Cell label="Average health"
                value={pod.health == null ? <span className="text-muted-foreground">No data</span> : <span className={bandText[bandOf(pod.health)]}>{pod.health}</span>}
                sub={pod.health == null ? 'No account is scored' : BAND_LABEL[bandOf(pod.health)]} />
            </dl>
            {pod.carr > 0 && (
              <SplitBar className="mt-4" label={`${pod.name} CARR by health band`} legend={false} format={m => moneyK(m * 1000)}
                parts={bands.map(b => ({ key: b.key, label: b.label, value: b.value, color: b.color }))} />
            )}
            <div className="mt-6">
              <PodAccounts key={pod.name} pod={pod} accounts={accounts} />
            </div>
          </RecordSheetBody>
          {!(scope.kind === 'pod' && scope.name === pod.name) && (
            <RecordSheetFooter>
              <Button variant="outline" size="sm" onClick={() => changeScope({ kind: 'pod', name: pod.name }, true)}>View Portfolio for this pod</Button>
            </RecordSheetFooter>
          )}
        </>
      )}
    </RecordSheet>
  )
}
