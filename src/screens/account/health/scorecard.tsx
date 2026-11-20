import { ChevronRight } from 'lucide-react'
import { RecordSheetBody, RecordSheetHeader } from '@/components/app/record-sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { HealthPill, bandOf, bandText } from '@/components/health'
import { Empty, stickyCol } from '@/components/page'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AREA_ICON, ScoreBar } from './parts'
import { shortArea, type AreaKey, type HealthData } from './model'

const sheetSticky = cn(stickyCol, 'bg-popover [tr:hover_&]:bg-[color-mix(in_oklab,var(--accent)_60%,var(--popover))]')

/** Every input behind the six areas, weakest first, filterable by area. A row opens its area. */
export function ScorecardBody({ data, area, onArea, onOpen }: {
  data: HealthData; area: AreaKey | 'all'; onArea: (a: AreaKey | 'all') => void; onOpen: (a: AreaKey) => void
}) {
  const list = data.inputs.filter(i => area === 'all' || i.area === area)
  const missing = data.inputs.filter(i => i.score == null).length
  const filters: [AreaKey | 'all', string, number][] = [
    ['all', 'All', data.inputs.length],
    ...data.areas.map(a => [a.key, a.shortName, a.inputs.length] as [AreaKey, string, number]),
  ]
  return (
    <>
      <RecordSheetHeader eyebrow="Health inputs" title={`All ${data.inputs.length} inputs`}
        meta={`Weakest first · ${missing} have no data`}>
        <ToggleGroup type="single" variant="outline" size="sm" value={area} aria-label="Filter by area"
          onValueChange={v => v && onArea(v as AreaKey | 'all')} className="flex w-full flex-wrap justify-start gap-1.5">
          {filters.map(([k, l, c]) => (
            <ToggleGroupItem key={k} value={k} className="h-7 gap-1.5 px-2.5 text-xs data-[state=on]:border-signal/50 data-[state=on]:bg-signal-soft data-[state=on]:text-foreground">
              {l}<span className="tabular-nums text-muted-foreground">{c}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </RecordSheetHeader>
      <RecordSheetBody>

      <div className="border-b border-hairline">
        {list.length ? (
          <Table aria-label={`Inputs${area === 'all' ? '' : ' in ' + shortArea(data.areas.find(a => a.key === area)!.name)}`}>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-popover pl-6">Input</TableHead>
                <TableHead className="hidden sm:table-cell">Why this score</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="hidden sm:table-cell">Band</TableHead>
                <TableHead className="w-6 pr-6"><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(i => {
                const id = i.area + i.field + i.name
                const I = AREA_ICON[i.area]
                return (
                  <TableRow key={id} tabIndex={0} role="button" aria-label={`${i.name}, ${i.areaName}: ${i.score ?? 'No data'}. Open ${i.areaName}`}
                    onClick={() => onOpen(i.area)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(i.area) } }}
                    className="group cursor-pointer outline-none focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 [&>td]:h-11 [&>td]:py-1.5">
                    <TableCell className={cn(sheetSticky, 'max-w-60 pl-6')}>
                      <span className="flex min-w-40 items-center gap-2" title={shortArea(i.areaName)}>
                        <I className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{i.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-64 sm:table-cell">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate text-muted-foreground">{i.reason}{i.score == null && ' · left out of averages'}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-72">{i.reason}{i.score == null && ' · left out of averages'}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      {i.score == null
                        ? <span className="text-muted-foreground">No data</span>
                        : <span className="inline-flex items-center gap-2">
                            <ScoreBar score={i.score} className="w-10" />
                            <span className={cn('w-7 text-right font-medium', bandText[bandOf(i.score)])}>{i.score}</span>
                          </span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><HealthPill value={i.score} /></TableCell>
                    <TableCell className="pr-6">
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : <Empty title="No inputs in this area" className="m-4" />}
      </div>

      <p className="max-w-[65ch] px-6 py-4 text-xs text-muted-foreground">
        {data.inputs.length} inputs, weakest first. {missing} have no data and are left out of their area's average and drivers,
        never counted as healthy.
      </p>
      </RecordSheetBody>
    </>
  )
}
