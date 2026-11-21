/* Adoption tab for the Ledger layout: one section per area (product adoption, support). Each reads like the Summary:
   a serif title with the area score, its figures as ruled rows (label and note | figure), the score by month in a
   hairline box beside them; support closes on its top ticket themes as a ruled bar list. Same data as AdoptionTab. */
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, Tip } from '@/components/page'
import { bandOf, bandText } from '@/components/health'
import { cn } from '@/lib/utils'
import { TrendChart } from '../../health/charts'
import { LoadError, useLoad } from '../../health/load'
import { loadAdoption, type StatRow } from '../../adoption/model'
import { toneOf } from '../../adoption'
import type { Month } from '../../health/model'
import { Cluster, LedgerSection } from './bits'

const fmt = (n: number) => n.toLocaleString('en-US')

export function LedgerAdoption() {
  const load = useLoad(loadAdoption, undefined, 'adoption and support')
  if (load.status === 'loading') return (
    <div className="grid gap-16" aria-busy="true" aria-label="Loading adoption and support">
      {[0, 1].map(i => (
        <div key={i} className="grid gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-14 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
        </div>
      ))}
    </div>
  )
  if (load.status === 'error') return <LoadError what="adoption and support" error={load.error} retry={load.retry} />

  const d = load.data
  const repoTotal = d.repository.reduce((s, p) => s + p.value, 0)
  const ticketTotal = d.priority.reduce((s, p) => s + p.value, 0)
  const adopt = [...d.adopt, { label: 'Repository', value: fmt(repoTotal), hint: d.repository.map(p => `${fmt(p.value)} ${p.label.toLowerCase()}`).join(' · ') }]
  const support = d.support.map(s => s.label === 'Tickets'
    ? { ...s, value: fmt(ticketTotal), hint: d.priority.filter(p => p.value).map(p => `${p.label} ${p.value}`).join(' · ') } : s)
  const maxTheme = Math.max(1, ...d.themes.map(t => t.tickets))

  return (
    <div className="flex min-w-0 flex-col">
        <Area id="h-adoption" title="Product adoption" area="adoption" months={d.months} stats={adopt} />
      <Cluster className="mt-16">
        <Area id="h-support" title="Support" area="support" months={d.months} stats={support} />
        <LedgerSection id="h-themes" title="Top ticket themes" className="mt-12"
          aside={<><span className="num">{d.themes.length}</span> of <span className="num">{d.themeCount}</span> themes, by tickets</>}>
          {d.themes.length ? (
            <ul aria-label="Tickets by theme">
              {d.themes.map(t => (
                <li key={t.name} className="ledger-themes grid items-center gap-x-6 py-3">
                  <span className="min-w-0 truncate text-[15px]">{t.name}</span>
                  <span className="relative h-1.5 overflow-hidden rounded-full bg-[var(--ledger-track)]" aria-hidden="true">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--ledger-fill)]" style={{ width: `${(t.tickets / maxTheme) * 100}%` }} />
                  </span>
                  <span className="num text-right text-[15px]">{fmt(t.tickets)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty title="No ticket themes" sub="No tickets have been grouped into themes yet." className="py-6" />}
        </LedgerSection>
      </Cluster>
    </div>
  )
}

/** One area: title with its score and change, its figures as ruled rows, and the score by month beside them. */
function Area({ id, title, area, months, stats }: { id: string; title: string; area: keyof Month['areas']; months: Month[]; stats: StatRow[] }) {
  const last = months[months.length - 1], prev = months[months.length - 2]
  const score = last?.areas[area], delta = prev && score != null ? score - prev.areas[area] : 0
  return (
    <LedgerSection id={id} title={title} aside={score == null ? 'No data' : (
      <>
        <span className={cn('num text-[15px]', bandText[bandOf(score)])}>{score}</span>
        <span className="ml-2">{delta ? <><span className={cn('num', delta < 0 && 'text-bad')}>{delta > 0 ? '+' : '−'}{Math.abs(delta)}</span> since {prev.label.split(' ')[0]}</> : 'flat on last month'}</span>
      </>
    )}>
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <dl className=" self-start">
          {stats.map(s => {
            const tone = toneOf(s.label, s.value)
            return (
              <div key={s.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-3">
                <dt className="min-w-0">
                  <span className="block text-[15px] leading-snug">{s.label}</span>
                  {s.hint && <Tip tip={s.hint}><span tabIndex={0} className="mt-0.5 block truncate rounded-sm text-[13px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{s.hint}</span></Tip>}
                </dt>
                <dd className={cn('num text-right text-[15px]', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad')}>{s.value || 'No data'}</dd>
              </div>
            )
          })}
        </dl>
        <figure className="min-w-0 self-start">
          <figcaption className="text-[13px] text-muted-foreground"><span className="text-foreground">Score by month</span>, against Watch 70 and At risk 40</figcaption>
          <div className="mt-3 rounded-xl border border-hairline px-3 pt-2 pb-3">
            {months.length ? <TrendChart months={months} area={area} name={title} className="h-72" /> : <Empty title="No scored months" />}
          </div>
        </figure>
      </div>
    </LedgerSection>
  )
}
