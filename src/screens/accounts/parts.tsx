import { useRef } from 'react'
import { Building2, CalendarClock, DollarSign, Factory, HeartPulse, Layers, ListFilter, X, type LucideIcon } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fmtShort } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { money } from '@/data/legacy'
import { BAND_LABEL, bandOf, HealthRing } from '@/components/health'
import { TableSkeleton as PageTableSkeleton, Tip } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  brief, FILTER_DIMS, filterCount, live, NO_FILTERS, reason, runway,
  type DimId, type FilterDim, type FilterState, type Row, type Tone,
} from './model'


const DOT: Record<Tone, string> = { bad: 'bg-bad', warn: 'bg-warn', good: 'bg-good', neutral: 'bg-muted-foreground/60' }

/** Why the row is in the list, in full, with the next step underneath. Only the dot carries colour. */
export function ReasonCell({ row }: { row: Row }) {
  const r = reason(row)
  return (
    <span className="grid min-w-0 gap-0.5">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className={cn('size-1.5 shrink-0 rounded-full', DOT[r.tone])} aria-hidden="true" />
        <span className={cn('truncate', r.tone === 'neutral' && 'text-muted-foreground')}>{r.text}</span>
      </span>
      {r.next && <span className="truncate pl-3 text-xs text-muted-foreground">→ {r.next}</span>}
    </span>
  )
}

/** Renewal date with the time to it underneath. Red only within 60 days or overdue. */
export function RunwayCell({ row }: { row: Row }) {
  if (!live(row)) return <span className="text-muted-foreground">Churned</span>
  const rr = runway(row)
  return (
    <span className="grid gap-0.5 tabular-nums">
      <span>{fmtShort(row.renew)}</span>
      <span className={cn('text-xs', rr.c === 'b' ? 'text-bad' : 'text-muted-foreground')}>{rr.days < 0 ? rr.t : `in ${rr.t}`}</span>
    </span>
  )
}

/** NRR as one value; GRR in the tooltip. */
export function NrrCell({ row }: { row: Row }) {
  if (row.nrr == null) return <span className="text-muted-foreground">No data</span>
  return <Tip tip={row.grr == null ? 'Net revenue retention' : `Net revenue retention · gross revenue retention (GRR) ${row.grr}%`}><span tabIndex={0} className="rounded-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{row.nrr}%</span></Tip>
}

/* ---------- cascading filter: dimension -> checkable options with counts; active values as removable chips ---------- */
const DIM_ICON: Record<DimId, LucideIcon> = { band: HeartPulse, renew: CalendarClock, stage: Layers, arr: DollarSign, seg: Building2, ind: Factory }

export function AccountFilter({ value, onChange, rows, buttonRef }: {
  value: FilterState; onChange: (f: FilterState) => void; rows: Row[]; buttonRef?: React.Ref<HTMLButtonElement>
}) {
  const n = filterCount(value)
  const toggle = (d: DimId, v: string) => onChange({ ...value, [d]: value[d].includes(v) ? value[d].filter(x => x !== v) : [...value[d], v] })
  const current = (d: FilterDim) => {
    const on = d.options.filter(o => value[d.id].includes(o.value))
    return !on.length ? 'Any' : on.length === 1 ? on[0].label : `${on.length} selected`
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={buttonRef} variant="outline" aria-label={n ? `Filter, ${n} active` : 'Filter'}>
          <ListFilter aria-hidden="true" />Filter
          {n > 0 && <span className="grid h-4 min-w-4 place-items-center rounded bg-foreground px-1 text-[11px] font-medium tabular-nums text-background">{n}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Filter by</DropdownMenuLabel>
        {FILTER_DIMS.map(d => {
          const I = DIM_ICON[d.id]
          return (
            <DropdownMenuSub key={d.id}>
              <DropdownMenuSubTrigger className="gap-2">
                <I className="text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">{d.label}</span>
                <span className={cn('max-w-28 truncate text-right text-xs', value[d.id].length ? 'text-foreground' : 'text-muted-foreground')}>{current(d)}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 w-64 overflow-y-auto p-1">
                <DropdownMenuLabel className="flex justify-between text-xs font-normal text-muted-foreground"><span>{d.label}</span><span>accounts</span></DropdownMenuLabel>
                {d.options.map(o => (
                  <DropdownMenuCheckboxItem key={o.value} checked={value[d.id].includes(o.value)} onSelect={e => e.preventDefault()} onCheckedChange={() => toggle(d.id, o.value)}>
                    <span className="truncate">{o.label}</span>
                    <span className="ml-auto pl-3 text-xs tabular-nums text-muted-foreground">{rows.filter(o.test).length}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!n} onSelect={() => onChange(NO_FILTERS)} className="gap-2"><X aria-hidden="true" />Clear all</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The active filter values as removable chips, one per checked value. */
export function FilterChips({ value, onChange }: { value: FilterState; onChange: (f: FilterState) => void }) {
  const chips = FILTER_DIMS.flatMap(d => d.options.filter(o => value[d.id].includes(o.value)).map(o => ({ d, o })))
  if (!chips.length) return null
  return (
    <>
      {chips.map(({ d, o }) => (
        <span key={d.id + o.value} className="inline-flex h-7 max-w-[240px] items-center gap-1 rounded-md border border-signal/40 bg-signal-soft pl-2 pr-0.5 text-xs">
          <span className="text-muted-foreground">{d.label}:</span><span className="truncate">{o.label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`Remove ${d.label} ${o.label}`} onClick={() => onChange({ ...value, [d.id]: value[d.id].filter(x => x !== o.value) })}
                className="grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Remove filter</TooltipContent>
          </Tooltip>
        </span>
      ))}
    </>
  )
}

/* ---------- insights popover: hover/focus the health score (no focus steal), click to pin and focus ---------- */
export function InsightsPopover({ row, open, onOpenChange, onHover, onLeave, focusOnOpen, onOpenRow, children }: {
  row: Row; open: boolean; onOpenChange: (o: boolean) => void; onHover: () => void; onLeave: () => void
  focusOnOpen: boolean; onOpenRow: () => void; children: React.ReactNode
}) {
  const br = brief(row)
  const b = bandOf(row.health)
  const closeRef = useRef<HTMLButtonElement>(null)
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div className="inline-flex items-center gap-1" onMouseEnter={onHover} onMouseLeave={onLeave}>{children}</div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-24px)] gap-0 overflow-hidden p-0"
        aria-label={`Insights for ${row.name}`}
        onOpenAutoFocus={e => { e.preventDefault(); if (focusOnOpen) closeRef.current?.focus() }}
        onMouseEnter={onHover} onMouseLeave={onLeave}
        onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <HealthRing value={row.health} size={36} stroke={3} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">{BAND_LABEL[b]} · {row.ind}</p>
          </div>
          <Button ref={closeRef} variant="ghost" size="icon-xs" className="self-start" aria-label="Close insights" onClick={() => onOpenChange(false)}><X /></Button>
        </div>
        <dl className="mx-4 grid grid-cols-3 gap-3 rounded-lg bg-surface-2 px-3 py-2.5 text-xs">
          <Fact label="ARR" value={money(row.carr)} />
          <Fact label="Renewal" value={live(row) ? fmtShort(row.renew) : 'Churned'} />
          <Fact label="NRR" value={row.nrr == null ? '–' : `${row.nrr}%`} />
        </dl>
        <div className="grid gap-3 px-4 py-3">
          <ReasonCell row={row} />
          {br && (
            <div className="grid gap-2 border-t border-hairline pt-3">
              {br.map(([hd, t]) => (
                <p key={hd} className="text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">{hd}. </span>{t}</p>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-hairline px-4 py-2.5">
          <Button variant="outline" size="sm" className="w-full" onClick={() => { onOpenChange(false); onOpenRow() }}>Open account</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

/** Scored accounts split by health band: one thin stacked bar, a tooltip per band. */
const BAND_FILL = { bad: 'bg-bad', warn: 'bg-warn', good: 'bg-good' } as const
const BAND_NAME = { bad: 'At risk', warn: 'Watch', good: 'Healthy' } as const
export function BandSplit({ bands }: { bands: { band: 'bad' | 'warn' | 'good'; n: number }[] }) {
  const total = bands.reduce((a, b) => a + b.n, 0) || 1
  return (
    <span className="flex h-1.5 w-full gap-0.5" role="img" aria-label={bands.map(b => `${BAND_NAME[b.band]} ${b.n}`).join(', ')}>
      {bands.filter(b => b.n).map(b => (
        <Tip key={b.band} tip={`${BAND_NAME[b.band]}: ${b.n} accounts`}>
          <span className={cn('h-full rounded-full', BAND_FILL[b.band])} style={{ width: `${(b.n / total) * 100}%` }} />
        </Tip>
      ))}
    </span>
  )
}

/* ---------- loading skeletons matching each widget's shape ---------- */
export function TilesSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <div key={i} className="grid gap-2 rounded-xl border border-hairline bg-card p-5">
          <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-20" /><Skeleton className="h-1.5 w-full" /><Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return <PageTableSkeleton lead={false} columns={[{ w: 'w-40' }, { w: 'w-20' }, { w: 'w-16' }, { w: 'w-16', right: true }, { w: 'w-48' }]} />
}
