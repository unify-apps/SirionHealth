/* renderRunway + openEvent: monthly health since May 2025 with flagged months, key events on the line, the Watch
   line, today and the renewal; every event marker opens its evidence. */
import { Fragment, memo, useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, Scatter, XAxis, YAxis } from 'recharts'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fmtTick } from '@/lib/dates'
import { rangeStart, useRange, type Range } from '@/lib/range'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import {
  ANIM_MS, AREA_FILL_OPACITY, activeDotProps, gridProps, refLabel, SERIES, thresholdLine, tooltipSurface, xAxisProps, yAxisProps,
} from '@/components/charts'
import { RecordSheet, RecordSheetBody, RecordSheetHeader, TicketChip, listPager, useKept, type RecordSheetPager } from '@/components/app/record-sheet'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthPill } from '@/components/health'
import {
  EVENT_LABEL, eventEvidence, events, fmtD, fmtDY, months, RENEWAL, runway, score, sourceLabel, TODAY, ymLabel,
  type Evidence, type KeyEvent, type Month,
} from '../facts'
import { PersonLink } from '../stakeholders/person-sheet'
import { CapTerm, Glossed, useWidget, WidgetBody } from './bits'

const cfg = {
  health: { label: 'Monthly health', color: SERIES[0] },
  proj: { label: 'Held by the cap', color: 'var(--chart-axis)' },
} satisfies ChartConfig

// the axis runs from the first scored month (May 2025 at the earliest) to a week past the renewal, Jan 2027 at the least
export const T0 = +new Date(2025, 4, 1), T1 = Math.max(+new Date(2027, 0, 6), +RENEWAL + 7 * 864e5)
/** Left edge for a range: the start of the month the range begins in, never before the first scored month. */
export const startFor = (r: Range) => { const s = rangeStart(r); return s ? Math.max(T0, +new Date(s.getFullYear(), s.getMonth(), 1)) : T0 }

export type Row = { t: number; health?: number; proj?: number; month?: Month; ev?: number; event?: KeyEvent }

/** Where a month's score sits on the time axis: mid-month, so it lines up under its month and inside its flagged band.
 *  (The record dates each score at month end, which drew May's point under June.) */
const mid = (m: Month) => +new Date(m.date.getFullYear(), m.date.getMonth(), 15)

/** Health at time t, read off the line (or the cap projection after the last month), so events sit on it.
 *  The line is drawn straight between months, so this linear read is exactly on it. */
function healthAt(t: number): number {
  const pts = months.map(m => [mid(m), m.final] as const)
  if (t <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
  }
  return pts[pts.length - 1][1]
}

export function buildRows(): Row[] {
  if (!months.length) return []
  const map = new Map<number, Row>()
  const at = (t: number) => map.get(t) ?? (map.set(t, { t }), map.get(t)!)
  months.forEach(m => Object.assign(at(mid(m)), { health: m.final, month: m }))
  const last = months[months.length - 1]
  // the dashed hold-line runs to an upcoming renewal; a passed one has nothing ahead to project
  if (+RENEWAL > mid(last)) { at(mid(last)).proj = last.final; at(+RENEWAL).proj = last.final }
  events.forEach(e => Object.assign(at(+e.date), { ev: Math.round(healthAt(+e.date)), event: e }))
  return [...map.values()].sort((a, b) => a.t - b.t)
}

/** Flagged months merged into continuous bands. */
export function flaggedBands(): [number, number][] {
  const out: [number, number][] = []
  months.filter(m => m.model).forEach(m => {
    const x1 = +new Date(m.date.getFullYear(), m.date.getMonth(), 1), x2 = +new Date(m.date.getFullYear(), m.date.getMonth() + 1, 1)
    const prev = out[out.length - 1]
    if (prev && x1 === prev[1]) prev[1] = x2 // consecutive flagged months merge into one band
    else out.push([x1, x2])
  })
  return out
}

/** Month ticks from t0; every month on short ranges, every third on long ones. */
export const ticksFrom = (t0: number) => { const out: number[] = [], step = T1 - t0 < 200 * 864e5 ? 1 : 3; for (let d = new Date(t0); +d <= T1; d = new Date(d.getFullYear(), d.getMonth() + step, 1)) out.push(+d); return out }

/** Event markers, at most 8px: risk is a filled dot, positive a ring, everything else a small neutral dot. */
const EV_STYLE: Record<KeyEvent['kind'], { fill: string; stroke: string; r: number }> = {
  neg: { fill: 'var(--bad-fill)', stroke: 'var(--card)', r: 4 },
  flag: { fill: 'var(--bad-fill)', stroke: 'var(--card)', r: 4 },
  pos: { fill: 'var(--card)', stroke: 'var(--good-fill)', r: 3.5 },
  neu: { fill: 'var(--chart-axis)', stroke: 'var(--card)', r: 3 },
  goal: { fill: 'var(--chart-axis)', stroke: 'var(--card)', r: 3 },
  end: { fill: 'var(--chart-axis)', stroke: 'var(--card)', r: 3 },
}

/** `compact`: a shorter plot for the Summary's health card; same data, events, tooltips and sheets. */
export function RunwayChart({ compact = false }: { compact?: boolean }) {
  // the open event lives in the URL (?sheet=event:<iso date>); prev/next walks the events in date order
  const sheet = useSheet()
  const open = sheet?.type === 'event' ? events.find(e => e.iso === sheet.id) ?? null : null
  const pager = listPager(events, open, e => e.iso, e => openSheet('event', e.iso, { replace: true }), 'event')
  const range = useRange()
  const w = useWidget(buildRows)
  const t0 = startFor(range)
  return (
    <>
      <WidgetBody w={w} what="the renewal runway" isEmpty={d => d.length === 0}
        empty={{ title: 'No data', sub: 'No monthly health has been scored for this account yet.' }}
        skeleton={<Skeleton className={cn('w-full rounded-lg', compact ? 'h-[190px]' : 'h-[260px]')} />}>
        {rows => <div className="relative"><Plot rows={rows} t0={t0} onEvent={openEvent} compact={compact} /><Legend menu={compact} /></div>}
      </WidgetBody>
      <EventSheet event={open} onOpenChange={sheetOpenChange} pager={pager} />
    </>
  )
}

// stable, so the memoised Plot never re-renders when a sheet opens
const openEvent = (e: KeyEvent) => openSheet('event', e.iso)

/* memo: the Scatter `shape` is an inline component, so a re-render (the sheet opening) would remount the dots and drop keyboard focus. */
const Plot = memo(function Plot({ rows: all, t0, onEvent, compact }: { rows: Row[]; t0: number; onEvent: (e: KeyEvent) => void; compact: boolean }) {
  // the line keeps the point just before the window so it enters from the left edge instead of starting mid-chart
  const firstIn = all.findIndex(r => r.t >= t0)
  const rows = all.slice(Math.max(0, firstIn - 1)).filter(r => r.t >= t0 || r.health != null)
  const bands = useMemo(() => flaggedBands().filter(([, x2]) => x2 > t0), [t0])
  const label = `Monthly health from ${fmtTick(t0)} to ${ymLabel(months[months.length - 1].ym)}, with ${events.length} events up to the ${fmtDY(RENEWAL)} renewal.`
    + (runway ? ` First flagged ${fmtDY(runway.firstFlag)}.` : '')
  return (
    <div className="-mx-1 overflow-x-auto px-1" role="figure" aria-label={label}>
      <ChartContainer config={cfg} className={cn('aspect-auto w-full', compact ? 'h-[190px] min-w-[520px]' : 'h-[260px] min-w-[640px]')}>
        <ComposedChart data={rows} margin={{ top: 18, right: 16, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="t" type="number" scale="time" domain={[t0, T1]} allowDataOverflow ticks={ticksFrom(t0)} tickFormatter={fmtTick} {...xAxisProps} />
          <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} {...yAxisProps} />

          {bands.map(([x1, x2]) => (
            <ReferenceArea key={x1} x1={Math.max(x1, t0)} x2={x2} y1={0} y2={100} fill="var(--chart-axis)" fillOpacity={0.07} strokeOpacity={0} ifOverflow="hidden" />
          ))}
          <ReferenceLine y={70} {...thresholdLine} label={refLabel('Healthy 70')} />
          <ReferenceLine x={+TODAY} {...thresholdLine} label={refLabel('Today', 'top')} />
          <ReferenceLine x={+RENEWAL} {...thresholdLine} label={refLabel('Renewal', 'top')} />

          <Line dataKey="proj" stroke="var(--color-proj)" strokeDasharray="3 3" strokeWidth={2} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
          <Area dataKey="health" type="linear" stroke="var(--color-health)" strokeWidth={2} fill="var(--color-health)" fillOpacity={AREA_FILL_OPACITY}
            connectNulls activeDot={activeDotProps} animationDuration={ANIM_MS}
            dot={false} />
          <Scatter dataKey="ev" isAnimationActive={false}
            shape={(p: unknown) => <EventMark {...(p as { cx: number; cy: number; payload: Row })} onEvent={onEvent} />} />

          <ChartTooltip content={<RunwayTip />} />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
})

export function EventMark({ cx, cy, payload, onEvent }: { cx: number; cy: number; payload: Row; onEvent: (e: KeyEvent) => void }) {
  const e = payload.event
  if (!e || cx == null) return null
  const s = EV_STYLE[e.kind]
  const act = () => onEvent(e)
  return (
    <g role="button" tabIndex={0} aria-label={`${fmtDY(e.date)}: ${e.text}. Open evidence`} className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-ring [&:hover>circle:first-child]:fill-accent"
      onClick={act} onKeyDown={k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); act() } }}>
      <circle cx={cx} cy={cy} r={12} fill="transparent" stroke="transparent" pointerEvents="all" />
      <circle cx={cx} cy={cy} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={e.kind === 'pos' ? 2 : 1.5} />
    </g>
  )
}

export function RunwayTip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className={cn(tooltipSurface, 'min-w-44 max-w-64')}>
      <div className="font-medium">{row.month ? ymLabel(row.month.ym) : fmtDY(new Date(row.t))}</div>
      {row.health != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Health</span>
          <span className="flex items-center gap-1.5 tabular-nums">{row.health}{row.month?.model && <HealthPill band="warn">Flagged</HealthPill>}</span>
        </div>
      )}
      {row.health == null && row.proj != null && <div className="text-muted-foreground">Held at {row.proj} by the renewal cap until signed</div>}
      {row.event && (
        <div className="border-t border-hairline pt-1.5">
          <div className="text-muted-foreground">{EVENT_LABEL[row.event.kind]} · {fmtD(row.event.date)}</div>
          <div>{row.event.text}</div>
          <div className="mt-1 text-muted-foreground">Click for evidence</div>
        </div>
      )}
    </div>
  )
}

function Legend({ menu = false }: { menu?: boolean }) {
  const items: [React.ReactNode, string][] = [
    [<span className="inline-block h-0.5 w-4 rounded bg-chart-1" />, 'Monthly health'],
    [<span className="inline-block h-2.5 w-3 rounded-sm bg-chart-axis/15" />, 'Months the model flagged'],
    [<span className="inline-block w-4 border-t-2 border-dotted border-chart-axis" />, 'Held by the renewal cap until signed'],
    [<span className="inline-block size-2 rounded-full bg-bad-fill" />, 'Risk event'],
    [<span className="inline-block size-2 rounded-full border-2 border-good-fill" />, 'Positive event'],
    [<span className="inline-block size-1.5 rounded-full bg-chart-axis" />, 'Other event'],
  ]
  const list = (
    <ul className={cn('text-xs text-muted-foreground', menu ? 'grid gap-2' : 'mt-3 flex flex-wrap gap-x-4 gap-y-1.5')}>
      {items.map(([m, l]) => <li key={l} className="flex items-center gap-2"><span aria-hidden="true" className="inline-flex w-4 justify-center">{m}</span>{l}</li>)}
    </ul>
  )
  if (!menu) return list
  // compact: the key folds into a small icon button at the top right, opening on click
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Chart legend"
          className="absolute -top-8 right-0 grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <Info className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Legend</p>
        {list}
      </PopoverContent>
    </Popover>
  )
}

// "On August 28, " opens most summary statements; the sheet's meta line already gives the date
const LEAD_DATE = /^On (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},?\s+/
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** One summary statement behind an event. The date shows only when it isn't the event's own (already in the meta line). */
function Statement({ e, on }: { e: Evidence; on: Date }) {
  const own = !!e.date && sameDay(e.date, on)
  const text = own ? e.text.replace(LEAD_DATE, '').replace(/^./, c => c.toUpperCase()) : e.text
  const meta = !own || e.strong || e.who.length > 0 || e.tickets.length > 0
  return (
    <li className="py-3 first:pt-0">
      <p className="max-w-[65ch] leading-relaxed text-pretty">{text}</p>
      {meta && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          {e.strong && <HealthPill band="bad">Strong negative</HealthPill>}
          {!own && <span className="tabular-nums">{e.date ? fmtDY(e.date) : ymLabel(e.ym)}</span>}
          {e.who.map((n, i) => <Fragment key={n}>{(i > 0 || !own || e.strong) && <span aria-hidden="true">·</span>}<PersonLink name={n} /></Fragment>)}
          {e.tickets.map(t => <TicketChip key={t} id={t} />)}
        </p>
      )}
    </li>
  )
}

export function EventSheet({ event: live, onOpenChange, pager }: { event: KeyEvent | null; onOpenChange: (o: boolean) => void; pager?: RecordSheetPager }) {
  const event = useKept(live)
  const related = event ? eventEvidence(event) : []
  return (
    <RecordSheet open={!!live} onOpenChange={onOpenChange} size="md" pager={pager} view={event?.iso}>
      {event && (
        <>
          <RecordSheetHeader eyebrow="Runway event" title={<Glossed text={event.text} focusable={false} />}
            meta={<span className="tabular-nums">{fmtDY(event.date)} · {EVENT_LABEL[event.kind]} · {sourceLabel(event.source)}</span>} />
          <RecordSheetBody>
            <div className="flex flex-col gap-6 p-6">
              {event.kind === 'flag' && (
                <section className="min-w-0">
                  <h3 className="text-sm font-medium">Score</h3>
                  <p className="mt-1 tabular-nums">{score.cap ? <>Weighted {score.weighted} → final {score.final} (<CapTerm focusable={false} />)</> : <>Health {score.final}</>}</p>
                </section>
              )}
              <section className="min-w-0">
                <h3 className="text-sm font-medium">{related.length > 1 ? 'What the summaries say' : related.length ? 'What the summary says' : 'Evidence'}</h3>
                {related.length
                  ? <ul className="mt-2 divide-y divide-hairline">{related.map(e => <Statement key={e.text} e={e} on={event.date} />)}</ul>
                  : <p className="mt-1 text-muted-foreground">No monthly summary mentions this date.</p>}
              </section>
            </div>
          </RecordSheetBody>
        </>
      )}
    </RecordSheet>
  )
}
