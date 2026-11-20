/* Option F · Runway (?layout=runway). The renewal runway is the page's hero: an open, unframed chart of monthly health
   that runs on past today to the renewal at its right edge, where the countdown and the next step sit as the line's
   destination. A quiet identity line and the verdict sit above it; scrubbing a month fills the strip beneath with that
   month's six area scores. Below: underline tabs, and on Summary the remaining sections as ruled, unboxed blocks. */
import './runway.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { useRange } from '@/lib/range'
import { go, openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DateRangeMenu } from '@/components/app/date-range'
import { listPager } from '@/components/app/record-sheet'
import { BAND_LABEL, bandBg, bandOf, bandText } from '@/components/health'
import { TABS } from '../index'
import { setTab, useTab } from '../tab'
import { buildVerdict, initials, useCountUp } from '../header'
import { HeaderSheets } from '../overview/how-sheet'
import { EventSheet } from '../overview/runway-chart'
import { ACCT, events, fmtDY, renewal, score, TODAY } from '../facts'
import { RunwayPlot, startFor } from './runway/chart'
import { AreaStrip, WhyHead } from './runway/strip'
import { RunwaySummary } from './runway/summary'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function RunwayLayout() {
  const tab = useTab()
  const range = useRange()
  const d = useMemo(() => buildVerdict(range), [range])
  const [sel, setSel] = useState<number | null>(null)
  const summary = tab === 'overview'
  const [tabsRef, docked] = useDocked()
  // the open event lives in the URL (?sheet=event:<iso>); prev/next walks the events in date order
  const sheet = useSheet()
  const openEv = sheet?.type === 'event' ? events.find(e => e.iso === sheet.id) ?? null : null
  const pager = listPager(events, openEv, e => e.iso, e => openSheet('event', e.iso, { replace: true }), 'event')

  return (
    <div data-account data-runway className="flex min-w-0 flex-col pb-24">
      <Identity />

      {/* the hero, one grid: verdict over the runway on the left; the destination (renewal, next step) on the right, its
          left rule standing where the line meets the renewal. Summary gets the full runway, flags and the area strip;
          other tabs get one compact line over a 48px sparkline. */}
      <section aria-label="Verdict and renewal runway" id="runway"
        className={cn('@container scroll-mt-24', summary ? 'mt-8' : 'mt-7')}>
        <div className="grid grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_16.5rem]">
          <div className="min-w-0 @3xl:pr-10">
            {summary ? <Verdict d={d} /> : <CompactVerdict d={d} />}
          </div>
          <Destination next={d.next} compact={!summary} />
          {/* the why: what makes up the score, one heading over the runway and the six areas it is built from */}
          <div className={cn('min-w-0 @3xl:pr-10', summary ? 'mt-14' : 'mt-3')}>
            {summary && <WhyHead sel={sel} />}
            <RunwayPlot t0={startFor(range)} sel={summary ? sel : null} onSel={summary ? setSel : () => {}} compact={!summary} />
            {summary && <AreaStrip sel={sel} d={d} />}
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={v => { setSel(null); setTab(v) }} className={cn('gap-0', summary ? 'mt-5' : 'mt-6')}>
        <div ref={tabsRef} className={cn('rw-tabs sticky top-0 z-20 -mx-4 flex items-center gap-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8', docked && 'is-docked')}>
          <TabsList variant="line" className="h-auto! min-w-0 flex-1 justify-start gap-6 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="h-11 flex-none rounded-none border-0 bg-transparent px-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:ring-0 focus-visible:outline-none focus-visible:after:opacity-100 data-active:bg-transparent data-active:font-medium data-active:text-foreground data-active:shadow-none dark:data-active:border-0 dark:data-active:bg-transparent after:absolute group-data-horizontal/tabs:after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 data-active:after:opacity-100 focus-visible:after:bg-ring">{t.label}</TabsTrigger>
            ))}
          </TabsList>
          {/* once the tab bar docks, it carries the three facts the hero showed */}
          <div aria-hidden={!docked} className={cn('hidden shrink-0 items-baseline gap-4 text-[13px] transition-opacity duration-200 md:flex', docked ? 'opacity-100' : 'pointer-events-none opacity-0')}>
            <span className="font-medium">{ACCT.name}</span>
            <span className="tabular-nums">{score.final} <span className={bandText[bandOf(score.final)]}>{BAND_LABEL[bandOf(score.final)]}</span></span>
            <span className={cn('tabular-nums', renewal.daysLeft <= 90 && 'text-bad')}>{renewal.daysLeft < 0 ? `${-renewal.daysLeft} days overdue` : `${renewal.daysLeft} days`}</span>
          </div>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="flex flex-col gap-6 pt-8 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
            {t.id === 'overview' ? <RunwaySummary /> : <t.C />}
          </TabsContent>
        ))}
      </Tabs>

      <HeaderSheets />
      <EventSheet event={openEv} onOpenChange={sheetOpenChange} pager={pager} />
    </div>
  )
}

/** True once the tab bar has stuck to the top of the window. */
function useDocked() {
  const ref = useRef<HTMLDivElement>(null)
  const [docked, setDocked] = useState(false)
  useEffect(() => {
    const on = () => { const el = ref.current; if (el) setDocked(el.getBoundingClientRect().top <= 0.5) }
    on()
    window.addEventListener('scroll', on, { passive: true, capture: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on, { capture: true }); window.removeEventListener('resize', on) }
  }, [])
  return [ref, docked] as const
}

/* ---------- identity: back link, monogram, name and the plain facts about the account; the date range on the right ---------- */
function Identity() {
  return (
    <header className="flex flex-col gap-3">
      <button type="button" onClick={() => go('accounts')}
        className={cn('-ml-1.5 inline-flex items-center gap-1 self-start rounded-md px-1.5 py-0.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground', focusRing)}>
        <ChevronLeft className="size-4" aria-hidden="true" />My accounts
      </button>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">{initials(ACCT.name)}</span>
          <h1 className="truncate text-xl leading-tight font-medium tracking-[-0.02em]">{tc(ACCT.name)}</h1>
          <ul className="hidden min-w-0 items-center gap-3 truncate text-sm text-muted-foreground md:flex" aria-label="Account facts">
            {[ACCT.ind, ACCT.seg, ACCT.region, ACCT.stage].map(s => <li key={s} className="rw-fact">{s}</li>)}
          </ul>
        </div>
        <DateRangeMenu />
      </div>
    </header>
  )
}

/* ---------- verdict: the score, its band, the headline and the sentence that explains it ---------- */
function ScoreButton({ size }: { size: 'lg' | 'sm' }) {
  const b = bandOf(score.final)
  const n = useCountUp(score.final)
  const lg = size === 'lg'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how scores work`}
          className={cn('group -m-1 flex rounded-md p-1 text-left', lg ? 'flex-col items-start' : 'items-baseline gap-2', focusRing)}>
          <span aria-hidden="true" className={cn('inline-block min-w-[2ch] font-light tabular-nums tracking-[-0.04em]', lg ? 'text-[88px] leading-[0.8]' : 'text-[30px] leading-none')}>{n}</span>
          <span aria-hidden="true" className={cn('flex items-center gap-1.5 text-[12px] leading-none', lg && 'mt-3')}>
            <span className={cn('size-1.5 rounded-full', bandBg[b])} />
            <span className={bandText[b]}>{BAND_LABEL[b]}</span>
            <span className="ml-1 text-muted-foreground group-hover:text-foreground">of 100</span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{score.cap ? `Weighted ${score.weighted}, −${score.cap} renewal cap` : 'Weighted average, no cap'}. How scores work</TooltipContent>
    </Tooltip>
  )
}

/** The verdict's sentence without its renewal clause: the renewal group beside it already says the money, date and
 *  auto-renew, so the verdict keeps only the falls that explain the score. */
function whyFalls(why: string) {
  const rest = why.replace(/^.*?(?:off|yet|unsigned)\.\s+/, '')
  return rest && rest !== why ? rest : why
}

function Verdict({ d }: { d: ReturnType<typeof buildVerdict> }) {
  return (
    <section aria-labelledby="h-verdict" className="grid items-start gap-x-10 gap-y-4 @xl:[grid-template-columns:auto_minmax(0,1fr)]">
      <ScoreButton size="lg" />
      <div className="min-w-0">
        <h2 id="h-verdict" className="text-[44px] leading-[1.05] font-normal tracking-[-0.03em] text-balance">{d.title}</h2>
        <p className="mt-2.5 max-w-[60ch] text-[16px] leading-[1.55] text-pretty text-muted-foreground">
          {whyFalls(d.why)}{' '}
          <button type="button" onClick={() => openSheet('how')}
            className={cn('rounded-sm whitespace-nowrap text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground', focusRing)}>
            How the score works
          </button>
        </p>
      </div>
    </section>
  )
}

/** Other tabs: the verdict as one line, the score, its band and the headline. */
function CompactVerdict({ d }: { d: ReturnType<typeof buildVerdict> }) {
  return (
    <section aria-labelledby="h-verdict" className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <ScoreButton size="sm" />
      <h2 id="h-verdict" className="text-xl leading-tight font-normal tracking-[-0.02em]">{d.title}</h2>
    </section>
  )
}

/* ---------- destination: where the line ends. The countdown, the money, auto-renew, and what to do before then ---------- */
function Destination({ next, compact }: { next: string; compact: boolean }) {
  const late = renewal.daysLeft < 0
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(next)
  const action = m ? next.slice(0, m.index) : next
  const due = m ? new Date(`${m[1]} ${TODAY.getFullYear()}`) : null
  const left = due ? Math.round((+due - +TODAY) / 864e5) : null
  const dueLine = m && (
    <p className={cn('mt-1 text-[12px] tabular-nums', left != null && left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
      Due {m[1]}{left != null && (left < 0 ? `, ${-left} days late` : left === 0 ? ', today' : `, in ${left} days`)}
    </p>
  )
  if (compact) return (
    <aside aria-label="Renewal and next step"
      className="rw-dest flex min-w-0 flex-col gap-3 border-hairline max-@3xl:mt-3 max-@3xl:flex-row max-@3xl:flex-wrap max-@3xl:gap-x-8 @3xl:row-span-2 @3xl:border-l @3xl:pl-6">
      <p className="flex items-baseline gap-2">
        <span className={cn('text-[30px] leading-none font-light tabular-nums tracking-[-0.04em]', late && 'text-bad')}>{Math.abs(renewal.daysLeft)}</span>
        <span className="text-[14px] text-muted-foreground">{late ? 'days overdue' : 'days to renewal'}</span>
      </p>
      {action && <div className="min-w-0"><p className="text-[14px] leading-snug font-medium text-pretty">{action}</p>{dueLine}</div>}
    </aside>
  )
  // one group: the next step leads, then how long is left, then the renewal and its contract as quiet rows. This is the
  // only place on Summary that holds the contract facts (the separate order forms section went: it repeated them).
  const row = 'contents'
  return (
    <aside aria-labelledby="h-renewal"
      className="rw-dest min-w-0 border-hairline max-@3xl:mt-10 max-@3xl:border-t max-@3xl:pt-6 @3xl:row-span-2 @3xl:border-l @3xl:pl-7">
      <h2 id="h-renewal" className="text-[14px] leading-6 font-medium">Renewal</h2>
      {action && (
        <>
          <p className="mt-1 text-[20px] leading-[1.25] font-medium tracking-[-0.015em] text-pretty">{action}</p>
          {m && (
            <p className={cn('mt-1.5 text-[14px] tabular-nums', left != null && left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
              Due {m[1]}{left != null && (left < 0 ? `, ${-left} days late` : left === 0 ? ', today' : `, in ${left} days`)}
            </p>
          )}
        </>
      )}
      <p className={cn('mt-4 text-[16px] font-medium tabular-nums', late && 'text-bad')}>
        {Math.abs(renewal.daysLeft)} days {late ? 'overdue' : 'left'}
        <span className="ml-2 text-[14px] font-normal text-muted-foreground">{late ? 'since' : 'to'} {fmtDY(renewal.date)}</span>
      </p>
      <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[14px] tabular-nums">
        <div className={row}><dt className="text-muted-foreground">Value</dt><dd className="text-right">{renewal.carrLabel} ARR</dd></div>
        <div className={row}><dt className="text-muted-foreground">Signed</dt><dd className="text-right">{renewal.signed ? 'Yes' : 'Not yet'}</dd></div>
        <div className={row}><dt className="text-muted-foreground">Auto-renew</dt><dd className="text-right">{renewal.autoRenew ? 'On' : 'Off'}</dd></div>
        <div className={row}><dt className="text-muted-foreground">Termination</dt><dd className="text-right">{renewal.tfc ? 'Convenience clause' : 'No convenience clause'}</dd></div>
        <div className={row}>
          <dt className="text-muted-foreground">Order forms</dt>
          <dd className="text-right">
            {renewal.orderForms.map(o => <span key={o.id} className="block">{o.id.replace(/^\w+ /, '')} <span className="text-muted-foreground">${o.value}K</span></span>)}
          </dd>
        </div>
      </dl>
    </aside>
  )
}
