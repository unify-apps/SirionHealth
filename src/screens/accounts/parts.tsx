import { useRef } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, CalendarClock } from 'lucide-react'
import { fmtDate, money } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { go } from '@/lib/route'
import { BAND_LABEL, bandOf, bandText, HealthPill, isMissing } from '@/components/health'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { insights, isTA, live, runway, signals, type Row, type Signal, type Tone } from './model'

const TONE: Record<Tone, string> = {
  bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', good: 'bg-good-soft text-good', neutral: 'bg-muted text-foreground',
}

export const monogram = (r: Row) => r.name.replace(/[^A-Za-z ]/g, '').trim()[0]?.toUpperCase() ?? '?'

export function Monogram({ row, size = 'sm' }: { row: Row; size?: 'sm' | 'lg' }) {
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 font-medium text-foreground',
      size === 'sm' ? 'size-7 text-xs' : 'size-10 text-base')}>{monogram(row)}</span>
  )
}

export function SignalBadge({ s }: { s: Signal }) {
  return (
    <Badge variant="secondary" className={cn('rounded-md', TONE[s.tone])}>
      {s.tone !== 'neutral' && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}{s.text}
    </Badge>
  )
}

/** Main signal + "+N" with the rest in a tooltip. */
export function SignalsCell({ row }: { row: Row }) {
  const sg = signals(row)
  if (!sg.length) return <span className="text-xs text-muted-foreground">No signals</span>
  const rest = sg.slice(1)
  return (
    <div className="flex items-center gap-1.5">
      <SignalBadge s={sg[0]} />
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" tabIndex={0} className="rounded-md tabular-nums" aria-label={`${rest.length} more: ${rest.map(s => s.text).join(', ')}`}
              onClick={e => e.stopPropagation()}>+{rest.length}</Badge>
          </TooltipTrigger>
          <TooltipContent>{rest.map(s => s.text).join(' · ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

const runwayTone = { b: 'text-bad', w: 'text-warn', '': 'text-foreground' } as const

export function RunwayCell({ row }: { row: Row }) {
  if (!live(row)) return <span className="text-sm text-muted-foreground">Churned</span>
  const rr = runway(row)
  return (
    <div className="leading-tight">
      <div className={cn('flex items-center gap-1.5 font-medium tabular-nums', runwayTone[rr.c])}>
        {rr.c && <CalendarClock className="size-3.5" aria-hidden="true" />}{rr.t}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{fmtDate(row.renew)}</div>
    </div>
  )
}

export function NrrLine({ row }: { row: Row }) {
  if (row.nrr == null) return <span className="text-xs text-muted-foreground">No NRR data</span>
  const up = row.nrr > 100, dn = row.nrr < 100
  const Icon = up ? ArrowUp : dn ? ArrowDown : ArrowRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs tabular-nums', up ? 'text-good' : dn ? 'text-warn' : 'text-muted-foreground')}>
      <Icon className="size-3" aria-hidden="true" />NRR {row.nrr}%
    </span>
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
          <Button ref={closeRef} variant="ghost" size="icon-xs" aria-label="Close insights" onClick={() => onOpenChange(false)}>×</Button>
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
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {row && <PreviewBody row={row} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function PreviewBody({ row, onClose }: { row: Row; onClose: () => void }) {
  const rr = runway(row), sg = signals(row), ins = insights(row), b = bandOf(row.health)
  const facts: [string, React.ReactNode][] = [
    ['CARR', money(row.carr)],
    ['NRR / GRR', row.nrr == null ? 'No data' : `${row.nrr}% / ${row.grr}%`],
    ['Renewal', <span className={runwayTone[rr.c]}>{live(row) ? `${rr.t} · ${fmtDate(row.renew)}` : 'Churned'}</span>],
    ['Repository', row.repo.toLocaleString()],
    ['Licence use', row.lic == null ? 'No data' : `${row.lic}%`],
  ]
  return (
    <>
      <SheetHeader className="gap-3 border-b border-hairline p-5 pr-12">
        <div className="flex items-center gap-3">
          <Monogram row={row} size="lg" />
          <div className="min-w-0">
            <SheetTitle className="text-lg font-normal">{row.name}</SheetTitle>
            <SheetDescription>{row.seg} · {row.ind} · {row.stage}</SheetDescription>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={cn('text-3xl font-normal tabular-nums tracking-[-0.02em]', bandText[b])}>
            {isMissing(row.health) ? 'No data' : row.health}
          </span>
          <HealthPill value={row.health} />
        </div>
        {sg.length > 0 && <div className="flex flex-wrap gap-1.5">{sg.map(s => <SignalBadge key={s.text} s={s} />)}</div>}
      </SheetHeader>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 p-5 text-sm">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <Separator />
      <div className="grid gap-4 p-5">
        {ins.rows.map(([hd, t]) => (
          <section key={hd}>
            <h3 className="flex items-center gap-2 text-sm font-medium">{hd}<Badge variant="secondary" className="rounded-md">{ins.tag}</Badge></h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{t}</p>
          </section>
        ))}
      </div>
      <SheetFooter className="mt-auto border-t border-hairline p-5">
        <Button onClick={() => { onClose(); go('account') }}>Open account <ArrowRight /></Button>
        <p className="text-xs text-muted-foreground">Only TransAmerica has a full account page in this build.</p>
      </SheetFooter>
    </>
  )
}

/* ---------- loading skeletons matching each widget's shape ---------- */
export function TilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="grid gap-2 rounded-xl border border-hairline bg-card px-5 py-4">
          <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-20" /><Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="grid gap-0" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-hairline px-3 py-3 last:border-0">
          <Skeleton className="size-7 rounded-md" />
          <div className="grid w-48 gap-1.5"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-28" /></div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="hidden h-5 w-28 rounded-md md:block" />
        </div>
      ))}
    </div>
  )
}

export const bandName = (v: number | null) => BAND_LABEL[bandOf(v)]
