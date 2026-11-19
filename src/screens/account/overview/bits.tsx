import { setTab } from '../tab'
/* Small shared pieces for the account header and Summary tab: info tips, source tags,
   widget load/empty/error states, collapsible section titles, evidence rows. */
import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Empty } from '@/components/page'
import { fmtDY, ymLabel, type Evidence } from '../facts'

/** The prototype's (i) tip: hover or focus shows the text. */
export function InfoTip({ text, className }: { text: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={typeof text === 'string' ? `About this: ${text}` : 'About this'}
          className={cn('inline-grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', className)}>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  )
}

/** Provenance as one plain muted word: scored by a model or by rules. */
export function SourceTag({ kind, className }: { kind: 'ai' | 'rule'; className?: string }) {
  return <span className={cn('text-xs text-muted-foreground', className)}>{kind === 'ai' ? 'AI-scored' : 'Rule'}</span>
}

/* ---------- widget states ---------- */
export type WidgetState<T> = { status: 'loading' | 'ready' | 'error'; data?: T; error?: string; retry: () => void }

/** Builds a widget's data off the render path so every widget has real loading, ready and error states. */
export function useWidget<T>(compute: () => T): WidgetState<T> {
  const [run, setRun] = useState(0)
  const [s, set] = useState<Omit<WidgetState<T>, 'retry'>>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    const id = setTimeout(() => {
      try { const data = compute(); if (alive) set({ status: 'ready', data }) }
      catch (e) { if (alive) set({ status: 'error', error: e instanceof Error ? e.message : String(e) }) }
    }, 0)
    return () => { alive = false; clearTimeout(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])
  return { ...s, retry: () => { set({ status: 'loading' }); setRun(n => n + 1) } }
}

export function ErrorState({ what, onRetry, className }: { what: string; onRetry: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center', className)}>
      <AlertTriangle className="size-4 text-muted-foreground" />
      <p className="text-sm">Couldn't load {what}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
    </div>
  )
}

/** Renders loading (skeleton), error, empty or the content for one widget. */
export function WidgetBody<T>({ w, what, skeleton, isEmpty, empty, children }: {
  w: WidgetState<T>; what: string; skeleton: React.ReactNode
  isEmpty?: (d: T) => boolean; empty?: { title?: string; sub?: React.ReactNode }
  children: (d: T) => React.ReactNode
}) {
  if (w.status === 'loading') return <div aria-busy="true" aria-label={`Loading ${what}`}>{skeleton}</div>
  if (w.status === 'error') return <ErrorState what={what} onRetry={w.retry} />
  if (isEmpty?.(w.data as T)) return <Empty title={empty?.title} sub={empty?.sub} />
  return <>{children(w.data as T)}</>
}

/* ---------- collapsible section title (decorateSections: tip, collapse chevron) ---------- */
export function useCollapse(initial = true) {
  const [open, setOpen] = useState(initial)
  return { open, toggle: () => setOpen(o => !o) }
}
export function SectionHead({ title, tip, open, onToggle, actions, id }: {
  title: React.ReactNode; tip?: string; open?: boolean; onToggle?: () => void
  actions?: React.ReactNode; id?: string
}) {
  return (
    <div className="mb-3 mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 first:mt-0">
      <h2 id={id} className="flex items-center gap-1.5 text-base font-medium">{title}{tip && <InfoTip text={tip} />}</h2>
      <div className="ml-auto flex items-center gap-3">
        {actions}
        {onToggle && (
          <Button variant="ghost" size="icon-xs" onClick={onToggle} aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${typeof title === 'string' ? title : 'section'}`}>
            <ChevronDown className={cn('transition-transform duration-200', !open && '-rotate-90')} />
          </Button>
        )}
      </div>
    </div>
  )
}

/* ---------- one statement from the monthly summaries ---------- */
export function EvidenceRow({ e }: { e: Evidence }) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', e.kind === 'neg' ? 'bg-bad' : 'bg-good')} aria-hidden="true" />
      <div className="min-w-0 space-y-1.5">
        <p className="leading-relaxed">{e.text}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {e.strong && <Badge className="h-4.5 rounded-md bg-bad-soft px-1.5 text-[11px] text-bad">Strong negative</Badge>}
          <span>{e.date ? fmtDY(e.date) : ymLabel(e.ym)}</span>
          {[...e.who, ...e.tickets].map(c => (
            <Badge key={c} variant="outline" className="h-4.5 rounded-md px-1.5 text-[11px] font-normal">{c}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Switches the account tabs (index.tsx keeps them uncontrolled) and optionally scrolls to an element. */
export function showTab(value: string, scrollTo?: string) {
  setTab(value)
  if (scrollTo) requestAnimationFrame(() => requestAnimationFrame(() =>
    document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })))
}
