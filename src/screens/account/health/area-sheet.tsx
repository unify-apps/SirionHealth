import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { HealthPill, HealthRing, bandOf } from '@/components/health'
import { DeltaChip, Empty, ListRow, MeterValue, MoreList, sheetHeaderCls, Tip } from '@/components/page'
import { cn } from '@/lib/utils'
import { TrendChart } from './charts'
import { InputRow, runText, scoredBy } from './parts'
import { CAP, strongNegatives, ymLabel, type Area, type HealthData, type Statement } from './model'

const toneOf = (v: number | null) => { const b = bandOf(v); return b === 'none' ? undefined : b }
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
      <p className="mt-1 text-xs text-muted-foreground">
        {[s.date ? fmtDay(s.date) : ymLabel(s.ym), ...s.who, ...s.tickets].join(' · ')}
      </p>
    </li>
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

/** One area's drill-down. Top: trend (sticky) beside the inputs. Below, full width: drivers, cap rule, strong negatives. */
export function AreaSheetBody({ area, data, onBack }: { area: Area; data: HealthData; onBack?: () => void }) {
  const ms = data.months, first = ms[0], last = ms[ms.length - 1], prev = ms[ms.length - 2]
  const have = area.scored.length, all = area.inputs.length
  // scored inputs weakest first, then the ones with no data
  const ordered = [...area.scored, ...area.missing]
  // the trend column sticks just under the sticky sheet header, whatever its height
  const head = useRef<HTMLDivElement>(null)
  const [headH, setHeadH] = useState(0)
  useLayoutEffect(() => {
    const el = head.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight))
    ro.observe(el); setHeadH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])
  const vs = (prev?.label ?? 'last month').split(' ')[0]
  return (
    <>
      <SheetHeader ref={head} className={sheetHeaderCls}>
        {onBack && (
          <Button variant="outline" size="sm" className="w-fit" onClick={onBack}><ArrowLeft />All inputs</Button>
        )}
        <div className="flex items-center gap-3">
          <Tip tip={`${area.name}: ${area.score} of 100, ${area.band.label.toLowerCase()}`}><span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><HealthRing value={area.score} size={44} stroke={3} /></span></Tip>
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-1.5 text-lg font-normal">
              {area.name}
              <Tip tip={scoredBy(area.ai)}>
                <button type="button" aria-label={scoredBy(area.ai)} className="grid size-6 place-items-center rounded-full text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                  <Info className="size-4" />
                </button>
              </Tip>
            </SheetTitle>
            <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
              <HealthPill value={area.score} />
              <DeltaChip value={area.delta} health label={`vs ${vs}`} />
              <span className="whitespace-nowrap">{runText(area)}</span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="grid items-start lg:grid-cols-2 lg:divide-x lg:divide-hairline">
        <div className="min-w-0 lg:sticky" style={{ top: headH }}>
          <Section title="Last 18 months" sub={`${first.label} ${first.areas[area.key]}, ${last.label} ${area.score}`}>
            <TrendChart months={ms} area={area.key} name={area.name} className="h-52" />
          </Section>
        </div>
        <div className="min-w-0 border-t border-hairline lg:border-t-0">
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
        </div>
      </div>

      <Section title="What drives it">
        {area.weakest ? (
          <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2">
            <li><ListRow icon={ArrowDownRight} title={area.weakest.name} meta={`Pulling it down · ${area.weakest.reason}`}
              right={<MeterValue value={area.weakest.score} tone={toneOf(area.weakest.score)} label={area.weakest.name} />} className="px-0" /></li>
            {area.strongest && (
              <li><ListRow icon={ArrowUpRight} title={area.strongest.name} meta={`Holding it up · ${area.strongest.reason}`}
                right={<MeterValue value={area.strongest.score} tone={toneOf(area.strongest.score)} label={area.strongest.name} />} className="px-0" /></li>
            )}
          </ul>
        ) : <Empty title="No inputs with data" sub="Every input in this area sent no value, so nothing can be named as a driver." className="py-6" />}
      </Section>

      {area.key === 'commercial' && (
        <Section title="Cap rule">
          <p className="text-sm">{CAP.code}: {CAP.reason}.</p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Weighted health {CAP.weighted}, capped to {CAP.final}.</p>
        </Section>
      )}

      {area.key === 'sentiment' && <SentimentReads lastYm={last.ym} />}

      <p className="border-t border-hairline px-6 py-4 text-xs text-muted-foreground">
        From AHI's {CAP.snapshot} scored record{area.ai && ' and monthly email summaries'}.
      </p>
    </>
  )
}
