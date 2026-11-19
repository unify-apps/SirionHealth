import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Info, ListFilter, RotateCcw, Search, X } from 'lucide-react'
import { money, TODAY } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { go } from '@/lib/route'
import { BAND_LABEL, bandBg, bandOf, HealthBar } from '@/components/health'
import { Empty, PageHeader, Stat } from '@/components/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BOOK, avgBand, FILTERS, FIRST_DIR, isTA, OPTIONAL_COLS, rows as ALL_ROWS, sortRows, SORT_NAME, VIEWS,
  type ColId, type FilterId, type Row, type SortKey, type ViewId,
} from './accounts/model'
import {
  InsightsPopover, Monogram, NrrLine, PreviewSheet, RunwayCell, SignalsCell, TableSkeleton, TilesSkeleton,
} from './accounts/parts'

type Status = 'loading' | 'error' | 'ready'

/** Fixture "fetch". `?accounts=loading|error|empty` in the URL forces a state for review. */
function useAccounts() {
  const force = new URLSearchParams(location.search).get('accounts')
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (force === 'loading') return
    setStatus('loading')
    const t = setTimeout(() => setStatus(force === 'error' ? 'error' : 'ready'), 350)
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
  const [active, setActive] = useState<FilterId[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('health')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [pinned, setPinned] = useState(true)
  const [hidden, setHidden] = useState<Set<ColId>>(new Set())
  const [preview, setPreview] = useState<Row | null>(null)
  const filterBtn = useRef<HTMLButtonElement>(null)

  const priority = pinned && view === 'needs'
  const query = q.trim().toLowerCase()
  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, data.filter(v.test).length])), [data])
  const list = useMemo(() => {
    const v = VIEWS.find(x => x.id === view)!
    const f = data.filter(v.test)
      .filter(r => active.every(id => FILTERS.find(x => x.id === id)!.test(r)))
      .filter(r => !query || `${r.name} ${r.ind} ${r.seg}`.toLowerCase().includes(query))
    return sortRows(f, sortKey, sortDir, priority)
  }, [data, view, active, query, sortKey, sortDir, priority])

  const reset = () => { setQ(''); setActive([]); setPinned(true); setView('needs'); setSortKey('health'); setSortDir('asc') }
  const sortBy = (k: SortKey) => {
    setPinned(false)
    if (!priority && sortKey === k) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(FIRST_DIR[k]) }
  }
  const openRow = useCallback((r: Row) => { setIns(null); if (isTA(r)) go('account'); else setPreview(r) }, [])
  const removeFilter = (id: FilterId | '*') => {
    setActive(a => (id === '*' ? [] : a.filter(x => x !== id)))
    requestAnimationFrame(() => filterBtn.current?.focus())
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
  // a render helper, not a component: a component defined here would remount and drop focus on every sort
  const sortHead = (k: SortKey, children: React.ReactNode, className?: string) => {
    const on = !priority && sortKey === k
    const Icon = on ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <TableHead key={k} className={className} aria-sort={on ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" onClick={() => sortBy(k)}
          className={cn('-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            on ? 'text-foreground' : 'text-muted-foreground', className?.includes('text-right') && 'flex-row-reverse')}>
          {children}<Icon className={cn('size-3', !on && 'opacity-40')} aria-hidden="true" />
        </button>
      </TableHead>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader title="My accounts"
        sub={`${BOOK.owner}'s book · ${today} · ${BOOK.count} accounts`} />

      {status === 'loading' ? <TilesSkeleton /> : status === 'error' ? null : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Portfolio ARR" value={BOOK.arr} hint={`${BOOK.arrPer} average per account`} />
          <Stat label="ARR at risk" value={BOOK.atRisk} tone="bad" hint="Health under 40 or unsigned" />
          <Stat label="Open pipeline" value={BOOK.pipeline} hint={`${BOOK.opps} opportunities`} />
          <Stat label="Average health" tone={avgBand === 'none' ? undefined : avgBand}
            value={<>{BOOK.avgHealth}<span className="text-sm text-muted-foreground">/100</span></>} hint="Across the book" />
        </div>
      )}

      <Card className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-4 sm:px-5">
          <h2 className="text-base font-medium">Accounts</h2>
        </div>

        {status === 'error' ? (
          <div className="p-4 sm:p-5">
            <Empty title="Couldn't load your accounts" sub="The account list didn't respond. Your filters are kept; try again." />
            <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" onClick={retry}><RotateCcw />Try again</Button></div>
          </div>
        ) : (
          <>
            {/* saved views */}
            <div className="overflow-x-auto px-4 pt-3 sm:px-5">
              <ToggleGroup type="single" size="sm" spacing={1} value={view} aria-label="Saved views"
                onValueChange={v => v && setView(v as ViewId)}>
                {VIEWS.map(v => (
                  <ToggleGroupItem key={v.id} value={v.id} className="gap-1.5 data-[state=on]:text-foreground">
                    {v.band && <span className={cn('size-1.5 rounded-full', bandBg[v.band])} aria-hidden="true" />}
                    {v.label}
                    <span className="tabular-nums text-muted-foreground">{status === 'loading' ? '–' : counts[v.id]}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* list bar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
              <InputGroup className="w-full sm:w-64">
                <InputGroupAddon><Search /></InputGroupAddon>
                <InputGroupInput type="search" placeholder="Filter accounts..." aria-label="Search accounts" autoComplete="off"
                  value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Escape' && setQ('')} />
                {q && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQ('')}><X /></InputGroupButton></InputGroupAddon>}
              </InputGroup>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button ref={filterBtn} variant="outline" size="sm" disabled={active.length === FILTERS.length}><ListFilter />Filter</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel>Add a filter</DropdownMenuLabel>
                  {['Health', 'Renewal', 'Stage', 'Segment'].map(g => {
                    const items = FILTERS.filter(f => f.group === g && !active.includes(f.id))
                    return items.length ? (
                      <DropdownMenuGroup key={g}>
                        <DropdownMenuSeparator />
                        {items.map(f => <DropdownMenuItem key={f.id} onSelect={() => setActive(a => [...a, f.id])}>{f.label}</DropdownMenuItem>)}
                      </DropdownMenuGroup>
                    ) : null
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><Columns3 />Columns</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
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
              <Button variant="ghost" size="sm" onClick={reset}><RotateCcw />Reset</Button>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                <ArrowUpDown className="size-3" aria-hidden="true" />
                {priority ? 'Sorted by what needs you first' : `Sorted by ${SORT_NAME[sortKey]} ${sortDir === 'asc' ? '↑' : '↓'}`}
              </span>
            </div>

            {active.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 sm:px-5">
                {active.map(id => {
                  const f = FILTERS.find(x => x.id === id)!
                  return (
                    <Badge key={id} variant="outline" className="h-6 gap-1 rounded-md pr-0.5 font-normal">
                      {f.label}
                      <button type="button" aria-label={`Remove filter ${f.label}`} onClick={() => removeFilter(id)}
                        className="grid size-4 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  )
                })}
                <Button variant="outline" size="xs" onClick={() => removeFilter('*')}>Clear all</Button>
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
                <Table aria-label="Accounts" className="min-w-[860px]">
                  <TableHeader>
                    <TableRow className="border-hairline hover:bg-transparent">
                      {sortHead('name', 'Account', 'pl-4 sm:pl-5')}
                      {sortHead('health', 'Health')}
                      {sortHead('renew', 'Renewal')}
                      {sortHead('carr', 'ARR / NRR', 'text-right')}
                      {show('signals') && <TableHead className="text-xs text-muted-foreground">Signals</TableHead>}
                      {show('stage') && <TableHead className="text-xs text-muted-foreground">Stage</TableHead>}
                      {show('repo') && sortHead('repo', 'Repository', 'text-right')}
                      {show('lic') && sortHead('lic', 'Licence use', 'pr-4 text-right sm:pr-5')}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map(r => {
                      const b = bandOf(r.health)
                      return (
                        <TableRow key={r.name} tabIndex={0} aria-label={`${r.name}, health ${BAND_LABEL[b]}. ${isTA(r) ? 'Open account' : 'Preview account'}`}
                          className="cursor-pointer border-hairline hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          onClick={() => openRow(r)}
                          onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRow(r) } }}>
                          <TableCell className="py-2.5 pl-4 sm:pl-5">
                            <div className="flex items-center gap-2.5">
                              <Monogram row={r} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-medium" title={isTA(r) && priority ? 'Pinned first because it changed since you last looked' : undefined}>
                                  {r.name}
                                  {isTA(r) && priority && <Badge variant="secondary" className="h-4 rounded-sm px-1 text-[10px] text-signal">Pinned</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground">{r.seg} · {r.ind}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <InsightsPopover row={r} open={ins?.name === r.name} focusOnOpen={!!ins?.focus}
                              onOpenChange={o => setIns(o ? { name: r.name, focus: true } : null)}
                              onHover={() => hoverIn(r.name)} onLeave={hoverOut} onOpenRow={() => openRow(r)}>
                              <HealthBar value={r.health} />
                              <span className="sr-only">{BAND_LABEL[b]}</span>
                              <Button variant="ghost" size="icon-xs" aria-label={`Insights for ${r.name}`} title="Insights"
                                className="text-muted-foreground hover:text-foreground"
                                onFocus={() => setIns(s => (s?.name === r.name ? s : { name: r.name, focus: false }))}
                                onClick={e => { e.stopPropagation(); clearTimeout(timer.current); setIns({ name: r.name, focus: true }) }}
                                onKeyDown={e => e.stopPropagation()}>
                                <Info />
                              </Button>
                            </InsightsPopover>
                          </TableCell>
                          <TableCell><RunwayCell row={r} /></TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium tabular-nums">{money(r.carr)}</div>
                            <NrrLine row={r} />
                          </TableCell>
                          {show('signals') && <TableCell><SignalsCell row={r} /></TableCell>}
                          {show('stage') && <TableCell className="text-sm">{r.stage}</TableCell>}
                          {show('repo') && <TableCell className="text-right tabular-nums">{r.repo.toLocaleString()}</TableCell>}
                          {show('lic') && (
                            <TableCell className="pr-4 text-right tabular-nums sm:pr-5">
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
              <p className="border-t border-hairline px-4 py-2.5 text-xs text-muted-foreground tabular-nums sm:px-5">
                Showing {list.length} of {data.length}
              </p>
            )}
          </>
        )}
      </Card>

      <PreviewSheet row={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
