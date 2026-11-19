/* openArea: one health area's 18-month line, every input and its evidence. */
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Meter, ScoreTrend } from '@/components/charts'
import { bandBg, bandOf, bandText } from '@/components/health'
import {
  AREA_NAME, AREA_SOURCE, areaDelta, areaEvidence, areaInputs, areaSeries, latest, months, previous, score,
  strongThisMonth, ymLabel, type AreaKey,
} from '../facts'
import { EvidenceRow, Glossed, Term } from './bits'
import { BAND_LABEL } from '@/components/health'

function Sec({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('min-w-0', className)}>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

export function AreaSheet({ area, onOpenChange }: { area: AreaKey | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!area} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-4xl">
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
      <SheetHeader className="sticky top-0 z-10 border-b border-hairline bg-popover px-6 py-4 pr-14">
        <p className="text-xs text-muted-foreground">{isAI ? 'Scored by AI from emails' : 'Scored by rules from source data'}</p>
        <SheetTitle className="text-lg font-normal">
          {AREA_NAME[k]}: <span className={cn('tabular-nums', bandText[bandOf(v)])}>{v}</span>
        </SheetTitle>
        <SheetDescription>
          {ymLabel(first.ym)} {first.areas[k]} → {ymLabel(latest.ym)} {v} · {d === 0 ? 'no change' : `${d > 0 ? '+' : '−'}${Math.abs(d)}`} vs {ymLabel(previous.ym)}
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-8">
          <Sec title="Last 18 months">
            <ScoreTrend name={AREA_NAME[k]} data={series.map(p => ({ tick: p.label.replace(/ 20(\d\d)$/, " '$1"), label: p.label, value: p.value }))} />
          </Sec>

          {k === 'commercial' && (
            <Sec title="Cap rule">
              <p className="leading-relaxed"><Term>{score.overrideCode}</Term>: “{score.overrideReason}”. Weighted {score.weighted} → final {score.final}.</p>
            </Sec>
          )}

          {k === 'sentiment' && (
            <Sec title={`Strong negatives in ${ymLabel(latest.ym)} (${strong.length})`}>
              {strong.length
                ? <div className="divide-y divide-hairline">{strong.map(e => <EvidenceRow key={e.text} e={e} />)}</div>
                : <p className="text-muted-foreground">No strong negatives this month.</p>}
            </Sec>
          )}
        </div>

        <Sec title={`Inputs (${ins.length - missing} of ${ins.length} have data)`}>
          <ul className="divide-y divide-hairline">
            {ins.map(i => {
              const b = bandOf(i.score)
              return (
                <li key={i.field} className="grid grid-cols-[minmax(0,1fr)_5rem_3.5rem] items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <div><Glossed text={i.name} /></div>
                    <div className="text-xs text-muted-foreground"><Glossed text={i.note} /></div>
                  </div>
                  <Meter value={i.score} min={2} fill={bandBg[b]}
                    tip={i.score == null ? `${i.name}: no data, left out of the average` : `${i.name}: ${i.score} of 100 · ${BAND_LABEL[b]}`} />
                  <span className={cn('text-right tabular-nums', i.score == null ? 'text-xs text-muted-foreground' : bandText[b])}>
                    {i.score ?? 'No data'}
                  </span>
                </li>
              )
            })}
          </ul>
          {missing > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {missing} input{missing > 1 ? 's' : ''} sent no value. They are left out of this area's average and never count as healthy.
            </p>
          )}
        </Sec>

        {k === 'sentiment' && earlier.length > 0 && (
          <Sec className="lg:col-span-2" title={`Earlier strong negatives, ${ymLabel(months[0].ym)} to ${ymLabel(previous.ym)} (${earlier.length})`}>
            <div className="grid gap-x-8 divide-y divide-hairline lg:grid-cols-2 lg:divide-y-0">{earlier.map(e => <EvidenceRow key={e.text} e={e} />)}</div>
          </Sec>
        )}
      </div>

      <p className="px-6 pb-6 text-xs text-muted-foreground">
        Source: AHI's monthly sentiment summaries (AI) and the {ymLabel(latest.ym)} scored record. The original emails are not linked in AHI today.
      </p>
    </>
  )
}
