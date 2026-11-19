import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Load<T> =
  | { status: 'loading' } | { status: 'error'; error: string; retry: () => void } | { status: 'ready'; data: T }

/** Reads a tab's data after a short beat, the way the legacy view showed skeletons on entry.
    A throw in the reader becomes an error state with a retry. */
export function useLoad<T>(read: () => T, delay = 450, what = 'this section'): Load<T> {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ attempt: number; data?: T; error?: string } | null>(null)
  const retry = useCallback(() => { setState(null); setAttempt(a => a + 1) }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      try { setState({ attempt, data: read() }) }
      catch (e) {
        const error = e instanceof Error ? e.message : String(e)
        setState({ attempt, error })
        // a retry that fails again says so, with another way to retry
        if (attempt > 0) toast.error(`Couldn't load ${what}`, { description: error, action: { label: 'Retry', onClick: () => { setState(null); setAttempt(a => a + 1) } } })
      }
    }, delay)
    return () => clearTimeout(t)
    // read is a stable module function; attempt drives retries (deps intentionally exclude it)
  }, [attempt, delay])
  if (!state || state.attempt !== attempt) return { status: 'loading' }
  if (state.error != null) return { status: 'error', error: state.error, retry }
  return { status: 'ready', data: state.data as T }
}

/** Error state: same frame as Empty, with what went wrong and a retry. */
export function LoadError({ what, error, retry, className }: {
  what: string; error: string; retry: () => void; className?: string
}) {
  return (
    <div role="alert" className={cn('grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center', className)}>
      <AlertCircle className="size-4 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm">Could not load {what}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
      <Button variant="outline" size="sm" onClick={retry} className="mt-1"><RotateCw />Try again</Button>
    </div>
  )
}
