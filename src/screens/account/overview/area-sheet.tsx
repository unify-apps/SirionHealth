/* openArea from the header bars, driver chips, strength/risk rows, order forms, Health tab cards and "How scores work":
   the same area sheet everywhere (health/area-sheet.tsx), so one area always reads the same wherever it is opened from.
   The account header owns it (HeaderSheets in how-sheet.tsx); openers just call openSheet('area', key). */
import { useMemo } from 'react'
import { RecordSheetBody, RecordSheetHeader } from '@/components/app/record-sheet'
import { Empty } from '@/components/page'
import { AreaSheetBody } from '../health/area-sheet'
import { loadHealth, type HealthData } from '../health/model'
import { AREA_NAME, type AreaKey } from '../facts'

function read(): { data: HealthData } | { error: string } {
  try { return { data: loadHealth() } } catch (e) { return { error: e instanceof Error ? e.message : String(e) } }
}

/** One area's header and body, for use inside a RecordSheet. */
export function AreaContent({ area }: { area: AreaKey }) {
  const load = useMemo(() => read(), [])
  const a = 'data' in load ? load.data.areas.find(x => x.key === area) : undefined
  if ('data' in load && a) return <AreaSheetBody key={a.key} area={a} data={load.data} />
  return (
    <>
      <RecordSheetHeader eyebrow="Health area" title={AREA_NAME[area]} />
      <RecordSheetBody className="p-6">
        <Empty title="No scores for this area" sub={'error' in load ? load.error : undefined} />
      </RecordSheetBody>
    </>
  )
}
