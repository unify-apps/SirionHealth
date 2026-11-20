import { Fragment, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Area as ChartArea, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { RecordSheetBody, RecordSheetHeader, TicketChip } from '@/components/app/record-sheet'
import { ANIM_MS, AREA_FILL_OPACITY, activeDotProps, gridProps, SERIES, thresholdLine, xAxisProps, yAxisProps } from '@/components/charts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BAND_LABEL, bandOf, bandText, isMissing } from '@/components/health'
import { Empty, ListRow, MeterValue, MoreList } from '@/components/page'
import { cn } from '@/lib/utils'
import { fmtFull, parseISO } from '@/lib/dates'
import { CapTerm } from '../overview/bits'
import { PersonLink } from '../stakeholders/person-sheet'
import { dataGaps } from './charts'
import { deltaText, InputRow, runText } from './parts'
import { CAP, strongNegatives, ymLabel, type Area, type HealthData, type Month, type Statement } from './model'

const toneOf = (v: number | null) => { const b = bandOf(v); return b === 'none' ? undefined : b }

function Section({ title, sub, children, className }: { title: string; sub?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-hairline px-6 py-5 first:border-t-0 [&_p]:max-w-[65ch]', className)}>
      <h3 className="text-sm font-medium">{title}{sub && <span className="ml-2 font-normal text-muted-foreground">{sub}</span>}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function StatementItem({ s }: { s: Statement }) {
  return (
    <li className="py-2.5 first:pt-0">
      <p className="text-sm text-pretty">{s.text}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <span>{s.date ? fmtFull(s.date) : ymLabel(s.ym)}</span>
        {s.who.map(n => <Fragment key={n}><span aria-hidden="true">·</span><PersonLink name={n} /></Fragment>)}
        {s.tickets.map(t => <TicketChip key={t} id={t} />)}
      </p>
    </li>
  )
}

/** Monthly area score over the At risk (under 40) and Watch (40 to 69) bands. Band colours are allowed here because
 *  they mean health. Hover or arrow-key a month for its value and band; months with no value are shaded and named. */
function BandTrend({ months, area, name }: { months: Month[]; area: Area['key']; name: string }) {
  const points = months.map(m => ({ tick: m.short, label: m.label, value: isMissing(m.areas[area]) ? null : m.areas[area] }))
  const gaps = dataGaps(points)
  const config = { value: { label: name, color: SERIES[0] } } satisfies ChartConfig
  const text = points.filter(p => p.value != null).map(p => `${p.label} ${p.value}`).join(', ')
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full" role="img"
      aria-label={`${name} score by month: ${text}.${gaps.length ? ' ' + gaps.map(g => g.text).join('. ') : ''}`}>
      <AreaChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
        <ReferenceArea y1={0} y2={40} fill="var(--bad)" fillOpacity={0.08} stroke="none" ifOverflow="hidden" />
        <ReferenceArea y1={40} y2={70} fill="var(--warn)" fillOpacity={0.08} stroke="none" ifOverflow="hidden" />
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="tick" {...xAxisProps} minTickGap={24} />
        <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} {...yAxisProps} />
        <ReferenceLine y={70} {...thresholdLine} />
        <ReferenceLine y={40} {...thresholdLine} />
        {gaps.map(g => (
          <ReferenceArea key={g.from} x1={g.from} x2={g.to} fill="var(--muted)" fillOpacity={0.6} stroke="none" ifOverflow="visible"
            label={{ value: g.text, position: 'insideTop', fontSize: 11, fill: 'var(--muted-foreground)' }} />
        ))}
        <ChartTooltip content={
          <ChartTooltipContent labelFormatter={(_, p) => p?.[0]?.payload?.label}
            formatter={v => {
              const n = Number(v), b = bandOf(n)
              return (
                <div className="flex w-full items-center gap-2">
                  <span className="flex-1 text-muted-foreground">{name}</span>
                  <span className={cn('font-medium tabular-nums', bandText[b])}>{n}</span>
                  <span className="text-muted-foreground">{BAND_LABEL[b]}</span>
                </div>
              )
            }} />
        } />
        <ChartArea dataKey="value" type="linear" connectNulls={false} stroke="var(--color-value)" strokeWidth={2}
          fill="var(--color-value)" fillOpacity={AREA_FILL_OPACITY} dot={false} activeDot={activeDotProps} animationDuration={ANIM_MS} />
      </AreaChart>
    </ChartContainer>
  )
}

/** "99 → 56 · −43": first and latest scored month, then the change. */
function TrendStat({ months, area }: { months: Month[]; area: Area['key'] }) {
  const vals = months.map(m => m.areas[area]).filter(v => !isMissing(v)) as number[]
  if (vals.length < 2) return <span>{vals.length ? vals[0] : 'No data'}</span>
  const a = vals[0], b = vals[vals.length - 1], d = b - a
  return (
    <span className="tabular-nums">
      <span className={bandText[bandOf(a)]}>{a}</span> → <span className={bandText[bandOf(b)]}>{b}</span>
      {' · '}<span className="text-foreground">{d > 0 ? '+' : d < 0 ? '−' : '±'}{Math.abs(d)}</span>
    </span>
  )
}

/** What the sentiment AI read: strong negatives this month (3, then more), earlier months on demand. */
function SentimentReads({ lastYm }: { lastYm: string }) {
  const [more, setMore] = useState(false)
  const all = strongNegatives()
  const now = all.filter(s => s.ym === lastYm), earlier = all.filter(s => s.ym !== lastYm)
  return (
    <Section title={`Strong negatives in ${ymLabel(lastYm)}`} sub={now.length}>
      {now.length
        ? <MoreList items={now} className="divide-y divide-hairline" render={(s, i) => <StatementItem key={i} s={s} />} />
        : <Empty title="No strong negatives this month" className="py-6" />}
      {earlier.length > 0 && (
        <>
          {more && <ul className="mt-3 divide-y divide-hairline border-t border-hairline pt-3">{earlier.map((s, i) => <StatementItem key={i} s={s} />)}</ul>}
          <Button variant="outline" size="sm" className="mt-3 ml-2 rounded-full" onClick={() => setMore(m => !m)} aria-expanded={more}>
            {more ? 'Hide earlier' : `Show ${earlier.length} earlier, since ${ymLabel(earlier[earlier.length - 1].ym)}`}
          </Button>
        </>
      )}
    </Section>
  )
}

/** One area's drill-down, one column: trend, inputs, drivers, cap rule, strong negatives. The single area sheet:
 *  the header bars, driver chips, strength rows, "How scores work" and the Health tab all open this. */
export function AreaSheetBody({ area, data }: { area: Area; data: HealthData }) {
  const ms = data.months, last = ms[ms.length - 1], prev = ms[ms.length - 2]
  const have = area.scored.length, all = area.inputs.length
  // scored inputs weakest first, then the ones with no data
  const ordered = [...area.scored, ...area.missing]
  const vs = (prev?.label ?? 'last month').split(' ')[0]
  return (
    <>
      <RecordSheetHeader
        eyebrow={`Health area · ${area.ai ? 'AI-scored' : 'Rule-based'}`}
        title={<>{area.name} <span className={cn('tabular-nums', bandText[bandOf(area.score)])}>{area.score}</span></>}
        meta={`${runText(area)} · ${deltaText(area.delta, vs)}`} />
      <RecordSheetBody>
      <Section title={`Last ${ms.length} months`} sub={<TrendStat months={ms} area={area.key} />}>
        <BandTrend months={ms} area={area.key} name={area.name} />
      </Section>

      <Section title="Inputs" sub={`${have} of ${all} have data`}>
        {ordered.length
          ? <MoreList items={ordered} n={4} noun="more inputs" className="divide-y divide-hairline" render={i => <InputRow key={i.field + i.name} input={i} />} />
          : <Empty title="No inputs" className="py-6" />}
        {area.missing.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {area.missing.length} sent no value and {area.missing.length > 1 ? 'are' : 'is'} left out of the average and the drivers.
          </p>
        )}
      </Section>

      <Section title="What drives it">
        {area.weakest ? (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-y-1">
            <li><ListRow icon={ArrowDownRight} title={area.weakest.name} meta={`Pulling it down · ${area.weakest.reason}`}
              right={<MeterValue value={area.weakest.score} tone={toneOf(area.weakest.score)} label={area.weakest.name} />} className="px-0" /></li>
            {area.strongest && (
              <li><ListRow icon={ArrowUpRight} title={area.strongest.name} meta={`Holding it up · ${area.strongest.reason}`}
                right={<MeterValue value={area.strongest.score} tone={toneOf(area.strongest.score)} label={area.strongest.name} />} className="px-0" /></li>
            )}
          </ul>
        ) : <Empty title="No inputs with data" sub="Every input in this area sent no value, so nothing can be named as a driver." className="py-6" />}
      </Section>

      {area.key === 'commercial' && CAP.reason && (
        <Section title="Renewal cap">
          <p className="text-sm"><CapTerm focusable={false}>Renewal cap</CapTerm>: {CAP.reason}.</p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Weighted health {CAP.weighted}, capped to {CAP.final}.</p>
        </Section>
      )}

      {area.key === 'sentiment' && <SentimentReads lastYm={last.ym} />}

      <p className="border-t border-hairline px-6 py-4 text-xs text-muted-foreground">
        From the scored health record of {fmtFull(parseISO(CAP.snapshot))}{area.ai && ' and monthly email summaries'}.
      </p>
      </RecordSheetBody>
    </>
  )
}
