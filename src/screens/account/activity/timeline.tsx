import { useMemo, useState } from 'react'
import { BarChart3, CalendarDays, FileText, Filter, Lightbulb, Mail, MessagesSquare, NotebookText, Phone, Ticket } from 'lucide-react'
import { Empty } from '@/components/page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TODAY } from '@/data/legacy'
import { cn } from '@/lib/utils'
import { CAT_LABEL, CH_NAME, rowText, type Cat, type Channel, type Item } from './model'
import { dayISO, ymLong } from './shared'

export const CH_ICON: Record<Channel, typeof Mail> = {
  meeting: CalendarDays, email: Mail, ticket: Ticket, record: BarChart3, file: FileText, ai: Lightbulb, teams: MessagesSquare, call: Phone, note: NotebookText,
}
const CAT_DOT: Record<Cat, string> = { risk: 'bg-bad', positive: 'bg-good', general: 'bg-muted-foreground/60' }
const dayMon = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace('Sept', 'Sep')
const STEP = 15

export function Timeline({ items, snapshot }: { items: Item[]; snapshot: string[] }) {
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
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <ToggleGroup type="single" variant="outline" size="sm" value={cat} onValueChange={v => { if (v) { setCat(v as typeof cat); setShown(STEP) } }} aria-label="Filter activity" className="flex-wrap">
          {(['all', 'risk', 'positive', 'general'] as const).map(c => (
            <ToggleGroupItem key={c} value={c}>
              {c !== 'all' && <span className={cn('size-1.5 rounded-full', CAT_DOT[c])} aria-hidden="true" />}
              {c === 'all' ? 'All' : CAT_LABEL[c]} <span className="tabular-nums text-muted-foreground">{count(c)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><Filter />{chs.size ? `${chs.size} channel${chs.size > 1 ? 's' : ''}` : 'All channels'}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
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
      </div>

      <GroupHead label="Upcoming" n={up.length} />
      {up.length ? up.map(i => <Row key={i.id} i={i} onOpen={show} />) : <Empty title="Nothing upcoming" sub="Nothing is scheduled in this filter." className="py-6" />}

      <GroupHead label="Past" n={past.length} extra={snapshot.length ? snapshot.join(' · ') : undefined} />
      {months.length ? months.map(([ym, rows]) => (
        <section key={ym} aria-label={ymLong(ym)}>
          <h4 className="px-2 pt-3 pb-1 text-xs text-muted-foreground">{ymLong(ym)}</h4>
          {rows.map(i => <Row key={i.id} i={i} onOpen={show} />)}
        </section>
      )) : <Empty title="No past activity" sub="Nothing in this filter." className="py-6" />}
      {past.length > shown && (
        <Button variant="outline" size="sm" className="mx-auto mt-3" onClick={() => setShown(s => s + STEP)}>
          Show {Math.min(STEP, past.length - shown)} more of {past.length - shown}
        </Button>
      )}

      <ItemSheet item={open} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

function GroupHead({ label, n, extra }: { label: string; n: number; extra?: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 border-b border-hairline pb-2 text-sm font-medium first:mt-0">
      {label}<span className="tabular-nums text-muted-foreground">{n}</span>
      {extra && <span className="ml-auto text-xs font-normal text-muted-foreground">{extra}</span>}
    </div>
  )
}

function Row({ i, onOpen }: { i: Item; onOpen: (i: Item) => void }) {
  const I = CH_ICON[i.ch], d = rowText(i), chips = i.who.filter(w => !i.title.includes(w)).slice(0, 2)
  return (
    <button type="button" onClick={() => onOpen(i)} aria-haspopup="dialog"
      className="group grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg px-2 py-2.5 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[16px_88px_minmax(0,1fr)_auto]">
      <Tooltip>
        <TooltipTrigger asChild><span className="mt-0.5 text-muted-foreground"><I className="size-4" aria-hidden="true" /></span></TooltipTrigger>
        <TooltipContent>{CH_NAME[i.ch]}</TooltipContent>
      </Tooltip>
      <span className="hidden pt-px text-xs tabular-nums text-muted-foreground sm:block">{dayMon(i.date)}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium group-hover:underline group-hover:underline-offset-4">{i.title}</span>
          {chips.map(w => <span key={w} className="rounded-md border border-hairline bg-surface-2 px-1.5 text-xs">{w}</span>)}
        </span>
        {d && <span className="mt-0.5 block line-clamp-2 text-muted-foreground">{d}</span>}
        <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">{dayMon(i.date)} · {CH_NAME[i.ch]}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 pt-px text-xs whitespace-nowrap">
        <span className={cn('size-1.5 rounded-full', i.kind === 'goal' || i.kind === 'end' ? 'border border-muted-foreground bg-transparent' : CAT_DOT[i.cat])} aria-hidden="true" />
        {CAT_LABEL[i.cat]}
      </span>
    </button>
  )
}

function ItemSheet({ item, open, onOpenChange }: { item: Item | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const I = item ? CH_ICON[item.ch] : Mail
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        {item && (
          <>
            <SheetHeader className="border-b border-hairline p-5 pr-12">
              <SheetTitle className="text-lg font-normal">{item.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{dayMon(item.date)}</span>
                <span className="inline-flex items-center gap-1"><I className="size-3.5" aria-hidden="true" />{CH_NAME[item.ch]}</span>
                <span className="inline-flex items-center gap-1.5"><span className={cn('size-1.5 rounded-full', CAT_DOT[item.cat])} aria-hidden="true" />{CAT_LABEL[item.cat]}</span>
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid gap-6 p-5">
                {item.record && !item.who.length ? (
                  <section className="grid gap-1.5">
                    <h3 className="text-xs text-muted-foreground">{item.record[0]}</h3>
                    <p className="leading-relaxed">{item.record[1]}</p>
                  </section>
                ) : (
                  <>
                    <section className="grid gap-3">
                      <h3 className="text-xs text-muted-foreground">Who took part</h3>
                      {!item.internal.length && !item.external.length ? <p className="text-muted-foreground">No participants recorded.</p> : (
                        <dl className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <dt className="mb-1 text-xs text-muted-foreground">Customer</dt>
                            <dd className="grid gap-1">{item.external.length ? item.external.map(([n, r]) => (
                              <span key={n}>{n}{r && <span className="text-muted-foreground"> · {r}</span>}</span>
                            )) : <span className="text-muted-foreground">None named</span>}</dd>
                          </div>
                          <div>
                            <dt className="mb-1 text-xs text-muted-foreground">Sirion</dt>
                            <dd className="grid gap-1">{item.internal.length ? item.internal.map(n => <span key={n}>{n}</span>) : <span className="text-muted-foreground">None named</span>}</dd>
                          </div>
                        </dl>
                      )}
                    </section>
                    <section className="grid gap-1.5">
                      <h3 className="text-xs text-muted-foreground">What was said</h3>
                      {item.desc ? <p className="leading-relaxed text-pretty">{item.desc}</p> : <p className="text-muted-foreground">No statement recorded.</p>}
                      {item.tickets.length > 0 && (
                        <p className="flex flex-wrap gap-1.5 pt-1">{item.tickets.map(t => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-md border border-hairline px-1.5 text-xs"><Ticket className="size-3" aria-hidden="true" />{t}</span>
                        ))}</p>
                      )}
                    </section>
                  </>
                )}
                <p className="text-xs text-muted-foreground">Source: {item.src}</p>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
