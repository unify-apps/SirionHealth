import { CalendarClock, DollarSign, LifeBuoy, MessageSquare, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { bandOf } from '@/components/health'
import { Meter, MeterValue, Tip } from '@/components/page'
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
    <li className="flex min-h-13 items-center gap-6 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{input.name}{showArea && <span className="ml-2 text-xs text-muted-foreground">{input.areaName}</span>}</p>
        <Tip tip={why}><p tabIndex={0} className="mt-0.5 truncate rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{why}</p></Tip>
      </div>
      <MeterValue value={input.score} tone={missing || b === 'none' ? undefined : b} label={input.name}
        tip={missing ? 'No data: left out of the average' : `${input.name}: ${input.score} of 100`} className="shrink-0" />
    </li>
  )
}

export const deltaText = (d: number, vs: string) => d === 0 ? `No change vs ${vs}` : `${d > 0 ? '+' : '−'}${Math.abs(d)} vs ${vs}`
export const runText = (a: Area) =>
  `${a.band.label} for ${a.band.all ? `all ${a.band.run}` : a.band.run} month${a.band.run === 1 ? '' : 's'}`
