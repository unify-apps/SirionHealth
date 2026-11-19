import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { HealthPill } from '@/components/health'
import { PageHeader, SectionTitle } from '@/components/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { go } from '@/lib/route'
import {
  BarsSkeleton, DonutSkeleton, EmptyState, KpiSkeleton, ListSkeleton, SplitSkeleton, TableSkeleton, TextSkeleton, WidgetError,
} from './states/widget-states'

/** A failed section whose retry runs a short load and fails again, so the demo stays put. */
function RetryDemo({ title, sub }: { title: string; sub: string }) {
  const [busy, setBusy] = useState(false)
  if (busy) return <TextSkeleton />
  return <WidgetError title={title} sub={sub} onRetry={() => { setBusy(true); setTimeout(() => setBusy(false), 700) }} />
}

const RULES: { title: string; rule: string; demo: React.ReactNode }[] = [
  {
    title: 'First load',
    rule: 'Placeholders take the shape of the real content, so nothing jumps when data arrives.',
    demo: (
      <div className="grid gap-2.5">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-3/4" />
        <div className="grid grid-cols-3 gap-2.5"><Skeleton className="h-3" /><Skeleton className="h-3" /><Skeleton className="h-3" /></div>
      </div>
    ),
  },
  {
    title: 'Refreshing',
    rule: 'When a filter or date changes, the current numbers stay readable and dim while a small spinner shows next to the title. Never blank, never stale without a signal.',
    demo: (
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Total ARR <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-label="Updating" />
        </div>
        <div className="text-2xl tabular-nums tracking-[-0.02em] opacity-55">$103.6M</div>
      </div>
    ),
  },
  {
    title: 'Nothing matches',
    rule: 'A search or filter with no results says what was searched and offers the way back.',
    demo: <EmptyState title="No accounts match “zzqx”" sub="Search looks at account names and industries." action="Clear search" />,
  },
  {
    title: 'No data in this period',
    rule: 'A section with no data for the chosen dates says so and offers a wider range, instead of an empty chart or builder text.',
    demo: <EmptyState title="No support tickets in the last 30 days" sub="BNP has 0 tickets in this period." action="Show lifetime" />,
  },
  {
    title: 'Missing metric',
    rule: 'A metric the source does not provide shows “No data” and is left out of averages and risk drivers. Never −1, “-” or undefined.',
    demo: (
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm">SLA compliance</p>
          <p className="text-xs text-muted-foreground">Freshservice does not report SLA for this account</p>
        </div>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    ),
  },
  {
    title: 'Section failed',
    rule: 'If one data source fails, only its section shows the error, with what failed and a retry. The rest of the page keeps working.',
    demo: <RetryDemo title="Support data didn't load" sub="Freshservice timed out after 20 seconds. Other sections are up to date." />,
  },
  {
    title: 'Account not found',
    rule: "A link to an account that doesn't exist or you can't access gets a real page, not a half-built one.",
    demo: (
      <EmptyState title="This account isn't in your book" sub="It may have been merged or reassigned, or the link is incomplete."
        action="Back to my accounts" onAction={() => go('accounts')} />
    ),
  },
  {
    title: 'Churned account',
    rule: 'Churned accounts get a closed-out view: a final summary and win-back context instead of renewal alarms.',
    demo: (
      <div className="flex flex-wrap items-center gap-3">
        <HealthPill band="bad">Churned prior FY</HealthPill>
        <p className="text-sm text-muted-foreground">BNP left on Apr 4, 2025. Last CARR $0. Renewal countdown hidden.</p>
      </div>
    ),
  },
]

const WIDGETS: { name: string; loading: React.ReactNode; empty: React.ReactNode; error: React.ReactNode }[] = [
  {
    name: 'KPI tile',
    loading: <KpiSkeleton className="shadow-none" />,
    empty: (
      <div className="grid gap-1 px-1">
        <span className="text-xs text-muted-foreground">Expansion</span>
        <span className="text-2xl tracking-[-0.02em] text-muted-foreground">No data</span>
        <span className="text-xs text-muted-foreground">Left out of averages</span>
      </div>
    ),
    error: <RetryDemo title="Expansion didn't load" sub="Salesforce timed out." />,
  },
  {
    name: 'Health split',
    loading: <SplitSkeleton />,
    empty: <EmptyState title="No scored accounts" sub="No account in this view has a health score yet." />,
    error: <RetryDemo title="The health split didn't load" sub="AHI's portfolio summary timed out." />,
  },
  {
    name: 'Table',
    loading: <TableSkeleton cols={4} />,
    empty: <EmptyState title="No pods match these filters" sub="Pod and region filters narrow this table." action="Clear filters" />,
    error: <RetryDemo title="Pod data didn't load" sub="The CS roster service timed out." />,
  },
  {
    name: 'Bar chart',
    loading: <BarsSkeleton bars={4} />,
    empty: <EmptyState title="No CARR by stage" sub="No live accounts carry CARR in any stage." />,
    error: <RetryDemo title="Stage data didn't load" sub="AHI's stage chart timed out." />,
  },
  {
    name: 'Donut',
    loading: <DonutSkeleton />,
    empty: <EmptyState title="No GRR data" sub="No account in the book reports GRR yet." />,
    error: <RetryDemo title="Retention data didn't load" sub="AHI's GRR feed timed out." />,
  },
  {
    name: 'List',
    loading: <ListSkeleton rows={3} />,
    empty: <EmptyState title="No stakeholders yet" sub="No contacts are tagged for this account." />,
    error: <RetryDemo title="Stakeholders didn't load" sub="Outlook sync timed out." />,
  },
  {
    name: 'Text summary',
    loading: <TextSkeleton />,
    empty: <EmptyState title="No summary this month" sub="There were no monthly notes for October." />,
    error: <RetryDemo title="The summary didn't load" sub="Monthly summaries are unavailable." />,
  },
]

export function StatesScreen() {
  return (
    <div className="flex flex-col">
      <PageHeader title="Loading, empty and error states" sub="One rule per state, used by every widget in the app." />

      <SectionTitle title="Rules" />
      <div className="grid gap-4 md:grid-cols-2">
        {RULES.map(r => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle className="text-sm">{r.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{r.rule}</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-hairline p-4">{r.demo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionTitle title="By widget" />
      <div className="grid gap-4">
        {WIDGETS.map(w => (
          <Card key={w.name}>
            <CardHeader><CardTitle className="text-sm">{w.name}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              {([['Loading', w.loading], ['Empty', w.empty], ['Error', w.error]] as const).map(([label, node]) => (
                <div key={label} className="grid content-start gap-2">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="min-w-0">{node}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
