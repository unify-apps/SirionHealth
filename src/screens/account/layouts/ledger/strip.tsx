/* The hero, two groups side by side: the verdict (score, headline, what drove it) and the renewal (the next step
   leads, then what it is about). The key figures are context and sit lower on the page (summary.tsx). */
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/legacy'
import { openSheet } from '@/lib/route'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandBg, bandOf, bandText } from '@/components/health'
import { buildVerdict, useCountUp } from '../../header'
import { showTab, Term } from '../../overview/bits'
import { fmtDY, kpis, renewal, score } from '../../facts'
import { focusRing } from './bits'

type Verdict = ReturnType<typeof buildVerdict>

/** "Get a signed renewal commitment by Nov 26" -> the action, the due date and the days left to it. */
function splitNext(next: string) {
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(next)
  if (!m) return { action: next, due: null, left: null }
  const due = new Date(`${m[1]} ${TODAY.getFullYear()}`)
  return { action: next.slice(0, m.index), due: m[1], left: Math.round((+due - +TODAY) / 864e5) }
}

/** The verdict's first sentence restates the renewal, which the renewal group already says; keep what drove the score. */
const drove = (why: string) => why.split(/(?<=\.)\s/).slice(1).join(' ') || why

export function VerdictStrip({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  const n = useCountUp(score.final)
  return (
    <section aria-labelledby="h-verdict" className="@container pt-9">
      <div className="grid gap-x-16 gap-y-10 @4xl:grid-cols-[minmax(0,1fr)_19rem] @5xl:grid-cols-[minmax(0,1fr)_22rem]">

        {/* 1. how is it: the score and the verdict */}
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-9">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how the score works`}
                className={cn('group -m-1 flex flex-col items-start self-start rounded-md p-1 text-left', focusRing)}>
                <span className="num inline-block min-w-[1.05em] text-[96px] leading-[0.78] font-light tracking-[-0.055em] tabular-nums" aria-hidden="true">{n}</span>
                <span className="mt-4 flex items-center gap-1.5 text-[13px]">
                  <span className={cn('size-2 rounded-full', bandBg[b])} aria-hidden="true" />
                  <span className={cn('font-medium', bandText[b])}>{BAND_LABEL[b]}</span>
                  <span className="text-muted-foreground">of 100</span>
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{score.cap ? `Weighted ${score.weighted}, held to ${score.final} by the renewal cap` : 'Weighted average of the six areas, no cap'}</TooltipContent>
          </Tooltip>

          <div className="min-w-0">
            <h2 id="h-verdict" className="text-[38px] leading-[1.05] font-normal tracking-[-0.035em]">{d.title}</h2>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-pretty text-muted-foreground">
              {drove(d.why)}{' '}
              <button type="button" onClick={() => openSheet('how')}
                className={cn('rounded-sm whitespace-nowrap text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-current', focusRing)}>
                How the score works
              </button>
            </p>
          </div>
        </div>

        {/* 2. what to do, by when: the renewal, led by its next step */}
        <RenewalGroup d={d} />
      </div>
    </section>
  )
}

function RenewalGroup({ d }: { d: Verdict }) {
  const late = renewal.daysLeft < 0
  const next = splitNext(d.next)
  const state = renewal.signed ? 'signed' : `${renewal.autoRenew ? 'auto-renew on' : 'auto-renew off'}, not signed yet`
  return (
    <section aria-labelledby="h-renewal" className="min-w-0 self-start">
      <h3 id="h-renewal" className="text-[13px] text-muted-foreground">Renewal</h3>
      {next.action && (
        <p className="mt-2 text-[20px] leading-snug font-medium tracking-[-0.015em] text-pretty">
          {next.action}
          {next.due && (
            <span className={cn('mt-1 block text-[15px] font-normal tracking-normal', next.left != null && next.left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
              Due {next.due}, {next.left! < 0 ? `${-next.left!} days late` : next.left === 0 ? 'today' : `in ${next.left} days`}
            </span>
          )}
        </p>
      )}
      <button type="button" onClick={() => showTab('overview', 'runway')}
        aria-label={`${late ? `${-renewal.daysLeft} days overdue since` : `${renewal.daysLeft} days left to`} renewal on ${fmtDY(renewal.date)}, ${renewal.carrLabel}, ${state}. Go to the renewal runway`}
        className={cn('mt-4 block rounded-sm text-left text-[15px] leading-relaxed text-muted-foreground hover:[&_.lead]:underline hover:[&_.lead]:decoration-hairline hover:[&_.lead]:underline-offset-4', focusRing)}>
        <span className="lead font-medium text-foreground"><span className="num">{Math.abs(renewal.daysLeft)}</span> {late ? 'days overdue' : 'days left'}</span>{' '}
        {late ? 'since' : 'to'} {fmtDY(renewal.date)}
        <span className="block"><span className="num text-foreground">{renewal.carrLabel}</span>, {state}</span>
      </button>
    </section>
  )
}

/* ---------- key figures: context, not part of the score. A quiet two-by-two, label over value. ---------- */
export function KeyFigures() {
  const l = kpis.licence, over = l.used - l.bought
  const rows: { label: string; value: string; unit?: string; hint: string; tip: string }[] = [
    { label: 'Net retention', value: String(kpis.nrr), unit: '%', hint: `Gross ${kpis.grr}%, flat on last month`, tip: 'Net and gross revenue retention, last 12 months. Over 100% means the account grew.' },
    { label: 'Active users', value: kpis.mau.toLocaleString(), hint: `${Math.abs(kpis.mauChange)}% ${kpis.mauChange < 0 ? 'below' : 'above'} the 12-month average`, tip: `Monthly active users; 12-month average ${kpis.mauAvg.toLocaleString()}` },
    { label: 'Licence use', value: String(l.pct), unit: '%', hint: over > 0 ? `${over} seats over the ${l.bought.toLocaleString()} bought` : `${l.used.toLocaleString()} of ${l.bought.toLocaleString()} seats`, tip: 'Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.' },
    { label: 'Open expansion', value: renewal.expansionLabel, hint: renewal.expansionLabel === '$0' ? 'No opportunity open' : 'Unsigned, on top of the renewal', tip: 'Open expansion opportunity on this account' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-10 gap-y-6 border-t border-hairline pt-4">
      {rows.map(r => (
        <div key={r.label} className="min-w-0">
          <dt className="text-[13px] text-muted-foreground"><Term tip={r.tip}>{r.label}</Term></dt>
          <dd className="mt-1">
            <span className="num text-[15px]">{r.value}{r.unit}</span>
            <span className="block truncate text-[13px] text-muted-foreground">{r.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Every tab but Summary: the hero folded to one line, so the tab opens on its own content. */
export function CompactStrip({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  const late = renewal.daysLeft < 0
  const next = splitNext(d.next)
  return (
    <section aria-label="Account standing" className="flex min-w-0 flex-wrap items-baseline gap-x-8 gap-y-1 pt-6 text-sm">
      <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how the score works`}
        className={cn('flex items-baseline gap-2 rounded-sm', focusRing)}>
        <span className="num text-[26px] leading-none font-light">{score.final}</span>
        <span className="flex items-center gap-1.5 self-center">
          <span className={cn('size-2 rounded-full', bandBg[b])} aria-hidden="true" />
          <span className={bandText[b]}>{BAND_LABEL[b]}</span>
        </span>
      </button>
      <span className="text-[15px] font-medium">{d.title}</span>
      <button type="button" onClick={() => showTab('overview', 'runway')} className={cn('rounded-sm text-muted-foreground hover:text-foreground', focusRing)}>
        <span className={cn('num', (late || renewal.daysLeft <= 90) && 'text-bad')}>{Math.abs(renewal.daysLeft)}</span> {late ? 'days overdue' : 'days to renewal'}, {renewal.carrLabel}
      </button>
      {next.action && (
        <span className="min-w-0 text-muted-foreground">
          Next: <span className="text-foreground">{next.action}</span>{next.due && <>, due {next.due}</>}
        </span>
      )}
    </section>
  )
}
