/* F · Runway: the hero chart. Monthly health as one ink line on an open page, two reference lines labelled where they sit,
   the flagged months as a thin rail on the baseline, the few events that matter flagged above the line, and the line
   running on (dashed, held by the cap) to the renewal at the right edge, where the destination column picks it up.
   Hover, drag or arrow keys pick a month; the parent shows that month's six area scores under the chart. */
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { STRONG } from '@/data/legacy'
import { fmtTick } from '@/lib/dates'
import { rangeStart, type Range } from '@/lib/range'
import { openSheet } from '@/lib/route'
import { BAND_LABEL, bandOf } from '@/components/health'
import { summarise } from '../../activity/model'
import { ACCT, events, fmtD, months, RENEWAL, score, TODAY, ymLabel, type KeyEvent, type Month } from '../../facts'

const DAY = 864e5
/** A month's score sits mid-month, so it lines up under its month label. */
export const mid = (m: Month) => +new Date(m.date.getFullYear(), m.date.getMonth(), 15)
const FIRST = months.length ? +new Date(months[0].date.getFullYear(), months[0].date.getMonth(), 1) : +TODAY

/** Left edge for a range: the first of the month the range starts in, never before the first scored month. */
export function startFor(r: Range) {
  const s = rangeStart(r)
  return s ? Math.max(FIRST, +new Date(s.getFullYear(), s.getMonth(), 1)) : FIRST
}
/** Right edge: the renewal, or today when the renewal has passed. */
export const END = Math.max(+RENEWAL, +TODAY, months.length ? mid(months[months.length - 1]) + 10 * DAY : 0)

/** Health at time t, read off the drawn line (straight between months), flat after the last month. */
function healthAt(t: number) {
  const pts = months.map(m => [mid(m), m.final] as const)
  if (!pts.length) return 0
  if (t <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
  }
  return pts[pts.length - 1][1]
}

/** Which events earn a written flag: strong negatives first, then positives, then other risks; newest first within each. */
const weight = (e: KeyEvent) => (e.kind === 'neg' && STRONG.test(e.text) ? 3 : e.kind === 'pos' ? 2 : e.kind === 'neg' ? 1 : 0)
const MAX_LABEL = 50
/** A short, whole label for an event, or null when it cannot be said in two lines without cutting a word.
 *  Drops the account's own name and asides in brackets; after "Name:" keeps the name and the first clause;
 *  otherwise keeps the clause before a colon, then the first comma clause, then drops a trailing "and ...". */
export function shortLabel(text: string): string | null {
  const own = ACCT.name.split(/\s+/)[0]
  let t = text.replace(new RegExp(`\\b${own}\\s+`, 'gi'), '').replace(/\s*\([^)]*\)/g, '').trim()
  const colon = t.indexOf(':')
  if (t.length > MAX_LABEL && colon > 0) {
    const head = t.slice(0, colon), tail = t.slice(colon + 1).trim()
    t = head.split(/\s+/).length <= 3 ? `${head}: ${tail.split(/,\s*/)[0]}` : head
  }
  if (t.length > MAX_LABEL) t = t.split(/,\s*/)[0]
  if (t.length > MAX_LABEL) t = t.replace(/\s+and\s+.*$/, '')
  t = t.replace(/[.;,]+$/, '')
  return t.length <= MAX_LABEL ? t.charAt(0).toUpperCase() + t.slice(1) : null
}
/** Label for lists that can cut: the short label, or a word-boundary summary. */
export const flagText = (e: KeyEvent) => shortLabel(e.text) ?? summarise(e.text, 52)

const LABEL_W = 210, LANE_H = 34, AXIS_H = 24, CLEAR = 28

type Placed = { e: KeyEvent; x: number; y: number; lane: 0 | 1; side: 'r' | 'l' }

/** Greedy placement in two lanes above the plot: a flag never overlaps another, and its leader never runs through one. */
function placeFlags(cands: { e: KeyEvent; x: number; y: number }[], W: number, max: number): Placed[] {
  const out: Placed[] = []
  const span = (p: { x: number; side: 'r' | 'l' }) => (p.side === 'r' ? [p.x, p.x + LABEL_W] : [p.x - LABEL_W, p.x]) as [number, number]
  const hit = (a: [number, number], b: [number, number]) => a[0] < b[1] + 16 && b[0] < a[1] + 16
  for (const c of [...cands].sort((a, b) => weight(b.e) - weight(a.e) || +b.e.date - +a.e.date)) {
    if (out.length >= max || weight(c.e) === 0 || !shortLabel(c.e.text)) continue
    // one flag per cluster: anchors at least 40px apart, so leaders never crowd
    if (out.some(o => Math.abs(o.x - c.x) < 40)) continue
    const sides: ('r' | 'l')[] = c.x + LABEL_W <= W ? ['r', 'l'] : ['l']
    let done = false
    for (const lane of [0, 1] as const) {
      for (const side of sides) {
        if (side === 'l' && c.x - LABEL_W < 0) continue
        const s = span({ x: c.x, side })
        const clash = out.some(o => (o.lane === lane && hit(s, span(o)))
          // a lane-0 leader runs down through lane 1: keep lane-1 labels off it, and the other way round
          || (lane === 1 && o.lane === 0 && o.x > s[0] - CLEAR && o.x < s[1] + CLEAR)
          || (lane === 0 && o.lane === 1 && c.x > span(o)[0] - CLEAR && c.x < span(o)[1] + CLEAR))
        if (!clash) { out.push({ ...c, lane, side }); done = true; break }
      }
      if (done) break
    }
  }
  return out
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function RunwayPlot({ t0, sel, onSel, compact = false }: {
  t0: number
  /** index into `months` of the picked month, null = none (the latest shows) */
  sel: number | null
  onSel: (i: number | null) => void
  compact?: boolean
}) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const H = compact ? 48 : 214
  const top = compact ? 6 : LANE_H * 2 + 8
  const bottom = H - (compact ? 4 : AXIS_H)
  const t1 = END
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W
  const vals = months.map(m => m.final)
  const lo = Math.max(0, Math.min(30, Math.floor((Math.min(...vals, 50) - 12) / 10) * 10))
  const y = (v: number) => bottom - ((v - lo) / (100 - lo)) * (bottom - top)

  // the line keeps the month just before the window, so it enters from the left edge
  const firstIn = months.findIndex(m => mid(m) >= t0)
  const from = firstIn < 0 ? months.length - 1 : Math.max(0, firstIn - 1)
  const shown = months.map((m, i) => ({ m, i })).slice(from)
  const last = months[months.length - 1]
  const pts = shown.map(({ m }) => [x(mid(m)), y(m.final)] as const)
  const line = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join('')
  const area = pts.length ? `${line}L${pts[pts.length - 1][0].toFixed(1)},${bottom}L${pts[0][0].toFixed(1)},${bottom}Z` : ''
  const ahead = last && t1 > mid(last)

  const visEvents = useMemo(() => events.filter(e => +e.date >= t0 && +e.date <= t1 && ['neg', 'pos', 'goal'].includes(e.kind)), [t0, t1])
  const flags = useMemo(() => (compact || !W ? [] : placeFlags(visEvents.filter(e => +e.date <= +TODAY).map(e => ({ e, x: x(+e.date), y: y(healthAt(+e.date)) })), W, 2)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visEvents, W, compact, t0, lo])

  // month ticks: every month on short windows, every third on long ones; none that would collide with Today or the end
  const ticks: number[] = []
  const step = t1 - t0 < 200 * DAY ? 1 : 3
  for (let d = new Date(t0); +d < t1; d = new Date(d.getFullYear(), d.getMonth() + step, 1)) ticks.push(+d)
  const todayX = x(+TODAY), endX = W
  const renX = x(+RENEWAL)
  const tickOk = (t: number) => Math.abs(x(t) - todayX) > 44 && endX - x(t) > 56 && x(t) >= 0 && (+RENEWAL >= t1 || Math.abs(x(t) - renX) > 70)

  // scrubbing: nearest scored month in the window
  const pick = (px: number) => {
    let best = shown[0]?.i ?? null, d = Infinity
    shown.forEach(({ m, i }) => { const dd = Math.abs(x(mid(m)) - px); if (mid(m) >= t0 - 20 * DAY && dd < d) { d = dd; best = i } })
    return best
  }
  const onMove = (ev: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    onSel(pick(ev.clientX - r.left))
  }
  const firstSel = shown.find(({ m }) => mid(m) >= t0)?.i ?? shown[0]?.i ?? 0
  const onKey = (k: React.KeyboardEvent) => {
    const cur = sel ?? months.length - 1
    const next = k.key === 'ArrowLeft' ? Math.max(firstSel, cur - 1) : k.key === 'ArrowRight' ? Math.min(months.length - 1, cur + 1)
      : k.key === 'Home' ? firstSel : k.key === 'End' ? months.length - 1 : undefined
    if (k.key === 'Escape') { onSel(null); return }
    if (next != null) { k.preventDefault(); onSel(next) }
  }

  const selM = sel != null ? months[sel] : null
  const label = `Monthly health from ${fmtTick(t0)} to ${last ? ymLabel(last.ym) : ''}, now ${score.final}. Use the arrow keys to read each month's area scores.`

  return (
    <div ref={ref} className="relative min-w-0" style={{ height: H }}>
      {W > 0 && last && (
        <>
          <svg width={W} height={H} className="absolute inset-0 overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="rw-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--rw-line)" stopOpacity={compact ? 0.08 : 0.06} />
                <stop offset="1" stopColor="var(--rw-line)" stopOpacity="0" />
              </linearGradient>
              <clipPath id={compact ? 'rw-clip-c' : 'rw-clip'}><rect x={0} y={0} width={W} height={H} /></clipPath>
            </defs>

            {/* 70 is the healthy line, 40 the at-risk line; both labelled where they start */}
            <line x1={0} x2={W} y1={y(70)} y2={y(70)} stroke="var(--muted-foreground)" strokeOpacity={0.3} strokeDasharray="2 4" />
            {lo < 40 && !compact && <line x1={0} x2={W} y1={y(40)} y2={y(40)} stroke="var(--muted-foreground)" strokeOpacity={0.3} strokeDasharray="2 4" />}
            {!compact && <line x1={0} x2={W} y1={bottom} y2={bottom} stroke="var(--hairline)" />}

            {/* a renewal that has already passed sits inside the plot, in red */}
            {+RENEWAL < t1 && +RENEWAL > t0 && <line x1={x(+RENEWAL)} x2={x(+RENEWAL)} y1={top - 4} y2={bottom} stroke="var(--bad)" strokeOpacity={0.6} strokeDasharray="2 3" />}
            {/* today */}
            {+TODAY > t0 && +TODAY < t1 && <line x1={todayX} x2={todayX} y1={top - 4} y2={bottom} stroke="var(--foreground)" strokeOpacity={0.28} strokeDasharray="1 3" />}

            <g clipPath={`url(#${compact ? 'rw-clip-c' : 'rw-clip'})`}>
              <path d={area} fill="url(#rw-fill)" />
              <path d={line} fill="none" stroke="var(--rw-line)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            </g>
            {/* held by the cap until signed: the line runs on, dotted, to the renewal */}
            {ahead && <line x1={x(mid(last))} x2={endX} y1={y(last.final)} y2={y(last.final)} stroke="var(--rw-line)" strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="1 5" strokeLinecap="round" />}

            {/* flag leaders */}
            {flags.map(f => {
              const ly = 4 + f.lane * LANE_H + LANE_H - 8
              return <line key={f.e.iso + f.e.text} x1={f.x} x2={f.x} y1={4 + f.lane * LANE_H} y2={f.y - 6} stroke="var(--foreground)" strokeOpacity={0.22} data-ly={ly} />
            })}

            {/* scrub cursor */}
            {selM && <line x1={x(mid(selM))} x2={x(mid(selM))} y1={top - 4} y2={bottom} stroke="var(--foreground)" strokeOpacity={0.35} />}
            {selM && <circle cx={x(mid(selM))} cy={y(selM.final)} r={4.5} fill="var(--background)" stroke="var(--rw-line)" strokeWidth={2} />}

            {/* the last scored month, and the destination ring at the renewal */}
            {!selM && <circle cx={x(mid(last))} cy={y(last.final)} r={3.5} fill="var(--rw-line)" stroke="var(--background)" strokeWidth={2} />}
            {ahead && <circle cx={endX} cy={y(last.final)} r={5} fill="var(--background)" stroke="var(--foreground)" strokeWidth={2} />}
          </svg>

          {/* inline labels for the reference lines (HTML, so they take the app's type) */}
          {!compact && (
            <span className={cn('rw-ref pointer-events-none absolute', Math.abs(last.final - 70) < 9 ? 'left-0' : 'right-1')} style={{ top: y(70) - 17 }}>
              Healthy above 70
            </span>
          )}
          {lo < 40 && !compact && (
            <span className="rw-ref pointer-events-none absolute left-0" style={{ top: y(40) + 3 }}>
              At risk below 40
            </span>
          )}

          {/* event flags */}
          {flags.map(f => (
            <button key={f.e.iso + f.e.text} type="button" onClick={() => openSheet('event', f.e.iso)}
              onPointerEnter={() => onSel(monthIndexOf(f.e.date))}
              aria-label={`${fmtD(f.e.date)}: ${f.e.text}. Open evidence`} title={f.e.text}
              className={cn('rw-flag absolute block text-left', f.side === 'l' && 'text-right')}
              style={{ top: 4 + f.lane * LANE_H, width: LABEL_W, left: f.side === 'r' ? f.x + 7 : f.x - LABEL_W - 7 }}>
              <span className="block text-[12px] leading-4 text-pretty text-muted-foreground">
                <span className="mr-1.5 text-muted-foreground tabular-nums">{fmtD(f.e.date)}</span>
                {shortLabel(f.e.text)}
              </span>
            </button>
          ))}

          {/* x axis: month ticks, Today, and the renewal under the right edge */}
          {!compact && <>
          <div className="pointer-events-none absolute inset-x-0" style={{ top: bottom + 6 }} aria-hidden="true">
            {ticks.filter(tickOk).map(t => (
              <span key={t} className={cn('absolute text-[12px] text-muted-foreground tabular-nums', x(t) > 24 && '-translate-x-1/2')} style={{ left: x(t) }}>{fmtTick(t)}</span>
            ))}
            {+TODAY > t0 && +TODAY < t1 && <span className="absolute -translate-x-1/2 text-[12px] font-medium text-foreground" style={{ left: todayX }}>Today</span>}
            {+TODAY >= t1 && <span className="absolute right-0 text-[12px] font-medium text-foreground">Today</span>}
            {+RENEWAL < t1 && +RENEWAL > t0 && <span className="absolute -translate-x-1/2 text-[12px] text-bad tabular-nums" style={{ left: x(+RENEWAL) }}>Renewal {fmtD(RENEWAL)}</span>}
          </div>

          {/* interaction surface: pointer scrubbing and keyboard months; event markers sit above it */}
          <div tabIndex={0} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={months.length - 1}
            aria-valuenow={sel ?? months.length - 1}
            aria-valuetext={`${ymLabel((selM ?? last).ym)}: health ${(selM ?? last).final}, ${BAND_LABEL[bandOf((selM ?? last).final)]}`}
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={e => { if (e.pointerType === 'mouse') onSel(null) }}
            onKeyDown={onKey} onBlur={() => onSel(null)}
            className="rw-surface absolute inset-x-0 cursor-crosshair touch-pan-y rounded-md outline-none"
            style={{ top: top - 6, height: bottom - top + 6 }} />

          {/* event markers: risk filled, positive a ring; each opens its evidence */}
          {visEvents.filter(e => e.kind !== 'goal' || +e.date > +TODAY).map(e => {
            const future = +e.date > mid(last)
            const cx = x(+e.date), cy = future ? y(last.final) : y(healthAt(+e.date))
            const tone = e.kind === 'pos' ? 'pos' : e.kind === 'goal' ? 'goal' : 'neg'
            return (
              <button key={e.iso + e.text} type="button" onClick={() => openSheet('event', e.iso)}
                onPointerEnter={() => onSel(monthIndexOf(e.date))}
                aria-label={`${fmtD(e.date)}: ${e.text}. Open evidence`} title={`${fmtD(e.date)}: ${e.text}`}
                className="rw-mark absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none"
                style={{ left: cx, top: cy }} data-tone={tone} data-compact={compact || undefined}
                data-quiet={(e.kind !== 'goal' && !flags.some(f => f.e === e)) || undefined}>
                <span aria-hidden="true" />
              </button>
            )
          })}
          </>}

          {/* value read-out next to the cursor */}
          {selM && (
            <span className="pointer-events-none absolute rounded bg-foreground px-1.5 py-0.5 text-[12px] tabular-nums text-background"
              style={{ left: Math.min(W - 40, x(mid(selM)) + 8), top: y(selM.final) - 28 }}>{selM.final}</span>
          )}
        </>
      )}
    </div>
  )
}

/** The scored month an event falls in (or the latest, for events after it). */
export function monthIndexOf(d: Date) {
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const i = months.findIndex(m => m.ym === ym)
  return i < 0 ? months.length - 1 : i
}
