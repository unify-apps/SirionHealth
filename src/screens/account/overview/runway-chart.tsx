/* renderRunway + openEvent: monthly health since May 2025 with flagged months, key events, the Watch line,
   today, and the renewal window; every event marker opens its evidence. */
import { useMemo, useState } from 'react'
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, Scatter, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthPill } from '@/components/health'
import {
  EVENT_LABEL, eventEvidence, events, fmtD, fmtDY, months, RENEWAL, renewal, runway, score, sourceLabel, TODAY, ymLabel,
  type KeyEvent, type Month,
} from '../facts'
import { EvidenceRow, useWidget, WidgetBody } from './bits'

const cfg = {
  health: { label: 'Monthly health', color: 'var(--chart-1)' },
  proj: { label: 'Held by the cap', color: 'var(--chart-3)' },
} satisfies ChartConfig

const T0 = +new Date(2025, 4, 1), T1 = +new Date(2027, 0, 6), EV_Y = -12
const LABELLED: Record<string, [string, 0 | 1, 'middle' | 'end']> = {
  '2026-08-28': ['Renewal threatened', 0, 'middle'], '2026-10-21': ['Champion handed over', 1, 'middle'], '2026-12-30': [`Renewal ${renewal.carrLabel}`, 0, 'end'],
}

type Row = { t: number; health?: number; proj?: number; month?: Month; ev?: number; event?: KeyEvent }

function buildRows(): Row[] {
  if (!months.length) return []
  const map = new Map<number, Row>()
  const at = (t: number) => map.get(t) ?? (map.set(t, { t }), map.get(t)!)
  months.forEach(m => Object.assign(at(+m.date), { health: m.final, month: m }))
  const last = months[months.length - 1]
  at(+last.date).proj = last.final
  at(+RENEWAL).proj = last.final
  events.forEach(e => Object.assign(at(+e.date), { ev: EV_Y, event: e }))
  return [...map.values()].sort((a, b) => a.t - b.t)
}

const TICKS = (() => { const out: number[] = []; for (let d = new Date(T0); +d <= T1; d = new Date(d.getFullYear(), d.getMonth() + 3, 1)) out.push(+d); return out })()
const tickLabel = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

const EV_STYLE: Record<KeyEvent['kind'], { fill: string; stroke: string; r: number; sw: number }> = {
  neg: { fill: 'var(--bad)', stroke: 'var(--bad)', r: 4, sw: 1.5 },
  pos: { fill: 'var(--card)', stroke: 'var(--good)', r: 4, sw: 2 },
  neu: { fill: 'var(--card)', stroke: 'var(--muted-foreground)', r: 3.5, sw: 1.5 },
  flag: { fill: 'var(--card)', stroke: 'var(--warn)', r: 4, sw: 2 },
  goal: { fill: 'var(--foreground)', stroke: 'var(--foreground)', r: 3.5, sw: 1 },
  end: { fill: 'var(--card)', stroke: 'var(--foreground)', r: 5.5, sw: 2.5 },
}

export function RunwayChart() {
  const [open, setOpen] = useState<KeyEvent | null>(null)
  const w = useWidget(buildRows)
  return (
    <>
      <WidgetBody w={w} what="the renewal runway" isEmpty={d => d.length === 0}
        empty={{ title: 'No data', sub: 'No monthly health has been scored for this account yet.' }}
        skeleton={<Skeleton className="h-[300px] w-full rounded-lg" />}>
        {rows => <Plot rows={rows} onEvent={setOpen} />}
      </WidgetBody>
      <Legend />
      <EventSheet event={open} onOpenChange={o => !o && setOpen(null)} />
    </>
  )
}

function Plot({ rows, onEvent }: { rows: Row[]; onEvent: (e: KeyEvent) => void }) {
  const flagged = useMemo(() => months.filter(m => m.model), [])
  const label = `Monthly health from ${ymLabel(months[0].ym)} to ${ymLabel(months[months.length - 1].ym)}, with ${events.length} events up to the ${fmtDY(RENEWAL)} renewal.`
    + (runway ? ` First flagged ${fmtDY(runway.firstFlag)}.` : '')
  return (
    <div className="-mx-1 overflow-x-auto px-1" role="figure" aria-label={label}>
      <ChartContainer config={cfg} className="aspect-auto h-[300px] w-full min-w-[680px]">
        <ComposedChart data={rows} margin={{ top: 18, right: 16, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="0" stroke="var(--hairline)" />
          <XAxis dataKey="t" type="number" scale="time" domain={[T0, T1]} ticks={TICKS} tickFormatter={tickLabel}
            tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis domain={[-36, 100]} ticks={[0, 40, 70, 100]} width={32} tickLine={false} axisLine={false} tickMargin={6} />

          <ReferenceArea x1={+renewal.windowStart} x2={+RENEWAL} y1={-36} y2={100} fill="var(--foreground)" fillOpacity={0.04}
            ifOverflow="hidden" label={{ value: 'Renewal window', position: 'insideTopLeft', fontSize: 11, fill: 'var(--muted-foreground)' }} />
          {flagged.map(m => (
            <ReferenceArea key={m.ym} x1={+new Date(m.date.getFullYear(), m.date.getMonth(), 1)} x2={+m.date} y1={0} y2={100}
              fill="var(--warn)" fillOpacity={0.08} strokeOpacity={0} />
          ))}
          <ReferenceLine y={70} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="4 4"
            label={{ value: 'Watch below 70', position: 'insideBottomLeft', fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <ReferenceLine y={EV_Y} stroke="var(--border)" />
          <ReferenceLine x={+TODAY} stroke="var(--foreground)" strokeOpacity={0.5} strokeDasharray="2 3"
            label={{ value: 'Today', position: 'top', fontSize: 11, fill: 'var(--muted-foreground)' }} />

          <Line dataKey="proj" stroke="var(--color-proj)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
          <Line dataKey="health" stroke="var(--color-health)" strokeWidth={2} connectNulls activeDot={{ r: 5 }}
            dot={(p: { cx?: number; cy?: number; payload?: Row; index?: number }) => {
              if (p.cx == null || p.cy == null || p.payload?.health == null) return <g key={p.index} />
              const f = p.payload.month?.model
              return <circle key={p.index} cx={p.cx} cy={p.cy} r={3.5} fill={f ? 'var(--warn)' : 'var(--card)'} stroke={f ? 'var(--warn)' : 'var(--color-health)'} strokeWidth={1.75} />
            }} />
          <Scatter dataKey="ev" isAnimationActive={false}
            shape={(p: unknown) => <EventMark {...(p as { cx: number; cy: number; payload: Row })} onEvent={onEvent} />} />

          <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<RunwayTip />} />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}

function EventMark({ cx, cy, payload, onEvent }: { cx: number; cy: number; payload: Row; onEvent: (e: KeyEvent) => void }) {
  const e = payload.event
  if (!e || cx == null) return null
  const s = EV_STYLE[e.kind], lab = LABELLED[e.iso]
  const act = () => onEvent(e)
  return (
    <g role="button" tabIndex={0} aria-label={`${fmtDY(e.date)}: ${e.text}. Open evidence`} className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-ring"
      onClick={act} onKeyDown={k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); act() } }}>
      <circle cx={cx} cy={cy} r={11} fill="transparent" stroke="transparent" strokeWidth={2} />
      {e.kind === 'goal'
        ? <rect x={cx - 3.5} y={cy - 3.5} width={7} height={7} transform={`rotate(45 ${cx} ${cy})`} fill={s.fill} />
        : <circle cx={cx} cy={cy} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.sw} />}
      {lab && (
        <text x={lab[2] === 'end' ? cx + 4 : cx} y={cy + 18 + lab[1] * 13} textAnchor={lab[2]} fontSize={11} fill="var(--foreground)">
          {lab[0]} <tspan fill="var(--muted-foreground)">{fmtD(e.date)}</tspan>
        </text>
      )}
    </g>
  )
}

function RunwayTip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="grid min-w-44 max-w-64 gap-1.5 rounded-lg bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
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

function Legend() {
  const dot = (cls: string) => <span className={cn('inline-block size-2 rounded-full', cls)} aria-hidden="true" />
  const items: [React.ReactNode, string][] = [
    [<span className="inline-block h-0.5 w-4 rounded bg-chart-1" />, 'Monthly health'],
    [<span className="inline-block size-2.5 rounded-sm bg-warn/20" />, 'Flagged by the model (under 70)'],
    [dot('bg-bad'), 'Risk event'],
    [dot('border-2 border-good'), 'Positive event'],
    [<span className="inline-block size-2 rotate-45 bg-foreground" />, `Target (commit by ${fmtD(events.find(e => e.kind === 'goal')?.date ?? RENEWAL)})`],
    [<span className="inline-block h-2.5 w-4 rounded-sm bg-foreground/10" />, 'Renewal window, last 90 days'],
  ]
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map(([m, l]) => <li key={l} className="flex items-center gap-1.5">{m}{l}</li>)}
    </ul>
  )
}

function EventSheet({ event, onOpenChange }: { event: KeyEvent | null; onOpenChange: (o: boolean) => void }) {
  const related = event ? eventEvidence(event) : []
  return (
    <Sheet open={!!event} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {event && (
          <>
            <SheetHeader className="border-b border-hairline">
              <SheetDescription>{fmtDY(event.date)} · {EVENT_LABEL[event.kind]}</SheetDescription>
              <SheetTitle className="text-lg font-normal leading-snug">{event.text}</SheetTitle>
            </SheetHeader>
            <section className="space-y-1 px-4 py-4">
              <h3 className="text-sm font-medium">Source</h3>
              <p>{sourceLabel(event.source)}</p>
              {event.ai && <p className="text-xs text-muted-foreground">Written by AI</p>}
              {event.kind === 'flag' && <p className="text-muted-foreground">Weighted {score.weighted} → final {score.final} ({score.overrideCode}).</p>}
            </section>
            <section className="border-t border-hairline px-4 py-4">
              <h3 className="text-sm font-medium">Evidence</h3>
              {related.length
                ? <div className="divide-y divide-hairline">{related.map(e => <EvidenceRow key={e.text} e={e} />)}</div>
                : <p className="mt-1 text-muted-foreground">No monthly summary statement on this date. The event comes from {sourceLabel(event.source).toLowerCase()}.</p>}
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
