/* The "why" under the verdict: one heading over the runway and the six area scores it is built from. At rest the areas
   show the latest month with the change over the page's date range; while a month is picked on the chart the heading
   names that month (and what happened in it) and the areas show it, with the change on the month before.
   Each area opens its inputs. */
import { cn } from '@/lib/utils'
import { openSheet } from '@/lib/route'
import { BAND_LABEL, bandBg, bandOf } from '@/components/health'
import type { buildVerdict } from '../../header'
import { AREA_KEYS, AREA_NAME, AREA_SHORT, events, fmtD, months, score, ymLabel, type AreaKey } from '../../facts'
import { flagText, monthIndexOf } from './chart'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
type Verdict = ReturnType<typeof buildVerdict>

/** "Why 50", then one quiet line: what the numbers below mean, or the picked month and what happened in it. */
export function WhyHead({ sel }: { sel: number | null }) {
  const m = sel != null ? months[sel] : null
  const happened = m ? events.filter(e => monthIndexOf(e.date) === sel && +e.date <= +m.date + 864e5 && ['neg', 'pos', 'flag'].includes(e.kind)) : []
  const note = m
    ? <>
        <span className="text-foreground tabular-nums">{ymLabel(m.ym)}: {m.final}</span>
        {m.model ? ', flagged' : `, ${BAND_LABEL[bandOf(m.final)].toLowerCase()}`}
        {happened.length > 0 && <>. {happened.slice(-2).map(e => `${fmtD(e.date)} ${flagText(e)}`).join('; ')}</>}
      </>
    : score.cap > 0
      ? <>Held at <b className="font-medium text-foreground tabular-nums">{score.final}</b> by the renewal cap until signed, <b className="font-medium text-foreground tabular-nums">{score.weighted}</b> without it</>
      : <>Weighted average of the six areas, no cap</>
  return (
    <div className="mb-3 flex min-w-0 items-baseline gap-x-3">
      <h2 className="shrink-0 text-[14px] leading-6 font-medium">Why {score.final}</h2>
      <p className={cn('min-w-0 text-[14px] text-muted-foreground', m ? 'truncate' : 'text-pretty')} aria-live="polite">{note}</p>
    </div>
  )
}

export function AreaStrip({ sel, d }: { sel: number | null; d: Verdict }) {
  const i = sel ?? months.length - 1
  const m = months[i]
  if (!m) return null
  const picked = sel != null
  const prev = months[i - 1]
  // red only on the falls the verdict names (its two biggest), and only at rest
  const named = new Set(d.areas.filter(a => a.d < 0).sort((a, b) => a.d - b.d).slice(0, 2).map(a => a.k))
  const rows = AREA_KEYS.map(k => {
    const v = m.areas[k]
    const delta = picked ? (prev ? v - prev.areas[k] : 0) : d.areas.find(a => a.k === k)?.d ?? 0
    return { k, v, delta, hot: !picked && named.has(k) }
  })
  return (
    <div className="mt-5">
      <p className="text-[12px] text-muted-foreground">{picked ? `Areas in ${ymLabel(m.ym)}, change on the month before` : `Areas now, change since ${d.since}`}</p>
      <ul className="mt-2 grid min-w-0 grid-cols-3 gap-x-6 gap-y-4 @3xl:grid-cols-6" aria-label={`Area scores, ${ymLabel(m.ym)}`}>
        {rows.map(r => <Area key={r.k} {...r} />)}
      </ul>
    </div>
  )
}

function Area({ k, v, delta, hot }: { k: AreaKey; v: number; delta: number; hot: boolean }) {
  const b = bandOf(v)
  return (
    <li className="min-w-0">
      <button type="button" onClick={() => openSheet('area', k)}
        aria-label={`${AREA_NAME[k]} ${v}, ${BAND_LABEL[b]}${delta ? `, ${delta < 0 ? 'down' : 'up'} ${Math.abs(delta)}` : ''}. Open inputs`}
        className={cn('group -mx-1.5 -my-1 flex w-[calc(100%+0.75rem)] flex-col rounded-md px-1.5 py-1 text-left transition-colors hover:bg-hover', focusRing)}>
        <span className="flex items-center gap-1.5 truncate text-[12px] text-muted-foreground group-hover:text-foreground">
          <span className={cn('size-1.5 shrink-0 rounded-full', bandBg[b])} aria-hidden="true" />{AREA_SHORT[k]}
        </span>
        <span className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
          <span className="text-[20px] leading-7 font-light tracking-[-0.02em]">{v}</span>
          {delta !== 0 && <span className={cn('text-[12px]', hot ? 'text-bad' : 'text-muted-foreground')}>{delta < 0 ? '−' : '+'}{Math.abs(delta)}</span>}
        </span>
      </button>
    </li>
  )
}
