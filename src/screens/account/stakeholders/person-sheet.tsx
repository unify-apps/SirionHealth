import { useState } from 'react'
import { AlertTriangle, Check, CircleCheck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader, TicketChip, type RecordSheetPager } from '@/components/app/record-sheet'
import { openSheet } from '@/lib/route'
import { cn } from '@/lib/utils'
import { fmtDY, ymLabel } from '../activity/shared'
import { loadBase, type Evidence, type GapLevel, type StakeRow } from './model'
import { EngagementPill, MonthStrip, RoleMenu, RoleTag, TonePill } from './parts'
import { roleChange, roleStore } from './store'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Fact, SheetBody, Tip } from '@/components/page'

/** Copies an address and confirms it. */
export function copyEmail(email: string) {
  navigator.clipboard?.writeText(email).then(() => toast.success('Email copied', { description: email }), () => toast.error("Couldn't copy the email"))
}

// display name -> stakeholder key (email, or 'news:<name>' for people found in public news), for person links
let nameKeys: Map<string, string> | null = null
function personKey(name: string) {
  if (!nameKeys) {
    nameKeys = new Map()
    try {
      const b = loadBase()
      b.people.filter(p => p.customer).forEach(p => nameKeys!.set(p.name, p.email))
      b.news.forEach(n => { if (!nameKeys!.has(n.name)) nameKeys!.set(n.name, 'news:' + n.name) })
    } catch { /* no links: names stay plain text */ }
  }
  return nameKeys.get(name)
}

/** A customer contact's name as a link to their person sheet on the Stakeholders tab. Anyone else (Sirion,
 *  partners) stays plain text, since they have no person sheet. */
export function PersonLink({ name }: { name: string }) {
  const key = personKey(name)
  if (!key) return <span>{name}</span>
  return (
    <Tip tip={`Open ${name} in Stakeholders`}>
      <button type="button" onClick={() => openSheet('person', key, { tab: 'stakeholders' })}
        className="rounded-sm text-left text-signal underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50">
        {name}
      </button>
    </Tip>
  )
}

export const GAP_ICON: Record<GapLevel, { I: typeof Info; cls: string }> = {
  ok: { I: CircleCheck, cls: 'text-good' }, warn: { I: AlertTriangle, cls: 'text-warn' }, info: { I: Info, cls: 'text-muted-foreground' }, none: { I: Info, cls: 'text-muted-foreground' },
}

const SOURCE_TEXT: Record<StakeRow['source'], string> = {
  mine: 'set here', tagged: 'tagged in the health record', confirmed: 'confirmed', inferred: 'suggested from the monthly summaries, not confirmed', news: 'suggested from public news, not confirmed', none: '',
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
          {e.tickets.map(t => <TicketChip key={t} id={t} />)}
        </p>
      </div>
    </li>
  )
}

export function PersonSheet({ row, ev, months, max, onOpenChange, pager }: {
  row: StakeRow | null; ev: Evidence[]; months: string[]; max: number; onOpenChange: (open: boolean) => void; pager?: RecordSheetPager
}) {
  const [all, setAll] = useState(false)
  // paging to another person starts their statements collapsed again
  const [seen, setSeen] = useState(row?.key)
  if (row?.key !== seen) { setSeen(row?.key); setAll(false) }
  const said = row ? ev.filter(e => e.who.includes(row.name)).sort((a, b) => b.ym.localeCompare(a.ym) || +(b.date ?? 0) - +(a.date ?? 0)) : []
  const shown = all ? said : said.slice(0, 6)
  const G = row ? GAP_ICON[row.gap[0]] : null
  return (
    <RecordSheet open={!!row} onOpenChange={o => { if (!o) setAll(false); onOpenChange(o) }} size="md" pager={pager} view={row?.key}>
        {row && G && (
          <>
            <RecordSheetHeader eyebrow="Stakeholder" title={row.name}
              meta={[row.title, row.org].filter(Boolean).join(' · ') || 'No title on the contact card'} />
            <RecordSheetBody>
              <SheetBody facts={
                <>
                  <Fact label={<>Role{SOURCE_TEXT[row.source] && <> · {SOURCE_TEXT[row.source]}</>}</>}><RoleTag row={row} /></Fact>
                  <Fact label="Engagement">
                    <span className="flex flex-wrap items-center gap-2">
                      <EngagementPill eng={row.eng} days={row.days} />
                      <TonePill tone={row.tone} pos={row.pos} neg={row.neg} />
                    </span>
                  </Fact>
                  <Fact label="Last named">
                    {row.last
                      ? <Tip tip={`${row.days} days ago`}><span tabIndex={0} className="rounded-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{fmtDY(row.last)}</span></Tip>
                      : <span className="text-muted-foreground">{row.news ? 'Not in the account\'s contacts' : 'Never'}</span>}
                  </Fact>
                  <Fact label="Mentions, 18 months">
                    <span className="flex items-center gap-2"><MonthStrip months={row.months} labels={months} max={max} /><span className="tabular-nums">{row.mentions}</span></span>
                  </Fact>
                  {(row.sources.length > 0 || row.news) && <Fact label="Seen in" wide><span className="text-muted-foreground">{row.news ? row.news.source : row.sources.join(', ')}</span></Fact>}
                  {row.email && (
                    <Fact label="Email">
                      <span className="flex min-w-0 items-center gap-1">
                        <Tip tip={`Email ${row.name}`}><a href={`mailto:${row.email}`} className="truncate rounded-sm text-signal underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50">{row.email}</a></Tip>
                        <Tip tip="Copy email"><Button variant="ghost" size="icon-xs" aria-label={`Copy ${row.email}`} onClick={() => copyEmail(row.email!)}><Copy /></Button></Tip>
                      </span>
                    </Fact>
                  )}
                </>
              }>
                <section className="grid gap-2">
                  <h3 className="text-xs text-muted-foreground">What to do</h3>
                  <p className="flex items-start gap-2"><G.I className={cn('mt-0.5 size-4 shrink-0', G.cls)} aria-hidden="true" />{row.gap[1]}</p>
                  {row.basis && <p className="leading-relaxed text-pretty text-muted-foreground">{row.basis}{row.confidence ? ` (${row.confidence} confidence)` : ''}</p>}
                  {!row.basis && row.source === 'tagged' && <p className="text-muted-foreground">Tagged by hand in the health record.</p>}
                </section>

                {!row.news && (
                  <section className="grid gap-2">
                    <h3 className="text-xs text-muted-foreground">Statements naming {row.name.split(' ')[0]}</h3>
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
              </SheetBody>
            </RecordSheetBody>
            <RecordSheetFooter>
              <RoleMenu row={row} align="end">
                <Button variant="outline" size="sm">Change role</Button>
              </RoleMenu>
              {(row.source === 'inferred' || row.source === 'news') && (
                <Button variant="default" size="sm" onClick={() => roleChange(() => roleStore.confirm(row.key), `Confirmed ${row.name} as ${row.label.toLowerCase()}`)}><Check />Confirm role</Button>
              )}
            </RecordSheetFooter>
          </>
        )}
    </RecordSheet>
  )
}
