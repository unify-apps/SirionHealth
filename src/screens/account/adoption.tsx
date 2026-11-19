import { Skeleton } from '@/components/ui/skeleton'
import { Empty, SectionTitle } from '@/components/page'
import { TrendChart } from './health/charts'
import { LoadError, useLoad } from './health/load'
import { loadAdoption } from './adoption/model'
import { SplitBar } from '@/components/charts'
import { ChartCard, ChartSkeleton, StatGrid, StatGridSkeleton, ThemeBars } from './adoption/parts'

const fmt = (n: number) => n.toLocaleString('en-US')

export function AdoptionTab() {
  const load = useLoad(loadAdoption, undefined, 'adoption and support')

  if (load.status === 'loading') return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading adoption and support">
      <Skeleton className="mb-1 h-5 w-32" />
      <StatGridSkeleton />
      <div className="grid gap-3 lg:grid-cols-2"><ChartSkeleton /><ChartSkeleton /></div>
      <ChartSkeleton />
      <Skeleton className="mt-6 mb-1 h-5 w-32" />
      <StatGridSkeleton />
      <div className="grid gap-3 lg:grid-cols-2"><ChartSkeleton /><ChartSkeleton /></div>
    </div>
  )
  if (load.status === 'error') return <LoadError what="adoption and support" error={load.error} retry={load.retry} />

  const d = load.data
  const range = d.months.length ? `${d.months[0].label} to ${d.months[d.months.length - 1].label}` : ''
  const repoTotal = d.repository.reduce((s, p) => s + p.value, 0)
  const ticketTotal = d.priority.reduce((s, p) => s + p.value, 0)

  return (
    <div>
      <SectionTitle title="Adoption" sub="Lifetime" />
      <div className="flex flex-col gap-3">
        <StatGrid rows={d.adopt} />
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard title="Repository by type" sub={`${fmt(repoTotal)} records`}>
            <SplitBar parts={d.repository} unit="records" label="Repository records by type" />
          </ChartCard>
          <ChartCard title="Monthly active users over time">
            <Empty title="No monthly history"
              sub="AHI's scored record holds only this month's value, 222 users against a 12-month average of 215. The source has not sent a monthly series yet." />
          </ChartCard>
        </div>
        <ChartCard title="Adoption score over time" sub={range}>
          {d.months.length ? <TrendChart months={d.months} area="adoption" name="Product adoption" />
            : <Empty title="No scored months" />}
        </ChartCard>
      </div>

      <SectionTitle title="Support" sub={`Lifetime · ${fmt(ticketTotal)} tickets`} className="mt-10" />
      <div className="flex flex-col gap-3">
        <StatGrid rows={d.support} />
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard title="By priority" sub={`${fmt(ticketTotal)} tickets`}>
            <SplitBar parts={d.priority} unit="tickets" label="Tickets by priority" ordinal="desc" />
          </ChartCard>
          <ChartCard title="Ticket themes" sub={`Top ${d.themes.length} of ${d.themeCount}`}>
            <ThemeBars themes={d.themes} />
          </ChartCard>
        </div>
        <ChartCard title="Support score over time" sub={range}>
          {d.months.length ? <TrendChart months={d.months} area="support" name="Support and enhancement requests" />
            : <Empty title="No scored months" />}
        </ChartCard>
      </div>
    </div>
  )
}

