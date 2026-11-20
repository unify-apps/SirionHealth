/* Option A, the record rail: every fact that does not change with the tab, as one quiet column of key-value rows split
   by hairlines. Identity, health and why, area scores, renewal, next step, key metrics, key people. */
import { useMemo } from 'react'
import { ArrowRight, ChevronLeft, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { useRange } from '@/lib/range'
import { go, openSheet } from '@/lib/route'
import { Skeleton } from '@/components/ui/skeleton'
import { Tip } from '@/components/page'
import { Meter } from '@/components/charts'
import { BAND_LABEL, bandBg, bandOf, bandText } from '@/components/health'
import { ACCT, AREA_KEYS, AREA_NAME, AREA_SHORT, fmtD, fmtDY, kpis, renewal, score, TODAY } from '../../facts'
import { buildVerdict, initials, ScoreRing } from '../../header'
import { showTab, useWidget, WidgetBody } from '../../overview/bits'
import { loadBase, stakeRows } from '../../stakeholders/model'
import { useRoles } from '../../stakeholders/store'
import { Avatar } from '../../stakeholders/parts'

const ring = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
type Verdict = ReturnType<typeof buildVerdict>

/** One rail section: a small caps label (and an optional right-hand note), then its rows. Sections are split by a hairline. */
function Section({ label, note, children, className }: { label: string; note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={cn('border-t border-hairline py-5', className)}>
      <div className="mb-3 flex h-4 items-center gap-2">
        <h2 className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{label}</h2>
        {note && <span className="ml-auto text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  )
}

/** A key-value row: muted label on the left, the value right-aligned in tabular figures. */
function Row({ k, tip, children }: { k: string; tip?: string; children: React.ReactNode }) {
  const label = <span tabIndex={tip ? 0 : undefined} className={cn('truncate rounded-sm text-muted-foreground', tip && cn(ring, 'cursor-help decoration-dotted underline-offset-4 hover:underline'))}>{tc(k)}</span>
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 text-sm">
      {tip ? <Tip tip={tip}>{label}</Tip> : label}
      <span className="flex min-w-0 items-center gap-1.5 text-right">{children}</span>
    </div>
  )
}

export function RecordRail() {
  const range = useRange()
  const w = useWidget(() => buildVerdict(range), [range.id])
  return (
    <div className="flex flex-col">
      <Identity />
      <WidgetBody w={w} what="the health verdict" skeleton={<HealthSkeleton />}>
        {d => <><Health d={d} /><Areas d={d} /></>}
      </WidgetBody>
      {/* below lg the rest of the rail sits in two columns so it doesn't push the tabs a screen down */}
      <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-1">
        <Renewal />
        {w.data?.next ? <NextStep next={w.data.next} /> : <Section label="Next step"><p className="text-sm text-muted-foreground">No data</p></Section>}
        <Metrics />
        <People />
      </div>
    </div>
  )
}

/* ---------- identity ---------- */
function Identity() {
  return (
    <div className="pb-5">
      <button type="button" onClick={() => go('accounts')}
        className={cn('-ml-1.5 mb-4 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm text-muted-foreground hover:bg-hover hover:text-foreground', ring)}>
        <ChevronLeft className="size-4" aria-hidden="true" />My accounts
      </button>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-sm font-medium">{initials(ACCT.name)}</span>
        <div className="min-w-0">
          <h1 className="truncate text-xl leading-tight font-medium tracking-[-0.015em]">{ACCT.name}</h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{[ACCT.ind, ACCT.seg].join(' · ')}</p>
        </div>
      </div>
      <dl className="mt-4 flex flex-wrap gap-1.5 text-xs">
        {[['Region', ACCT.region], ['Stage', ACCT.stage]].map(([k, v]) => (
          <div key={k} className="inline-flex items-center gap-1 rounded-md border border-hairline px-1.5 py-0.5">
            <dt className="text-muted-foreground">{k}</dt><dd>{v || 'No data'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ---------- health: ring, verdict, why ---------- */
function Health({ d }: { d: Verdict }) {
  const b = bandOf(score.final)
  return (
    <Section label="Health" note={<button type="button" onClick={() => openSheet('how')} className={cn('rounded-sm hover:text-foreground hover:underline underline-offset-4', ring)}>How it's scored</button>}>
      <div className="flex items-center gap-4">
        <Tip tip={score.cap ? `Weighted ${score.weighted}, −${score.cap} renewal cap` : 'Weighted average, no cap'}>
          <button type="button" onClick={() => openSheet('how')} aria-label={`Health ${score.final} of 100, ${BAND_LABEL[b]}. See how scores work`}
            className={cn('shrink-0 rounded-full [&_span>span]:num [&_span>span]:font-light', ring)}>
            <ScoreRing value={score.final} size={64} stroke={5} />
          </button>
        </Tip>
        <div className="min-w-0">
          <p className="text-base leading-snug font-medium">{d.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className={bandText[b]}>{BAND_LABEL[b]}</span>
            {score.cap > 0 && <span className="tabular-nums"> · capped from {score.weighted}</span>}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.why}</p>
    </Section>
  )
}

/* ---------- area scores: name, meter, score, change ---------- */
function Areas({ d }: { d: Verdict }) {
  return (
    <Section label="Area scores" note={<span>Change since {d.since}</span>}>
      <ul className="-mx-2 flex flex-col">
        {d.areas.map(a => {
          const b = bandOf(a.v)
          const tip = a.drv ? `Weakest input: ${a.drv.name} ${a.drv.score ?? 'No data'}` : 'No input has data'
          return (
            <li key={a.k}>
              <Tip tip={tip} side="right">
                <button type="button" onClick={() => openSheet('area', a.k)}
                  aria-label={`${AREA_NAME[a.k]} ${a.v ?? 'No data'}, ${BAND_LABEL[b]}. ${tip}. Open inputs`}
                  className={cn('grid h-8 w-full grid-cols-[minmax(0,1fr)_4.5rem_1.75rem_2rem] items-center gap-3 rounded-md px-2 text-left text-sm transition-colors hover:bg-hover', ring)}>
                  <span className="truncate">{tc(AREA_SHORT[a.k])}</span>
                  <Meter value={a.v} fill={bandBg[b]} focusable={false} />
                  <span className={cn('num text-right font-medium', bandText[b])}>{a.v ?? '–'}</span>
                  <span className={cn('num text-right text-xs', a.d < 0 ? 'text-foreground' : 'text-muted-foreground')}>
                    {a.d === 0 ? '0' : `${a.d < 0 ? '−' : '+'}${Math.abs(a.d)}`}
                  </span>
                </button>
              </Tip>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/* ---------- renewal: countdown, then the contract facts ---------- */
function Renewal() {
  const late = renewal.daysLeft < 0, near = late || renewal.daysLeft <= 90
  return (
    <Section label="Renewal">
      <button type="button" onClick={() => showTab('overview', 'runway')}
        aria-label={`${late ? `${-renewal.daysLeft} days overdue` : `${renewal.daysLeft} days left`}. Go to the renewal runway`}
        className={cn('group/nav -mx-2 mb-1 flex items-baseline gap-1.5 rounded-md px-2 py-1 text-left hover:bg-hover', ring)}>
        <span className={cn('num text-[30px] leading-none font-light', near && 'text-bad')}>{Math.abs(renewal.daysLeft)}</span>
        <span className="text-sm text-muted-foreground group-hover/nav:text-foreground">{late ? 'days overdue' : 'days to renewal'}</span>
        <ArrowRight className="ml-auto size-3.5 self-center text-muted-foreground opacity-0 transition-opacity group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100" aria-hidden="true" />
      </button>
      <Row k="Renewal date"><span className="tabular-nums">{fmtDY(renewal.date)}</span></Row>
      <Row k="Contract value" tip="Contracted annual recurring revenue up for renewal"><span className="num">{renewal.carrLabel}</span></Row>
      <Row k="Auto-renew">{renewal.autoRenew ? 'On' : <span className="text-bad">Off</span>}</Row>
      <Row k="Signed commitment">{renewal.signed ? 'Yes' : <span className={cn(near && 'text-bad')}>Not signed</span>}</Row>
    </Section>
  )
}

/* ---------- next step ---------- */
function NextStep({ next }: { next: string }) {
  // "Get a signed renewal commitment by Nov 26": the action, then its due date with days left
  const m = / by ([A-Z][a-z]{2} \d{1,2})$/.exec(next)
  const action = m ? next.slice(0, m.index) : next
  const left = m ? Math.round((+new Date(`${m[1]} ${TODAY.getFullYear()}`) - +TODAY) / 864e5) : null
  return (
    <Section label="Next step">
      <div className="flex gap-3">
        <span className="mt-1.5 size-2 shrink-0 rounded-full border-[1.5px] border-foreground/60" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm leading-snug font-medium">{action}</p>
          {m && left != null && (
            <p className={cn('mt-1 text-xs tabular-nums', left <= 7 ? 'text-bad' : 'text-muted-foreground')}>
              Due {m[1]} · {left < 0 ? `${-left} days late` : left === 0 ? 'today' : `in ${left} days`}
            </p>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ---------- key metrics as key-value rows ---------- */
function Metrics() {
  const l = kpis.licence, over = l.used - l.bought
  const trend = (n: number, tone?: 'good' | 'bad') => n === 0 ? null : n > 0
    ? <TrendingUp className={cn('size-3.5', tone === 'good' ? 'text-good' : 'text-muted-foreground')} aria-hidden="true" />
    : <TrendingDown className={cn('size-3.5', tone === 'bad' ? 'text-bad' : 'text-muted-foreground')} aria-hidden="true" />
  return (
    <Section label="Key metrics">
      <Row k="Net retention" tip="Net revenue retention, last 12 months. Over 100% means the account grew.">
        <span className={cn('num', kpis.nrr > 100 && 'text-good', kpis.nrr < 100 && 'text-bad')}>{kpis.nrr}%</span>
      </Row>
      <Row k="Gross retention" tip="Gross revenue retention, last 12 months"><span className="num">{kpis.grr}%</span></Row>
      <Row k="Active users" tip={`Monthly active users; 12-month average ${kpis.mauAvg}`}>
        {trend(kpis.mauChange, kpis.mauChange > 0 ? 'good' : 'bad')}
        <span className="text-xs text-muted-foreground">{kpis.mauChange > 0 ? '+' : kpis.mauChange < 0 ? '−' : ''}{Math.abs(kpis.mauChange)}%</span>
        <span className="num">{kpis.mau}</span>
      </Row>
      <Row k="Licence use" tip="Seats in use against seats bought. Over 100% is an upsell signal; under 70% is shelfware risk.">
        <span className="text-xs text-muted-foreground">{l.used}/{l.bought}</span>
        <span className={cn('num', l.pct >= 100 && 'text-good', l.pct < 70 && 'text-bad')}>{l.pct}%</span>
        {over > 0 && <span className="sr-only">{over} seats over</span>}
      </Row>
      <Row k="Open expansion" tip="Open expansion opportunity, unsigned, on top of the renewal">
        {renewal.expansionLabel === '$0' ? <span className="text-muted-foreground">None open</span> : <span className="num">{renewal.expansionLabel}</span>}
      </Row>
    </Section>
  )
}

/* ---------- key people: the sponsor and champions from the role tags ---------- */
function People() {
  const roles = useRoles()
  const rows = useMemo(() => stakeRows(loadBase(), roles)
    .filter(r => r.kind === 'tagged' && /^(Executive Sponsor|Champion)/i.test(r.label))
    .sort((a, b) => Number(/Champion/i.test(a.label)) - Number(/Champion/i.test(b.label)))
    .slice(0, 3), [roles])
  return (
    <Section label="Key people" note={<button type="button" onClick={() => showTab('stakeholders')} className={cn('rounded-sm hover:text-foreground hover:underline underline-offset-4', ring)}>All stakeholders</button>}>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No sponsor or champion tagged</p> : (
        <ul className="-mx-2 flex flex-col">
          {rows.map(r => (
            <li key={r.key}>
              <button type="button" onClick={() => openSheet('person', r.key, { tab: 'stakeholders' })}
                className={cn('flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-hover', ring)}>
                <Avatar name={r.name} className="size-7 text-[11px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.label} · {r.last ? `named ${fmtD(r.last)}` : 'never named'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function HealthSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t border-hairline py-5">
      <div className="flex items-center gap-4"><Skeleton className="size-16 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
      <Skeleton className="h-10 w-full" />
      {AREA_KEYS.map(k => <Skeleton key={k} className="h-5 w-full" />)}
    </div>
  )
}
