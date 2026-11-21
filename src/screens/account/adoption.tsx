/* Adoption tab: two cards, one per area. Each: header with the area score, a full-width strip of its figures,
   then the score trend (wide) beside the breakdown that explains it (repository mix; tickets by priority and theme). */
import { HeartPulse, LifeBuoy, TrendingUp, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarList } from '@/components/charts'
import { Empty, Tip } from '@/components/page'
import { bandOf, bandText } from '@/components/health'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { TrendChart } from './health/charts'
import { LoadError, useLoad } from './health/load'
import { loadAdoption, type StatRow } from './adoption/model'
import type { Month } from './health/model'

import { ACCT } from './facts'
const fmt = (n: number) => n.toLocaleString('en-US')

/** good / bad when a figure says something about the account; plain when it is just a fact. Read off the account's figures. */
const F = ACCT.facts
const up = (now: number, avg: number) => (now >= avg ? 'good' : 'bad') as 'good' | 'bad'
const TONE: Record<string, 'good' | 'bad' | undefined> = {
  'Monthly active users': up(F.mau[0], F.mau[1]), 'Licence use': F.licence.pct >= 90 ? 'good' : F.licence.pct < 70 ? 'bad' : undefined,
  'Onboarding': F.onboarding >= 90 ? 'good' : F.onboarding < 70 ? 'bad' : undefined,
  'Contracts processed': up(F.contracts[0], F.contracts[1]), 'Approval cycles closed': up(F.approvals[0], F.approvals[1]),
  'SLA met': F.sla >= 90 ? 'good' : 'bad', 'Reopen rate': F.reopen <= 5 ? 'good' : 'bad',
}
/** Counts where none is the good answer (P1s, escalations); a long open backlog is bad. */
export const toneOf = (label: string, value: string) => label in TONE ? TONE[label]
  : /P1 incidents|Exec escalations/.test(label) ? (value === '0' ? 'good' : 'bad')
  : label === 'Open enhancement requests' ? (+value > 10 ? 'bad' : undefined) : undefined

export function AdoptionTab() {
  const load = useLoad(loadAdoption, undefined, 'adoption and support')
  if (load.status === 'loading') return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading adoption and support">
      {[false, true].map((withSide, i) => (
        <Card key={i} data-block className="gap-0 py-0">
          <div className="flex items-center gap-3 px-5 pt-5 pb-3"><Skeleton className="h-5 w-44" /><Skeleton className="h-5 w-10" /></div>
          <div className="grid grid-cols-2 border-b border-hairline sm:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map(c => (
              <div key={c} className="grid gap-1.5 px-5 py-3 xl:py-4 xl:[&:not(:first-child)]:border-l xl:[&:not(:first-child)]:border-hairline">
                <Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-16" /><Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className={cn('grid divide-y divide-hairline', withSide && 'lg:grid-cols-2 lg:divide-x lg:divide-y-0')}>
            <div className="grid gap-3 p-5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-44 w-full" /></div>
            {withSide && <div className="grid gap-3 p-5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-44 w-full" /></div>}
          </div>
        </Card>
      ))}
    </div>
  )
  if (load.status === 'error') return <LoadError what="adoption and support" error={load.error} retry={load.retry} />

  const d = load.data
  const repoTotal = d.repository.reduce((s, p) => s + p.value, 0)
  const ticketTotal = d.priority.reduce((s, p) => s + p.value, 0)

  return (
    <div className="flex flex-col gap-6">
      <AreaCard icon={TrendingUp} title="Product adoption" area="adoption" months={d.months}
        stats={[...d.adopt, { label: 'Repository', value: fmt(repoTotal), hint: d.repository.map(p => `${fmt(p.value)} ${p.label.toLowerCase()}`).join(' · ') }]} />

      <AreaCard icon={LifeBuoy} title="Support" area="support" months={d.months}
        stats={d.support.map(s => s.label === 'Tickets' ? { ...s, value: fmt(ticketTotal), hint: d.priority.filter(p => p.value).map(p => `${p.label} ${p.value}`).join(' · ') } : s)}
        side={
            <Breakdown label="Top ticket themes" sub={`${d.themes.length} of ${d.themeCount}`}>
              {d.themes.length
                ? <Bars data={d.themes.map(t => ({ label: t.name, value: t.tickets }))} name="Tickets" />
                : <Empty title="No ticket themes" sub="No tickets have been grouped into themes yet." className="py-6" />}
            </Breakdown>
        } />
    </div>
  )
}

/** One area: header with its score and change, a strip of figures, then the trend beside one breakdown. */
function AreaCard({ icon: I, title, area, months, stats, side }: {
  icon: LucideIcon; title: string; area: keyof Month['areas']; months: Month[]; stats: StatRow[]; side?: React.ReactNode
}) {
  const last = months[months.length - 1], prev = months[months.length - 2]
  const score = last?.areas[area], delta = prev ? score - prev.areas[area] : 0
  return (
    <Card data-block className="gap-0 py-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 pt-5 pb-1">
        <I className="size-4 shrink-0 self-center text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-medium">{tc(title)}</h2>
        {score != null && <>
          <span className={cn('text-xl font-medium tabular-nums', bandText[bandOf(score)])}>{score}</span>
          <span className="text-xs text-muted-foreground">
            {delta ? <><span className={cn('tabular-nums', delta < 0 && 'text-bad')}>{delta > 0 ? '+' : '−'}{Math.abs(delta)}</span> since {prev.label.split(' ')[0]}</> : 'flat on last month'}
          </span>
        </>}
      </div>
      {/* figures: one strip, equal cells divided by hairlines */}
      {/* figures: one row of equal cells on wide screens (hairlines between), 2 or 3 per row below without inner rules */}
      <dl style={{ '--n': stats.length } as React.CSSProperties}
        className="grid grid-cols-2 gap-y-1 border-b border-hairline py-1 sm:grid-cols-3 xl:grid-cols-[repeat(var(--n),minmax(0,1fr))] xl:py-0">
        {stats.map(s => (
          <div key={s.label} className="grid min-w-0 content-start gap-0.5 px-5 py-3 xl:py-4 xl:[&:not(:first-child)]:border-l xl:[&:not(:first-child)]:border-hairline">
            <dt className="truncate text-xs text-muted-foreground" title={s.label}>{tc(s.label)}</dt>
            <dd className={cn('text-xl font-normal tabular-nums tracking-[-0.02em]', toneOf(s.label, s.value) === 'good' && 'text-good', toneOf(s.label, s.value) === 'bad' && 'text-bad')}>{s.value}</dd>
            {s.hint && <Tip tip={s.hint}><dd tabIndex={0} className="truncate rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{s.hint}</dd></Tip>}
          </div>
        ))}
      </dl>
      <div className={cn('grid divide-y divide-hairline', side && 'lg:grid-cols-2 lg:divide-x lg:divide-y-0')}>
        <div className="min-w-0 p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium"><HeartPulse className="size-3.5 text-muted-foreground" aria-hidden="true" />Score Over Time</p>
          {months.length ? <TrendChart months={months} area={area} name={title} className={side ? undefined : 'h-44'} /> : <Empty title="No scored months" />}
        </div>
        {side && <div className="min-w-0 p-5">{side}</div>}
      </div>
    </Card>
  )
}

function Breakdown({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="flex items-baseline gap-2 text-xs"><span className="font-medium text-foreground">{tc(label)}</span>{sub && <span className="text-muted-foreground">{sub}</span>}</p>
      {children}
    </div>
  )
}

/** Every breakdown on the tab is the same small bar list, so labels, bars and counts line up across cards. */
const Bars = ({ data, name }: { data: { label: string; value: number }[]; name: string }) =>
  <BarList data={data} name={name} track rowHeight={26} labelWidth={168} />
