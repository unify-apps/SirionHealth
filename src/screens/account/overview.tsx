/* Summary tab: account brief, strengths and risks, renewal runway, recent activity, order forms.
   Ported from renderSummary, openRef, renderCLM, renderRunway and the #s-summary markup. */
import { useState } from 'react'
import {
  CalendarDays, ChevronRight, Copy, FileSignature, FileText, FileX, HeartPulse, LifeBuoy, Mail, MessageSquare, Phone, StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { taPeople } from '@/data/legacy'
import {
  activityItems, AREA_NAME, evidence, fmtD, TODAY, ymLabel, type ActivityItem, type AreaKey, type Channel,
} from './facts'
import { AREA_ICON, EvidenceRow, Glossed, ListRow, SectionHead, showTab, useCollapse, useWidget, WidgetBody } from './overview/bits'
import { ACT_STATUS, ActivitySheet } from './overview/activity-sheet'
import { ATTN, BRIEF, CLM, REF_ORDER, SUM_REFS, WELL, type ListItem } from './overview/content'
import { AreaSheet } from './overview/area-sheet'
import { RunwayChart } from './overview/runway-chart'

export function OverviewTab() {
  const [area, setArea] = useState<AreaKey | null>(null)
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

      <section id="runway" aria-labelledby="h-runway" className="mt-8 scroll-mt-28">
        <SectionHead id="h-runway" title="Renewal runway"
          tip="Monthly health since May 2025, when the model flagged it, and the events around it. Select an event for its evidence." />
        <Card className="px-4 pt-5 pb-4 sm:px-5"><RunwayChart /></Card>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RecentActivity />
        <OrderForms onArea={setArea} />
      </div>

      <AreaSheet area={area} onOpenChange={o => !o && setArea(null)} />
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
  return !r ? 'Source' : r.kind === 'rec' ? r.label : r.kind === 'ev' ? 'Monthly summary (AI)' : 'Suggested role (AI)'
}

function Footnote({ k }: { k: string }) {
  const n = REF_ORDER.indexOf(k) + 1
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Source ${n}: ${refName(k)}`}
              className="ml-0.5 inline-grid h-4 min-w-4 -translate-y-0.5 place-items-center rounded-[5px] border border-border px-1 align-middle text-[10px] tabular-nums text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-signal data-[state=open]:text-signal">
              {n}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{refName(k)}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-1.5 p-3">
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
        <p className="text-xs text-muted-foreground">Monthly summary (AI)</p>
        {ev.length ? <div className="divide-y divide-hairline">{ev.map(e => <EvidenceRow key={e.text} e={e} />)}</div> : <p>No data</p>}
      </>
    )
  }
  const p = (taPeople() as { email: string; name: string; suggested: string | null; basis: string | null; mentions: number; lastMentioned: string | null }[])
    .find(x => x.email === r.email)
  if (!p) return <p className="text-muted-foreground">No data</p>
  return (
    <>
      <p className="text-xs text-muted-foreground">Suggested role (AI)</p>
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
    await navigator.clipboard.writeText(`TransAmerica account brief\n${briefText(d)}`)
    toast('Brief copied')
  } catch {
    toast.error("Couldn't copy the brief", { description: 'The browser blocked clipboard access.' })
  }
}

function Brief() {
  const w = useWidget(() => BRIEF)
  const ready = w.status === 'ready' && !!w.data?.length
  return (
    <section aria-labelledby="h-brief">
      <SectionHead id="h-brief" title="Account brief" actions={ready && (
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
      <Card className="px-5 py-4">
        <WidgetBody w={w} what="the account brief" isEmpty={d => d.length === 0} empty={{ sub: 'No summary has been written for this account yet.' }}
          skeleton={<div className="grid gap-5 md:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-full" /></div>)}</div>}>
          {d => (
            <>
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-3 md:divide-x md:divide-hairline">
                {d.map(([h, t]) => (
                  <div key={h} className="min-w-0 md:pl-8 md:first:pl-0">
                    <h3 className="mb-1 text-xs text-muted-foreground">{h}</h3>
                    <p className="leading-relaxed"><Cited text={t} /></p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">From monthly summaries</p>
            </>
          )}
        </WidgetBody>
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
function ListCard({ title, items, tone, onArea }: {
  title: string; items: ListItem[]; tone: 'good' | 'bad'; onArea: (k: AreaKey) => void
}) {
  const w = useWidget(() => items)
  return (
    <Card className="gap-0 px-5 py-4">
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      <WidgetBody w={w} what={title.toLowerCase()} isEmpty={d => d.length === 0}
        empty={{ title: tone === 'good' ? 'Nothing stands out yet' : 'Nothing needs attention' }}
        skeleton={listSkeleton(3)}>
        {d => (
          <ul>
            {d.map(([h, , m, area]) => (
              <ListRow key={h} icon={AREA_ICON[area]} title={h} meta={`${m} · ${AREA_NAME[area]}`}
                status={{ tone, label: tone === 'good' ? 'Strength' : 'Risk' }}
                onClick={() => onArea(area)} label={`${h}. ${m}. Open ${AREA_NAME[area]} inputs`} />
            ))}
          </ul>
        )}
      </WidgetBody>
    </Card>
  )
}

/* ---------- recent activity ---------- */
const CH_ICON: Record<Channel, LucideIcon> = {
  meeting: CalendarDays, email: Mail, ticket: LifeBuoy, record: HeartPulse, file: FileText, ai: StickyNote,
  teams: MessageSquare, call: Phone, note: StickyNote,
}

function RecentActivity() {
  const [open, setOpen] = useState<ActivityItem | null>(null)
  const w = useWidget(() => {
    // the header already states the health cap; engagement snapshots carry no content
    const all = activityItems().filter(i => i.date <= TODAY && !/Engagement snapshot/.test(i.source) && i.kind !== 'flag')
      .sort((a, b) => +b.date - +a.date)
    return { top: all.slice(0, 5), total: all.length }
  })
  return (
    <Card className="gap-0 px-5 py-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Recent activity</h3>
        {w.status === 'ready' && w.data!.total > 0 && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => showTab('activity')}>
            View all {w.data!.total} <ChevronRight />
          </Button>
        )}
      </div>
      <WidgetBody w={w} what="recent activity" isEmpty={d => d.total === 0} empty={{ title: 'No activity yet' }} skeleton={listSkeleton(5)}>
        {d => (
          <ul>
            {d.top.map(i => (
              <ListRow key={i.id} icon={CH_ICON[i.channel]} title={i.title}
                meta={[fmtD(i.date), i.who[0]].filter(Boolean).join(' · ')}
                status={ACT_STATUS[i.kind]} onClick={() => setOpen(i)} label={`${i.title}, ${fmtD(i.date)}. Open details`} />
            ))}
          </ul>
        )}
      </WidgetBody>
      <ActivitySheet item={open} onOpenChange={o => !o && setOpen(null)} />
    </Card>
  )
}

/* ---------- order forms (renderCLM) ---------- */
const CLM_ICON = [FileText, FileSignature, FileX]

function OrderForms({ onArea }: { onArea: (k: AreaKey) => void }) {
  const w = useWidget(() => CLM)
  return (
    <Card className="gap-0 px-5 py-4">
      <h3 className="mb-1 text-sm font-medium">Order forms</h3>
      <WidgetBody w={w} what="order forms" isEmpty={d => d.length === 0} empty={{ title: 'No order forms' }} skeleton={listSkeleton(3)}>
        {d => (
          <ul>
            {d.map(([l, v, detail, area, tone], i) => (
              <ListRow key={l} icon={CLM_ICON[i] ?? FileText} title={v} meta={detail ? `${l} · ${detail}` : l}
                status={tone ? { tone, label: tone === 'bad' ? 'Open' : 'Done' } : undefined}
                onClick={area ? () => onArea(area) : undefined}
                label={area ? `${l}: ${v}. Open ${AREA_NAME[area]} inputs` : undefined} />
            ))}
          </ul>
        )}
      </WidgetBody>
    </Card>
  )
}
