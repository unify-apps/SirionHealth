import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthPill, bandText, bandOf } from '@/components/health'
import { cn } from '@/lib/utils'
import { Spark } from './charts'
import { deltaText, runText } from './parts'
import type { Area } from './model'

/** One of the six areas: score, band, 18-month trend, weakest input, coverage. Opens its inputs. */
export function AreaCard({ area, prevLabel, onOpen }: { area: Area; prevLabel: string; onOpen: () => void }) {
  const b = bandOf(area.score)
  const have = area.scored.length, all = area.inputs.length
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl bg-card p-4 shadow-(--shadow-card) transition-colors hover:bg-accent/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring/50">
      <div>
        <h3 className="text-sm font-medium">
          {/* the whole card is the hit area; the title button carries the accessible name */}
          <button type="button" onClick={onOpen} className="text-left outline-none after:absolute after:inset-0 after:rounded-xl"
            aria-label={`${area.name}: ${area.score}, ${area.band.label}. See its ${all} inputs`}>
            {area.name}
          </button>
        </h3>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className={cn('text-3xl font-normal leading-none tracking-[-0.02em] tabular-nums', bandText[b])}>{area.score}</span>
          <HealthPill value={area.score} />
        </div>
        <div className="text-right text-xs">
          <div className="tabular-nums">{deltaText(area.delta, prevLabel)}</div>
          <div className="text-muted-foreground">{runText(area)}</div>
        </div>
      </div>

      <Spark values={area.series} />

      <div className="text-xs leading-relaxed">
        {area.weakest
          ? <p><span className="text-muted-foreground">Pulling it down: </span>{area.weakest.name}{' '}
              <span className={cn('tabular-nums', bandText[bandOf(area.weakest.score)])}>{area.weakest.score}</span>
              <span className="text-muted-foreground"> · {area.weakest.reason}</span></p>
          : <p className="text-muted-foreground">No inputs with data</p>}
        {area.strongest && (
          <p><span className="text-muted-foreground">Holding it up: </span>{area.strongest.name}{' '}
            <span className={cn('tabular-nums', bandText[bandOf(area.strongest.score)])}>{area.strongest.score}</span></p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-hairline pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="flex gap-0.5" aria-hidden="true">
            {area.inputs.map((i, n) => <span key={n} className={cn('h-1.5 w-3 rounded-full', i.score == null ? 'bg-muted' : 'bg-foreground/50')} />)}
          </span>
          {have} of {all} inputs have data
        </span>
        <span className="flex items-center gap-0.5 text-foreground/80 transition-transform group-hover:translate-x-0.5">
          Inputs<ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

export function AreaCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-(--shadow-card)" aria-hidden="true">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-end justify-between"><Skeleton className="h-8 w-24" /><Skeleton className="h-7 w-20" /></div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
      <div className="border-t border-hairline pt-3"><Skeleton className="h-3 w-40" /></div>
    </div>
  )
}
