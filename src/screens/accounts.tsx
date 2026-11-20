import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Ban, CalendarClock, CircleCheck, Columns3, Copy, ExternalLink, HeartPulse, RotateCcw, TrendingDown, TrendingUp, X, type LucideIcon } from 'lucide-react'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { money, TODAY } from '@/data/legacy'
import { fmtFull } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { titleCase } from '@/lib/text'
import { openAccount } from '@/lib/route'
import { BAND_LABEL, bandBg, bandOf, bandText, isMissing } from '@/components/health'
import { SearchBox } from '@/components/app/search-box'
import { Empty, HeaderFacts, Meter, PageHeader, SEGMENTED, SortHead, Stat, stickyCol, TableFooterBar } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DEFAULT_HIDDEN, filterCount, FIRST_DIR, NO_FILTERS, OPTIONAL_COLS, passes, reason, rows as ALL_ROWS, sortRows, SORT_NAME, summary, VIEWS,
  type Category, type ColId, type FilterState, type Row, type SortKey, type ViewId,
} from './accounts/model'
import {
  AccountFilter, BandSplit, FilterChips, InsightsPopover, NrrCell, ReasonCell, RunwayCell, TableSkeleton, TilesSkeleton,
} from './accounts/parts'

type Status = 'loading' | 'error' | 'ready'

/** Views shown as tabs; the rest are opened from the tiles above and show as a removable tab. */
const PRIMARY: ViewId[] = ['needs', 'all']
const SHORT_VIEW: Partial<Record<ViewId, string>> = { all: 'All' }
/** Always shown; listed in the Columns menu so it reads as the full set. */
const FIXED_COLS = ['Account', 'Health', 'Renewal', 'ARR', "Why it's here"]
const BAND_VIEW = { bad: 'risk', warn: 'watch', good: 'healthy' } as const

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

const today = fmtFull(TODAY)

/** Category chip: neutral on purpose (green/amber/red mean health only); the icon carries the kind. */
const CATEGORY_ICON: Record<Category, LucideIcon> = {
  'Renewal risk': CalendarClock, 'Low health': HeartPulse, Contracting: TrendingDown, Expanding: TrendingUp, 'On track': CircleCheck, Churned: Ban,
}
function CategoryChip({ c }: { c: Category }) {
  const I = CATEGORY_ICON[c]
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-sm bg-muted px-2 text-xs whitespace-nowrap text-foreground">
      <I className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />{c}
    </span>
  )
}

export function AccountsScreen() {
  const { status, data, retry } = useAccounts()
  // a link from Portfolio can name the saved view to land on: #accounts?view=risk
  const [view, setView] = useState<ViewId>(() => {
    const v = new URLSearchParams(location.hash.split('?')[1] ?? '').get('view')
    return VIEWS.some(x => x.id === v) ? (v as ViewId) : 'needs'
  })
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

  const sum = useMemo(() => summary(data), [data])
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
  // every account opens an account page: its own for TransAmerica and the mock accounts, TransAmerica's otherwise
  const openRow = useCallback((r: Row) => { setIns(null); openAccount(r.name) }, [])
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
  // the table is table-fixed: column widths (`w`) come from the header, not the rows shown, so switching views never
  // shifts columns; "Why it's here" has no width and takes what is left
  const sortHead = (k: SortKey, children: React.ReactNode, opts: { numeric?: boolean; sticky?: boolean; tip?: string; w?: string } = {}) => (
    <SortHead key={k} active={!priority && sortKey === k} dir={sortDir} onSort={() => sortBy(k)} numeric={opts.numeric} sticky={opts.sticky} title={opts.tip} className={opts.w}>{children}</SortHead>
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader title="My accounts" sub={`Updated ${today}`}
        actions={status === 'ready' && (
          <HeaderFacts items={[['accounts', data.length], ['total ARR', money(sum.arr)]]} />
        )} />

      {status === 'loading' ? <TilesSkeleton /> : status === 'error' ? null : (
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
          <TileButton active={view === 'renew'} onClick={() => setView(v => (v === 'renew' ? 'needs' : 'renew'))} label="Show accounts renewing in 90 days">
            <Stat icon={CalendarClock} label="Renewing in 90 days" value={money(sum.renew.arr)} tone={sum.renew.overdue ? 'bad' : undefined}
              visual={<ShareMeter part={sum.renew.arr} of={sum.arr} />}
              hint={`${sum.renew.n} accounts${sum.renew.overdue ? ` · ${sum.renew.overdue} overdue` : ''}`} />
          </TileButton>
          <TileButton active={view === 'risk'} onClick={() => setView(v => (v === 'risk' ? 'needs' : 'risk'))} label="Show accounts with health under 40">
            <Stat icon={AlertTriangle} label="Low health, under 40" value={money(sum.low.arr)} tone={sum.low.n ? 'bad' : undefined}
              visual={<ShareMeter part={sum.low.arr} of={sum.arr} />}
              hint={`${sum.low.n} accounts`} />
          </TileButton>
          <Stat icon={HeartPulse} label="Average health" tone={sum.health.avg == null ? undefined : bandOf(sum.health.avg) === 'none' ? undefined : bandOf(sum.health.avg) as 'good' | 'warn' | 'bad'}
            value={sum.health.avg == null ? 'No data' : <>{sum.health.avg}<span className="text-sm text-muted-foreground">/100</span></>}
            visual={<BandSplit bands={sum.health.bands} />}
            hint={<span className="flex gap-3">{sum.health.bands.map(b => {
              const id = BAND_VIEW[b.band]
              return (
                <button key={b.band} type="button" onClick={() => setView(v => (v === id ? 'needs' : id))} aria-pressed={view === id}
                  className={cn('rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50', view === id && 'font-medium text-foreground')}>
                  {b.n} {b.band === 'bad' ? 'at risk' : b.band === 'warn' ? 'watch' : 'healthy'}
                </button>
              )
            })}</span>} />
        </div>
      )}

      {status === 'error' ? (
        <Card data-block className="min-w-0 gap-0 py-0">
          <div className="p-4 sm:p-5">
            <Empty title="Couldn't load your accounts" sub="The account list didn't respond. Your filters are kept; try again." />
            <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" onClick={retry}><RotateCcw />Try again</Button></div>
          </div>
        </Card>
      ) : (
        <div className="grid min-w-0 gap-3">
            {/* one toolbar row: saved views left ("More" last); search, Filter, Columns, Reset right; all 32px.
                On phones the views scroll and search drops below. */}
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
              <div className="order-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto max-sm:basis-full">
                <ToggleGroup type="single" spacing={0} value={PRIMARY.includes(view) ? view : ''} aria-label="Saved views"
                  onValueChange={v => v && setView(v as ViewId)} className={SEGMENTED.group}>
                  {VIEWS.filter(v => PRIMARY.includes(v.id)).map(v => (
                    <ToggleGroupItem key={v.id} value={v.id} className={SEGMENTED.item}>
                      {v.band && (
                        <Tooltip>
                          <TooltipTrigger asChild><span className={cn('size-1.5 rounded-full', bandBg[v.band])} aria-hidden="true" /></TooltipTrigger>
                          <TooltipContent>{v.band === 'bad' ? 'Health under 40' : v.band === 'warn' ? 'Health 40 to 69' : 'Health 70 or more'}</TooltipContent>
                        </Tooltip>
                      )}
                      {titleCase(SHORT_VIEW[v.id] ?? v.label)}
                      <span className="tabular-nums text-muted-foreground">{status === 'loading' ? '–' : counts[v.id]}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {moreView && (
                  <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-muted pl-2.5 pr-0.5 text-sm">
                    {moreView.band && <span className={cn('size-1.5 rounded-full', bandBg[moreView.band])} aria-hidden="true" />}
                    {titleCase(moreView.label)}<span className="tabular-nums text-muted-foreground">{counts[moreView.id]}</span>
                    <Button variant="ghost" size="icon-xs" aria-label={`Clear ${moreView.label}`} onClick={() => setView('needs')}><X /></Button>
                  </span>
                )}
              </div>

              <div className="order-2 ml-auto flex shrink-0 items-center gap-2">
                <SearchBox value={q} onChange={setQ} placeholder="Search accounts" />
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
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Columns</DropdownMenuLabel>
                    {FIXED_COLS.map(c => (
                      <DropdownMenuCheckboxItem key={c} checked disabled>{c}</DropdownMenuCheckboxItem>
                    ))}
                    {OPTIONAL_COLS.map(c => (
                      <DropdownMenuCheckboxItem key={c.id} checked={show(c.id)} onSelect={e => e.preventDefault()}
                        onCheckedChange={on => setHidden(h => { const n = new Set(h); if (on) n.delete(c.id); else n.add(c.id); return n })}>
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={DEFAULT_HIDDEN.length === hidden.size && DEFAULT_HIDDEN.every(c => hidden.has(c))}
                      onSelect={() => setHidden(new Set(DEFAULT_HIDDEN))}><RotateCcw />Reset columns</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {dirty && <Button variant="ghost" onClick={reset}><RotateCcw />Reset</Button>}
              </div>

            </div>

            {nFilters > 0 && (
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Active filters">
                <FilterChips value={filters} onChange={changeFilters} />
                <Button variant="ghost" size="sm" onClick={() => changeFilters(NO_FILTERS)}>Clear all</Button>
              </div>
            )}

            <Card data-block className="min-w-0 gap-0 py-0">
            <div>
              {status === 'loading' ? <TableSkeleton /> : !data.length ? (
                <div className="p-4 sm:p-5"><Empty title="No accounts in your book yet" sub="Accounts assigned to you will appear here with their health and renewal." /></div>
              ) : !list.length ? (
                <div className="p-4 sm:p-5">
                  <Empty title={query ? `No accounts match “${q.trim()}”` : 'No accounts match these filters'}
                    sub={`Search and filters apply within the ${viewLabel.toLowerCase()} view.`} />
                  <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" onClick={reset}><RotateCcw />Reset search and filters</Button></div>
                </div>
              ) : (
                <Table aria-label="Accounts" className="min-w-[960px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      {sortHead('name', 'Account', { sticky: true, w: 'w-[17rem]' })}
                      <TableHead className="w-[9.5rem]">Category</TableHead>
                      {sortHead('health', 'Health', { w: 'w-[6rem]' })}
                      {sortHead('renew', 'Renewal', { tip: 'Time to the renewal date', w: 'w-[13rem]' })}
                      {sortHead('carr', 'ARR', { tip: 'Contracted annual recurring revenue (CARR)', w: 'w-[7rem]' })}
                      {show('nrr') && sortHead('nrr', 'NRR', { numeric: true, tip: 'Net revenue retention; GRR on hover', w: 'w-[6rem]' })}
                      <TableHead>Why it's here</TableHead>
                      {show('stage') && <TableHead className="w-[10rem]">Stage</TableHead>}
                      {show('repo') && sortHead('repo', 'Repository', { numeric: true, w: 'w-[8rem]' })}
                      {show('lic') && sortHead('lic', 'Licence use', { numeric: true, tip: 'Seats in use against seats bought', w: 'w-[8rem]' })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map(r => {
                      const b = bandOf(r.health)
                      return (
                        <ContextMenu key={r.name}>
                        <ContextMenuTrigger asChild>
                        <TableRow tabIndex={0} aria-label={`${r.name}, health ${BAND_LABEL[b]}. Open account`}
                          className="cursor-pointer focus-visible:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>td]:py-2"
                          onClick={() => openRow(r)}
                          onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRow(r) } }}>
                          <TableCell className={stickyCol}>
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate font-medium">{r.name}</span>
                              <span className="truncate text-xs text-muted-foreground">{r.ind}</span>
                            </span>
                          </TableCell>
                          <TableCell><CategoryChip c={reason(r).category} /></TableCell>
                          <TableCell onClick={e => { e.stopPropagation(); clearTimeout(timer.current); setIns({ name: r.name, focus: true }) }}>
                            <InsightsPopover row={r} open={ins?.name === r.name} focusOnOpen={!!ins?.focus}
                              onOpenChange={o => setIns(o ? { name: r.name, focus: true } : null)}
                              onHover={() => hoverIn(r.name)} onLeave={hoverOut} onOpenRow={() => openRow(r)}>
                              <span tabIndex={0} role="button" aria-haspopup="dialog" aria-label={`Health ${isMissing(r.health) ? 'No data' : r.health}, ${BAND_LABEL[b]}. Insights for ${r.name}`}
                                className="inline-flex h-6 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                onFocus={() => setIns(s => (s?.name === r.name ? s : { name: r.name, focus: false }))}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIns({ name: r.name, focus: true }) } }}>
                                {isMissing(r.health) ? <span className="text-muted-foreground">No data</span>
                                  : <span className={cn('num font-medium', bandText[b])}>{r.health}</span>}
                              </span>
                            </InsightsPopover>
                          </TableCell>
                          <TableCell><RunwayCell row={r} /></TableCell>
                          <TableCell className="num">{money(r.carr)}</TableCell>
                          {show('nrr') && <TableCell className="text-right"><NrrCell row={r} /></TableCell>}
                          <TableCell className="max-w-80"><ReasonCell row={r} /></TableCell>
                          {show('stage') && <TableCell className="text-muted-foreground">{r.stage}</TableCell>}
                          {show('repo') && <TableCell className="text-right">{r.repo.toLocaleString()}</TableCell>}
                          {show('lic') && (
                            <TableCell className="text-right">
                              {r.lic == null ? <span className="text-muted-foreground">No data</span> : `${r.lic}%`}
                            </TableCell>
                          )}
                        </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <ContextMenuItem onSelect={() => openRow(r)}><ExternalLink />Open account</ContextMenuItem>
                          <ContextMenuItem onSelect={() => setIns({ name: r.name, focus: true })}><HeartPulse />Show health insights</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onSelect={() => { navigator.clipboard?.writeText(r.name); toast('Account name copied') }}><Copy />Copy name</ContextMenuItem>
                        </ContextMenuContent>
                        </ContextMenu>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            {status === 'ready' && list.length > 0 && (
              <TableFooterBar shown={list.length} total={data.length}>
                {/* sort order is announced to screen readers only; the header arrows show it on screen */}
                <span aria-live="polite" className="sr-only">{priority ? 'Sorted by what needs you first' : `Sorted by ${SORT_NAME[sortKey]}, ${sortDir === 'asc' ? 'ascending' : 'descending'}`}</span>
              </TableFooterBar>
            )}
            </Card>
        </div>
      )}

    </div>
  )
}

/** A headline tile that filters the table; pressing it again goes back to "Needs me first". */
function TileButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label}
      className={cn('h-full rounded-xl text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring [&>*]:transition-shadow hover:[&>*]:shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_14%,transparent),0_4px_14px_rgb(11_24_33/0.07)]',
        active && 'ring-2 ring-foreground/80')}>
      {children}
    </button>
  )
}

const ShareMeter = ({ part, of }: { part: number; of: number }) => (
  <Meter value={part} max={of || 1} tone="bad" label="Share of ARR" showValue={`${of ? Math.round((part / of) * 100) : 0}% of ARR`} />
)
