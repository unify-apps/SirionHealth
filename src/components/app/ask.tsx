import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Building2, CalendarClock, FileText, HeartPulse, ListTodo, MessageSquare, SquarePen, Users, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Tip } from '@/components/page'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AREAS, daysBetween, monthEnd, money, rel, ROWS, T, TA_EVENTS, TA_EXAMPLE, TA_RECORD, taEpisode, taEvidence, taMonths, taPeople, TODAY } from '@/data/legacy'
import { go, type Route } from '@/lib/route'

/*
 * Ask panel: canned answers composed from TransAmerica's AHI record, its order forms, the monthly
 * summaries and public news (ported from legacy screen-ask.js). No model is called.
 */

const SUGGEST: [string, LucideIcon][] = [
  ['Why is the health score 50?', HeartPulse],
  ['What happens with the renewal?', CalendarClock],
  ['Who should I talk to now?', Users],
  ['What are customers unhappy about?', MessageSquare],
  ['What should I do this week?', ListTodo],
  ['Which accounts need me first?', Building2],
]

/** Open the panel from anywhere and ask a question, e.g. an "Ask about this" button on a card. */
export function askAI(question: string) {
  window.dispatchEvent(new CustomEvent<string>('sirion:ask', { detail: question }))
}

/* ---------- facts ---------- */

type Month = { ym: string; date: Date; final: number; areas: Record<string, number> }
type Evidence = { ym: string; kind: string; text: string; date: Date | null; who: string[] }
type Person = { name: string; mentions: number }
type Kpi = [string, string, number, string]
type AccountRow = { name: string; stage: string; health: number; carr: number; renew: Date }

const AREA_SHORT: Record<string, string> = {
  commercial: 'commercial', adoption: 'adoption', support: 'support', engagement: 'engagement', sentiment: 'sentiment', renewalRisk: 'renewal risk',
}
const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtDY = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function facts() {
  const ms = taMonths() as Month[]
  const last = ms[ms.length - 1], prev = ms[ms.length - 2]
  const renewal = new Date(`${TA_RECORD.renewal}T00:00:00`)
  return {
    last,
    ep: taEpisode('model') as { date: Date },
    left: daysBetween(TODAY, renewal) as number,
    delta: (k: string) => last.areas[k] - prev.areas[k],
  }
}

function inputsFlat() {
  const seen = new Set<string>()
  const out: { area: string; name: string; v: number; note: string }[] = []
  const kpis = TA_RECORD.kpis as unknown as Record<string, Kpi[]>
  for (const [k] of AREAS as [string, string][]) {
    for (const [name, key, v, note] of kpis[k] ?? []) {
      if (v < 0 || seen.has(key)) continue // "No data" never ranks
      seen.add(key)
      out.push({ area: k, name, v, note })
    }
  }
  return out
}
function topInputs(dir: 1 | -1) {
  const used = new Set<string>()
  return inputsFlat().sort((a, b) => dir * (b.v - a.v)).filter(x => !used.has(x.area) && !!used.add(x.area)).slice(0, 3)
}
function lastNamed(name: string) {
  const ds = (taEvidence() as Evidence[]).filter(e => e.who.includes(name)).map(e => +(e.date ?? monthEnd(e.ym)))
  return ds.length ? new Date(Math.max(...ds)) : null
}

const WELL: [string, string][] = [
  ['Usage is above its 12-month average', 'Licence use 111% (663 of 593 seats) and 222 monthly users against an average of 215.'],
  ['Commercials are clean', 'NRR and GRR are both 100% and no invoice is overdue.'],
  ['Support quality holds', 'No ticket has been reopened, and P1s are at zero.'],
]
const ATTN: [string, string][] = [
  ['Renewal unsigned with 41 days left', '$330K renews Dec 30 with auto-renew off, so health is capped from 62 to 50.'],
  ['Champion gone, no executive contact', 'Bailey Laske handed over on Oct 21. Executive sponsor engagement is 0 this month.'],
  ['Workflows have stalled', 'Approval cycles fell from 12 to 0 and 11 enhancement requests have waited 423 days on average.'],
]

/* ---------- answers ---------- */

type Source = { label: string; route: Route }
type Answer = { body: React.ReactNode; sources?: Source[]; chips?: boolean }

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-medium">{children}</strong>
const Muted = ({ children }: { children: React.ReactNode }) => <span className="text-xs text-muted-foreground">{children}</span>
const UL = ({ children }: { children: React.ReactNode }) => <ul className="mt-1.5 grid divide-y divide-hairline [&>li]:py-1.5">{children}</ul>
const P = ({ children }: { children: React.ReactNode }) => <p className="[&+p]:mt-1.5 [&+ul]:mt-1.5 [ul+&]:mt-1.5">{children}</p>

function topic(raw: string) {
  const t = raw.toLowerCase()
  if (/strongest|weakest|inputs/.test(t)) return /weak/.test(t) ? 'weak' : 'strong'
  if (/account|book|portfolio|which|list|first/.test(t) && !/transamerica/.test(t)) return 'book'
  if (/happen|recent|activity|timeline/.test(t)) return /renew/.test(t) ? 'renewal' : 'recent'
  if (/going well|good|positive/.test(t)) return 'well'
  if (/attention|wrong|worry|bad/.test(t)) return 'attn'
  if (/score|health|50|cap|weight|why is/.test(t)) return 'score'
  if (/renew|sign|commit|contract|order form|dec 30/.test(t)) return 'renewal'
  if (/who|people|champion|sponsor|stakeholder|contact|nick|bailey|lawrence|talk/.test(t)) return 'people'
  if (/sentiment|unhappy|complain|negative|tone|feel|angry/.test(t)) return 'sentiment'
  if (/do|next|action|play|plan|week|recommend/.test(t)) return 'actions'
  if (/ticket|support|jira|incident|bug|enhancement/.test(t)) return 'support'
  if (/usage|adoption|licen|users|seat|workflow/.test(t)) return 'adoption'
  if (/news|market|external|aegon|press/.test(t)) return 'news'
  if (/change|new|since|last week/.test(t)) return 'changed'
  return null
}

function answer(q: string): Answer {
  const F = facts()
  const cap = TA_RECORD.weightedHealth - TA_RECORD.finalHealth
  switch (topic(q)) {
    case 'recent': {
      const L = (TA_EVENTS as [string, string, string, string][])
        .map(([d, , text, src]) => ({ date: new Date(`${d}T00:00:00`), text, src }))
        .filter(e => e.date <= TODAY && !/engagement snapshot/.test(e.src))
        .sort((a, b) => +b.date - +a.date).slice(0, 5)
      return {
        body: <>
          <P>The latest activity on TransAmerica:</P>
          <UL>{L.map(e => <li key={e.text}><Muted>{fmtD(e.date)}</Muted> <B>{e.text}</B> <Muted>· {e.src}</Muted></li>)}</UL>
          <P>The renewal is due Dec 30 with nothing signed; the last email was Nov 16 and the last meeting Nov 12.</P>
        </>,
        sources: [{ label: 'Activity', route: 'account' }],
      }
    }
    case 'well': case 'attn': {
      const well = topic(q) === 'well'
      return {
        body: <><P>{well ? 'Going well' : 'Needs attention'} on TransAmerica:</P>
          <UL>{(well ? WELL : ATTN).map(([h, t]) => <li key={h}><B>{h}.</B> {t}</li>)}</UL></>,
        sources: [{ label: 'Summary', route: 'account' }],
      }
    }
    case 'strong': case 'weak': {
      const strong = topic(q) === 'strong'
      const L = inputsFlat().sort((a, b) => (strong ? b.v - a.v : a.v - b.v)).slice(0, 4)
      return {
        body: <><P>The {strong ? 'strongest' : 'weakest'} inputs in AHI's score:</P>
          <UL>{L.map(x => <li key={x.name}><B>{x.name}</B> {x.v} · {x.note}</li>)}</UL></>,
        sources: [{ label: 'Health inputs', route: 'account' }],
      }
    }
    case 'score':
      return {
        body: <>
          <P>Health is <B>50</B>, Watch band. The six areas score{' '}
            {(AREAS as [string, string][]).map(([k]) => `${AREA_SHORT[k]} ${F.last.areas[k]}`).join(', ')}, which weight to <B>{TA_RECORD.weightedHealth}</B>.</P>
          <P>The renewal cap then takes off {cap}: {TA_RECORD.overrideReason}. It lifts once the renewal is signed or auto-renew is on.</P>
          <P>Pulling it down most:</P>
          <UL>{topInputs(-1).map(x => <li key={x.name}><B>{x.name}</B> {x.v} · {x.note}</li>)}</UL>
        </>,
        sources: [{ label: 'Scored record, Oct 31', route: 'account' }, { label: 'How we got to 50', route: 'account' }],
      }
    case 'renewal':
      return {
        body: <>
          <P><B>$330K</B> CARR renews on <B>Dec 30, 2026</B>, {F.left} days from today, on two order forms ($275K and $55K). Auto-renew is off and nothing is signed.</P>
          <P>The model first flagged the account on {fmtD(F.ep.date)}. The flag cleared in September at 73 and came back in October; Aug 28 is when leadership threatened the renewal.</P>
          <P>The account insight says to get a signed commitment within 7 days.</P>
        </>,
        sources: [{ label: 'Order forms', route: 'account' }, { label: 'Account insight', route: 'account' }],
      }
    case 'people': {
      const nick = (taPeople() as Person[]).find(p => p.name === 'Nick Cavazos')
      const nickLast = lastNamed('Nick Cavazos'), lk = lastNamed('Lawrence Kane'), kb = lastNamed('Karen Ben-Alta')
      return {
        body: <>
          <P>Start with <B>Nick Cavazos</B>. He is the likely new day-to-day owner: {nick?.mentions || 'several'} statements in Sirion's monthly summaries name him{nickLast ? `, most recently on ${fmtDY(nickLast)}` : ''}.</P>
          <UL>
            <li><B>Lawrence Kane</B>, executive sponsor: last named {lk ? fmtDY(lk) : 'never'}, and executive engagement is 0 this month (average 11).</li>
            <li><B>Bailey Laske</B>, champion: handed over on Oct 21 after chasing the INC-177010 RCA.</li>
            <li><B>Karen Ben-Alta</B> and <B>Adrian Dragomir</B> are tagged champions but quiet: Karen last named {kb ? fmtDY(kb) : 'never'}, Adrian never.</li>
            <li><B>Jay Orlandi</B>, EVP and Chief Legal & Corporate Affairs Officer since Mar 1, now oversees Procurement. Public news suggests him as a sponsor; he is not in AHI's contacts.</li>
          </UL>
        </>,
        sources: [{ label: 'Stakeholders', route: 'account' }, { label: 'Nick Cavazos', route: 'account' }],
      }
    }
    case 'sentiment': {
      const neg = (taEvidence() as Evidence[]).filter(e => e.kind === 'neg' && e.date).sort((a, b) => +b.date! - +a.date!).slice(0, 3)
      return {
        body: <>
          <P>Sentiment is <B>{F.last.areas.sentiment}</B>, down {-F.delta('sentiment')} from September, scored from 23 emails this month. The latest negative statements in Sirion's monthly summaries:</P>
          <UL>{neg.map(e => <li key={e.text}><Muted>{fmtD(e.date!)}</Muted> {e.text}</li>)}</UL>
        </>,
        sources: [{ label: 'Activity, risk', route: 'account' }, { label: 'Sentiment area', route: 'account' }],
      }
    }
    case 'actions':
      return {
        body: <>
          <P>If you do one thing this week, secure the renewal commitment: <B>$330K</B> renews Dec 30, auto-renew is off, and a signed commitment is the only thing that lifts the cap from 62 to 50.</P>
          <P>After that, re-engage <B>Lawrence Kane</B> (no executive contact this month) and name a new champion now that Bailey Laske has handed over.</P>
        </>,
        sources: [{ label: 'Order forms', route: 'account' }, { label: 'Stakeholders', route: 'account' }],
      }
    case 'support':
      return {
        body: <>
          <P>Support is <B>{F.last.areas.support}</B>. No ticket has been reopened, there are no P1s, and only 1 ticket was raised this month against an average of 35.</P>
          <P>The weak spot is <B>11 open Jira enhancement requests</B>, 423 days old on average. Most tickets are about{' '}
            {(T.themes as [string, number][]).slice(0, 3).map(t => `${t[0].toLowerCase()} (${t[1]})`).join(', ')}.</P>
        </>,
        sources: [{ label: 'Support inputs', route: 'account' }, { label: 'Scored record', route: 'account' }],
      }
    case 'adoption':
      return {
        body: <>
          <P>Adoption is <B>{F.last.areas.adoption}</B>. Usage is healthy: licence use 111% (663 of 593 seats) and 222 monthly users against an average of 215.</P>
          <P>Workflows have stalled: <B>0 approval cycles</B> closed this month against an average of 12, and 155 contracts processed against 171. Time to first value (241 days) is not scored.</P>
        </>,
        sources: [{ label: 'Adoption inputs', route: 'account' }, { label: 'Scored record', route: 'account' }],
      }
    case 'news': {
      const L = (T.market as [string, number | null, string, string][]).filter(m => m[1] != null)
      return {
        body: <><P>Four things in public news matter for the renewal:</P>
          <UL>{L.map(m => <li key={m[0]}><B>{m[0]}</B> · {m[2]}<br /><Muted>{m[3]}</Muted></li>)}</UL></>,
        sources: [{ label: 'Intelligence', route: 'account' }],
      }
    }
    case 'changed': {
      const ch = TA_EXAMPLE.changed as { what: string; why: string }[]
      return {
        body: <><P>Since you last looked on Nov 12, {ch.length} things changed on TransAmerica:</P>
          <UL>{ch.map(c => <li key={c.what}><B>{c.what}</B> · {c.why}</li>)}</UL></>,
        sources: [{ label: 'TransAmerica', route: 'account' }],
      }
    }
    case 'book': {
      const isTA = (r: AccountRow) => r.name === 'TransAmerica'
      const days = (r: AccountRow) => (rel(r.renew) as { days: number }).days
      const needs = (ROWS as AccountRow[])
        .filter(r => isTA(r) || (!/Churn/.test(r.stage) && (r.health < 40 || days(r) <= 90)))
        .sort((a, b) => Number(isTA(b)) - Number(isTA(a)) || days(a) - days(b))
      return {
        body: <>
          <P>{needs.length} accounts need you first:</P>
          <UL>{needs.map(r => <li key={r.name}><B>{r.name}</B> · health {r.health} · {money(r.carr)} · renewal {(rel(r.renew) as { t: string }).t.toLowerCase()}</li>)}</UL>
          <P>TransAmerica is first because it changed and renews in {F.left} days. The others are in the list with current state only.</P>
        </>,
        sources: [{ label: 'My accounts', route: 'accounts' }],
      }
    }
  }
  return {
    body: <P>I can answer about TransAmerica's score, renewal, people, sentiment, support, adoption and news, and about which accounts need you first. Try one of these:</P>,
    chips: true,
  }
}

/* ---------- panel ---------- */

type Msg = { id: number; who: 'me'; text: string } | { id: number; who: 'bot'; typing: true } | { id: number; who: 'bot'; answer: Answer }

/** Suggested questions: a vertical stack of compact outline pills, full text wrapping, a small icon. */
function Chips({ onAsk, disabled }: { onAsk: (q: string) => void; disabled: boolean }) {
  return (
    <ul className="mt-3 grid justify-items-start gap-1.5" aria-label="Suggested questions">
      {SUGGEST.map(([q, I]) => (
        <li key={q} className="max-w-full">
          <button type="button" disabled={disabled} onClick={() => onAsk(q)}
            className="flex max-w-full items-start gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            <I className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-pretty">{q}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function AskPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const send = useCallback((text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setBusy(true)
    const typingId = ++nextId.current
    setMsgs(m => [...m, { id: ++nextId.current, who: 'me', text: q }, { id: typingId, who: 'bot', typing: true }])
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    timer.current = setTimeout(() => {
      setMsgs(m => m.map(x => (x.id === typingId ? { id: typingId, who: 'bot', answer: answer(q) } : x)))
      setBusy(false)
      input.current?.focus()
    }, reduced ? 150 : 900 + Math.min(900, q.length * 12))
  }, [busy])

  useEffect(() => () => clearTimeout(timer.current), [])

  // askAI(question) from anywhere opens the panel and asks it
  useEffect(() => {
    const on = (e: Event) => { onOpenChange(true); send((e as CustomEvent<string>).detail) }
    window.addEventListener('sirion:ask', on)
    return () => window.removeEventListener('sirion:ask', on)
  }, [onOpenChange, send])

  // keep the latest message in view
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }, [msgs, open])

  // the textarea grows with its text, 1 to 4 rows
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 4 * 20 + 12)}px`
  }, [draft, open])

  const submit = () => { if (!draft.trim() || busy) return; send(draft); setDraft('') }
  const reset = () => {
    clearTimeout(timer.current)
    setMsgs([]); setBusy(false); setDraft('')
    toast('New chat started')
    input.current?.focus()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 data-[side=right]:sm:max-w-md"
        onOpenAutoFocus={e => { e.preventDefault(); input.current?.focus() }}
      >
        <SheetHeader className="flex-row items-center gap-2 border-b border-hairline py-3 pr-12 pl-5">
          <SheetTitle className="text-base font-medium">Ask</SheetTitle>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">TransAmerica</span>
          <SheetDescription className="sr-only">Answers from TransAmerica's AHI record, order forms, monthly summaries and public news</SheetDescription>
          <Tip tip="New chat">
            <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={reset} disabled={!msgs.length} aria-label="New chat">
              <SquarePen aria-hidden="true" />
            </Button>
          </Tip>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" aria-live="polite" aria-label="Conversation">
          <div className="grid content-start gap-6 text-sm leading-relaxed">
            {!msgs.length && (
              <div>
                <p className="text-muted-foreground">Ask about TransAmerica's health, renewal, people or your book.</p>
                <Chips onAsk={send} disabled={busy} />
              </div>
            )}
            {msgs.map(m => {
              if (m.who === 'me') {
                return (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-pretty">{m.text}</p>
                  </div>
                )
              }
              if ('typing' in m) {
                return (
                  <div key={m.id} className="flex gap-1 py-1" role="status" aria-label="Composing an answer">
                    {[0, 160, 320].map(d => (
                      <span key={d} className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                )
              }
              const a = m.answer
              return (
                <div key={m.id} className="min-w-0 max-w-[65ch]">
                  {a.body}
                  {a.chips && <Chips onAsk={send} disabled={busy} />}
                  {!!a.sources?.length && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {a.sources.map(s => (
                        <Tip key={s.label} tip={`Open ${s.label}`}>
                          <button type="button" onClick={() => go(s.route)}
                            className="inline-flex h-6 items-center gap-1 rounded-full border border-border px-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                            <FileText className="size-3" aria-hidden="true" />{s.label}
                          </button>
                        </Tip>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={end} />
          </div>
        </div>

        <form className="border-t border-hairline p-3" onSubmit={e => { e.preventDefault(); submit() }}>
          <InputGroup className="h-auto items-end rounded-2xl">
            <InputGroupTextarea
              ref={input}
              rows={1}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
              placeholder="Ask about TransAmerica…"
              aria-label="Your question"
              className="max-h-[92px] min-h-0 resize-none py-2.5 text-sm leading-5"
            />
            <InputGroupAddon align="inline-end" className="pb-1.5">
              <Tip tip="Send · Enter">
                <InputGroupButton type="submit" size="icon-sm" variant={draft.trim() ? 'default' : 'ghost'} className="rounded-full"
                  disabled={busy || !draft.trim()} aria-label="Send">
                  <ArrowUp aria-hidden="true" />
                </InputGroupButton>
              </Tip>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </SheetContent>
    </Sheet>
  )
}
