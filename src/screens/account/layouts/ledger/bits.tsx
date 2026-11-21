/* Small pieces shared by the Ledger layout: section heads, signed figures. */
import { cn } from '@/lib/utils'

export const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** A cluster of related sections: one strong rule on top, generous space above it. Sections inside sit closer. */
export function Cluster({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-24 border-t border-foreground/70 pt-5', className)}>{children}</div>
}

/** A section: title (and an optional quiet aside); actions sit right on the title line. */
export function LedgerSection({ id, title, aside, actions, children, className }: {
  id: string; title: string; aside?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <section aria-labelledby={id} className={cn('min-w-0', className)}>
      <div className="flex min-h-8 flex-wrap items-baseline gap-x-3 gap-y-1 pb-2">
        <h2 id={id} className="font-heading text-[22px] leading-tight font-normal tracking-[-0.01em]">{title}</h2>
        {aside && <span className="text-[13px] text-muted-foreground">{aside}</span>}
        {actions && <div className="ml-auto flex items-center gap-3 self-center">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/** Signed change in plain figures: −31, +4, or a dash when flat. */
export const signed = (n: number) => (n === 0 ? '0' : `${n < 0 ? '−' : '+'}${Math.abs(n)}`)
