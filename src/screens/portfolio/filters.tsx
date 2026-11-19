import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ARR_TIERS, PODS, REGIONS, STAGES } from './data'

export type Filters = { pod: string; region: string; stage: string; arr: string }
export const NO_FILTERS: Filters = { pod: 'all', region: 'all', stage: 'all', arr: 'all' }

const OPTIONS: { key: keyof Filters; label: string; items: { value: string; label: string }[] }[] = [
  { key: 'pod', label: 'Pod', items: PODS.map(p => ({ value: p.name, label: p.name })) },
  { key: 'region', label: 'Region', items: REGIONS.map(r => ({ value: r, label: r })) },
  { key: 'stage', label: 'Stage', items: STAGES.map(s => ({ value: s.stage, label: s.stage })) },
  { key: 'arr', label: 'ARR', items: ARR_TIERS.map(t => ({ value: t.key, label: t.label })) },
]

export function activeCount(f: Filters) {
  return Object.values(f).filter(v => v !== 'all').length
}

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const n = activeCount(value)
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Portfolio filters">
      {OPTIONS.map(o => {
        const on = value[o.key] !== 'all'
        return (
          <Select key={o.key} value={value[o.key]} onValueChange={v => onChange({ ...value, [o.key]: v })}>
            <SelectTrigger size="sm" aria-label={o.label} className={cn('min-w-0', on && 'border-signal/50 bg-signal-soft dark:bg-signal-soft')}>
              <span className="text-muted-foreground">{o.label}:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{o.label}</SelectLabel>
                {o.items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        )
      })}
      {n > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange(NO_FILTERS)}>
          <X aria-hidden="true" />Clear {n}
        </Button>
      )}
    </div>
  )
}
