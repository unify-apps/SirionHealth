import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from 'lucide-react'
import { HealthBar } from '@/components/health'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, TableSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { moneyM, PODS, type Pod } from './data'
import type { Filters } from './filters'

type Key = Exclude<keyof Pod, 'region'>
const COLS: { key: Key; label: string; tip?: string; num?: boolean }[] = [
  { key: 'name', label: 'Pod' },
  { key: 'accounts', label: 'Accounts', num: true },
  { key: 'carr', label: 'CARR', num: true },
  { key: 'health', label: 'Avg health', num: true, tip: 'Average health of scored accounts. Accounts with no score are left out.' },
  { key: 'atRisk', label: 'At risk', num: true },
  { key: 'carrAtRisk', label: 'CARR at risk', num: true, tip: 'CARR of accounts with health under 40' },
  { key: 'renewing', label: 'Renewing <60d', num: true },
  { key: 'renewalAtRisk', label: 'Renewal ARR at risk', num: true, tip: 'ARR renewing in 60 days that is at risk or unsigned' },
]

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
      <CardContent className={cn('transition-opacity duration-200', refreshing && 'opacity-55')}>
        {status === 'loading' && <><LoadingLabel what="pods" /><TableSkeleton rows={6} cols={8} /></>}
        {status === 'error' && (
          <WidgetError title="Pod data didn't load" sub="The CS roster service timed out after 20 seconds. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && list.length === 0 && (
          <EmptyState title="No pods match these filters" sub="Pod and region filters narrow this table." action="Clear filters" onAction={onClearFilters} />
        )}
        {status === 'ready' && list.length > 0 && (
          <Table aria-label="Pods" className="min-w-[760px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLS.map(c => {
                  const on = sort.key === c.key
                  const Icon = !on ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
                  const btn = (
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                        on ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {c.label}
                      <Icon className={cn('size-3', !on && 'opacity-50')} aria-hidden="true" />
                    </button>
                  )
                  return (
                    <TableHead
                      key={c.key}
                      className={cn('text-xs font-normal', c.num && 'text-right')}
                      aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                    >
                      {c.tip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{btn}</TooltipTrigger>
                          <TooltipContent className="max-w-60">{c.tip}</TooltipContent>
                        </Tooltip>
                      ) : btn}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(p => (
                <TableRow key={p.name}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.region}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.accounts}</TableCell>
                  <TableCell className="text-right tabular-nums">{moneyM(p.carr)}</TableCell>
                  <TableCell className="text-right"><HealthBar value={p.health} className="justify-end" /></TableCell>
                  <TableCell className="text-right tabular-nums">{p.atRisk}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="tabular-nums font-medium">{moneyM(p.carrAtRisk)}</span>
                      <span className="h-1 w-14 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(p.carrAtRisk / maxRisk) * 100}%` }} />
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.renewing}</TableCell>
                  <TableCell className="text-right tabular-nums">{moneyM(p.renewalAtRisk)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {list.length > 1 && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right tabular-nums">{total.accounts}</TableCell>
                  <TableCell className="text-right tabular-nums">{moneyM(total.carr)}</TableCell>
                  <TableCell className="text-right"><HealthBar value={total.health} className="justify-end" /></TableCell>
                  <TableCell className="text-right tabular-nums">{total.atRisk}</TableCell>
                  <TableCell className="pr-[4.5rem] text-right tabular-nums font-medium">{moneyM(total.carrAtRisk)}</TableCell>
                  <TableCell className="text-right tabular-nums">{total.renewing}</TableCell>
                  <TableCell className="text-right tabular-nums">{moneyM(total.renewalAtRisk)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
