/* Account header: identity, the verdict (score, how it was derived, renewal runway) and the KPI strip.
   Ported from renderVerdict, breakdown, the KPI strip in renderAccount and the #v-account .a-band markup. */
import { useState } from 'react'
import { ArrowDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { bandBg, bandOf, bandText, HealthPill, HealthRing } from '@/components/health'
import { Stat } from '@/components/page'
import {
  AREA_KEYS, AREA_NAME, AREA_SHORT, areaDelta, areaDriver, fmtD, fmtDY, kpis, latest, renewal, runway, score,
  SCORED_LINE, strongThisMonth, ymLabel, type AreaKey,
} from './facts'
import { InfoTip, showTab, SourceTag, useWidget, WidgetBody } from './overview/bits'
import { HowScoresDialog } from './overview/how-dialog'
import { AreaSheet } from './overview/area-sheet'

type Reason = { title: string; detail: string; area: AreaKey; kind: 'ai' | 'rule' }

function buildVerdict() {
  const eng = areaDelta('engagement'), sen = areaDelta('sentiment'), strong = strongThisMonth().length
  const reasons: Reason[] = [
    { area: 'commercial', kind: 'rule', title: `Renewal cap holds it at ${score.final}`,
      detail: `Renewal ${score.snapshotDays} days out at the ${fmtD(score.snapshot)} snapshot with auto-renew off. Lifts once the renewal is signed.` },
    { area: 'engagement', kind: 'rule', title: `Engagement ${eng < 0 ? 'fell' : 'rose'} ${Math.abs(eng)} points to ${latest.areas.engagement}`,
      detail: 'Champion Bailey Laske handed over her role on Oct 21.' },
    { area: 'sentiment', kind: 'ai', title: `Sentiment ${sen < 0 ? 'fell' : 'rose'} ${Math.abs(sen)} points to ${latest.areas.sentiment}`,
      detail: `${strong} strong negative${strong === 1 ? '' : 's'} in ${ymLabel(latest.ym).split(' ')[0]}, after the customer chased the INC-177010 root cause.` },
  ]
  const areas = AREA_KEYS.map(k => ({ k, v: latest.areas[k], vsWeighted: latest.areas[k] - score.weighted, driver: areaDriver(k) }))
  return { reasons, areas }
}

export function AccountHeader() {
  const [how, setHow] = useState(false)
  const [area, setArea] = useState<AreaKey | null>(null)
  const w = useWidget(buildVerdict)
  const openArea = (k: AreaKey) => { setHow(false); setArea(k) }

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-normal tracking-[-0.02em]">TransAmerica</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enterprise · Financial services · North America · BAU · Pod CS – NA · {SCORED_LINE}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setHow(true)}>How scores work</Button>
      </div>

      <Card className="gap-0 py-0">
        <WidgetBody w={w} what="the health verdict" skeleton={<VerdictSkeleton />}>
          {d => (
            <>
              <div className="grid divide-y divide-hairline lg:grid-cols-[13rem_minmax(0,1fr)_17rem] lg:divide-x lg:divide-y-0">
                <ScoreCell onHow={() => setHow(true)} />
                <WhyCell reasons={d.reasons} onArea={openArea} />
                <RenewalCell />
              </div>
              <AreaStrip areas={d.areas} onArea={openArea} />
            </>
          )}
        </WidgetBody>
      </Card>

      <KpiStrip />

      <HowScoresDialog open={how} onOpenChange={setHow} onOpenArea={openArea} />
      <AreaSheet area={area} onOpenChange={o => !o && setArea(null)} />
    </header>
  )
}

function ScoreCell({ onHow }: { onHow: () => void }) {
  return (
    <section aria-labelledby="h-health" className="flex items-center gap-5 p-5 lg:flex-col lg:items-start lg:gap-4">
      <h2 id="h-health" className="sr-only">Health</h2>
      <button type="button" onClick={onHow}
        aria-label={`Health ${score.final} of 100, ${bandOf(score.final) === 'warn' ? 'Watch' : ''}, capped from ${score.weighted}. See how it was derived`}
        className="rounded-full transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <HealthRing value={score.final} size={104} stroke={6} />
      </button>
      <div className="space-y-2">
        <HealthPill value={score.final} />
        <p className="text-sm text-muted-foreground">
          Capped from <span className="tabular-nums text-foreground">{score.weighted}</span>
        </p>
      </div>
    </section>
  )
}

function WhyCell({ reasons, onArea }: { reasons: Reason[]; onArea: (k: AreaKey) => void }) {
  return (
    <section aria-labelledby="h-why" className="min-w-0 p-5">
      <h2 id="h-why" className="text-sm font-medium">Why it's {score.final}</h2>
      {/* the derivation, as one line: weighted - cap = final */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm" aria-label={`Weighted ${score.weighted}, minus renewal cap ${score.cap}, equals ${score.final}`}>
        <Term v={score.weighted} label="weighted" />
        <span className="text-muted-foreground">−</span>
        <Term v={score.cap} label={`renewal cap (${score.overrideCode})`} />
        <span className="text-muted-foreground">=</span>
        <Term v={score.final} label="health" className={bandText[bandOf(score.final)]} />
      </div>
      <ul className="mt-3 divide-y divide-hairline">
        {reasons.map(r => (
          <li key={r.area}>
            <button type="button" onClick={() => onArea(r.area)}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm">
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium transition-colors group-hover:text-signal">{r.title}</span>
                  <SourceTag kind={r.kind} />
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{r.detail}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Term({ v, label, className }: { v: number; label: string; className?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-md bg-muted px-2 py-1">
      <span className={cn('text-base tabular-nums', className)}>{v}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  )
}

function RenewalCell() {
  const r = runway
  const pct = (daysBefore: number) => r ? (100 * (r.total - daysBefore)) / r.total : 0
  const line = r ? `First flagged ${fmtD(r.firstFlag)} · ${r.used} days used · ${r.left} left of ${r.total}`
    + (r.cleared.length ? ` · flag cleared once (${r.cleared.map(c => `${ymLabel(c.ym)} at ${c.final}`).join(', ')}) and came back` : '') : ''
  return (
    <section aria-labelledby="h-renew" className="flex flex-col gap-3 p-5">
      <h2 id="h-renew" className="text-sm font-medium">Renewal</h2>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-normal tabular-nums tracking-[-0.03em] text-bad">{renewal.daysLeft}</span>
          <span className="text-sm text-muted-foreground">days left</span>
        </div>
        <p className="mt-1 text-sm">{fmtDY(renewal.date)} · {renewal.carrLabel} CARR</p>
        <p className="text-sm text-muted-foreground">
          Auto-renew {renewal.autoRenew ? 'on' : 'off'} · {renewal.signed ? 'commitment signed' : 'not signed'}
        </p>
      </div>
      {r && (
        <div>
          <div className="relative h-1.5 rounded-full bg-muted" role="img" aria-label={line}>
            <span className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/60" style={{ width: `${pct(r.left)}%` }} />
            <span className="absolute -top-1 h-3.5 w-px bg-foreground" style={{ left: `${pct(r.left)}%` }} />
          </div>
          <div className="relative mt-1 h-4 text-[11px] tabular-nums text-muted-foreground">
            {[90, 60, 30].map(d => (
              <span key={d} className="absolute -translate-x-1/2" style={{ left: `${pct(d)}%` }}>{d}d</span>
            ))}
          </div>
          <p className="flex items-start gap-1 text-xs text-muted-foreground">
            First flagged {fmtD(r.firstFlag)} · {r.used} of {r.total} days used <InfoTip text={line} className="mt-px" />
          </p>
        </div>
      )}
      <Button variant="outline" size="sm" className="mt-auto self-start" onClick={() => showTab('overview', 'runway')}>
        Full runway <ArrowDown />
      </Button>
    </section>
  )
}

function AreaStrip({ areas, onArea }: { areas: ReturnType<typeof buildVerdict>['areas']; onArea: (k: AreaKey) => void }) {
  return (
    <section aria-labelledby="h-areas" className="border-t border-hairline p-5">
      <h2 id="h-areas" className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        Area scores against the weighted {score.weighted}
        <InfoTip text={`Areas above ${score.weighted} lift the weighted score and areas below pull it down. AHI doesn't store the weights, so exact points per area aren't shown.`} />
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {areas.map(a => (
          <button key={a.k} type="button" onClick={() => onArea(a.k)}
            aria-label={`${AREA_NAME[a.k]} ${a.v}, ${Math.abs(a.vsWeighted)} ${a.vsWeighted >= 0 ? 'above' : 'below'} the weighted score. Open inputs`}
            className="group flex flex-col gap-1.5 rounded-lg border border-hairline px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm">{AREA_SHORT[a.k]}</span>
              <span className={cn('tabular-nums font-medium', bandText[bandOf(a.v)])}>{a.v}</span>
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-muted">
              <span className={cn('block h-full rounded-full', bandBg[bandOf(a.v)])} style={{ width: `${Math.max(a.v, 2)}%` }} />
            </span>
            <span className="truncate text-xs tabular-nums text-muted-foreground">
              {a.vsWeighted >= 0 ? '+' : '−'}{Math.abs(a.vsWeighted)} vs {score.weighted}
              {a.driver && a.driver.score! < 50 ? ` · ${a.driver.name} ${a.driver.score}` : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function KpiStrip() {
  const w = useWidget(() => [
    { label: 'NRR / GRR', value: `${kpis.nrr}% / ${kpis.grr}%`, hint: 'Flat' },
    { label: 'Monthly active users', value: kpis.mau, hint: `${kpis.mauChange >= 0 ? '+' : '−'}${Math.abs(kpis.mauChange)}% vs 12-mo avg ${kpis.mauAvg}` },
    { label: 'Licence use', value: `${kpis.licence.pct}%`, hint: `${kpis.licence.used} of ${kpis.licence.bought} seats` },
    { label: 'Expansion', value: renewal.expansionLabel, hint: 'Open, nothing signed' },
    { label: 'Emails this month', value: kpis.emails, hint: 'Sentiment input' },
  ])
  return (
    <section aria-label="Key metrics">
      <WidgetBody w={w} what="key metrics" isEmpty={d => d.length === 0} empty={{ title: 'No metrics' }}
        skeleton={<div className="grid grid-cols-2 gap-3 md:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-xl" />)}</div>}>
        {d => (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {d.map((k, i) => <Stat key={k.label} label={k.label} value={k.value} hint={k.hint} className={cn(i === d.length - 1 && 'col-span-2 md:col-span-1')} />)}
          </div>
        )}
      </WidgetBody>
    </section>
  )
}

function VerdictSkeleton() {
  return (
    <div>
      <div className="grid gap-6 p-5 lg:grid-cols-[13rem_minmax(0,1fr)_17rem]">
        <div className="flex items-center gap-4 lg:flex-col lg:items-start"><Skeleton className="size-[104px] rounded-full" /><Skeleton className="h-5 w-20" /></div>
        <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-72 max-w-full" />{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        <div className="space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-28" /><Skeleton className="h-4 w-44" /><Skeleton className="h-1.5 w-full" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-hairline p-5 sm:grid-cols-3 lg:grid-cols-6">
        {AREA_KEYS.map(k => <Skeleton key={k} className="h-16 rounded-lg" />)}
      </div>
    </div>
  )
}
