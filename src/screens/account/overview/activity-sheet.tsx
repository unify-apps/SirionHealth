/* One activity item from the Summary tab's Recent activity list: what happened, who, and its source. */
import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { RecordSheet, RecordSheetBody, RecordSheetHeader, TicketChip, useKept, type RecordSheetPager } from '@/components/app/record-sheet'
import { fmtDY, type ActivityItem } from '../facts'
import { PersonLink } from '../stakeholders/person-sheet'
import { DOT } from './bits'

export const ACT_STATUS: Partial<Record<ActivityItem['kind'], { tone: keyof typeof DOT; label: string }>> = {
  neg: { tone: 'bad', label: 'Risk' }, flag: { tone: 'bad', label: 'Risk' }, pos: { tone: 'good', label: 'Positive' },
  goal: { tone: 'none', label: 'Target' }, end: { tone: 'none', label: 'Renewal' },
}

export function ActivitySheet({ item: live, onOpenChange, pager }: {
  item: ActivityItem | null; onOpenChange: (o: boolean) => void; pager?: RecordSheetPager
}) {
  const item = useKept(live)
  const st = item ? ACT_STATUS[item.kind] : undefined
  return (
    <RecordSheet open={!!live} onOpenChange={onOpenChange} size="md" pager={pager} view={item?.id}>
      {item && (
        <>
          <RecordSheetHeader eyebrow="Activity" title={item.title}
            meta={<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="tabular-nums">{fmtDY(item.date)}</span>
              {st && <span className="inline-flex items-center gap-1.5"><span className={cn('size-1.5 rounded-full', DOT[st.tone])} aria-hidden="true" />{st.label}</span>}
              <span>{item.source}</span>
            </span>} />
          <RecordSheetBody>
            <div className="flex flex-col gap-6 p-6">
              {(item.who.length > 0 || item.tickets.length > 0) && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-hairline pb-5">
                  {item.who.length > 0 && (
                    <Fact label="People">{item.who.map((n, i) => <Fragment key={n}>{i > 0 && ', '}<PersonLink name={n} /></Fragment>)}</Fact>
                  )}
                  {item.tickets.length > 0 && (
                    <Fact label="Tickets"><span className="flex flex-wrap gap-1.5">{item.tickets.map(t => <TicketChip key={t} id={t} />)}</span></Fact>
                  )}
                </dl>
              )}
              <p className="max-w-[65ch] leading-relaxed text-pretty">{item.desc !== item.title && item.desc !== `${item.source}.` ? item.desc : 'No further detail was recorded for this item.'}</p>
            </div>
          </RecordSheetBody>
        </>
      )}
    </RecordSheet>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
