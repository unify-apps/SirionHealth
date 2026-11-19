import { isValidElement } from 'react'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUp, ArrowUpDown, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * Compact page header in the body: one title row (2xl, regular weight) with a muted meta line, actions on the right
 * on the same row. ~64px tall. The top bar above keeps only the breadcrumb and global tools.
 */
export function PageHeader({ eyebrow, title, sub, actions, lead }: {
  eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode
  /** optional element before the title, e.g. an account monogram */
  lead?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-5">
      <div className="flex min-w-0 items-center gap-3">
        {lead}
        <div className="min-w-0">
          {eyebrow && <p className="text-xs text-muted-foreground">{eyebrow}</p>}
          <h1 className="truncate text-2xl leading-tight font-normal tracking-[-0.02em]">{title}</h1>
          {sub && <p className="mt-0.5 truncate text-sm text-muted-foreground">{sub}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ title, sub, actions, className }: {
  title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('mb-3 mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 first:mt-0', className)}>
      <h2 className="text-base font-medium">{title}</h2>
      {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}

type IconLike = LucideIcon | React.ReactNode
const isIconComponent = (i: IconLike): i is LucideIcon =>
  typeof i === 'function' || (typeof i === 'object' && i != null && !isValidElement(i) && '$$typeof' in i)

/** Renders a lucide component at 16px muted, or passes a ready node through. */
function IconSlot({ icon, className }: { icon?: IconLike; className?: string }) {
  if (icon == null || icon === false) return null
  if (isIconComponent(icon)) { const I = icon; return <I className={cn('size-4 shrink-0 text-muted-foreground', className)} aria-hidden="true" /> }
  return <>{icon}</>
}

export type Delta = {
  /** signed change; 0 shows a flat arrow */
  value: number
  /** how to print the number (default: absolute value) */
  format?: (abs: number) => string
  /** what it compares against, e.g. "vs 12-mo avg 215" */
  label?: React.ReactNode
  /** health metric: up is good, down is bad. Otherwise the chip stays neutral. */
  health?: boolean
}

/** Small change chip with an arrow. Green/red only for health metrics; neutral otherwise. */
export function DeltaChip({ value, format, label, health, className }: Delta & { className?: string }) {
  const I = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : ArrowRight
  const tone = !health || value === 0 ? 'bg-muted text-foreground' : value > 0 ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
  const abs = Math.abs(value)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs whitespace-nowrap', className)}>
      <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums', tone)}>
        <I className="size-3" aria-hidden="true" />
        <span className="sr-only">{value > 0 ? 'Up' : value < 0 ? 'Down' : 'No change'}</span>
        {format ? format(abs) : abs.toLocaleString('en-US')}
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  )
}

/** KPI tile: icon + label, big value with an optional delta chip, and a small visual.
 *  `tone` colours the value only (health semantics). */
export function Stat({ label, value, hint, tone, icon, delta, aside, visual, className }: {
  label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode
  tone?: 'good' | 'warn' | 'bad'
  /** a lucide component (rendered 16px muted) or a ready node */
  icon?: IconLike
  /** change chip next to the value */
  delta?: Delta
  /** small visual to the right of the value, e.g. a ring */
  aside?: React.ReactNode
  /** small visual under the value, e.g. a meter or sparkline */
  visual?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('gap-1 px-5 py-4', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><IconSlot icon={icon} />{label}</div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <div className={cn('text-2xl font-normal tabular-nums tracking-[-0.02em]',
            tone === 'good' && 'text-good', tone === 'warn' && 'text-warn', tone === 'bad' && 'text-bad')}>{value}</div>
          {delta && <DeltaChip {...delta} />}
        </div>
        {aside}
      </div>
      {visual && <div className="py-1">{visual}</div>}
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}

/** Thin progress bar for value/max. Over max, the bar fills and a tick marks where max sits.
 *  `tone` is health semantics only; the default fill is the neutral series colour. */
export function Meter({ value, max = 100, tone, fill, label, showValue, tip: tipIn, className }: {
  value: number | null | undefined; max?: number
  tone?: 'good' | 'warn' | 'bad'
  /** custom fill class; overrides tone */
  fill?: string
  /** accessible name */
  label?: string
  /** print "value / max" to the right; pass a node to print something else */
  showValue?: boolean | React.ReactNode
  /** tooltip with the exact value; defaults to the label and value when a label is given */
  tip?: React.ReactNode
  className?: string
}) {
  const has = value != null && max > 0
  const scale = has ? Math.max(max, value) : max
  const pct = has ? Math.max(value > 0 ? 2 : 0, Math.min(100, (value / scale) * 100)) : 0
  const over = has && value > max
  const tip = tipIn ?? (label ? `${label}: ${has ? `${value.toLocaleString('en-US')} of ${max.toLocaleString('en-US')}` : 'No data'}` : undefined)
  const bar = (
    <span role="meter" aria-label={label} tabIndex={tip && !showValue ? 0 : undefined} aria-valuemin={0} aria-valuemax={max} aria-valuenow={has ? value : undefined}
      aria-valuetext={has ? undefined : 'No data'}
      className={cn('relative block h-1.5 w-full overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50', !showValue && className)}>
      {has && <span className={cn('block h-full rounded-full', fill ?? (tone === 'good' ? 'bg-good' : tone === 'warn' ? 'bg-warn' : tone === 'bad' ? 'bg-bad' : 'bg-chart-1'))}
        style={{ width: `${pct}%` }} />}
      {over && <span aria-hidden="true" className="absolute inset-y-0 w-px bg-card" style={{ left: `${(max / scale) * 100}%` }} />}
    </span>
  )
  if (!showValue) return tip ? <Tip tip={tip}>{bar}</Tip> : bar
  return (
    <span className={cn('flex items-center gap-2', className)}>
      {bar}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {showValue === true ? (has ? `${value.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}` : 'No data') : showValue}
      </span>
    </span>
  )
}

/** Compact list row (≈44–52px): 28px neutral icon circle or avatar, one-line title, one muted meta line,
 *  right slot for a status dot/pill or number. Becomes a button when it has an onClick. */
export function ListRow({ icon, title, meta, right, onClick, className, ...aria }: {
  /** a lucide component (shown in a 28px neutral circle) or a ready node such as an avatar */
  icon?: IconLike
  title: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode
  onClick?: () => void; className?: string
  'aria-label'?: string; 'aria-haspopup'?: 'dialog'
}) {
  const body = (
    <>
      {icon != null && (isIconComponent(icon)
        ? <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted"><IconSlot icon={icon} /></span>
        : icon)}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {meta && (!onClick && typeof meta === 'string'
          ? <Tip tip={meta}><span tabIndex={0} className="block truncate rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{meta}</span></Tip>
          : <span className="block truncate text-xs text-muted-foreground">{meta}</span>)}
      </span>
      {right != null && <span className="flex shrink-0 items-center gap-2 text-xs">{right}</span>}
    </>
  )
  const cls = cn('flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left', className)
  if (!onClick) return <div className={cls}>{body}</div>
  return (
    <button type="button" onClick={onClick} {...aria}
      className={cn(cls, 'cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring')}>
      {body}
    </button>
  )
}

/** Small sticky muted header for a group of list rows (day, month, status). */
export function ListGroupHeader({ children, count, right, className }: {
  children: React.ReactNode; count?: number; right?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('sticky top-0 z-[5] -mx-2 flex items-center gap-1.5 bg-card px-4 pt-4 pb-2 text-xs font-medium text-muted-foreground', className)}>
      <span>{children}</span>
      {count != null && <span className="tabular-nums">{count}</span>}
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

/** Wraps a trigger in a shadcn tooltip when there is something to say; otherwise renders the child alone. */
export function Tip({ tip, children, side }: { tip?: React.ReactNode; children: React.ReactElement; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  if (tip == null || tip === '') return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-72 text-pretty">{tip}</TooltipContent>
    </Tooltip>
  )
}

/* ---------- tables: the base look lives in ui/table.tsx; these are the shared pieces on top ---------- */

/** First column stays put on horizontal scroll. Its background follows the row hover tint. */
export const stickyCol = 'sticky left-0 z-10 bg-card [tr:hover_&]:bg-[color-mix(in_oklab,var(--accent)_60%,var(--card))]'

/** Sortable header: the whole cell is the button; the sort icon shows on hover/focus or when active. */
export function SortHead({ children, active, dir, onSort, numeric, sticky, title, className }: {
  children: React.ReactNode; active: boolean; dir: 'asc' | 'desc'; onSort: () => void
  numeric?: boolean; sticky?: boolean; title?: string; className?: string
}) {
  const I = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('p-0 first:pl-0 last:pr-0', numeric && 'text-right', sticky && stickyCol, className)}>
      <Tip tip={title}><button type="button" onClick={onSort}
        className={cn('group/sort flex h-9 w-full items-center gap-1 px-3 text-xs font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
          '[th:first-child_&]:pl-4 [th:last-child_&]:pr-4', numeric && 'flex-row-reverse', active ? 'text-foreground' : 'text-muted-foreground')}>
        {children}
        <I className={cn('size-3 shrink-0', !active && 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60')} aria-hidden="true" />
      </button></Tip>
    </TableHead>
  )
}

/** Table placeholder: 5 rows in the real column widths. `lead` draws the first column's circle. */
export function TableSkeleton({ columns, rows = 5, lead = true, className }: {
  columns: { w: string; right?: boolean }[]; rows?: number; lead?: boolean; className?: string
}) {
  return (
    <Table aria-hidden="true" className={className}>
      <TableHeader>
        <TableRow>{columns.map((c, i) => <TableHead key={i} className={cn(c.right && 'text-right')}><Skeleton className={cn('inline-block h-3 w-12 align-middle')} /></TableHead>)}</TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, r) => (
          <TableRow key={r} className="hover:bg-transparent">
            {columns.map((c, i) => (
              <TableCell key={i} className={cn(c.right && 'text-right')}>
                {i === 0 && lead
                  ? <span className="flex items-center gap-2.5"><Skeleton className="size-7 shrink-0 rounded-full" /><Skeleton className={cn('h-3.5', c.w)} /></span>
                  : <Skeleton className={cn('inline-block h-3.5 align-middle', c.w)} />}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Footer under a table: "Showing N of M" on the left, a pager or other controls on the right. */
export function TableFooterBar({ shown, total, children, className }: {
  shown: React.ReactNode; total: number; children?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-2.5 text-xs text-muted-foreground tabular-nums', className)}>
      <span>Showing {shown} of {total}</span>
      {children}
    </div>
  )
}

/* ---------- side sheets: sticky header, then facts left (~240px) and content right; prose capped at ~65ch ---------- */

/** Classes for a sheet's sticky header (title, key status, actions). */
export const sheetHeaderCls = 'sticky top-0 z-10 gap-2 border-b border-hairline bg-popover/95 p-6 pr-12 backdrop-blur-sm'

/** Two-column sheet body: `aside` holds facts and meta, children hold the content. Stacks on phones. */
export function SheetColumns({ aside, children, className }: { aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-6 p-6', aside != null && 'md:grid-cols-[240px_minmax(0,1fr)] md:gap-8', className)}>
      {aside != null && <aside className="grid content-start gap-5 text-sm">{aside}</aside>}
      <div className="grid min-w-0 content-start gap-6 [&_p]:max-w-[65ch]">{children}</div>
    </div>
  )
}

/** One fact in a sheet's aside: small muted label over the value. */
export function Fact({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** One empty state for every widget. A missing value reads "No data", never -1, "-" or undefined. */
export function Empty({ title = 'No data', sub, action, className }: {
  title?: string; sub?: React.ReactNode; action?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('grid place-items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center', className)}>
      <p className="text-sm">{title}</p>
      {sub && <p className="max-w-sm text-xs text-muted-foreground">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
