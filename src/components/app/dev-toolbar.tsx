import { FlaskConical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { setFlag, useFlags } from '@/lib/dev-flags'

/** Prototype toggle for the flat detail page: one click on, one click off. Not product UI. */
export function DevToolbar() {
  const { flat } = useFlags()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={() => setFlag('flat', !flat)} aria-pressed={flat} aria-label="Flat detail page"
          className={cn('grid size-9 place-items-center rounded-full border shadow-(--shadow-card) outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring print:hidden',
            flat ? 'border-signal bg-signal text-white' : 'border-border bg-popover text-muted-foreground hover:text-foreground')}>
          <FlaskConical className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">Flat detail page: {flat ? 'on' : 'off'}</TooltipContent>
    </Tooltip>
  )
}
