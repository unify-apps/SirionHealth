import { useCallback, useEffect, useState } from 'react'
import { CircleAlert, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, TableSkeleton as PageTableSkeleton } from '@/components/page'
import { cn } from '@/lib/utils'

/*
 * One loading, empty and error treatment per widget type. Every screen uses these, and the States
 * reference page shows them side by side. Skeletons take the shape of the real widget so nothing jumps.
 */

export type WidgetStatus = 'loading' | 'ready' | 'error'

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** `?fail=pods,stages` makes those widgets fail their first load, to demo the error state. */
const failsOnLoad = (name: string) =>
  typeof location !== 'undefined' && (new URLSearchParams(location.search).get('fail') ?? '').split(',').includes(name)

/** Simulated first load for a widget (the prototype has no network). Retry reloads it. */
export function useWidget(name: string, ms = 950) {
  const [status, setStatus] = useState<WidgetStatus>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setStatus(attempt === 0 && failsOnLoad(name) ? 'error' : 'ready'),
      reducedMotion() ? 0 : attempt === 0 ? ms : 600)
    return () => clearTimeout(t)
  }, [name, ms, attempt])
  const retry = useCallback(() => { setStatus('loading'); setAttempt(a => a + 1) }, [])
  return { status, retry }
}

/** Empty state with a way back. Wraps the shared `Empty`. */
export function EmptyState({ title, sub, action, onAction, className }: {
  title: string; sub?: React.ReactNode; action?: string; onAction?: () => void; className?: string
}) {
  return (
    <Empty title={title} className={className} sub={
      <>
        {sub}
        {action && (
          <span className="mt-3 flex justify-center">
            <Button variant="outline" size="sm" onClick={onAction}>{action}</Button>
          </span>
        )}
      </>
    } />
  )
}

/** A failed section says what failed and offers a retry; the rest of the page keeps working. */
export function WidgetError({ title, sub, onRetry, className }: {
  title: string; sub?: React.ReactNode; onRetry?: () => void; className?: string
}) {
  return (
    <div role="alert" className={cn('flex items-start gap-3 rounded-lg border border-dashed px-4 py-4', className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            <RotateCw aria-hidden="true" />Try again
          </Button>
        )}
      </div>
    </div>
  )
}

/* ---------- Skeletons, one per widget shape ---------- */

export function KpiSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-2 px-5 py-4', className)} aria-hidden="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-3 w-32" />
    </Card>
  )
}

export function SplitSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map(i => <div key={i} className="grid gap-1.5 px-2.5 py-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-20" /><Skeleton className="h-3 w-28" /></div>)}
      </div>
    </div>
  )
}

/** Table placeholder: 5 rows; the first column is the entity (circle + name), the rest are numbers, right-aligned. */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return <PageTableSkeleton rows={rows} columns={Array.from({ length: cols }, (_, i) => i === 0 ? { w: 'w-28' } : { w: 'w-12', right: true })} />
}

export function BarsSkeleton({ bars = 6 }: { bars?: number }) {
  const widths = ['w-full', 'w-2/3', 'w-3/5', 'w-1/6', 'w-[6%]', 'w-[3%]']
  return (
    <div className="grid gap-3 py-1" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <div key={i} className="grid grid-cols-[8rem_1fr] items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className={cn('h-4', widths[i % widths.length])} />
        </div>
      ))}
    </div>
  )
}

export function DonutSkeleton() {
  return (
    <div className="flex min-h-[152px] flex-col items-center gap-6 sm:flex-row" aria-hidden="true">
      <Skeleton className="size-36 shrink-0 rounded-full" />
      <div className="grid w-full flex-1 gap-3">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-3 w-full" />)}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-1" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-13 items-center gap-3 px-2 py-2">
          <Skeleton className="size-8 rounded-full" />
          <div className="grid flex-1 gap-1.5"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export function TextSkeleton() {
  return (
    <div className="grid gap-2.5" aria-hidden="true">
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  )
}

/** Screen-reader text while a widget loads. */
export function LoadingLabel({ what }: { what: string }) {
  return <span className="sr-only" role="status">Loading {what}</span>
}
