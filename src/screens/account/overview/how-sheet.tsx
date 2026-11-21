/* openHow + breakdown, as a right side sheet: one vertical calculation (area scores -> weighted average -> renewal cap
   -> health score) with the numbers in one right-hand column, then Bands and Renewal runway as two equal cards,
   then the flag rules as two rule cards. */
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { RecordSheet, RecordSheetBody, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Meter } from '@/components/charts'
import { BAND_LABEL, bandBg, bandOf, bandText, HealthPill } from '@/components/health'
import {
  ACCT, AREA_KEYS, AREA_NAME, AREA_SHORT, AREA_SOURCE, areaDriver, fmtD, fmtDY, latest, RENEWAL, renewal, runway, score, SCORED_LINE,
  TODAY, ymLabel, type AreaKey,
} from '../facts'
import { AREA_ICON, CapTerm } from './bits'
import { AreaContent } from './area-sheet'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** One calculation step: number on the connector line, title and one short muted line, value in the numeric column. */
function Step({ n, title, value, valueClass, children, last }: {
  n: string; title: React.ReactNode; value?: React.ReactNode; valueClass?: string; children?: React.ReactNode; last?: boolean
}) {
  return (
    <li className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 pb-5 last:pb-0">
      {!last && <span className="absolute top-7 bottom-1 left-3 w-px -translate-x-1/2 bg-border" aria-hidden="true" />}
      <span className="relative z-10 grid size-6 place-items-center rounded-full bg-muted text-xs tabular-nums text-muted-foreground">{n}</span>
      {/* title and value share one row, so the number sits right where you read the step, not in a far column */}
      <div className="grid min-w-0 gap-2">
        <div className="flex min-h-6 items-center gap-3">
          <span className="font-medium">{title}</span>
          {value != null && <span className={cn('ml-auto text-lg leading-6 tabular-nums tracking-tight', valueClass)}>{value}</span>}
        </div>
        {children && <div className="text-sm text-muted-foreground [&_p]:text-sm">{children}</div>}
      </div>
    </li>
  )
}


const isArea = (k: string): k is AreaKey => (AREA_KEYS as readonly string[]).includes(k)
const HOW = { type: 'how', id: '' }

/** The sheets the account header owns, read from the URL: "How scores work" (?sheet=how) and an area
 *  (?sheet=area:<key>), alone or drilled into from How (&from=how), where Esc and the back button return to How.
 *  The header renders on every tab, so any tab's opener can call openSheet('area', key). An area opened from
 *  All inputs (&from=inputs) belongs to the Health tab instead. */
export function HeaderSheets() {
  const sheet = useSheet()
  const mine = sheet && (sheet.type === 'how' || (sheet.type === 'area' && isArea(sheet.id) && (!sheet.from || sheet.from.type === 'how'))) ? sheet : null
  const shown = useKept(mine)
  const area = shown?.type === 'area' ? (shown.id as AreaKey) : null
  return (
    <RecordSheet open={!!mine} onOpenChange={sheetOpenChange} size="lg" view={shown ? shown.type + shown.id : undefined}
      back={area && shown?.from?.type === 'how' ? { label: 'How scores work', onBack: () => openSheet('how', '', { replace: true }) } : undefined}>
      {shown?.type === 'how' && <HowScoresBody onOpenArea={k => openSheet('area', k, { from: HOW, replace: true })} />}
      {area && <AreaContent area={area} />}
    </RecordSheet>
  )
}

function HowScoresBody({ onOpenArea }: { onOpenArea: (k: AreaKey) => void }) {
  return (
    <>
        <RecordSheetHeader eyebrow="Method" title="How scores work" meta={SCORED_LINE} />
        <RecordSheetBody>
        <div className="flex flex-col gap-6 p-6">
          <ol aria-label={score.cap ? `Weighted ${score.weighted} minus cap ${score.cap} equals ${score.final}` : `Weighted ${score.weighted}, no cap, equals ${score.final}`}>
            <Step n="1" title="Area Scores">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AREA_KEYS.map(k => <AreaTile key={k} k={k} onOpen={() => onOpenArea(k)} />)}
              </ul>
            </Step>
            <Step n="2" title="Weighted Average" value={score.weighted}>
              <p className="text-muted-foreground">Sirion CS ops set each area's weight; the weights aren't stored in the health record.</p>
            </Step>
            <Step n="3" title={<CapTerm focusable={false}>Renewal Cap</CapTerm>} value={score.cap ? `−${score.cap}` : '0'}>
              <p className="line-clamp-2 text-muted-foreground">
                {score.cap ? `Renewal ${score.snapshotDays} days out with auto-renew off holds health at 50. It lifts once signed or auto-renew is on.`
                  : renewal.autoRenew ? 'No cap: auto-renew is on.' : renewal.daysLeft < 0 ? 'No cap: the cap only applies in the 60 days before a renewal, and this one has passed.' : 'No cap: the renewal is more than 60 days out.'}
              </p>
            </Step>
            <Step n="=" title={<span className="flex items-center gap-2">Health Score<HealthPill value={score.final} /></span>} value={score.final} valueClass={cn('font-medium', bandText[bandOf(score.final)])} last />
          </ol>

          {/* four equal cards on one structure: small title row, then the content. Bands and runway explain this
              account's score; the two rule sets explain when any account is flagged. */}
          <div className="grid auto-rows-fr gap-3 md:grid-cols-2">
            <InfoCard title="Bands">
              <BandScale />
            </InfoCard>
            {runway && (
              <InfoCard title="Renewal Runway" aside={<span className="tabular-nums"><span className="font-medium text-bad">{Math.abs(runway.left)} days</span> {runway.left < 0 ? 'overdue' : 'left'}</span>}>
                <RunwayTimeline />
              </InfoCard>
            )}
            <InfoCard title="Flag Rules" aside="In use">
              <ul className="grid gap-2.5 text-sm">
                <RuleRow>Composite under 70 <Arrow /> Watch</RuleRow>
                <RuleRow>Composite under 40 <Arrow /> At risk</RuleRow>
                <RuleRow>Renewal within 60 days, auto-renew off <Arrow /> capped at 50</RuleRow>
              </ul>
            </InfoCard>
            <InfoCard title="Early Warning" aside={<Badge variant="outline" className="h-5 font-normal">Proposed</Badge>}>
              <ul className="grid gap-2.5 text-sm">
                <RuleRow>Any area under 50 <Arrow /> Flag</RuleRow>
                <RuleRow>Composite down 8+ in a month <Arrow /> Flag</RuleRow>
              </ul>
            </InfoCard>
          </div>
        </div>
        </RecordSheetBody>
    </>
  )
}

function AreaTile({ k, onOpen }: { k: AreaKey; onOpen: () => void }) {
  const v = latest.areas[k], b = bandOf(v), drv = areaDriver(k), Icon = AREA_ICON[k]
  const tip = drv ? `Weakest input: ${drv.name} ${drv.score}` : 'No input has data'
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onOpen} aria-label={`${AREA_NAME[k]} ${v}, ${BAND_LABEL[b]}. ${tip}. Open inputs`}
            className={cn('flex h-full w-full flex-col gap-2.5 rounded-lg border border-hairline px-3 py-2.5 text-left text-foreground transition-colors hover:bg-hover', focusRing)}>
            <span className="flex items-start gap-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{AREA_SHORT[k]}</span>
                <span className="block text-[11px] leading-4 text-muted-foreground">{AREA_SOURCE[k] === 'ai' ? 'AI-scored' : 'Rule-based'}</span>
              </span>
              <span className={cn('text-base font-medium tabular-nums', bandText[b])}>{v}</span>
            </span>
            <Meter value={v} min={2} fill={bandBg[b]} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </li>
  )
}

/* ---------- bands: one 0-100 scale with the account's score on it ---------- */
const ZONES = [
  { from: 0, to: 40, label: 'At risk', range: 'under 40', fill: 'bg-bad-fill/25' },
  { from: 40, to: 70, label: 'Watch', range: '40 to 69', fill: 'bg-warn-fill/25' },
  { from: 70, to: 100, label: 'Healthy', range: '70+', fill: 'bg-good-fill/25' },
] as const

function BandScale() {
  return (
    <div className="space-y-3">
      <div className="relative pt-5">
        <Marker at={score.final} label={`${score.final}`} tip={`${ACCT.name}: ${score.final}${score.cap ? ', after the renewal cap' : ''}`} />
        {score.cap > 0 && <Marker at={score.weighted} label={`${score.weighted}`} hollow tip={`Uncapped weighted score: ${score.weighted}`} />}
        <div className="flex h-2.5 gap-0.5">
          {ZONES.map(z => (
            <span key={z.label} className={cn('h-full first:rounded-l-full last:rounded-r-full', z.fill)} style={{ width: `${z.to - z.from}%` }} />
          ))}
        </div>
      </div>
      <div className="flex text-xs">
        {ZONES.map(z => (
          <div key={z.label} className="min-w-0 pr-2" style={{ width: `${z.to - z.from}%` }}>
            <div>{z.label}</div>
            <div className="tabular-nums text-muted-foreground">{z.range}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Marker({ at, label, tip, hollow }: { at: number; label: string; tip: string; hollow?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} aria-label={tip}
          className={cn('absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center gap-0.5 rounded-sm', focusRing)}
          style={{ left: `${at}%` }}>
          <span className={cn('text-[10px] leading-3 tabular-nums', hollow ? 'text-muted-foreground' : 'font-medium text-foreground')}>{label}</span>
          <span className={cn('mt-0.5 size-3 rounded-full border-2', hollow ? 'border-muted-foreground bg-popover' : 'border-popover bg-foreground')} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/* ---------- renewal runway: flagged -> cleared -> today -> renewal ---------- */
function RunwayTimeline() {
  const r = runway!
  const t0 = +r.firstFlag, t1 = Math.max(+RENEWAL, +TODAY)
  const at = (d: Date) => Math.min(100, Math.max(0, ((+d - t0) / (t1 - t0)) * 100))
  const points: { d: Date; top: string; sub: string; kind: 'flag' | 'clear' | 'today' | 'end' }[] = [
    { d: r.firstFlag, top: 'Flagged', sub: fmtD(r.firstFlag), kind: 'flag' as const },
    ...r.cleared.map(c => ({ d: c.date, top: `Cleared at ${c.final}`, sub: ymLabel(c.ym), kind: 'clear' as const })),
    { d: TODAY, top: 'Today', sub: fmtD(TODAY), kind: 'today' as const },
    { d: RENEWAL, top: r.left < 0 ? 'Renewal passed' : 'Renewal', sub: fmtD(RENEWAL), kind: 'end' as const },
  ].sort((a, b) => +a.d - +b.d)
  // grey up to today (or up to the renewal once it has passed); red is the time left, or the time overdue
  const usedPct = at(new Date(Math.min(+TODAY, +RENEWAL)))
  return (
    <div className="grid gap-2">
      {/* one track: time used in grey, time left in red, events as dots on it with their labels underneath */}
      <div className="relative mx-1.5 mt-1 mb-9">
        <div className="flex h-2 overflow-hidden rounded-[2px]" role="img" aria-label={r.left < 0 ? `Renewal passed ${-r.left} days ago` : `${r.used} days used, ${r.left} left of ${r.total}`}>
          <span className="h-full bg-foreground/25" style={{ width: `${usedPct}%` }} />
          <span className="h-full flex-1 bg-bad-fill/35" />
        </div>
        {points.map((p, i) => {
          const x = at(p.d)
          const align = i === 0 ? 'items-start -translate-x-[7px]' : i === points.length - 1 ? 'items-end -translate-x-[calc(100%-7px)]' : 'items-center -translate-x-1/2'
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span tabIndex={0} aria-label={`${p.top}, ${fmtDY(p.d)}`}
                  className={cn('absolute -top-[3px] flex flex-col gap-1.5 rounded-sm', align, focusRing)} style={{ left: `${x}%` }}>
                  <span className={cn('size-3.5 rounded-full border-2 border-popover',
                    p.kind === 'flag' ? 'bg-warn-fill' : p.kind === 'clear' ? 'bg-good-fill' : p.kind === 'today' ? 'bg-foreground' : 'bg-bad-fill')} />
                  <span className="grid whitespace-nowrap leading-tight" style={{ justifyItems: i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'center' }}>
                    <span className="text-xs">{p.top}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{p.sub}</span>
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{fmtDY(p.d)}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

const Arrow = () => <span className="text-muted-foreground" aria-hidden="true">→</span>
function RuleRow({ children }: { children: React.ReactNode }) {
  return <li className="flex flex-wrap items-center gap-x-1.5 tabular-nums">{children}</li>
}

function InfoCard({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-hairline p-5">
      <h3 className="flex items-center gap-2 text-sm font-medium">{title}{aside && <span className="ml-auto text-xs font-normal text-muted-foreground">{aside}</span>}</h3>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </section>
  )
}

