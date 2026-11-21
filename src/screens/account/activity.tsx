import { useMemo, useState } from 'react'
import { Activity as ActivityIcon, CalendarClock, MessageSquare } from 'lucide-react'
import { BlockHeader, Empty, SectionTitle } from '@/components/page'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { activityCounts, journey, loadActivity, sentimentMonths, withRoles, type ActivityData, type JourneyMonth } from './activity/model'
import { HealthRibbon, RibbonLegend, SentimentMonths } from './activity/sentiment'
import { ErrorState, useLoad } from './activity/shared'
import { Timeline } from './activity/timeline'
import { useRoles } from './stakeholders/store'
import { renewal } from './facts'

type View = 'timeline' | 'sentiment'

export function ActivityTab() {
  const [view, setView] = useState<View>('timeline')
  const load = useLoad(() => ({ data: loadActivity(), journey: journey() }), undefined, 'activity')
  return (
    <Tabs value={view} onValueChange={v => setView(v as View)} className="grid gap-4">
      <SectionTitle title="Activity" actions={
        <TabsList aria-label="Activity view">
          <TabsTrigger value="timeline" className="px-3">Timeline</TabsTrigger>
          <TabsTrigger value="sentiment" className="px-3">Monthly Sentiment</TabsTrigger>
        </TabsList>
      } />
      {load.status === 'loading' && <ActivitySkeleton view={view} />}
      {load.status === 'error' && <ErrorState what="activity" onRetry={load.retry} />}
      {load.status === 'ready' && <Ready view={view} data={load.data.data} months={load.data.journey} />}
    </Tabs>
  )
}

function Ready({ view, data, months }: { view: View; data: ActivityData; months: JourneyMonth[] }) {
  const roles = useRoles()
  const items = useMemo(() => withRoles(data.items, roles), [data.items, roles])
  const counts = useMemo(() => activityCounts(items), [items])
  const sentiment = useMemo(() => sentimentMonths(data.ev), [data.ev])
  return (
    <>
      <Card className="gap-0 py-0">
        <BlockHeader icon={CalendarClock} title="Health to renewal" actions={<RibbonLegend />} />
        <div className="px-5 pt-4 pb-3"><HealthRibbon months={months} renewal={{ label: `Renewal ${renewal.carrLabel}`, date: renewal.date }} /></div>
      </Card>
      <TabsContent value={view} className="grid">
      {/* overflow-visible: the card's default overflow-hidden would stop the month headers sticking */}
      <Card data-block className="gap-0 overflow-visible py-0">
        {view === 'timeline' ? (
          <>
            <BlockHeader icon={ActivityIcon} title="Timeline" count={counts.total} sub={`${counts.past} to date · ${counts.upcoming} upcoming`} />
            <div className="px-3 py-4 sm:px-4">
              {items.length ? <Timeline items={items} /> : <Empty title="No activity" sub="No dated statements or key events for this account." />}
            </div>
          </>
        ) : (
          <>
            <BlockHeader icon={MessageSquare} title="Monthly sentiment" count={sentiment.length} sub="From monthly summaries" />
            <div className="p-5">
              {sentiment.length ? <SentimentMonths months={sentiment} /> : <Empty title="No monthly summaries" sub="Sentiment drivers appear once Sirion writes a monthly summary." />}
            </div>
          </>
        )}
      </Card>
      </TabsContent>
    </>
  )
}

function ActivitySkeleton({ view }: { view: View }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading activity">
      <Card className="gap-3 px-5 py-4">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-0.5 pt-4">{Array.from({ length: 20 }, (_, i) => <Skeleton key={i} className="h-7 flex-1 rounded-sm" />)}</div>
        <Skeleton className="h-3 w-1/2" />
      </Card>
      <Card data-block className="gap-0 px-4 py-4">
        {view === 'timeline' ? (
          <>
            <div className="flex gap-2 pb-3"><Skeleton className="h-7 w-72" /><Skeleton className="h-7 w-32" /></div>
            <Skeleton className="mx-2 my-2 h-3 w-20" />
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex min-h-13 items-center gap-3 px-2 py-2">
                <Skeleton className="size-8 rounded-full" />
                <div className="grid flex-1 gap-1.5"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </>
        ) : Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid gap-6 py-4 md:grid-cols-[150px_1fr_1fr]">
            <div className="grid gap-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
            <div className="grid gap-1.5"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
            <div className="grid gap-1.5"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/5" /></div>
          </div>
        ))}
      </Card>
    </div>
  )
}
