import { isValidElement, useState } from 'react'
import { ChevronLeft, ArrowLeft, ArrowDown, ArrowDownRight, ArrowRight, ArrowUp, ArrowUpDown, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tc } from '@/lib/text'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * Compact page header in the body: one title row (2xl, regular weight) with a muted meta line, actions on the right
 * on the same row. ~64px tall. The top bar above keeps only the breadcrumb and global tools.
 */
export function PageHeader({ eyebrow, title, sub, actions, lead, back, compact = false, compactSub }: {
  eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode
  /** small back link above the title, replaces the old breadcrumb bar */
  back?: { label: string; onClick: () => void }
  /** before the title: a string renders a monogram as tall as the title + meta lines; or pass any element */
  lead?: React.ReactNode
  /** shrunk form for a sticky header once the page scrolls: back link folds away, smaller monogram and title */
  compact?: boolean
  /** meta line shown in the compact form instead of `sub` */
  compactSub?: React.ReactNode
}) {
  const ease = 'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
  return (
    <header className={cn(ease, compact ? 'py-2' : 'pb-5')}>
      <div className={cn('grid', ease, compact ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100', !back && 'md:hidden')} inert={compact}>
        <div className="overflow-hidden">
          <div className="mb-3 flex items-center gap-2">
            <SidebarTrigger className="-ml-1 md:hidden" aria-label="Open navigation" />
            {back && (
              <button type="button" onClick={back.onClick}
                className="-ml-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                <ChevronLeft className="size-4" aria-hidden="true" />{back.label}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        {typeof lead === 'string' ? (() => {
          const mono = cn('grid shrink-0 place-items-center rounded-full bg-muted font-medium text-foreground', ease, compact ? 'size-9 text-xs' : 'size-[52px] text-base')
          // condensed, the back link folds away, so the monogram doubles as the back button (arrow on hover or focus)
          return back && compact ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={back.onClick} aria-label={`Back to ${back.label}`}
                  className={cn(mono, 'group/back outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring')}>
                  <span className="group-hover/back:hidden group-focus-visible/back:hidden" aria-hidden="true">{lead}</span>
                  <ArrowLeft className="hidden size-4 group-hover/back:block group-focus-visible/back:block" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to {back.label}</TooltipContent>
            </Tooltip>
          ) : <span aria-hidden="true" className={mono}>{lead}</span>
        })() : lead}
        <div className="min-w-0">
          {eyebrow && !compact && <p className="text-xs text-muted-foreground">{eyebrow}</p>}
          <h1 className={cn('truncate leading-tight font-normal tracking-[-0.02em]', ease, compact ? 'text-base font-medium' : 'text-2xl')}>{tc(title)}</h1>
          {(compact ? compactSub ?? sub : sub) && <p className={cn('truncate text-muted-foreground', ease, compact ? 'text-xs' : 'mt-0.5 text-sm')}>{compact ? compactSub ?? sub : sub}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

/**
 * Header for a card/block: icon + title (+ count) on the left, actions on the right. No rule under it: every card title row,
 * this and the inline ones on small cards, reads the same. Use as the first child of a Card with py-0 / gap-0.
 */
export function BlockHeader({ icon: Icon, title, count, sub, actions, className }: {
  icon?: LucideIcon; title: React.ReactNode; count?: React.ReactNode; sub?: React.ReactNode
  actions?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-5 pt-4 pb-1', className)}>
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        <h3 className="truncate text-sm font-medium text-foreground">{tc(title)}</h3>
        {count != null && <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">{count}</span>}
        {sub && <span className="hidden truncate text-xs text-muted-foreground sm:inline">{sub}</span>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ title, sub, actions, className }: {
  title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('mb-3 mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 first:mt-0', className)}>
      <h2 className="text-base font-medium">{tc(title)}</h2>
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

/** KPI tile with one fixed structure so tiles in a row line up: icon + label, value (+ delta, + aside),
 *  a visual row that is always 20px tall (reserved when empty), and a one-line truncated hint.
 *  Tiles fill their grid cell, so a row of tiles is equal height. `tone` colours the value only (health semantics). */
export function Stat({ label, value, hint, tone, icon, delta, aside, visual, className }: {
  label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode
  tone?: 'good' | 'warn' | 'bad'
  /** a lucide component (rendered 16px muted) or a ready node */
  icon?: IconLike
  /** change chip next to the value */
  delta?: Delta
  /** small visual to the right of the value, e.g. a ring (keep it ≤32px tall) */
  aside?: React.ReactNode
  /** small visual under the value, e.g. a meter or sparkline; fits a 20px row */
  visual?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('h-full gap-1.5 p-5', className)}>
      <div className="flex h-4 min-w-0 items-center gap-2 text-xs text-muted-foreground"><IconSlot icon={icon} /><span className="truncate">{tc(label)}</span></div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <div className={cn('truncate text-2xl font-normal tabular-nums tracking-[-0.02em]',
            tone === 'good' && 'text-good', tone === 'warn' && 'text-warn', tone === 'bad' && 'text-bad')}>{value}</div>
          {delta && <DeltaChip {...delta} className="shrink-0" />}
        </div>
        {aside}
      </div>
      <div className="flex h-5 min-w-0 items-center [&>*]:w-full" aria-hidden={visual ? undefined : true}>{visual}</div>
      <div className="h-4 truncate text-xs text-muted-foreground" title={typeof hint === 'string' ? hint : undefined}>{hint}</div>
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
export function ListRow({ icon, title, meta, right, onClick, size = 'lg', className, ...aria }: {
  /** a lucide component (shown in a 28px neutral circle, 32px when size="lg") or a ready node such as an avatar */
  icon?: IconLike
  /** lg (default) ≈52px rows with a 32px icon circle; md ≈44px for dense menus. Stack rows with `grid gap-1`. */
  size?: 'md' | 'lg'
  title: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode
  onClick?: () => void; className?: string
  'aria-label'?: string; 'aria-haspopup'?: 'dialog'
}) {
  const body = (
    <>
      {icon != null && (isIconComponent(icon)
        ? <span className={cn('grid shrink-0 place-items-center rounded-full bg-muted', size === 'lg' ? 'size-8' : 'size-7')}><IconSlot icon={icon} /></span>
        : icon)}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {meta && (!onClick && typeof meta === 'string'
          ? <Tip tip={meta}><span tabIndex={0} className={cn('block truncate rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50', size === 'lg' && 'mt-0.5')}>{meta}</span></Tip>
          : <span className={cn('block truncate text-xs text-muted-foreground', size === 'lg' && 'mt-0.5')}>{meta}</span>)}
      </span>
      {right != null && <span className="ml-3 flex shrink-0 items-center gap-3 text-xs">{right}</span>}
    </>
  )
  const cls = cn('flex w-full items-center gap-3 rounded-lg px-2 text-left', size === 'lg' ? 'min-h-13 py-2' : 'min-h-11 py-1.5', className)
  if (!onClick) return <div className={cls}>{body}</div>
  return (
    <button type="button" onClick={onClick} {...aria}
      className={cn(cls, 'cursor-pointer outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring')}>
      {body}
    </button>
  )
}

/** Right side of a two-sided row: a fixed 120px meter and the value in a fixed 48px right-aligned column (fits "No data" on one line), so values line up. */
export function MeterValue({ value, max = 100, tone, label, tip, display, className }: {
  value: number | null | undefined; max?: number; tone?: 'good' | 'warn' | 'bad'
  label?: string; tip?: React.ReactNode; display?: React.ReactNode; className?: string
}) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <Meter value={value} max={max} tone={tone} label={label} tip={tip} className="hidden w-[120px] sm:block" />
      <span className={cn('w-12 text-right text-sm font-medium whitespace-nowrap tabular-nums', tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : tone === 'bad' ? 'text-bad' : 'text-foreground')}>
        {display ?? (value == null ? <span className="text-xs font-normal text-muted-foreground">No data</span> : value)}
      </span>
    </span>
  )
}

/** A long list in two columns on desktop: 32px apart with a hairline between them; one column on phones.
 *  Pass the rows (each already an <li>). The first half fills the left column. */
export function ListColumns({ children, label, className }: { children: React.ReactNode[]; label?: string; className?: string }) {
  const half = Math.ceil(children.length / 2)
  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-1 md:grid-cols-2', className)} aria-label={label} role={label ? 'group' : undefined}>
      <ul className="grid grid-cols-[minmax(0,1fr)] content-start gap-1">{children.slice(0, half)}</ul>
      <ul className="relative grid grid-cols-[minmax(0,1fr)] content-start gap-1 md:before:absolute md:before:inset-y-1 md:before:-left-4 md:before:w-px md:before:bg-hairline">{children.slice(half)}</ul>
    </div>
  )
}

/** Shows the first `n` items of a long list, then a "Show N more" outline pill. */
export function MoreList<T>({ items, n = 3, render, className, noun = 'more' }: {
  items: T[]; n?: number; render: (item: T, i: number) => React.ReactNode; className?: string; noun?: string
}) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, n)
  return (
    <>
      <ul className={className}>{shown.map(render)}</ul>
      {items.length > n && (
        <Button variant="outline" size="sm" className="mt-3 rounded-full" aria-expanded={all} onClick={() => setAll(v => !v)}>
          {all ? 'Show less' : `Show ${items.length - n} ${noun}`}
        </Button>
      )}
    </>
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
export const stickyCol = 'sticky left-0 z-10 bg-card [tr:hover_&]:bg-[color-mix(in_oklab,var(--foreground)_3.5%,var(--card))]'
/** Sticky first column for tables whose rows aren't clickable: no hover tint. */
export const stickyColStatic = 'sticky left-0 z-10 bg-card'

/** Sortable header: the whole cell is the button; the sort icon shows on hover/focus or when active. */
export function SortHead({ children, active, dir, onSort, numeric, sticky, title, className }: {
  children: React.ReactNode; active: boolean; dir: 'asc' | 'desc'; onSort: () => void
  numeric?: boolean; sticky?: boolean; title?: string; className?: string
}) {
  const I = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('p-0 first:pl-0 last:pr-0', numeric && 'text-right', sticky && stickyColStatic, className)}>
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

/* ---------- side sheets: sticky header, then a fact grid and the content in one column; prose capped at ~65ch ---------- */

/** Classes for a sheet's sticky header (title, key status, actions). */
export const sheetHeaderCls = 'sticky top-0 z-10 gap-2 border-b border-hairline bg-popover/95 p-6 pr-12 backdrop-blur-sm'

/** Single-column sheet body (24px padding): `facts` as a compact two-column definition grid at the top, then the content.
 *  Prose is capped at about 65ch. */
export function SheetBody({ facts, children, className }: { facts?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid content-start gap-6 p-6', className)}>
      {facts != null && <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-hairline pb-5 text-sm">{facts}</dl>}
      <div className="grid min-w-0 content-start gap-6 [&_p]:max-w-[65ch]">{children}</div>
    </div>
  )
}

/** One fact in a sheet's fact grid: small muted label over the value. `wide` spans both columns. */
export function Fact({ label, children, wide }: { label: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('grid min-w-0 content-start gap-1', wide && 'col-span-2')}>
      <dt className="text-xs text-muted-foreground">{tc(label)}</dt>
      <dd className="min-w-0">{children}</dd>
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
