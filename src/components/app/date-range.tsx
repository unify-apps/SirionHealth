import { toast } from 'sonner'
import { CalendarDays, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { RANGES, setRange, useRange } from '@/lib/range'

/** Date-range menu for page header actions; widgets read the same range through useRange(). */
export function DateRangeMenu() {
  const range = useRange()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Date range: ${range.label}`}><CalendarDays />{range.label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Date range</DropdownMenuLabel>
        {RANGES.map(r => (
          <DropdownMenuItem key={r.id} onSelect={() => { if (r.id !== range.id) toast(`Showing ${r.label.toLowerCase()}`); setRange(r.id) }}>
            {r.label}{range.id === r.id && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
