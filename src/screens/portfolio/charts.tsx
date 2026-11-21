import { useMemo, useState } from 'react'
import { ArrowRight, ChartBar } from 'lucide-react'
import { bandOf, bandText } from '@/components/health'
import { SplitBar } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { listPager, RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { go, openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Term } from '../account/overview/bits'
import { EmptyState, LoadingLabel, SplitSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { AccountsTable, META, SheetListHead } from './accounts-table'
import { carrK, moneyK, plural, type StageInfo } from './data'
import { useScope } from './scope'

/** Stages coloured by lifecycle phase: one hue per phase, the phase's first stage in a lighter tint (mixed with the
 *  card so it holds in light and dark). Never green/amber/red: those mean health. Stages outside the lifecycle go to Other. */
const tint = (c: string) => `color-mix(in oklab, ${c} 55%, var(--card))`
const PHASE_DEF = [
  { label: 'Not yet live', hue: 'var(--chart-1)', stages: ['Pending kick-off', 'Implementation'] },
  { label: 'Live', hue: 'var(--chart-2)', stages: ['BAU + Implementation', 'BAU'] },
  { label: 'Leaving', hue: 'var(--chart-4)', stages: ['Expected churn', 'Churned'] },
]
const LIGHT = new Set(['Pending kick-off', 'BAU + Implementation', 'Churned'])
const PHASE_OF: Record<string, (typeof PHASE_DEF)[number]> = Object.fromEntries(PHASE_DEF.flatMap(p => p.stages.map(st => [st, p])))
/** A stage's colour, the same in every scope. */
const colorOf = (stage: string) => { const p = PHASE_OF[stage]; return p ? (LIGHT.has(stage) ? tint(p.hue) : p.hue) : 'var(--chart-4)' }

/** The stage card's view of a summary: phases with their stages, the stages that open a sheet, and share wording. */
function useStages() {
  const { summary: S } = useScope()
  return useMemo(() => {
    const phases = [
      ...PHASE_DEF.map(p => ({ label: p.label, stages: S.stages.filter(s => p.stages.includes(s.stage)) })),
      { label: 'Other', stages: S.stages.filter(s => !PHASE_OF[s.stage]) },
    ].filter(p => p.stages.length)
    /** Whole percent of the scope's CARR, with small non-zero shares shown as under 1%. */
    const share = (k: number) => (!k || !S.book.carr ? '0%' : (k / S.book.carr) * 100 < 0.5 ? 'Under 1%' : S.share(k))
    return { S, phases, share, open: S.stages.filter(s => s.accounts > 0) }
  }, [S])
}

export function StagesChart({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  const { S, phases: PHASES, share, open: OPEN } = useStages()
  const sheet = useSheet()
  const stage = sheet?.type === 'stage' ? OPEN.find(s => s.stage === sheet.id) ?? null : null
  const open = (s: StageInfo) => openSheet('stage', s.stage, { replace: !!stage })
  // hovering or focusing a stage lights its segment in the bar
  const [hot, setHot] = useState<string | null>(null)

  return (
    <Card data-block className="gap-0 py-0">
      <BlockHeader icon={ChartBar} title={<><Term>CARR</Term> by stage</>} />
      <div className="px-5 py-4">
        {status === 'loading' && <><LoadingLabel what="CARR by stage" /><SplitSkeleton layout="columns" /></>}
        {status === 'error' && <WidgetError title="Stage data didn't load" sub="The stage chart timed out. Other sections are up to date." onRetry={onRetry} />}
        {status === 'ready' && !S.book.carr && <EmptyState title="No CARR by stage" sub={`No account in ${S.name} carries CARR yet.`} />}
        {status === 'ready' && S.book.carr > 0 && (
          <>
            <SplitBar label="CARR by stage" legend={false}
              parts={S.stages.map(s => ({ key: s.stage, label: s.stage, value: s.carr / 1000, color: colorOf(s.stage) }))}
              format={m => moneyK(m * 1000)} selected={hot ?? stage?.stage} onSelect={k => { const s = OPEN.find(x => x.stage === k); if (s) open(s) }} />
            <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-3">
              {PHASES.map(ph => {
                const k = carrK(ph.stages.flatMap(s => s.list))
                return (
                  <section key={ph.label} aria-label={`${ph.label}: ${moneyK(k)}, ${share(k)} of ${S.name}`} className="min-w-0">
                    <p className="text-xs text-muted-foreground">{ph.label}</p>
                    <p className="mt-0.5 mb-1.5 flex items-baseline gap-2 tabular-nums">
                      <span className="text-lg">{moneyK(k)}</span>
                      <span className="text-xs text-muted-foreground">{share(k)}</span>
                    </p>
                    <ul className="grid">
                      {ph.stages.map(s => {
                        const cells = (
                          <>
                            <span className="size-2 shrink-0 rounded-[2px]" style={{ background: colorOf(s.stage) }} aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{s.stage}</span>
                            <span className="tabular-nums">{moneyK(s.carr)}</span>
                          </>
                        )
                        return (
                          <li key={s.stage}>
                            {s.accounts ? (
                              <button type="button" aria-haspopup="dialog" onClick={() => open(s)}
                                aria-label={`${s.stage}: ${moneyK(s.carr)}, ${share(s.carr)} of ${S.name}. See accounts`}
                                onPointerEnter={() => setHot(s.stage)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(s.stage)} onBlur={() => setHot(null)}
                                className="-mx-2 flex h-7 w-[calc(100%+1rem)] cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring">
                                {cells}
                              </button>
                            ) : (
                              <div className="flex h-7 items-center gap-2 text-sm text-muted-foreground">{cells}</div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </div>
      <StageSheet stage={stage} />
    </Card>
  )
}

/** `#portfolio?sheet=stage:<name>`: every account in one stage, within the page's scope. Previous/next step through the stages that have accounts. */
function StageSheet({ stage: current }: { stage: StageInfo | null }) {
  const { S, share, open: OPEN } = useStages()
  const s = useKept(current)
  return (
    <RecordSheet open={!!current} onOpenChange={sheetOpenChange} size="lg" view={s?.stage ?? ''}
      pager={listPager(OPEN, s, x => x.stage, x => openSheet('stage', x.stage, { replace: true }), 'stages')}>
      {s && (
        <>
          <RecordSheetHeader eyebrow="Stage"
            title={<span className="flex items-center gap-2"><span className="size-2.5 rounded-[3px]" style={{ background: colorOf(s.stage) }} aria-hidden="true" />{s.stage}</span>}
            meta={<>{plural(s.accounts, 'account')} · {moneyK(s.carr)} · {share(s.carr)} of {S.name} · {s.health == null
              ? 'no accounts scored' : <>average health <span className={cn('font-medium tabular-nums', bandText[bandOf(s.health)])}>{s.health}</span></>}</>} />
          <RecordSheetBody className="px-6 py-5">
            <SheetListHead list={s.list} title={`${plural(s.accounts, 'account')} in ${s.stage}`} order="largest first" />
            <AccountsTable key={s.stage} list={s.list} meta={META.podIndustry} grr={s.stage === 'Churned'} />
          </RecordSheetBody>
          <RecordSheetFooter>
            <Button variant="outline" size="sm" onClick={() => go('accounts', /Implementation/.test(s.stage) ? 'view=impl' : undefined)}>
              Open in My accounts<ArrowRight aria-hidden="true" />
            </Button>
          </RecordSheetFooter>
        </>
      )}
    </RecordSheet>
  )
}
