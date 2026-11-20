import { useState } from 'react'
import { DollarSign, Globe, Layers, ListFilter, Search, Users, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ARR_TIERS, PODS, REGIONS, rows, STAGES } from './data'

export type Filters = { pod: string; region: string; stage: string; arr: string }
export const NO_FILTERS: Filters = { pod: 'all', region: 'all', stage: 'all', arr: 'all' }

type Dim = { key: keyof Filters; label: string; icon: LucideIcon; unit: string; items: { value: string; label: string; count: number }[] }

/** Pod and region counts are accounts in the book; stage and ARR counts are accounts in My accounts. */
const DIMS: Dim[] = [
  { key: 'pod', label: 'Pod', icon: Users, unit: 'accounts', items: PODS.map(p => ({ value: p.name, label: p.name, count: p.accounts })) },
  { key: 'region', label: 'Region', icon: Globe, unit: 'accounts', items: REGIONS.map(r => ({
    value: r, label: r, count: PODS.filter(p => p.region === r).reduce((a, p) => a + p.accounts, 0),
  })) },
  { key: 'stage', label: 'Stage', icon: Layers, unit: 'in My accounts', items: STAGES.map(s => ({
    value: s.stage, label: s.stage, count: rows.filter(r => r.stage === s.stage).length,
  })) },
  { key: 'arr', label: 'ARR', icon: DollarSign, unit: 'in My accounts', items: ARR_TIERS.map(t => ({
    value: t.key, label: t.label, count: rows.filter(r => t.test(r.carr)).length,
  })) },
]
const SEARCH_OVER = 8

export function activeCount(f: Filters) {
  return Object.values(f).filter(v => v !== 'all').length
}

const valueLabel = (d: Dim, v: string) => (v === 'all' ? 'All' : d.items.find(i => i.value === v)?.label ?? v)

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** One "Filter" button with a cascading menu (dimension -> checkable values with counts), and the active
 *  filters as removable chips beside it. Choosing the checked value again clears that dimension. */
export function FilterBar({ value, onChange, onClear }: { value: Filters; onChange: (f: Filters) => void; onClear: () => void }) {
  const n = activeCount(value)
  const set = (k: keyof Filters, v: string) => onChange({ ...value, [k]: v })
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" role="group" aria-label="Portfolio filters">
      {DIMS.filter(d => value[d.key] !== 'all').map(d => (
        <span key={d.key} className="inline-flex h-7 max-w-[220px] items-center gap-1 rounded-md border border-signal/40 bg-signal-soft pl-2 pr-0.5 text-xs">
          <span className="text-muted-foreground">{d.label}:</span>
          <span className="truncate">{valueLabel(d, value[d.key])}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => set(d.key, 'all')} aria-label={`Remove ${d.label} filter`}
                className={cn('grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}>
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Remove {d.label.toLowerCase()} filter</TooltipContent>
          </Tooltip>
        </span>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn('hover:bg-accent', focusRing)} aria-label={n ? `Filter, ${n} active` : 'Filter'}>
            <ListFilter aria-hidden="true" />Filter
            {n > 0 && <span className="grid h-4 min-w-4 place-items-center rounded bg-foreground px-1 text-[11px] font-medium tabular-nums text-background">{n}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Filter by</DropdownMenuLabel>
          {DIMS.map(d => (
            <DropdownMenuSub key={d.key}>
              <DropdownMenuSubTrigger className="gap-2">
                <d.icon className="text-muted-foreground" aria-hidden="true" />
                <span>{d.label}</span>
                <span className={cn('ml-auto max-w-24 truncate text-xs', value[d.key] === 'all' ? 'text-muted-foreground' : 'text-foreground')}>
                  {valueLabel(d, value[d.key])}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 p-1">
                <DimOptions d={d} current={value[d.key]} onPick={v => set(d.key, v === value[d.key] ? 'all' : v)} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={n === 0} onSelect={onClear} className="gap-2">
            <X aria-hidden="true" />Clear all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DimOptions({ d, current, onPick }: { d: Dim; current: string; onPick: (v: string) => void }) {
  const [q, setQ] = useState('')
  const searchable = d.items.length > SEARCH_OVER
  const items = q ? d.items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : d.items
  return (
    <>
      {searchable && (
        <div className="mb-1 flex items-center gap-2 border-b border-hairline px-2 pb-1.5">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${d.label.toLowerCase()}s`} aria-label={`Search ${d.label.toLowerCase()}s`}
            onKeyDown={e => e.stopPropagation()} className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      )}
      <DropdownMenuLabel className="flex justify-between text-xs font-normal text-muted-foreground">
        <span>{d.label}</span><span>{d.unit}</span>
      </DropdownMenuLabel>
      {items.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">No {d.label.toLowerCase()} matches</p>}
      {items.map(i => (
        <DropdownMenuCheckboxItem key={i.value} checked={current === i.value} onCheckedChange={() => onPick(i.value)}>
          <span className="truncate">{i.label}</span>
          <span className="ml-auto pl-3 text-xs tabular-nums text-muted-foreground">{i.count}</span>
        </DropdownMenuCheckboxItem>
      ))}
    </>
  )
}
