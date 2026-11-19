import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthPill, HealthRing, bandText, bandOf } from '@/components/health'
import { DeltaChip } from '@/components/page'
import { cn } from '@/lib/utils'
import { Spark } from './charts'
import { AREA_ICON, runText } from './parts'
import type { Area } from './model'

/** One of the six areas: score ring, band, change, 18-month trend, weakest input, coverage. Opens its inputs. */
export function AreaCard({ area, prevLabel, onOpen }: { area: Area; prevLabel: string; onOpen: () => void }) {
  const have = area.scored.length, all = area.inputs.length
  const I = AREA_ICON[area.key]
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl bg-card p-4 shadow-(--shadow-card) transition-colors hover:bg-accent/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring/50">
      <div className="flex items-center gap-2">
        <I className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h3 className="min-w-0 truncate text-sm font-medium">
          {/* the whole card is the hit area; the title button carries the accessible name */}
          <button type="button" onClick={onOpen} className="text-left outline-none after:absolute after:inset-0 after:rounded-xl"
            aria-label={`${area.name}: ${area.score}, ${area.band.label}. See its ${all} inputs`}>
            {area.name}
          </button>
        </h3>
        <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-3">
        <HealthRing value={area.score} size={52} stroke={4} />
        <div className="grid min-w-0 gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <HealthPill value={area.score} />
            <DeltaChip value={area.delta} health label={`vs ${prevLabel.split(' ')[0]}`} />
          </span>
          <span className="truncate text-xs text-muted-foreground">{runText(area)}</span>
        </div>
      </div>

      <Spark values={area.series} />

      <p className="truncate text-xs">
        {area.weakest
          ? <><span className="text-muted-foreground">Weakest </span>{area.weakest.name}{' '}
              <span className={cn('tabular-nums font-medium', bandText[bandOf(area.weakest.score)])}>{area.weakest.score}</span></>
          : <span className="text-muted-foreground">No inputs with data</span>}
      </p>

      <div className="mt-auto flex items-center gap-2 border-t border-hairline pt-3 text-xs text-muted-foreground">
        <span className="flex gap-0.5" aria-hidden="true">
          {area.inputs.map((i, n) => <span key={n} className={cn('h-1.5 w-3 rounded-full', i.score == null ? 'bg-muted' : 'bg-foreground/50')} />)}
        </span>
        <span className="tabular-nums">{have} of {all} inputs have data</span>
      </div>
    </div>
  )
}

export function AreaCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-(--shadow-card)" aria-hidden="true">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-3"><Skeleton className="size-13 rounded-full" /><div className="grid gap-1.5"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-24" /></div></div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="border-t border-hairline pt-3"><Skeleton className="h-3 w-40" /></div>
    </div>
  )
}
