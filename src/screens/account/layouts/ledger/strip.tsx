/* The hero, two groups side by side: the verdict (score, headline, what drove it) and the renewal (the next step
   leads, then what it is about). The key figures are context and sit lower on the page (summary.tsx). */
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/legacy'
import { useRange } from '@/lib/range'
import { openSheet } from '@/lib/route'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandBg, bandOf, bandText } from '@/components/health'
import { buildVerdict, useCountUp } from '../../header'
import { showTab, Term, useWidget, WidgetBody } from '../../overview/bits'
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

export function VerdictStrip({ d: _d }: { d?: Verdict }) {
  const range = useRange()
  const w = useWidget(() => buildVerdict(range), [range.id])
  return (
    <section aria-labelledby="h-verdict" className="@container pt-6">
      <WidgetBody w={w} what="the health verdict" skeleton={<VerdictStripSkeleton />}>
        {d => <VerdictStripBody d={d} />}
      </WidgetBody>
    </section>
  )
}

function VerdictStripSkeleton() {
  return (
    <div className="grid items-start gap-x-8 gap-y-6 @3xl:grid-cols-[minmax(0,1.5fr)_minmax(14rem,0.75fr)_minmax(15rem,0.85fr)]" aria-hidden="true">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6">
        <div className="flex flex-col items-start gap-2.5">
          <Skeleton className="h-[54px] w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-3.5 w-full max-w-[54ch]" />
          <Skeleton className="h-3.5 w-3/4 max-w-[42ch]" />
        </div>
      </div>
      <div className="grid min-w-0 content-start gap-1.5 @3xl:border-l @3xl:border-hairline @3xl:pl-7">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="mt-0.5 h-5 w-44" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <div className="grid min-w-0 content-start gap-1.5 @3xl:border-l @3xl:border-hairline @3xl:pl-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-0.5 h-5 w-56 max-w-full" />
        <Skeleton className="h-3.5 w-32" />
      </div>
    </div>
  )
}

function VerdictStripBody({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  const n = useCountUp(score.final)
  return (
    <div className="grid items-start gap-x-8 gap-y-6 @3xl:grid-cols-[minmax(0,1.5fr)_minmax(14rem,0.75fr)_minmax(15rem,0.85fr)]">

      {/* 1. how is it: the score and the verdict */}
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how the score works`}
              className={cn('group -m-1 flex flex-col items-start self-start rounded-md p-1 text-left', focusRing)}>
              <span className="num inline-block min-w-[1.05em] text-[68px] leading-[0.8] font-light tracking-[-0.055em] tabular-nums" aria-hidden="true">{n}</span>
              <span className="mt-2.5 flex items-center gap-1.5 text-[13px]">
                <span className={cn('size-2 rounded-full', bandBg[b])} aria-hidden="true" />
                <span className={cn('font-medium', bandText[b])}>{BAND_LABEL[b]}</span>
                <span className="text-muted-foreground">of 100</span>
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{score.cap ? `Weighted ${score.weighted}, held to ${score.final} by the renewal cap` : 'Weighted average of the six areas, no cap'}</TooltipContent>
        </Tooltip>

        <div className="min-w-0">
          <h2 id="h-verdict" className="font-heading text-[32px] leading-[1.08] font-normal tracking-[-0.02em]">{d.title}</h2>
          <p className="mt-1.5 max-w-[58ch] text-[14px] leading-relaxed text-pretty text-muted-foreground">
            {drove(d.why)}{' '}
            <button type="button" onClick={() => openSheet('how')}
              className={cn('rounded-sm whitespace-nowrap text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-current', focusRing)}>
              How the score works
            </button>
          </p>
        </div>
      </div>

      {/* 2. renewal standing and next step, split across two compact columns */}
      <RenewalGroup d={d} />
    </div>
  )
}

function RenewalGroup({ d }: { d: Verdict }) {
  const late = renewal.daysLeft < 0
  const next = splitNext(d.next)
  const state = renewal.signed ? 'signed' : `${renewal.autoRenew ? 'auto-renew on' : 'auto-renew off'}, not signed yet`
  return (
    <>
      <section aria-labelledby="h-renewal" className="min-w-0 self-start @3xl:border-l @3xl:border-hairline @3xl:pl-7">
        <h3 id="h-renewal" className="text-[12px] text-muted-foreground">Renewal</h3>
        <button type="button" onClick={() => showTab('overview', 'runway')}
          aria-label={`${late ? `${-renewal.daysLeft} days overdue since` : `${renewal.daysLeft} days left to`} renewal on ${fmtDY(renewal.date)}, ${renewal.carrLabel}, ${state}. Go to the renewal runway`}
          className={cn('mt-1 block rounded-sm text-left text-[14px] leading-snug text-muted-foreground hover:[&_.lead]:underline hover:[&_.lead]:decoration-hairline hover:[&_.lead]:underline-offset-4', focusRing)}>
          <span className="block">
            <span className="lead text-[18px] font-medium tracking-[-0.015em] text-foreground">
              <span className="num">{Math.abs(renewal.daysLeft)}</span> {late ? 'days overdue' : 'days left'}
            </span>{' '}
            <span>{late ? 'since' : 'to'} {fmtDY(renewal.date)}</span>
          </span>
          <span className="mt-1 block text-[13px]">
            <span className="num font-medium text-foreground">{renewal.carrLabel}</span>, {state}
          </span>
        </button>
      </section>

      {next.action && (
        <section aria-labelledby="h-next-step" className="min-w-0 self-start @3xl:border-l @3xl:border-hairline @3xl:pl-7">
          <h3 id="h-next-step" className="text-[12px] text-muted-foreground">Next step</h3>
          <p className="mt-1 text-[18px] leading-snug font-medium tracking-[-0.015em] text-pretty">
            {next.action}
            {next.due && (
              <span className={cn('mt-1 block text-[13px] font-normal tracking-normal', next.left != null && next.left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
                Due {next.due}, {next.left! < 0 ? `${-next.left!} days late` : next.left === 0 ? 'today' : `in ${next.left} days`}
              </span>
            )}
          </p>
        </section>
      )}
    </>
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
    <dl className="grid grid-cols-2 gap-x-10 gap-y-6">
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

/** Every tab but Summary: the hero folded to one line — score, verdict, renewal, next step — all on one baseline,
 *  split by hairline dividers, closing on the rule the tab's own content opens under. */
export function CompactStrip({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  const late = renewal.daysLeft < 0
  const next = splitNext(d.next)
  const Sep = () => <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-hairline" />
  return (
    <section aria-label="Account standing" className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline pt-5 pb-3.5 text-[13px] text-muted-foreground">
      <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how the score works`}
        className={cn('flex items-center gap-2 rounded-sm', focusRing)}>
        <span className="num text-[20px] leading-none font-normal text-foreground">{score.final}</span>
        <span className={cn('flex items-center gap-1.5', bandText[b])}>
          <span className={cn('size-1.5 rounded-full', bandBg[b])} aria-hidden="true" />
          {BAND_LABEL[b]}
        </span>
      </button>
      <Sep />
      <span className="font-medium text-foreground">{d.title}</span>
      <Sep />
      <button type="button" onClick={() => showTab('overview', 'runway')} className={cn('rounded-sm hover:text-foreground', focusRing)}>
        <span className={cn('num', (late || renewal.daysLeft <= 90) && 'text-bad')}>{Math.abs(renewal.daysLeft)}</span> {late ? 'days overdue' : 'days to renewal'}, <span className="num">{renewal.carrLabel}</span>
      </button>
      {next.action && (
        <>
          <Sep />
          <span className="min-w-0 truncate">Next <span className="text-foreground">{next.action}</span>{next.due && <>, due {next.due}</>}</span>
        </>
      )}
    </section>
  )
}
