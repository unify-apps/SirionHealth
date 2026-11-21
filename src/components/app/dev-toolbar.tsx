import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_LAYOUT, LAYOUTS, setLayout, useFlags } from '@/lib/dev-flags'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Prototype switch: an icon toggle that flips the whole app between the two design styles; filled while the
 *  non-default style is on. Not product UI. */
export function DevToolbar() {
  const { layout } = useFlags()
  const current = LAYOUTS.find(l => l.id === layout)!
  const next = LAYOUTS.find(l => l.id !== layout)!
  const on = layout !== DEFAULT_LAYOUT
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={() => setLayout(next.id)} aria-pressed={on} aria-label={`Design style: ${current.label}. Switch to ${next.label}`}
          className={cn('grid size-9 place-items-center rounded-md border shadow-(--shadow-card) outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring print:hidden',
            on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-popover text-muted-foreground hover:text-foreground')}>
          <FlaskConical className="size-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{current.label} · click for {next.label}</TooltipContent>
    </Tooltip>
  )
}
