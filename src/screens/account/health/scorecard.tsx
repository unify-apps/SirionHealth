import { ChevronRight } from 'lucide-react'
import { RecordSheetBody, RecordSheetHeader } from '@/components/app/record-sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { bandBg, bandOf, bandText, type Band } from '@/components/health'
import { Empty } from '@/components/page'
import { cn } from '@/lib/utils'
import { AREA_ICON } from './parts'
import { shortArea, type AreaKey, type HealthData } from './model'

/** Inputs grouped by band, weakest group first; the score's colour repeats the band so rows carry no pill. */
const GROUPS: { band: Band; label: string }[] = [
  { band: 'bad', label: 'At risk' }, { band: 'warn', label: 'Watch' }, { band: 'good', label: 'Healthy' }, { band: 'none', label: 'No data' },
]

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
          onValueChange={v => v && onArea(v as AreaKey | 'all')} className="-mx-1 flex w-[calc(100%+0.5rem)] justify-start gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {filters.map(([k, l, c]) => (
            <ToggleGroupItem key={k} value={k} className="h-7 shrink-0 gap-1.5 px-2.5 text-xs data-[state=on]:border-foreground/30 data-[state=on]:bg-muted data-[state=on]:text-foreground">
              {l}<span className="tabular-nums text-muted-foreground">{c}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </RecordSheetHeader>
      <RecordSheetBody>
        {list.length ? (
          <div className="pb-4">
            {GROUPS.map(g => {
              const rows = list.filter(i => (i.score == null ? 'none' : bandOf(i.score)) === g.band)
              if (!rows.length) return null
              return (
                <section key={g.band} aria-label={`${g.label}, ${rows.length}`}>
                  <h3 className="sticky top-0 z-10 flex items-center gap-2 border-b border-hairline bg-popover px-6 pt-5 pb-2 text-xs text-muted-foreground">
                    <span className={cn('size-1.5 rounded-full', bandBg[g.band])} aria-hidden="true" />
                    <span className="font-medium text-foreground">{g.label}</span><span className="tabular-nums">{rows.length}</span>
                  </h3>
                  <ul className="divide-y divide-hairline">
                    {rows.map(i => {
                      const I = AREA_ICON[i.area]
                      const why = `${i.reason}${i.score == null ? ' · left out of averages' : ''}`
                      return (
                        <li key={i.area + i.field + i.name}>
                          <button type="button" onClick={() => onOpen(i.area)} aria-label={`${i.name}, ${i.areaName}: ${i.score ?? 'No data'}. Open ${i.areaName}`}
                            className="group flex w-full items-center gap-3 px-6 py-3 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50">
                            <I className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="grid min-w-0 flex-1 gap-0.5">
                              <span className="truncate text-sm">{i.name}</span>
                              <span className="truncate text-xs text-muted-foreground" title={why}>{shortArea(i.areaName)} · {why}</span>
                            </span>
                            <span className={cn('w-10 shrink-0 text-right text-base font-medium tabular-nums', i.score == null ? 'text-sm font-normal text-muted-foreground' : bandText[bandOf(i.score)])}>
                              {i.score ?? '–'}
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
            <p className="px-6 pt-4 text-xs text-muted-foreground">Inputs with no data are left out of their area's average, never counted as healthy.</p>
          </div>
        ) : <Empty title="No inputs in this area" className="m-6" />}
      </RecordSheetBody>
    </>
  )
}
