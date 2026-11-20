import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Flag, Triangle } from 'lucide-react'
import { BAND_LABEL, bandOf, bandText, isMissing, type Band } from '@/components/health'
import { TODAY } from '@/data/legacy'
import { DeltaChip } from '@/components/page'
import { cn } from '@/lib/utils'
import { fmtMonthName, fmtMonthNarrow, fmtShort } from '@/lib/dates'
import type { Evidence } from '../stakeholders/model'
import type { JourneyMonth, SentimentMonth } from './model'
import { fmtDY, ymLabel, ymLong } from './shared'

/* ---- timeline to renewal: a monthly health ribbon, May 2025 to the Dec 2026 renewal ---- */
const CELL: Record<Band, string> = { good: 'bg-good/70', warn: 'bg-warn/70', bad: 'bg-bad/70', none: 'bg-muted' }

export function HealthRibbon({ months, renewal }: { months: JourneyMonth[]; renewal: { label: string; date: Date } }) {
  const nowIdx = months.findIndex(m => m.state === 'now')
  const dim = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate()
  const todayAt = ((TODAY.getDate() - 0.5) / dim) * 100
  const nNeg = months.filter(m => m.neg).length, nPos = months.filter(m => m.pos).length
  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto pb-0.5">
        <ol className="flex min-w-[560px] gap-0.5" aria-label={`Monthly health, ${ymLabel(months[0].ym)} to the ${renewal.label}: ${nNeg} months with risk events, ${nPos} with positive events`}>
          {months.map((m, i) => {
            const future = m.state === 'up', isNow = i === nowIdx, last = i === months.length - 1
            const b = future ? 'none' : bandOf(m.health)
            const y = m.ym.slice(0, 4), first = i === 0 || m.ym.endsWith('-01')
            const tip = (
              <div className="grid gap-0.5">
                <p className="font-medium">{ymLong(m.ym)}{isNow && ' · today'}</p>
                <p className="opacity-80">{future ? 'Not scored yet' : isMissing(m.health) ? 'No health score' : `Health ${m.health} · ${BAND_LABEL[b]}`}</p>
                {m.events.slice(0, 4).map(e => <p key={e} className="opacity-80">{e}</p>)}
                {m.events.length > 4 && <p className="opacity-80">+{m.events.length - 4} more</p>}
                {last && <p className="opacity-80">{renewal.label} · {fmtDY(renewal.date)}</p>}
              </div>
            )
            return (
              <li key={m.ym} className="grid min-w-0 flex-1 gap-1">
                {/* event markers above the cell */}
                <span className="flex h-3 items-end justify-center gap-0.5" aria-hidden="true">
                  {m.neg > 0 && <Triangle className="size-2.5 fill-bad text-bad" />}
                  {m.pos > 0 && <span className="mb-px size-2 rounded-full bg-good" />}
                  {last && <Flag className="size-3 text-foreground" />}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label={`${ymLabel(m.ym)}: ${future ? 'upcoming' : isMissing(m.health) ? 'no health score' : `health ${m.health}`}${m.events.length ? `, ${m.events.length} events` : ''}`}
                      className={cn('relative h-7 rounded-sm outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring',
                        future ? 'border border-dashed border-muted-foreground/50 bg-transparent' : CELL[b])}>
                      {isNow && <span className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground" style={{ left: `${todayAt}%` }} aria-hidden="true" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">{tip}</TooltipContent>
                </Tooltip>
                <span className={cn('text-center text-[10px] leading-none', isNow ? 'font-medium text-foreground' : 'text-muted-foreground')} aria-hidden="true">
                  {fmtMonthNarrow(m.ym)}
                </span>
                <span className="h-3 text-[10px] leading-none whitespace-nowrap text-muted-foreground" aria-hidden="true">
                  {isNow ? <span className="font-medium text-foreground">Today</span> : first ? y : ''}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Health by month</span>
        <span className="inline-flex items-center gap-1"><Triangle className="size-2.5 fill-bad text-bad" aria-hidden="true" />Risk event</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-good" aria-hidden="true" />Positive event</span>
        <span className="inline-flex items-center gap-1"><Flag className="size-3" aria-hidden="true" />{renewal.label}, {fmtShort(renewal.date)}</span>
      </p>
    </div>
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
              <Drivers label="Positive" items={m.pos} dot="bg-good" />
              <Drivers label="Negative" items={m.neg} dot="bg-bad" />
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
