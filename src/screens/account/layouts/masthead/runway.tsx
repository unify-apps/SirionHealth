/* The renewal runway, naked: no frame, no legend. Every mark is labelled where it sits (healthy line, flagged months,
   today, the renewal, the cap's hold line); the renewal line stays ink, since red on this page is kept for the due date, and event dots open their evidence like the shared chart's. */
import { memo, useMemo } from 'react'
import { Area, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, Scatter, XAxis, YAxis } from 'recharts'
import { fmtTick } from '@/lib/dates'
import { useRange } from '@/lib/range'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { AREA_FILL_OPACITY, SERIES, xAxisProps } from '@/components/charts'
import { listPager } from '@/components/app/record-sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ACCT, fmtD, fmtDY, events, months, RENEWAL, runway, score, TODAY, ymLabel, type KeyEvent } from '../../facts'
import { useWidget, WidgetBody } from '../../overview/bits'
import { buildRows, EventMark, EventSheet, flaggedBands, RunwayTip, startFor, T1, ticksFrom, type Row } from '../../overview/runway-chart'

const cfg = { health: { label: 'Monthly health', color: SERIES[0] } } satisfies ChartConfig
const openEvent = (e: KeyEvent) => openSheet('event', e.iso)

export function NakedRunway() {
  const sheet = useSheet()
  const open = sheet?.type === 'event' ? events.find(e => e.iso === sheet.id) ?? null : null
  const pager = listPager(events, open, e => e.iso, e => openSheet('event', e.iso, { replace: true }), 'event')
  const range = useRange()
  const w = useWidget(buildRows)
  return (
    <>
      <WidgetBody w={w} what="the renewal runway" isEmpty={d => d.length === 0}
        empty={{ title: 'No data', sub: 'No monthly health has been scored for this account yet.' }}
        skeleton={<Skeleton className="h-[220px] w-full rounded-lg" />}>
        {rows => <Plot rows={rows} t0={startFor(range)} />}
      </WidgetBody>
      <EventSheet event={open} onOpenChange={sheetOpenChange} pager={pager} />
    </>
  )
}

const label = (value: string, position: 'insideTopLeft' | 'insideTopRight' | 'insideBottomLeft' | 'insideBottomRight' | 'top' | 'bottom' | 'right' | 'left' | 'insideTop', dy = 0) =>
  ({ value, position, fill: 'var(--muted-foreground)', fontSize: 11, dy })

/** The two latest risk events get a direct label on the line: what happened, and when. */
const short = (t: string) => {
  const s = t.replace(new RegExp(`^${ACCT.name}\\s+`, 'i'), '').replace(/^./, c => c.toUpperCase())
  return s.length > 34 ? `${s.slice(0, 35).replace(/\s+\S*$/, '')}…` : s
}

const Plot = memo(function Plot({ rows: all, t0 }: { rows: Row[]; t0: number }) {
  const firstIn = all.findIndex(r => r.t >= t0)
  const rows = all.slice(Math.max(0, firstIn - 1)).filter(r => r.t >= t0 || r.health != null)
  const bands = useMemo(() => flaggedBands().filter(([, x2]) => x2 > t0), [t0])
  const last = months[months.length - 1]
  const upcoming = +RENEWAL > +TODAY
  const called = rows.filter(r => r.event && r.event.kind === 'neg' && +r.event.date <= +TODAY && r.t >= t0).slice(-2)
  const aria = `Monthly health from ${fmtTick(t0)} to ${ymLabel(last.ym)}, now ${last.final}, with ${events.length} events up to the ${fmtDY(RENEWAL)} renewal.`
    + (runway ? ` First flagged ${fmtDY(runway.firstFlag)}.` : '')
  return (
    <div className="-mx-1 overflow-x-auto px-1" role="figure" aria-label={aria}>
      <ChartContainer config={cfg} className="aspect-auto h-[220px] w-full min-w-[640px]">
        <ComposedChart data={rows} margin={{ top: 26, right: 28, bottom: 0, left: 8 }} accessibilityLayer>
          <XAxis dataKey="t" type="number" scale="time" domain={[t0, T1]} allowDataOverflow ticks={ticksFrom(t0)} tickFormatter={fmtTick} {...xAxisProps} />
          <YAxis domain={[0, 100]} hide />

          {bands.map(([x1, x2], i) => (
            <ReferenceArea key={x1} x1={Math.max(x1, t0)} x2={x2} y1={0} y2={100} fill="var(--chart-axis)" fillOpacity={0.07} strokeOpacity={0} ifOverflow="hidden"
              label={i === 0 ? label('Flagged', 'insideTopLeft', -2) : undefined} />
          ))}
          <ReferenceLine y={70} stroke="var(--chart-axis)" strokeOpacity={0.5} strokeDasharray="3 3" label={label('Healthy 70', 'insideTopLeft')} />
          <ReferenceLine x={+TODAY} stroke="var(--chart-axis)" strokeOpacity={0.5} label={label('Today', 'top')} />
          <ReferenceLine x={+RENEWAL} stroke="var(--foreground)" strokeOpacity={0.45} label={{ ...label('Renewal', 'top'), fill: 'var(--foreground)' }} />

          <Line dataKey="proj" stroke="var(--chart-axis)" strokeDasharray="3 3" strokeWidth={2} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
          {/* no draw-in animation: the line must be there in any capture and under reduced motion */}
          <Area dataKey="health" type="linear" stroke="var(--color-health)" strokeWidth={2} fill="var(--color-health)" fillOpacity={AREA_FILL_OPACITY * 1.5}
            connectNulls dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Scatter dataKey="ev" isAnimationActive={false}
            shape={(p: unknown) => <EventMark {...(p as { cx: number; cy: number; payload: Row })} onEvent={openEvent} />} />
          {upcoming && score.cap > 0 && (
            <ReferenceDot x={(+TODAY + +RENEWAL) / 2} y={last.final} r={0} label={{ ...label(`Held at ${last.final} until signed`, 'top', 0), textAnchor: 'middle', offset: 8 }} />
          )}

          {called.map((r, i) => (
            <ReferenceDot key={r.t} x={r.t} y={r.ev!} r={0}
              label={{ value: `${short(r.event!.text)}, ${fmtD(r.event!.date)}`, position: i % 2 ? 'bottom' : 'top', offset: i % 2 ? 14 : 22, fill: 'var(--foreground)', fontSize: 11, textAnchor: i % 2 ? 'end' : 'middle' }} />
          ))}

          <ChartTooltip content={<RunwayTip />} />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
})
