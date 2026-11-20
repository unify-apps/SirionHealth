/* Summary tab: account brief, strengths and risks, renewal runway, recent activity, order forms.
   Ported from renderSummary, openRef, renderCLM, renderRunway and the #s-summary markup. */
import {
  Activity, CalendarClock, CalendarDays, CircleAlert, CircleCheck, Copy, FileSignature, FileText, FileX, HeartPulse, LifeBuoy, Mail, MessageSquare, Phone, StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { taPeople } from '@/data/legacy'
import { listPager } from '@/components/app/record-sheet'
import { DateText } from '@/components/app/date-text'
import { fmtWhen } from '@/lib/dates'
import { rangeStart, useRange } from '@/lib/range'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { activityTotal } from './activity/model'
import {
  ACCT, activityItems, AREA_NAME, evidence, TODAY, ymLabel, type AreaKey, type Channel,
} from './facts'
import { AREA_ICON, EvidenceRow, Glossed, ListRow, NavLink, SectionHead, showTab, useCollapse, useWidget, WidgetBody } from './overview/bits'
import { ACT_STATUS, ActivitySheet } from './overview/activity-sheet'
import { ATTN, BRIEF, CLM, REF_ORDER, SUM_REFS, WELL, type ListItem } from './overview/content'
import { RunwayChart } from './overview/runway-chart'

// the area sheet lives in the URL and the account header renders it (overview/how-sheet.tsx)
const setArea = (k: AreaKey) => openSheet('area', k)

export function OverviewTab() {
  const lists = useCollapse()
  return (
    <div className="flex flex-col">
      <Brief />

      <SectionHead title="Strengths and risks" open={lists.open} onToggle={lists.toggle} id="h-lists" />
      {lists.open && (
        <div className="grid gap-4 md:grid-cols-2">
          <ListCard title="What's going well" items={WELL} tone="good" onArea={setArea} />
          <ListCard title="What needs attention" items={ATTN} tone="bad" onArea={setArea} />
        </div>
      )}

      <section id="runway" aria-labelledby="h-runway" className="mt-8 scroll-mt-40">
        <Card data-block className="gap-0 py-0">
          <BlockHeader icon={CalendarClock} title={<span id="h-runway">Renewal runway</span>}
            />
          <div className="px-4 pt-5 pb-4 sm:px-5"><RunwayChart /></div>
        </Card>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RecentActivity />
        <OrderForms onArea={setArea} />
      </div>

    </div>
  )
}

/* ---------- citations: every source goes after its sentence's full stop ---------- */
function Cited({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  return (
    <>
      {sentences.map((s, i) => {
        const keys: string[] = []
        const body = s.replace(/\s?\{(\w+)\}/g, (_, k) => { keys.push(k); return '' })
        keys.sort((a, b) => REF_ORDER.indexOf(a) - REF_ORDER.indexOf(b))
        return (
          <span key={i}>
            {i > 0 && ' '}{body}
            {keys.map(k => <Footnote key={k} k={k} />)}
          </span>
        )
      })}
    </>
  )
}

/** What a footnote points at, for its tooltip. */
function refName(k: string) {
  const r = SUM_REFS[k]
  return !r ? 'Source' : r.kind === 'rec' ? r.label : r.kind === 'ev' ? 'Monthly summary' : 'Suggested role'
}

function Footnote({ k }: { k: string }) {
  const n = REF_ORDER.indexOf(k) + 1
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Source ${n}: ${refName(k)}`}
              className="relative ml-0.5 inline-grid h-4 min-w-4 -translate-y-0.5 place-items-center rounded-[5px] border border-border px-1 align-middle text-[10px] after:absolute after:left-1/2 after:top-1/2 after:size-6 after:min-w-6 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] tabular-nums text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-signal data-[state=open]:text-signal">
              {n}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{refName(k)}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" onOpenAutoFocus={e => e.preventDefault()} className="w-80 max-w-[calc(100vw-2rem)] gap-1.5 p-3">
        <RefBody k={k} />
      </PopoverContent>
    </Popover>
  )
}

function RefBody({ k }: { k: string }) {
  const r = SUM_REFS[k]
  if (!r) return <p className="text-muted-foreground">No data</p>
  if (r.kind === 'rec') return (
    <>
      <p className="text-xs text-muted-foreground">{r.label}</p>
      <p className="leading-relaxed"><Glossed text={r.text} /></p>
    </>
  )
  if (r.kind === 'ev') {
    const ev = evidence().filter(e => e.text.includes(r.match))
    return (
      <>
        <p className="text-xs text-muted-foreground">Monthly summary</p>
        {ev.length ? <div className="divide-y divide-hairline">{ev.map(e => <EvidenceRow key={e.text} e={e} />)}</div> : <p>No data</p>}
      </>
    )
  }
  const p = (taPeople() as { email: string; name: string; suggested: string | null; basis: string | null; mentions: number; lastMentioned: string | null }[])
    .find(x => x.email === r.email)
  if (!p) return <p className="text-muted-foreground">No data</p>
  return (
    <>
      <p className="text-xs text-muted-foreground">Suggested role</p>
      <p className="font-medium">{p.name}{p.suggested ? ` · ${p.suggested}` : ''}</p>
      {p.basis && <p className="leading-relaxed">{p.basis}</p>}
      <p className="text-xs text-muted-foreground">Named in {p.mentions} monthly summaries{p.lastMentioned ? `, last ${ymLabel(p.lastMentioned)}` : ''}.</p>
    </>
  )
}

/* ---------- account brief ---------- */
const briefText = (d: [string, string][]) =>
  d.map(([h, t]) => `${h}: ${t.replace(/\s?\{\w+\}/g, '')}`).join('\n')

async function copyBrief(d: [string, string][]) {
  try {
    await navigator.clipboard.writeText(`${ACCT.name} account brief\n${briefText(d)}`)
    toast('Brief copied')
  } catch {
    toast.error("Couldn't copy the brief", { description: 'The browser blocked clipboard access.' })
  }
}

export function Brief() {
  const w = useWidget(() => BRIEF)
  const ready = w.status === 'ready' && !!w.data?.length
  return (
    <section aria-labelledby="h-brief">
      <Card className="gap-0 py-0">
      <BlockHeader icon={FileText} title={<span id="h-brief">Account brief</span>} sub="From monthly summaries" actions={ready && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Copy brief" onClick={() => copyBrief(w.data!)}
              className="hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
              <Copy />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy brief</TooltipContent>
        </Tooltip>
      )} />
      <div className="px-5 py-2">
        <WidgetBody w={w} what="the account brief" isEmpty={d => d.length === 0} empty={{ sub: 'No summary has been written for this account yet.' }}
          skeleton={<div className="grid gap-5 md:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-full" /></div>)}</div>}>
          {d => (
            <dl className="divide-y divide-hairline">
              {/* the next step already leads the header, so the brief keeps the context around it */}
              {d.filter(([h]) => h !== 'Next').map(([h, t]) => (
                <div key={h} className="grid gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-sm text-muted-foreground">{h}</dt>
                  <dd className="text-sm leading-relaxed"><Cited text={t} /></dd>
                </div>
              ))}
            </dl>
          )}
        </WidgetBody>
      </div>
      </Card>
    </section>
  )
}

const listSkeleton = (n: number) => (
  <ul className="pt-1">{Array.from({ length: n }, (_, i) => (
    <li key={i} className="flex min-h-12 items-center gap-3"><Skeleton className="size-7 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></li>
  ))}</ul>
)

/* ---------- going well / needs attention ---------- */
export function ListCard({ title, items, tone, onArea }: {
  title: string; items: ListItem[]; tone: 'good' | 'bad'; onArea: (k: AreaKey) => void
}) {
  const w = useWidget(() => items)
  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={tone === 'good' ? CircleCheck : CircleAlert} title={title} count={w.status === 'ready' ? w.data!.length : undefined} />
      <div className="px-5 py-2">
      <WidgetBody w={w} what={title.toLowerCase()} isEmpty={d => d.length === 0}
        empty={{ title: tone === 'good' ? 'Nothing stands out yet' : 'Nothing needs attention' }}
        skeleton={listSkeleton(3)}>
        {d => (
          <ul>
            {d.map(([h, , m, area]) => (
              <ListRow key={h} icon={AREA_ICON[area]} title={h} meta={`${m} · ${AREA_NAME[area]}`}
                onClick={() => onArea(area)} label={`${h}. ${m}. Open ${AREA_NAME[area]} inputs`} />
            ))}
          </ul>
        )}
      </WidgetBody>
      </div>
    </Card>
  )
}

/* ---------- recent activity ---------- */
const CH_ICON: Record<Channel, LucideIcon> = {
  meeting: CalendarDays, email: Mail, ticket: LifeBuoy, record: HeartPulse, file: FileText, ai: StickyNote,
  teams: MessageSquare, call: Phone, note: StickyNote,
}

function RecentActivity() {
  const range = useRange()
  const w = useWidget(() => {
    const from = rangeStart(range)
    // the header already states the health cap; engagement snapshots carry no content
    const all = activityItems().filter(i => i.date <= TODAY && (!from || i.date >= from) && !/Engagement snapshot/.test(i.source) && i.kind !== 'flag')
      .sort((a, b) => +b.date - +a.date)
    return { top: all.slice(0, 5), all, total: activityTotal() }
  }, [range.id])
  // the open item lives in the URL (?sheet=activity:<id>); prev/next steps through the five rows shown
  const sheet = useSheet()
  const d = w.status === 'ready' ? w.data! : null
  const open = sheet?.type === 'activity' && d ? d.all.find(i => i.id === sheet.id) ?? null : null
  const pager = d ? listPager(d.top, open, i => i.id, i => openSheet('activity', i.id, { replace: true }), 'activity') : undefined
  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={Activity} title="Recent activity" actions={w.status === 'ready' && w.data!.total > 0 && (
        <NavLink onClick={() => showTab('activity')}>View all {w.data!.total}</NavLink>
      )} />
      <div className="px-5 py-2">
      <WidgetBody w={w} what="recent activity" isEmpty={d => d.all.length === 0}
        empty={range.days == null ? { title: 'No activity yet' } : { title: `No activity in the ${range.label.toLowerCase()}`, sub: 'Pick a longer date range to see older activity.' }} skeleton={listSkeleton(5)}>
        {d => (
          <ul>
            {d.top.map(i => (
              <ListRow key={i.id} icon={CH_ICON[i.channel]} title={i.title}
                meta={<><DateText date={i.date} />{i.who[0] ? ` · ${i.who[0]}` : ''}</>}
                status={ACT_STATUS[i.kind]} onClick={() => openSheet('activity', i.id)} label={`${i.title}, ${fmtWhen(i.date)}. Open details`} />
            ))}
          </ul>
        )}
      </WidgetBody>
      </div>
      <ActivitySheet item={open} onOpenChange={sheetOpenChange} pager={pager} />
    </Card>
  )
}

/* ---------- order forms (renderCLM) ---------- */
const CLM_ICON = [FileText, FileSignature, FileX]
// status wording by tone: a bad commitment is "Unsigned", a good one "Signed"
const CLM_STATUS = { good: 'Signed', bad: 'Unsigned', warn: 'Pending' } as const

export function OrderForms({ onArea }: { onArea: (k: AreaKey) => void }) {
  const w = useWidget(() => CLM)
  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={FileSignature} title="Order forms" />
      <div className="px-5 py-2">
      <WidgetBody w={w} what="order forms" isEmpty={d => d.length === 0} empty={{ title: 'No order forms' }} skeleton={listSkeleton(3)}>
        {d => (
          <ul>
            {d.map(([l, v, detail, area, tone], i) => (
              <ListRow key={l} icon={CLM_ICON[i] ?? FileText} title={v} meta={detail ? `${l} · ${detail}` : l}
                status={tone ? { tone, label: CLM_STATUS[tone] } : undefined}
                onClick={() => onArea(area ?? 'commercial')}
                label={`${l}: ${v}. Open ${AREA_NAME[area ?? 'commercial']} inputs`} />
            ))}
          </ul>
        )}
      </WidgetBody>
      </div>
    </Card>
  )
}
