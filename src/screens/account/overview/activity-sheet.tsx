/* One activity item from the Summary tab's Recent activity list: what happened, who, and its source. */
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { fmtDY, type ActivityItem } from '../facts'
import { DOT } from './bits'

export const ACT_STATUS: Partial<Record<ActivityItem['kind'], { tone: keyof typeof DOT; label: string }>> = {
  neg: { tone: 'bad', label: 'Risk' }, flag: { tone: 'bad', label: 'Risk' }, pos: { tone: 'good', label: 'Positive' },
  goal: { tone: 'none', label: 'Target' }, end: { tone: 'none', label: 'Renewal' },
}

export function ActivitySheet({ item, onOpenChange }: { item: ActivityItem | null; onOpenChange: (o: boolean) => void }) {
  const st = item ? ACT_STATUS[item.kind] : undefined
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-4xl">
        {item && (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b border-hairline bg-popover px-6 py-4 pr-14">
              <SheetTitle className="text-lg font-normal">{item.title}</SheetTitle>
              <SheetDescription className="tabular-nums">{fmtDY(item.date)}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-8 p-6 md:grid-cols-[14rem_minmax(0,1fr)]">
              <dl className="grid content-start gap-4">
                {st && (
                  <Fact label="Status">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('size-2 rounded-full', DOT[st.tone])} aria-hidden="true" />{st.label}
                    </span>
                  </Fact>
                )}
                {item.who.length > 0 && <Fact label="People">{item.who.join(', ')}</Fact>}
                {item.tickets.length > 0 && <Fact label="Tickets"><span className="tabular-nums">{item.tickets.join(', ')}</span></Fact>}
                <Fact label="Source">{item.source}</Fact>
              </dl>
              <p className="leading-relaxed text-pretty">{item.desc !== item.title ? item.desc : 'No further detail was recorded for this item.'}</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
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
