import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, Download, ListFilter, Mail, Network, RotateCcw, Search, Table2, UserCheck, Users, X } from 'lucide-react'
import { BlockHeader, Empty, ListRow, SectionTitle, stickyCol, stickyColStatic, TableFooterBar, TableSkeleton, Tip } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ErrorState, fmtD, InfoTip, useLoad } from './activity/shared'
import {
  download, internalRows, KIND_LABEL, loadBase, orbitPeople, SORTS, stakeRows, toCsv,
  type Base, type InternalRow, type Kind, type SortKey, type StakeRow,
} from './stakeholders/model'
import { Orbit } from './stakeholders/orbit'
import { Avatar, EngagementPill, MonthStrip, RoleCell, TonePill } from './stakeholders/parts'
import { GAP_ICON, PersonSheet } from './stakeholders/person-sheet'
import { useRoles } from './stakeholders/store'

const PER = 10
type Filter = 'all' | Kind

export function StakeholdersTab() {
  const load = useLoad(loadBase, undefined, 'stakeholders')
  return (
    <div>
      <SectionTitle title="Stakeholders" />
      {load.status === 'loading' && <StakeSkeleton />}
      {load.status === 'error' && <ErrorState what="stakeholders" onRetry={load.retry} />}
      {load.status === 'ready' && <Stakeholders base={load.data} />}
    </div>
  )
}

function Stakeholders({ base }: { base: Base }) {
  const roles = useRoles()
  const rows = useMemo(() => stakeRows(base, roles), [base, roles])
  const internal = useMemo(() => internalRows(base), [base])
  const orbit = useMemo(() => orbitPeople(rows), [rows])
  const max = useMemo(() => Math.max(1, ...rows.flatMap(r => r.months)), [rows])
  const [audience, setAudience] = useState<'customer' | 'internal'>('customer')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const open = rows.find(r => r.key === openKey) ?? null
  // whose people: the saved views on the left of each table's toolbar
  const views = (
    <ToggleGroup type="single" size="sm" spacing={1} value={audience} onValueChange={v => v && setAudience(v as typeof audience)} aria-label="Whose people" className="shrink-0">
      <ToggleGroupItem value="customer" className="gap-1.5 data-[state=on]:text-foreground">Customer contacts <Count n={rows.length} /></ToggleGroupItem>
      <ToggleGroupItem value="internal" className="gap-1.5 data-[state=on]:text-foreground">Sirion and vendors <Count n={internal.length} /></ToggleGroupItem>
    </ToggleGroup>
  )

  return (
    <div className="grid gap-4">
      <Attention rows={rows} orbit={orbit} onOpen={setOpenKey} />
      <Card className="gap-0 py-0">
        <BlockHeader icon={Users} title="People" count={audience === 'customer' ? rows.length : internal.length} actions={views} />
        {audience === 'customer'
          ? <CustomerTable rows={rows} orbit={orbit} max={max} months={base.months} onOpen={setOpenKey} />
          : <InternalTable rows={internal} />}
      </Card>
      <PersonSheet row={open} ev={base.ev} months={base.months} max={max} onOpenChange={o => { if (!o) setOpenKey(null) }} />
    </div>
  )
}

const Count = ({ n }: { n: number }) => <span className="tabular-nums text-muted-foreground">{n}</span>

/* ---- verdict first: who needs attention, and how many people are actually in touch ---- */
function Attention({ rows, orbit, onOpen }: { rows: StakeRow[]; orbit: ReturnType<typeof orbitPeople>; onOpen: (k: string) => void }) {
  const sponsor = rows.find(r => /Sponsor/i.test(r.label) && r.source !== 'inferred' && r.source !== 'news' && (r.eng === 'quiet' || r.eng === 'none'))
  const quietChamps = rows.filter(r => /Champion/.test(r.label) && r.kind === 'tagged' && (r.eng === 'quiet' || r.eng === 'none'))
  const gone = rows.filter(r => r.kind === 'departed')
  const sugg = rows.filter(r => r.source === 'inferred' || r.source === 'news')
  const by = (ring: number) => orbit.filter(p => p.ring === ring && p.state !== 'quiet').length
  const quiet = orbit.filter(p => p.state === 'quiet').length
  const items: { key: string; name: string; why: string; meta: string; dot: string }[] = []
  const when = (r: StakeRow) => r.last ? `Last named ${fmtD(r.last)}` : 'Never named'
  if (sponsor) items.push({ key: sponsor.key, name: sponsor.name, why: 'Sponsor quiet', dot: 'bg-warn',
    meta: `Executive sponsor · ${when(sponsor)} · no exec contact this month` })
  quietChamps.forEach(r => items.push({ key: r.key, name: r.name, why: 'Champion quiet', dot: 'bg-warn', meta: `Tagged champion · ${when(r)}` }))
  gone.forEach(r => items.push({ key: r.key, name: r.name, why: 'Hand over', dot: 'bg-bad', meta: `${r.label} · ${when(r)}` }))
  const active30 = by(0), active90 = by(1), total = Math.max(1, active30 + active90 + quiet)
  const cov: [string, number, string][] = [['Last 30 days', active30, 'bg-chart-1'], ['30 to 90 days', active90, 'bg-chart-seq-2'], ['Quiet or gone', quiet, 'bg-chart-5']]

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <BlockHeader icon={AlertTriangle} title="Needs attention" count={items.length + sugg.length} />
        {items.length || sugg.length ? (
          <ul className="grid gap-1 px-2 py-2">
            {items.map(it => (
              <li key={it.key}>
                <ListRow icon={<Avatar name={it.name} />} title={it.name} meta={it.meta} onClick={() => onOpen(it.key)}
                  aria-haspopup="dialog" aria-label={`${it.name}: ${it.why}. ${it.meta}. Open detail`}
                  right={<span className="inline-flex items-center gap-1.5"><span className={cn('size-1.5 rounded-full', it.dot)} aria-hidden="true" />{it.why}</span>} />
              </li>
            ))}
            {sugg.length > 0 && (
              <li className="flex items-start gap-3 px-2 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted"><UserCheck className="size-4 text-muted-foreground" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{sugg.length} role{sugg.length === 1 ? '' : 's'} to confirm</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {sugg.map(r => (
                      <Button key={r.key} variant="outline" size="xs" onClick={() => onOpen(r.key)}>
                        {r.name} <span className="text-muted-foreground">{r.label.toLowerCase()}</span>
                      </Button>
                    ))}
                  </p>
                </div>
              </li>
            )}
          </ul>
        ) : <Empty title="Nothing needs attention" sub="Every tagged role is active and confirmed." className="m-5 py-6" />}
      </Card>
      <Card className="gap-0 py-0">
        <BlockHeader icon={Users} title="Coverage" count={active30 + active90 + quiet}
          actions={<InfoTip>Key people by when AHI's monthly summaries last named them. Key people are tagged, inferred, departed, or named twice or more.</InfoTip>} />
        <div className="grid gap-3 p-5">
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-normal tabular-nums', active30 + active90 <= 1 && 'text-warn')}>{active30 + active90}</span>
          <span className="text-xs text-muted-foreground">{active30 + active90 <= 1 ? 'active in 90 days · single-threaded' : 'active in 90 days'}</span>
        </div>
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={cov.map(([l, v]) => `${l}: ${v}`).join(', ')}>
          {cov.filter(([, v]) => v > 0).map(([l, v, c]) => <span key={l} className={cn('h-full', c)} style={{ width: `${(v / total) * 100}%` }} />)}
        </div>
        <ul className="grid grid-cols-3 gap-2 text-xs">
          {cov.map(([l, v, c]) => (
            <li key={l} className="grid gap-0.5">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className={cn('size-1.5 rounded-full', c)} aria-hidden="true" />{l}</span>
              <span className="text-sm tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
        </div>
      </Card>
    </div>
  )
}

/* ---- customer contacts: search, persona filter, sort, table or orbit, pager, CSV ---- */
function CustomerTable({ rows, orbit, max, months, onOpen }: {
  rows: StakeRow[]; orbit: ReturnType<typeof orbitPeople>; max: number; months: string[]; onOpen: (k: string) => void
}) {
  const [view, setView] = useState<'table' | 'orbit'>('table')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<SortKey>('role')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const cnt = (k: Filter) => rows.filter(r => k === 'all' || r.kind === k).length
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter(r => (filter === 'all' || r.kind === filter) && (!s || `${r.name} ${r.title} ${r.label} ${r.sen}`.toLowerCase().includes(s))).sort(SORTS[sort][1])
  }, [rows, filter, sort, q])
  const pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, pages - 1)
  const viewRows = list.slice(pg * PER, pg * PER + PER)
  const nums = Array.from({ length: pages }, (_, k) => k).filter(k => k < 2 || k > pages - 3 || Math.abs(k - pg) <= 1)
  const reset = () => setPage(0)
  const dirty = !!q || filter !== 'all' || sort !== 'role'
  const resetAll = () => { setQ(''); setFilter('all'); setSort('role'); setPage(0); toast('Filters reset') }

  return (
    <>
      {/* one toolbar row: search left; persona, sort, view, export right */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap">
        {view === 'table' && (
          <InputGroup className="w-full transition-[width] duration-200 sm:w-[200px] sm:focus-within:w-64">
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupInput type="search" value={q} onChange={e => { setQ(e.target.value); reset() }} placeholder="Search people" aria-label="Search stakeholders" />
            {q && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { setQ(''); reset() }}><X /></InputGroupButton></InputGroupAddon>}
          </InputGroup>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {view === 'table' && (
            <>
              <Select value={filter} onValueChange={v => { setFilter(v as Filter); reset() }}>
                <Tip tip="Filter by persona">
                  <SelectTrigger size="sm" className="relative w-auto gap-1.5 border-0 bg-transparent shadow-none hover:bg-accent dark:bg-transparent dark:hover:bg-accent" aria-label="Filter by persona">
                    <ListFilter className="text-muted-foreground" />
                    <span className="hidden sm:inline">{filter === 'all' ? 'All personas' : KIND_LABEL[filter]}</span>
                    {filter !== 'all' && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-signal sm:hidden" aria-hidden="true" />}
                  </SelectTrigger>
                </Tip>
                <SelectContent align="end">
                  {(['all', 'tagged', 'suggested', 'departed', 'other'] as Filter[]).map(k => (
                    <SelectItem key={k} value={k}>{k === 'all' ? 'All personas' : KIND_LABEL[k]} <Count n={cnt(k)} /></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={v => { setSort(v as SortKey); reset() }}>
                <Tip tip={`Sort: ${SORTS[sort][0]}`}>
                  <SelectTrigger size="sm" className="w-auto border-0 bg-transparent shadow-none hover:bg-accent dark:bg-transparent dark:hover:bg-accent [&>svg:last-child]:hidden" aria-label="Sort stakeholders">
                    <ArrowUpDown className="text-muted-foreground" />
                  </SelectTrigger>
                </Tip>
                <SelectContent align="end">
                  {(Object.keys(SORTS) as SortKey[]).map(k => <SelectItem key={k} value={k}>{SORTS[k][0]}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
          <ToggleGroup type="single" size="sm" value={view} onValueChange={v => v && setView(v as typeof view)} aria-label="View">
            <Tip tip="Table"><ToggleGroupItem value="table" aria-label="Table"><Table2 /></ToggleGroupItem></Tip>
            <Tip tip="Relationship orbit"><ToggleGroupItem value="orbit" aria-label="Relationship orbit"><Network /></ToggleGroupItem></Tip>
          </ToggleGroup>
          <Tip tip="Export CSV">
            <Button variant="ghost" size="icon" aria-label="Export CSV" disabled={!list.length}
              onClick={() => { download('transamerica-stakeholders.csv', toCsv(list)); toast.success(`Exported ${list.length} contact${list.length === 1 ? '' : 's'}`, { description: 'transamerica-stakeholders.csv' }) }}>
              <Download />
            </Button>
          </Tip>
          {dirty && <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw />Reset</Button>}
        </div>
      </div>

      {view === 'orbit' ? (
        <div className="grid gap-3 border-t border-hairline p-4">
          <p className="text-xs text-muted-foreground">Closer to the centre: named more recently. Thicker line: named more often.</p>
          {orbit.length ? <Orbit people={orbit} onOpen={onOpen} /> : <Empty title="No key people yet" sub="Tag a sponsor or champion to place them on the orbit." />}
        </div>
      ) : (
        <>
          <Table aria-label="Stakeholders">
            <TableHeader>
              <TableRow>
                <TableHead className={stickyColStatic}>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Tone</TableHead>
                <TableHead>Mentions, 18 months</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewRows.length ? viewRows.map(r => {
                const G = GAP_ICON[r.gap[0]]
                return (
                  <TableRow key={r.key} tabIndex={0} className="cursor-pointer outline-none focus-visible:bg-accent/60 [&>td]:h-11 [&>td]:py-1.5"
                    aria-label={`${r.name}, open detail`}
                    onClick={() => onOpen(r.key)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(r.key) } }}>
                    <TableCell className={cn(stickyCol, 'max-w-72')}>
                      <span className="flex min-w-48 items-center gap-2">
                        <Avatar name={r.name} className="size-5 text-[10px]" />
                        <span className="shrink-0 font-medium">{r.name}</span>
                        {r.gap[0] === 'warn' && (
                          <Tooltip>
                            <TooltipTrigger asChild><span tabIndex={0} aria-label={r.gap[1]} className="shrink-0 outline-none"><G.I className={cn('size-3.5', G.cls)} /></span></TooltipTrigger>
                            <TooltipContent className="max-w-64">{r.gap[1]}</TooltipContent>
                          </Tooltip>
                        )}
                        <span className="truncate text-xs text-muted-foreground">{r.sen || r.title || r.org}</span>
                      </span>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}><RoleCell row={r} /></TableCell>
                    <TableCell><EngagementPill eng={r.eng} days={r.days} /></TableCell>
                    <TableCell><TonePill tone={r.tone} pos={r.pos} neg={r.neg} /></TableCell>
                    <TableCell>
                      <MonthStrip months={r.months} labels={months} max={max} />
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      {r.email && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" asChild><a href={`mailto:${r.email}`} aria-label={`Email ${r.name}`}><Mail /></a></Button>
                          </TooltipTrigger>
                          <TooltipContent>Email {r.name}</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="h-auto p-4">
                  <Empty title="No stakeholders match" sub="Change the search or the persona filter." />
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TableFooterBar shown={list.length ? `${pg * PER + 1}–${pg * PER + viewRows.length}` : 0} total={list.length}>
            <nav className="flex items-center gap-1" aria-label="Pages">
              <Button variant="outline" size="icon-sm" disabled={!pg} onClick={() => setPage(pg - 1)} aria-label="Previous page"><ChevronLeft /></Button>
              {nums.map((k, x) => (
                <span key={k} className="flex items-center gap-1">
                  {x > 0 && k - nums[x - 1] > 1 && <span aria-hidden="true">…</span>}
                  <Button variant={k === pg ? 'secondary' : 'ghost'} size="icon-sm" aria-current={k === pg ? 'page' : undefined} onClick={() => setPage(k)}>{k + 1}</Button>
                </span>
              ))}
              <Button variant="outline" size="icon-sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)} aria-label="Next page"><ChevronRight /></Button>
            </nav>
          </TableFooterBar>
        </>
      )}
    </>
  )
}

/* ---- Sirion, UnifyApps, partners and system senders: kept apart from customer contacts ---- */
const GROUPS = ['all', 'Sirion', 'UnifyApps', 'Partner', 'System sender'] as const
function InternalTable({ rows }: { rows: InternalRow[] }) {
  const [g, setG] = useState<(typeof GROUPS)[number]>('all')
  const [q, setQ] = useState('')
  const s = q.trim().toLowerCase()
  const list = rows.filter(r => (g === 'all' || r.group === g) && (!s || `${r.name} ${r.org} ${r.email ?? ''}`.toLowerCase().includes(s)))
  const groupLabel = (k: (typeof GROUPS)[number]) => k === 'all' ? 'All groups' : k === 'Partner' ? 'Partners' : k === 'System sender' ? 'System senders' : k
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap">
        <InputGroup className="w-full transition-[width] duration-200 sm:w-[200px] sm:focus-within:w-64">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" aria-label="Search Sirion and vendor people" />
          {q && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQ('')}><X /></InputGroupButton></InputGroupAddon>}
        </InputGroup>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Select value={g} onValueChange={v => setG(v as typeof g)}>
            <Tip tip="Filter by group">
              <SelectTrigger size="sm" className="w-auto gap-1.5 border-0 bg-transparent shadow-none hover:bg-accent dark:bg-transparent dark:hover:bg-accent" aria-label="Filter by group">
                <ListFilter className="text-muted-foreground" /><span className="hidden sm:inline">{groupLabel(g)}</span>
              </SelectTrigger>
            </Tip>
            <SelectContent align="end">
              {GROUPS.map(k => <SelectItem key={k} value={k}>{groupLabel(k)} <Count n={rows.filter(r => k === 'all' || r.group === k).length} /></SelectItem>)}
            </SelectContent>
          </Select>
          {(q || g !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setG('all'); toast('Filters reset') }}><RotateCcw />Reset</Button>}
        </div>
      </div>
      <Table aria-label="Sirion and vendor people">
        <TableHeader>
          <TableRow>
            <TableHead className={stickyColStatic}>Name</TableHead><TableHead>Company</TableHead><TableHead>Seen in</TableHead><TableHead className="text-right">Named in summaries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length ? list.map(r => (
            <TableRow key={r.key} className="hover:bg-transparent [&>td]:h-11 [&>td]:py-1.5">
              <TableCell className={cn(stickyColStatic, 'max-w-80')}>
                <span className="flex min-w-48 items-center gap-2">
                  <Avatar name={r.name} className="size-5 text-[10px]" />
                  <span className="shrink-0 font-medium">{r.name}</span>
                  {r.email && <span className="truncate text-xs text-muted-foreground">{r.email}</span>}
                </span>
              </TableCell>
              <TableCell>{r.org}{r.group === 'Partner' && <span className="ml-1.5 text-xs text-muted-foreground">partner</span>}</TableCell>
              <TableCell className="max-w-56">
                {r.sources.length ? (
                  <Tooltip>
                    <TooltipTrigger asChild><span tabIndex={0} className="block truncate rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{r.sources.join(', ')}</span></TooltipTrigger>
                    <TooltipContent className="max-w-72">{r.sources.join(', ')}</TooltipContent>
                  </Tooltip>
                ) : <span className="text-muted-foreground">No data</span>}
              </TableCell>
              <TableCell className="text-right">{r.mentions}</TableCell>
            </TableRow>
          )) : (
            <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="h-auto p-4"><Empty title="Nobody matches" sub="Change the search or the group." /></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <TableFooterBar shown={list.length} total={rows.length} />
    </>
  )
}

function StakeSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading stakeholders">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="gap-3 px-5 py-4">
          <Skeleton className="h-4 w-32" />
          {[0, 1, 2].map(i => <div key={i} className="flex min-h-11 items-center gap-3"><Skeleton className="size-7 rounded-full" /><div className="grid flex-1 gap-1.5"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-3 w-20" /></div>)}
        </Card>
        <Card className="gap-3 px-5 py-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-1.5 w-full" />
          <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-8" />)}</div>
        </Card>
      </div>
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap gap-2 px-4 py-3"><Skeleton className="h-7 w-72" /><Skeleton className="ml-auto h-8 w-[200px]" /><Skeleton className="h-8 w-40" /></div>
        <TableSkeleton columns={[{ w: 'w-44' }, { w: 'w-24' }, { w: 'w-16' }, { w: 'w-16' }, { w: 'w-24' }, { w: 'w-6', right: true }]} />
      </Card>
    </div>
  )
}
