import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, bandText, isMissing, type Band } from '@/components/health'
import { DeltaChip } from '@/components/page'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/legacy'
import { fmtMonthName } from '@/lib/dates'
import type { Evidence } from '../stakeholders/model'
import type { JourneyMonth, SentimentMonth } from './model'
import { fmtDY, ymLabel, ymLong } from './shared'

/* ---- timeline to renewal: one slim column per month, height = health, colour = band; events as dots above ---- */
const FILL: Record<Band, string> = { good: 'bg-good-fill', warn: 'bg-warn-fill', bad: 'bg-bad-fill', none: 'bg-muted' }

/** A slim strip: one segment per month coloured by its health band, event dots above, sparse labels below
 *  (quarter starts, today, renewal). The score and events are in each segment's tooltip. */
export function HealthRibbon({ months, renewal }: { months: JourneyMonth[]; renewal: { label: string; date: Date } }) {
  const nowIdx = months.findIndex(m => m.state === 'now')
  const todayAt = (TODAY.getDate() / new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate()) * 100
  const nNeg = months.filter(m => m.neg).length, nPos = months.filter(m => m.pos).length
  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[480px] gap-0.5" aria-label={`Monthly health, ${ymLabel(months[0].ym)} to the ${renewal.label}: ${nNeg} months with risk events, ${nPos} with positive events`}>
        {months.map((m, i) => {
          const future = m.state === 'up', isNow = i === nowIdx, last = i === months.length - 1
          const scored = !future && !isMissing(m.health)
          const b = scored ? bandOf(m.health) : 'none'
          const mo = +m.ym.slice(5)
          const label = isNow ? 'Today' : last ? 'Renewal' : i === 0 || mo === 1 ? `${fmtMonthName(m.ym).slice(0, 3)} ${m.ym.slice(2, 4)}` : mo % 3 === 1 ? fmtMonthName(m.ym).slice(0, 3) : ''
          const tip = (
            <div className="grid gap-0.5">
              <p className="font-medium">{ymLong(m.ym)}{isNow && ' · today'}</p>
              <p className="opacity-80">{future || (isNow && !scored) ? 'Not scored yet' : !scored ? 'No health score' : `Health ${m.health} · ${BAND_LABEL[b]}`}</p>
              {m.events.slice(0, 4).map(e => <p key={e} className="opacity-80">{e}</p>)}
              {m.events.length > 4 && <p className="opacity-80">+{m.events.length - 4} more</p>}
              {last && <p className="opacity-80">{renewal.label} · {fmtDY(renewal.date)}</p>}
            </div>
          )
          return (
            <li key={m.ym} className="grid min-w-0 flex-1 gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`${ymLabel(m.ym)}: ${future ? 'upcoming' : !scored ? 'not scored' : `health ${m.health}`}${m.events.length ? `, ${m.events.length} events` : ''}`}
                    className="group grid gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex h-1.5 items-center justify-center gap-0.5" aria-hidden="true">
                      {m.neg > 0 && <span className="size-1.5 rounded-full bg-bad-fill" />}
                      {m.pos > 0 && <span className="size-1.5 rounded-full bg-good-fill" />}
                    </span>
                    <span aria-hidden="true" className={cn('relative h-2.5 transition-opacity group-hover:opacity-75',
                      i === 0 && 'rounded-l-full', last && 'rounded-r-full',
                      future ? 'border border-dashed border-muted-foreground/50' : FILL[b])}>
                      {/* today: a thin tick at today's place in the month, not a box around it */}
                      {isNow && <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${todayAt}%` }} />}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{tip}</TooltipContent>
              </Tooltip>
              <span className={cn('h-3 text-[10px] leading-3 whitespace-nowrap', isNow || last ? 'font-medium text-foreground' : 'text-muted-foreground', last && 'justify-self-end')} aria-hidden="true"
                style={isNow ? { marginLeft: `${todayAt}%`, transform: 'translateX(-50%)' } : undefined}>{label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Legend for the ribbon, small enough to sit in its block header. */
export function RibbonLegend() {
  return (
    <span className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-bad-fill" aria-hidden="true" />Risk event</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-good-fill" aria-hidden="true" />Positive event</span>
    </span>
  )
}

/* ---- monthly sentiment: why the sentiment score moved, month by month ---- */
export function SentimentMonths({ months }: { months: SentimentMonth[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? months : months.slice(0, 6)
  return (
    <div className="grid gap-3">
      <ol className="grid divide-y divide-hairline">
        {shown.map(m => {
          const b = bandOf(m.score), d = m.score != null && m.prev != null ? m.score - m.prev : null
          return (
            <li key={m.ym} className="grid gap-3 py-4 first:pt-0 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
              <div>
                <h4 className="font-medium">{ymLong(m.ym)}</h4>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {isMissing(m.score) ? <span>No data</span> : <span className={cn('text-base tabular-nums font-medium', bandText[b])}>{m.score}</span>}
                  {d != null && <DeltaChip value={d} health label={`vs ${fmtMonthName(prevYm(m.ym))}`} />}
                </p>
              </div>
              <Drivers label="Positive" items={m.pos} dot="bg-good-fill" />
              <Drivers label="Negative" items={m.neg} dot="bg-bad-fill" />
            </li>
          )
        })}
      </ol>
      {months.length > 6 && (
        <Button variant="outline" size="sm" className="mx-auto" onClick={() => setAll(v => !v)} aria-expanded={all}>
          {all ? 'Show the last 6 months' : `Show all ${months.length} months`}
        </Button>
      )}
    </div>
  )
}
const prevYm = (ym: string) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }

function Drivers({ label, items, dot }: { label: string; items: Evidence[]; dot: string }) {
  return (
    <div className="min-w-0">
      <h5 className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><span className={cn('size-1.5 rounded-full', dot)} aria-hidden="true" />{label}</h5>
      {items.length ? (
        <ul className="grid gap-2">
          {items.map((e, i) => (
            <li key={i} className="leading-relaxed text-pretty">
              {e.text}
              {e.strong && <span className="ml-1.5 inline-flex rounded-md bg-bad-soft px-1.5 text-xs text-bad">Strong signal</span>}
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground">None recorded.</p>}
    </div>
  )
}
