import { useRef } from 'react'
import { Building2, CalendarClock, Factory, HeartPulse, Layers, ListFilter, X, type LucideIcon } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { P } from '@/data/legacy'
import { fmtFull } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { BAND_LABEL, bandOf } from '@/components/health'
import { TableSkeleton as PageTableSkeleton, Tip } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  FILTER_DIMS, filterCount, insights, live, NO_FILTERS, runway, signals,
  type DimId, type FilterDim, type FilterState, type Row, type Signal, type Tone,
} from './model'


export const monogram = (r: Row) => r.name.replace(/[^A-Za-z ]/g, '').trim()[0]?.toUpperCase() ?? '?'

export function Monogram({ row, size = 'sm' }: { row: Row; size?: 'sm' | 'lg' }) {
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 font-medium text-foreground',
      size === 'sm' ? 'size-7 text-xs' : 'size-10 text-base')}>{monogram(row)}</span>
  )
}

const DOT: Record<Tone, string> = { bad: 'bg-bad', warn: 'bg-warn', good: 'bg-good', neutral: 'bg-muted-foreground/60' }

/** A signal as a 6px dot and plain muted text; only the dot carries colour. */
export function SignalText({ s, className }: { s: Signal; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-muted-foreground', className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', DOT[s.tone])} aria-hidden="true" />
      <span className="truncate">{s.text}</span>
    </span>
  )
}

/** Top signal + "+N" as muted text, the rest in a tooltip. */
export function SignalsCell({ row }: { row: Row }) {
  const sg = signals(row)
  if (!sg.length) return <span className="text-muted-foreground">None</span>
  const rest = sg.slice(1)
  return (
    <span className="inline-flex items-center gap-2">
      <SignalText s={sg[0]} />
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="rounded-sm text-xs tabular-nums text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`${rest.length} more: ${rest.map(s => s.text).join(', ')}`} onClick={e => e.stopPropagation()}>+{rest.length}</span>
          </TooltipTrigger>
          <TooltipContent>{rest.map(s => s.text).join(' · ')}</TooltipContent>
        </Tooltip>
      )}
    </span>
  )
}

/** Renewal runway as one value. Red text only within 60 days or overdue; the date is in the tooltip. */
export function RunwayCell({ row }: { row: Row }) {
  if (!live(row)) return <span className="text-muted-foreground">Churned</span>
  const rr = runway(row)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={-1} className={cn('tabular-nums', rr.c === 'b' ? 'text-bad' : 'text-foreground')}>{rr.t}</span>
      </TooltipTrigger>
      <TooltipContent>Renews {fmtFull(row.renew)}</TooltipContent>
    </Tooltip>
  )
}

/** NRR as one value; GRR in the tooltip. */
export function NrrCell({ row }: { row: Row }) {
  if (row.nrr == null) return <span className="text-muted-foreground">No data</span>
  return <Tip tip={row.grr == null ? 'Net revenue retention' : `Net revenue retention · gross revenue retention (GRR) ${row.grr}%`}><span tabIndex={0} className="rounded-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{row.nrr}%</span></Tip>
}

/* ---------- cascading filter: dimension -> checkable options with counts; active values as removable chips ---------- */
const DIM_ICON: Record<DimId, LucideIcon> = { band: HeartPulse, renew: CalendarClock, stage: Layers, seg: Building2, ind: Factory }

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
                <span>{d.label}</span>
                <span className={cn('ml-auto max-w-28 truncate text-xs', value[d.id].length ? 'text-foreground' : 'text-muted-foreground')}>{current(d)}</span>
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
  const ins = insights(row)
  const closeRef = useRef<HTMLButtonElement>(null)
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div className="inline-flex items-center gap-1" onMouseEnter={onHover} onMouseLeave={onLeave}>{children}</div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[22rem] max-w-[calc(100vw-24px)] gap-3 p-0"
        aria-label={`Insights for ${row.name}`}
        onOpenAutoFocus={e => { e.preventDefault(); if (focusOnOpen) closeRef.current?.focus() }}
        onMouseEnter={onHover} onMouseLeave={onLeave}
        onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <div className="flex items-start gap-2.5 border-b border-hairline px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{row.name}</p>
          </div>
          <Button ref={closeRef} variant="ghost" size="icon-xs" aria-label="Close insights" onClick={() => onOpenChange(false)}><X /></Button>
        </div>
        <div className="grid max-h-[50vh] gap-3 overflow-y-auto px-4 pb-4">
          {ins.rows.map(([hd, t]) => (
            <div key={hd}>
              <h4 className="text-xs font-medium text-muted-foreground">{hd}</h4>
              <p className="mt-0.5 text-sm leading-relaxed">{t}</p>
            </div>
          ))}
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => { onOpenChange(false); onOpenRow() }}>
            Open account
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Portfolio ARR split by pod: one thin stacked bar, categorical series colours, a tooltip per pod. */
const POD_FILL = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-seq-2']
export function PodArrSplit() {
  const pods = (P.pods as [string, number, number][]).filter(p => p[2] > 0).sort((a, b) => b[2] - a[2])
  const total = pods.reduce((a, p) => a + p[2], 0)
  return (
    <span className="flex h-1.5 w-full gap-0.5" role="img" aria-label={`ARR by pod: ${pods.map(p => `${p[0]} $${p[2]}M`).join(', ')}`}>
      {pods.map((p, i) => (
        <Tip key={p[0]} tip={`${p[0]}: $${p[2].toFixed(1)}M · ${p[1]} accounts`}>
          <span tabIndex={0} className={cn('h-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50', POD_FILL[i % POD_FILL.length])}
            style={{ width: `${(p[2] / total) * 100}%` }} />
        </Tip>
      ))}
    </span>
  )
}

/* ---------- loading skeletons matching each widget's shape ---------- */
export function TilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="grid gap-2 rounded-xl border border-hairline bg-card px-5 py-4">
          <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-20" /><Skeleton className="h-1.5 w-full" /><Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return <PageTableSkeleton lead={false} columns={[{ w: 'w-40' }, { w: 'w-20' }, { w: 'w-16' }, { w: 'w-16', right: true }, { w: 'w-28' }, { w: 'w-20' }]} />
}

export const bandName = (v: number | null) => BAND_LABEL[bandOf(v)]
