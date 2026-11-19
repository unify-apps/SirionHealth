/* openArea: one health area's 18-month line, every input and its evidence. */
import { Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { bandBg, bandOf, bandText } from '@/components/health'
import {
  AREA_NAME, AREA_SOURCE, areaDelta, areaEvidence, areaInputs, areaSeries, latest, months, previous, score,
  strongThisMonth, ymLabel, type AreaKey,
} from '../facts'
import { EvidenceRow } from './bits'

const cfg = { value: { label: 'Score', color: 'var(--chart-1)' } } satisfies ChartConfig

function Sec({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline px-4 py-4 first:border-t-0">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

export function AreaSheet({ area, onOpenChange }: { area: AreaKey | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!area} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {area && <AreaBody k={area} />}
      </SheetContent>
    </Sheet>
  )
}

function AreaBody({ k }: { k: AreaKey }) {
  const v = latest.areas[k], d = areaDelta(k), ins = areaInputs(k), missing = ins.filter(i => i.score == null).length
  const series = areaSeries(k), first = months[0], isAI = AREA_SOURCE[k] === 'ai'
  const strong = strongThisMonth(), earlier = areaEvidence(k).filter(e => e.strong && e.ym !== latest.ym)
  return (
    <>
      <SheetHeader className="border-b border-hairline">
        <p className="text-xs text-muted-foreground">{isAI ? 'Scored by AI from emails' : 'Scored by rules from source data'}</p>
        <SheetTitle className="text-lg font-normal">
          {AREA_NAME[k]}: <span className={cn('tabular-nums', bandText[bandOf(v)])}>{v}</span>
        </SheetTitle>
        <SheetDescription>
          {ymLabel(first.ym)} {first.areas[k]} → {ymLabel(latest.ym)} {v} · {d === 0 ? 'no change' : `${d > 0 ? '+' : '−'}${Math.abs(d)}`} vs {ymLabel(previous.ym)}
        </SheetDescription>
      </SheetHeader>

      <Sec title="Last 18 months">
        <ChartContainer config={cfg} className="aspect-auto h-28 w-full">
          <LineChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: 6 }} accessibilityLayer>
            <XAxis dataKey="label" hide />
            <YAxis domain={[0, 100]} hide />
            <ReferenceLine y={70} stroke="var(--border)" strokeDasharray="3 3" />
            <ReferenceLine y={40} stroke="var(--border)" strokeDasharray="3 3" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
            <Line dataKey="value" stroke="var(--color-value)" strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
          </LineChart>
        </ChartContainer>
        <p className="mt-1 text-xs text-muted-foreground">Dashed lines: Watch below 70, At risk below 40.</p>
      </Sec>

      <Sec title={`Inputs (${ins.length - missing} of ${ins.length} have data)`}>
        <ul className="divide-y divide-hairline">
          {ins.map(i => (
            <li key={i.field} className="grid grid-cols-[minmax(0,1fr)_5rem_3.5rem] items-center gap-3 py-2.5">
              <div className="min-w-0">
                <div>{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.note}</div>
              </div>
              <span className="h-1 overflow-hidden rounded-full bg-muted">
                {i.score != null && <span className={cn('block h-full rounded-full', bandBg[bandOf(i.score)])} style={{ width: `${Math.max(i.score, 2)}%` }} />}
              </span>
              <span className={cn('text-right tabular-nums', i.score == null ? 'text-xs text-muted-foreground' : bandText[bandOf(i.score)])}>
                {i.score ?? 'No data'}
              </span>
            </li>
          ))}
        </ul>
        {missing > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {missing} input{missing > 1 ? 's' : ''} sent no value. They are left out of this area's average and never count as healthy.
          </p>
        )}
      </Sec>

      {k === 'commercial' && (
        <Sec title="Cap rule">
          <p className="leading-relaxed">{score.overrideCode}: “{score.overrideReason}”. Weighted {score.weighted} → final {score.final}.</p>
        </Sec>
      )}

      {k === 'sentiment' && (
        <>
          <Sec title={`Strong negatives in ${ymLabel(latest.ym)} (${strong.length})`}>
            {strong.length
              ? <div className="divide-y divide-hairline">{strong.map(e => <EvidenceRow key={e.text} e={e} />)}</div>
              : <p className="text-muted-foreground">No strong negatives this month.</p>}
          </Sec>
          <Sec title={`Earlier strong negatives, ${ymLabel(months[0].ym)} to ${ymLabel(previous.ym)} (${earlier.length})`}>
            <div className="divide-y divide-hairline">{earlier.map(e => <EvidenceRow key={e.text} e={e} />)}</div>
          </Sec>
        </>
      )}

      <p className="px-4 pb-6 pt-2 text-xs text-muted-foreground">
        Source: AHI's monthly sentiment summaries (AI) and the {ymLabel(latest.ym)} scored record. The original emails are not linked in AHI today.
      </p>
    </>
  )
}
