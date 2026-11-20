/* The masthead: one open canvas, no cards, read top to bottom in three groups. The score beside the verdict set as
   display type; then the renewal, led by the next step; then why the score is what it is: the cap, the six areas and
   the score's history. Key figures and the rest of the context sit below, quieter, in the summary. */
import { useMemo, useState } from 'react'
import { ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/legacy'
import { useRange, type Range } from '@/lib/range'
import { openSheet } from '@/lib/route'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandBg, bandOf, bandText, type Band } from '@/components/health'
import { buildVerdict, useCountUp } from '../../header'
import { showTab } from '../../overview/bits'
import { AREA_NAME, AREA_SHORT, fmtDY, months, renewal, score, type AreaKey } from '../../facts'
import { NakedRunway } from './runway'
import { CLM } from '../../overview/content'

export const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Same baseline as buildVerdict: the month the range compares against. */
const baseOf = (r: Range) => months[Math.max(0, months.length - 1 - (r.months ?? months.length))]

const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `+${n}`)

/** What the reader is pointing at: an area, or the renewal cap. A fact in the verdict or the renewal lights the area
 *  cell or the cap line it rests on. */
type Hot = AreaKey | 'cap' | null
type HotProps = { hot: Hot; setHot: (h: Hot) => void }

/** The verdict's first sentence restates the renewal, which the renewal group below now carries in full. */
const storyOf = (why: string) => {
  const parts = why.split(/(?<=\.)\s/)
  return parts[0].startsWith(renewal.carrLabel) ? parts.slice(1).join(' ') : why
}

export function Masthead() {
  const range = useRange()
  const d = useMemo(() => buildVerdict(range), [range])
  const base = baseOf(range)
  const [hot, setHot] = useState<Hot>(null)
  const story = storyOf(d.why)
  const named = useMemo(() => namedIn(story), [story])
  return (
    <section aria-labelledby="mh-verdict" className="mh-hero" data-hot={hot ?? undefined}>
      {/* the score beside the verdict on the left, the renewal it is about on the right */}
      <div className="grid gap-x-12 gap-y-10 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,23rem)]">
        <div className="grid content-start gap-x-12 gap-y-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <Score change={score.final - base.final} since={d.since} />
          <div className="min-w-0 md:pt-1">
            <h2 id="mh-verdict" className="text-[40px] leading-[1.05] font-normal tracking-[-0.035em] text-balance">{d.title}.</h2>
            {story && <p className="mt-3 max-w-[46ch] text-[17px] leading-[1.55] text-pretty text-muted-foreground"><Marked text={story} hot={hot} setHot={setHot} /></p>}
          </div>
        </div>
        <Renewal next={d.next} hot={hot} setHot={setHot} />
      </div>
      <Why areas={d.areas} since={d.since} named={named} hot={hot} setHot={setHot} />
    </section>
  )
}

const AREA_BY_SHORT = Object.fromEntries(Object.entries(AREA_SHORT).map(([k, v]) => [v, k])) as Record<string, AreaKey>
/** Facts in the verdict. An area's fall links to that area; money and dates are simply set in full ink. */
const MARK = /((?:Commercial|Adoption|Support|Engagement|Sentiment|Renewal risk) (?:fell|rose) \d+|\$[\d.,]+[KM]?|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b)/g
const targetOf = (p: string): AreaKey | null => {
  const a = /^(.+) (?:fell|rose) \d+$/.exec(p)
  return a && AREA_BY_SHORT[a[1]] ? AREA_BY_SHORT[a[1]] : null
}
/** The areas the verdict names: their change reads in ink below, the rest stay grey. */
function namedIn(text: string): Set<AreaKey> {
  return new Set(text.split(MARK).filter((_, i) => i % 2).map(targetOf).filter((t): t is AreaKey => !!t))
}
function Marked({ text, hot, setHot }: { text: string } & HotProps) {
  return <>{text.split(MARK).map((p, i) => {
    if (i % 2 === 0) return p
    const t = targetOf(p)
    if (!t) return <span key={i} className="text-foreground">{p}</span>
    return (
      <button key={i} type="button" onClick={() => openSheet('area', t)} data-on={hot === t || undefined}
        onPointerEnter={() => setHot(t)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(t)} onBlur={() => setHot(null)}
        aria-label={`${p}. Open ${AREA_NAME[t]} inputs`}
        className={cn('mh-fact rounded-[3px] text-foreground', focusRing)}>{p}</button>
    )
  })}</>
}

/* ---------- 1 · the one hero number ---------- */
function Score({ change, since }: { change: number; since: string }) {
  const b = bandOf(score.final)
  const n = useCountUp(score.final)
  return (
    <div className="flex flex-col items-start">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how the score works`}
            className={cn('-m-1 flex items-baseline rounded-md p-1 text-left', focusRing)}>
            <span className="text-[84px] leading-[0.8] font-light tabular-nums tracking-[-0.055em]" aria-hidden="true">{n}</span>
            <span className="ml-1.5 text-[17px] tabular-nums text-muted-foreground" aria-hidden="true">/100</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{score.cap > 0 ? `Weighted ${score.weighted}, −${score.cap} renewal cap` : 'Weighted average, no cap'}</TooltipContent>
      </Tooltip>
      <p className="mt-4 flex items-center gap-2 text-[15px]">
        <span className={cn('size-2 rounded-full', bandBg[b])} aria-hidden="true" />
        <span className={bandText[b]}>{BAND_LABEL[b]}</span>
        {change !== 0 && <span className="text-muted-foreground"><span className="tabular-nums">{minus(change)}</span> since {since}</span>}
      </p>
      <button type="button" onClick={() => openSheet('how')}
        className={cn('mt-1.5 rounded-sm text-[13px] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground', focusRing)}>
        How the score works
      </button>
    </div>
  )
}

/* ---------- 2 · the renewal: the next step leads, then its facts as one aligned list, paper included ---------- */
function Renewal({ next, hot, setHot }: { next: string } & HotProps) {
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(next)
  const action = m ? next.slice(0, m.index) : next
  const left = m ? Math.round((+new Date(`${m[1]} ${TODAY.getFullYear()}`) - +TODAY) / 864e5) : null
  const late = renewal.daysLeft < 0
  const days = Math.abs(renewal.daysLeft)
  const capped = score.cap > 0 && !renewal.signed
  // the order-form rows, minus the commitment detail line the list does not need; commitment and auto-renew are what
  // the renewal cap waits on, so pointing at them lights the cap below
  const paper = CLM.map(([l, v, detail, area]) => ({ l: l === 'Termination for convenience' ? 'Termination' : l === 'Renewal paper' ? 'Paper' : l, v, detail: l === 'Renewal paper' ? detail : '', area, cap: capped && /Commitment|Auto-renew/.test(l) }))
  return (
    <section aria-labelledby="mh-renewal" className="min-w-0">
      <h2 id="mh-renewal" className="mh-label">Renewal</h2>
      {action && <p className="mt-2 text-[20px] leading-snug font-medium tracking-[-0.018em] text-balance">{action}</p>}
      {m && (
        <p className={cn('mt-1 text-[15px] tabular-nums', left != null && left <= 14 ? 'text-bad' : 'text-muted-foreground')}>
          Due {m[1]}{left != null && `, ${left < 0 ? `${-left} days late` : left === 0 ? 'today' : `in ${left} days`}`}
        </p>
      )}
      <dl className="mh-facts mt-3 border-t border-hairline">
        <div>
          <dt>{late ? 'Overdue' : 'Days left'}</dt>
          <dd>
            <button type="button" onClick={() => showTab('overview', 'runway')}
              aria-label={`${days} days ${late ? 'overdue since' : 'left to'} the renewal on ${fmtDY(renewal.date)}. Go to the score history`}
              className={cn('rounded-sm text-[22px] leading-none tabular-nums tracking-[-0.02em] hover:underline hover:decoration-1 hover:underline-offset-4', focusRing)}>{days}</button>
          </dd>
        </div>
        <div><dt>Renews</dt><dd className="tabular-nums">{fmtDY(renewal.date)}</dd></div>
        <div><dt>Value</dt><dd className="tabular-nums">{renewal.carrLabel}</dd></div>
        {paper.map(p => (
          <div key={p.l}>
            <dt>{p.l}</dt>
            <dd>
              <button type="button" onClick={() => (p.cap ? openSheet('how') : openSheet('area', p.area ?? 'commercial'))} data-on={(p.cap && hot === 'cap') || undefined}
                onPointerEnter={() => p.cap && setHot('cap')} onPointerLeave={() => p.cap && setHot(null)} onFocus={() => p.cap && setHot('cap')} onBlur={() => p.cap && setHot(null)}
                aria-label={p.cap ? `${p.l}: ${p.v}. Holds the score under the renewal cap. See how the score works` : `${p.l}: ${p.v}. Open ${AREA_NAME[p.area ?? 'commercial']} inputs`}
                className={cn('rounded-[3px] text-right', p.cap ? 'mh-fact' : 'hover:underline hover:underline-offset-4', focusRing)}>
                {p.v}{p.detail && <span className="ml-2 text-[13px] text-muted-foreground tabular-nums">{p.detail}</span>}
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ---------- 3 · why the score is what it is: the cap, the six areas, the history ---------- */
function Why({ areas, since, named, hot, setHot }: { areas: ReturnType<typeof buildVerdict>['areas']; since: string; named: Set<AreaKey> } & HotProps) {
  const capped = score.cap > 0
  const b = bandOf(score.final)
  return (
    <section aria-labelledby="mh-why" className="mh-group">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="mh-why" className="mh-label">Why {score.final}</h2>
        <button type="button" onClick={() => showTab('health')}
          className={cn('group inline-flex items-center gap-1 rounded-sm text-[13px] text-muted-foreground hover:text-foreground', focusRing)}>
          Health detail<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </button>
      </div>
      {/* the cap, drawn: the score in its band colour, the points the cap takes away hatched up to the areas' average */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {capped && (
          <button type="button" onClick={() => openSheet('how')} data-on={hot === 'cap' || undefined}
            onPointerEnter={() => setHot('cap')} onPointerLeave={() => setHot(null)} onFocus={() => setHot('cap')} onBlur={() => setHot(null)}
            aria-label={`Areas average ${score.weighted}; the renewal cap holds the score at ${score.final}. See how the score works`}
            className={cn('mh-gauge relative -my-1 block h-4 w-56 shrink-0 rounded-sm', focusRing)}>
            <span className="absolute inset-x-0 top-1/2 block h-1.5 -translate-y-1/2 rounded-full bg-muted" aria-hidden="true">
              <span className={cn('mh-meter absolute inset-y-0 left-0 rounded-full', bandBg[b])} style={{ width: `${Math.min(100, score.final)}%` }} />
              <span className="mh-capped absolute inset-y-0" style={{ left: `${score.final}%`, width: `${score.weighted - score.final}%` }} />
              <span className="absolute -top-1 -bottom-1 w-px bg-foreground/60" style={{ left: `${score.weighted}%` }} />
            </span>
          </button>
        )}
        <p className={cn('mh-cap -mx-1.5 rounded-[4px] px-1.5 text-[15px] text-muted-foreground transition-colors', hot === 'cap' && 'bg-hover')}>
          {capped ? <>
            Areas average <span className="tabular-nums text-foreground">{score.weighted}</span>
            <ArrowRight className="mx-1.5 inline size-3.5 align-[-2px]" aria-label="then" />
            held at <span className="tabular-nums text-foreground">{score.final}</span> by the{' '}
            <button type="button" onClick={() => openSheet('how')} data-on={hot === 'cap' || undefined}
              onPointerEnter={() => setHot('cap')} onPointerLeave={() => setHot(null)} onFocus={() => setHot('cap')} onBlur={() => setHot(null)}
              aria-label={`Renewal cap: holds the score at ${score.final}, ${score.weighted} without it. See how the score works`}
              className={cn('mh-fact rounded-[3px] text-foreground', focusRing)}>renewal cap</button>{' '}
            until the renewal is signed or auto-renew is on.
          </> : <>The weighted average of six areas; no renewal cap applies.</>}
        </p>
      </div>
      <ul className="mh-areas mt-3 grid grid-cols-3 lg:grid-cols-6">
        {areas.map(a => <AreaCell key={a.k} k={a.k} v={a.v} d={a.d} drv={a.drv} since={since} named={named.has(a.k)} on={hot === a.k} setHot={setHot} />)}
      </ul>
      <div id="runway" className="mt-6 scroll-mt-40">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
          <h3 className="font-normal">Score over time, to the renewal</h3>
          <p className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-bad" aria-hidden="true" />Risk event</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border-2 border-good" aria-hidden="true" />Positive event</span>
          </p>
        </div>
        <NakedRunway />
      </div>
    </section>
  )
}

function AreaCell({ k, v, d, drv, since, named, on, setHot }: { k: AreaKey; v: number; d: number; drv: { name: string; score: number | null } | null; since: string; named: boolean; on: boolean; setHot: (h: Hot) => void }) {
  const b: Band = bandOf(v)
  const tip = drv ? `Weakest input: ${drv.name} ${drv.score}` : 'No input has data'
  const series = months.map(m => m.areas[k])
  return (
    <li className="min-w-0" data-on={on || undefined} onPointerEnter={() => setHot(k)} onPointerLeave={() => setHot(null)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => openSheet('area', k)}
            aria-label={`${AREA_NAME[k]} ${v}, ${BAND_LABEL[b]}${d ? `, ${d < 0 ? 'down' : 'up'} ${Math.abs(d)} since ${since}` : ''}. ${tip}. Open inputs`}
            onFocus={() => setHot(k)} onBlur={() => setHot(null)}
            className={cn('group flex w-full flex-col gap-1.5 rounded-md px-3 py-3 text-left transition-colors hover:bg-hover focus-visible:ring-inset focus-visible:ring-offset-0', on && 'bg-hover', focusRing)}>
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground group-hover:text-foreground">
              <span className={cn('size-1.5 shrink-0 rounded-full', bandBg[b])} aria-hidden="true" />
              <span className="truncate">{AREA_SHORT[k]}</span>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-[22px] leading-none font-normal tabular-nums tracking-[-0.02em]">{v}</span>
              {d !== 0 && (
                <span className={cn('inline-flex items-center text-[13px] tabular-nums', named ? 'text-foreground' : 'text-muted-foreground')}>
                  {d < 0 ? <ArrowDownRight className="size-3" aria-hidden="true" /> : <ArrowUpRight className="size-3" aria-hidden="true" />}{Math.abs(d)}
                </span>
              )}
            </span>
            <Spark values={series} band={b} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{d ? `${d < 0 ? 'Down' : 'Up'} ${Math.abs(d)} since ${since} · ` : ''}{tip}</TooltipContent>
      </Tooltip>
    </li>
  )
}

/** A neutral line of every scored month; only the last point carries the band colour. */
function Spark({ values, band }: { values: number[]; band: Band }) {
  const W = 100, H = 20, n = values.length
  if (n < 2) return <span className="h-[20px]" aria-hidden="true" />
  const x = (i: number) => (i / (n - 1)) * (W - 3) + 1.5
  const lo = Math.max(0, Math.min(...values) - 8), hi = Math.min(100, Math.max(...values) + 8), span = Math.max(1, hi - lo)
  const y = (v: number) => H - 2 - ((v - lo) / span) * (H - 4)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <span className="relative block h-[20px] w-full" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <polyline points={pts} fill="none" className="stroke-muted-foreground/50" strokeWidth="1.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* the last point is an HTML dot so it stays round while the line stretches to the cell */}
      <span className={cn('absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full', bandBg[band])}
        style={{ left: `${(x(n - 1) / W) * 100}%`, top: `${(y(values[n - 1]) / H) * 100}%` }} />
    </span>
  )
}

/* ---------- other tabs: the masthead folds to one line, so each tab opens on its own content ---------- */
export function CompactMast() {
  const range = useRange()
  const d = useMemo(() => buildVerdict(range), [range])
  const b = bandOf(score.final)
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(d.next)
  const action = m ? d.next.slice(0, m.index) : d.next
  const late = renewal.daysLeft < 0
  return (
    <section aria-label="Verdict" className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-hairline pb-4">
      <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how the score works`}
        className={cn('flex items-baseline gap-2 rounded-sm', focusRing)}>
        <span className="text-[28px] leading-none tabular-nums tracking-[-0.03em]">{score.final}</span>
        <span className="flex items-center gap-1.5 self-center text-sm"><span className={cn('size-2 rounded-full', bandBg[b])} aria-hidden="true" /><span className={bandText[b]}>{BAND_LABEL[b]}</span></span>
      </button>
      <span className="h-5 w-px bg-hairline" aria-hidden="true" />
      <button type="button" onClick={() => showTab('overview')} className={cn('rounded-sm text-lg tracking-[-0.015em] hover:underline hover:underline-offset-4', focusRing)}>{d.title}.</button>
      <span className="text-sm text-muted-foreground">
        <span className={cn('text-base tabular-nums', (late || renewal.daysLeft <= 90) && 'text-bad')}>{Math.abs(renewal.daysLeft)}</span> {late ? 'days overdue' : 'days left'}
      </span>
      {action && (
        <span className="ml-auto min-w-0 truncate text-sm text-muted-foreground">
          Next: <span className="text-foreground">{action}</span>{m && <span className="tabular-nums">, due {m[1]}</span>}
        </span>
      )}
    </section>
  )
}
