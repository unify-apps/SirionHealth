import { setTab } from '../tab'
/* Small shared pieces for the account header and Summary tab: info tips, source tags,
   widget load/empty/error states, collapsible section titles, evidence rows. */
import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowRight, CalendarClock, ChevronDown, DollarSign, Info, LifeBuoy, MessageSquare, TrendingUp, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Empty } from '@/components/page'
import { fmtDY, score, ymLabel, type AreaKey, type Evidence } from '../facts'

/* ---------- terms, codes and truncated text ---------- */

/** One line per code or abbreviation the app shows. Daily CSM labels (NRR, GRR, CARR, MAU) stay on screen with this as their tooltip.
 *  Internal codes (O7, TFC, PER) are written out in plain words on screen; the code only appears in the tooltip. */
export const GLOSSARY: Record<string, string> = {
  NRR: 'Net revenue retention: revenue kept from existing customers, including expansion',
  GRR: 'Gross revenue retention: revenue kept from existing customers, before expansion',
  CARR: 'Contracted annual recurring revenue',
  ARR: 'Annual recurring revenue',
  MAU: 'Monthly active users',
  PER: 'Product enhancement requests (open Jira tickets)',
  O7: 'Health cannot go above 50 when the contract renews within 60 days and auto-renew is off',
  TFC: 'Termination for convenience',
}

/** A term with a definition: tooltip on hover and keyboard focus, no underline.
 *  `focusable={false}` inside a button or another trigger (hover still works). */
export function Term({ children, tip, focusable = true, className }: {
  children: React.ReactNode; tip?: React.ReactNode; focusable?: boolean; className?: string
}) {
  const text = tip ?? (typeof children === 'string' ? GLOSSARY[children] : undefined)
  if (!text) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={focusable ? 0 : undefined}
          className={cn('cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{text}</TooltipContent>
    </Tooltip>
  )
}

/** Plain-language name for the renewal cap, with the record's code in the tooltip. Use focusable={false} inside sheets and popovers. */
export function CapTerm({ focusable = true, className, children = 'renewal cap' }: { focusable?: boolean; className?: string; children?: React.ReactNode }) {
  return <Term focusable={focusable} className={className} tip={`${score.overrideCode}: ${GLOSSARY[score.overrideCode] ?? 'Caps the health score'}`}>{children}</Term>
}

const CODE_RE = new RegExp(`\\b(${Object.keys(GLOSSARY).join('|')})\\b`, 'g')

/** Plain text with every known code (NRR, GRR, CARR, MAU, PER, O7...) wrapped in a `Term`. */
export function Glossed({ text, focusable = true }: { text: string; focusable?: boolean }) {
  const parts = text.split(CODE_RE)
  return <>{parts.map((p, i) => (i % 2 ? <Term key={i} focusable={focusable}>{p}</Term> : p))}</>
}

/** One-line text that shows its full content in a tooltip, only when it is cut off. */
export function Truncate({ children, tip, className }: { children: React.ReactNode; tip?: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const cut = () => !!ref.current && ref.current.scrollWidth > ref.current.clientWidth + 1
  return (
    <Tooltip open={open} onOpenChange={o => setOpen(o && cut())}>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn('block truncate', className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80">{tip ?? children}</TooltipContent>
    </Tooltip>
  )
}

/** Affordances. Opens a sheet: bordered pill (`Button variant="outline"`, rounded-full) or a hover-tinted row.
 *  Navigates (another tab, a scroll target): `NavLink`, plain link text with a trailing arrow. Static fact: no button look, no hover. */
export function NavLink({ children, onClick, className, ...aria }: {
  children: React.ReactNode; onClick: () => void; className?: string; 'aria-label'?: string
}) {
  return (
    <button type="button" onClick={onClick} {...aria}
      className={cn('group/nav inline-flex cursor-pointer items-center gap-1 rounded-sm text-sm text-signal outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring', className)}>
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover/nav:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
    </button>
  )
}

/** One icon per health area, used wherever an area is named. */
export const AREA_ICON: Record<AreaKey, LucideIcon> = {
  commercial: DollarSign, adoption: TrendingUp, support: LifeBuoy, engagement: Users, sentiment: MessageSquare, renewalRisk: CalendarClock,
}

/** Status dot classes for list rows. Green, amber and red are health only. */
export const DOT = { good: 'bg-good-fill', warn: 'bg-warn-fill', bad: 'bg-bad-fill', none: 'bg-muted-foreground/50' } as const

/** Compact list row: neutral icon circle, one-line title, one muted meta line, status dot on the right.
 *  The whole row is the button when `onClick` is set. */
export function ListRow({ icon: Icon, title, meta, status, onClick, label }: {
  icon: LucideIcon; title: React.ReactNode; meta?: React.ReactNode
  status?: { tone: keyof typeof DOT; label: string }; onClick?: () => void; label?: string
}) {
  const body = (
    <>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted" aria-hidden="true">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <Truncate>{title}</Truncate>
        {meta && <Truncate className="text-xs tabular-nums text-muted-foreground">{meta}</Truncate>}
      </span>
      {status && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="grid size-4 place-items-center" aria-hidden="true">
                <span className={cn('size-2 rounded-full', DOT[status.tone])} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{status.label}</TooltipContent>
          </Tooltip>
          <span className="hidden sm:inline">{status.label}</span>
          <span className="sr-only sm:hidden">{status.label}</span>
        </span>
      )}
    </>
  )
  const cls = '-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left'
  return (
    <li>
      {onClick
        ? <button type="button" onClick={onClick} aria-label={label}
            className={cn(cls, 'cursor-pointer transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>{body}</button>
        : <div className={cls}>{body}</div>}
    </li>
  )
}

/** The prototype's (i) tip: hover or focus shows the text. */
export function InfoTip({ text, className }: { text: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={typeof text === 'string' ? `About this: ${text}` : 'About this'}
          className={cn('inline-grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  )
}

/** Provenance as one plain muted word: scored by a model or by rules. */

/* ---------- widget states ---------- */
export type WidgetState<T> = { status: 'loading' | 'ready' | 'error'; data?: T; error?: string; retry: () => void }

/** Review hook: `?widgets=loading|error` in the URL holds every widget in that state. */
const forced = () => new URLSearchParams(location.search).get('widgets') as 'loading' | 'error' | null

/** Builds a widget's data off the render path so every widget has real loading, ready and error states.
 *  `deps` re-runs it, e.g. when the date range changes. */
export function useWidget<T>(compute: () => T, deps: unknown[] = []): WidgetState<T> {
  const [run, setRun] = useState(0)
  const [s, set] = useState<Omit<WidgetState<T>, 'retry'>>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    const f = forced()
    set({ status: 'loading' })
    if (f === 'loading') return
    if (f === 'error') { set({ status: 'error', error: 'Forced by ?widgets=error' }); return }
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(() => {
      try { const data = compute(); if (alive) set({ status: 'ready', data }) }
      catch (e) { if (alive) set({ status: 'error', error: e instanceof Error ? e.message : String(e) }) }
    }, reduced ? 0 : 260)
    return () => { alive = false; clearTimeout(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps])
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
      <h2 id={id} className="flex items-center gap-1.5 text-base font-medium">{tc(title)}{tip && <InfoTip text={tip} />}</h2>
      {onToggle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={onToggle} aria-expanded={open}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${typeof title === 'string' ? title : 'section'}`}
              className="-ml-1.5 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
              <ChevronDown className={cn('transition-transform duration-200', !open && '-rotate-90')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{open ? 'Collapse' : 'Expand'}</TooltipContent>
        </Tooltip>
      )}
      {actions && <div className="ml-auto flex items-center gap-3">{actions}</div>}
    </div>
  )
}

/* ---------- one statement from the monthly summaries ---------- */
export function EvidenceRow({ e }: { e: Evidence }) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', e.kind === 'neg' ? 'bg-bad-fill' : 'bg-good-fill')} aria-hidden="true" />
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
