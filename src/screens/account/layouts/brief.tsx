/* Option B · Briefing: the account page as one long read, no tabs. A typographic verdict opens it, then numbered
   chapters (renewal, health, adoption, people, activity, market signals) reuse the tab content, un-boxed and split by
   hairlines. A sticky contents list follows the chapter in view; showTab() from any widget scrolls to its chapter. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { TODAY } from '@/data/legacy'
import { useRange } from '@/lib/range'
import { openSheet } from '@/lib/route'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandBg, bandOf, bandText } from '@/components/health'
import { buildVerdict, StickyPageHeader, useCountUp } from '../header'
import { Brief, ListCard, OrderForms } from '../overview'
import { RunwayChart } from '../overview/runway-chart'
import { HeaderSheets } from '../overview/how-sheet'
import { WELL, ATTN } from '../overview/content'
import { HealthTab } from '../health'
import { AdoptionTab } from '../adoption'
import { ActivityTab } from '../activity'
import { StakeholdersTab } from '../stakeholders'
import { IntelligenceTab } from '../intelligence'
import { useTab } from '../tab'
import { ACCT, AREA_NAME, AREA_SHORT, fmtDY, kpis, latest, renewal, score, SCORED_LINE, type AreaKey } from '../facts'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Chapters in reading order. `tab` is the old tab id, so showTab('health') lands on the Health chapter. */
const CHAPTERS = [
  { id: 'verdict', tab: 'overview', title: 'The verdict' },
  { id: 'story', title: 'The story so far' },
  { id: 'renewal', title: 'Renewal' },
  { id: 'health', tab: 'health', title: 'Health' },
  { id: 'adoption', tab: 'adoption', title: 'Adoption and support' },
  { id: 'people', tab: 'stakeholders', title: 'People' },
  { id: 'activity', tab: 'activity', title: 'Activity' },
  { id: 'signals', tab: 'intelligence', title: 'Market signals' },
] as const
type ChapterId = (typeof CHAPTERS)[number]['id']
const num = (i: number) => String(i + 1).padStart(2, '0')

const jump = (id: string) => document.getElementById(`ch-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/** The chapter whose top last crossed the upper third of the viewport. */
function useChapterInView() {
  const [active, setActive] = useState<ChapterId>('verdict')
  useEffect(() => {
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => seen.set(e.target.id.slice(3), e.isIntersecting))
      const hit = CHAPTERS.find(c => seen.get(c.id))
      if (hit) setActive(hit.id)
    }, { rootMargin: '-25% 0px -70% 0px' })
    CHAPTERS.forEach(c => { const el = document.getElementById(`ch-${c.id}`); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])
  return active
}

/** A widget's showTab()/setTab() changes the hash; here that scrolls to the matching chapter instead. */
function useTabScroll() {
  const tab = useTab()
  const prev = useRef<string | null>(null)
  useEffect(() => {
    const first = prev.current == null
    if (prev.current !== tab && tab !== 'overview') {
      const c = CHAPTERS.find(x => 'tab' in x && x.tab === tab)
      if (c) setTimeout(() => document.getElementById(`ch-${c.id}`)?.scrollIntoView({ behavior: first ? 'auto' : 'smooth', block: 'start' }), first ? 400 : 0)
    }
    prev.current = tab
  }, [tab])
}

/* Cards inside chapters lose their box and sit on the page; clickable cards (health areas, news) keep a hairline frame. */
const CSS = `
[data-brief] [data-chapter-body] [data-slot="card"]:not(.group):not(button) {
  background: transparent; box-shadow: none; border-radius: 0; overflow: visible; margin-inline: -1rem; padding-block: 0;
}
[data-brief] [data-chapter-body] .group[data-slot="card"], [data-brief] [data-chapter-body] button[data-slot="card"] {
  box-shadow: none; border: 1px solid var(--hairline); background: transparent;
}
[data-brief] [data-chapter-body] .group[data-slot="card"]:hover, [data-brief] [data-chapter-body] button[data-slot="card"]:hover {
  border-color: color-mix(in oklab, var(--foreground) 22%, transparent); box-shadow: none;
}
[data-brief] [data-chapter-body] { overflow-x: clip; overflow-clip-margin: 4px; }
[data-brief] [data-chapter-body] .bg-card { background-color: var(--background); }
[data-brief] [data-chapter-body] h3 { font-size: 0.9375rem; }
[data-brief] [data-chapter="activity"] [data-chapter-body] > div > div:first-child > h2 { visibility: hidden; width: 0; }
`

export function BriefLayout() {
  const active = useChapterInView()
  useTabScroll()
  return (
    <div data-account data-brief className="flex min-w-0 flex-col pb-32">
      <style>{CSS}</style>
      <StickyPageHeader />
      <MobileContents active={active} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-16 xl:grid-cols-[minmax(0,1fr)_11.5rem]">
        <article className="min-w-0">
          <Opening />
          <Chapter i={1} id="story" dek="What the monthly summaries say, and what is going well or needs attention.">
            <div className="max-w-[72ch]"><Brief /></div>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              <ListCard title="What's going well" items={WELL} tone="good" onArea={k => openSheet('area', k)} />
              <ListCard title="What needs attention" items={ATTN} tone="bad" onArea={k => openSheet('area', k)} />
            </div>
          </Chapter>
          <Chapter i={2} id="renewal" dek={renewalDek()}>
            <div id="runway" className="scroll-mt-40"><RunwayChart /></div>
            <div className="mt-10 max-w-[72ch]"><OrderForms onArea={k => openSheet('area', k)} /></div>
          </Chapter>
          <Chapter i={3} id="health" dek={healthDek()}><HealthTab /></Chapter>
          <Chapter i={4} id="adoption" dek={`${kpis.mau} active users, ${kpis.licence.pct}% of seats in use, net retention ${kpis.nrr}%.`}><AdoptionTab /></Chapter>
          <Chapter i={5} id="people" dek="Who holds each role the renewal needs, and who has gone quiet."><StakeholdersTab /></Chapter>
          <Chapter i={6} id="activity" dek="Every dated statement, meeting and ticket, with the health ribbon to the renewal."><ActivityTab /></Chapter>
          <Chapter i={7} id="signals" dek={`Public news about ${ACCT.name}, ranked by how much it matters to the renewal.`}><IntelligenceTab /></Chapter>
          <p className="mt-24 border-t border-hairline pt-5 text-xs text-muted-foreground">End of brief · {SCORED_LINE}</p>
        </article>
        <Contents active={active} />
      </div>
      <HeaderSheets />
    </div>
  )
}

const renewalDek = () => renewal.daysLeft < 0
  ? `${renewal.carrLabel} was due ${fmtDY(renewal.date)} and is ${-renewal.daysLeft} days overdue.`
  : `${renewal.carrLabel} renews ${fmtDY(renewal.date)}, ${renewal.daysLeft} days from now. ${renewal.signed ? 'Signed.' : 'Nothing signed yet'}${renewal.signed ? '' : `, auto-renew ${renewal.autoRenew ? 'on' : 'off'}.`}`

function healthDek() {
  const [k, v] = (Object.entries(latest.areas) as [AreaKey, number][]).sort((a, b) => a[1] - b[1])[0]
  return `${score.final} overall${score.cap ? `, capped from ${score.weighted}` : ''}. Weakest area: ${AREA_NAME[k]} at ${v}.`
}

/* ---------- contents ---------- */
function Contents({ active }: { active: ChapterId }) {
  return (
    <nav aria-label="Contents" className="hidden xl:block">
      <div className="sticky top-[calc(var(--account-hdr,0px)+2.5rem)] pt-2">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Contents</p>
        <ol className="relative border-l border-hairline">
          {CHAPTERS.map((c, i) => {
            const on = c.id === active
            return (
              <li key={c.id}>
                <button type="button" onClick={() => jump(c.id)} aria-current={on ? 'true' : undefined}
                  className={cn('-ml-px flex w-full items-baseline gap-2.5 border-l py-1.5 pl-3.5 text-left text-[13px] transition-colors', focusRing,
                    on ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  <span className="text-[11px] tabular-nums opacity-70">{num(i)}</span>{c.title}
                </button>
              </li>
            )
          })}
        </ol>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn('mt-5 rounded-sm text-xs text-muted-foreground hover:text-foreground', focusRing)}>Back to top</button>
      </div>
    </nav>
  )
}

/** Below xl: the contents as one scrolling strip under the page header. */
function MobileContents({ active }: { active: ChapterId }) {
  const ref = useRef<HTMLOListElement>(null)
  useEffect(() => { ref.current?.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }, [active])
  return (
    <nav aria-label="Contents" className="sticky top-[var(--account-hdr,0px)] z-20 -mx-1 mb-2 [contain:inline-size] bg-background/90 backdrop-blur-md xl:hidden">
      <ol ref={ref} className="flex gap-1 overflow-x-auto border-b border-hairline px-1 [scrollbar-width:none]">
        {CHAPTERS.map((c, i) => (
          <li key={c.id} className="shrink-0">
            <button type="button" onClick={() => jump(c.id)} aria-current={c.id === active ? 'true' : undefined}
              className={cn('-mb-px flex items-baseline gap-1.5 border-b-2 px-2 py-2.5 text-[13px] whitespace-nowrap transition-colors', focusRing,
                c.id === active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <span className="text-[11px] tabular-nums opacity-70">{num(i)}</span>{c.title}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ---------- chapter frame: number, title, one-line dek, then the body ---------- */
function Chapter({ i, id, dek, children }: { i: number; id: ChapterId; dek?: string; children: React.ReactNode }) {
  const c = CHAPTERS[i]
  return (
    <section id={`ch-${id}`} data-chapter={id} aria-labelledby={`h-ch-${id}`}
      className="mt-24 scroll-mt-[calc(var(--account-hdr,0px)+3.5rem)] border-t border-hairline pt-6 xl:scroll-mt-[calc(var(--account-hdr,0px)+1.5rem)]">
      <header className="mb-10 grid gap-x-6 gap-y-2 md:grid-cols-[3.5rem_minmax(0,1fr)]">
        <span className="pt-1.5 text-sm tabular-nums text-muted-foreground">{num(i)}</span>
        <div className="max-w-[60ch]">
          <h2 id={`h-ch-${id}`} className="text-[28px] leading-tight font-normal tracking-[-0.02em]">{c.title}</h2>
          {dek && <p className="mt-2 text-base leading-relaxed text-muted-foreground">{dek}</p>}
        </div>
      </header>
      <div data-chapter-body>{children}</div>
    </section>
  )
}

/* ---------- 01 The verdict: score, headline, next step, then the figures at a glance and the six areas ---------- */
function Opening() {
  const range = useRange()
  const d = useMemo(() => buildVerdict(range), [range])
  const b = bandOf(score.final)
  const n = useCountUp(score.final)
  const nextM = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(d.next)
  const action = nextM ? d.next.slice(0, nextM.index) : d.next
  const left = nextM ? Math.round((+new Date(`${nextM[1]} ${TODAY.getFullYear()}`) - +TODAY) / 864e5) : null
  return (
    <section id="ch-verdict" data-chapter="verdict" aria-labelledby="h-ch-verdict" className="scroll-mt-40 pt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <span className="tabular-nums">01</span> · Account brief · {SCORED_LINE}
      </p>
      <div className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how scores work`}
              className={cn('group flex flex-col items-start rounded-md text-left', focusRing)}>
              <span className={cn('num text-[112px] leading-[0.85] font-light tracking-[-0.06em]', bandText[b])} aria-hidden="true">{n}</span>
              <span className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn('size-2 rounded-full', bandBg[b])} aria-hidden="true" />
                <span className={bandText[b]}>{BAND_LABEL[b]}</span> · of 100
              </span>
              {score.cap > 0 && <span className="mt-1 text-xs text-muted-foreground group-hover:text-foreground">Capped from {score.weighted} · how it works</span>}
            </button>
          </TooltipTrigger>
          <TooltipContent>{score.cap ? `Weighted ${score.weighted}, −${score.cap} renewal cap` : 'Weighted average, no cap'}</TooltipContent>
        </Tooltip>
        <div className="min-w-0 max-w-[62ch]">
          <h1 id="h-ch-verdict" className="text-[40px] leading-[1.08] font-normal tracking-[-0.03em] text-balance">{d.title}.</h1>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">{d.why}</p>
          {action && (
            <div className="mt-7 border-l-2 border-foreground pl-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Next step</p>
              <p className="mt-1 text-lg leading-snug font-medium">{action}</p>
              {nextM && <p className={cn('mt-1 text-sm tabular-nums', left != null && left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
                Due {nextM[1]}{left != null && ` · ${left < 0 ? `${-left} days late` : left === 0 ? 'today' : `in ${left} days`}`}</p>}
            </div>
          )}
        </div>
      </div>
      <Glance />
      <Areas areas={d.areas} since={d.since} />
    </section>
  )
}

type Tone = 'good' | 'bad' | undefined
const toneCls = (t: Tone) => (t === 'good' ? 'text-good' : t === 'bad' ? 'text-bad' : undefined)

/** The figures a CSM quotes, set as a typographic row, not tiles. */
function Glance() {
  const l = kpis.licence, over = l.used - l.bought, late = renewal.daysLeft < 0
  const items: { label: string; value: React.ReactNode; hint: string; tone?: Tone; onClick?: () => void }[] = [
    { label: late ? 'Overdue by' : 'Renews in', value: <>{Math.abs(renewal.daysLeft)}<span className="ml-1.5 font-sans text-sm font-normal tracking-normal">days</span></>, hint: fmtDY(renewal.date), tone: late || renewal.daysLeft <= 90 ? 'bad' : undefined, onClick: () => jump('renewal') },
    { label: 'Contract value', value: renewal.carrLabel, hint: renewal.autoRenew ? 'Auto-renew on' : 'Auto-renew off' },
    { label: 'Net retention', value: `${kpis.nrr}%`, hint: `GRR ${kpis.grr}%`, tone: kpis.nrr > 100 ? 'good' : kpis.nrr < 100 ? 'bad' : undefined },
    { label: 'Active users', value: kpis.mau, hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} average`, tone: kpis.mauChange > 0 ? 'good' : kpis.mauChange < 0 ? 'bad' : undefined, onClick: () => jump('adoption') },
    { label: 'Licence use', value: `${l.pct}%`, hint: over > 0 ? `${over} seats over` : `${l.used} of ${l.bought} seats`, tone: l.pct >= 100 ? 'good' : l.pct < 70 ? 'bad' : undefined },
    { label: 'Open expansion', value: renewal.expansionLabel, hint: renewal.expansionLabel === '$0' ? 'None open' : 'Unsigned' },
  ]
  return (
    <dl aria-label="At a glance" className="mt-14 grid grid-cols-2 border-y border-hairline sm:grid-cols-3 xl:grid-cols-6">
      {items.map(k => {
        const body = (
          <>
            <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{tc(k.label)}</dt>
            <dd className={cn('num mt-2 text-[26px] leading-none font-light', toneCls(k.tone))}>{k.value}</dd>
            <dd className="mt-1.5 truncate text-xs text-muted-foreground">{k.hint}</dd>
          </>
        )
        return (
          <div key={k.label} className="min-w-0 border-hairline py-5 pr-4 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:nth-child(n+4)]:border-t sm:[&:nth-child(n+4)]:border-hairline xl:[&:nth-child(n+4)]:border-t-0">
            {k.onClick
              ? <button type="button" onClick={k.onClick} className={cn('group block w-full rounded-sm text-left', focusRing)}>{body}</button>
              : body}
          </div>
        )
      })}
    </dl>
  )
}

/** Six areas as one row of labelled bars; each opens its inputs. */
function Areas({ areas, since }: { areas: ReturnType<typeof buildVerdict>['areas']; since: string }) {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium">Area scores</h2>
        <button type="button" onClick={() => jump('health')} className={cn('group inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground', focusRing)}>
          Change since {since}<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 xl:grid-cols-6">
        {areas.map(a => {
          const b = bandOf(a.v)
          return (
            <li key={a.k}>
              <button type="button" onClick={() => openSheet('area', a.k)} aria-label={`${AREA_NAME[a.k]} ${a.v}, ${BAND_LABEL[b]}. Open inputs`}
                className={cn('group block w-full rounded-sm text-left', focusRing)}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground group-hover:text-foreground">{tc(AREA_SHORT[a.k])}</span>
                  {a.d !== 0 && <span className={cn('num text-xs', a.d < 0 ? 'text-bad' : 'text-muted-foreground')}>{a.d < 0 ? '−' : '+'}{Math.abs(a.d)}</span>}
                </span>
                <span className={cn('num mt-1 block text-[22px] leading-none font-light', bandText[b])}>{a.v}</span>
                <span className="mt-2.5 block h-1 overflow-hidden bg-muted" aria-hidden="true">
                  <span className={cn('block h-full transition-[width] duration-700', bandBg[b])} style={{ width: `${Math.max(2, Math.min(100, a.v))}%` }} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
