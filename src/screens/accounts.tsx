import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Building2, ChevronDown, Columns3, DollarSign, HeartPulse, Pin, RotateCcw, Search, Target, X } from 'lucide-react'
import { money, TODAY } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { go } from '@/lib/route'
import { BAND_LABEL, bandBg, bandOf, bandText, isMissing } from '@/components/health'
import { BlockHeader, Empty, Meter, PageHeader, SortHead, Stat, stickyCol, TableFooterBar } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BOOK, avgBand, DEFAULT_HIDDEN, filterCount, FIRST_DIR, isTA, NO_FILTERS, OPTIONAL_COLS, passes, rows as ALL_ROWS, sortRows, SORT_NAME, VIEWS,
  type ColId, type FilterState, type Row, type SortKey, type ViewId,
} from './accounts/model'
import {
  AccountFilter, FilterChips, InsightsPopover, PodArrSplit, NrrCell, RunwayCell, SignalsCell, TableSkeleton, TilesSkeleton,
} from './accounts/parts'

type Status = 'loading' | 'error' | 'ready'

/** Views shown as segments; the rest sit in the More menu. */
const PRIMARY: ViewId[] = ['needs', 'all', 'risk', 'watch', 'healthy']
const SHORT_VIEW: Partial<Record<ViewId, string>> = { all: 'All' }

/** Fixture "fetch". `?accounts=loading|error|empty` in the URL forces a state for review. */
function useAccounts() {
  const force = new URLSearchParams(location.search).get('accounts')
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (force === 'loading') return
    setStatus('loading')
    const t = setTimeout(() => {
      setStatus(force === 'error' ? 'error' : 'ready')
      if (force === 'error' && attempt > 0) toast.error("Couldn't load your accounts", { action: { label: 'Retry', onClick: () => setAttempt(a => a + 1) } })
    }, 350)
    return () => clearTimeout(t)
  }, [attempt, force])
  const data = force === 'empty' ? [] : ALL_ROWS
  return { status, data, retry: () => setAttempt(a => a + 1) }
}

const today = TODAY.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export function AccountsScreen() {
  const { status, data, retry } = useAccounts()
  const [view, setView] = useState<ViewId>('needs')
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>('health')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [pinned, setPinned] = useState(true)
  const [hidden, setHidden] = useState<Set<ColId>>(() => new Set(DEFAULT_HIDDEN))
  const filterBtn = useRef<HTMLButtonElement>(null)

  const priority = pinned && view === 'needs'
  const query = q.trim().toLowerCase()
  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, data.filter(v.test).length])), [data])
  const list = useMemo(() => {
    const v = VIEWS.find(x => x.id === view)!
    const f = data.filter(v.test)
      .filter(r => passes(r, filters))
      .filter(r => !query || `${r.name} ${r.ind} ${r.seg}`.toLowerCase().includes(query))
    return sortRows(f, sortKey, sortDir, priority)
  }, [data, view, filters, query, sortKey, sortDir, priority])

  const nFilters = filterCount(filters)
  // Reset covers search, filters and sort; switching views is not something to reset
  const dirty = !!q || nFilters > 0 || !pinned || sortKey !== 'health' || sortDir !== 'asc'
  const reset = () => {
    setQ(''); setFilters(NO_FILTERS); setPinned(true); setSortKey('health'); setSortDir('asc')
    toast('Filters reset', { description: 'Search, filters and sort are back to their defaults' })
  }
  const moreView = PRIMARY.includes(view) ? null : VIEWS.find(v => v.id === view)!
  const sortBy = (k: SortKey) => {
    setPinned(false)
    if (!priority && sortKey === k) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(FIRST_DIR[k]) }
  }
  // every account opens its account page (only TransAmerica has data in this build)
  const openRow = useCallback((_r: Row) => { setIns(null); go('account') }, [])
  const changeFilters = (f: FilterState) => {
    const removed = filterCount(f) < nFilters
    setFilters(f)
    if (removed) requestAnimationFrame(() => filterBtn.current?.focus())
  }

  /* insights popover: one at a time; opens after 220ms hover or on focus (no focus move), on click with focus */
  const [ins, setIns] = useState<{ name: string; focus: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hoverIn = (name: string) => { clearTimeout(timer.current); if (ins?.name !== name) timer.current = setTimeout(() => setIns({ name, focus: false }), 220) }
  const hoverOut = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setIns(null), 250) }
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { // close on page scroll, like the legacy popover
    if (!ins) return
    const at = Date.now(), on = () => Date.now() - at > 400 && setIns(null)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [ins])

  const show = (c: ColId) => !hidden.has(c)
  const viewLabel = VIEWS.find(v => v.id === view)!.label
  const sortHead = (k: SortKey, children: React.ReactNode, opts: { numeric?: boolean; sticky?: boolean; tip?: string } = {}) => (
    <SortHead key={k} active={!priority && sortKey === k} dir={sortDir} onSort={() => sortBy(k)} numeric={opts.numeric} sticky={opts.sticky} title={opts.tip}>{children}</SortHead>
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader title="My accounts"
        sub={`${BOOK.owner}'s book · ${today} · ${BOOK.count} accounts`} />

      {status === 'loading' ? <TilesSkeleton /> : status === 'error' ? null : (
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={DollarSign} label="Portfolio ARR" value={BOOK.arr} hint={`By pod · ${BOOK.arrPer} average per account`} visual={<PodArrSplit />} />
          <Stat icon={AlertTriangle} label="ARR at risk" value={BOOK.atRisk} tone="bad" hint="Health under 40 or unsigned"
            visual={<Meter value={BOOK.atRiskM} max={BOOK.arrM} tone="bad" label="Share of ARR at risk" showValue={`${Math.round((BOOK.atRiskM / BOOK.arrM) * 100)}% of ARR`} />} />
          <Stat icon={Target} label="Open pipeline" value={BOOK.pipeline} hint={`${BOOK.opps} opportunities`}
            visual={<Meter value={BOOK.pipelineM} max={BOOK.arrM} label="Pipeline against ARR" showValue={`${Math.round((BOOK.pipelineM / BOOK.arrM) * 100)}% of ARR`} />} />
          <Stat icon={HeartPulse} label="Average health" tone={avgBand === 'none' ? undefined : avgBand}
            value={<>{BOOK.avgHealth}<span className="text-sm text-muted-foreground">/100</span></>} hint="Across the book"
            visual={<Meter value={BOOK.avgHealth} tone={avgBand === 'none' ? undefined : avgBand} label="Average health out of 100" />} />
        </div>
      )}

      <Card className="min-w-0 gap-0 py-0">
        <BlockHeader icon={Building2} title="Accounts" count={status === 'ready' ? list.length : undefined} />

        {status === 'error' ? (
          <div className="p-4 sm:p-5">
            <Empty title="Couldn't load your accounts" sub="The account list didn't respond. Your filters are kept; try again." />
            <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" onClick={retry}><RotateCcw />Try again</Button></div>
          </div>
        ) : (
          <>
            {/* one toolbar row: saved views left ("More" last); search, Filter, Columns, Reset right; all 32px.
                On phones the views scroll and search drops below. */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5 lg:flex-nowrap">
              <div className="order-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                <ToggleGroup type="single" spacing={1} value={PRIMARY.includes(view) ? view : ''} aria-label="Saved views"
                  onValueChange={v => v && setView(v as ViewId)}>
                  {VIEWS.filter(v => PRIMARY.includes(v.id)).map(v => (
                    <ToggleGroupItem key={v.id} value={v.id} className="h-8 gap-1.5 px-2.5 data-[state=on]:text-foreground">
                      {v.band && (
                        <Tooltip>
                          <TooltipTrigger asChild><span className={cn('size-1.5 rounded-full', bandBg[v.band])} aria-hidden="true" /></TooltipTrigger>
                          <TooltipContent>{v.band === 'bad' ? 'Health under 40' : v.band === 'warn' ? 'Health 40 to 69' : 'Health 70 or more'}</TooltipContent>
                        </Tooltip>
                      )}
                      {SHORT_VIEW[v.id] ?? v.label}
                      <span className="tabular-nums text-muted-foreground">{status === 'loading' ? '–' : counts[v.id]}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="More saved views"
                      className={cn('shrink-0 gap-1.5 px-2.5', moreView ? 'bg-muted text-foreground' : 'text-muted-foreground')}>
                      {moreView ? <>{moreView.label}<span className="tabular-nums text-muted-foreground">{counts[moreView.id]}</span></> : 'More'}
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuRadioGroup value={view} onValueChange={v => setView(v as ViewId)}>
                      {VIEWS.filter(v => !PRIMARY.includes(v.id)).map(v => (
                        <DropdownMenuRadioItem key={v.id} value={v.id}>
                          {v.label}<span className="ml-auto tabular-nums text-xs text-muted-foreground">{status === 'loading' ? '–' : counts[v.id]}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="order-2 ml-auto flex shrink-0 items-center gap-2">
                <InputGroup className="hidden h-8 w-[200px] transition-[width] duration-200 focus-within:w-64 sm:flex">
                  <InputGroupAddon><Search /></InputGroupAddon>
                  <InputGroupInput type="search" placeholder="Search accounts" aria-label="Search accounts" autoComplete="off"
                    value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Escape' && setQ('')} />
                  {q && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQ('')}><X /></InputGroupButton></InputGroupAddon>}
                </InputGroup>
                <AccountFilter value={filters} onChange={changeFilters} rows={data} buttonRef={filterBtn} />
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" aria-label="Columns"><Columns3 /></Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Columns</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {OPTIONAL_COLS.map(c => (
                      <DropdownMenuCheckboxItem key={c.id} checked={show(c.id)} onSelect={e => e.preventDefault()}
                        onCheckedChange={on => setHidden(h => { const n = new Set(h); if (on) n.delete(c.id); else n.add(c.id); return n })}>
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {dirty && <Button variant="ghost" onClick={reset}><RotateCcw />Reset</Button>}
              </div>

              {/* phones: search on its own row */}
              <InputGroup className="order-3 h-8 w-full sm:hidden">
                <InputGroupAddon><Search /></InputGroupAddon>
                <InputGroupInput type="search" placeholder="Search accounts" aria-label="Search accounts" autoComplete="off"
                  value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Escape' && setQ('')} />
              </InputGroup>
            </div>

            {nFilters > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 sm:px-5" role="group" aria-label="Active filters">
                <FilterChips value={filters} onChange={changeFilters} />
                <Button variant="ghost" size="sm" onClick={() => changeFilters(NO_FILTERS)}>Clear all</Button>
              </div>
            )}

            <div className="border-t border-hairline">
              {status === 'loading' ? <TableSkeleton /> : !data.length ? (
                <div className="p-4 sm:p-5"><Empty title="No accounts in your book yet" sub="Accounts assigned to you will appear here with their health and renewal." /></div>
              ) : !list.length ? (
                <div className="p-4 sm:p-5">
                  <Empty title={query ? `No accounts match “${q.trim()}”` : 'No accounts match these filters'}
                    sub={`Search and filters apply within the ${viewLabel.toLowerCase()} view.`} />
                  <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" onClick={reset}><RotateCcw />Reset search and filters</Button></div>
                </div>
              ) : (
                <Table aria-label="Accounts" className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      {sortHead('name', 'Account', { sticky: true })}
                      {sortHead('health', 'Health')}
                      {sortHead('renew', 'Renewal', { tip: 'Time to the renewal date' })}
                      {sortHead('carr', 'ARR', { numeric: true, tip: 'Contracted annual recurring revenue (CARR)' })}
                      {show('nrr') && sortHead('nrr', 'NRR', { numeric: true, tip: 'Net revenue retention; GRR on hover' })}
                      {show('signals') && <TableHead>Signal</TableHead>}
                      {show('stage') && <TableHead>Stage</TableHead>}
                      {show('repo') && sortHead('repo', 'Repository', { numeric: true })}
                      {show('lic') && sortHead('lic', 'Licence use', { numeric: true, tip: 'Seats in use against seats bought' })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map(r => {
                      const b = bandOf(r.health)
                      const pin = isTA(r) && priority
                      return (
                        <TableRow key={r.name} tabIndex={0} aria-label={`${r.name}, health ${BAND_LABEL[b]}. Open account`}
                          className="cursor-pointer focus-visible:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>td]:h-11 [&>td]:py-1.5"
                          onClick={() => openRow(r)}
                          onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRow(r) } }}>
                          <TableCell className={cn(stickyCol, 'max-w-72')}>
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate font-medium">{r.name}</span>
                              {pin && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={-1} aria-label="Pinned first" className="shrink-0"><Pin className="size-3.5 text-muted-foreground" aria-hidden="true" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent>Pinned first because it changed since you last looked</TooltipContent>
                                </Tooltip>
                              )}
                              <span className="truncate text-xs text-muted-foreground">{r.ind}</span>
                            </span>
                          </TableCell>
                          <TableCell onClick={e => { e.stopPropagation(); clearTimeout(timer.current); setIns({ name: r.name, focus: true }) }}>
                            <InsightsPopover row={r} open={ins?.name === r.name} focusOnOpen={!!ins?.focus}
                              onOpenChange={o => setIns(o ? { name: r.name, focus: true } : null)}
                              onHover={() => hoverIn(r.name)} onLeave={hoverOut} onOpenRow={() => openRow(r)}>
                              <span tabIndex={0} role="button" aria-haspopup="dialog" aria-label={`Health ${isMissing(r.health) ? 'No data' : r.health}, ${BAND_LABEL[b]}. Insights for ${r.name}`}
                                className="inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                onFocus={() => setIns(s => (s?.name === r.name ? s : { name: r.name, focus: false }))}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIns({ name: r.name, focus: true }) } }}>
                                {isMissing(r.health) ? <span className="text-muted-foreground">No data</span> : <>
                                  <span className={cn('w-6 text-right font-medium tabular-nums', bandText[b])}>{r.health}</span>
                                  <Meter value={r.health} tone={b === 'none' ? undefined : b} className="w-10" />
                                </>}
                              </span>
                            </InsightsPopover>
                          </TableCell>
                          <TableCell><RunwayCell row={r} /></TableCell>
                          <TableCell className="text-right">{money(r.carr)}</TableCell>
                          {show('nrr') && <TableCell className="text-right"><NrrCell row={r} /></TableCell>}
                          {show('signals') && <TableCell><SignalsCell row={r} /></TableCell>}
                          {show('stage') && <TableCell className="text-muted-foreground">{r.stage}</TableCell>}
                          {show('repo') && <TableCell className="text-right">{r.repo.toLocaleString()}</TableCell>}
                          {show('lic') && (
                            <TableCell className="text-right">
                              {r.lic == null ? <span className="text-muted-foreground">No data</span> : `${r.lic}%`}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            {status === 'ready' && list.length > 0 && (
              <TableFooterBar shown={list.length} total={data.length} className="sm:px-5">
                <span aria-live="polite">{priority ? 'Sorted by what needs you first' : `Sorted by ${SORT_NAME[sortKey]}, ${sortDir === 'asc' ? 'ascending' : 'descending'}`}</span>
              </TableFooterBar>
            )}
          </>
        )}
      </Card>

    </div>
  )
}
