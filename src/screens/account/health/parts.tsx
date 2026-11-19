import { HealthPill, bandBg, bandOf, bandText } from '@/components/health'
import { cn } from '@/lib/utils'
import type { Area, Input } from './model'

/** How an area is scored, as one plain line. */
export const scoredBy = (ai: boolean) => ai ? 'Scored from customer emails' : 'Scored by rules from source data'

/** Score bar, 0 to 100. Missing values draw no bar. */
export function ScoreBar({ score, className }: { score: number | null; className?: string }) {
  return (
    <span className={cn('block h-1 w-full overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
      {score != null && <span className={cn('block h-full rounded-full', bandBg[bandOf(score)])} style={{ width: `${Math.max(score, 2)}%` }} />}
    </span>
  )
}

/** One input with its score, band and the plain-words reason. Explainability lives here. */
export function InputRow({ input, showArea = false }: { input: Input; showArea?: boolean }) {
  const missing = input.score == null
  const b = bandOf(input.score)
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm">{input.name}{showArea && <span className="ml-2 text-xs text-muted-foreground">{input.areaName}</span>}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {missing ? <>Why: {input.reason}. Left out of the average and the drivers.</> : input.reason}
        </p>
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        {missing
          ? <HealthPill band="none" />
          : <>
              <span className={cn('w-7 text-right text-sm font-medium tabular-nums', bandText[b])}>{input.score}</span>
              <HealthPill value={input.score} />
            </>}
      </div>
      {!missing && <ScoreBar score={input.score} className="col-span-2 mt-1" />}
    </li>
  )
}

export const deltaText = (d: number, vs: string) => d === 0 ? `No change vs ${vs}` : `${d > 0 ? '+' : '−'}${Math.abs(d)} vs ${vs}`
export const runText = (a: Area) =>
  `${a.band.label} for ${a.band.all ? `all ${a.band.run}` : a.band.run} month${a.band.run === 1 ? '' : 's'}`
