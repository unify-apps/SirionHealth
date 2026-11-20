import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_LAYOUT, LAYOUTS, setFlag, setLayout, useFlags, type Layout } from '@/lib/dev-flags'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Prototype switches: detail page layout and the flat option. Not product UI. */
export function DevToolbar() {
  const { flat, layout } = useFlags()
  const on = flat || layout !== DEFAULT_LAYOUT
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Design options"
          className={cn('grid size-9 place-items-center rounded-md border shadow-(--shadow-card) outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring print:hidden',
            on ? 'border-signal bg-signal text-white' : 'border-border bg-popover text-muted-foreground hover:text-foreground')}>
          <FlaskConical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left" align="end" className="w-72">
        <DropdownMenuLabel>Detail page layout</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={layout} onValueChange={v => setLayout(v as Layout)}>
          {LAYOUTS.map(l => (
            <DropdownMenuRadioItem key={l.id} value={l.id} className="items-start py-1.5">
              <span className="grid">
                <span>{l.label}</span>
                <span className="text-xs text-muted-foreground">{l.hint}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={flat} onCheckedChange={v => setFlag('flat', !!v)} disabled={layout !== 'current' && layout !== 'tabsfirst'}>
          Flat sections (D and Previous)
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
