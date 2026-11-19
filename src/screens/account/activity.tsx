import { useMemo, useState } from 'react'
import { Empty, SectionTitle } from '@/components/page'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TA_EVENTS, TODAY } from '@/data/legacy'
import { journey, loadActivity, sentimentMonths, withRoles, type ActivityData, type JourneyMonth } from './activity/model'
import { JourneyStrip, SentimentMonths } from './activity/sentiment'
import { ErrorState, fmtD, useLoad } from './activity/shared'
import { Timeline } from './activity/timeline'
import { useRoles } from './stakeholders/store'

type View = 'timeline' | 'sentiment'

export function ActivityTab() {
  const [view, setView] = useState<View>('timeline')
  const load = useLoad(() => ({ data: loadActivity(), journey: journey() }))
  return (
    <div className="grid gap-4">
      <SectionTitle title="Activity" actions={
        <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={v => v && setView(v as View)} aria-label="View">
          <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
          <ToggleGroupItem value="sentiment">Monthly sentiment</ToggleGroupItem>
        </ToggleGroup>
      } />
      {load.status === 'loading' && <ActivitySkeleton view={view} />}
      {load.status === 'error' && <ErrorState what="activity" onRetry={load.retry} />}
      {load.status === 'ready' && <Ready view={view} data={load.data.data} months={load.data.journey} />}
    </div>
  )
}

function Ready({ view, data, months }: { view: View; data: ActivityData; months: JourneyMonth[] }) {
  const roles = useRoles()
  const items = useMemo(() => withRoles(data.items, roles), [data.items, roles])
  const sentiment = useMemo(() => sentimentMonths(data.ev), [data.ev])
  const events = TA_EVENTS as unknown as [string, string, string, string][]
  const last = events.filter(e => new Date(e[0] + 'T00:00:00') <= TODAY && e[1] !== 'end' && !/engagement snapshot/.test(e[3])).pop()
  return (
    <>
      <Card className="gap-3 px-5 py-4">
        <h3 className="text-sm font-medium">Timeline to renewal</h3>
        <JourneyStrip months={months} now={last ? `${last[2]} · ${fmtD(new Date(last[0] + 'T00:00:00'))}` : 'No events yet'} next="Renewal $330K · Dec 30, 2026" />
      </Card>
      <Card className="px-3 py-4 sm:px-4">
        {view === 'timeline'
          ? (items.length ? <Timeline items={items} snapshot={data.snapshot} /> : <Empty title="No activity" sub="No dated statements or key events for this account." />)
          : (sentiment.length
            ? <div className="grid gap-3 px-1"><p className="text-xs text-muted-foreground">From Sirion's monthly summaries. The score is the month's sentiment area score in AHI.</p><SentimentMonths months={sentiment} /></div>
            : <Empty title="No monthly summaries" sub="Sentiment drivers appear once Sirion writes a monthly summary." />)}
      </Card>
    </>
  )
}

function ActivitySkeleton({ view }: { view: View }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading activity">
      <Card className="gap-3 px-5 py-4">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center justify-between gap-1">{Array.from({ length: 20 }, (_, i) => <Skeleton key={i} className="size-2.5 rounded-full" />)}</div>
        <Skeleton className="h-3 w-2/3" />
      </Card>
      <Card className="gap-0 px-4 py-4">
        {view === 'timeline' ? (
          <>
            <div className="flex gap-2 pb-3"><Skeleton className="h-7 w-72" /><Skeleton className="h-7 w-32" /></div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="grid grid-cols-[16px_88px_minmax(0,1fr)_60px] items-start gap-3 py-3">
                <Skeleton className="size-4" /><Skeleton className="h-3 w-20" />
                <div className="grid gap-1.5"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-5/6" /></div>
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
