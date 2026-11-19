import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { BAND_LABEL, bandBg, bandOf, bandText, HealthBar, type Band } from '@/components/health'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { money } from '@/data/legacy'
import { go } from '@/lib/route'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, SplitSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { ARR_TIERS, BANDS, BOOK, isLive, renewal, rows } from './data'
import type { Filters } from './filters'

type LiveBand = Exclude<Band, 'none'>

export function BandSplit({ status, onRetry, filters, onClearFilters }: {
  status: WidgetStatus; onRetry: () => void; filters: Filters; onClearFilters: () => void
}) {
  const [band, setBand] = useState<LiveBand | null>(null)
  // segments draw in from equal widths once data arrives
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    if (status !== 'ready') return
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [status])
  const toggle = (b: LiveBand) => setBand(cur => (cur === b ? null : b))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where the ${BOOK.arr}M sits by health</CardTitle>
        <CardDescription>Select a band to see its accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'loading' && <><LoadingLabel what="health split" /><SplitSkeleton /></>}
        {status === 'error' && (
          <WidgetError title="The health split didn't load" sub="AHI's portfolio summary timed out. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && (
          <>
            <div className="flex h-11 gap-[3px] overflow-hidden rounded-lg" role="group" aria-label="ARR by health band">
              {BANDS.map(s => {
                const pct = Math.round((s.arr / BOOK.arr) * 100)
                const on = band === s.band
                return (
                  <Tooltip key={s.band}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${s.label}: $${s.arr}M, ${pct}% of ARR`}
                        onClick={() => toggle(s.band)}
                        style={{ flexGrow: drawn ? s.arr : 1 }}
                        className={cn(
                          'flex min-w-0 basis-0 items-center overflow-hidden whitespace-nowrap px-3.5 text-sm font-medium transition-[flex-grow,opacity] duration-700 ease-out motion-reduce:transition-none',
                          'outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset',
                          bandBg[s.band], 'text-background',
                          band && !on && 'opacity-35 hover:opacity-60',
                          !band && 'hover:opacity-90',
                        )}
                      >
                        {pct > 8 ? `$${s.arr}M` : ''}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>${s.arr}M · {s.label} · {pct}% of ARR</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {BANDS.map(s => {
                const on = band === s.band
                return (
                  <button
                    key={s.band}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.band)}
                    className={cn(
                      'rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
                      on && 'border-border bg-accent',
                    )}
                  >
                    <span className={cn('block text-xl tabular-nums tracking-[-0.02em]', bandText[s.band])}>${s.arr}M</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn('size-1.5 rounded-full', bandBg[s.band])} />
                      {s.label} · {s.range}
                    </span>
                  </button>
                )
              })}
            </div>
            {band && <BandAccounts band={band} filters={filters} onClearFilters={onClearFilters} onClose={() => setBand(null)} />}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function BandAccounts({ band, filters, onClearFilters, onClose }: {
  band: LiveBand; filters: Filters; onClearFilters: () => void; onClose: () => void
}) {
  const tier = ARR_TIERS.find(t => t.key === filters.arr)
  const list = rows
    .filter(r => isLive(r) && bandOf(r.health) === band)
    .filter(r => filters.stage === 'all' || r.stage === filters.stage)
    .filter(r => !tier || tier.test(r.carr))
    .sort((a, b) => b.carr - a.carr)
  const filtered = filters.stage !== 'all' || !!tier

  return (
    <div className="mt-5 border-t border-hairline pt-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium">{BAND_LABEL[band]} accounts</h3>
        <span className="text-xs text-muted-foreground">
          {list.length} from My accounts{filtered ? ', filtered' : ''}, by CARR
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go('accounts')}>Open My accounts<ArrowRight aria-hidden="true" /></Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState
          title={`No ${BAND_LABEL[band].toLowerCase()} accounts match these filters`}
          sub="Stage and ARR filters narrow this list."
          action={filtered ? 'Clear filters' : undefined}
          onAction={onClearFilters}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Health</TableHead>
              <TableHead className="text-right">CARR</TableHead>
              <TableHead className="text-right">Renewal</TableHead>
              <TableHead className="w-6"><span className="sr-only">Open</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map(r => {
              const open = r.name === 'TransAmerica'
              const rr = renewal(r)
              return (
                <TableRow
                  key={r.name}
                  className={cn(open && 'cursor-pointer')}
                  onClick={open ? () => go('account') : undefined}
                >
                  <TableCell className="font-medium">
                    {open ? (
                      <button type="button" className="rounded-sm text-left outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => go('account')}>
                        {r.name}
                      </button>
                    ) : r.name}
                    <span className="block text-xs font-normal text-muted-foreground">{r.ind} · {r.seg}</span>
                  </TableCell>
                  <TableCell>{r.stage}</TableCell>
                  <TableCell><HealthBar value={r.health} /></TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.carr)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', rr.days <= 60 && 'text-bad')}>{rr.t}</TableCell>
                  <TableCell>{open && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
