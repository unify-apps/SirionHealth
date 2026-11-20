import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const RANGES = ['Last 30 days', 'Last 90 days', 'Last 180 days', 'Last 12 months', 'Lifetime'] as const

/** Date-range menu for page header actions. ponytail: local state; lift to context when widgets read it. */
export function DateRangeMenu() {
  const [range, setRange] = useState<string>('Lifetime')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Date range: ${range}`}><CalendarDays />{range}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Date range</DropdownMenuLabel>
        {RANGES.map(r => (
          <DropdownMenuItem key={r} onSelect={() => { if (r !== range) toast(`Showing ${r.toLowerCase()}`); setRange(r) }}>
            {r}{range === r && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
