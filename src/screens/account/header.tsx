/* Account header: page title row, then one verdict card in three zones (score, areas, renewal) and the KPI strip.
   One idea per zone, a visual instead of a sentence; the derivation and provenance live in the sheets. */
import { useState } from 'react'
import {
  ArrowDown, ArrowUp, DollarSign, Gauge, Mail, Minus, RefreshCw, TrendingDown, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Meter } from '@/components/charts'
import { PageHeader } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, HealthPill, HealthRing, type Band } from '@/components/health'
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
        lead={<span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium" aria-hidden="true">TA</span>}
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

/* ---------- zone 1: score ---------- */
function ScoreZone({ onHow }: { onHow: () => void }) {
  const b = bandOf(score.final)
  return (
    <section aria-labelledby="h-health" className="flex items-center gap-4 p-5 md:col-span-4 lg:col-span-3">
      <h2 id="h-health" className="sr-only">Health</h2>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onHow}
            aria-label={`Health ${score.final} of 100, capped from ${score.weighted} by the renewal rule. See how scores work`}
            className={cn('shrink-0 rounded-full p-1 transition-colors hover:bg-accent/60', focusRing)}>
            <HealthRing value={score.final} size={96} stroke={6} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Health {score.final} of 100 · {BAND_LABEL[b]} · see how scores work</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className={cn('rounded-md', focusRing)}><HealthPill value={score.final} /></span>
          </TooltipTrigger>
          <TooltipContent>{BAND_LABEL[b]}: {b === 'good' ? '70 and above' : b === 'warn' ? '40 to 69' : 'under 40'}</TooltipContent>
        </Tooltip>
        <span className="text-xs tabular-nums text-muted-foreground">
          <Term tip={`${score.overrideCode} · ${GLOSSARY.O7}. Weighted ${score.weighted} → final ${score.final}.`}>
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
  return (
    <section aria-labelledby="h-areas"
      className="flex min-w-0 flex-col justify-center gap-3 p-5 md:col-span-8 md:border-l md:border-hairline lg:col-span-6">
      <h2 id="h-areas" className="sr-only">Area scores</h2>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {d.areas.map(a => {
          const weak = a.k === d.weakest
          const tip = a.drv ? `Weakest input: ${a.drv.name} ${a.drv.score}` : 'No input has data'
          return (
            <li key={a.k}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => onArea(a.k)}
                    aria-label={`${AREA_NAME[a.k]} ${a.v}${weak ? ', the lowest area' : ''}. ${tip}. Open inputs`}
                    className={cn('-mx-2 flex w-[calc(100%+1rem)] flex-col gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60', focusRing)}>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="truncate text-muted-foreground">{AREA_SHORT[a.k]}</span>
                      {weak && <span className="rounded bg-muted px-1 py-px text-[11px] leading-none text-foreground">Lowest</span>}
                      <span className="ml-auto text-sm tabular-nums text-foreground">{a.v}</span>
                    </span>
                    <Meter value={a.v} min={2} fill={SOFT_FILL[bandOf(a.v)]} />
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
  const pct = r ? Math.min(100, Math.round((100 * r.used) / r.total)) : 0
  return (
    <section aria-labelledby="h-renew"
      className="flex flex-col justify-center gap-2 p-5 md:col-span-12 md:border-t md:border-hairline lg:col-span-3 lg:border-t-0 lg:border-l">
      <h2 id="h-renew" className="sr-only">Renewal</h2>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => showTab('overview', 'runway')}
            aria-label={`${renewal.daysLeft} days to renewal on ${fmtDY(renewal.date)}. Show the renewal runway`}
            className={cn('-mx-1.5 flex items-baseline gap-2 self-start rounded-md px-1.5 text-left transition-colors hover:bg-accent/60', focusRing)}>
            <span className="text-3xl font-normal tabular-nums tracking-[-0.03em] text-bad">{renewal.daysLeft}</span>
            <span className="text-sm text-muted-foreground">days to renewal</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Renews {fmtDY(renewal.date)} · show the runway</TooltipContent>
      </Tooltip>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm tabular-nums">
        {fmtDY(renewal.date)} · {renewal.carrLabel} <Term>CARR</Term>
        {!renewal.autoRenew && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className={cn('ml-1 rounded-md border border-hairline px-1.5 py-0.5 text-xs', focusRing)}>Auto-renew off</span>
            </TooltipTrigger>
            <TooltipContent>The contract won't renew on its own, so the {score.overrideCode} cap applies</TooltipContent>
          </Tooltip>
        )}
      </p>
      {r && (
        <div className="mt-1 grid gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} role="img" aria-label={`Renewal runway: ${r.used} of ${r.total} days used since first flagged ${fmtDY(r.firstFlag)}, ${r.left} left`}
                className={cn('group/run relative -my-1.5 block rounded-full py-1.5', focusRing)}>
                <span className="relative block h-1 rounded-full bg-chart-5">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/60 transition-opacity group-hover/run:opacity-80" style={{ width: `${pct}%` }} />
                  <span className="absolute -top-1 h-3 w-0.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${pct}%` }} aria-hidden="true" />
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent className="tabular-nums">{r.used} of {r.total} days used · {r.left} left</TooltipContent>
          </Tooltip>
          <span className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>Flagged {fmtD(r.firstFlag)}</span><span>{fmtD(RENEWAL)}</span>
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
      <div className="flex items-center gap-4 md:col-span-4 lg:col-span-3"><Skeleton className="size-[104px] rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-3 w-24" /></div></div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 md:col-span-8 lg:col-span-6">
        {AREA_KEYS.map(k => <div key={k} className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-1 w-full" /></div>)}
      </div>
      <div className="space-y-3 md:col-span-12 lg:col-span-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-44" /><Skeleton className="h-1 w-full" /></div>
    </div>
  )
}
