import { cn } from '@/lib/utils'
import { Meter } from '@/components/charts'

/** Health bands. Green, amber and red mean health only — never a chart series or decoration. */
export type Band = 'good' | 'warn' | 'bad' | 'none'

/** A missing value (null, undefined or the source's -1) is "No data", never a score. */
export const isMissing = (s: number | null | undefined): s is null | undefined => s == null || s < 0

export const bandOf = (s: number | null | undefined): Band =>
  isMissing(s) ? 'none' : s >= 70 ? 'good' : s >= 40 ? 'warn' : 'bad'

export const BAND_LABEL: Record<Band, string> = { good: 'Healthy', warn: 'Watch', bad: 'At risk', none: 'No data' }

export const bandText: Record<Band, string> = {
  good: 'text-good', warn: 'text-warn', bad: 'text-bad', none: 'text-muted-foreground',
}
export const bandBg: Record<Band, string> = {
  good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', none: 'bg-muted-foreground/40',
}
export const bandSoft: Record<Band, string> = {
  good: 'bg-good-soft', warn: 'bg-warn-soft', bad: 'bg-bad-soft', none: 'bg-muted',
}
const bandStroke: Record<Band, string> = {
  good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)', none: 'var(--muted-foreground)',
}

/** Circular score. size in px. */
export function HealthRing({ value, size = 28, stroke = 2.5, className, label = true }: {
  value: number | null | undefined; size?: number; stroke?: number; className?: string; label?: boolean
}) {
  const b = bandOf(value)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = isMissing(value) ? 0 : Math.min(100, value) / 100
  return (
    <span className={cn('relative inline-grid place-items-center shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bandStroke[b]} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out" />
      </svg>
      {label && (
        <span className={cn('absolute tabular-nums font-medium', bandText[b])} style={{ fontSize: Math.max(10, size * 0.36) }}>
          {isMissing(value) ? '–' : value}
        </span>
      )}
    </span>
  )
}

/** Inline score with a short bar, for tables. */
export function HealthBar({ value, className }: { value: number | null | undefined; className?: string }) {
  const b = bandOf(value)
  if (isMissing(value)) return <span className={cn('text-muted-foreground', className)}>No data</span>
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('w-7 text-right tabular-nums font-medium', bandText[b])}>{value}</span>
      <Meter value={value} fill={bandBg[b]} className="w-16" />
    </span>
  )
}

/** Status pill: dot + label, hairline border, tinted. */
export function HealthPill({ value, band, children, className }: {
  value?: number | null; band?: Band; children?: React.ReactNode; className?: string
}) {
  const b = band ?? bandOf(value)
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium', bandSoft[b], bandText[b], className)}>
      <span className={cn('size-1.5 rounded-full', bandBg[b])} />
      {children ?? BAND_LABEL[b]}
    </span>
  )
}
