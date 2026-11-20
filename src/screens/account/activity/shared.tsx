/* Small building blocks shared by the Activity, Stakeholders and Intelligence tabs.
   (Candidates for src/components/page.tsx; kept here because that file is shared.) */
import { useEffect, useState } from 'react'
import { AlertCircle, Info, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type Load<T> =
  | { status: 'loading'; retry: () => void }
  | { status: 'error'; error: unknown; retry: () => void }
  | { status: 'ready'; data: T; retry: () => void }

/** Builds a widget's data off the render path, so every widget has a loading, error and ready state.
 *  The fixtures are synchronous today; a live fetch drops in here later. */
export function useLoad<T>(build: () => T, delay = 260, what = 'this section'): Load<T> {
  const [run, setRun] = useState(0)
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T }>({ status: 'loading' })
  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    const t = setTimeout(() => {
      try { const data = build(); if (live) setState({ status: 'ready', data }) }
      catch (error) {
        console.error(error)
        if (!live) return
        setState({ status: 'error', error })
        // a retry that fails again says so, with another way to retry
        if (run > 0) toast.error(`Couldn't load ${what}`, { description: 'The account data still didn\'t come through.', action: { label: 'Retry', onClick: () => setRun(n => n + 1) } })
      }
    }, delay)
    return () => { live = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])
  return { ...state, retry: () => setRun(n => n + 1) } as Load<T>
}

/** One error state for every widget: what happened, and a way to try again. */
export function ErrorState({ what, onRetry, className }: { what: string; onRetry: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center', className)}>
      <AlertCircle className="size-5 text-bad" aria-hidden="true" />
      <p className="text-sm">Couldn't load {what}</p>
      <p className="max-w-sm text-xs text-muted-foreground">The account data didn't come through. Your filters are kept.</p>
      <Button variant="outline" size="sm" onClick={onRetry}><RotateCw />Try again</Button>
    </div>
  )
}

/** ⓘ tip next to a heading. Keyboard reachable. */
export function InfoTip({ children, label = 'About this' }: { children: React.ReactNode; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} className="inline-grid size-5 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-pretty">{children}</TooltipContent>
    </Tooltip>
  )
}

export const initials = (n: string) => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
export { fmtShort as fmtD, fmtFull as fmtDY, fmtMonth as ymLabel, fmtMonthLong as ymLong, isoDay as dayISO } from '@/lib/dates'
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`
