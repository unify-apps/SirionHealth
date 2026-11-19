import { useState } from 'react'
import { ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { BAND_LABEL, bandBg, bandOf, type Band } from '@/components/health'
import { Empty, SectionTitle } from '@/components/page'
import { cn } from '@/lib/utils'
import { AreaCard, AreaCardSkeleton } from './health/area-card'
import { AreaSheetBody } from './health/area-sheet'
import { ScorecardBody } from './health/scorecard'
import { LoadError, useLoad } from './health/load'
import { loadHealth, type AreaKey, type HealthData } from './health/model'

type Panel = { kind: 'area'; key: AreaKey; from?: 'all' } | { kind: 'all' } | null

function Summary({ data }: { data: HealthData }) {
  const counts = data.areas.reduce((m, a) => { const b = bandOf(a.score); m[b] = (m[b] ?? 0) + 1; return m }, {} as Partial<Record<Band, number>>)
  const scored = data.inputs.filter(i => i.score != null).length
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
      {(['bad', 'warn', 'good'] as Band[]).filter(b => counts[b]).map(b => (
        <span key={b} className="inline-flex items-center gap-1.5">
          <span className={cn('size-1.5 rounded-full', bandBg[b])} aria-hidden="true" />
          <span className="tabular-nums">{counts[b]}</span> {BAND_LABEL[b].toLowerCase()}
        </span>
      ))}
      <span className="text-muted-foreground">· {scored} of {data.inputs.length} inputs have data</span>
    </div>
  )
}

export function HealthTab() {
  const load = useLoad(loadHealth, undefined, 'health areas')
  const [panel, setPanel] = useState<Panel>(null)
  const [filter, setFilter] = useState<AreaKey | 'all'>('all')
  const data = load.status === 'ready' ? load.data : null
  const total = data?.inputs.length ?? 21
  const area = data && panel?.kind === 'area' ? data.areas.find(a => a.key === panel.key) : undefined
  const prevLabel = data && data.months.length > 1 ? data.months[data.months.length - 2].label : 'last month'

  return (
    <div>
      <SectionTitle title="Six health areas" sub="Select an area for its inputs"
        actions={
          <Button variant="outline" size="sm" disabled={!data} onClick={() => { setFilter('all'); setPanel({ kind: 'all' }) }}>
            <ListTree />All {total} inputs
          </Button>
        } />

      {load.status === 'loading' && (
        <div aria-busy="true" aria-label="Loading health areas">
          <Skeleton className="mb-4 h-4 w-72" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <AreaCardSkeleton key={i} />)}</div>
        </div>
      )}
      {load.status === 'error' && <LoadError what="health areas" error={load.error} retry={load.retry} />}
      {data && (data.areas.length ? (
        <>
          <Summary data={data} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.areas.map(a => (
              <AreaCard key={a.key} area={a} prevLabel={prevLabel} onOpen={() => setPanel({ kind: 'area', key: a.key })} />
            ))}
          </div>
        </>
      ) : <Empty title="No health areas" sub="AHI has not scored this account yet." />)}

      <Sheet open={!!panel && !!data} onOpenChange={o => { if (!o) setPanel(null) }}>
        <SheetContent className={cn('gap-0 overflow-y-auto p-0 data-[side=right]:w-full',
          panel?.kind === 'all' ? 'data-[side=right]:sm:max-w-6xl' : 'data-[side=right]:sm:max-w-5xl')}>
          {data && panel?.kind === 'all' && (
            <div className="flex flex-col">
              <ScorecardBody data={data} area={filter} onArea={setFilter}
                onOpen={key => setPanel({ kind: 'area', key, from: 'all' })} />
            </div>
          )}
          {data && area && (
            <AreaSheetBody key={area.key} area={area} data={data}
              onBack={panel?.kind === 'area' && panel.from === 'all' ? () => setPanel({ kind: 'all' }) : undefined} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
