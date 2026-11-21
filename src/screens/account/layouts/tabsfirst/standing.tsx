/* Tabs-first Summary header ("standing"): one white surface in two rows instead of a verdict card plus four tiles.
   Row 1: the score as a figure with a 0-100 bar, the verdict, and the next step as a grey callout. The six area scores
   sit one level down, in a popover from the score, so the header leads with one number, not seven.
   Row 2: a quiet facts strip, label and value only: renewal first, then the four account KPIs; detail is in tooltips. */
import { ArrowRight, ArrowDownRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { TODAY } from '@/data/legacy'
import { useRange } from '@/lib/range'
import { openSheet } from '@/lib/route'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, bandText, type Band } from '@/components/health'
import { AREA_KEYS, AREA_NAME, AREA_SHORT, fmtDY, kpis, renewal, score } from '../../facts'
import { buildVerdict, useCountUp } from '../../header'
import { showTab, useWidget, WidgetBody } from '../../overview/bits'
import { RunwayChart } from '../../overview/runway-chart'
import { CLM } from '../../overview/content'

type Verdict = ReturnType<typeof buildVerdict>

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const LABEL = 'text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground'
const FILL: Record<Band, string> = { good: 'bg-good-fill', warn: 'bg-warn-fill', bad: 'bg-bad-fill', none: 'bg-muted-foreground/40' }

/** Thin 0-100 bar in the band colour. */
const Bar = ({ value, band, className }: { value: number; band: Band; className?: string }) => (
  <span className={cn('block h-1 w-full overflow-hidden rounded-[1px] bg-muted', className)} aria-hidden="true">
    <span className={cn('block h-full', FILL[band])} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
  </span>
)

export function Standing() {
  const range = useRange()
  const w = useWidget(() => buildVerdict(range), [range.id])
  return (
    // open on the page, no container: the health score sits on a soft band-tinted panel, the verdict and next step beside
    // it, the figures in one ruled strip below
    <section aria-label="Account standing">
      <WidgetBody w={w} what="the health verdict" skeleton={<StandingSkeleton />}>
        {d => (
          // the verdict on the left, the account's details (renewal first, then the figures) in one card on the right
          <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <Headline d={d} />
            <Facts />
          </div>
        )}
      </WidgetBody>
    </section>
  )
}

/* ---------- row 1: score, verdict, next step ---------- */
function Headline({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  // the score counts up on load (as in Ledger) and its bar grows with it; colour is fixed to the final band
  const n = useCountUp(score.final)
  // two columns on one shared top line (h-6): HEALTH | the band pill and context. The verdict reads down from there and
  // ends on the next step, a slim one-line callout in the band tint, so the action sits right under its reason.
  const top = 'flex h-6 items-center'
  return (
    // a card the same height as the details card beside it: score and verdict on top, the next step as a tinted band
    // across the bottom, a section like the rows on the right
    <section aria-labelledby="h-verdict" className="flex flex-col overflow-hidden rounded-xl bg-card shadow-(--shadow-card)">
      <div className="grid flex-1 gap-x-8 gap-y-5 px-5 py-4 md:grid-cols-[7.5rem_minmax(0,1fr)]">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how scores work`}
            className={cn('grid content-start gap-3 self-start rounded-md text-left', focusRing)}>
            <span className={cn(top, LABEL)}>Health</span>
            <span className="flex items-baseline gap-1">
              <span className={cn('num text-6xl leading-none font-light tabular-nums', bandText[b])} aria-hidden="true">{n}</span>
              <span className="num text-sm text-muted-foreground">/100</span>
            </span>
            <Bar value={n} band={b} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{score.cap ? <>Weighted {score.weighted}, −{score.cap} renewal cap</> : 'Weighted average, no cap'}</TooltipContent>
      </Tooltip>

      <div className="grid min-w-0 content-start gap-3">
        <span className={cn(top, 'gap-2 text-xs')}>
          <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 font-medium', SOFT[b], bandText[b])}>{BAND_LABEL[b]}</span>
          {/* how the score works stays one click away (here and on the score), not a line of its own */}
          <button type="button" onClick={() => openSheet('how')}
            className={cn('rounded-sm text-muted-foreground underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 hover:text-foreground', focusRing)}>
            {score.cap ? `Capped from ${score.weighted}` : 'How it\'s scored'}
          </button>
          <span aria-hidden="true" className="text-muted-foreground/60">·</span>
          <AreasPopover d={d} />
        </span>
        <h2 id="h-verdict" className="font-heading text-2xl leading-tight font-medium tracking-[-0.02em]">{d.title}</h2>
        <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{drove(d.why)}</p>
      </div>
      <Trend />
      </div>
      <NextStep next={d.next} band={b} />
    </section>
  )
}

/** The renewal runway, in the card: monthly health up to the renewal with its events, flagged months and the cap, with
 *  hover tooltips and event sheets. It replaces the separate runway section that used to sit below the brief. */
function Trend() {
  return (
    <div id="runway" className="grid scroll-mt-40 gap-2 self-end md:col-span-2">
      <span className={LABEL}>Renewal runway</span>
      <RunwayChart compact />
    </div>
  )
}

/** The verdict's first sentence restates the renewal (date, value, signed, auto-renew), which the details card shows;
 *  keep what drove the score. */
const drove = (why: string) => why.split(/(?<=\.)\s/).slice(1).join(' ') || why

const SOFT: Record<Band, string> = { good: 'bg-good-soft', warn: 'bg-warn-soft', bad: 'bg-bad-soft', none: 'bg-muted' }
const BORDER: Record<Band, string> = { good: 'border-good-fill/25', warn: 'border-warn-fill/30', bad: 'border-bad-fill/25', none: 'border-hairline' }

function NextStep({ next, band }: { next: string; band: Band }) {
  if (!next) return null
  // "Get a signed renewal commitment by Nov 26": the action, then the due date with days left
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(next)
  const action = m ? next.slice(0, m.index) : next
  const due = m ? new Date(`${m[1]} ${TODAY.getFullYear()}`) : null
  const left = due ? Math.round((+due - +TODAY) / 864e5) : null
  return (
    <section aria-label="Next step" className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-5 py-3 text-sm', SOFT[band], BORDER[band])}>
      <span className={cn('text-[11px] font-medium uppercase tracking-[0.06em]', bandText[band])}>Next step</span>
      <span className="font-medium">{action}</span>
      {due && (
        <span className={cn('text-xs tabular-nums', left != null && left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
          Due {m![1]}{left != null && ` · ${left < 0 ? `${-left} days late` : left === 0 ? 'today' : `in ${left} days`}`}
        </span>
      )}
    </section>
  )
}

/* ---------- the six areas, one level down: a popover from the score ---------- */
function AreasPopover({ d }: { d: Verdict }) {
  const risk = d.areas.filter(a => bandOf(a.v) === 'bad').length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn('inline-flex h-6 items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground', focusRing)}>
          {d.areas.length} areas{risk ? <> · <span className="text-bad">{risk} at risk</span></> : null}
          <ChevronDown className="size-3" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <div className="flex items-baseline justify-between border-b border-hairline px-4 py-3">
          <span className={LABEL}>Area scores</span>
          <span className="text-xs text-muted-foreground">change since {d.since}</span>
        </div>
        <ul className="p-1">
          {d.areas.map(a => {
            const b = bandOf(a.v)
            const D = a.d < 0 ? ArrowDownRight : ArrowUpRight
            return (
              <li key={a.k}>
                <button type="button" onClick={() => openSheet('area', a.k)} aria-label={`${AREA_NAME[a.k]} ${a.v}, ${BAND_LABEL[b]}. Open inputs`}
                  className={cn('grid w-full grid-cols-[6.5rem_minmax(0,1fr)_2rem_2.5rem] items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-hover', focusRing)}>
                  <span className="truncate">{tc(AREA_SHORT[a.k])}</span>
                  <Bar value={a.v} band={b} />
                  <span className={cn('num text-right font-medium', bandText[b])}>{a.v}</span>
                  <span className={cn('inline-flex items-center justify-end text-xs tabular-nums', a.d < 0 ? 'text-bad' : a.d > 0 ? 'text-good' : 'text-muted-foreground')}>
                    {a.d !== 0 ? <><D className="size-3" aria-hidden="true" />{Math.abs(a.d)}</> : '–'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- row 2: renewal and the four KPIs, label and value only ---------- */
function Facts() {
  const late = renewal.daysLeft < 0
  const l = kpis.licence, over = l.used - l.bought
  const tone = (n: number) => (n > 0 ? 'text-good' : n < 0 ? 'text-bad' : '')
  const items: { label: string; value: React.ReactNode; hint: React.ReactNode; tip: string; cls?: string; onClick?: () => void }[] = [
    { label: 'Renewal', value: <>{Math.abs(renewal.daysLeft)}<span className="ml-1 font-sans text-xs tracking-normal text-muted-foreground">{late ? 'days overdue' : 'days left'}</span></>,
      hint: <>{fmtDY(renewal.date)} · {renewal.carrLabel}</>,
      tip: 'Open the renewal runway', cls: late || renewal.daysLeft <= 90 ? 'text-bad' : '', onClick: () => showTab('overview', 'runway') },
    { label: 'Net retention', value: `${kpis.nrr}%`, hint: `GRR ${kpis.grr}%`, tip: 'Net and gross revenue retention, last 12 months. Over 100% means the account grew.', cls: tone(kpis.nrr - 100) },
    { label: 'Active users', value: kpis.mau, hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} 12-mo avg`, tip: `Monthly active users; 12-month average ${kpis.mauAvg}`, cls: tone(kpis.mauChange) },
    { label: 'Licence use', value: `${l.pct}%`, hint: over > 0 ? `${over} seats over ${l.bought}` : `${l.used} of ${l.bought} seats`, tip: 'Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.', cls: l.pct >= 100 ? 'text-good' : l.pct < 70 ? 'text-bad' : '' },
    { label: 'Open expansion', value: renewal.expansionLabel, hint: renewal.expansionLabel === '$0' ? 'No opportunity open' : 'Unsigned', tip: 'Open expansion opportunity on this account' },
  ]
  const [first, ...rest] = items
  return (
    // one details card: the renewal leads (it is what the verdict is about), then the figures as label | value rows
    <section aria-label="Renewal and key metrics" className="flex flex-col overflow-hidden rounded-xl bg-card shadow-(--shadow-card)">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={first.onClick} className={cn('grid w-full gap-1 border-b border-hairline px-5 py-4 text-left transition-colors hover:bg-hover', focusRing, 'focus-visible:ring-inset')}>
            <span className={cn(LABEL, 'flex items-center gap-1')}>{first.label}<ArrowRight className="size-3" aria-hidden="true" /></span>
            <span className={cn('num text-2xl leading-none font-light', first.cls)}>{first.value}</span>
            <span className="truncate text-xs text-muted-foreground">{first.hint}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{first.tip}</TooltipContent>
      </Tooltip>
      {/* three groups, each under its own label: the renewal (countdown), its contract (paperwork), the account (figures) */}
      <p className={cn(LABEL, 'px-5 pt-4 pb-1')}>Contract</p>
      <dl className="divide-y divide-hairline">
        {CLM.map(([l, v, , , tone]) => (
          <div key={l} className="flex items-baseline justify-between gap-4 px-5 py-2 text-sm first:pt-1">
            <dt className="truncate text-muted-foreground">{l === 'Termination for convenience' ? 'Termination clause' : l}</dt>
            <dd className={cn('shrink-0 font-medium', tone === 'bad' && 'text-bad', tone === 'good' && 'text-good')}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className={cn(LABEL, 'mt-auto border-t border-hairline px-5 pt-4 pb-1')}>Account</p>
      <dl className="grid grid-cols-2">
        {rest.map((k, i) => (
          <Tooltip key={k.label}>
            <TooltipTrigger asChild>
              <div tabIndex={0} className={cn('grid min-w-0 content-start gap-1 px-5 py-3', i % 2 === 1 && 'border-l border-hairline', i > 1 && 'border-t border-hairline', focusRing, 'focus-visible:ring-inset')}>
                <dt className="truncate text-xs text-muted-foreground">{k.label}</dt>
                <dd className={cn('num text-lg leading-none', k.cls)}>{k.value}</dd>
                <dd className="truncate text-xs text-muted-foreground">{k.hint}</dd>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-64">{k.tip}</TooltipContent>
          </Tooltip>
        ))}
      </dl>
    </section>
  )
}

function StandingSkeleton() {
  return (
    <div className="grid gap-6 p-6">
      <div className="flex gap-6"><Skeleton className="h-16 w-28" /><div className="flex-1 space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full max-w-lg" /></div><Skeleton className="hidden h-20 w-72 lg:block" /></div>
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">{AREA_KEYS.map(k => <Skeleton key={k} className="h-12" />)}</div>
    </div>
  )
}
