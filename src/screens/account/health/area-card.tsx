import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { bandText, bandOf } from '@/components/health'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { Spark } from './charts'
import { AREA_ICON } from './parts'
import type { Area } from './model'

/** One of the six areas: name, score (colour carries the band), change, trend, weakest input. Opens its inputs. */
export function AreaCard({ area, prevLabel, labels, onOpen }: { area: Area; prevLabel: string; labels?: string[]; onOpen: () => void }) {
  const have = area.scored.length, all = area.inputs.length
  const I = AREA_ICON[area.key]
  const since = prevLabel.split(' ')[0]
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl bg-card p-5 shadow-(--shadow-card) transition-colors hover:bg-accent/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring/50">
      <div className="flex items-center gap-2">
        <I className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h3 className="min-w-0 truncate text-sm font-medium">
          {/* the whole card is the hit area; the title button carries the accessible name */}
          <button type="button" onClick={onOpen} className="text-left outline-none after:absolute after:inset-0 after:rounded-xl"
            aria-label={`${area.name}: ${area.score}, ${area.band.label}. See its ${all} ${all === 1 ? 'input' : 'inputs'}`}>
            {tc(area.name)}
          </button>
        </h3>
        <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn('text-3xl font-normal tabular-nums tracking-[-0.02em]', bandText[bandOf(area.score)])}>{area.score}</span>
        <span className="text-xs text-muted-foreground">
          {area.delta ? <><span className={cn('tabular-nums', area.delta < 0 && 'text-bad')}>{area.delta > 0 ? '+' : '−'}{Math.abs(area.delta)}</span> since {since}</> : `Flat since ${since}`}
        </span>
      </div>

      {/* sits above the card's click overlay so hover shows each month's value; a click still opens the area */}
      <div className="relative z-10 cursor-pointer" onClick={onOpen}><Spark values={area.series} labels={labels} name={area.shortName} /></div>

      <p className="mt-auto flex items-baseline gap-2 text-xs">
        <span className="min-w-0 truncate">
          {area.weakest
            ? <><span className="text-muted-foreground">Weakest: </span>{area.weakest.name}{' '}
                <span className={cn('tabular-nums font-medium', bandText[bandOf(area.weakest.score)])}>{area.weakest.score}</span></>
            : <span className="text-muted-foreground">No inputs with data</span>}
        </span>
        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground" title={`${have} of ${all} inputs have data`}>{have}/{all} inputs</span>
      </p>
    </div>
  )
}

export function AreaCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-(--shadow-card)" aria-hidden="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
