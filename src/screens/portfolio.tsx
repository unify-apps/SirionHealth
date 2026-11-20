import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { CalendarClock, HeartPulse, ShieldCheck } from 'lucide-react'
import { BAND_LABEL, bandOf, bandText } from '@/components/health'
import { Term } from './account/overview/bits'
import { Meter, Sparkline } from '@/components/charts'
import { openSheet } from '@/lib/route'
import { cn } from '@/lib/utils'
import { PageHeader, Stat } from '@/components/page'
import { KpiSkeleton, LoadingLabel, WidgetError, useWidget } from './states/widget-states'
import { AS_OF, moneyK, plural, regionOf } from './portfolio/data'
import { ScopeMenu, ScopeProvider, useScope } from './portfolio/scope'
import { BandSplit } from './portfolio/band-split'
import { PodsTable } from './portfolio/pods-table'
import { StagesChart } from './portfolio/charts'
import { RenewalsSheet, RetentionSheet } from './portfolio/kpi-sheets'

/** A widget whose retry fails says so in an error toast with its own Retry; the first load's error stays in place. */
function useRetryToast(name: string, what: string) {
  const w = useWidget(name)
  const retried = useRef(false)
  const retry = () => { retried.current = true; w.retry() }
  useEffect(() => {
    if (w.status === 'error' && retried.current) {
      retried.current = false
      toast.error(`Couldn't load ${what}`, { id: `retry-${name}`, action: { label: 'Retry', onClick: retry } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.status])
  return { status: w.status, retry }
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export function PortfolioScreen() {
  return <ScopeProvider><Portfolio /></ScopeProvider>
}

function Portfolio() {
  const { scope, summary: S } = useScope()
  const KPIS = S.kpis
  const health = KPIS.avgHealth
  const trend = KPIS.healthTrend
  const prev = trend.length > 1 ? trend[trend.length - 2] : null
  const split = useRetryToast('split', 'the health split')
  const kpis = useRetryToast('kpis', 'KPIs')
  const pods = useRetryToast('pods', 'pods')
  const stages = useRetryToast('stages', 'stage data')

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Portfolio"
        sub={[
          scope.kind === 'pod' ? `${scope.name} · ${regionOf(scope.name)}` : scope.kind === 'region' ? `${scope.name} · ${plural(S.pods.length, 'pod')}` : plural(S.pods.length, 'pod'),
          plural(S.book.accounts, 'account'), `as of ${AS_OF}`,
        ].join(' · ')}
        actions={<ScopeMenu />}
      />

      <BandSplit status={split.status} onRetry={split.retry} />

      <section aria-label="Book KPIs" className="mt-4 grid gap-3 sm:grid-cols-3">
        {kpis.status === 'loading' && <><LoadingLabel what="KPIs" />{[0, 1, 2].map(i => <KpiSkeleton key={i} />)}</>}
        {kpis.status === 'error' && (
          <WidgetError className="col-span-full" title="KPIs didn't load" sub="The portfolio summary timed out. Other sections are up to date." onRetry={kpis.retry} />
        )}
        {kpis.status === 'ready' && (
          <>
            {/* one anatomy: label · value (+ delta or qualifier) · one thin visual · one supporting line */}
            <Stat label={<Term tip="Mean health of scored live accounts. Accounts with no score are left out.">Average health</Term>} icon={HeartPulse}
              value={health == null ? 'No data' : <>
                <span className={bandText[bandOf(health)]}>{health}</span>
                <span className="ml-2 text-sm tracking-normal text-muted-foreground">{BAND_LABEL[bandOf(health)]}</span>
              </>}
              delta={prev ? { value: health! - prev.value, label: `vs ${prev.month}`, health: true } : undefined}
              visual={trend.length > 1 && <Sparkline values={trend.map(t => t.value)} className="h-5"
                domain={[Math.min(...trend.map(t => t.value)) - 4, Math.max(...trend.map(t => t.value)) + 4]}
                tip={trend.map(t => `${t.month} ${t.value}`).join(' · ')} />}
              hint={`${KPIS.scored} of ${plural(S.book.accounts, 'account')} scored`} />
            <Stat label="Renewing in 60 days" icon={CalendarClock}
              value={<>{moneyK(KPIS.renewingCarr)}<span className="ml-2 text-sm tracking-normal text-muted-foreground">{plural(KPIS.renewing60, 'account')}</span></>}
              visual={<Meter value={KPIS.renewalAtRisk} max={KPIS.renewingCarr || 1} min={KPIS.renewalAtRisk > 0 ? 2 : 0}
                tip={KPIS.renewingCarr ? `${pct(KPIS.renewalAtRisk, KPIS.renewingCarr)}% of renewing CARR is at risk or unsigned` : 'Nothing renews in 60 days'} />}
              hint={<Term tip="CARR renewing in 60 days on accounts at risk (health under 40) or without a signed renewal">
                <span className={cn(KPIS.renewalAtRisk > 0 && 'text-bad')}>{moneyK(KPIS.renewalAtRisk)} at risk or unsigned</span></Term>}
              onOpen={() => openSheet('renewals')} openLabel="See accounts renewing in 60 days" />
            <Stat label={<Term tip="Gross revenue retention: revenue kept from existing customers, before expansion">Gross retention</Term>} icon={ShieldCheck}
              value={KPIS.grrPct == null ? 'No data' : `${KPIS.grrPct}%`}
              visual={<Meter value={KPIS.grr100} max={KPIS.grrWithData || 1} min={KPIS.grr100 > 0 ? 2 : 0}
                tip={KPIS.grrWithData ? `${KPIS.grr100} of ${KPIS.grrWithData} accounts with GRR data retain 100% or more` : 'No account has GRR data'} />}
              hint={`${plural(KPIS.belowGrr.length, 'account')} below 100%${KPIS.grrNoData ? ` · ${KPIS.grrNoData} with no data` : ''}`}
              onOpen={() => openSheet('retention')} openLabel="See accounts below 100% GRR" />
          </>
        )}
      </section>

      {/* one pod in scope: its figures are the tiles, so the table would repeat them */}
      {scope.kind !== 'pod' && (
        <div className="mt-6">
          <PodsTable status={pods.status} onRetry={pods.retry} />
        </div>
      )}

      <div className="mt-4">
        <StagesChart status={stages.status} onRetry={stages.retry} />
      </div>
      <RenewalsSheet />
      <RetentionSheet />
    </div>
  )
}
