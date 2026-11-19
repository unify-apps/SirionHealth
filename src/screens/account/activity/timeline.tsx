import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, FileText, Filter, RotateCcw, HeartPulse, LifeBuoy, Lightbulb, Mail, MessagesSquare, NotebookText, Phone } from 'lucide-react'
import { Empty, Fact, Tip, ListGroupHeader, ListRow, SheetColumns, sheetHeaderCls } from '@/components/page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TODAY } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { CAT_LABEL, CH_NAME, type Touch, type Cat, type Channel, type Item } from './model'
import { dayISO, ymLong } from './shared'

export const CH_ICON: Record<Channel, typeof Mail> = {
  meeting: CalendarDays, email: Mail, ticket: LifeBuoy, record: HeartPulse, file: FileText, ai: Lightbulb, teams: MessagesSquare, call: Phone, note: NotebookText,
}
const CAT_DOT: Record<Cat, string> = { risk: 'bg-bad', positive: 'bg-good', general: 'bg-muted-foreground/60' }
const dayShort = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace('Sept', 'Sep')
const dayMon = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace('Sept', 'Sep')
const STEP = 15

export function Timeline({ items, snapshot }: { items: Item[]; snapshot: Touch[] }) {
  const [cat, setCat] = useState<'all' | Cat>('all')
  const [chs, setChs] = useState<Set<Channel>>(new Set())
  const [shown, setShown] = useState(STEP)
  const [open, setOpen] = useState<Item | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const present = useMemo(() => (Object.keys(CH_NAME) as Channel[]).filter(c => items.some(i => i.ch === c)), [items])
  const byCh = items.filter(i => !chs.size || chs.has(i.ch))
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
  const show = (i: Item) => { setOpen(i); setSheetOpen(true) }

  return (
    <div className="grid gap-4">
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
        {snapshot.map(t => {
          const I = t.kind === 'email' ? Mail : CalendarDays
          return (
            <Tip key={t.kind} tip={`Last ${t.kind} with the customer: ${dayMon(t.date)}`}>
              <span tabIndex={0} className="hidden items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:inline-flex">
                <I className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">Last {t.kind}</span><span className="tabular-nums">{dayShort(t.date)}</span>
              </span>
            </Tip>
          )
        })}
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
        {(cat !== 'all' || chs.size > 0) && (
          <Button variant="ghost" size="sm" onClick={() => { setCat('all'); setChs(new Set()); setShown(STEP); toast('Filters reset') }}><RotateCcw />Reset</Button>
        )}
        </div>
      </div>

      <section aria-label="Upcoming">
        <ListGroupHeader count={up.length} className="top-23">Upcoming</ListGroupHeader>
        {up.length ? <div className="grid gap-1">{up.map(i => <Row key={i.id} i={i} onOpen={show} />)}</div> : <p className="px-2 py-3 text-sm text-muted-foreground">Nothing scheduled in this filter.</p>}
      </section>

      {months.length ? months.map(([ym, rows]) => (
        <section key={ym} aria-label={ymLong(ym)}>
          <ListGroupHeader count={rows.length} className="top-23">{ymLong(ym)}</ListGroupHeader>
          <div className="grid gap-1">{rows.map(i => <Row key={i.id} i={i} onOpen={show} />)}</div>
        </section>
      )) : <Empty title="No past activity" sub="Nothing in this filter." className="py-6" />}
      {past.length > shown && (
        <Button variant="outline" size="sm" className="mx-auto" onClick={() => setShown(s => s + STEP)}>
          Show {Math.min(STEP, past.length - shown)} more of {past.length - shown}
        </Button>
      )}

      <ItemSheet item={open} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

/** One compact row: channel icon, one-line title, date and people as meta, category dot right. Full text lives in the sheet. */
function Row({ i, onOpen }: { i: Item; onOpen: (i: Item) => void }) {
  const people = i.who.filter(w => !i.title.includes(w)).slice(0, 2)
  const hollow = i.kind === 'goal' || i.kind === 'end'
  return (
    <ListRow size="lg" icon={CH_ICON[i.ch]} onClick={() => onOpen(i)} aria-haspopup="dialog"
      aria-label={`${i.title}, ${CH_NAME[i.ch]}, ${dayMon(i.date)}, ${CAT_LABEL[i.cat]}`}
      title={i.title}
      meta={<span className="tabular-nums">{dayShort(i.date)} · {CH_NAME[i.ch]}{people.length ? ` · ${people.join(', ')}` : ''}</span>}
      right={<span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className={cn('size-1.5 rounded-full', hollow ? 'border border-muted-foreground bg-transparent' : CAT_DOT[i.cat])} aria-hidden="true" />
        <span className="hidden sm:inline">{CAT_LABEL[i.cat]}</span>
      </span>} />
  )
}

function ItemSheet({ item, open, onOpenChange }: { item: Item | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const I = item ? CH_ICON[item.ch] : Mail
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-3xl">
        {item && (
          <>
            <SheetHeader className={sheetHeaderCls}>
              <SheetTitle className="text-lg font-normal">{item.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5"><span className={cn('size-1.5 rounded-full', CAT_DOT[item.cat])} aria-hidden="true" />{CAT_LABEL[item.cat]}</span>
                <span className="inline-flex items-center gap-1"><I className="size-3.5" aria-hidden="true" />{CH_NAME[item.ch]}</span>
                <span className="tabular-nums">{dayMon(item.date)}</span>
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <SheetColumns aside={
                <>
                  <Fact label="Date"><span className="tabular-nums">{dayMon(item.date)}</span></Fact>
                  <Fact label="Channel"><span className="inline-flex items-center gap-1.5"><I className="size-4 text-muted-foreground" aria-hidden="true" />{CH_NAME[item.ch]}</span></Fact>
                  {!(item.record && !item.who.length) && (
                    <>
                      <Fact label="Customer">
                        {item.external.length ? <ul className="grid gap-1">{item.external.map(([n, r]) => (
                          <li key={n}>{n}{r && <span className="block text-xs text-muted-foreground">{r}</span>}</li>
                        ))}</ul> : <span className="text-muted-foreground">None named</span>}
                      </Fact>
                      <Fact label="Sirion">
                        {item.internal.length ? <ul className="grid gap-1">{item.internal.map(n => <li key={n}>{n}</li>)}</ul> : <span className="text-muted-foreground">None named</span>}
                      </Fact>
                    </>
                  )}
                  {item.tickets.length > 0 && (
                    <Fact label="Tickets">
                      <span className="flex flex-wrap gap-1.5">{item.tickets.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-md border border-hairline px-1.5 text-xs"><LifeBuoy className="size-3 text-muted-foreground" aria-hidden="true" />{t}</span>
                      ))}</span>
                    </Fact>
                  )}
                  <Fact label="Source"><span className="text-muted-foreground">{item.src}</span></Fact>
                </>
              }>
                {item.record && !item.who.length ? (
                  <section className="grid gap-1.5">
                    <h3 className="text-xs text-muted-foreground">{item.record[0]}</h3>
                    <p className="leading-relaxed text-pretty">{item.record[1]}</p>
                  </section>
                ) : (
                  <section className="grid gap-1.5">
                    <h3 className="text-xs text-muted-foreground">What was said</h3>
                    {item.desc ? <p className="leading-relaxed text-pretty">{item.desc}</p> : <p className="text-muted-foreground">No statement recorded.</p>}
                  </section>
                )}
              </SheetColumns>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
