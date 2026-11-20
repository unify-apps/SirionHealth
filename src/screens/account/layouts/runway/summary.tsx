/* Summary under the runway: the four figures a CSM quotes as one quiet row, then ruled sections (brief, strengths and
   risks, recent activity and order forms). The runway itself is the hero above the tabs, so it is not repeated here.
   The sections reuse the Summary widgets; runway.css takes their boxes off. */
import { cn } from '@/lib/utils'
import { openSheet } from '@/lib/route'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Brief, ListCard, RecentActivity } from '../../overview'
import { ATTN, WELL } from '../../overview/content'
import { showTab } from '../../overview/bits'
import { kpis, renewal, type AreaKey } from '../../facts'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const setArea = (k: AreaKey) => openSheet('area', k)

export function RunwaySummary() {
  return (
    // the same split as the hero: narrative on the left, facts in a rail whose rule continues the destination's
    <div data-rw-summary className="@container">
      <div className="grid grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_16.5rem]">
        <div className="min-w-0 @3xl:pr-10">
          <Section first><Figures /></Section>
          <Section><Brief /></Section>
          <Section>
            <div className="grid gap-x-8 gap-y-10 @xl:grid-cols-2">
              <ListCard title="What's going well" items={WELL} tone="good" onArea={setArea} />
              <ListCard title="What needs attention" items={ATTN} tone="bad" onArea={setArea} />
            </div>
          </Section>
          <Section><RecentActivity /></Section>
        </div>
      </div>
    </div>
  )
}

/** A ruled section: a hairline above, then the widget, whose own title row runway.css restyles as the section title. */
function Section({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return <div className={cn('rw-section', !first && 'mt-12 border-t border-hairline pt-6')}>{children}</div>
}

/** Context, not score: the four figures a CSM quotes, as one quiet row at the top of Summary. No tiles, no colour. */
export function Figures() {
  const l = kpis.licence, over = l.used - l.bought
  const items: { label: string; value: React.ReactNode; hint: string; short: string; tip: string; onClick?: () => void }[] = [
    { label: 'Net retention', value: <>{kpis.nrr}<Unit>%</Unit></>, hint: `GRR ${kpis.grr}%, flat on last month`, short: `GRR ${kpis.grr}%`, tip: 'Net and gross revenue retention, last 12 months. Over 100% means the account grew.' },
    { label: 'Active users', value: kpis.mau, hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} the 12-month average`, short: `${kpis.mauChange > 0 ? '+' : kpis.mauChange < 0 ? '−' : ''}${Math.abs(kpis.mauChange)}% on average`, tip: `Monthly active users; 12-month average ${kpis.mauAvg}`, onClick: () => showTab('adoption') },
    { label: 'Licence use', value: <>{l.pct}<Unit>%</Unit></>, hint: over > 0 ? `${over} seats over the ${l.bought} bought` : `${l.used} of ${l.bought} seats`, short: over > 0 ? `${over} seats over` : `${l.used} of ${l.bought} seats`, tip: 'Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.', onClick: () => showTab('adoption') },
    { label: 'Open expansion', value: renewal.expansionLabel, hint: renewal.expansionLabel === '$0' ? 'No opportunity open' : 'Unsigned, on top of the renewal', short: renewal.expansionLabel === '$0' ? 'none open' : 'unsigned', tip: 'Open expansion opportunity on this account' },
  ]
  return (
    <ul aria-label="Key figures" className="grid gap-x-10 gap-y-2 text-[14px] @2xl:grid-cols-2">
      {items.map(k => {
        const inner = (
          <>
            <Tooltip>
              <TooltipTrigger asChild><span tabIndex={k.onClick ? undefined : 0} className={cn('rounded-sm text-muted-foreground', focusRing)}>{k.label}</span></TooltipTrigger>
              <TooltipContent className="max-w-72">{k.tip}</TooltipContent>
            </Tooltip>
            <span className="ml-2 inline-flex min-w-0 items-baseline gap-x-1.5">
              <span className="text-[14px] tabular-nums">{k.value}</span>
              <span className="text-muted-foreground">{k.short}</span>
            </span>
          </>
        )
        return (
          <li key={k.label} className="min-w-0">
            {k.onClick
              ? <button type="button" onClick={k.onClick} className={cn('-mx-1.5 -my-0.5 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-hover', focusRing)}>{inner}</button>
              : inner}
          </li>
        )
      })}
    </ul>
  )
}

const Unit = ({ children }: { children: React.ReactNode }) => <span className="ml-px text-muted-foreground">{children}</span>
