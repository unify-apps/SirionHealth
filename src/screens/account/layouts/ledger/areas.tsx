/* The signature: the six health areas on one shared 0-100 scale. Every row's bar starts at the same zero and ends at
   its score, a mark shows where the area stood at the baseline and the gap between them is hatched, so a fall reads
   as distance on the same scale, and one "Healthy 70" line runs down through all six rows. A row says three things:
   the area, where it sits on the scale (bar and score) and how far it fell (hatch and change). The bar carries the
   band colour; figures stay in ink, except a zero, which is a state and reads in red. A closing Score row turns the
   six into the score: their average and the renewal cap that holds it. Each area's inputs open in its sheet. */
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { openSheet } from '@/lib/route'
import { BAND_LABEL, bandOf, type Band } from '@/components/health'
import type { Range } from '@/lib/range'
import { buildVerdict } from '../../header'
import { AREA_NAME, AREA_SHORT, months, renewal, score } from '../../facts'
import { focusRing, signed } from './bits'

type Verdict = ReturnType<typeof buildVerdict>

const FILL: Record<Band, string> = {
  good: 'var(--ledger-fill)', none: 'var(--ledger-fill)', warn: 'var(--warn)', bad: 'var(--bad)',
}
/** Hatch colour for the gap between now and the baseline: the band's colour where it signals, grey otherwise. */
const GAP: Record<Band, string> = {
  good: 'var(--ledger-gap)', none: 'var(--ledger-gap)', warn: 'color-mix(in oklab, var(--warn) 55%, transparent)', bad: 'color-mix(in oklab, var(--bad) 55%, transparent)',
}

/** Same baseline buildVerdict uses: one month back per month of range, the first month for lifetime. */
const baseIndex = (r: Range) => Math.max(0, months.length - 1 - (r.months ?? months.length))
const pct = (v: number) => `${Math.max(0, Math.min(100, v))}%`

/** The key, inline: what the bar, the hatch and the line mean. */
export function AreaKey({ since }: { since: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground" aria-hidden="true">
      <span className="flex items-center gap-1.5"><span className="h-[6px] w-4 rounded-l-full bg-[var(--ledger-fill)]" />Now</span>
      <span className="flex items-center gap-1.5">
        <span className="flex items-center"><span className="ledger-gap h-[6px] w-4 text-[var(--ledger-gap)]" /><span className="h-3 w-[2px] rounded-full bg-[var(--ledger-mark)]" /></span>
        Fall since {since}
      </span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-[var(--ledger-70)]" />Healthy 70</span>
    </span>
  )
}

/** The scale cell: track, the Healthy 70 line, and whatever sits on it. */
function Scale({ children }: { children?: React.ReactNode }) {
  return (
    <span className="relative h-full min-w-0" aria-hidden="true">
      <span className="absolute inset-y-0 left-[70%] w-px bg-[var(--ledger-70)]" />
      <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--ledger-track)]" />
      {children}
    </span>
  )
}

const ROW = 'ledger-areas-grid group/row relative isolate w-full items-center text-left'
const Hover = () => <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -inset-x-3 -z-10 rounded-md transition-colors group-hover/row:bg-hover" />
const Chevron = () => <ChevronRight className="size-4 justify-self-end text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100" aria-hidden="true" />

export function AreaLedger({ d, range }: { d: Verdict; range: Range }) {
  const from = baseIndex(range)
  // the falls the verdict names read in ink; the rest of the changes stay grey
  const named = new Set(d.areas.filter(a => a.d < 0).sort((a, b) => a.d - b.d).slice(0, 2).map(a => a.k))
  return (
    <div className="@container" data-ledger-areas>
      <ul className="pt-2">
        {d.areas.map(a => {
          const b = bandOf(a.v)
          const base = months[from].areas[a.k]
          const drv = a.drv
          const zero = a.v === 0
          // the bar and the fall share one edge: the bar ends exactly where the hatch starts, both at the score
          const fell = base > a.v
          return (
            <li key={a.k}>
              <button type="button" onClick={() => openSheet('area', a.k)}
                aria-label={`${AREA_NAME[a.k]}: ${a.v}, ${BAND_LABEL[b]}. ${a.d ? `${a.d < 0 ? 'Down' : 'Up'} ${Math.abs(a.d)} from ${base} since ${d.since}.` : `Flat since ${d.since}.`} ${drv ? `Weakest input ${drv.name}, ${drv.score}.` : ''} Open inputs`}
                className={cn(ROW, 'h-[44px]', focusRing, 'focus-visible:rounded-md')}>
                <Hover />
                <span className="min-w-0 truncate text-[15px]">{AREA_SHORT[a.k]}</span>
                <Scale>
                  {fell && <span className="ledger-gap absolute top-1/2 h-[8px] -translate-y-1/2" style={{ left: pct(a.v), width: `calc(${pct(base)} - ${pct(a.v)})`, color: GAP[b] }} />}
                  {zero ? (
                    // a zero is a state, not a missing bar: a red end-mark on the zero and what it means
                    <>
                      <span className="absolute top-1/2 left-0 h-[18px] w-[3px] -translate-y-1/2 rounded-full bg-bad" />
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[13px] whitespace-nowrap text-bad">
                        {a.k === 'renewalRisk' && !renewal.signed ? 'Nothing signed' : 'At zero'}
                      </span>
                    </>
                  ) : (
                    <span className="absolute top-1/2 left-0 h-[8px] -translate-y-1/2 rounded-l-full"
                      style={{ width: pct(a.v), background: FILL[b], borderTopRightRadius: fell ? 0 : 9999, borderBottomRightRadius: fell ? 0 : 9999 }} />
                  )}
                  {a.v !== base && <span className="absolute top-1/2 h-[18px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ledger-mark)]" style={{ left: pct(base) }} />}
                </Scale>
                <span className={cn('num text-right text-[15px] font-medium', zero && 'text-bad')}>{a.v}</span>
                <span className={cn('num text-right text-[15px]', named.has(a.k) ? 'text-foreground' : 'text-muted-foreground')}>{signed(a.d)}</span>
                <Chevron />
              </button>
            </li>
          )
        })}
        <ScoreRow />
      </ul>
    </div>
  )
}

/** The closing line, so the arithmetic reads: six areas, their average, and the score the renewal cap holds it to. */
function ScoreRow() {
  const capped = score.cap > 0
  return (
    <li className="mt-2 border-t border-hairline pt-2">
      <button type="button" onClick={() => openSheet('how')}
        aria-label={capped ? `Score ${score.final}: the areas average ${score.weighted}, held at ${score.final} by the renewal cap. See how the score works` : `Score ${score.final}, the weighted average of the six areas. See how the score works`}
        className={cn(ROW, 'h-[52px]', focusRing, 'focus-visible:rounded-md')}>
        <Hover />
        <span className="min-w-0 truncate text-[15px] font-medium">Score</span>
        <Scale>
          <span className="absolute top-1/2 left-0 h-[10px] -translate-y-1/2 rounded-l-full bg-foreground" style={{ width: pct(score.final), borderRadius: capped ? '9999px 0 0 9999px' : 9999 }} />
          {capped && <>
            <span className="absolute top-1/2 h-[10px] -translate-y-1/2 border border-l-0 border-dashed border-foreground/45" style={{ left: pct(score.final), width: `calc(${pct(score.weighted)} - ${pct(score.final)})` }} />
            <span className="absolute -top-0.5 text-[13px] whitespace-nowrap text-muted-foreground" style={{ left: pct(score.weighted), transform: 'translateX(-100%)' }}>
              average <span className="num">{score.weighted}</span>, held at <span className="num">{score.final}</span> by the renewal cap
            </span>
          </>}
        </Scale>
        <span className="num text-right text-[15px] font-medium">{score.final}</span>
        <span className="num text-right text-[15px] text-muted-foreground">{capped ? signed(-score.cap) : ''}</span>
        <Chevron />
      </button>
    </li>
  )
}
