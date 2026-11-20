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

/** The role list in groups, so twelve options scan as four short lists. */
const ROLE_GROUPS: { label: string; roles: (typeof ROLE_OPTS)[number][] }[] = [
  { label: 'Decision', roles: ['Executive Sponsor', 'Champion', 'Decision Maker', 'Influencer'] },
  { label: 'Technical', roles: ['Technical Owner', 'IT and Security Contact', 'System Administrator'] },
  { label: 'Business', roles: ['Key User', 'Procurement', 'Legal'] },
  { label: 'No longer in role', roles: ['Former Champion', 'Left the Role'] },
]

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
        <span tabIndex={0} className={cn('inline-flex items-center gap-1.5 rounded-sm text-xs whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          eng === 'none' ? 'text-muted-foreground' : 'text-foreground')}>
          <span className={cn('size-1.5 rounded-full', ENG_DOT[eng])} aria-hidden="true" />{ENG_LABEL[eng]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{days == null ? 'Never named in a monthly summary' : `Last named ${days} days ago. Active ≤ 30 days, warm ≤ 90, quiet after.`}</TooltipContent>
    </Tooltip>
  )
}

const TONE_DOT: Record<Tone, string> = { pos: 'bg-good', neg: 'bg-bad', mix: 'bg-warn', none: 'hidden' }
export function TonePill({ tone, pos, neg }: { tone: Tone; pos: number; neg: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn('inline-flex items-center gap-1.5 rounded-sm text-xs whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50', tone === 'none' ? 'text-muted-foreground' : 'text-foreground')}>
          <span className={cn('size-1.5 rounded-full', TONE_DOT[tone])} aria-hidden="true" />{TONE_LABEL[tone]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{pos} positive, {neg} negative statement{pos + neg === 1 ? '' : 's'} naming them in the monthly summaries</TooltipContent>
    </Tooltip>
  )
}

/** One bar per monthly summary on a shared baseline; height = statements naming the person that month.
 *  Months with none show only the baseline. The last three months are full strength, older ones lighter,
 *  so recent contact reads first. The total sits at the end. */
export function MonthStrip({ months, labels, max, className, total: showTotal = true }: { months: number[]; labels: string[]; max: number; className?: string; total?: boolean }) {
  const total = months.reduce((a, b) => a + b, 0)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} role="img" aria-label={`${total} mentions across ${months.length} monthly summaries`}
          className={cn('inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50', className)}>
          <span className="relative inline-flex h-4 items-end gap-[2px] border-b border-border" aria-hidden="true">
            {months.map((n, k) => (
              <i key={k} className={cn('w-[3px] rounded-t-[1px] bg-chart-1', k < months.length - 3 && 'opacity-55')}
                style={{ height: n ? 3 + Math.round((n / Math.max(1, max)) * 13) : 0 }} />
            ))}
          </span>
          {showTotal && <span className={cn('w-5 text-xs tabular-nums', total ? 'text-foreground' : 'text-muted-foreground')}>{total}</span>}
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
      <DropdownMenuContent align={align} collisionPadding={12} className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-60 overflow-y-auto rounded-xl p-1" onClick={e => e.stopPropagation()}>
        <DropdownMenuLabel className="truncate px-2 pt-1 pb-1.5 text-xs font-normal text-muted-foreground">Role for {row.name}</DropdownMenuLabel>
        {canKeep && row.aiRole && (
          <div className="mb-1 flex items-center gap-2 rounded-md bg-surface-2 py-1 pr-1 pl-2 text-xs">
            <span className="min-w-0 flex-1 truncate"><span className="text-muted-foreground">Suggested </span><span className="font-medium">{row.aiRole}</span></span>
            <Button size="xs" variant="outline" className="h-6" onClick={() => roleChange(() => roleStore.confirm(row.key), `Confirmed ${row.name} as ${row.aiRole}`)}><Check />Confirm</Button>
          </div>
        )}
        <DropdownMenuRadioGroup value={row.label} onValueChange={v => roleChange(() => roleStore.set(row.key, v), `${row.name} is now ${v}`)}>
          {ROLE_GROUPS.map((g, gi) => (
            <div key={g.label}>
              {/* groups split by a hairline only; the icons already say which kind of role it is */}
              {gi > 0 && <DropdownMenuSeparator className="my-1" aria-label={g.label} />}
              {g.roles.map(o => {
                const I = P_ICON[persona(o)]
                return <DropdownMenuRadioItem key={o} value={o} className="h-7 gap-2 py-0 text-[13px]"><I className="size-3.5 text-muted-foreground" aria-hidden="true" />{o}</DropdownMenuRadioItem>
              })}
            </div>
          ))}
        </DropdownMenuRadioGroup>
        {row.source === 'mine' && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onSelect={() => roleChange(() => roleStore.reset(row.key), `Role change undone for ${row.name}`)} className="h-8"><RotateCcw />Undo my change</DropdownMenuItem>
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
