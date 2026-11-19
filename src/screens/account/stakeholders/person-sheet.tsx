import { useState } from 'react'
import { AlertTriangle, Check, CircleCheck, Info, Mail, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { fmtDY, ymLabel } from '../activity/shared'
import type { Evidence, GapLevel, StakeRow } from './model'
import { Avatar, EngagementPill, MonthStrip, RoleMenu, RoleTag, TonePill } from './parts'
import { roleStore } from './store'

export const GAP_ICON: Record<GapLevel, { I: typeof Info; cls: string }> = {
  ok: { I: CircleCheck, cls: 'text-good' }, warn: { I: AlertTriangle, cls: 'text-warn' }, info: { I: Info, cls: 'text-muted-foreground' }, none: { I: Info, cls: 'text-muted-foreground' },
}

const SOURCE_TEXT: Record<StakeRow['source'], string> = {
  mine: 'set here', tagged: 'tagged in AHI', confirmed: 'confirmed', inferred: 'inferred from the monthly summaries, not confirmed', news: 'inferred from public news, not confirmed', none: '',
}

/** One statement from a monthly summary, as a quote with its month, tone and tickets. */
export function Statement({ e }: { e: Evidence }) {
  return (
    <li className="grid grid-cols-[8px_minmax(0,1fr)] gap-x-2.5 py-2.5 first:pt-0">
      <span aria-hidden="true" className={cn('mt-1.5 size-2 rounded-full', e.kind === 'pos' ? 'bg-good' : 'bg-bad')} />
      <div className="min-w-0">
        <p className="leading-relaxed text-pretty">{e.text}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{e.date ? fmtDY(e.date) : ymLabel(e.ym)}</span>
          <span>{e.kind === 'pos' ? 'Positive' : 'Negative'}</span>
          {e.tickets.map(t => <span key={t} className="inline-flex items-center gap-1"><Ticket className="size-3" />{t}</span>)}
        </p>
      </div>
    </li>
  )
}

export function PersonSheet({ row, ev, months, max, onOpenChange }: {
  row: StakeRow | null; ev: Evidence[]; months: string[]; max: number; onOpenChange: (open: boolean) => void
}) {
  const [all, setAll] = useState(false)
  const said = row ? ev.filter(e => e.who.includes(row.name)).sort((a, b) => b.ym.localeCompare(a.ym) || +(b.date ?? 0) - +(a.date ?? 0)) : []
  const shown = all ? said : said.slice(0, 6)
  const G = row ? GAP_ICON[row.gap[0]] : null
  return (
    <Sheet open={!!row} onOpenChange={o => { if (!o) setAll(false); onOpenChange(o) }}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        {row && G && (
          <>
            <SheetHeader className="border-b border-hairline p-5 pr-12">
              <div className="flex items-center gap-3">
                <Avatar name={row.name} className="size-10" />
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-normal">{row.name}</SheetTitle>
                  <SheetDescription>{[row.title, row.org].filter(Boolean).join(' · ') || 'No title on the contact card'}</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid gap-6 p-5">
                <section className="grid gap-2">
                  <h3 className="flex items-center gap-2 text-xs text-muted-foreground">Role{SOURCE_TEXT[row.source] && <span>· {SOURCE_TEXT[row.source]}</span>}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleTag row={row} />
                    <RoleMenu row={row} align="start">
                      <Button variant="outline" size="sm">Change role</Button>
                    </RoleMenu>
                    {(row.source === 'inferred' || row.source === 'news') && (
                      <Button size="sm" onClick={() => roleStore.confirm(row.key)}><Check />Confirm role</Button>
                    )}
                  </div>
                  {row.basis && <p className="leading-relaxed text-pretty">{row.basis}{row.confidence ? ` (${row.confidence} confidence)` : ''}</p>}
                  {!row.basis && row.source === 'tagged' && <p className="text-muted-foreground">Tagged by hand in AHI.</p>}
                </section>

                <section className="grid gap-2">
                  <h3 className="text-xs text-muted-foreground">What to do</h3>
                  <p className="flex items-start gap-2"><G.I className={cn('mt-0.5 size-4 shrink-0', G.cls)} aria-hidden="true" />{row.gap[1]}</p>
                </section>

                <section className="grid gap-3">
                  <h3 className="text-xs text-muted-foreground">Contact</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <EngagementPill eng={row.eng} days={row.days} />
                    <TonePill tone={row.tone} pos={row.pos} neg={row.neg} />
                  </div>
                  <p>
                    {row.last ? `Last named ${fmtDY(row.last)} (${row.days} days ago), in ${row.mentions} monthly summar${row.mentions === 1 ? 'y' : 'ies'}.`
                      : row.news ? `Source: ${row.news.source}. Not in AHI's contacts.` : 'Never named in a monthly summary.'}
                    {row.sources.length ? ` Seen in ${row.sources.join(', ')}.` : ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <MonthStrip months={row.months} labels={months} max={max} />
                    <span className="text-xs text-muted-foreground">Mentions per month, last 18 months</span>
                  </div>
                  {row.email && (
                    <Button variant="outline" size="sm" className="w-fit" asChild>
                      <a href={`mailto:${row.email}`}><Mail />{row.email}</a>
                    </Button>
                  )}
                </section>

                {!row.news && (
                  <section className="grid gap-2">
                    <h3 className="flex items-center gap-2 text-xs text-muted-foreground">
                      Statements naming {row.name.split(' ')[0]} · from monthly summaries
                    </h3>
                    {said.length ? (
                      <>
                        <ul className="divide-y divide-hairline">{shown.map((e, i) => <Statement key={i} e={e} />)}</ul>
                        {said.length > 6 && (
                          <Button variant="outline" size="sm" className="w-fit" onClick={() => setAll(v => !v)} aria-expanded={all}>
                            {all ? 'Show fewer' : `Show all ${said.length}`}
                          </Button>
                        )}
                      </>
                    ) : <p className="text-muted-foreground">No statements name them.</p>}
                  </section>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
