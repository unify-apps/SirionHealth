import { CalendarClock, DollarSign, LifeBuoy, MessageSquare, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { bandOf, bandText } from '@/components/health'
import { Meter } from '@/components/page'
import { cn } from '@/lib/utils'
import type { Area, AreaKey, Input } from './model'

/** One icon per health area, the same everywhere in the app. */
export const AREA_ICON: Record<AreaKey, LucideIcon> = {
  commercial: DollarSign, adoption: TrendingUp, support: LifeBuoy, engagement: Users, sentiment: MessageSquare, renewalRisk: CalendarClock,
}

/** How an area is scored, as one plain line. */
export const scoredBy = (ai: boolean) => ai ? 'Scored from customer emails' : 'Scored by rules from source data'

/** Score bar, 0 to 100. Missing values draw no bar. */
export function ScoreBar({ score, className }: { score: number | null; className?: string }) {
  const b = bandOf(score)
  return (
    <Meter value={score} tone={b === 'none' ? undefined : b} className={cn('w-full', className)} />
  )
}

/** One input: name, the plain-words reason on one line (full text on hover), score with a short bar. */
export function InputRow({ input, showArea = false }: { input: Input; showArea?: boolean }) {
  const missing = input.score == null
  const b = bandOf(input.score)
  const why = missing ? `${input.reason}. Left out of the average and the drivers.` : input.reason
  return (
    <li className="flex min-h-11 items-center gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{input.name}{showArea && <span className="ml-2 text-xs text-muted-foreground">{input.areaName}</span>}</p>
        <p className="truncate text-xs text-muted-foreground" title={why}>{why}</p>
      </div>
      {missing
        ? <span className="shrink-0 text-xs text-muted-foreground">No data</span>
        : <span className="flex shrink-0 items-center gap-2">
            <ScoreBar score={input.score} className="w-12" />
            <span className={cn('w-7 text-right text-sm font-medium tabular-nums', bandText[b])}>{input.score}</span>
          </span>}
    </li>
  )
}

export const deltaText = (d: number, vs: string) => d === 0 ? `No change vs ${vs}` : `${d > 0 ? '+' : '−'}${Math.abs(d)} vs ${vs}`
export const runText = (a: Area) =>
  `${a.band.label} for ${a.band.all ? `all ${a.band.run}` : a.band.run} month${a.band.run === 1 ? '' : 's'}`
