import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, FileText, Filter, RotateCcw, Search, X, HeartPulse, LifeBuoy, Lightbulb, Mail, MessagesSquare, NotebookText, Phone } from 'lucide-react'
import { Empty, Fact, Tip, ListGroupHeader, ListRow, SheetBody } from '@/components/page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { RecordSheet, RecordSheetBody, RecordSheetHeader, TicketChip, listPager, useKept, type RecordSheetPager } from '@/components/app/record-sheet'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TODAY } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { DateText } from '@/components/app/date-text'
import { fmtFull, fmtWhen } from '@/lib/dates'
import { CAT_LABEL, CH_NAME, type Touch, type Cat, type Channel, type Item } from './model'
import { dayISO, ymLong } from './shared'
import { PersonLink } from '../stakeholders/person-sheet'
import { Glossed } from '../overview/bits'

export const CH_ICON: Record<Channel, typeof Mail> = {
  meeting: CalendarDays, email: Mail, ticket: LifeBuoy, record: HeartPulse, file: FileText, ai: Lightbulb, teams: MessagesSquare, call: Phone, note: NotebookText,
}
const CAT_DOT: Record<Cat, string> = { risk: 'bg-bad', positive: 'bg-good', general: 'bg-muted-foreground/60' }
const STEP = 15

export function Timeline({ items, snapshot }: { items: Item[]; snapshot: Touch[] }) {
  const [cat, setCat] = useState<'all' | Cat>('all')
  const [chs, setChs] = useState<Set<Channel>>(new Set())
  const [shown, setShown] = useState(STEP)
  const [q, setQ] = useState('')
  // the open item lives in the URL (?sheet=activity:<id>)
  const sheet = useSheet()
  const open = sheet?.type === 'activity' ? items.find(i => i.id === sheet.id) ?? null : null

  const present = useMemo(() => (Object.keys(CH_NAME) as Channel[]).filter(c => items.some(i => i.ch === c)), [items])
  const needle = q.trim().toLowerCase()
  const matches = (i: Item) => !needle || [i.title, i.desc, i.record?.[1] ?? '', ...i.who, ...i.tickets].some(s => s.toLowerCase().includes(needle))
  const byCh = items.filter(i => (!chs.size || chs.has(i.ch)) && matches(i))
  const dirty = cat !== 'all' || chs.size > 0 || needle !== ''
  const count = (c: 'all' | Cat) => byCh.filter(i => c === 'all' || i.cat === c).length
  const list = byCh.filter(i => cat === 'all' || i.cat === cat)
  const up = list.filter(i => i.date > TODAY).sort((a, b) => +a.date - +b.date)
  const past = list.filter(i => i.date <= TODAY).sort((a, b) => +b.date - +a.date)
  const months = useMemo(() => {
    const g: [string, Item[]][] = []
    past.slice(0, shown).forEach(i => { const ym = dayISO(i.date).slice(0, 7), last = g[g.length - 1]; if (last && last[0] === ym) last[1].push(i); else g.push([ym, [i]]) })
    return g
  }, [past, shown])
  const toggleCh = (c: Channel) => { const n = new Set(chs); if (n.has(c)) n.delete(c); else n.add(c); setChs(n); setShown(STEP) }
  const show = (i: Item) => openSheet('activity', i.id)
  // prev/next walks the list as filtered and sorted: upcoming first, then past, newest first
  const pager = listPager([...up, ...past], open, i => i.id, i => openSheet('activity', i.id, { replace: true }), 'activity')

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup type="single" variant="outline" size="sm" value={cat} onValueChange={v => { if (v) { setCat(v as typeof cat); setShown(STEP) } }} aria-label="Filter activity" className="flex-wrap">
          {(['all', 'risk', 'positive', 'general'] as const).map(c => (
            <ToggleGroupItem key={c} value={c}>
              {c !== 'all' && <span className={cn('size-1.5 rounded-full', CAT_DOT[c])} aria-hidden="true" />}
              {c === 'all' ? 'All' : CAT_LABEL[c]} <span className="tabular-nums text-muted-foreground">{count(c)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto flex flex-wrap items-center gap-1">
        <InputGroup className="h-8 w-44 transition-[width] duration-200 focus-within:w-60 sm:w-52">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput type="search" placeholder="Search activity" aria-label="Search activity by title, text, person or ticket" autoComplete="off"
            value={q} onChange={e => { setQ(e.target.value); setShown(STEP) }} />
          {q && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { setQ(''); setShown(STEP) }}><X /></InputGroupButton></InputGroupAddon>}
        </InputGroup>
        <DropdownMenu>
          <Tip tip={chs.size ? `${chs.size} channel${chs.size > 1 ? 's' : ''}` : 'Filter by channel'}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn(chs.size > 0 && 'text-foreground')}>
              <Filter />{chs.size ? `${chs.size} channel${chs.size > 1 ? 's' : ''}` : 'All channels'}
            </Button>
          </DropdownMenuTrigger>
          </Tip>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Channel</DropdownMenuLabel>
            {present.map(c => {
              const I = CH_ICON[c]
              return (
                <DropdownMenuCheckboxItem key={c} checked={chs.has(c)} onCheckedChange={() => toggleCh(c)} onSelect={e => e.preventDefault()}>
                  <I />{CH_NAME[c]}<span className="ml-auto tabular-nums text-xs text-muted-foreground">{items.filter(i => i.ch === c).length}</span>
                </DropdownMenuCheckboxItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!chs.size} onSelect={() => { setChs(new Set()); setShown(STEP) }}>Show all channels</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={() => { setCat('all'); setChs(new Set()); setQ(''); setShown(STEP); toast('Filters reset') }}><RotateCcw />Reset</Button>
        )}
        </div>
      </div>

      {/* facts, not filters: a plain stats line */}
      <p className="-mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground" aria-label="Activity facts">
        <span className="tabular-nums" aria-live="polite">{dirty ? `${list.length} of ${items.length} items` : `${items.length} items`}</span>
        {snapshot.map(t => (
          <span key={t.kind} className="inline-flex items-center gap-2">
            <span aria-hidden="true">·</span>
            <Tip tip={`Last ${t.kind} with the customer: ${fmtFull(t.date)}`}>
              <span>Last {t.kind} <span className="tabular-nums text-foreground">{fmtWhen(t.date)}</span></span>
            </Tip>
          </span>
        ))}
      </p>

      <section aria-label="Upcoming">
        <ListGroupHeader count={up.length} className="top-[33px]">Upcoming</ListGroupHeader>
        {up.length ? <div className="grid grid-cols-[minmax(0,1fr)] gap-1">{up.map(i => <Row key={i.id} i={i} onOpen={show} />)}</div> : <p className="px-2 py-3 text-sm text-muted-foreground">Nothing scheduled in this filter.</p>}
      </section>

      {months.length ? months.map(([ym, rows]) => (
        <section key={ym} aria-label={ymLong(ym)}>
          <ListGroupHeader count={rows.length} className="top-[33px]">{ymLong(ym)}</ListGroupHeader>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-1">{rows.map(i => <Row key={i.id} i={i} onOpen={show} />)}</div>
        </section>
      )) : <Empty title="No past activity" sub={needle ? `Nothing matches “${q.trim()}”.` : 'Nothing in this filter.'} className="py-6" />}
      {past.length > shown && (
        <Button variant="outline" size="sm" className="mx-auto" onClick={() => setShown(s => s + STEP)}>
          Show {Math.min(STEP, past.length - shown)} more · {past.length - shown} earlier {dirty ? 'matching not shown' : 'not shown'}
        </Button>
      )}

      <ItemSheet item={open} onOpenChange={sheetOpenChange} pager={pager} />
    </div>
  )
}

/** One compact row: channel icon, one-line title, date and people as meta, category dot right. Full text lives in the sheet. */
function Row({ i, onOpen }: { i: Item; onOpen: (i: Item) => void }) {
  const people = i.who.filter(w => !i.title.includes(w)).slice(0, 2)
  const hollow = i.kind === 'goal' || i.kind === 'end'
  return (
    <ListRow size="lg" icon={CH_ICON[i.ch]} onClick={() => onOpen(i)} aria-haspopup="dialog"
      aria-label={`${i.title}, ${CH_NAME[i.ch]}, ${fmtFull(i.date)}, ${CAT_LABEL[i.cat]}`}
      title={i.title}
      meta={<span className="tabular-nums"><DateText date={i.date} /> · {CH_NAME[i.ch]}{people.length ? ` · ${people.join(', ')}` : ''}</span>}
      right={<span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className={cn('size-1.5 rounded-full', hollow ? 'border border-muted-foreground bg-transparent' : CAT_DOT[i.cat])} aria-hidden="true" />
        <span className="hidden sm:inline">{CAT_LABEL[i.cat]}</span>
      </span>} />
  )
}

function ItemSheet({ item: live, onOpenChange, pager }: { item: Item | null; onOpenChange: (o: boolean) => void; pager?: RecordSheetPager }) {
  const item = useKept(live)
  const I = item ? CH_ICON[item.ch] : Mail
  return (
    <RecordSheet open={!!live} onOpenChange={onOpenChange} size="md" pager={pager} view={item?.id}>
        {item && (
          <>
            <RecordSheetHeader eyebrow="Activity" title={<Glossed text={item.title} focusable={false} />}
              meta={<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="tabular-nums">{fmtFull(item.date)}</span>
                <span className="inline-flex items-center gap-1.5"><span className={cn('size-1.5 rounded-full', CAT_DOT[item.cat])} aria-hidden="true" />{CAT_LABEL[item.cat]}</span>
                <span className="inline-flex items-center gap-1"><I className="size-3.5" aria-hidden="true" />{CH_NAME[item.ch]}</span>
              </span>} />
            <RecordSheetBody>
              <SheetBody facts={
                <>
                  {!(item.record && !item.who.length) && (
                    <>
                      <Fact label="Customer">
                        {item.external.length ? <ul className="grid gap-1">{item.external.map(([n, r]) => (
                          <li key={n}><PersonLink name={n} />{r && <span className="block text-xs text-muted-foreground">{r}</span>}</li>
                        ))}</ul> : <span className="text-muted-foreground">None named</span>}
                      </Fact>
                      <Fact label="Sirion">
                        {item.internal.length ? <ul className="grid gap-1">{item.internal.map(n => <li key={n}>{n}</li>)}</ul> : <span className="text-muted-foreground">None named</span>}
                      </Fact>
                    </>
                  )}
                  {item.tickets.length > 0 && (
                    <Fact label="Tickets" wide>
                      <span className="flex flex-wrap gap-1.5">{item.tickets.map(t => <TicketChip key={t} id={t} />)}</span>
                    </Fact>
                  )}
                  <Fact label="Source" wide><span className="text-muted-foreground">{item.src}</span></Fact>
                </>
              }>
                {item.record && !item.who.length ? (
                  <section className="grid gap-1.5">
                    <h3 className="text-xs text-muted-foreground">{item.record[0]}</h3>
                    <p className="leading-relaxed text-pretty"><Glossed text={item.record[1]} focusable={false} /></p>
                  </section>
                ) : (
                  <section className="grid gap-1.5">
                    <h3 className="text-xs text-muted-foreground">What was said</h3>
                    {item.desc ? <p className="leading-relaxed text-pretty">{item.desc}</p> : <p className="text-muted-foreground">No statement recorded.</p>}
                  </section>
                )}
              </SheetBody>
            </RecordSheetBody>
          </>
        )}
    </RecordSheet>
  )
}
