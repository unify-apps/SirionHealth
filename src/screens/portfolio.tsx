import { useEffect, useRef, useState } from 'react'
import { Meter } from '@/components/charts'
import { HealthRing } from '@/components/health'
import { PageHeader, Stat } from '@/components/page'
import { KpiSkeleton, LoadingLabel, WidgetError, useWidget } from './states/widget-states'
import { BOOK, KPIS, PODS } from './portfolio/data'
import { FilterBar, NO_FILTERS, type Filters } from './portfolio/filters'
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

export function PortfolioScreen() {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const clear = () => setFilters(NO_FILTERS)
  const refreshing = useRefreshing(filters)
  const split = useWidget('split')
  const kpis = useWidget('kpis')
  const pods = useWidget('pods')
  const stages = useWidget('stages')
  const grr = useWidget('grr')

  const pod = PODS.find(p => p.name === filters.pod)
  const scope = pod ? `${pod.name} · ${pod.accounts} accounts` : filters.region !== 'all' ? `${filters.region} pods` : `All pods · ${BOOK.accounts} accounts`

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Portfolio"
        sub={`${scope} · as of ${BOOK.asOf}`}
        actions={<FilterBar value={filters} onChange={setFilters} />}
      />

      <BandSplit status={split.status} onRetry={split.retry} filters={filters} onClearFilters={clear} />

      <section aria-label="Book KPIs" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.status === 'loading' && <><LoadingLabel what="KPIs" />{[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}</>}
        {kpis.status === 'error' && (
          <WidgetError className="col-span-full" title="KPIs didn't load" sub="AHI's portfolio summary timed out. Other sections are up to date." onRetry={kpis.retry} />
        )}
        {kpis.status === 'ready' && (
          <>
            <Stat label="Average health" value={KPIS.avgHealth} hint="Across the book"
              aside={<HealthRing value={KPIS.avgHealth} size={36} stroke={3} label={false} />} />
            <Stat label="ARR at renewal risk" value={KPIS.arrAtRisk} tone="bad"
              visual={<Meter value={KPIS.arrAtRiskM} max={BOOK.arr} min={2} />}
              hint={`${((KPIS.arrAtRiskM / BOOK.arr) * 100).toFixed(1)}% of the $${BOOK.arr}M book`} />
            <Stat label="Renewing in 60 days" value={KPIS.renewing60}
              visual={<Meter value={KPIS.renewing60} max={BOOK.accounts} min={2} />}
              hint={`of ${BOOK.accounts} accounts`} />
            <Stat label="Accounts at 100%+ GRR" value={KPIS.grr100} tone="good"
              visual={<Meter value={KPIS.grr100} max={KPIS.grrWithData} />}
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
