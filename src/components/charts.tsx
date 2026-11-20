/* Chart kit on top of shadcn chart (recharts). Every chart in the app draws from these presets and parts, so
   margins, dashes, fills and colours stay the same everywhere. Axis ticks, grid, reference lines, cursor and
   dots are themed by CSS inside [data-slot="chart"] (src/index.css); the tooltip surface by ui/chart.tsx.

   Colour rules: nominal series take --chart-1..3 in that fixed order, "other"/context takes --chart-4, tracks
   --chart-5. Ordinal data takes the --chart-seq-* ramp. Green/amber/red are for health score values only. */
import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Pie, PieChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BAND_LABEL, bandOf, bandText } from '@/components/health'
import { Empty } from '@/components/page'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------- tokens and presets */

/** Nominal series, fixed order. Never cycle or reorder. */
export const SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'] as const
/** "Other" or context series. */
export const OTHER = 'var(--chart-4)'
/** Track behind bars and meters. */
export const TRACK = 'var(--chart-5)'
const SEQ = ['var(--chart-seq-1)', 'var(--chart-seq-2)', 'var(--chart-seq-3)', 'var(--chart-seq-4)']

/** Sequential ramp for n ordinal steps, low to high emphasis. `highFirst` when the data lists the top step first (P1 before P4). */
export function seqColors(n: number, highFirst = false): string[] {
  const pick = n <= 1 ? [2] : n === 2 ? [1, 3] : n === 3 ? [1, 2, 3]
    : Array.from({ length: n }, (_, i) => Math.round((i * 3) / (n - 1)))
  const out = pick.map(i => SEQ[i])
  return highFirst ? out.reverse() : out
}

/** Nominal colour for the i-th of n series: --chart-1..3, then --chart-4 for the rest. */
export const seriesColor = (i: number) => SERIES[i] ?? OTHER

export const ANIM_MS = 700
/** Horizontal grid lines only. */
export const gridProps = { vertical: false } as const
export const xAxisProps = { tickLine: false, axisLine: false, tickMargin: 8 } as const
export const yAxisProps = { tickLine: false, axisLine: false, tickMargin: 8, width: 32 } as const
/** Threshold reference line: dashed 3 3. Pair with `refLabel` for an optional label. Prefer no label on a y threshold
 *  whose value is already a y tick: the dashed line plus the tick says it, and a label can sit on the series. */
export const thresholdLine = { strokeDasharray: '3 3', ifOverflow: 'extendDomain' } as const
export const refLabel = (value: string, position: 'insideTopRight' | 'top' = 'insideTopRight') => ({
  value, position, offset: 4, fontSize: 10,
  stroke: 'var(--card)', strokeWidth: 3, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const,
})
/** Hover dot on a line or area; its ring takes the card colour from CSS. */
export const activeDotProps = { r: 4 } as const
/** 2px line, no resting dots. */
export const lineProps = { strokeWidth: 2, dot: false, activeDot: activeDotProps, animationDuration: ANIM_MS } as const
/** Flat, low-opacity area fill. No gradients. */
export const AREA_FILL_OPACITY = 0.08
/** Tooltip surface for hand-written tooltip content, same as ChartTooltipContent. */
export const tooltipSurface = 'grid min-w-32 items-start gap-1.5 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground tabular-nums shadow-(--shadow-panel)'

/** Keyboard focus ring for a recharts surface (accessibilityLayer makes it tabbable; arrow keys move the tooltip). */
const chartFocus = '[&_.recharts-surface]:outline-none [&_.recharts-surface:focus-visible]:rounded-sm [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-ring'

const fmtNum = (n: number) => n.toLocaleString('en-US')
const pctOf = (v: number, total: number) => `${Math.round((v / total) * 100)}%`

function Swatch({ color, className }: { color: string; className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-[2px]', className)} style={{ background: color }} aria-hidden="true" />
}

/* ---------------------------------------------------------------- ScoreTrend */

export type ScorePoint = { tick: string; label: string; value: number }

/** Monthly 0 to 100 score: flat-fill area, 2px line, dashed Watch (70) and At risk (40) lines, labelled by the y ticks. The tooltip gives the value and its band.
 *  `compact` hides the axes and threshold labels for small spaces. */
export function ScoreTrend({ data, name, thresholds = true, compact = false, className }: {
  data: ScorePoint[]; name: string; thresholds?: boolean; compact?: boolean; className?: string
}) {
  const config = { value: { label: name, color: SERIES[0] } } satisfies ChartConfig
  const summary = `${name} score by month: ` + data.map(d => `${d.label} ${d.value}`).join(', ')
  return (
    <ChartContainer config={config} className={cn('aspect-auto w-full', chartFocus, compact ? 'h-28' : 'h-56', className)}
      role="img" aria-label={summary}>
      <AreaChart data={data} margin={compact ? { top: 6, right: 6, bottom: 6, left: 6 } : { top: 16, right: 12, bottom: 0, left: 0 }}>
        {!compact && <CartesianGrid {...gridProps} />}
        <XAxis dataKey="tick" {...xAxisProps} minTickGap={24} hide={compact} />
        <YAxis domain={[0, 100]} ticks={thresholds ? [0, 40, 70, 100] : [0, 50, 100]} {...yAxisProps} hide={compact} />
        {/* no labels: the 40 and 70 y ticks name these lines, and a label would sit on the series */}
        {thresholds && <ReferenceLine y={70} {...thresholdLine} />}
        {thresholds && <ReferenceLine y={40} {...thresholdLine} />}
        <ChartTooltip content={
          <ChartTooltipContent labelFormatter={(_, p) => p?.[0]?.payload?.label}
            formatter={v => {
              const n = Number(v), b = bandOf(n)
              return (
                <div className="flex w-full items-center gap-2">
                  <Swatch color="var(--color-value)" className="size-2.5" />
                  <span className="flex-1 text-muted-foreground">{name}</span>
                  <span className={cn('font-medium tabular-nums', bandText[b])}>{n}</span>
                  <span className="text-muted-foreground">{BAND_LABEL[b]}</span>
                </div>
              )
            }} />
        } />
        <Area dataKey="value" type="linear" stroke="var(--color-value)" strokeWidth={2}
          fill="var(--color-value)" fillOpacity={AREA_FILL_OPACITY}
          dot={false} activeDot={activeDotProps} animationDuration={ANIM_MS} />
      </AreaChart>
    </ChartContainer>
  )
}

/* ---------------------------------------------------------------- Sparkline */

/** Tiny trend line with a flat fill. No axes; the text next to it must carry the numbers. `tip` adds a hover
 *  tooltip (first, last, range); it is hover-only because sparklines usually sit inside a clickable card. */
export function Sparkline({ values, domain = [0, 100], color = SERIES[0], tip, className }: {
  values: number[]; domain?: [number, number]; color?: string; tip?: React.ReactNode; className?: string
}) {
  const data = values.map((v, i) => ({ i, v }))
  const chart = (
    <ChartContainer config={{ v: { color } }} className={cn('aspect-auto h-10 w-full', className)} aria-hidden="true"
      initialDimension={{ width: 240, height: 40 }}>
      <AreaChart data={data} margin={{ top: 3, right: 2, bottom: 1, left: 2 }} accessibilityLayer={false}>
        <YAxis domain={domain} hide />
        <Area dataKey="v" type="linear" stroke="var(--color-v)" strokeWidth={2} fill="var(--color-v)" fillOpacity={AREA_FILL_OPACITY}
          dot={false} activeDot={false} animationDuration={ANIM_MS} />
      </AreaChart>
    </ChartContainer>
  )
  if (!tip) return chart
  return (
    <Tooltip>
      <TooltipTrigger asChild><div className="w-full">{chart}</div></TooltipTrigger>
      <TooltipContent className="tabular-nums">{tip}</TooltipContent>
    </Tooltip>
  )
}

/* ---------------------------------------------------------------- BarList */

export type BarDatum = { label: string; value: number }

function CategoryTick({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value: string } }) {
  // inline style: category labels are reading text, so they beat the axis-tick colour from CSS
  return <text x={x} y={y} dy={4} textAnchor="end" style={{ fill: 'var(--foreground)', fontSize: 12 }}>{payload?.value}</text>
}

/** Horizontal bars, one series, with category labels and a value label at each bar end. `onSelect` makes bars clickable;
 *  `selected` dims the others. Give a keyboard path to the same choice next to it when you use `onSelect`. */
export function BarList({ data, name, format = fmtNum, selected, onSelect, track = false, labelWidth = 128, rowHeight = 32, className }: {
  data: BarDatum[]; name: string; format?: (v: number) => string
  selected?: string | null; onSelect?: (label: string) => void; track?: boolean
  labelWidth?: number; rowHeight?: number; className?: string
}) {
  const config = { value: { label: name, color: SERIES[0] } } satisfies ChartConfig
  return (
    <ChartContainer config={config} style={{ height: data.length * rowHeight }}
      className={cn('aspect-auto w-full', chartFocus,
        '[&_.recharts-bar-rectangle]:transition-opacity [&_.recharts-bar-rectangle:hover]:opacity-80', className)}
      role="img" aria-label={`${name}: ` + data.map(d => `${d.label} ${format(d.value)}`).join(', ')}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barSize={Math.min(18, rowHeight - 12)}>
        <XAxis type="number" dataKey="value" hide domain={[0, 'dataMax']} />
        <YAxis type="category" dataKey="label" {...yAxisProps} width={labelWidth} tick={<CategoryTick />} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v, _n, item) => (
          <div className="grid w-full gap-1">
            <div className="flex items-center gap-2">
              <Swatch color="var(--color-value)" className="size-2.5" />
              <span className="flex-1 text-muted-foreground">{name}</span>
              <span className="font-medium tabular-nums text-foreground">{format(Number(v))}</span>
            </div>
            {onSelect && (
              <span className="text-muted-foreground">
                {selected === (item.payload as BarDatum).label ? 'Click to clear the filter' : 'Click to filter'}
              </span>
            )}
          </div>
        )} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} animationDuration={ANIM_MS}
          background={track ? { fill: TRACK, radius: 4 } : undefined}
          className={cn(onSelect && 'cursor-pointer')}
          onClick={onSelect ? (_: unknown, i: number) => data[i] && onSelect(data[i].label) : undefined}>
          {data.map(d => (
            <Cell key={d.label} fillOpacity={!selected || selected === d.label ? 1 : 0.3} />
          ))}
          <LabelList dataKey="value" position="right" offset={8} className="fill-foreground tabular-nums" fontSize={12}
            formatter={(v: unknown) => format(Number(v))} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/* ---------------------------------------------------------------- Donut */

export type Slice = { key: string; label: string; value: number }

/** shadcn "pie donut with text": a donut with a figure in the centre (the total, unless `center` says otherwise),
 *  2px surface gaps between slices and a legend with each slice's value and share. */
export function Donut({ data, colors, center, format = fmtNum, label, legend = true, compact = false, className }: {
  data: Slice[]; colors?: string[]; center?: { value: React.ReactNode; label: string }
  format?: (v: number) => string; label: string
  /** false when the caller draws its own legend next to the donut */
  legend?: boolean
  /** ~140px donut for a donut-plus-list layout */
  compact?: boolean; className?: string
}) {
  const total = data.reduce((a, d) => a + d.value, 0)
  const color = (i: number) => colors?.[i] ?? seriesColor(i)
  const config: ChartConfig = Object.fromEntries(data.map((d, i) => [d.key, {
    label: (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-muted-foreground">{d.label}</span>
        <span className="font-medium tabular-nums text-foreground">{format(d.value)}</span>
        <span className="tabular-nums text-muted-foreground">{total ? pctOf(d.value, total) : ''}</span>
      </span>
    ),
    color: color(i),
  }]))
  const rows = data.map(d => ({ ...d, fill: `var(--color-${d.key})` }))
  const mid = center ?? { value: format(total), label: 'total' }
  return (
    <ChartContainer config={config} role="img" aria-label={label}
      className={cn('aspect-auto', compact ? 'size-[140px]' : 'h-[232px] w-full', chartFocus,
        '[&_.recharts-pie-sector]:transition-opacity [&_.recharts-pie-sector:hover]:opacity-80', className)}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel formatter={(v, _n, item) => {
          const s = item.payload as Slice & { fill: string }
          return (
            <div className="flex w-full items-center gap-2">
              <Swatch color={s.fill} className="size-2.5" />
              <span className="flex-1 text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums text-foreground">{format(Number(v))}</span>
              <span className="tabular-nums text-muted-foreground">{total ? pctOf(Number(v), total) : ''}</span>
            </div>
          )
        }} />} />
        <Pie data={rows} dataKey="value" nameKey="key" innerRadius={compact ? 48 : 54} outerRadius={compact ? 68 : 74} stroke="var(--card)" strokeWidth={2}
          animationDuration={ANIM_MS}>
          <Label content={({ viewBox }) => {
            if (!viewBox || !('cx' in viewBox)) return null
            const { cx = 0, cy = 0 } = viewBox as { cx?: number; cy?: number }
            return (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                <tspan x={cx} y={cy - 4} className="fill-foreground text-2xl tabular-nums tracking-[-0.02em]">{mid.value}</tspan>
                <tspan x={cx} y={cy + 16} className="fill-muted-foreground text-xs">{mid.label}</tspan>
              </text>
            )
          }} />
        </Pie>
        {legend && data.length >= 2 && <ChartLegend content={<ChartLegendContent nameKey="key" className="flex-wrap gap-x-4 gap-y-1.5" />} />}
      </PieChart>
    </ChartContainer>
  )
}

/* ---------------------------------------------------------------- SplitBar */

export type SplitPart = { key: string; label: string; value: number; color?: string }

/** A 100% stacked single 12px bar with 2px gaps, a tooltip per segment and a legend with values and shares
 *  (two or more parts). Parts of zero show only in the legend. Colours: each part's `color`, else `colors`, else the
 *  ordinal ramp when `ordinal` is set ('asc' low step first, 'desc' high step first), else the nominal series.
 *  `onSelect` turns segments into toggle buttons; `selected` dims the others. */
export function SplitBar({ parts, label, unit, format = fmtNum, colors, ordinal, selected, onSelect, legend = true, className }: {
  parts: SplitPart[]; label: string; unit?: string; format?: (v: number) => string
  colors?: string[]; ordinal?: 'asc' | 'desc'
  selected?: string | null; onSelect?: (key: string) => void; legend?: boolean; className?: string
}) {
  // segments draw in from equal widths once mounted
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (!total) return <Empty title={unit ? `No ${unit}` : 'No data'} className="py-6" />
  const ramp = ordinal ? seqColors(parts.length, ordinal === 'desc') : null
  const color = (p: SplitPart, i: number) => p.color ?? colors?.[i] ?? ramp?.[i] ?? seriesColor(i)
  const text = (p: SplitPart) => `${p.label}: ${format(p.value)}${unit ? ` ${unit}` : ''}, ${pctOf(p.value, total)}`

  return (
    <div className={className}>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full"
        role={onSelect ? 'group' : 'list'} aria-label={label}>
        {parts.map((p, i) => {
          if (p.value <= 0) return null
          const on = selected === p.key
          const cls = cn(
            'min-w-0 basis-0 outline-none transition-[flex-grow,opacity] duration-700 ease-out motion-reduce:transition-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            selected && !on ? 'opacity-35 hover:opacity-60' : 'hover:opacity-85 focus-visible:opacity-85',
          )
          const style = { flexGrow: drawn ? p.value : 1, background: color(p, i) }
          return (
            <Tooltip key={p.key}>
              <TooltipTrigger asChild>
                {onSelect
                  ? <button type="button" aria-pressed={on} aria-label={text(p)} onClick={() => onSelect(p.key)} className={cls} style={style} />
                  : <span role="listitem" tabIndex={0} aria-label={text(p)} className={cls} style={style} />}
              </TooltipTrigger>
              <TooltipContent>
                <span className="flex items-center gap-2 tabular-nums">
                  <Swatch color={color(p, i)} />
                  {p.label}: {format(p.value)}{unit ? ` ${unit}` : ''} · {pctOf(p.value, total)}
                </span>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      {legend && parts.length >= 2 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {parts.map((p, i) => (
            <li key={p.key} className="inline-flex items-center gap-1.5">
              <Swatch color={color(p, i)} className={cn(!p.value && 'opacity-30')} />
              <span className="text-muted-foreground">{p.label}</span>
              <span className="font-medium tabular-nums">{format(p.value)}</span>
              <span className="tabular-nums text-muted-foreground">{pctOf(p.value, total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Meter */

/** Inline 0 to `max` bar for a single value in a row or table cell. `fill` is a background class
 *  (`bandBg[band]` for a health score, `bg-chart-1` otherwise). Show the number next to it.
 *  `tip` adds a tooltip with the exact value and what it is; the bar then takes keyboard focus unless
 *  `focusable={false}` (use that when the meter sits inside a button or another tooltip trigger). */
export function Meter({ value, max = 100, fill = 'bg-chart-1', min = 0, tip, label, focusable = true, delay, className }: {
  value: number | null | undefined; max?: number; fill?: string; min?: number
  tip?: React.ReactNode; label?: string; focusable?: boolean
  /** ms before a width change animates, for staggered rows */
  delay?: number; className?: string
}) {
  const pct = value == null || !max ? 0 : Math.min(100, Math.max(min, (value / max) * 100))
  const bar = (
    <span className={cn('block h-1 overflow-hidden rounded-full bg-chart-5', className)} aria-hidden="true">
      {value != null && <span className={cn('block h-full rounded-full transition-[width,opacity] duration-700 ease-out group-hover/meter:opacity-80 motion-reduce:transition-none', fill)}
        style={{ width: `${pct}%`, transitionDelay: delay ? `${delay}ms, 0ms` : undefined }} />}
    </span>
  )
  if (!tip) return bar
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={focusable ? 0 : undefined} role="img"
          aria-label={label ?? (typeof tip === 'string' ? tip : undefined)}
          className="group/meter -my-1.5 block rounded-full py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {bar}
        </span>
      </TooltipTrigger>
      <TooltipContent className="tabular-nums">{tip}</TooltipContent>
    </Tooltip>
  )
}
