/* Account header: page title row, then one verdict card in three zones (score, areas, renewal) and the KPI strip.
   One idea per zone, a visual instead of a sentence; the derivation and provenance live in the sheets. */
import { useEffect, useState } from 'react'
import {
  ArrowDown, ArrowUp, CalendarClock, DollarSign, Gauge, HeartPulse, Layers, Mail, Minus, RefreshCw, TrendingDown, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Meter } from '@/components/charts'
import { PageHeader } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, bandText, HealthPill, type Band } from '@/components/health'
import {
  AREA_KEYS, AREA_NAME, AREA_SHORT, areaDelta, areaDriver, fmtD, fmtDY, kpis, latest, previous, RENEWAL, renewal, runway,
  score, strongThisMonth, ymLabel, type AreaKey,
} from './facts'
import { GLOSSARY, showTab, Term, Truncate, useWidget, WidgetBody } from './overview/bits'
import { HowScoresSheet } from './overview/how-sheet'
import { AreaSheet } from './overview/area-sheet'

/** Short cause per area, shown in a driver's tooltip. */
const CAUSE: Partial<Record<AreaKey, () => string>> = {
  engagement: () => 'Champion handed over',
  sentiment: () => { const n = strongThisMonth().length; return `${n} strong negative${n === 1 ? '' : 's'} this month` },
}

/** Area meter fill: the band colour at reduced intensity. */
const SOFT_FILL: Record<Band, string> = { good: 'bg-good/80', warn: 'bg-warn/80', bad: 'bg-bad/80', none: 'bg-muted-foreground/40' }

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

function buildVerdict() {
  const areas = AREA_KEYS.map(k => ({ k, v: latest.areas[k], drv: areaDriver(k) }))
  const weakest = areas.reduce((a, b) => (b.v < a.v ? b : a)).k
  // the two biggest falls since last month
  const drivers = AREA_KEYS.map(k => ({ k, d: areaDelta(k) })).filter(x => x.d < 0).sort((a, b) => a.d - b.d).slice(0, 2)
  return { areas, weakest, drivers }
}

export function AccountHeader() {
  const [how, setHow] = useState(false)
  const [area, setArea] = useState<AreaKey | null>(null)
  const w = useWidget(buildVerdict)
  const openArea = (k: AreaKey) => { setHow(false); setArea(k) }

  return (
    <header className="flex flex-col gap-4">
      <PageHeader
        lead="TA"
        title="TransAmerica"
        sub="Financial services · Enterprise · North America · BAU"
        actions={<Button variant="ghost" size="sm" onClick={() => setHow(true)}>How scores work</Button>}
      />

      <Card className="gap-0 py-0">
        <WidgetBody w={w} what="the health verdict" skeleton={<VerdictSkeleton />}>
          {d => (
            <div className="grid divide-y divide-hairline md:grid-cols-12 md:divide-y-0">
              <ScoreZone onHow={() => setHow(true)} />
              <AreasZone d={d} onArea={openArea} />
              <RenewalZone />
            </div>
          )}
        </WidgetBody>
      </Card>

      <KpiStrip />

      <HowScoresSheet open={how} onOpenChange={setHow} onOpenArea={openArea} />
      <AreaSheet area={area} onOpenChange={o => !o && setArea(null)} />
    </header>
  )
}

/* ---------- zones: one label row each, then content on an 8px rhythm, all three top-aligned ---------- */
function ZoneLabel({ id, icon: Icon, children, right }: { id: string; icon: LucideIcon; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex h-5 items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <h2 id={id} className="text-xs font-normal tracking-normal">{children}</h2>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

/* ---------- zone 1: score ---------- */
function ScoreZone({ onHow }: { onHow: () => void }) {
  const b = bandOf(score.final)
  return (
    <section aria-labelledby="h-health" className="flex flex-col gap-2 p-5 md:col-span-4 lg:col-span-3">
      <ZoneLabel id="h-health" icon={HeartPulse}>Health</ZoneLabel>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={onHow}
              aria-label={`Health ${score.final} of 100, capped from ${score.weighted} by the renewal rule. See how scores work`}
              className={cn('shrink-0 rounded-full p-1 transition-colors hover:bg-accent/60', focusRing)}>
              <ScoreRing value={score.final} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Health {score.final} of 100 · {BAND_LABEL[b]} · see how scores work</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className={cn('rounded-md', focusRing)}><HealthPill value={score.final} /></span>
          </TooltipTrigger>
          <TooltipContent>{BAND_LABEL[b]}: {b === 'good' ? '70 and above' : b === 'warn' ? '40 to 69' : 'under 40'}</TooltipContent>
        </Tooltip>
        <span className="text-xs tabular-nums text-muted-foreground">
          <Term className="no-underline" tip={`${score.overrideCode} · ${GLOSSARY.O7}. Weighted ${score.weighted} → final ${score.final}.`}>
            Capped from {score.weighted}
          </Term>
        </span>
      </div>
    </section>
  )
}

/* ---------- zone 2: areas ---------- */
function AreasZone({ d, onArea }: { d: ReturnType<typeof buildVerdict>; onArea: (k: AreaKey) => void }) {
  const since = ymLabel(previous.ym).split(' ')[0]
  const drawn = useDrawn()
  return (
    <section aria-labelledby="h-areas" className="flex min-w-0 flex-col gap-2 p-5 md:col-span-8 md:border-l md:border-hairline md:px-6 lg:col-span-6">
      <ZoneLabel id="h-areas" icon={Layers}>Area scores</ZoneLabel>
      <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {d.areas.map((a, i) => {
          const weak = a.k === d.weakest
          const tip = a.drv ? `Weakest input: ${a.drv.name} ${a.drv.score}` : 'No input has data'
          return (
            <li key={a.k}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => onArea(a.k)}
                    aria-label={`${AREA_NAME[a.k]} ${a.v}${weak ? ', the lowest area' : ''}. ${tip}. Open inputs`}
                    className={cn('-mx-2 flex w-[calc(100%+1rem)] flex-col gap-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60', focusRing)}>
                    <span className="flex h-5 items-center gap-2 text-xs">
                      <span className="truncate text-muted-foreground">{AREA_SHORT[a.k]}</span>
                      {weak && <span className="rounded bg-muted px-1 py-px text-[11px] leading-none text-foreground">Lowest</span>}
                      <span className="ml-auto text-sm tabular-nums text-foreground">{a.v}</span>
                    </span>
                    <Meter value={drawn ? a.v : 0} min={drawn ? 2 : 0} delay={i * 40} fill={SOFT_FILL[bandOf(a.v)]} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tip}</TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>
      {d.drivers.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Main drivers">
          <li className="mr-1 text-xs text-muted-foreground">Since {since}</li>
          {d.drivers.map(x => (
            <li key={x.k}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => onArea(x.k)}
                    aria-label={`${AREA_NAME[x.k]} down ${Math.abs(x.d)} since ${since}${CAUSE[x.k] ? `: ${CAUSE[x.k]!()}` : ''}. Open inputs`}
                    className={cn('inline-flex h-6 items-center gap-1 rounded-md border border-hairline px-1.5 text-xs transition-colors hover:bg-accent', focusRing)}>
                    <TrendingDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {AREA_SHORT[x.k]} <span className="tabular-nums">−{Math.abs(x.d)}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{CAUSE[x.k]?.() ?? `${AREA_NAME[x.k]} fell ${Math.abs(x.d)} since ${since}`}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ---------- zone 3: renewal ---------- */
function RenewalZone() {
  const r = runway
  const drawn = useDrawn()
  const pct = r ? Math.min(100, (100 * r.used) / r.total) : 0
  const off = !renewal.autoRenew && (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn('rounded-md bg-bad-soft px-1.5 py-0.5 text-xs text-bad', focusRing)}>Auto-renew off</span>
      </TooltipTrigger>
      <TooltipContent>The contract won't renew on its own, so the {score.overrideCode} cap applies</TooltipContent>
    </Tooltip>
  )
  return (
    <section aria-labelledby="h-renew"
      className="flex flex-col gap-2 p-5 md:col-span-12 md:border-t md:border-hairline md:px-6 lg:col-span-3 lg:border-t-0 lg:border-l">
      <ZoneLabel id="h-renew" icon={CalendarClock} right={off}>Renewal</ZoneLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => showTab('overview', 'runway')}
            aria-label={`${renewal.daysLeft} days left to renewal on ${fmtDY(renewal.date)}. Show the renewal runway`}
            className={cn('-mx-1.5 flex items-baseline gap-1.5 self-start rounded-md px-1.5 text-left leading-none transition-colors hover:bg-accent/60', focusRing)}>
            <span className="text-3xl leading-9 font-normal tabular-nums tracking-[-0.03em] text-bad">{renewal.daysLeft}</span>
            <span className="text-sm text-muted-foreground">days left</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Renews {fmtDY(renewal.date)} · show the runway</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <p tabIndex={0} className={cn('self-start rounded-sm text-sm tabular-nums text-muted-foreground', focusRing)}>
            {fmtDY(renewal.date)} · {renewal.carrLabel}
          </p>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">{renewal.carrLabel} CARR · {GLOSSARY.CARR}</TooltipContent>
      </Tooltip>
      {r && (
        <div className="mt-1 grid gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} role="img"
                aria-label={`Renewal runway: ${r.used} of ${r.total} days used since first flagged ${fmtDY(r.firstFlag)}, ${r.left} left`}
                className={cn('group/run relative block rounded-sm pt-4', focusRing)}>
                <span className="absolute top-0 -translate-x-1/2 text-[10px] leading-3 text-muted-foreground" style={{ left: `${pct}%` }} aria-hidden="true">Today</span>
                <span className="relative flex h-1.5 gap-0.5 overflow-visible">
                  <span className="h-full rounded-l-full bg-foreground/60 transition-[width,opacity] duration-700 ease-out group-hover/run:opacity-80 motion-reduce:transition-none" style={{ width: `${drawn ? pct : 0}%` }} />
                  <span className="h-full flex-1 rounded-r-full bg-bad/30" />
                  <span className="absolute -top-0.5 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${pct}%` }} aria-hidden="true" />
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent className="tabular-nums">{r.used} of {r.total} days used since first flag</TooltipContent>
          </Tooltip>
          <span className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{fmtD(r.firstFlag)}</span><span>{fmtD(RENEWAL)}</span>
          </span>
        </div>
      )}
    </section>
  )
}

/* ---------- KPI strip: every tile carries a small visual ---------- */
type Kpi = { icon: LucideIcon; label: React.ReactNode; key: string; tip: string; value: React.ReactNode; visual: React.ReactNode; wide?: boolean }

function Delta({ n, suffix = '', tip }: { n: number; suffix?: string; tip: string }) {
  const Ic = n > 0 ? ArrowUp : n < 0 ? ArrowDown : Minus
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn('inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums', focusRing)}>
          <Ic className="size-3" aria-hidden="true" />{n === 0 ? 'Flat' : `${Math.abs(n)}${suffix}`}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}
const Chip = ({ children }: { children: React.ReactNode }) =>
  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{children}</span>

function KpiStrip() {
  const { licence: l } = kpis
  const w = useWidget((): Kpi[] => [
    { icon: RefreshCw, key: 'ret', label: 'NRR / GRR', value: `${kpis.nrr}% / ${kpis.grr}%`,
      tip: 'Net and gross revenue retention, last 12 months · AHI scored record',
      visual: <Delta n={0} tip="No change since last month" /> },
    { icon: Users, key: 'mau', label: 'Monthly active users', value: kpis.mau,
      tip: 'MAU: users active in Sirion this month · AHI adoption inputs',
      visual: <Delta n={kpis.mauChange} suffix="% vs avg" tip={`${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} the 12-month average of ${kpis.mauAvg}`} /> },
    { icon: Gauge, key: 'lic', label: 'Licence use', value: `${l.pct}%`,
      tip: 'Seats in use against seats bought · AHI adoption inputs',
      visual: <div className="w-14"><Meter value={l.pct} tip={`${l.used} of ${l.bought} seats in use (${l.pct}%)`} /></div> },
    { icon: DollarSign, key: 'exp', label: 'Expansion', value: renewal.expansionLabel,
      tip: 'Open expansion opportunity on this account · AHI scored record', visual: <Chip>Open</Chip> },
    { icon: Mail, key: 'mail', label: 'Emails this month', value: kpis.emails, wide: true,
      tip: 'Customer emails this month; they feed the sentiment score · AHI email summaries',
      visual: <Chip>Sentiment input</Chip> },
  ])
  return (
    <section aria-label="Key metrics">
      <WidgetBody w={w} what="key metrics" isEmpty={d => d.length === 0} empty={{ title: 'No metrics' }}
        skeleton={<div className="grid grid-cols-2 gap-3 md:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}</div>}>
        {d => (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {d.map(k => (
              <Card key={k.key} className={cn('gap-1.5 px-4 py-3', k.wide && 'col-span-2 md:col-span-1')}>
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <k.icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 truncate"><Term tip={k.tip}>{k.label}</Term></span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Truncate className="text-xl font-normal tabular-nums tracking-[-0.02em]">{k.value}</Truncate>
                  {k.visual}
                </div>
              </Card>
            ))}
          </div>
        )}
      </WidgetBody>
    </section>
  )
}

function VerdictSkeleton() {
  return (
    <div className="grid gap-6 p-5 md:grid-cols-12">
      <div className="flex flex-col items-center gap-2 md:col-span-4 lg:col-span-3"><Skeleton className="h-5 w-16 self-start" /><Skeleton className="size-[96px] rounded-full" /><Skeleton className="h-5 w-16" /><Skeleton className="h-3 w-24" /></div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 md:col-span-8 lg:col-span-6">
        {AREA_KEYS.map(k => <div key={k} className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-1 w-full" /></div>)}
      </div>
      <div className="space-y-3 md:col-span-12 lg:col-span-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-44" /><Skeleton className="h-1 w-full" /></div>
    </div>
  )
}
