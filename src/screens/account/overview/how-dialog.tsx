/* openHow + breakdown: six area scores -> weighted average -> renewal cap -> final score. */
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BAND_LABEL, bandOf, bandText, HealthPill } from '@/components/health'
import {
  AREA_KEYS, AREA_SHORT, areaCoverage, areaDriver, latest, RULE_TEXT, score, SCORED_LINE, type AreaKey,
} from '../facts'

function Step({ n, title, value, valueClass, children }: {
  n: string; title: string; value?: React.ReactNode; valueClass?: string; children?: React.ReactNode
}) {
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-x-3 border-t border-hairline py-3.5 first:border-t-0 first:pt-0">
      <span className="grid size-6 place-items-center rounded-full bg-muted text-xs tabular-nums text-muted-foreground">{n}</span>
      <div className="min-w-0 space-y-1.5">
        <div className="font-medium">{title}</div>
        {children}
      </div>
      {value != null && <span className={cn('text-xl tabular-nums tracking-tight', valueClass)}>{value}</span>}
    </li>
  )
}

export function HowScoresDialog({ open, onOpenChange, onOpenArea }: {
  open: boolean; onOpenChange: (o: boolean) => void; onOpenArea: (k: AreaKey) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-5 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-normal">How scores work</DialogTitle>
          <DialogDescription>{SCORED_LINE}</DialogDescription>
        </DialogHeader>

        <ol>
          <Step n="1" title="Six area scores">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {AREA_KEYS.map(k => {
                const v = latest.areas[k], drv = areaDriver(k), [have, all] = areaCoverage(k)
                return (
                  <button key={k} type="button" onClick={() => onOpenArea(k)}
                    className="group flex items-center gap-3 rounded-lg border border-hairline px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span>{AREA_SHORT[k]}</span>
                        <span className={cn('tabular-nums font-medium', bandText[bandOf(v)])}>{v}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {have} of {all} inputs{drv ? ` · lowest: ${drv.name} ${drv.score}` : ''}
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                )
              })}
            </div>
          </Step>
          <Step n="2" title="Weighted average" value={score.weighted}>
            <p className="text-muted-foreground">
              Sirion CS ops set the weight of each area. AHI doesn't store the weights, so exact points per area can't be shown.
            </p>
          </Step>
          <Step n="3" title={`Renewal cap (${score.overrideCode})`} value={`−${score.cap}`}>
            <p className="text-muted-foreground">
              {score.overrideReason}. The renewal was {score.snapshotDays} days out at the snapshot with auto-renew off, so
              health is held at 50 or below. The cap lifts once the renewal is signed or auto-renew is on.
            </p>
          </Step>
          <Step n="=" title="Health score" value={score.final} valueClass={bandText[bandOf(score.final)]}>
            <HealthPill value={score.final} />
          </Step>
        </ol>

        <section className="space-y-2 rounded-lg bg-muted/50 p-3.5">
          <h3 className="text-sm font-medium">Bands</h3>
          <div className="flex flex-wrap gap-2">
            <HealthPill value={80}>{BAND_LABEL.good} · 70 and above</HealthPill>
            <HealthPill value={50}>{BAND_LABEL.warn} · 40 to 69</HealthPill>
            <HealthPill value={20}>{BAND_LABEL.bad} · under 40</HealthPill>
          </div>
          <p className="text-xs text-muted-foreground">
            An input with no value is left out of its area's average and never counts as healthy.
          </p>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-sm font-medium">Flag rules</h3>
          {(['model', 'early'] as const).map(k => (
            <div key={k}>
              <div>{RULE_TEXT[k].label}</div>
              <p className="text-muted-foreground">{RULE_TEXT[k].text}</p>
            </div>
          ))}
        </section>
      </DialogContent>
    </Dialog>
  )
}
