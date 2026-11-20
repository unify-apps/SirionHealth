import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { fmtFull, fmtWhen, isRelative } from '@/lib/dates'

/** A date in the app's one format: relative within 7 days of TODAY (full date on hover), else "Oct 27" / "Oct 27, 2025". */
export function DateText({ date, full = false, className }: { date: Date; full?: boolean; className?: string }) {
  const text = fmtWhen(date, full)
  if (!isRelative(date)) return <span className={className}>{text}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className={className}>{text}</span></TooltipTrigger>
      <TooltipContent>{fmtFull(date)}</TooltipContent>
    </Tooltip>
  )
}
