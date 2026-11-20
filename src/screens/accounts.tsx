import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CalendarClock, Columns3, Copy, ExternalLink, HeartPulse, LayoutList, Pin, PinOff, RotateCcw, Search, X } from 'lucide-react'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { money, TODAY } from '@/data/legacy'
import { fmtFull } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { titleCase } from '@/lib/text'
import { go } from '@/lib/route'
import { BAND_LABEL, bandBg, bandOf, bandText, isMissing } from '@/components/health'
import { Empty, Meter, PageHeader, SortHead, Stat, stickyCol, TableFooterBar } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DEFAULT_HIDDEN, filterCount, FIRST_DIR, GROUP_LABEL, NO_FILTERS, OPTIONAL_COLS, OWNER, passes, reason, rows as ALL_ROWS, sortRows, SORT_NAME, summary, VIEWS,
  type ColId, type FilterState, type Row, type SortKey, type ViewId,
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

/** Group header: a tinted row with an icon tile, the group name, its count and what puts a row there. */
const GROUP_LOOK = {
  pinned: { icon: Pin, label: 'Pinned', hint: 'Kept at the top by you', tile: 'text-signal', row: 'bg-signal-soft/40' },
  renewal: { icon: CalendarClock, label: titleCase(GROUP_LABEL.renewal), hint: 'Renews within 90 days or overdue', tile: 'text-warn', row: 'bg-warn-soft/40' },
  health: { icon: HeartPulse, label: titleCase(GROUP_LABEL.health), hint: 'Health under 40', tile: 'text-bad', row: 'bg-bad-soft/40' },
  rest: { icon: LayoutList, label: '', hint: '', tile: 'text-muted-foreground', row: 'bg-surface-2/60' },
} as const
function GroupRow({ group, count, first, restLabel }: { group: keyof typeof GROUP_LOOK; count: number; first: boolean; restLabel: string }) {
  const g = GROUP_LOOK[group], I = g.icon
  const label = titleCase(group === 'rest' ? `Other ${restLabel === 'All accounts' ? 'accounts' : restLabel.toLowerCase()}` : g.label)
  return (
    <TableRow className={cn('hover:bg-transparent', g.row, !first && 'border-t-8 border-t-card')}>
      <TableCell colSpan={99} className="h-10 py-1.5">
        <span className="flex items-center gap-2">
          <I className={cn('size-4 shrink-0', g.tile)} aria-hidden="true" />
          <span className="text-sm font-medium">{label}</span>
          <span className="rounded-sm bg-card px-1.5 text-xs font-medium tabular-nums text-muted-foreground">{count}</span>
          {g.hint && <span className="text-xs text-muted-foreground max-sm:hidden">· {g.hint}</span>}
        </span>
      </TableCell>
    </TableRow>
  )
}

/** Pinned accounts lead the list in every view. Remembered in this browser; TransAmerica starts pinned. */
const PIN_KEY = 'sah-pins'
function usePins() {
  const [pins, setPins] = useState<Set<string>>(() => {
    try { const v = localStorage.getItem(PIN_KEY); return new Set(v ? JSON.parse(v) : ['TransAmerica']) } catch { return new Set(['TransAmerica']) }
  })
  const toggle = (name: string) => {
    const n = new Set(pins)
    if (n.has(name)) n.delete(name); else n.add(name)
    setPins(n)
    try { localStorage.setItem(PIN_KEY, JSON.stringify([...n])) } catch {}
    toast(n.has(name) ? `Pinned ${name}` : `Unpinned ${name}`)
  }
  return [pins, toggle] as const
}

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
  const [pins, togglePin] = usePins()

  const priority = pinned && view === 'needs'
  const query = q.trim().toLowerCase()
  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, data.filter(v.test).length])), [data])
  const list = useMemo(() => {
    const v = VIEWS.find(x => x.id === view)!
    const f = data.filter(v.test)
      .filter(r => passes(r, filters))
      .filter(r => !query || `${r.name} ${r.ind} ${r.seg}`.toLowerCase().includes(query))
    const sorted = sortRows(f, sortKey, sortDir, priority)
    return [...sorted.filter(r => pins.has(r.name)), ...sorted.filter(r => !pins.has(r.name))] // pinned rows lead in every view
  }, [data, view, filters, query, sortKey, sortDir, priority, pins])

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
      <PageHeader title="My accounts" sub={`${OWNER}'s book · ${today} · ${data.length} accounts`} />

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

      <Card className="min-w-0 gap-0 py-0">
        {status === 'error' ? (
          <div className="p-4 sm:p-5">
            <Empty title="Couldn't load your accounts" sub="The account list didn't respond. Your filters are kept; try again." />
            <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" onClick={retry}><RotateCcw />Try again</Button></div>
          </div>
        ) : (
          <>
            {/* one toolbar row: saved views left ("More" last); search, Filter, Columns, Reset right; all 32px.
                On phones the views scroll and search drops below. */}
            <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 lg:flex-nowrap">
              <div className="order-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto max-sm:basis-full">
                <ToggleGroup type="single" variant="outline" spacing={0} value={PRIMARY.includes(view) ? view : ''} aria-label="Saved views"
                  onValueChange={v => v && setView(v as ViewId)}>
                  {VIEWS.filter(v => PRIMARY.includes(v.id)).map(v => (
                    <ToggleGroupItem key={v.id} value={v.id} className="h-8 gap-1.5 px-3! data-[state=on]:bg-muted data-[state=on]:text-foreground">
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
                <Table aria-label="Accounts" className="min-w-[760px] sm:[&_td:first-child]:pl-5 sm:[&_td:last-child]:pr-5 sm:[&_th:first-child]:pl-5 sm:[&_th:last-child]:pr-5">
                  <TableHeader>
                    <TableRow>
                      {sortHead('name', 'Account', { sticky: true })}
                      {sortHead('health', 'Health')}
                      {sortHead('renew', 'Renewal', { tip: 'Time to the renewal date' })}
                      {sortHead('carr', 'ARR', { numeric: true, tip: 'Contracted annual recurring revenue (CARR)' })}
                      {show('nrr') && sortHead('nrr', 'NRR', { numeric: true, tip: 'Net revenue retention; GRR on hover' })}
                      <TableHead>Why it's here</TableHead>
                      {show('stage') && <TableHead>Stage</TableHead>}
                      {show('repo') && sortHead('repo', 'Repository', { numeric: true })}
                      {show('lic') && sortHead('lic', 'Licence use', { numeric: true, tip: 'Seats in use against seats bought' })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r, i) => {
                      const b = bandOf(r.health)
                      const pin = pins.has(r.name)
                      // pinned rows lead; the rest split by reason under "Needs me first", else sit under one "rest" header
                      const hasPinned = pins.has(list[0].name)
                      const groupOf = (x: Row) => (pins.has(x.name) ? 'pinned' : priority ? reason(x).group : hasPinned ? 'rest' : undefined)
                      const grp = groupOf(r)
                      const newGroup = grp && grp !== (i ? groupOf(list[i - 1]) : undefined)
                      return (
                        <Fragment key={r.name}>
                        {newGroup && (
                          <GroupRow group={grp} count={list.filter(x => groupOf(x) === grp).length} first={i === 0} restLabel={viewLabel} />
                        )}
                        <ContextMenu>
                        <ContextMenuTrigger asChild>
                        <TableRow tabIndex={0} aria-label={`${r.name}, health ${BAND_LABEL[b]}. Open account`}
                          className="cursor-pointer focus-visible:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>td]:h-14 [&>td]:py-2"
                          onClick={() => openRow(r)}
                          onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRow(r) } }}>
                          <TableCell className={cn(stickyCol, 'max-w-72')}>
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate font-medium">{r.name}</span>
                              {pin && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" aria-label={`Unpin ${r.name}`} onClick={e => { e.stopPropagation(); togglePin(r.name) }}
                                      className="grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
                                      <Pin className="size-3.5" aria-hidden="true" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Pinned · click to unpin</TooltipContent>
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
                                className="inline-flex h-6 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                onFocus={() => setIns(s => (s?.name === r.name ? s : { name: r.name, focus: false }))}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIns({ name: r.name, focus: true }) } }}>
                                {isMissing(r.health) ? <span className="text-muted-foreground">No data</span>
                                  : <span className={cn('font-medium tabular-nums', bandText[b])}>{r.health}</span>}
                              </span>
                            </InsightsPopover>
                          </TableCell>
                          <TableCell><RunwayCell row={r} /></TableCell>
                          <TableCell className="text-right">{money(r.carr)}</TableCell>
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
                          <ContextMenuItem onSelect={() => togglePin(r.name)}>{pin ? <><PinOff />Unpin</> : <><Pin />Pin to top</>}</ContextMenuItem>
                          <ContextMenuItem onSelect={() => { navigator.clipboard?.writeText(r.name); toast('Account name copied') }}><Copy />Copy name</ContextMenuItem>
                        </ContextMenuContent>
                        </ContextMenu>
                        </Fragment>
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

/** A headline tile that filters the table; pressing it again goes back to "Needs me first". */
function TileButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label}
      className={cn('h-full rounded-xl text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring [&>*]:transition-colors hover:[&>*]:bg-accent/40',
        active && 'ring-2 ring-foreground/80')}>
      {children}
    </button>
  )
}

const ShareMeter = ({ part, of }: { part: number; of: number }) => (
  <Meter value={part} max={of || 1} tone="bad" label="Share of ARR" showValue={`${of ? Math.round((part / of) * 100) : 0}% of ARR`} />
)
