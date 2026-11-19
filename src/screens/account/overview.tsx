/* Summary tab: account brief, strengths and risks, renewal runway, recent activity, order forms.
   Ported from renderSummary, openRef, renderCLM, renderRunway and the #s-summary markup. */
import { useState } from 'react'
import { Calendar, ChevronRight, FileText, Mail, MessageSquare, Phone, StickyNote, Ticket, TrendingDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { taPeople } from '@/data/legacy'
import {
  activityItems, AREA_NAME, evidence, TODAY, ymLabel, type ActivityItem, type AreaKey, type Channel,
} from './facts'
import { EvidenceRow, SectionHead, showTab, useCollapse, useWidget, WidgetBody } from './overview/bits'
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

function Footnote({ k }: { k: string }) {
  const n = REF_ORDER.indexOf(k) + 1
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Source ${n}`}
          className="ml-0.5 inline-grid h-4 min-w-4 -translate-y-0.5 place-items-center rounded-[5px] border border-border px-1 align-middle text-[10px] tabular-nums text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:border-signal data-[state=open]:text-signal">
          {n}
        </button>
      </PopoverTrigger>
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
      <p className="leading-relaxed">{r.text}</p>
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
function Brief() {
  const w = useWidget(() => BRIEF)
  return (
    <section aria-labelledby="h-brief">
      <SectionHead id="h-brief" title="Account brief" />
      <Card className="px-5 py-5">
        <WidgetBody w={w} what="the account brief" isEmpty={d => d.length === 0} empty={{ sub: 'No summary has been written for this account yet.' }}
          skeleton={<div className="grid gap-6 md:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>)}</div>}>
          {d => (
            <>
              <div className="grid gap-x-8 gap-y-5 md:grid-cols-3 md:divide-x md:divide-hairline">
                {d.map(([h, t]) => (
                  <div key={h} className="min-w-0 md:pl-8 md:first:pl-0">
                    <h3 className="mb-1.5 text-sm font-medium">{h}</h3>
                    <p className="leading-relaxed"><Cited text={t} /></p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">AI summary. Select a number for its source.</p>
            </>
          )}
        </WidgetBody>
      </Card>
    </section>
  )
}

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
        skeleton={<div className="space-y-4 pt-2">{[0, 1, 2].map(i => <div key={i} className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-full" /></div>)}</div>}>
        {d => (
          <ul className="divide-y divide-hairline">
            {d.map(([h, t, m, area]) => (
              <li key={h} className="flex gap-3 py-3.5">
                <span className={cn('mt-[7px] size-1.5 shrink-0 rounded-full', tone === 'good' ? 'bg-good' : 'bg-bad')} aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-medium">{h}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{m}</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground"><Cited text={t} /></p>
                  <Button variant="outline" size="xs" onClick={() => onArea(area)}>
                    {AREA_NAME[area]} inputs <ChevronRight />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WidgetBody>
    </Card>
  )
}

/* ---------- recent activity ---------- */
const CH_ICON: Record<Channel, LucideIcon> = {
  meeting: Calendar, email: Mail, ticket: Ticket, record: TrendingDown, file: FileText, ai: StickyNote,
  teams: MessageSquare, call: Phone, note: StickyNote,
}
const CH_NAME: Record<Channel, string> = {
  email: 'Email', meeting: 'Meeting', teams: 'Teams', call: 'Call', ticket: 'Ticket', record: 'AHI record',
  file: 'Order form', ai: 'AI insight', note: 'Summary note',
}
const CAT: Partial<Record<ActivityItem['kind'], [string, string]>> = {
  neg: ['Risk', 'bg-bad'], flag: ['Risk', 'bg-bad'], pos: ['Positive', 'bg-good'], goal: ['Target', 'bg-muted-foreground'], end: ['Renewal', 'bg-muted-foreground'],
}

function RecentActivity() {
  const w = useWidget(() => {
    // the header already states the health cap; engagement snapshots carry no content
    const all = activityItems().filter(i => i.date <= TODAY && !/Engagement snapshot/.test(i.source) && i.kind !== 'flag')
      .sort((a, b) => +b.date - +a.date)
    return { top: all.slice(0, 4), total: all.length }
  })
  return (
    <Card className="gap-0 px-5 py-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Recent activity</h3>
      </div>
      <WidgetBody w={w} what="recent activity" isEmpty={d => d.total === 0} empty={{ title: 'No activity yet' }}
        skeleton={<div className="space-y-4 pt-2">{[0, 1, 2, 3].map(i => <div key={i} className="flex gap-3"><Skeleton className="size-4" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /></div></div>)}</div>}>
        {d => (
          <>
            <ul className="divide-y divide-hairline">
              {d.top.map(i => {
                const Ic = CH_ICON[i.channel], cat = CAT[i.kind]
                const desc = i.key && i.desc === i.source + '.' ? i.source : i.desc
                return (
                  <li key={i.id} className="flex gap-3 py-3">
                    <Ic className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label={CH_NAME[i.channel]} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {i.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="font-medium">{i.title}</span>
                        {i.who[0] && <span className="text-xs text-muted-foreground">{i.who[0]}</span>}
                      </div>
                      {desc !== i.title && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{desc}</p>}
                    </div>
                    {cat && (
                      <span className="flex shrink-0 items-center gap-1.5 self-start text-xs text-muted-foreground">
                        <span className={cn('size-1.5 rounded-full', cat[1])} aria-hidden="true" />{cat[0]}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <Button variant="outline" size="sm" className="mt-2 self-start" onClick={() => showTab('activity')}>
              View all {d.total} in Activity <ChevronRight />
            </Button>
          </>
        )}
      </WidgetBody>
    </Card>
  )
}

/* ---------- order forms (renderCLM) ---------- */
function OrderForms({ onArea }: { onArea: (k: AreaKey) => void }) {
  const w = useWidget(() => CLM)
  return (
    <Card className="gap-0 px-5 py-4">
      <h3 className="mb-3 text-sm font-medium">Order forms</h3>
      <WidgetBody w={w} what="order forms" isEmpty={d => d.length === 0} empty={{ title: 'No order forms' }}
        skeleton={<div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}>
        {d => (
          <div className="grid gap-2">
            {d.map(([l, v, detail, area]) => {
              const inner = (
                <>
                  <span className="text-xs text-muted-foreground">{l}</span>
                  <span className="text-lg tracking-tight">{v}</span>
                  <span className="text-xs text-muted-foreground">{detail}</span>
                </>
              )
              const cls = 'grid gap-0.5 rounded-lg border border-hairline px-3.5 py-2.5 text-left'
              return area
                ? (
                  <button key={l} type="button" onClick={() => onArea(area)} aria-label={`${l}: ${v}. Open ${AREA_NAME[area]} inputs`}
                    className={cn(cls, 'group relative transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50')}>
                    {inner}
                    <ChevronRight className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                )
                : <div key={l} className={cls}>{inner}</div>
            })}
          </div>
        )}
      </WidgetBody>
    </Card>
  )
}
