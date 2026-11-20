import { useMemo, useState } from 'react'
import { ChevronRight, Search, Users } from 'lucide-react'
import { BlockHeader, SortHead, stickyCol } from '@/components/page'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, TableSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { podFigures, type Pod } from './data'
import { useScope } from './scope'
import { HealthValue } from './accounts-table'
import { openSheet, useSheet } from '@/lib/route'
import { PodSheet } from './pod-sheet'

type Key = Exclude<keyof Pod, 'region'>
/** One fact per column, each header aligned with its own content: numbers right, number-plus-bar left. */
const COLS: { key: Key; label: string; tip?: string; num?: boolean }[] = [
  { key: 'name', label: 'Pod' },
  { key: 'accounts', label: 'Accounts', num: true },
  { key: 'carr', label: 'CARR', num: true, tip: 'Contracted annual recurring revenue' },
  { key: 'health', label: 'Avg health', num: true, tip: 'Average health of scored accounts. Accounts with no score are left out.' },
  { key: 'carrAtRisk', label: 'CARR at risk', num: true, tip: 'CARR of accounts with health under 40' },
  { key: 'riskShare', label: '% of pod at risk', num: true, tip: 'CARR at risk as a share of the pod’s CARR' },
  { key: 'renewing', label: 'Renewing in 60 days', num: true },
  { key: 'renewalAtRisk', label: 'Renewing ARR at risk', num: true, tip: 'CARR renewing in 60 days on accounts at risk (health under 40) or without a signed renewal' },
]
/** A number with a small bar before it, right-aligned as one unit so the numbers line up down the column. */
export function BarValue({ value, max, fill = 'bg-chart-1', text }: { value: number; max: number; fill?: string; text: React.ReactNode }) {
  const pct = max > 0 ? Math.min(100, Math.max(value > 0 ? 3 : 0, (value / max) * 100)) : 0
  return (
    <span className="inline-flex items-center justify-end gap-2.5">
      <span className="block h-1.5 w-12 overflow-hidden rounded-[2px] bg-muted" aria-hidden="true">
        <span className={cn('block h-full', fill)} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-9 text-right">{text}</span>
    </span>
  )
}

/** A tooltip only when there is something the cell doesn't already show. */
function Hint({ tip, children }: { tip?: string; children: React.ReactElement<{ tabIndex?: number; className?: string }> }) {
  if (!tip) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/** Column widths in % of the table: wider where the header is longer. */
const WIDTH: Record<Key, number> = {
  name: 19, accounts: 9, carr: 10, health: 11.5, carrAtRisk: 11, riskShare: 11.5, renewing: 13.5, renewalAtRisk: 14.5, atRisk: 0,
}
/** One money format down every column: $ millions, two decimals. */
const fmtM = (m: number) => (m === 0 ? '$0' : `$${m.toFixed(2)}M`)

/** The table's search appears only once the list is long enough to need it. It narrows this table only; the page's
 *  scope (pod or region, in the header) decides which pods are here at all. */
const CONTROLS_OVER = 8

export function PodsTable({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: 'carrAtRisk', dir: -1 })
  const [q, setQ] = useState('')
  const { summary: S } = useScope()
  const PODS = S.pods
  const controls = PODS.length > CONTROLS_OVER
  const list = useMemo(() => {
    const rows = PODS.filter(p => !q || `${p.name} ${p.region}`.toLowerCase().includes(q.toLowerCase()))
    const v = (p: Pod) => p[sort.key]
    return [...rows].sort((a, b) => {
      const x = v(a), y = v(b)
      if (x == null) return 1 // "No data" always last
      if (y == null) return -1
      return typeof x === 'string' ? sort.dir * x.localeCompare(y as string) : sort.dir * (x - (y as number))
    })
  }, [PODS, q, sort])
  const narrowed = !!q
  const reset = () => setQ('')
  const sheet = useSheet()
  const openPod = sheet?.type === 'pod' ? list.find(p => p.name === sheet.id) ?? PODS.find(p => p.name === sheet.id) ?? null : null
  const sortLabel = COLS.find(c => c.key === sort.key)!.label

  // the total row is computed from the accounts of the listed pods, with the same formulas as each pod's row
  const total = useMemo(() => { const names = new Set(list.map(p => p.name)); return podFigures(S.accounts.filter(a => names.has(a.pod))) }, [list, S])

  const onSort = (key: Key) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' ? 1 : -1 }))

  return (
    <Card data-block className="gap-0 py-0">
      <BlockHeader icon={Users} title="Pods" count={status === 'ready' ? list.length : undefined}
        sub={`Sorted by ${sortLabel.replace(/^(?!CARR|ARR|GRR)([A-Z])/, c => c.toLowerCase())}${sort.dir === 1 ? ', ascending' : ''}`}
        actions={controls && status === 'ready' ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex h-8 w-44 items-center gap-2 rounded-md border border-input px-2 focus-within:ring-2 focus-within:ring-ring">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search pods" aria-label="Search pods"
                className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </label>
          </div>
        ) : undefined} />
      <CardContent className="px-0">
        {status === 'loading' && <><LoadingLabel what="pods" /><TableSkeleton cols={8} /></>}
        {status === 'error' && (
          <WidgetError className="m-5" title="Pod data didn't load" sub="The CS roster service timed out after 20 seconds. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && list.length === 0 && (
          <EmptyState className="m-5" title="No pods match" sub="Search narrows this table." action={narrowed ? 'Reset' : undefined} onAction={reset} />
        )}
        {status === 'ready' && list.length > 0 && (
          // Standard data-table rules: text left, every number right-aligned under a right-aligned header, fixed
          // column widths sized to the headers so spacing stays put whatever the values are.
          <Table aria-label="Pods" className="min-w-[1040px] table-fixed">
            <colgroup>
              {COLS.map(c => <col key={c.key} style={{ width: `${WIDTH[c.key]}%` }} />)}
              <col className="w-10" />
            </colgroup>
            <TableHeader>
              <TableRow>
                {COLS.map((c, i) => (
                  <SortHead key={c.key} active={sort.key === c.key} dir={sort.dir === 1 ? 'asc' : 'desc'} onSort={() => onSort(c.key)}
                    numeric={i > 0} sticky={i === 0} title={c.tip}>{c.label}</SortHead>
                ))}
                <TableHead><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(p => (
                <TableRow key={p.name} className="cursor-pointer" onClick={() => openSheet('pod', p.name)}>
                  <TableCell className={cn(stickyCol, 'truncate')}>
                    <button type="button" aria-haspopup="dialog" onClick={e => { e.stopPropagation(); openSheet('pod', p.name) }}
                      className="rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{p.name}</button>
                    <span className="ml-2 text-xs text-muted-foreground">{p.region}</span>
                  </TableCell>
                  <TableCell className="text-right">{p.accounts}</TableCell>
                  <TableCell className="text-right">{fmtM(p.carr)}</TableCell>
                  <TableCell className="text-right">
                    {p.health == null
                      ? <Hint tip="None of this pod's accounts are scored"><span className="text-muted-foreground">No data</span></Hint>
                      : <HealthValue value={p.health} />}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <Hint tip={p.atRisk > 0 ? `${p.atRisk} account${p.atRisk === 1 ? '' : 's'} under 40` : undefined}><span>{fmtM(p.carrAtRisk)}</span></Hint>
                  </TableCell>
                  <TableCell className="text-right"><BarValue value={p.carrAtRisk} max={p.carr} text={`${p.riskShare}%`} /></TableCell>
                  <TableCell className="text-right">{p.renewing}</TableCell>
                  <TableCell className="text-right">{fmtM(p.renewalAtRisk)}</TableCell>
                  <TableCell className="pl-0"><ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
            {list.length > 1 && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className={cn(stickyCol, 'bg-[color-mix(in_oklab,var(--surface-2)_60%,var(--card))] font-medium [tr:hover_&]:bg-[color-mix(in_oklab,var(--surface-2)_60%,var(--card))]')}>Total</TableCell>
                  <TableCell className="text-right">{total.accounts}</TableCell>
                  <TableCell className="text-right">{fmtM(total.carr)}</TableCell>
                  <TableCell className="text-right">
                    {total.health == null ? <span className="text-muted-foreground">No data</span>
                      : <HealthValue value={total.health} />}
                  </TableCell>
                  <TableCell className="text-right font-medium"><Hint tip={`${total.atRisk} accounts under 40`}><span>{fmtM(total.carrAtRisk)}</span></Hint></TableCell>
                  <TableCell className="text-right"><BarValue value={total.carrAtRisk} max={total.carr} text={`${total.riskShare}%`} /></TableCell>
                  <TableCell className="text-right">{total.renewing}</TableCell>
                  <TableCell className="text-right">{fmtM(total.renewalAtRisk)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </CardContent>
      <PodSheet pod={openPod} list={list} />
    </Card>
  )
}
