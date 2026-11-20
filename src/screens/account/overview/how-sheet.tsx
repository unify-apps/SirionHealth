/* openHow + breakdown, as a right side sheet: one vertical calculation (area scores -> weighted average -> renewal cap
   -> health score) with the numbers in one right-hand column, then Bands and Renewal runway as two equal cards,
   then the flag rules as two rule cards. */
import { CalendarClock, CircleGauge, Gauge, Info, Layers, ShieldAlert, TrendingDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { RecordSheet, RecordSheetBody, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BlockHeader } from '@/components/page'
import { Meter } from '@/components/charts'
import { BAND_LABEL, bandBg, bandOf, bandText, HealthPill } from '@/components/health'
import {
  AREA_KEYS, AREA_NAME, AREA_SHORT, AREA_SOURCE, areaDriver, fmtD, fmtDY, latest, RENEWAL, runway, score, SCORED_LINE,
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
    <li className="relative grid grid-cols-[1.5rem_minmax(0,1fr)_4rem] gap-x-4 pb-6 last:pb-0">
      {!last && <span className="absolute top-7 bottom-1 left-3 w-px -translate-x-1/2 bg-border" aria-hidden="true" />}
      <span className="relative z-10 grid size-6 place-items-center rounded-full bg-muted text-xs tabular-nums text-muted-foreground">{n}</span>
      <div className="min-w-0 space-y-2 pt-0.5">
        <div className="font-medium">{title}</div>
        {children}
      </div>
      <span className={cn('pt-px text-right text-xl leading-6 tabular-nums tracking-tight', valueClass)}>{value}</span>
    </li>
  )
}

function SheetCard({ icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-hairline">
      <BlockHeader icon={icon} title={title} />
      <div className="flex flex-1 flex-col justify-center p-5">{children}</div>
    </section>
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
          <ol aria-label={`Weighted ${score.weighted} minus cap ${score.cap} equals ${score.final}`}>
            <Step n="1" title="Area scores">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AREA_KEYS.map(k => <AreaTile key={k} k={k} onOpen={() => onOpenArea(k)} />)}
              </ul>
            </Step>
            <Step n="2" title="Weighted average" value={score.weighted}>
              <p className="text-muted-foreground">Sirion CS ops set each area's weight; the weights aren't stored in the health record.</p>
            </Step>
            <Step n="3" title={<CapTerm focusable={false}>Renewal cap</CapTerm>} value={`−${score.cap}`}>
              <p className="line-clamp-2 text-muted-foreground">
                Renewal {score.snapshotDays} days out with auto-renew off holds health at 50. It lifts once signed or auto-renew is on.
              </p>
            </Step>
            <Step n="=" title="Health score" value={score.final} valueClass={cn('font-medium', bandText[bandOf(score.final)])} last>
              <HealthPill value={score.final} />
            </Step>
          </ol>

          <div className="grid gap-4 md:grid-cols-2">
            <SheetCard icon={Gauge} title="Bands"><BandScale /></SheetCard>
            {runway && <SheetCard icon={CalendarClock} title="Renewal runway"><RunwayTimeline /></SheetCard>}
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Flag rules</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <RuleCard icon={CircleGauge} title="Current model" rows={[
                { icon: CircleGauge, text: 'Composite < 70 → Watch' },
                { icon: ShieldAlert, text: 'Composite < 40 → At risk' },
              ]} note={<>Renewal within 60 days, auto-renew off → capped at 50</>} />
              <RuleCard icon={TrendingDown} title="Early warning" proposed rows={[
                { icon: Layers, text: 'Any area < 50 → Flag' },
                { icon: TrendingDown, text: 'Composite −8 or more in a month → Flag' },
              ]} />
            </div>
          </section>
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
            className={cn('flex h-full w-full flex-col gap-2 rounded-lg border border-hairline p-3 text-left transition-colors hover:bg-accent/40', focusRing)}>
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
  { from: 0, to: 40, label: 'At risk', range: 'under 40', fill: 'bg-bad/25' },
  { from: 40, to: 70, label: 'Watch', range: '40 to 69', fill: 'bg-warn/25' },
  { from: 70, to: 100, label: 'Healthy', range: '70+', fill: 'bg-good/25' },
] as const

function BandScale() {
  return (
    <div className="space-y-3">
      <div className="relative pt-5">
        <Marker at={score.final} label={`${score.final}`} tip={`TransAmerica: ${score.final}, after the renewal cap`} />
        <Marker at={score.weighted} label={`${score.weighted}`} hollow tip={`Uncapped weighted score: ${score.weighted}`} />
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
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />An input with no value is left out and never counts as healthy.
      </p>
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
  const t0 = +r.firstFlag, t1 = +RENEWAL
  const at = (d: Date) => Math.min(100, Math.max(0, ((+d - t0) / (t1 - t0)) * 100))
  const points: { d: Date; top: string; sub: string; kind: 'flag' | 'clear' | 'today' | 'end' }[] = [
    { d: r.firstFlag, top: 'Flagged', sub: fmtD(r.firstFlag), kind: 'flag' },
    ...r.cleared.map(c => ({ d: c.date, top: `Cleared at ${c.final}`, sub: ymLabel(c.ym), kind: 'clear' as const })),
    { d: TODAY, top: 'Today', sub: fmtD(TODAY), kind: 'today' },
    { d: RENEWAL, top: 'Renewal', sub: fmtD(RENEWAL), kind: 'end' },
  ]
  const usedPct = (100 * r.used) / r.total
  return (
    <div className="space-y-5">
      <div className="relative mx-2 h-12">
        <span className="absolute inset-x-0 top-[7px] h-px bg-border" aria-hidden="true" />
        {points.map((p, i) => {
          const x = at(p.d)
          const align = i === 0 ? 'items-start' : i === points.length - 1 ? 'items-end' : 'items-center'
          const shift = i === 0 ? '-translate-x-[6px]' : i === points.length - 1 ? '-translate-x-[calc(100%-6px)]' : '-translate-x-1/2'
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span tabIndex={0} aria-label={`${p.top}, ${fmtDY(p.d)}`}
                  className={cn('absolute top-0 flex flex-col gap-1 rounded-sm', align, shift, focusRing)} style={{ left: `${x}%` }}>
                  <span className={cn('size-3.5 rounded-full border-2 border-popover',
                    p.kind === 'flag' ? 'bg-warn' : p.kind === 'clear' ? 'bg-good' : p.kind === 'today' ? 'bg-foreground' : 'bg-muted-foreground')} />
                  <span className="whitespace-nowrap text-xs leading-4">{p.top}</span>
                  <span className="whitespace-nowrap text-[11px] leading-3 tabular-nums text-muted-foreground">{p.sub}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{fmtDY(p.d)}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div tabIndex={0} role="img" aria-label={`${r.used} days used, ${r.left} left of ${r.total}`} className={cn('space-y-1.5 rounded-sm pt-3', focusRing)}>
            <div className="flex h-1.5 gap-0.5">
              <span className="h-full rounded-l-full bg-foreground/60" style={{ width: `${usedPct}%` }} />
              <span className="h-full flex-1 rounded-r-full bg-bad/30" />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">
              <span className="text-foreground">{r.used} used</span> · {r.left} left
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>{r.used} of {r.total} days used since first flag</TooltipContent>
      </Tooltip>
    </div>
  )
}

/* ---------- flag rules ---------- */
function RuleCard({ icon: Icon, title, rows, note, proposed }: {
  icon: LucideIcon; title: string; rows: { icon: LucideIcon; text: string }[]; note?: React.ReactNode; proposed?: boolean
}) {
  return (
    <div className="space-y-3 rounded-lg border border-hairline p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted"><Icon className="size-4 text-muted-foreground" aria-hidden="true" /></span>
        <span className="font-medium">{title}</span>
        {proposed && <Badge variant="outline" className="ml-auto font-normal">Proposed</Badge>}
      </div>
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.text} className="flex items-center gap-2 tabular-nums">
            <r.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{r.text}
          </li>
        ))}
      </ul>
      {note && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <CalendarClock className="mt-px size-3.5 shrink-0" aria-hidden="true" /><span>{note}</span>
        </p>
      )}
    </div>
  )
}
