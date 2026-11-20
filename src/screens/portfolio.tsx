import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { CalendarClock, HeartPulse, ShieldCheck } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf } from '@/components/health'
import { Term } from './account/overview/bits'
import { Meter, SplitBar } from '@/components/charts'
import { openSheet } from '@/lib/route'
import { HealthRing } from '@/components/health'
import { PageHeader, Stat } from '@/components/page'
import { KpiSkeleton, LoadingLabel, WidgetError, useWidget } from './states/widget-states'
import { BOOK, GRR, KPIS, PODS } from './portfolio/data'
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

/** A tile tooltip: what the metric is, then its source. */
const tipText = (what: string) => <span className="grid gap-0.5"><span>{what}</span><span className="opacity-70">Source: portfolio view, {BOOK.asOf}</span></span>

/** Focusable wrapper so a ring or meter in a tile carries its exact value in a tooltip. */
function Tip({ tip, label, children }: { tip: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} role="img" aria-label={label} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</span>
      </TooltipTrigger>
      <TooltipContent className="tabular-nums">{tip}</TooltipContent>
    </Tooltip>
  )
}

export function PortfolioScreen() {
  const split = useRetryToast('split', 'the health split')
  const kpis = useRetryToast('kpis', 'KPIs')
  const pods = useRetryToast('pods', 'pods')
  const stages = useRetryToast('stages', 'stage data')

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Portfolio"
        sub={`${PODS.length} pods · ${BOOK.accounts} accounts · as of ${BOOK.asOf}`}
      />

      <BandSplit status={split.status} onRetry={split.retry} />

      <section aria-label="Book KPIs" className="mt-4 grid gap-3 sm:grid-cols-3">
        {kpis.status === 'loading' && <><LoadingLabel what="KPIs" />{[0, 1, 2].map(i => <KpiSkeleton key={i} />)}</>}
        {kpis.status === 'error' && (
          <WidgetError className="col-span-full" title="KPIs didn't load" sub="The portfolio summary timed out. Other sections are up to date." onRetry={kpis.retry} />
        )}
        {kpis.status === 'ready' && (
          <>
            <Stat label={<Term tip={tipText('Mean health of scored live accounts; accounts with no score are left out')}>Average health</Term>} icon={HeartPulse}
              value={KPIS.avgHealth}
              aside={<Tip label={`Average health ${KPIS.avgHealth} of 100, ${BAND_LABEL[bandOf(KPIS.avgHealth)]}`}
                tip={`${KPIS.avgHealth} of 100 · ${BAND_LABEL[bandOf(KPIS.avgHealth)]}`}>
                <HealthRing value={KPIS.avgHealth} size={36} stroke={3} label={false} />
              </Tip>} />
            <Stat label={<Term tip={tipText('Accounts with a renewal date in the next 60 days')}>Renewing in 60 days</Term>} icon={CalendarClock}
              value={KPIS.renewing60}
              aside={<Term tip={tipText('ARR renewing in 60 days that is at risk or unsigned')}><span className="text-sm tabular-nums text-bad">{KPIS.arrAtRisk} at risk</span></Term>}
              visual={<Meter value={KPIS.renewing60} max={BOOK.accounts} min={2}
                tip={`${KPIS.renewing60} of ${BOOK.accounts} accounts renew in 60 days`} />}
              hint={`of ${BOOK.accounts} accounts`}
              onOpen={() => openSheet('renewals')} openLabel="See accounts renewing in 60 days" />
            <Stat label={<>At 100%+ <Term tip={tipText('GRR: gross revenue retention, revenue kept from existing customers before expansion')}>GRR</Term></>} icon={ShieldCheck}
              value={KPIS.grr100}
              visual={<SplitBar label="Accounts by GRR band" legend={false} unit="accounts" ordinal="asc"
                parts={GRR.map(g => ({ key: g.key, label: g.label, value: g.accounts }))} />}
              hint={`of ${KPIS.grrWithData} with data · ${Math.round((KPIS.grr100 / KPIS.grrWithData) * 100)}%`}
              onOpen={() => openSheet('retention')} openLabel="See accounts below 100% GRR" />
          </>
        )}
      </section>

      <div className="mt-6">
        <PodsTable status={pods.status} onRetry={pods.retry} />
      </div>

      <div className="mt-4">
        <StagesChart status={stages.status} onRetry={stages.retry} />
      </div>
      <RenewalsSheet />
      <RetentionSheet />
    </div>
  )
}
