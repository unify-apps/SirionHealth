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
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, bandText, type Band } from '@/components/health'
import { AREA_KEYS, AREA_NAME, AREA_SHORT, fmtDY, kpis, renewal, score } from '../../facts'
import { buildVerdict } from '../../header'
import { showTab, useWidget, WidgetBody } from '../../overview/bits'

type Verdict = ReturnType<typeof buildVerdict>

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const LABEL = 'text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground'
const BAND_VAR: Record<Band, string> = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)', none: 'var(--muted-foreground)' }
const FILL: Record<Band, string> = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', none: 'bg-muted-foreground/40' }

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
    <Card data-block className="gap-0 py-0"
      // outline in the health band colour, softened so it frames the box without shouting
      style={{ boxShadow: `0 0 0 1px color-mix(in oklab, ${BAND_VAR[bandOf(score.final)]} 45%, transparent)` }}>
      <WidgetBody w={w} what="the health verdict" skeleton={<StandingSkeleton />}>
        {d => (
          <div className="divide-y divide-hairline">
            <Headline d={d} />
            <Facts />
          </div>
        )}
      </WidgetBody>
    </Card>
  )
}

/* ---------- row 1: score, verdict, next step ---------- */
function Headline({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  // three columns of one shape: a label on the same top line, then the content; hairlines between
  const col = 'grid min-w-0 content-start gap-3 p-6'
  return (
    <section aria-labelledby="h-verdict" className="grid divide-y divide-hairline lg:grid-cols-[13rem_minmax(0,1fr)_minmax(17rem,21rem)] lg:divide-x lg:divide-y-0">
      {/* a faint wash of the band colour, fading to the card: hints the health before the number is read */}
      <div className={col} style={{ backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${BAND_VAR[b]} 8%, transparent), transparent 75%)` }}>
        <span className={LABEL}>Health</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how scores work`}
              className={cn('grid gap-2.5 rounded-md text-left', focusRing)}>
              <span className="flex items-baseline gap-1">
                <span className={cn('num text-5xl leading-none font-light', bandText[b])}>{score.final}</span>
                <span className="num text-sm text-muted-foreground">/100</span>
              </span>
              <Bar value={score.final} band={b} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{score.cap ? <>Weighted {score.weighted}, −{score.cap} renewal cap</> : 'Weighted average, no cap'}</TooltipContent>
        </Tooltip>
        <span className="flex flex-wrap items-center gap-x-1.5 text-xs">
          <span className={bandText[b]}>{BAND_LABEL[b]}</span>
          {score.cap ? <span className="text-muted-foreground">· capped from {score.weighted}</span> : null}
        </span>
        <AreasPopover d={d} />
      </div>

      <div className={col}>
        <span className={LABEL}>Verdict</span>
        <h2 id="h-verdict" className="text-xl leading-tight font-medium tracking-[-0.015em]">{d.title}</h2>
        <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{d.why}</p>
        <button type="button" onClick={() => openSheet('how')}
          className={cn('group/how inline-flex items-center gap-1 self-start rounded-sm text-xs text-foreground underline-offset-4 hover:underline', focusRing)}>
          How the score works<ArrowRight className="size-3 transition-transform group-hover/how:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </button>
      </div>

      <NextStep next={d.next} className={col} />
    </section>
  )
}

function NextStep({ next, className }: { next: string; className?: string }) {
  if (!next) return <div className={className} />
  // "Get a signed renewal commitment by Nov 26": the action, then the due date with days left
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(next)
  const action = m ? next.slice(0, m.index) : next
  const due = m ? new Date(`${m[1]} ${TODAY.getFullYear()}`) : null
  const left = due ? Math.round((+due - +TODAY) / 864e5) : null
  return (
    <section aria-labelledby="h-next" className={className}>
      <h3 id="h-next" className={LABEL}>Next step</h3>
      <p className="text-base leading-snug font-medium">{action}</p>
      {due && (
        <p className={cn('text-xs tabular-nums', left != null && left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
          Due {m![1]}{left != null && ` · ${left < 0 ? `${-left} days late` : left === 0 ? 'today' : `in ${left} days`}`}
        </p>
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
        <button type="button" className={cn('inline-flex items-center gap-1 self-start rounded-sm text-xs text-muted-foreground hover:text-foreground', focusRing)}>
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
      hint: <>{fmtDY(renewal.date)} · {renewal.carrLabel}{!renewal.autoRenew && <> · <span className="text-bad">auto-renew off</span></>}</>,
      tip: 'Open the renewal runway', cls: late || renewal.daysLeft <= 90 ? 'text-bad' : '', onClick: () => showTab('overview', 'runway') },
    { label: 'Net retention', value: `${kpis.nrr}%`, hint: `GRR ${kpis.grr}%`, tip: 'Net and gross revenue retention, last 12 months. Over 100% means the account grew.', cls: tone(kpis.nrr - 100) },
    { label: 'Active users', value: kpis.mau, hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} 12-mo avg`, tip: `Monthly active users; 12-month average ${kpis.mauAvg}`, cls: tone(kpis.mauChange) },
    { label: 'Licence use', value: `${l.pct}%`, hint: over > 0 ? `${over} seats over ${l.bought}` : `${l.used} of ${l.bought} seats`, tip: 'Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.', cls: l.pct >= 100 ? 'text-good' : l.pct < 70 ? 'text-bad' : '' },
    { label: 'Open expansion', value: renewal.expansionLabel, hint: renewal.expansionLabel === '$0' ? 'No opportunity open' : 'Unsigned', tip: 'Open expansion opportunity on this account' },
  ]
  return (
    <section aria-label="Renewal and key metrics" className="grid grid-cols-2 divide-hairline bg-surface-2/50 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:divide-x">
      {items.map(k => {
        const body = (
          <>
            <span className={cn(LABEL, 'flex items-center gap-1')}>{k.label}{k.onClick && <ArrowRight className="size-3" aria-hidden="true" />}</span>
            <span className={cn('num text-lg leading-none', k.cls)}>{k.value}</span>
            {k.label === 'Renewal' && <span className="truncate text-xs text-muted-foreground">{k.hint}</span>}
          </>
        )
        const cls = 'grid min-w-0 content-start gap-1.5 px-6 py-3.5 text-left'
        return (
          <Tooltip key={k.label}>
            <TooltipTrigger asChild>
              {k.onClick
                ? <button type="button" onClick={k.onClick} className={cn(cls, 'transition-colors hover:bg-hover', focusRing, 'focus-visible:ring-inset')}>{body}</button>
                : <div tabIndex={0} className={cn(cls, focusRing, 'focus-visible:ring-inset')}>{body}</div>}
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{k.label === 'Renewal' ? k.tip : <><span className="font-medium">{k.hint}</span><br />{k.tip}</>}</TooltipContent>
          </Tooltip>
        )
      })}
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
