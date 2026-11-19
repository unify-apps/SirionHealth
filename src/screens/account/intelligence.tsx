import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Empty, SectionTitle } from '@/components/page'
import { bandBg, bandOf, bandText } from '@/components/health'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ErrorState, useLoad } from './activity/shared'
import { loadIntel, type Input, type IntelData, type Theme } from './intelligence/model'
import { loadBase, stakeRows } from './stakeholders/model'
import { PersonSheet } from './stakeholders/person-sheet'
import { useRoles } from './stakeholders/store'

export function IntelligenceTab() {
  const load = useLoad(() => ({ intel: loadIntel(), base: loadBase() }))
  return (
    <div>
      <SectionTitle title="Internal" sub="From AHI's scored record" />
      {load.status === 'loading' && <InternalSkeleton />}
      {load.status === 'error' && <ErrorState what="AHI's inputs" onRetry={load.retry} />}
      {load.status === 'ready' && <Internal data={load.data.intel} />}

      <SectionTitle title="External" sub="From public news, 2026" />
      {load.status === 'loading' && <NewsSkeleton />}
      {load.status === 'error' && <ErrorState what="news" onRetry={load.retry} />}
      {load.status === 'ready' && <News themes={load.data.intel.news} base={load.data.base} />}
    </div>
  )
}

/* ---- internal: strongest and weakest inputs, and what isn't scored ---- */
function Internal({ data }: { data: IntelData }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <InputList title="Strongest inputs" items={data.strongest} />
        <InputList title="Weakest inputs" items={data.weakest} />
      </div>
      <Card className="gap-2 px-5 py-4">
        <h3 className="text-sm font-medium">Not scored <span className="font-normal tabular-nums text-muted-foreground">{data.unscored.length}</span></h3>
        {data.unscored.length ? (
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {data.unscored.map(u => (
              <li key={u.area + u.name} className="flex items-baseline justify-between gap-3 border-t border-hairline py-2 first:border-0 sm:[&:nth-child(2)]:border-0">
                <span className="min-w-0"><span className="block">{u.name}</span><span className="block text-xs text-muted-foreground">{u.areaName} · {u.note}</span></span>
                <span className="shrink-0 text-xs text-muted-foreground">No data</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground">Every input has a score.</p>}
      </Card>
    </div>
  )
}

function InputList({ title, items }: { title: string; items: Input[] }) {
  return (
    <Card className="gap-1 px-5 py-4">
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      {items.length ? (
        <ul className="grid divide-y divide-hairline">
          {items.map(x => {
            const b = bandOf(x.v)
            return (
              <li key={x.area + x.name} className="grid gap-1.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{x.name}</span>
                  <span className={cn('tabular-nums font-medium', bandText[b])}>{x.v}</span>
                </div>
                <span className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span className={cn('block h-full rounded-full', bandBg[b])} style={{ width: `${Math.max(2, x.v)}%` }} />
                </span>
                <p className="text-muted-foreground"><span className="text-foreground">{x.areaName}</span> · {x.note}</p>
              </li>
            )
          })}
        </ul>
      ) : <Empty title="No scored inputs" />}
    </Card>
  )
}

/* ---- external: public news themes, each with its dated events and why it matters ---- */
function News({ themes, base }: { themes: Theme[]; base: ReturnType<typeof loadBase> }) {
  const roles = useRoles()
  const rows = useMemo(() => stakeRows(base, roles), [base, roles])
  const max = useMemo(() => Math.max(1, ...rows.flatMap(r => r.months)), [rows])
  const [key, setKey] = useState<string | null>(null)
  const news = base.news[0]
  if (!themes.length) return <Empty title="No news found" sub="Nothing public about Transamerica or Aegon this year." />
  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y divide-hairline">
        {themes.map(t => (
          <li key={t.title} className="grid gap-2 px-5 py-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6">
            <div className="flex items-start justify-between gap-3 md:block">
              <h3 className="font-medium">{t.title}</h3>
              {t.relevance == null ? <span className="text-xs text-muted-foreground md:mt-1 md:block">No events</span> : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:mt-1.5">
                      Relevance
                      <span className="h-1 w-14 overflow-hidden rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full bg-chart-1" style={{ width: `${t.relevance}%` }} /></span>
                      <span className="tabular-nums text-foreground">{t.relevance}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>How much this matters to the renewal, 0 to 100</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="grid min-w-0 gap-2">
              <ul className="grid gap-1.5">
                {t.events.map((e, i) => (
                  <li key={i} className="grid gap-x-3 sm:grid-cols-[92px_minmax(0,1fr)]">
                    {e.date ? <><span className="text-xs tabular-nums text-muted-foreground sm:pt-px">{e.date}</span><span>{e.text}</span></>
                      : <span className="text-muted-foreground sm:col-span-2">{e.text}</span>}
                  </li>
                ))}
              </ul>
              {t.why && <p><span className="text-muted-foreground">Why it matters: </span>{t.why}</p>}
              {t.title === 'Executive leadership' && news && (
                <Button variant="outline" size="sm" className="w-fit" onClick={() => setKey('news:' + news.name)}>
                  {news.name} · suggested {news.suggested.toLowerCase()}<ChevronRight />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <PersonSheet row={rows.find(r => r.key === key) ?? null} ev={base.ev} months={base.months} max={max} onOpenChange={o => { if (!o) setKey(null) }} />
    </Card>
  )
}

function InternalSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading inputs">
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map(c => (
          <Card key={c} className="gap-3 px-5 py-4">
            <Skeleton className="h-4 w-32" />
            {[0, 1, 2, 3].map(i => <div key={i} className="grid gap-1.5 py-1"><div className="flex justify-between"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3.5 w-6" /></div><Skeleton className="h-1 w-full" /><Skeleton className="h-3 w-3/4" /></div>)}
          </Card>
        ))}
      </div>
      <Card className="gap-2 px-5 py-4"><Skeleton className="h-4 w-24" /><div className="grid gap-2 sm:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}</div></Card>
    </div>
  )
}
function NewsSkeleton() {
  return (
    <Card className="gap-0 py-0" aria-busy="true" aria-label="Loading news">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="grid gap-3 border-t border-hairline px-5 py-4 first:border-0 md:grid-cols-[200px_1fr] md:gap-6">
          <div className="grid gap-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div>
          <div className="grid gap-1.5"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-4/5" /><Skeleton className="h-3 w-2/3" /></div>
        </div>
      ))}
    </Card>
  )
}
