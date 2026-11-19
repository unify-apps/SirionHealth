import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleSlash, Newspaper } from 'lucide-react'
import { BlockHeader, Empty, Fact, ListColumns, ListRow, Meter, MeterValue, SectionTitle, SheetBody, sheetHeaderCls } from '@/components/page'
import { BAND_LABEL, bandOf } from '@/components/health'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState, useLoad } from './activity/shared'
import { AREA_ICON } from './health/parts'
import type { AreaKey } from './health/model'
import { loadIntel, type Input, type IntelData, type Theme } from './intelligence/model'
import { loadBase, stakeRows } from './stakeholders/model'
import { PersonSheet } from './stakeholders/person-sheet'
import { useRoles } from './stakeholders/store'

export function IntelligenceTab() {
  const load = useLoad(() => ({ intel: loadIntel(), base: loadBase() }), undefined, 'intelligence')
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
      <div className="grid gap-4 lg:grid-cols-2">
        <InputList title="Strongest inputs" icon={ArrowUpRight} items={data.strongest} />
        <InputList title="Weakest inputs" icon={ArrowDownRight} items={data.weakest} />
      </div>
      <Card className="gap-0 py-0">
        <BlockHeader icon={CircleSlash} title="Not scored" count={data.unscored.length} />
        {data.unscored.length ? (
          <ListColumns label="Inputs with no score" className="px-2 py-2">
            {data.unscored.map(u => (
              <li key={u.area + u.name}>
                <ListRow icon={AREA_ICON[u.area as AreaKey]} title={u.name} meta={`${u.areaName} · ${u.note}`}
                  right={<MeterValue value={null} label={`${u.name} score`} />} />
              </li>
            ))}
          </ListColumns>
        ) : <p className="p-5 text-muted-foreground">Every input has a score.</p>}
      </Card>
    </div>
  )
}

function InputList({ title, icon, items }: { title: string; icon: typeof ArrowUpRight; items: Input[] }) {
  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={icon} title={title} count={items.length} />
      {items.length ? (
        <ul className="grid gap-1 px-2 py-2">
          {items.map(x => {
            const b = bandOf(x.v)
            return (
              <li key={x.area + x.name}>
                <ListRow icon={AREA_ICON[x.area as AreaKey]} title={x.name} meta={`${x.areaName} · ${x.note}`}
                  right={<MeterValue value={x.v} tone={b === 'none' ? undefined : b} label={`${x.name} score`} tip={`${x.name}: ${x.v} of 100, ${BAND_LABEL[b].toLowerCase()}`} />} />
              </li>
            )
          })}
        </ul>
      ) : <Empty title="No scored inputs" className="m-5" />}
    </Card>
  )
}

/* ---- external: public news themes; a row opens the theme's dated events and why it matters ---- */
function News({ themes, base }: { themes: Theme[]; base: ReturnType<typeof loadBase> }) {
  const roles = useRoles()
  const rows = useMemo(() => stakeRows(base, roles), [base, roles])
  const max = useMemo(() => Math.max(1, ...rows.flatMap(r => r.months)), [rows])
  const [key, setKey] = useState<string | null>(null)
  const [open, setOpen] = useState<Theme | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const news = base.news[0]
  if (!themes.length) return <Empty title="No news found" sub="Nothing public about Transamerica or Aegon this year." />
  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={Newspaper} title="Public news" count={themes.length} sub="Relevance to the renewal, 0 to 100" />
      <ul className="grid gap-1 px-2 py-2">
        {themes.map(t => {
          const latest = t.events.find(e => e.date) ?? t.events[0]
          return (
            <li key={t.title}>
              <ListRow icon={Newspaper} title={t.title} onClick={() => { setOpen(t); setSheetOpen(true) }} aria-haspopup="dialog"
                aria-label={`${t.title}${t.relevance == null ? ', no events' : `, relevance ${t.relevance} of 100`}. Open`}
                meta={latest ? <>{latest.date && <span className="tabular-nums">{latest.date.replace(', 2026', '')} · </span>}{latest.text}</> : 'No events'}
                right={t.relevance == null ? <MeterValue value={null} display={<span className="text-xs font-normal text-muted-foreground">None</span>} /> : (
                  <MeterValue value={t.relevance} label={`${t.title} relevance`} tip={`Relevance to the renewal: ${t.relevance} of 100`} />
                )} />
            </li>
          )
        })}
      </ul>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-2xl">
          {open && (
            <>
              <SheetHeader className={sheetHeaderCls}>
                <SheetTitle className="text-lg font-normal">{open.title}</SheetTitle>
                <SheetDescription>{open.events.filter(e => e.date).length} dated events, 2026</SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <SheetBody facts={
                  <>
                    <Fact label="Relevance to the renewal">
                      {open.relevance == null ? <span className="text-muted-foreground">No events</span> : (
                        <span className="flex items-center gap-2">
                          <Meter value={open.relevance} label="Relevance" tip={`${open.relevance} of 100`} className="w-24" />
                          <span className="tabular-nums">{open.relevance}</span>
                        </span>
                      )}
                    </Fact>
                    {open.title === 'Executive leadership' && news && (
                      <Fact label="Suggested contact">
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => { setSheetOpen(false); setKey('news:' + news.name) }}>
                          {news.name}<ChevronRight />
                        </Button>
                      </Fact>
                    )}
                    <Fact label="Source"><span className="text-muted-foreground">Public news</span></Fact>
                  </>
                }>
                  <section className="grid gap-2">
                    <h3 className="text-xs text-muted-foreground">Events</h3>
                    <ul className="grid divide-y divide-hairline">
                      {open.events.map((e, i) => (
                        <li key={i} className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 py-2 first:pt-0">
                          <span className="pt-px text-xs tabular-nums text-muted-foreground">{e.date ?? 'Undated'}</span>
                          <span className="max-w-[65ch] text-pretty">{e.text}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  {open.why && (
                    <section className="grid gap-1.5">
                      <h3 className="text-xs text-muted-foreground">Why it matters</h3>
                      <p className="leading-relaxed text-pretty">{open.why}</p>
                    </section>
                  )}
                </SheetBody>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
      <PersonSheet row={rows.find(r => r.key === key) ?? null} ev={base.ev} months={base.months} max={max} onOpenChange={o => { if (!o) setKey(null) }} />
    </Card>
  )
}

const RowSkel = () => (
  <div className="flex min-h-13 items-center gap-3 px-2 py-2">
    <Skeleton className="size-8 rounded-full" />
    <div className="grid flex-1 gap-1.5"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-3 w-3/5" /></div>
    <Skeleton className="ml-3 hidden h-1.5 w-[120px] sm:block" /><Skeleton className="h-3.5 w-10" />
  </div>
)
const HeadSkel = () => <div className="flex min-h-12 items-center gap-2 border-b border-hairline px-5"><Skeleton className="size-4" /><Skeleton className="h-4 w-32" /></div>
function InternalSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading inputs">
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map(c => (
          <Card key={c} className="gap-0 py-0">
            <HeadSkel />
            <div className="grid gap-1 px-2 py-2">{[0, 1, 2, 3].map(i => <RowSkel key={i} />)}</div>
          </Card>
        ))}
      </div>
      <Card className="gap-0 py-0"><HeadSkel /><div className="grid gap-x-8 gap-y-1 px-2 py-2 md:grid-cols-2">{[0, 1, 2, 3].map(i => <RowSkel key={i} />)}</div></Card>
    </div>
  )
}
function NewsSkeleton() {
  return (
    <Card className="gap-0 py-0" aria-busy="true" aria-label="Loading news">
      <HeadSkel />
      <div className="grid gap-1 px-2 py-2">{[0, 1, 2, 3, 4].map(i => <RowSkel key={i} />)}</div>
    </Card>
  )
}
