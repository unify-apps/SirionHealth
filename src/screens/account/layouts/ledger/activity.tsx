/* Activity tab for the Ledger layout: the health ribbon to renewal in a hairline frame, then the timeline (or the
   monthly sentiment) as ruled rows under one serif title, read like the Summary's recent activity. Same data, filters
   and sheets as ActivityTab. */
import { useMemo, useState } from 'react'
import { Empty, SEGMENTED } from '@/components/page'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { activityCounts, journey, loadActivity, sentimentMonths, withRoles } from '../../activity/model'
import { HealthRibbon, RibbonLegend, SentimentMonths } from '../../activity/sentiment'
import { ErrorState, useLoad } from '../../activity/shared'
import { Timeline } from '../../activity/timeline'
import { useRoles } from '../../stakeholders/store'
import { renewal } from '../../facts'
import { Cluster, LedgerSection } from './bits'

type View = 'timeline' | 'sentiment'

export function LedgerActivity() {
  const [view, setView] = useState<View>('timeline')
  const load = useLoad(() => ({ data: loadActivity(), journey: journey() }), undefined, 'activity')
  const roles = useRoles()
  const ready = load.status === 'ready' ? load.data : null
  const items = useMemo(() => ready ? withRoles(ready.data.items, roles) : [], [ready, roles])
  const counts = useMemo(() => activityCounts(items), [items])
  const sentiment = useMemo(() => ready ? sentimentMonths(ready.data.ev) : [], [ready])

  if (load.status === 'error') return <ErrorState what="activity" onRetry={load.retry} />
  if (!ready) return (
    <div className="grid gap-4 border-t border-foreground/70 pt-5" aria-busy="true" aria-label="Loading activity">
      <Skeleton className="h-6 w-48" /><Skeleton className="h-16 w-full rounded-xl" />
      <div className="mt-12 divide-y divide-hairline">{Array.from({ length: 7 }, (_, i) => <div key={i} className="flex h-12 items-center gap-5"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-3 w-14" /></div>)}</div>
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col">
      <div className="border-t border-foreground/70 pt-5">
        <LedgerSection id="h-ribbon" title="Health to renewal" aside="Month by month, coloured by health band" actions={<RibbonLegend />}>
          <div className="mt-1 rounded-xl border border-hairline px-4 pt-3 pb-2.5">
            <HealthRibbon months={ready.journey} renewal={{ label: `Renewal ${renewal.carrLabel}`, date: renewal.date }} />
          </div>
        </LedgerSection>
      </div>

      <Cluster className="mt-16">
        <LedgerSection id="h-timeline" title={view === 'timeline' ? 'Timeline' : 'Monthly sentiment'}
          aside={view === 'timeline'
            ? <><span className="num">{counts.past}</span> to date, <span className="num">{counts.upcoming}</span> upcoming</>
            : 'From monthly summaries'}
          actions={
            <ToggleGroup type="single" spacing={0} value={view} onValueChange={v => v && setView(v as View)} aria-label="Activity view" className={SEGMENTED.group}>
              <ToggleGroupItem value="timeline" className={SEGMENTED.item}>Timeline</ToggleGroupItem>
              <ToggleGroupItem value="sentiment" className={SEGMENTED.item}>Monthly sentiment</ToggleGroupItem>
            </ToggleGroup>
          }>
          {view === 'timeline' ? (
            <div className="pt-2">
              {items.length ? <Timeline items={items} snapshot={ready.data.snapshot} ruled /> : <Empty title="No activity" sub="No dated statements or key events for this account." />}
            </div>
          ) : sentiment.length ? (
            <div className="border-t border-hairline pt-4 text-[15px] [&_h4]:text-[15px] [&_h4]:font-normal [&_h5]:text-[13px]">
              <SentimentMonths months={sentiment} />
            </div>
          ) : <Empty title="No monthly summaries" sub="Sentiment drivers appear once Sirion writes a monthly summary." />}
        </LedgerSection>
      </Cluster>
    </div>
  )
}
