import { useRef } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { fmtDate, money } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { go } from '@/lib/route'
import { BAND_LABEL, bandOf, bandText, HealthPill, HealthRing, isMissing } from '@/components/health'
import { Fact, Meter, SheetColumns, sheetHeaderCls, TableSkeleton as PageTableSkeleton, Tip } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { insights, isTA, live, runway, signals, type Row, type Signal, type Tone } from './model'


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
      <TooltipContent>Renews {fmtDate(row.renew)}</TooltipContent>
    </Tooltip>
  )
}

/** NRR as one value; GRR in the tooltip. */
export function NrrCell({ row }: { row: Row }) {
  if (row.nrr == null) return <span className="text-muted-foreground">No data</span>
  return <Tip tip={row.grr == null ? 'Net revenue retention' : `Net revenue retention · gross revenue retention (GRR) ${row.grr}%`}><span tabIndex={0} className="rounded-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{row.nrr}%</span></Tip>
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
            {isTA(row) ? 'Open account' : 'Preview account'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- row preview sheet ---------- */
export function PreviewSheet({ row, onClose }: { row: Row | null; onClose: () => void }) {
  return (
    <Sheet open={!!row} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-3xl">
        {row && <PreviewBody row={row} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function PreviewBody({ row, onClose }: { row: Row; onClose: () => void }) {
  const rr = runway(row), sg = signals(row), ins = insights(row), b = bandOf(row.health)
  return (
    <>
      <SheetHeader className={sheetHeaderCls}>
        <div className="flex flex-wrap items-center gap-3">
          <Monogram row={row} size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg font-normal">{row.name}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <HealthPill value={row.health} />
              <span>{row.seg} · {row.ind}</span>
            </SheetDescription>
          </div>
          <Button size="sm" onClick={() => { onClose(); go('account') }}>Open account <ArrowRight /></Button>
        </div>
      </SheetHeader>
      <SheetColumns aside={
        <>
          <Fact label="Health">
            <span className="flex items-center gap-3">
              <HealthRing value={row.health} size={44} stroke={3.5} />
              <span className={cn('text-sm', bandText[b])}>{isMissing(row.health) ? 'No data' : BAND_LABEL[b]}</span>
            </span>
          </Fact>
          <Fact label={<Tip tip="Contracted annual recurring revenue"><span tabIndex={0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">CARR</span></Tip>}>
            <span className="tabular-nums">{money(row.carr)}</span>
          </Fact>
          <Fact label="Renewal">
            {live(row)
              ? <Tip tip={fmtDate(row.renew)}><span tabIndex={0} className={cn('rounded-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50', rr.c === 'b' && 'text-bad')}>{rr.t}</span></Tip>
              : <span className="text-muted-foreground">Churned</span>}
          </Fact>
          <Fact label={<Tip tip="Net and gross revenue retention"><span tabIndex={0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">NRR / GRR</span></Tip>}>
            <span className="tabular-nums">{row.nrr == null ? 'No data' : `${row.nrr}% / ${row.grr}%`}</span>
          </Fact>
          <Fact label="Licence use">
            {row.lic == null ? <span className="text-muted-foreground">No data</span> : (
              <span className="flex items-center gap-2">
                <Meter value={row.lic} max={100} label="Licence use" tip={`${row.lic}% of seats bought`} className="w-24" />
                <span className="tabular-nums">{row.lic}%</span>
              </span>
            )}
          </Fact>
          <Fact label="Stage">{row.stage}</Fact>
          <Fact label="Repository"><span className="tabular-nums">{row.repo.toLocaleString()} records</span></Fact>
        </>
      }>
        {sg.length > 0 && (
          <section className="grid gap-1.5">
            <h3 className="text-xs text-muted-foreground">Signals</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1">{sg.map(s => <SignalText key={s.text} s={s} />)}</div>
          </section>
        )}
        {ins.rows.map(([hd, t]) => (
          <section key={hd} className="grid gap-1">
            <h3 className="text-sm font-medium">{hd}</h3>
            <p className="text-sm leading-relaxed text-pretty">{t}</p>
          </section>
        ))}
        {!isTA(row) && <p className="text-xs text-muted-foreground">Only TransAmerica has a full account page in this build.</p>}
      </SheetColumns>
    </>
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
