import { Award, Check, ChevronDown, Crown, Pencil, RotateCcw, User, UserMinus, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ymLabel } from '../activity/shared'
import { ENG_LABEL, persona, ROLE_OPTS, TONE_LABEL, type Engagement, type StakeRow, type Tone } from './model'
import { roleChange, roleStore } from './store'

const P_ICON = { sponsor: Crown, champion: Award, tech: Wrench, former: UserMinus, user: User }

/** Role tag. Inferred roles (suggested from the summaries, not confirmed) get a dashed border and say so. */
export function RoleTag({ row, className }: { row: Pick<StakeRow, 'label' | 'source'>; className?: string }) {
  if (!row.label) return <span className={cn('text-xs text-muted-foreground', className)}>No role</span>
  const p = persona(row.label), Icon = P_ICON[p], ai = row.source === 'inferred' || row.source === 'news'
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
      ai ? 'border-dashed border-border text-foreground'
        : p === 'former' ? 'border-dashed border-border text-muted-foreground'
        : p === 'sponsor' || p === 'champion' ? 'border-border bg-card text-foreground' : 'border-hairline bg-surface-2 text-foreground', className)}>
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{row.label}</span>
      {ai && <span className="font-normal text-muted-foreground">suggested</span>}
    </span>
  )
}

const ENG_DOT: Record<Engagement, string> = {
  active: 'bg-foreground', warm: 'bg-muted-foreground', quiet: 'border border-muted-foreground bg-transparent', none: 'hidden',
}
export function EngagementPill({ eng, days }: { eng: Engagement; days: number | null }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          eng === 'none' ? 'text-muted-foreground' : 'bg-surface-2 text-foreground')}>
          <span className={cn('size-1.5 rounded-full', ENG_DOT[eng])} aria-hidden="true" />{ENG_LABEL[eng]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{days == null ? 'Never named in a monthly summary' : `Last named ${days} days ago. Active ≤ 30 days, warm ≤ 90, quiet after.`}</TooltipContent>
    </Tooltip>
  )
}

const TONE_CLS: Record<Tone, string> = { pos: 'bg-good-soft text-good', neg: 'bg-bad-soft text-bad', mix: 'bg-warn-soft text-warn', none: 'text-muted-foreground' }
export function TonePill({ tone, pos, neg }: { tone: Tone; pos: number; neg: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50', TONE_CLS[tone])}>
          {TONE_LABEL[tone]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{pos} positive, {neg} negative statement{pos + neg === 1 ? '' : 's'} naming them in the monthly summaries</TooltipContent>
    </Tooltip>
  )
}

/** 18 bars, one per monthly summary; height = statements naming the person that month. */
export function MonthStrip({ months, labels, max, className }: { months: number[]; labels: string[]; max: number; className?: string }) {
  const total = months.reduce((a, b) => a + b, 0)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} role="img" aria-label={`${total} mentions across ${months.length} monthly summaries`}
          className={cn('inline-flex h-[18px] items-end gap-0.5 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50', className)}>
          {months.map((n, k) => (
            <i key={k} className={cn('w-1 rounded-[1px]', n ? 'bg-chart-1' : 'bg-chart-5')} style={{ height: n ? 4 + Math.round((n / Math.max(1, max)) * 14) : 2 }} />
          ))}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="mb-1">{total} mention{total === 1 ? '' : 's'}, {labels.length ? `${ymLabel(labels[0])} to ${ymLabel(labels[labels.length - 1])}` : ''}</p>
        {months.some(Boolean) && <p className="opacity-80">{months.map((n, k) => n ? `${ymLabel(labels[k])}: ${n}` : null).filter(Boolean).join(' · ')}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

/** Edit a person's role: pick one, keep the inferred one, or go back to what AHI had. */
export function RoleMenu({ row, children, align = 'start', reveal = false }: { row: StakeRow; children?: React.ReactNode; align?: 'start' | 'end'; reveal?: boolean }) {
  const canKeep = row.source === 'inferred' || row.source === 'news'
  return (
    <DropdownMenu>
      {children ? (
        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>{children}</DropdownMenuTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon-xs" aria-label={`Edit role for ${row.name}`}
                className={cn(reveal && 'transition-opacity focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/row:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100')}><Pencil /></Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Edit role</TooltipContent>
        </Tooltip>
      )}
      <DropdownMenuContent align={align} className="w-60" onClick={e => e.stopPropagation()}>
        <DropdownMenuLabel>Role for {row.name}</DropdownMenuLabel>
        {canKeep && row.aiRole && (
          <DropdownMenuItem onSelect={() => roleChange(() => roleStore.confirm(row.key), `Confirmed ${row.name} as ${row.aiRole}`)}>
            <Check />Keep {row.aiRole} <span className="ml-auto text-xs text-muted-foreground">suggested</span>
          </DropdownMenuItem>
        )}
        {canKeep && <DropdownMenuSeparator />}
        <DropdownMenuRadioGroup value={row.label} onValueChange={v => roleChange(() => roleStore.set(row.key, v), `${row.name} is now ${v.toLowerCase()}`)}>
          {ROLE_OPTS.map(o => <DropdownMenuRadioItem key={o} value={o}>{o}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
        {row.source === 'mine' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => roleChange(() => roleStore.reset(row.key), `Role change undone for ${row.name}`)}><RotateCcw />Undo my change</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The role cell: tag plus an edit menu, or a "Set role" button when there is none. */
/** `reveal`: inside a `group/row` table row, the pencil shows on row hover or focus (always on touch). */
export function RoleCell({ row, reveal = false }: { row: StakeRow; reveal?: boolean }) {
  if (!row.label) return (
    <RoleMenu row={row}>
      <Button variant="outline" size="xs" aria-label={`Set role for ${row.name}`}>Set role<ChevronDown /></Button>
    </RoleMenu>
  )
  return (
    <span className="inline-flex max-w-full items-center gap-1">
      <RoleTag row={row} />
      <RoleMenu row={row} reveal={reveal} />
    </span>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('inline-grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium',
      'bg-surface-2 text-foreground', className)}>
      {name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
    </span>
  )
}
