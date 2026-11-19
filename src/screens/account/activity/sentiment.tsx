import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { bandOf, bandText, isMissing } from '@/components/health'
import { cn } from '@/lib/utils'
import type { Evidence } from '../stakeholders/model'
import type { JourneyMonth, SentimentMonth } from './model'
import { ymLabel, ymLong } from './shared'

/* ---- timeline to renewal: one dot per month ---- */
const DOT: Record<JourneyMonth['state'], string> = {
  neg: 'bg-bad', pos: 'bg-good', quiet: 'bg-muted-foreground/40', now: 'size-3 border-2 border-foreground bg-card', up: 'border border-muted-foreground bg-card',
}
export function JourneyStrip({ months, now, next }: { months: JourneyMonth[]; now: string; next: string }) {
  const nNeg = months.filter(m => m.state === 'neg').length, nPos = months.filter(m => m.state === 'pos').length
  return (
    <div className="grid gap-3">
      <div className="flex items-center" role="group" aria-label={`${months.length} months from ${ymLabel(months[0].ym)} to the Dec 30, 2026 renewal: ${nNeg} with risk events, ${nPos} with positive events`}>
        {months.map((m, i) => (
          <span key={m.ym} className="flex flex-1 items-center last:flex-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label={ymLabel(m.ym)} className="grid size-5 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <span className={cn('size-2.5 rounded-full', DOT[m.state])} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                <p className="font-medium">{ymLabel(m.ym)}{m.health != null && ` · health ${m.health}`}</p>
                {m.events.length ? m.events.map(e => <p key={e} className="opacity-80">{e}</p>)
                  : <p className="opacity-80">{m.state === 'now' ? 'Now' : m.state === 'up' ? 'Upcoming · renewal $330K, Dec 30' : 'No key events'}</p>}
              </TooltipContent>
            </Tooltip>
            {i < months.length - 1 && <span className={cn('h-px flex-1', m.state === 'up' || m.state === 'now' ? 'border-t border-dashed border-border' : 'bg-border')} />}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs tabular-nums text-muted-foreground">
        <span>{ymLabel(months[0].ym)}</span>
        <span><span className="text-foreground">Now</span> {now}</span>
        <span><span className="text-foreground">Next</span> {next}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-bad" />Risk event</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-good" />Positive event</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-muted-foreground/40" />Quiet</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full border-2 border-foreground" />Now</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full border border-muted-foreground" />Upcoming</span>
      </div>
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
                <p className="mt-0.5 flex items-baseline gap-2 text-xs text-muted-foreground">
                  Sentiment
                  {isMissing(m.score) ? <span>No data</span> : <span className={cn('text-base tabular-nums font-medium', bandText[b])}>{m.score}</span>}
                  {d != null && d !== 0 && <span className="tabular-nums">{d > 0 ? '+' : '−'}{Math.abs(d)} vs {ymLabel(prevYm(m.ym)).split(' ')[0]}</span>}
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
