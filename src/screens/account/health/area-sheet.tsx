import { useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { HealthPill, HealthRing, bandOf, bandText } from '@/components/health'
import { DeltaChip, Empty, ListRow, sheetHeaderCls, Tip } from '@/components/page'
import { cn } from '@/lib/utils'
import { TrendChart } from './charts'
import { InputRow, runText, scoredBy } from './parts'
import { CAP, strongNegatives, ymLabel, type Area, type HealthData, type Statement } from './model'

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

/** What the sentiment AI read: strong negatives this month, earlier ones on demand. */
function SentimentReads({ lastYm }: { lastYm: string }) {
  const [more, setMore] = useState(false)
  const all = strongNegatives()
  const now = all.filter(s => s.ym === lastYm), earlier = all.filter(s => s.ym !== lastYm)
  return (
    <Section title={`Strong negatives in ${ymLabel(lastYm)}`} sub={now.length}>
      {now.length
        ? <ul className="divide-y divide-hairline">{now.map((s, i) => <StatementItem key={i} s={s} />)}</ul>
        : <Empty title="No strong negatives this month" className="py-6" />}
      {earlier.length > 0 && (
        <>
          {more && <ul className="mt-2 divide-y divide-hairline border-t border-hairline pt-2">{earlier.map((s, i) => <StatementItem key={i} s={s} />)}</ul>}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setMore(m => !m)} aria-expanded={more}>
            {more ? 'Show less' : `Show ${earlier.length} earlier, since ${ymLabel(earlier[earlier.length - 1].ym)}`}
          </Button>
        </>
      )}
    </Section>
  )
}

/** One area's drill-down: trend, what drives it, and every input with its score, band and reason. */
export function AreaSheetBody({ area, data, onBack }: { area: Area; data: HealthData; onBack?: () => void }) {
  const ms = data.months, first = ms[0], last = ms[ms.length - 1], prev = ms[ms.length - 2]
  const have = area.scored.length, all = area.inputs.length
  // scored inputs weakest first, then the ones with no data
  const ordered = [...area.scored, ...area.missing]
  return (
    <>
      <SheetHeader className={sheetHeaderCls}>
        {onBack && (
          <Button variant="outline" size="sm" className="w-fit" onClick={onBack}><ArrowLeft />All inputs</Button>
        )}
        <div className="flex items-center gap-3">
          <Tip tip={`${area.name}: ${area.score} of 100, ${area.band.label.toLowerCase()}`}><span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><HealthRing value={area.score} size={44} stroke={3} /></span></Tip>
          <div className="min-w-0">
            <SheetTitle className="text-lg font-normal">{area.name}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <HealthPill value={area.score} />
              <DeltaChip value={area.delta} health label={`vs ${prev?.label ?? 'last month'}`} />
              <span>· {runText(area)}</span>
              <span>· {scoredBy(area.ai)}</span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-hairline">
      <div className="min-w-0">
      <Section title="Last 18 months" sub={`${first.label} ${first.areas[area.key]}, ${last.label} ${area.score}`}>
        <TrendChart months={ms} area={area.key} name={area.name} className="h-44" />
      </Section>

      <Section title="What drives it">
        {area.weakest ? (
          <ul className="grid">
            <li><ListRow icon={ArrowDownRight} title={area.weakest.name} meta={`Pulling it down · ${area.weakest.reason}`}
              right={<span className={cn('text-sm font-medium tabular-nums', bandText[bandOf(area.weakest.score)])}>{area.weakest.score}</span>} className="px-0" /></li>
            {area.strongest && (
              <li><ListRow icon={ArrowUpRight} title={area.strongest.name} meta={`Holding it up · ${area.strongest.reason}`}
                right={<span className={cn('text-sm font-medium tabular-nums', bandText[bandOf(area.strongest.score)])}>{area.strongest.score}</span>} className="px-0" /></li>
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
      </div>
      <div className="min-w-0 border-t border-hairline lg:border-t-0">
      <Section title="Inputs" sub={`${have} of ${all} have data`}>
        {ordered.length
          ? <ul className="divide-y divide-hairline">{ordered.map(i => <InputRow key={i.field + i.name} input={i} />)}</ul>
          : <Empty title="No inputs" className="py-6" />}
        {area.missing.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {area.missing.length} input{area.missing.length > 1 ? 's' : ''} sent no value. AHI stores them as −1;
            they are left out of this area's average and its drivers, and never count as healthy.
          </p>
        )}
      </Section>

      {area.key === 'sentiment' && <SentimentReads lastYm={last.ym} />}
      </div>
      </div>

      <p className="border-t border-hairline px-6 py-4 text-xs text-muted-foreground">
        From AHI's {CAP.snapshot} scored record{area.ai && ' and monthly email summaries'}.
      </p>
    </>
  )
}
