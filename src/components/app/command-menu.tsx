import { useEffect } from 'react'
import { BarChart3, LayoutList, Shapes } from 'lucide-react'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command'
import { HealthRing } from '@/components/health'
import { ROWS } from '@/data/legacy'
import { go } from '@/lib/route'


export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onOpenChange(!open) }
    }
    document.addEventListener('keydown', on)
    return () => document.removeEventListener('keydown', on)
  }, [open, onOpenChange])

  const run = (fn: () => void) => { onOpenChange(false); fn() }
  const rows = ROWS.map(r => ({ name: String(r.name), ind: String(r.ind ?? ''), health: r.health as number | null }))
    .filter(r => r.name !== 'TransAmerica').sort((a, b) => a.name.localeCompare(b.name))

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Find an account" description="Search accounts and pages">
      <Command>
      <CommandInput placeholder="Find an account or page…" />
      <CommandList>
        <CommandEmpty>No account matches.</CommandEmpty>
        <CommandGroup heading="Accounts">
          <CommandItem value="TransAmerica Financial services" onSelect={() => run(() => go('account'))}>
            <HealthRing value={50} size={22} stroke={2} />
            TransAmerica
            <span className="text-muted-foreground">Financial services</span>
            <CommandShortcut>Open</CommandShortcut>
          </CommandItem>
          {rows.map(r => (
            <CommandItem key={r.name} value={`${r.name} ${r.ind}`} onSelect={() => run(() => go('account'))}>
              <HealthRing value={r.health} size={22} stroke={2} />
              {r.name}
              <span className="text-muted-foreground">{r.ind}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => run(() => go('accounts'))}><LayoutList />My accounts</CommandItem>
          <CommandItem onSelect={() => run(() => go('portfolio'))}><BarChart3 />Portfolio</CommandItem>
          <CommandItem onSelect={() => run(() => go('states'))}><Shapes />States reference</CommandItem>
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
