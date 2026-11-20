import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, ChevronRight, HeartPulse } from 'lucide-react'
import { BAND_LABEL, bandBg, bandOf, bandText, HealthBar, type Band } from '@/components/health'
import { SplitBar } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Term } from '../account/overview/bits'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { money } from '@/data/legacy'
import { fmtFull } from '@/lib/dates'
import { go } from '@/lib/route'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, SplitSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { ARR_TIERS, BANDS, BOOK, isLive, renewal, rows } from './data'
import type { Filters } from './filters'

type LiveBand = Exclude<Band, 'none'>

// this split IS health, so its segments take the health colours
const BAND_COLOR: Record<LiveBand, string> = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' }

export function BandSplit({ status, onRetry, filters, onClearFilters }: {
  status: WidgetStatus; onRetry: () => void; filters: Filters; onClearFilters: () => void
}) {
  const [band, setBand] = useState<LiveBand | null>(null)
  const toggle = (b: LiveBand) => setBand(cur => (cur === b ? null : b))
  const listRef = useRef<HTMLDivElement>(null)
  // the account list opens under the bands; when that is below the fold, say so and offer a jump
  useEffect(() => {
    if (!band) return
    const id = requestAnimationFrame(() => {
      const el = listRef.current
      if (!el || el.getBoundingClientRect().top < window.innerHeight - 48) return
      toast(`${BAND_LABEL[band]} accounts listed below`, {
        id: 'band-list',
        action: { label: 'Show', onClick: () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
      })
    })
    return () => cancelAnimationFrame(id)
  }, [band])
  const counts = useMemo(() => {
    const c: Record<LiveBand, number> = { good: 0, warn: 0, bad: 0 }
    rows.forEach(r => { const b = bandOf(r.health); if (isLive(r) && b !== 'none') c[b]++ })
    return c
  }, [])

  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={HeartPulse} title={`Where the $${BOOK.arr}M sits by health`} />
      <div className="px-5 py-4">
        {status === 'loading' && <><LoadingLabel what="health split" /><SplitSkeleton /></>}
        {status === 'error' && (
          <WidgetError title="The health split didn't load" sub="The portfolio summary timed out. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && (
          <>
            <SplitBar label="ARR by health band" legend={false}
              parts={BANDS.map(s => ({ key: s.band, label: s.label, value: s.arr, color: BAND_COLOR[s.band] }))}
              format={v => `$${v}M`} selected={band} onSelect={k => toggle(k as LiveBand)} />
            <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group" aria-label="Health bands">
              {BANDS.map(s => {
                const on = band === s.band
                return (
                  <button
                    key={s.band}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.band)}
                    className={cn(
                      'grid cursor-pointer gap-0.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring',
                      on && 'border-border bg-accent',
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn('size-2 rounded-full', bandBg[s.band])} aria-hidden="true" />
                      <span className="text-foreground">{s.label}</span> {s.range}
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className={cn('text-xl tabular-nums tracking-[-0.02em]', bandText[s.band])}>${s.arr}M</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{Math.round((s.arr / BOOK.arr) * 100)}%</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{counts[s.band]} in My accounts</span>
                  </button>
                )
              })}
            </div>
            {band && <div ref={listRef} className="scroll-mt-20"><BandAccounts band={band} filters={filters} onClearFilters={onClearFilters} onClose={() => setBand(null)} /></div>}
          </>
        )}
      </div>
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
              <TableHead className="text-right"><Term>CARR</Term></TableHead>
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
                  className={cn(open ? 'cursor-pointer' : 'hover:bg-transparent')}
                  onClick={open ? () => go('account') : undefined}
                >
                  <TableCell className="font-medium">
                    {open ? (
                      <button type="button" className="rounded-sm text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={e => { e.stopPropagation(); go('account') }}>
                        {r.name}
                      </button>
                    ) : r.name}
                    <span className="block text-xs font-normal text-muted-foreground">{r.ind} · {r.seg}</span>
                  </TableCell>
                  <TableCell>{r.stage}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={open ? -1 : 0} className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><HealthBar value={r.health} /></span>
                      </TooltipTrigger>
                      <TooltipContent>Health {r.health} of 100 · {BAND_LABEL[bandOf(r.health)]}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.carr)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', rr.days <= 60 && 'text-bad')}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={open ? -1 : 0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{rr.t}</span>
                      </TooltipTrigger>
                      <TooltipContent>Renews {fmtFull(r.renew)}</TooltipContent>
                    </Tooltip>
                  </TableCell>
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
