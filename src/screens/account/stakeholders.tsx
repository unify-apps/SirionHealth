import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Mail, Network, Search, Table2, X } from 'lucide-react'
import { Empty, SectionTitle } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ErrorState, fmtD, fmtDY, InfoTip, useLoad } from './activity/shared'
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
  const load = useLoad(loadBase)
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

  return (
    <div className="grid gap-4">
      <Attention rows={rows} orbit={orbit} onOpen={setOpenKey} />
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
          <ToggleGroup type="single" variant="outline" size="sm" value={audience} onValueChange={v => v && setAudience(v as typeof audience)} aria-label="Whose people">
            <ToggleGroupItem value="customer">Customer contacts <Count n={rows.length} /></ToggleGroupItem>
            <ToggleGroupItem value="internal">Sirion and vendors <Count n={internal.length} /></ToggleGroupItem>
          </ToggleGroup>
        </div>
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
  const items: { key: string; name: string; title: React.ReactNode; detail: React.ReactNode; ai?: boolean }[] = []
  if (sponsor) items.push({ key: sponsor.key, name: sponsor.name, title: `${sponsor.name} · executive sponsor`,
    detail: `${sponsor.last ? `Last named ${fmtDY(sponsor.last)}, ${sponsor.mentions === 1 ? 'once' : sponsor.mentions + ' times'} in 18 monthly summaries` : 'Never named in a monthly summary'}. No executive contact this month (12-month average 11).` })
  quietChamps.forEach(r => items.push({ key: r.key, name: r.name, title: `${r.name} · tagged champion gone quiet`,
    detail: `${r.last ? `Last named ${fmtDY(r.last)}` : 'Never named in a summary'}. The tag may be out of date.` }))
  gone.forEach(r => items.push({ key: r.key, name: r.name, title: `${r.name} · ${r.label.toLowerCase()}`, detail: `${r.last ? `Last named ${fmtDY(r.last)}. ` : ''}Hand over the relationship.` }))

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="gap-3 px-5 py-4">
        <div className="flex items-center gap-2"><h3 className="text-sm font-medium">Needs attention</h3></div>
        {items.length || sugg.length ? (
          <ul className="grid divide-y divide-hairline">
            {items.map(it => (
              <li key={it.key}>
                <button type="button" onClick={() => onOpen(it.key)} className="flex w-full items-start gap-3 rounded-md py-2.5 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50">
                  <Avatar name={it.name} />
                  <span className="min-w-0"><span className="block font-medium">{it.title}</span><span className="block text-xs text-muted-foreground">{it.detail}</span></span>
                </button>
              </li>
            ))}
            {sugg.length > 0 && (
              <li className="py-2.5">
                <div className="min-w-0">
                  <p className="font-medium">{sugg.length} role suggestion{sugg.length === 1 ? '' : 's'} to confirm</p>
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
        ) : <Empty title="Nothing needs attention" sub="Every tagged role is active and confirmed." className="py-6" />}
      </Card>
      <Card className="gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Coverage</h3><span className="text-xs text-muted-foreground">Key people, by last named</span>
          <InfoTip>Recency comes from the dates in AHI's monthly summaries, not from email metadata. Key people are tagged, inferred, departed, or named twice or more.</InfoTip>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['Last 30 days', by(0)], ['30 to 90 days', by(1)], ['Quiet or gone', quiet]].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-surface-2 px-3 py-2.5">
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="text-2xl font-normal tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <p className={cn('text-xs', by(0) + by(1) <= 1 ? 'text-warn' : 'text-muted-foreground')}>
          {by(0) + by(1) <= 1 ? 'Single-threaded: one active contact or fewer.' : `${by(0) + by(1)} key people active in the last 90 days.`}
        </p>
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

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <ToggleGroup type="single" size="sm" value={view} onValueChange={v => v && setView(v as typeof view)} aria-label="View">
          <ToggleGroupItem value="table" aria-label="Table"><Table2 />Table</ToggleGroupItem>
          <ToggleGroupItem value="orbit" aria-label="Relationship orbit"><Network />Orbit</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => download('transamerica-stakeholders.csv', toCsv(list))} disabled={!list.length}>
          <Download />Export CSV
        </Button>
      </div>

      {view === 'orbit' ? (
        <div className="grid gap-3 p-4">
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Closer to the centre: named more recently in the monthly summaries. Thicker line: named more often.
          </p>
          {orbit.length ? <Orbit people={orbit} onOpen={onOpen} /> : <Empty title="No key people yet" sub="Tag a sponsor or champion to place them on the orbit." />}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon><Search /></InputGroupAddon>
              <InputGroupInput type="search" value={q} onChange={e => { setQ(e.target.value); reset() }} placeholder="Search name, title or persona" aria-label="Search stakeholders" />
              {q && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { setQ(''); reset() }}><X /></InputGroupButton></InputGroupAddon>}
            </InputGroup>
            <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={v => { if (v) { setFilter(v as Filter); reset() } }} aria-label="Filter by persona" className="flex-wrap">
              {(['all', 'tagged', 'suggested', 'departed', 'other'] as Filter[]).map(k => (
                <ToggleGroupItem key={k} value={k}>{k === 'all' ? 'All' : KIND_LABEL[k]} <Count n={cnt(k)} /></ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select value={sort} onValueChange={v => { setSort(v as SortKey); reset() }}>
              <SelectTrigger size="sm" className="ml-auto w-40" aria-label="Sort stakeholders"><span className="text-muted-foreground">Sort</span><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                {(Object.keys(SORTS) as SortKey[]).map(k => <SelectItem key={k} value={k}>{SORTS[k][0]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table aria-label="Stakeholders">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Tone in summaries</TableHead>
                <TableHead>Activity, 18 months</TableHead>
                <TableHead className="pr-4"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewRows.length ? viewRows.map(r => {
                const G = GAP_ICON[r.gap[0]]
                return (
                  <TableRow key={r.key} tabIndex={0} className="cursor-pointer outline-none focus-visible:bg-muted/50"
                    aria-label={`${r.name}, open detail`}
                    onClick={() => onOpen(r.key)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(r.key) } }}>
                    <TableCell className="pl-4">
                      <div className="flex min-w-48 items-center gap-2.5">
                        <Avatar name={r.name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium">
                            {r.name}
                            {r.gap[0] === 'warn' && (
                              <Tooltip>
                                <TooltipTrigger asChild><span tabIndex={0} aria-label={r.gap[1]} className="outline-none"><G.I className={cn('size-3.5', G.cls)} /></span></TooltipTrigger>
                                <TooltipContent className="max-w-64">{r.gap[1]}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{r.sen || r.title || r.org}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}><RoleCell row={r} /></TableCell>
                    <TableCell><EngagementPill eng={r.eng} days={r.days} /></TableCell>
                    <TableCell><TonePill tone={r.tone} pos={r.pos} neg={r.neg} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <MonthStrip months={r.months} labels={months} max={max} />
                        <span className="text-xs whitespace-nowrap text-muted-foreground">{r.last ? 'Last ' + fmtD(r.last) : 'Never named'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right" onClick={e => e.stopPropagation()}>
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
                <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="p-4">
                  <Empty title="No stakeholders match" sub="Change the search or the persona filter." />
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-3 text-xs text-muted-foreground">
            <span>Showing {list.length ? pg * PER + 1 : 0}–{pg * PER + viewRows.length} of {list.length}</span>
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
          </div>
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
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, company or email" aria-label="Search Sirion and vendor people" />
        </InputGroup>
        <ToggleGroup type="single" variant="outline" size="sm" value={g} onValueChange={v => v && setG(v as typeof g)} aria-label="Filter by group" className="flex-wrap">
          {GROUPS.map(k => <ToggleGroupItem key={k} value={k}>{k === 'all' ? 'All' : k === 'Partner' ? 'Partners' : k === 'System sender' ? 'System senders' : k} <Count n={rows.filter(r => k === 'all' || r.group === k).length} /></ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <Table aria-label="Sirion and vendor people">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Name</TableHead><TableHead>Company</TableHead><TableHead>Seen in</TableHead><TableHead className="pr-4 text-right">Named in summaries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length ? list.map(r => (
            <TableRow key={r.key}>
              <TableCell className="pl-4">
                <div className="flex min-w-48 items-center gap-2.5">
                  <Avatar name={r.name} className="size-7" />
                  <div className="min-w-0"><div className="font-medium">{r.name}</div>{r.email && <div className="truncate text-xs text-muted-foreground">{r.email}</div>}</div>
                </div>
              </TableCell>
              <TableCell><span className="inline-flex items-center gap-1.5">{r.org}{r.group === 'Partner' && <span className="text-xs text-muted-foreground">partner</span>}</span></TableCell>
              <TableCell className="text-xs">{r.sources.join(', ') || 'No data'}</TableCell>
              <TableCell className="pr-4 text-right tabular-nums">{r.mentions}</TableCell>
            </TableRow>
          )) : (
            <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="p-4"><Empty title="Nobody matches" sub="Change the search or the group." /></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}

function StakeSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading stakeholders">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="gap-3 px-5 py-4">
          <Skeleton className="h-4 w-32" />
          {[0, 1, 2].map(i => <div key={i} className="flex gap-3"><Skeleton className="size-8 rounded-full" /><div className="grid flex-1 gap-1.5"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-4/5" /></div></div>)}
        </Card>
        <Card className="gap-3 px-5 py-4">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16" />)}</div>
          <Skeleton className="h-3 w-2/3" />
        </Card>
      </div>
      <Card className="gap-0 py-0">
        <div className="flex gap-2 border-b border-hairline px-4 py-3"><Skeleton className="h-7 w-72" /></div>
        <div className="flex flex-wrap gap-2 px-4 py-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-7 w-80" /><Skeleton className="ml-auto h-7 w-40" /></div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-hairline px-4 py-3">
            <Skeleton className="size-8 rounded-full" /><Skeleton className="h-3.5 w-36" /><Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-4 w-24" />
          </div>
        ))}
      </Card>
    </div>
  )
}
