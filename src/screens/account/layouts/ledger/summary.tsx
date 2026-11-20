/* Summary tab for the Ledger layout. Under the hero: why the score is what it is (the area ledger closing on the
   cap, then the history), then context in three clusters: the account in words (brief, strengths and risks), the
   contract and its figures (order forms, key figures), and recent activity. A strong rule and a wide gap open each
   cluster; sections inside one sit closer, under one heading size. No boxes. */
import { useMemo } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { listPager } from '@/components/app/record-sheet'
import { DateText } from '@/components/app/date-text'
import { fmtWhen } from '@/lib/dates'
import { rangeStart, useRange } from '@/lib/range'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { buildVerdict } from '../../header'
import { Cited } from '../../overview'
import { NavLink, showTab, useWidget, WidgetBody } from '../../overview/bits'
import { ACT_STATUS, ActivitySheet } from '../../overview/activity-sheet'
import { BRIEF, CLM, WELL, ATTN, type ListItem } from '../../overview/content'
import { RunwayChart } from '../../overview/runway-chart'
import { activityTotal } from '../../activity/model'
import { ACCT, activityItems, AREA_NAME, renewal, runway, score, TODAY, fmtDY, type AreaKey } from '../../facts'
import { AreaKey as AreaScaleKey, AreaLedger } from './areas'
import { KeyFigures } from './strip'
import { Cluster, focusRing, LedgerSection } from './bits'

const openArea = (k: AreaKey) => openSheet('area', k)

export function LedgerSummary() {
  const range = useRange()
  const d = useMemo(() => buildVerdict(range), [range])
  return (
    <div className="flex min-w-0 flex-col">
      {/* 3. why: what makes up the score (the six areas, then the cap), then its history */}
      <div className="border-t border-foreground/70 pt-5">
        <LedgerSection id="h-areas" title={`Why ${score.final}`} actions={<AreaScaleKey since={d.since} />}>
          <AreaLedger d={d} range={range} />
          <div id="runway" data-ledger-runway className="mt-12 scroll-mt-40">
            <p className="text-[13px] text-muted-foreground">
              <span className="text-foreground">Score by month</span>
              {runway && <>, flagged since {fmtDY(runway.firstFlag)}</>}
            </p>
            <div className="pt-4"><RunwayChart /></div>
          </div>
        </LedgerSection>
      </div>

      {/* 4. context, in three clusters: the account in words, the contract and its figures, what happened lately */}
      <Cluster>
        <BriefSection />
        <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-2">
          <Findings id="h-well" title="Going well" items={WELL} />
          <Findings id="h-attn" title="Needs attention" items={ATTN} />
        </div>
      </Cluster>

      <Cluster className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <OrderForms />
        <LedgerSection id="h-figures" title="Key figures"><KeyFigures /></LedgerSection>
      </Cluster>

      <Cluster><RecentActivity /></Cluster>
    </div>
  )
}

/* ---------- account brief: heading | sentence, with sources ---------- */
async function copyBrief(d: [string, string][]) {
  const text = d.map(([h, t]) => `${h}: ${t.replace(/\s?\{\w+\}/g, '')}`).join('\n')
  try {
    await navigator.clipboard.writeText(`${ACCT.name} account brief\n${text}`)
    toast('Brief copied')
  } catch {
    toast.error("Couldn't copy the brief", { description: 'The browser blocked clipboard access.' })
  }
}

function BriefSection() {
  const w = useWidget(() => BRIEF)
  const ready = w.status === 'ready' && !!w.data?.length
  return (
    <LedgerSection id="h-brief" title="Account brief" aside="From monthly summaries"
      actions={ready && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Copy brief" onClick={() => copyBrief(w.data!)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><Copy /></Button>
          </TooltipTrigger>
          <TooltipContent>Copy brief</TooltipContent>
        </Tooltip>
      )}>
      <WidgetBody w={w} what="the account brief" isEmpty={x => x.length === 0} empty={{ sub: 'No summary has been written for this account yet.' }}
        skeleton={<div className="space-y-3 py-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>}>
        {x => (
          <dl className="divide-y divide-hairline border-t border-hairline">
            {/* the next step leads the strip, so the brief keeps the context around it */}
            {x.filter(([h]) => h !== 'Next').map(([h, t]) => (
              <div key={h} className="grid gap-1 py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-[13px] text-muted-foreground sm:pt-0.5">{h}</dt>
                <dd className="max-w-[78ch] text-[15px] leading-relaxed"><Cited text={t} /></dd>
              </div>
            ))}
          </dl>
        )}
      </WidgetBody>
    </LedgerSection>
  )
}

const rowsSkeleton = (n: number) => (
  <div className="divide-y divide-hairline">{Array.from({ length: n }, (_, i) => (
    <div key={i} className="flex h-14 items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /></div>
  ))}</div>
)

/* ---------- going well / needs attention: finding | figure, the area under it ---------- */
function Findings({ id, title, items }: { id: string; title: string; items: ListItem[] }) {
  const w = useWidget(() => items)
  const bad = id === 'h-attn'
  return (
    <LedgerSection id={id} title={title} aside={w.status === 'ready' ? <span className="num">{w.data!.length}</span> : undefined}>
      <WidgetBody w={w} what={title.toLowerCase()} isEmpty={x => x.length === 0}
        empty={{ title: bad ? 'Nothing needs attention' : 'Nothing stands out yet' }} skeleton={rowsSkeleton(3)}>
        {x => (
          <ul className="divide-y divide-hairline border-t border-hairline">
            {x.map(([h, , m, area]) => (
              <li key={h}>
                <button type="button" onClick={() => openArea(area)} aria-label={`${h}. ${m}. Open ${AREA_NAME[area]} inputs`}
                  className={cn('ledger-row group/row grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-3.5 text-left', focusRing)}>
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-snug">{h}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{AREA_NAME[area]}</span>
                  </span>
                  <Figure text={m} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </WidgetBody>
    </LedgerSection>
  )
}

/** "97% onboarded" -> the figure in mono, the words after it quieter. */
function Figure({ text }: { text: string }) {
  const m = /^([$\d.,%KM]+)\s+(.*)$/.exec(text)
  if (!m) return <span className="text-[15px]">{text}</span>
  return (
    <span className="whitespace-nowrap text-right">
      <span className="num text-[15px]">{m[1]}</span>
      <span className="ml-1.5 text-[13px] text-muted-foreground">{m[2]}</span>
    </span>
  )
}

/* ---------- order forms: label | value | detail ---------- */
function OrderForms() {
  const w = useWidget(() => CLM)
  return (
    <LedgerSection id="h-paper" title="Order forms" aside={<>{renewal.carrLabel} contract, renews {fmtDY(renewal.date)}</>}>
      <WidgetBody w={w} what="order forms" isEmpty={x => x.length === 0} empty={{ title: 'No order forms' }} skeleton={rowsSkeleton(4)}>
        {x => (
          <ul className="border-t border-hairline">
            {x.map(([l, v, detail, area]) => {
              const body = (
                <>
                  <span className="text-[15px] text-muted-foreground">{l}</span>
                  <span className="min-w-0 text-[15px]">
                    {v}
                    {detail && <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{detail}</span>}
                  </span>
                </>
              )
              const cls = 'grid w-full grid-cols-[minmax(7rem,12rem)_minmax(0,1fr)] items-baseline gap-x-5 py-3.5 text-left'
              return (
                <li key={l} className="border-b border-hairline">
                  {area
                    ? <button type="button" onClick={() => openArea(area)} aria-label={`${l}: ${v}. Open ${AREA_NAME[area]} inputs`} className={cn(cls, 'ledger-row group/row', focusRing)}>{body}</button>
                    : <div className={cls}>{body}</div>}
                </li>
              )
            })}
          </ul>
        )}
      </WidgetBody>
    </LedgerSection>
  )
}

/* ---------- recent activity: date | what happened | who | signal ---------- */
function RecentActivity() {
  const range = useRange()
  const w = useWidget(() => {
    const from = rangeStart(range)
    const all = activityItems().filter(i => i.date <= TODAY && (!from || i.date >= from) && !/Engagement snapshot/.test(i.source) && i.kind !== 'flag')
      .sort((a, b) => +b.date - +a.date)
    return { top: all.slice(0, 6), all, total: activityTotal() }
  }, [range.id])
  const sheet = useSheet()
  const data = w.status === 'ready' ? w.data! : null
  const open = sheet?.type === 'activity' && data ? data.all.find(i => i.id === sheet.id) ?? null : null
  const pager = data ? listPager(data.top, open, i => i.id, i => openSheet('activity', i.id, { replace: true }), 'activity') : undefined
  return (
    <LedgerSection id="h-activity" title="Recent activity"
      actions={data && data.total > 0 && <NavLink onClick={() => showTab('activity')}>View all {data.total}</NavLink>}>
      <WidgetBody w={w} what="recent activity" isEmpty={x => x.all.length === 0}
        empty={range.days == null ? { title: 'No activity yet' } : { title: `No activity in the ${range.label.toLowerCase()}`, sub: 'Pick a longer date range to see older activity.' }}
        skeleton={rowsSkeleton(5)}>
        {x => (
          <ul className="divide-y divide-hairline border-t border-hairline">
            {x.top.map(i => {
              const st = ACT_STATUS[i.kind]
              return (
                <li key={i.id}>
                  <button type="button" onClick={() => openSheet('activity', i.id)} aria-label={`${i.title}, ${fmtWhen(i.date)}. Open details`}
                    className={cn('ledger-row ledger-activity group/row grid w-full items-baseline gap-x-5 py-3.5 text-left', focusRing)}>
                    <DateText date={i.date} className="num text-[13px] text-muted-foreground" />
                    <span className="min-w-0 truncate text-[15px]">{i.title}</span>
                    <span className="ledger-who min-w-0 truncate text-[13px] text-muted-foreground">{i.who[0] ?? i.source}</span>
                    <span className="ledger-signal text-right text-[13px] text-muted-foreground">{st?.label ?? ''}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </WidgetBody>
      <ActivitySheet item={open} onOpenChange={sheetOpenChange} pager={pager} />
    </LedgerSection>
  )
}
