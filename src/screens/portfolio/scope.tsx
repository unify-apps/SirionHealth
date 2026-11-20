import { createContext, useContext, useMemo, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { setParams, useParam } from '@/lib/route'
import { cn } from '@/lib/utils'
import { parseScope, POD_NAMES, REGIONS, scopeLabel, scopeParam, summariseScope, type Scope, type Summary } from './data'

/* The page-level scope (`#portfolio?scope=pod:<name>` or `scope=region:<name>`): every widget and sheet on the page
   reads the summary for the current scope from here. Changing scope replaces the history entry. */

const Ctx = createContext<{ scope: Scope; summary: Summary } | null>(null)

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const raw = useParam('scope')
  const value = useMemo(() => { const scope = parseScope(raw); return { scope, summary: summariseScope(scope) } }, [raw])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** The current scope and its summary. */
export function useScope() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useScope outside ScopeProvider')
  return v
}

/** Sets the scope; `close` also closes the open sheet in the same history entry. */
export function changeScope(s: Scope, close = false) {
  setParams({ scope: scopeParam(s), ...(close ? { sheet: null, from: null } : {}) })
}

/** Search appears in the menu only when the pod list is long. */
const SEARCH_OVER = 8

/** The scope control for the page header: a menu of all pods, regions and pods, plus a clear button when scoped. */
export function ScopeMenu() {
  const { scope } = useScope()
  const [q, setQ] = useState('')
  const search = POD_NAMES.length > SEARCH_OVER
  const match = (t: string) => !q || t.toLowerCase().includes(q.toLowerCase())
  const is = (s: Scope) => scopeParam(s) === scopeParam(scope)
  const item = (s: Scope, text: string, inset = false) => (
    <DropdownMenuItem key={scopeParam(s) ?? 'all'} onSelect={() => changeScope(s)} className={cn(inset && 'pl-4')}>
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {is(s) && <Check className="size-4 text-muted-foreground" aria-hidden="true" />}
    </DropdownMenuItem>
  )
  return (
    <div className="flex items-center gap-1">
      <DropdownMenu onOpenChange={o => { if (!o) setQ('') }}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label={`Scope: ${scopeLabel(scope)}. Change scope`}>
            {scopeLabel(scope)}<ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {search && (
            <label className="mb-1 flex h-8 items-center gap-2 border-b border-hairline px-2">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} placeholder="Search pods" aria-label="Search pods"
                className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </label>
          )}
          {match('All pods') && item({ kind: 'all' }, 'All pods')}
          {REGIONS.map(r => {
            const pods = r.pods.filter(p => match(p) || match(r.name))
            if (!pods.length) return null
            return (
              <DropdownMenuGroup key={r.name}>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{r.name}</DropdownMenuLabel>
                {r.pods.length > 1 && item({ kind: 'region', name: r.name }, `All ${r.name}`, true)}
                {pods.map(p => item({ kind: 'pod', name: p }, p, true))}
              </DropdownMenuGroup>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {scope.kind !== 'all' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Clear scope, show all pods" onClick={() => changeScope({ kind: 'all' })}><X /></Button>
          </TooltipTrigger>
          <TooltipContent>Show all pods</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
