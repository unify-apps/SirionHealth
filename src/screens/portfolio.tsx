import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, HeartPulse, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf } from '@/components/health'
import { Term } from './account/overview/bits'
import { Meter } from '@/components/charts'
import { HealthRing } from '@/components/health'
import { PageHeader, Stat } from '@/components/page'
import { KpiSkeleton, LoadingLabel, WidgetError, useWidget } from './states/widget-states'
import { BOOK, KPIS, PODS } from './portfolio/data'
import { activeCount, FilterBar, NO_FILTERS, type Filters } from './portfolio/filters'
import { BandSplit } from './portfolio/band-split'
import { PodsTable } from './portfolio/pods-table'
import { GrrChart, StagesChart } from './portfolio/charts'

/** Briefly true after the filters change: numbers stay readable and dim, never blank. */
function useRefreshing(f: Filters) {
  const [on, setOn] = useState(false)
  const first = useRef(true)
  const key = JSON.stringify(f)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setOn(true)
    const t = setTimeout(() => setOn(false), 350)
    return () => clearTimeout(t)
  }, [key])
  return on
}

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
const tipText = (what: string) => <span className="grid gap-0.5"><span>{what}</span><span className="opacity-70">Source: AHI portfolio view, {BOOK.asOf}</span></span>

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
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const clear = () => {
    const prev = filters
    if (activeCount(prev) === 0) return
    setFilters(NO_FILTERS)
    toast('Filters cleared', { id: 'filters-cleared', action: { label: 'Undo', onClick: () => setFilters(prev) } })
  }
  const refreshing = useRefreshing(filters)
  const split = useRetryToast('split', 'the health split')
  const kpis = useRetryToast('kpis', 'KPIs')
  const pods = useRetryToast('pods', 'pods')
  const stages = useRetryToast('stages', 'stage data')
  const grr = useRetryToast('grr', 'retention data')

  const pod = PODS.find(p => p.name === filters.pod)
  const scope = pod ? `${pod.name} · ${pod.accounts} accounts` : filters.region !== 'all' ? `${filters.region} pods` : `All pods · ${BOOK.accounts} accounts`

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Portfolio"
        sub={`${scope} · as of ${BOOK.asOf}`}
        actions={<FilterBar value={filters} onChange={setFilters} onClear={clear} />}
      />

      <BandSplit status={split.status} onRetry={split.retry} filters={filters} onClearFilters={clear} />

      <section aria-label="Book KPIs" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.status === 'loading' && <><LoadingLabel what="KPIs" />{[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}</>}
        {kpis.status === 'error' && (
          <WidgetError className="col-span-full" title="KPIs didn't load" sub="AHI's portfolio summary timed out. Other sections are up to date." onRetry={kpis.retry} />
        )}
        {kpis.status === 'ready' && (
          <>
            <Stat label={<Term tip={tipText('Mean health of scored live accounts; accounts with no score are left out')}>Average health</Term>} icon={HeartPulse}
              value={KPIS.avgHealth} hint="Across the book"
              aside={<Tip label={`Average health ${KPIS.avgHealth} of 100, ${BAND_LABEL[bandOf(KPIS.avgHealth)]}`}
                tip={`${KPIS.avgHealth} of 100 · ${BAND_LABEL[bandOf(KPIS.avgHealth)]}`}>
                <HealthRing value={KPIS.avgHealth} size={36} stroke={3} label={false} />
              </Tip>} />
            <Stat label={<Term tip={tipText('ARR renewing in 60 days that is at risk or unsigned')}>ARR at renewal risk</Term>} icon={TriangleAlert}
              value={KPIS.arrAtRisk} tone="bad"
              visual={<Meter value={KPIS.arrAtRiskM} max={BOOK.arr} min={2}
                tip={`$${KPIS.arrAtRiskM}M of the $${BOOK.arr}M book (${((KPIS.arrAtRiskM / BOOK.arr) * 100).toFixed(1)}%)`} />}
              hint={`${((KPIS.arrAtRiskM / BOOK.arr) * 100).toFixed(1)}% of the $${BOOK.arr}M book`} />
            <Stat label={<Term tip={tipText('Accounts with a renewal date in the next 60 days')}>Renewing in 60 days</Term>} icon={CalendarClock}
              value={KPIS.renewing60}
              visual={<Meter value={KPIS.renewing60} max={BOOK.accounts} min={2}
                tip={`${KPIS.renewing60} of ${BOOK.accounts} accounts renew in 60 days`} />}
              hint={`of ${BOOK.accounts} accounts`} />
            <Stat label={<>Accounts at 100%+ <Term tip={tipText('GRR: gross revenue retention, revenue kept from existing customers before expansion')}>GRR</Term></>} icon={ShieldCheck}
              value={KPIS.grr100} tone="good"
              visual={<Meter value={KPIS.grr100} max={KPIS.grrWithData}
                tip={`${KPIS.grr100} of ${KPIS.grrWithData} accounts with GRR data (${Math.round((KPIS.grr100 / KPIS.grrWithData) * 100)}%)`} />}
              hint={`of ${KPIS.grrWithData} with GRR data · ${Math.round((KPIS.grr100 / KPIS.grrWithData) * 100)}%`} />
          </>
        )}
      </section>

      <div className="mt-6">
        <PodsTable status={pods.status} onRetry={pods.retry} filters={filters} refreshing={refreshing} onClearFilters={clear} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <StagesChart status={stages.status} onRetry={stages.retry} stage={filters.stage}
          onStage={s => setFilters(f => ({ ...f, stage: s }))} />
        <GrrChart status={grr.status} onRetry={grr.retry} />
      </div>
    </div>
  )
}
