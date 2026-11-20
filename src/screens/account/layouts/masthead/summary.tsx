/* Summary under the masthead: the context, in ruled sections with one heading size. Key figures, the brief, strengths
   and risks as two ruled lists with the figure on the right, then recent activity and the order forms. */
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { openSheet } from '@/lib/route'
import { Brief, RecentActivity } from '../../overview'
import { ATTN, WELL, type ListItem } from '../../overview/content'
import { AREA_NAME, kpis, renewal, type AreaKey } from '../../facts'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { showTab } from '../../overview/bits'
import { focusRing } from './hero'

const setArea = (k: AreaKey) => openSheet('area', k)

export function MastheadSummary() {
  return (
    <div className="flex flex-col">
      {/* context, below the three groups of the masthead: the figures a CSM quotes beside what happened lately, then the
          story in words. The order forms are renewal facts, so they live in the masthead's Renewal group. */}
      <div className="mh-section mh-pair grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Figures />
        <div className="mh-recent min-w-0"><RecentActivity /></div>
      </div>

      <div className="mh-section mh-bare"><Brief /></div>

      <section aria-labelledby="mh-lists" className="mh-section">
        <div className="mh-section-head"><h2 id="mh-lists">Strengths and risks</h2></div>
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          <Ruled title="Going well" items={WELL} tone="good" />
          <Ruled title="Needs attention" items={ATTN} tone="bad" />
        </div>
      </section>
    </div>
  )
}

/** One list: the claim on the left, its figure in mono on the right, the area it belongs to under the claim. */
function Ruled({ title, items, tone }: { title: string; items: ListItem[]; tone: 'good' | 'bad' }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-1 flex items-center gap-2 text-[13px] text-muted-foreground">
        <span className={cn('size-1.5 rounded-full', tone === 'good' ? 'bg-good' : 'bg-bad')} aria-hidden="true" />{title}
        <span className="num">{items.length}</span>
      </h3>
      {items.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{tone === 'good' ? 'Nothing stands out yet' : 'Nothing needs attention'}</p> : (
        <ul className="divide-y divide-hairline border-t border-hairline">
          {items.map(([h, , m, area]) => (
            <li key={h}>
              <button type="button" onClick={() => setArea(area)} aria-label={`${h}. ${m}. Open ${AREA_NAME[area]} inputs`}
                className={cn('group -mx-2 flex w-[calc(100%+1rem)] items-baseline gap-4 rounded-md px-2 py-3 text-left transition-colors hover:bg-hover focus-visible:ring-inset focus-visible:ring-offset-0', focusRing)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{h}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{AREA_NAME[area]}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums">{m}</span>
                <ArrowUpRight className="size-3.5 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- the figures a CSM quotes: context, not part of the score, so set as a quiet line of values ---------- */
function Figures() {
  const l = kpis.licence, over = l.used - l.bought
  const items: { label: string; value: React.ReactNode; hint: React.ReactNode; tip: string; go?: () => void }[] = [
    { label: 'Net retention', value: `${kpis.nrr}%`, hint: `GRR ${kpis.grr}%`, tip: 'Net and gross revenue retention, last 12 months. Over 100% means the account grew.' },
    { label: 'Active users', value: kpis.mau, hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} average`, tip: `Monthly active users; 12-month average ${kpis.mauAvg}`, go: () => showTab('adoption') },
    { label: 'Licence use', value: `${l.pct}%`, hint: over > 0 ? `${over} seats over` : `${l.used} of ${l.bought} seats`, tip: 'Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.', go: () => showTab('adoption') },
    { label: 'Open expansion', value: renewal.expansionLabel, hint: renewal.expansionLabel === '$0' ? 'none open' : 'unsigned', tip: 'Open expansion opportunity on this account, on top of the renewal' },
    { label: 'Open requests', value: kpis.openJira, hint: `${kpis.perAging} days old on average`, tip: 'Open Jira enhancement requests and their average age' },
    { label: 'Emails this month', value: kpis.emails, hint: 'with the account', tip: 'Emails exchanged with the account this month' },
  ]
  return (
    <section aria-labelledby="mh-figs" className="min-w-0">
      <div className="mh-section-head"><h2 id="mh-figs">Key figures</h2></div>
      <dl className="mh-figs divide-y divide-hairline border-t border-hairline">
        {items.map(k => (
          <Tooltip key={k.label}>
            <TooltipTrigger asChild>
              <div tabIndex={0} role={k.go ? 'link' : undefined} onClick={k.go}
                onKeyDown={e => { if (k.go && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); k.go() } }}
                className={cn('flex items-baseline justify-between gap-4 rounded-sm py-2.5', k.go && 'cursor-pointer hover:bg-hover', focusRing)}>
                <dt className="truncate text-[13px] text-muted-foreground">{k.label}</dt>
                <dd className="shrink-0 text-[15px] tabular-nums text-foreground"><span className="mr-2 text-[13px] text-muted-foreground">{k.hint}</span>{k.value}</dd>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">{k.tip}</TooltipContent>
          </Tooltip>
        ))}
      </dl>
    </section>
  )
}
