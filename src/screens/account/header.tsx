/* Account header: page title row, then one verdict card. Top: the score, what it means and the next step.
   Middle: area scores (colour only) and the renewal. Footer: the few metrics a CSM quotes. Derivation lives in the sheets. */
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CalendarClock, ListChecks, DollarSign, Gauge, Layers, RefreshCw, TrendingDown, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { TODAY } from '@/data/legacy'
import { fmtMonth } from '@/lib/dates'
import { useRange, type Range } from '@/lib/range'
import { PageHeader } from '@/components/page'
import { DateRangeMenu } from '@/components/app/date-range'
import { go, openSheet } from '@/lib/route'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, bandText, type Band } from '@/components/health'
import {
  AREA_KEYS, AREA_NAME, AREA_SHORT, areaDriver, fmtD, fmtDY, kpis, latest, months, renewal,
  score, strongThisMonth, type AreaKey, type Month,
} from './facts'
import { showTab, useWidget, WidgetBody } from './overview/bits'
import { BRIEF } from './overview/content'
import { HeaderSheets } from './overview/how-sheet'

/** Short cause per area, shown in a driver's tooltip. */
const CAUSE: Partial<Record<AreaKey, () => string>> = {
  engagement: () => 'Champion handed over',
  sentiment: () => { const n = strongThisMonth().length; return `${n} strong negative${n === 1 ? '' : 's'} this month` },
}

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** False on the first frame, then true: lets bars and rings animate in from zero. True at once under reduced motion. */
function useDrawn() {
  const [drawn, setDrawn] = useState(reducedMotion)
  useEffect(() => {
    if (drawn) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)))
    return () => cancelAnimationFrame(id)
  }, [drawn])
  return drawn
}

/** Counts 0 -> to over `ms` with an ease-out, in step with the ring's stroke. Final value at once under reduced motion. */
function useCountUp(to: number, ms = 800) {
  const [n, setN] = useState(() => (reducedMotion() ? to : 0))
  useEffect(() => {
    if (reducedMotion()) { setN(to); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return n
}

const BAND_STROKE: Record<Band, string> = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)', none: 'var(--muted-foreground)' }

/** The score ring: the stroke draws from 0 to the score and the number counts up with it (band colour fixed to the final score). */
function ScoreRing({ value, size = 88, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const drawn = useDrawn()
  const n = useCountUp(value)
  const b = bandOf(value)
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BAND_STROKE[b]} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - (drawn ? Math.min(100, value) / 100 : 0))}
          className="transition-[stroke-dashoffset] duration-[800ms] ease-out motion-reduce:transition-none" />
      </svg>
      <span className={cn('absolute text-[28px] font-medium tabular-nums tracking-[-0.02em]', bandText[b])} aria-hidden="true">{n}</span>
    </span>
  )
}

/** The month the range compares against: one month back for 30 days, three for 90 and so on; lifetime goes to the first. */
function baseline(r: Range): Month {
  const i = months.length - 1 - (r.months ?? months.length)
  return months[Math.max(0, i)]
}

function buildVerdict(r: Range) {
  const base = baseline(r)
  const areas = AREA_KEYS.map(k => ({ k, v: latest.areas[k], d: latest.areas[k] - base.areas[k], drv: areaDriver(k) }))
  // the two biggest falls since last month drive the headline
  const drivers = areas.filter(x => x.d < 0).sort((a, b) => a.d - b.d).slice(0, 2)
  const atRisk = !renewal.signed && renewal.daysLeft <= 90
  const title = atRisk ? 'Renewal at risk' : BAND_LABEL[bandOf(score.final)]
  const why = [
    `${renewal.carrLabel} renews ${fmtD(renewal.date)} with nothing signed${renewal.autoRenew ? '' : ' and auto-renew off'}.`,
    drivers.length ? `${drivers.map(x => `${AREA_SHORT[x.k]} fell ${Math.abs(x.d)}`).join(' and ')} since ${fmtMonth(base.ym)}${CAUSE[drivers[0].k] ? `: ${CAUSE[drivers[0].k]!().toLowerCase()}` : ''}.` : '',
  ].filter(Boolean).join(' ')
  // the brief's "Next" line, first sentence, citations stripped
  const next = (BRIEF.find(([h]) => h === 'Next')?.[1] ?? '').replace(/\s?\{\w+\}/g, '').split(/(?<=\.)\s/)[0].replace(/\.$/, '')
  return { areas, title, why, next, since: fmtMonth(base.ym) }
}

/** Shrinks the sticky page header once its sentinel scrolls off, and publishes the header height as --account-hdr
 *  so the tab strip can stick right under it. */
function useStickyHeader() {
  const sentinel = useRef<HTMLDivElement>(null), bar = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const s = sentinel.current, b = bar.current
    if (!s || !b) return
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting && e.boundingClientRect.top < 0))
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--account-hdr', `${b.offsetHeight}px`))
    io.observe(s); ro.observe(b)
    return () => { io.disconnect(); ro.disconnect(); document.documentElement.style.removeProperty('--account-hdr') }
  }, [])
  return { sentinel, bar, compact }
}

/** The page header, sticky for the whole account page: shrinks once the page scrolls; the tab strip sticks under it.
 *  Rendered by the screen (not inside AccountHeader) because a sticky element only sticks within its parent. */
export function StickyPageHeader({ joined = false }: { joined?: boolean }) {
  const { sentinel, bar, compact } = useStickyHeader()
  const b = bandOf(score.final)
  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none h-0" />
      <div ref={bar} className={cn(FULL_BLEED, 'sticky top-0 z-30', compact && 'before:bg-background/90 before:backdrop-blur-md',
        // a hairline under the shrunk header until the tab strip docks under it and takes over the rule
        compact && !joined && 'after:pointer-events-none after:absolute after:bottom-0 after:-inset-x-[100vmax] after:h-px after:bg-hairline')}>
        <PageHeader
          compact={compact}
          back={{ label: 'My accounts', onClick: () => go('accounts') }}
          lead="TA"
          title="TransAmerica"
          sub="Financial services · Enterprise · North America · BAU"
          compactSub={<><span className={cn('font-medium tabular-nums', bandText[b])}>{score.final} {BAND_LABEL[b]}</span> · Renews in <span className="tabular-nums text-bad">{renewal.daysLeft} days</span></>}
          actions={<DateRangeMenu />}
        />
      </div>
    </>
  )
}

/** Background that runs edge to edge of the content area while the element keeps the page's column. */
export const FULL_BLEED = 'relative before:pointer-events-none before:absolute before:inset-y-0 before:-inset-x-[100vmax] before:-z-10 before:transition-colors before:duration-200'

export function AccountHeader() {
  const range = useRange()
  const w = useWidget(() => buildVerdict(range), [range.id])
  const openArea = (k: AreaKey) => openSheet('area', k)
  return (
    <header className="flex flex-col gap-4">

      <Card className="gap-0 py-0">
        <WidgetBody w={w} what="the health verdict" skeleton={<VerdictSkeleton />}>
          {d => (
            <>
              <Verdict d={d} onHow={() => openSheet('how')} />
              <div className="grid divide-y divide-hairline border-t border-hairline lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)] lg:divide-x lg:divide-y-0">
                <AreasZone d={d} onArea={openArea} />
                <RenewalZone />
              </div>
            </>
          )}
        </WidgetBody>
      </Card>

      <Metrics />

      <HeaderSheets />
    </header>
  )
}

/* ---------- verdict: score, what it means, the next step ---------- */
function Verdict({ d, onHow }: { d: ReturnType<typeof buildVerdict>; onHow: () => void }) {
  const b = bandOf(score.final)
  return (
    <section aria-labelledby="h-verdict" className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onHow} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how scores work`}
            className={cn('shrink-0 self-start rounded-full md:self-center', focusRing)}>
            <ScoreRing value={score.final} size={72} stroke={5} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{BAND_LABEL[b]} · weighted {score.weighted}, −{score.cap} renewal cap</TooltipContent>
      </Tooltip>
      <div className="min-w-0 flex-1">
        <h2 id="h-verdict" className="flex items-baseline gap-2 text-lg font-medium tracking-[-0.01em]">
          {d.title}<span className={cn('text-sm font-normal', bandText[b])}>{BAND_LABEL[b]}</span>
        </h2>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{d.why}</p>
        <button type="button" onClick={onHow} className={cn('mt-1 rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline', focusRing)}>
          How the score works
        </button>
      </div>
      {d.next && (() => {
        // "Get a signed renewal commitment by Nov 26": the action, and its due date as its own line with days left
        const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(d.next)
        const action = m ? d.next.slice(0, m.index) : d.next
        const due = m ? new Date(`${m[1]} ${TODAY.getFullYear()}`) : null
        const left = due ? Math.round((+due - +TODAY) / 864e5) : null
        return (
          <div className="flex items-start gap-3 rounded-lg border border-hairline p-4 md:w-80 md:shrink-0">
            <ListChecks className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
            <div className="grid min-w-0 gap-1">
              <p className="text-xs text-muted-foreground">Next Step</p>
              <p className="text-sm font-medium leading-snug">{action}</p>
              {due && <p className={cn('text-xs tabular-nums', left != null && left <= 7 ? 'text-bad' : 'text-muted-foreground')}>Due {m![1]}{left != null && ` · ${left < 0 ? `${-left} days late` : left === 0 ? 'today' : `in ${left} days`}`}</p>}
            </div>
          </div>
        )
      })()}
    </section>
  )
}

/* ---------- areas: name and score, the colour carries the band; falls since last month in red ---------- */
function AreasZone({ d, onArea }: { d: ReturnType<typeof buildVerdict>; onArea: (k: AreaKey) => void }) {
  return (
    <section aria-labelledby="h-areas" className="flex min-w-0 flex-col gap-2 p-5 pb-3">
      <ZoneLabel id="h-areas" icon={Layers} right={<span>Change since {d.since}</span>}>Area scores</ZoneLabel>
      <ul className="-mx-3 grid grid-cols-3 gap-1 xl:grid-cols-6">
        {d.areas.map(a => {
          const b: Band = bandOf(a.v)
          const tip = a.drv ? `Weakest input: ${a.drv.name} ${a.drv.score}` : 'No input has data'
          return (
            <li key={a.k}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => onArea(a.k)} aria-label={`${AREA_NAME[a.k]} ${a.v}, ${BAND_LABEL[b]}. ${tip}. Open inputs`}
                    className={cn('flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/60', focusRing)}>
                    <span className="truncate text-xs text-muted-foreground">{tc(AREA_SHORT[a.k])}</span>
                    <span className="flex items-baseline gap-1.5 tabular-nums">
                      <span className={cn('text-xl font-medium tracking-[-0.02em]', bandText[b])}>{a.v}</span>
                      {a.d !== 0 && <span className="text-xs text-muted-foreground">{a.d < 0 ? '−' : '+'}{Math.abs(a.d)}</span>}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{a.d ? `${a.d < 0 ? 'Down' : 'Up'} ${Math.abs(a.d)} since ${d.since} · ` : ''}{tip}</TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ---------- renewal: days left, date and value, auto-renew ---------- */
function RenewalZone() {
  return (
    <section aria-labelledby="h-renew" className="flex flex-col gap-3 p-5">
      <ZoneLabel id="h-renew" icon={CalendarClock}
        right={!renewal.autoRenew && <span className="text-xs text-bad">Auto-renew off</span>}>Renewal</ZoneLabel>
      <button type="button" onClick={() => showTab('overview', 'runway')}
        aria-label={`${renewal.daysLeft} days left to renewal on ${fmtDY(renewal.date)}. Go to the renewal runway`}
        className={cn('group/nav flex items-baseline gap-1.5 self-start rounded-md text-left', focusRing)}>
        <span className="text-2xl font-normal tabular-nums tracking-[-0.02em] text-bad">{renewal.daysLeft}</span>
        <span className="text-sm text-muted-foreground group-hover/nav:text-foreground">days left</span>
        <ArrowRight className="size-3.5 self-center text-muted-foreground transition-transform group-hover/nav:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
      </button>
      <p className="text-sm tabular-nums text-muted-foreground">{fmtDY(renewal.date)} · {renewal.carrLabel}</p>
    </section>
  )
}

/* ---------- metrics: four cards of one shape (label, value, one plain line); no chips or meters ---------- */
type Tone = 'good' | 'bad' | undefined

function Metrics() {
  const l = kpis.licence, over = l.used - l.bought
  // tone: good / bad when the number says something about the account, none when it is flat or just a fact
  const sign = (n: number): Tone => (n > 0 ? 'good' : n < 0 ? 'bad' : undefined)
  const items: { icon: LucideIcon; label: string; value: React.ReactNode; hint: string; tip: string; tone: Tone; trend?: number }[] = [
    { icon: RefreshCw, label: 'Net retention', value: `${kpis.nrr}%`, hint: `GRR ${kpis.grr}% · flat on last month`, tip: 'Net and gross revenue retention, last 12 months. Over 100% means the account grew.', tone: sign(kpis.nrr - 100) },
    { icon: Users, label: 'Active users', value: kpis.mau, hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} the 12-month average`, tip: `Monthly active users; 12-month average ${kpis.mauAvg}`, tone: sign(kpis.mauChange), trend: kpis.mauChange },
    { icon: Gauge, label: 'Licence use', value: `${l.pct}%`, hint: over > 0 ? `${over} seats over the ${l.bought} bought` : `${l.used} of ${l.bought} seats`, tip: 'Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.', tone: l.pct >= 100 ? 'good' : l.pct < 70 ? 'bad' : undefined, trend: over },
    { icon: DollarSign, label: 'Open expansion', value: renewal.expansionLabel, hint: 'Unsigned, on top of the renewal', tip: 'Open expansion opportunity on this account', tone: undefined },
  ]
  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(k => (
        <Card key={k.label} className="gap-1 p-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className={cn('flex items-center gap-1.5 self-start rounded-sm text-xs text-muted-foreground', focusRing)}>
                <k.icon className="size-4 shrink-0" aria-hidden="true" />{tc(k.label)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{k.tip}</TooltipContent>
          </Tooltip>
          <span className={cn('mt-1 text-2xl font-normal tabular-nums tracking-[-0.02em]', k.tone === 'good' && 'text-good', k.tone === 'bad' && 'text-bad')}>{k.value}</span>
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            {k.trend != null && k.trend !== 0 && (k.trend > 0
              ? <TrendingUp className={cn('size-3.5 shrink-0', k.tone === 'good' ? 'text-good' : 'text-muted-foreground')} aria-hidden="true" />
              : <TrendingDown className={cn('size-3.5 shrink-0', k.tone === 'bad' ? 'text-bad' : 'text-muted-foreground')} aria-hidden="true" />)}
            <span className="truncate">{k.hint}</span>
          </span>
        </Card>
      ))}
    </section>
  )
}

function ZoneLabel({ id, icon: Icon, children, right }: { id: string; icon: LucideIcon; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex h-5 items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <h2 id={id} className="text-xs font-normal tracking-normal">{tc(children)}</h2>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

function VerdictSkeleton() {
  return (
    <div className="grid gap-4 p-5">
      <div className="flex items-center gap-6"><Skeleton className="size-[72px] rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-full max-w-md" /></div><Skeleton className="hidden h-16 w-80 md:block" /></div>
      <div className="grid grid-cols-3 gap-3">{AREA_KEYS.map(k => <Skeleton key={k} className="h-5" />)}</div>
    </div>
  )
}
