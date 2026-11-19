import { ChevronRight } from 'lucide-react'
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { HealthPill, bandOf, bandText } from '@/components/health'
import { Empty } from '@/components/page'
import { cn } from '@/lib/utils'
import { ScoreBar } from './parts'
import { shortArea, type AreaKey, type HealthData } from './model'

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
      <SheetHeader className="gap-1 px-4 pt-4 sm:px-6">
        <SheetTitle className="text-lg font-normal">All {data.inputs.length} inputs</SheetTitle>
        <SheetDescription>
          Scored 0 to 100 against fixed thresholds, weakest first. Select a row to open its area.
        </SheetDescription>
      </SheetHeader>

      <div className="px-4 sm:px-6">
        <ToggleGroup type="single" variant="outline" size="sm" value={area} aria-label="Filter by area"
          onValueChange={v => v && onArea(v as AreaKey | 'all')} className="flex w-full flex-wrap justify-start gap-1.5">
          {filters.map(([k, l, c]) => (
            <ToggleGroupItem key={k} value={k} className="h-7 gap-1.5 px-2.5 text-xs data-[state=on]:border-signal/50 data-[state=on]:bg-signal-soft data-[state=on]:text-foreground">
              {l}<span className="tabular-nums text-muted-foreground">{c}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="mx-4 overflow-hidden rounded-xl border border-hairline sm:mx-6">
        {list.length ? (
          <Table aria-label={`Inputs${area === 'all' ? '' : ' in ' + shortArea(data.areas.find(a => a.key === area)!.name)}`}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-3 text-xs font-normal text-muted-foreground">Input</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Why this score</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Score</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Band</TableHead>
                <TableHead className="w-6 pr-3"><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(i => {
                const id = i.area + i.field + i.name
                return (
                  <TableRow key={id} tabIndex={0} role="button" aria-label={`${i.name}, ${i.areaName}: ${i.score ?? 'No data'}. Open ${i.areaName}`}
                    onClick={() => onOpen(i.area)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(i.area) } }}
                    className="group cursor-pointer outline-none focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50">
                    <TableCell className="min-w-44 py-2.5 pl-3 align-top whitespace-normal">
                      <div className="text-sm">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{shortArea(i.areaName)}</div>
                    </TableCell>
                    <TableCell className="min-w-52 py-2.5 align-top text-xs whitespace-normal">
                      {i.reason}{i.score == null && <span className="text-muted-foreground"> · left out of averages</span>}
                    </TableCell>
                    <TableCell className="w-32 py-2.5 align-top">
                      {i.score == null
                        ? <span className="text-xs text-muted-foreground">No data</span>
                        : <div className="flex items-center gap-2">
                            <span className={cn('w-7 text-right text-sm font-medium tabular-nums', bandText[bandOf(i.score)])}>{i.score}</span>
                            <ScoreBar score={i.score} className="w-14" />
                          </div>}
                    </TableCell>
                    <TableCell className="py-2.5 align-top"><HealthPill value={i.score} /></TableCell>
                    <TableCell className="py-2.5 pr-3 align-top">
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : <Empty title="No inputs in this area" className="m-4" />}
      </div>

      <p className="px-4 pb-6 text-xs text-muted-foreground sm:px-6">
        {data.inputs.length} inputs, weakest first. {missing} have no data and are left out of their area's average and drivers,
        never counted as healthy.
      </p>
    </>
  )
}
