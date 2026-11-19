import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { HealthBar } from '@/components/health'
import { Meter, SortHead, stickyCol } from '@/components/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, TableSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { PODS, type Pod } from './data'
import type { Filters } from './filters'

type Key = Exclude<keyof Pod, 'region'>
/** Seven columns; the at-risk account count lives in the CARR-at-risk tooltip. */
const COLS: { key: Key; label: string; tip?: string; num?: boolean }[] = [
  { key: 'name', label: 'Pod' },
  { key: 'accounts', label: 'Accounts', num: true },
  { key: 'carr', label: 'CARR', num: true, tip: 'Contracted annual recurring revenue' },
  { key: 'health', label: 'Avg health', num: true, tip: 'Average health of scored accounts. Accounts with no score are left out.' },
  { key: 'carrAtRisk', label: 'CARR at risk', num: true, tip: 'CARR of accounts with health under 40' },
  { key: 'renewing', label: 'Renewing <60d', num: true },
  { key: 'renewalAtRisk', label: 'Renewal ARR at risk', num: true, tip: 'ARR renewing in 60 days that is at risk or unsigned' },
]
/** One money format down every column: $ millions, two decimals. */
const fmtM = (m: number) => `$${m.toFixed(2)}M`

export function PodsTable({ status, onRetry, filters, refreshing, onClearFilters }: {
  status: WidgetStatus; onRetry: () => void; filters: Filters; refreshing: boolean; onClearFilters: () => void
}) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: 'carrAtRisk', dir: -1 })
  const list = useMemo(() => {
    const rows = PODS.filter(p => (filters.pod === 'all' || p.name === filters.pod) && (filters.region === 'all' || p.region === filters.region))
    const v = (p: Pod) => p[sort.key]
    return [...rows].sort((a, b) => {
      const x = v(a), y = v(b)
      if (x == null) return 1 // "No data" always last
      if (y == null) return -1
      return typeof x === 'string' ? sort.dir * x.localeCompare(y as string) : sort.dir * (x - (y as number))
    })
  }, [filters.pod, filters.region, sort])
  const maxRisk = Math.max(...PODS.map(p => p.carrAtRisk), 0.0001)
  const sortLabel = COLS.find(c => c.key === sort.key)!.label

  const scored = list.filter(p => p.health != null)
  const scoredN = scored.reduce((a, p) => a + p.accounts, 0)
  const total = {
    accounts: list.reduce((a, p) => a + p.accounts, 0),
    carr: list.reduce((a, p) => a + p.carr, 0),
    health: scoredN ? Math.round(scored.reduce((a, p) => a + (p.health ?? 0) * p.accounts, 0) / scoredN) : null,
    atRisk: list.reduce((a, p) => a + p.atRisk, 0),
    carrAtRisk: list.reduce((a, p) => a + p.carrAtRisk, 0),
    renewing: list.reduce((a, p) => a + p.renewing, 0),
    renewalAtRisk: list.reduce((a, p) => a + p.renewalAtRisk, 0),
  }

  const onSort = (key: Key) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' ? 1 : -1 }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pods
          {refreshing && status === 'ready' && <Loader2 className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none" aria-label="Updating" />}
        </CardTitle>
        <CardDescription>
          Sorted by {sortLabel.toLowerCase()}{sort.dir === 1 ? ', ascending' : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn('px-0 transition-opacity duration-200', refreshing && 'opacity-55')}>
        {status === 'loading' && <><LoadingLabel what="pods" /><TableSkeleton cols={7} /></>}
        {status === 'error' && (
          <WidgetError className="mx-4" title="Pod data didn't load" sub="The CS roster service timed out after 20 seconds. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && list.length === 0 && (
          <EmptyState className="mx-4" title="No pods match these filters" sub="Pod and region filters narrow this table." action="Clear filters" onAction={onClearFilters} />
        )}
        {status === 'ready' && list.length > 0 && (
          <Table aria-label="Pods" className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                {COLS.map((c, i) => (
                  <SortHead key={c.key} active={sort.key === c.key} dir={sort.dir === 1 ? 'asc' : 'desc'} onSort={() => onSort(c.key)}
                    numeric={c.num} sticky={i === 0} title={c.tip}>{c.label}</SortHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(p => (
                <TableRow key={p.name} className="[&>td]:h-11">
                  <TableCell className={stickyCol}>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{p.region}</span>
                  </TableCell>
                  <TableCell className="text-right">{p.accounts}</TableCell>
                  <TableCell className="text-right">{fmtM(p.carr)}</TableCell>
                  <TableCell className="text-right"><HealthBar value={p.health} className="justify-end" /></TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-flex items-center justify-end gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                          <Meter value={p.carrAtRisk} max={maxRisk} label={`${p.name} CARR at risk`} className="w-14" />
                          <span className="w-14 font-medium">{fmtM(p.carrAtRisk)}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{p.atRisk} account{p.atRisk === 1 ? '' : 's'} under 40</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">{p.renewing}</TableCell>
                  <TableCell className="text-right">{fmtM(p.renewalAtRisk)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {list.length > 1 && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className={cn(stickyCol, 'bg-surface-2 font-medium [tr:hover_&]:bg-surface-2')}>Total</TableCell>
                  <TableCell className="text-right">{total.accounts}</TableCell>
                  <TableCell className="text-right">{fmtM(total.carr)}</TableCell>
                  <TableCell className="text-right"><HealthBar value={total.health} className="justify-end" /></TableCell>
                  <TableCell className="text-right" title={`${total.atRisk} accounts under 40`}><span className="inline-block w-14 font-medium">{fmtM(total.carrAtRisk)}</span></TableCell>
                  <TableCell className="text-right">{total.renewing}</TableCell>
                  <TableCell className="text-right">{fmtM(total.renewalAtRisk)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
