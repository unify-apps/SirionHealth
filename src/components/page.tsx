import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export function PageHeader({ eyebrow, title, sub, actions }: {
  eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-3xl font-normal tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
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

/** KPI tile: label, big value, hint. `tone` colours the value only (health semantics). */
export function Stat({ label, value, hint, tone, icon, className }: {
  label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode
  tone?: 'good' | 'warn' | 'bad'; icon?: React.ReactNode; className?: string
}) {
  return (
    <Card className={cn('gap-1 px-5 py-4', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={cn('text-2xl font-normal tabular-nums tracking-[-0.02em]',
        tone === 'good' && 'text-good', tone === 'warn' && 'text-warn', tone === 'bad' && 'text-bad')}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
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
