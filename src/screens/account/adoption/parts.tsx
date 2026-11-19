import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BarList } from '@/components/charts'
import { Skeleton } from '@/components/ui/skeleton'
import { BlockHeader, Stat, Empty, Meter } from '@/components/page'
import { cn } from '@/lib/utils'
import type { StatRow } from './model'

export function ChartCard({ title, sub, icon, count, children, className }: {
  title: string; sub?: React.ReactNode; icon?: LucideIcon; count?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <BlockHeader icon={icon} title={title} count={count} sub={sub} />
      <div className="p-5">{children}</div>
    </Card>
  )
}

export function StatGrid({ rows }: { rows: StatRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {rows.map(r => (
        <Stat key={r.label} icon={r.icon} label={r.label} value={r.value} hint={r.hint || undefined}
          delta={r.delta} visual={r.meter && <Meter value={r.meter.value} max={r.meter.max} label={r.label} />} />
      ))}
    </div>
  )
}

export function StatGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <Card key={i} className="gap-2 px-5 py-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-16" /><Skeleton className="h-1.5 w-full" /><Skeleton className="h-3 w-28" /></Card>
      ))}
    </div>
  )
}

/** Ticket themes as horizontal bars, most tickets first. Hover or arrow-key a bar for its count. */
export function ThemeBars({ themes }: { themes: { name: string; tickets: number }[] }) {
  if (!themes.length) return <Empty title="No ticket themes" sub="No tickets have been grouped into themes yet." className="py-6" />
  return <BarList data={themes.map(t => ({ label: t.name, value: t.tickets }))} name="Tickets" track rowHeight={30} />
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-0 py-0', className)} aria-hidden="true">
      <div className="flex min-h-12 items-center gap-2 border-b border-hairline px-5"><Skeleton className="size-4" /><Skeleton className="h-4 w-48" /></div>
      <div className="p-5"><Skeleton className="h-48 w-full" /></div>
    </Card>
  )
}
