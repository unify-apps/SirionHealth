import { ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecordSheet, listPager, useKept } from '@/components/app/record-sheet'
import { openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { Skeleton } from '@/components/ui/skeleton'
import { BAND_LABEL, bandBg, bandOf, type Band } from '@/components/health'
import { Empty, SectionTitle } from '@/components/page'
import { cn } from '@/lib/utils'
import { AreaCard, AreaCardSkeleton } from './health/area-card'
import { AreaSheetBody } from './health/area-sheet'
import { ScorecardBody } from './health/scorecard'
import { LoadError, useLoad } from './health/load'
import { loadHealth, type AreaKey, type HealthData } from './health/model'


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
      <span className="text-muted-foreground">· {scored} of {data.inputs.length} {data.inputs.length === 1 ? 'input has' : 'inputs have'} data</span>
    </div>
  )
}

export function HealthTab() {
  const load = useLoad(loadHealth, undefined, 'health areas')
  const data = load.status === 'ready' ? load.data : null
  const total = data?.inputs.length ?? 21
  // All inputs lives in the URL with its area filter (?sheet=inputs:<area>); an area opened from it is nested
  // (?sheet=area:<key>&from=inputs:<area>). A plain area sheet belongs to the account header (overview/how-sheet.tsx).
  const sheet = useSheet()
  const mine = sheet && (sheet.type === 'inputs' || (sheet.type === 'area' && sheet.from?.type === 'inputs')) ? sheet : null
  const panel = useKept(mine)
  const filterId = panel ? (panel.type === 'inputs' ? panel.id : panel.from?.id ?? '') : ''
  const filter = (data?.areas.some(a => a.key === filterId) ? filterId : 'all') as AreaKey | 'all'
  const inputsRef = { type: 'inputs', id: filter === 'all' ? '' : filter }
  const area = data && panel?.type === 'area' ? data.areas.find(a => a.key === panel.id) : undefined
  // prev/next walks the areas in the order the (filtered) inputs list shows them
  const order = data ? [...new Set(data.inputs.filter(i => filter === 'all' || i.area === filter).map(i => i.area))] : []
  const openFromInputs = (key: AreaKey) => openSheet('area', key, { from: inputsRef, replace: true })
  const pager = area ? listPager(order, area.key, k => k, openFromInputs, 'area') : undefined
  const prevLabel = data && data.months.length > 1 ? data.months[data.months.length - 2].label : 'last month'

  return (
    <div>
      <SectionTitle title="Six health areas" sub="Select an area for its inputs"
        actions={
          <Button variant="outline" size="sm" disabled={!data} onClick={() => openSheet('inputs')}>
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
              <AreaCard key={a.key} area={a} prevLabel={prevLabel} labels={data.months.map(m => m.label)} onOpen={() => openSheet('area', a.key)} />
            ))}
          </div>
        </>
      ) : <Empty title="No health areas" sub="This account has not been scored yet." />)}

      <RecordSheet open={!!mine && !!data} onOpenChange={sheetOpenChange} size="lg" pager={pager}
        view={panel ? (panel.type === 'inputs' ? 'inputs' : `area:${panel.id}`) : undefined}
        back={area ? { label: `All ${total} inputs`, onBack: () => openSheet('inputs', inputsRef.id, { replace: true }) } : undefined}>
        {data && panel?.type === 'inputs' && (
          <ScorecardBody data={data} area={filter} onArea={a => openSheet('inputs', a === 'all' ? '' : a, { replace: true })}
            onOpen={openFromInputs} />
        )}
        {data && area && <AreaSheetBody key={area.key} area={area} data={data} />}
      </RecordSheet>
    </div>
  )
}
