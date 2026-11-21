import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Empty, Fact, SectionTitle, SheetBody } from '@/components/page'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RecordSheet, RecordSheetBody, RecordSheetHeader, listPager, useKept } from '@/components/app/record-sheet'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState, useLoad } from './activity/shared'
import { loadIntel, type Theme } from './intelligence/model'
import { loadBase, stakeRows } from './stakeholders/model'
import { PersonSheet } from './stakeholders/person-sheet'
import { useRoles } from './stakeholders/store'
import { ACCT } from './facts'

export function IntelligenceTab() {
  const load = useLoad(() => ({ intel: loadIntel(), base: loadBase() }), undefined, 'intelligence')
  return (
    <div>
      <SectionTitle title="Public news" />
      {load.status === 'loading' && <NewsSkeleton />}
      {load.status === 'error' && <ErrorState what="news" onRetry={load.retry} />}
      {load.status === 'ready' && <News themes={load.data.intel.news} base={load.data.base} />}
    </div>
  )
}

const relLabel = (n: number) => (n >= 70 ? 'High' : n >= 50 ? 'Medium' : 'Low')

/* ---- external: public news themes; a row opens the theme's dated events and why it matters ---- */
function News({ themes, base }: { themes: Theme[]; base: ReturnType<typeof loadBase> }) {
  const roles = useRoles()
  const rows = useMemo(() => stakeRows(base, roles), [base, roles])
  const max = useMemo(() => Math.max(1, ...rows.flatMap(r => r.months)), [rows])
  // both sheets live in the URL: ?sheet=news:<theme title> and ?sheet=person:<key>; prev/next walks the themes
  const sheet = useSheet()
  const live = sheet?.type === 'news' ? themes.find(t => t.title === sheet.id) ?? null : null
  const open = useKept(live)
  const person = sheet?.type === 'person' ? rows.find(r => r.key === sheet.id) ?? null : null
  const pager = listPager(themes, live, t => t.title, t => openSheet('news', t.title, { replace: true }), 'theme')
  const news = base.news[0]
  const ranked = themes.filter(t => t.relevance != null).sort((a, b) => b.relevance! - a.relevance!)
  if (!ranked.length) return <Empty title="No news found" sub={`Nothing public about ${ACCT.name} this year.`} />
  return (
    <div className="grid gap-3">
      <ul className="grid gap-3 md:grid-cols-2">
        {ranked.map(t => {
          const latest = t.events.find(e => e.date) ?? t.events[0]
          const r = t.relevance!
          return (
            <li key={t.title}>
              <button type="button" data-slot="card" onClick={() => openSheet('news', t.title)} aria-haspopup="dialog" aria-label={`${t.title}, ${relLabel(r).toLowerCase()} relevance. Open`}
                className="group flex h-full w-full flex-col gap-3 rounded-xl bg-card p-5 shadow-(--shadow-card) transition-shadow hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_14%,transparent),0_4px_14px_rgb(11_24_33/0.07)] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <span className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm font-medium">{t.title}</span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground" title={`Relevance to the renewal: ${r} of 100`}>
                    <span className={cn('size-1.5 rounded-full', r >= 70 ? 'bg-bad-fill' : r >= 50 ? 'bg-warn-fill' : 'bg-muted-foreground/50')} aria-hidden="true" />{relLabel(r)} relevance
                  </span>
                </span>
                {t.why && <span className="text-sm leading-relaxed text-pretty">{t.why}</span>}
                {latest && (
                  <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {latest.date && <span className="tabular-nums text-foreground">{latest.date.replace(', 2026', '')} · </span>}{latest.text}
                  </span>
                )}
                {t.title === 'Executive Leadership' && news && (
                  <span role="link" tabIndex={0} onClick={e => { e.stopPropagation(); openSheet('person', 'news:' + news.name) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); openSheet('person', 'news:' + news.name) } }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50">
                    <span className="text-muted-foreground">Not in contacts:</span><span className="font-medium">{news.name}</span><ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </span>
                )}
                <span className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                  {t.events.length} event{t.events.length === 1 ? '' : 's'}<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <RecordSheet open={!!live} onOpenChange={sheetOpenChange} size="md" pager={pager} view={open?.title}>
          {open && (
            <>
              <RecordSheetHeader eyebrow="Public news" title={open.title}
                meta={(n => `${n} dated event${n === 1 ? '' : 's'}, 2026`)(open.events.filter(e => e.date).length)} />
              <RecordSheetBody>
                <SheetBody facts={
                  <>
                    <Fact label="Relevance to the renewal">
                      {open.relevance == null ? <span className="text-muted-foreground">No events</span> : (
                        <span>{relLabel(open.relevance)} <span className="tabular-nums text-muted-foreground">· {open.relevance} of 100</span></span>
                      )}
                    </Fact>
                    {open.title === 'Executive Leadership' && news && (
                      <Fact label="Suggested contact">
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => openSheet('person', 'news:' + news.name, { replace: true })}>
                          {news.name}<ChevronRight />
                        </Button>
                      </Fact>
                    )}
                  </>
                }>
                  {open.why && (
                    <section className="grid gap-1.5">
                      <h3 className="text-xs text-muted-foreground">Why It Matters</h3>
                      <p className="leading-relaxed text-pretty">{open.why}</p>
                    </section>
                  )}
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
                </SheetBody>
              </RecordSheetBody>
            </>
          )}
      </RecordSheet>
      <PersonSheet row={person} ev={base.ev} months={base.months} max={max} onOpenChange={sheetOpenChange} />
    </div>
  )
}

function NewsSkeleton() {
  return (
    <ul className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading news">
      {[0, 1, 2, 3].map(i => (
        <li key={i}>
          <div data-slot="card" className="group flex h-full w-full flex-col gap-3 rounded-xl bg-card p-5 shadow-(--shadow-card)">
            <Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-16" />
          </div>
        </li>
      ))}
    </ul>
  )
}
