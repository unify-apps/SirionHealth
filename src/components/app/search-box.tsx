import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Search that starts as a 32px icon button and opens into a field on click. It stays open while it holds text,
 *  closes when emptied and blurred, and Esc clears and closes it. One look for every toolbar in the app. */
export function SearchBox({ value, onChange, placeholder, label, width = 'w-56', className }: {
  value: string; onChange: (v: string) => void; placeholder: string
  /** accessible name; defaults to the placeholder */
  label?: string; width?: string; className?: string
}) {
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const expanded = open || !!value
  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label={label ?? placeholder} className={className}
            onClick={() => { setOpen(true); requestAnimationFrame(() => input.current?.focus()) }}>
            <Search />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{placeholder}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <InputGroup className={cn('h-8 animate-in fade-in-0 duration-150', width, className)}>
      <InputGroupAddon><Search /></InputGroupAddon>
      <InputGroupInput ref={input} type="search" autoFocus placeholder={placeholder} aria-label={label ?? placeholder} autoComplete="off"
        value={value} onChange={e => onChange(e.target.value)}
        onBlur={() => { if (!value) setOpen(false) }}
        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onChange(''); setOpen(false) } }} />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { onChange(''); input.current?.focus() }}><X /></InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
