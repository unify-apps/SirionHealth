import { useState } from 'react'
import { ArrowRight, ChevronRight, HeartPulse } from 'lucide-react'
import { bandBg, type Band } from '@/components/health'
import { SplitBar } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { go, openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { listPager, RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, SplitSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { AccountsTable, SheetListHead } from './accounts-table'
import { money1, plural, type BandInfo } from './data'
import { useScope } from './scope'

type LiveBand = Exclude<Band, 'none'>

// this split IS health, so its segments take the health colours
const BAND_COLOR: Record<LiveBand, string> = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' }

export function BandSplit({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  // the open band lives in the URL (#portfolio?sheet=band:warn): reload restores it, browser Back closes it
  const { summary: S } = useScope()
  const BANDS = S.bands
  const sheet = useSheet()
  const band = sheet?.type === 'band' && BANDS.some(s => s.band === sheet.id) ? (sheet.id as LiveBand) : null
  const open = (b: LiveBand) => openSheet('band', b, { replace: !!band })
  // hovering or focusing a row lights its segment in the bar, tying the two together without another tooltip
  const [hot, setHot] = useState<LiveBand | null>(null)

  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={HeartPulse} title={S.book.carr ? `Where the ${money1(S.book.arr)} sits by health` : 'Health split'} />
      <div className="px-5 py-4">
        {status === 'loading' && <><LoadingLabel what="health split" /><SplitSkeleton /></>}
        {status === 'error' && (
          <WidgetError title="The health split didn't load" sub="The portfolio summary timed out. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && !S.book.carr && (
          <EmptyState title={`No CARR in ${S.name}`} sub={S.kpis.scored ? 'Its accounts carry no CARR yet.' : 'Its accounts carry no CARR and no health scores yet.'} />
        )}
        {status === 'ready' && S.book.carr > 0 && (
          <>
            <SplitBar label="CARR by health band" legend={false}
              parts={BANDS.map(s => ({ key: s.band, label: s.label, value: s.arr, color: BAND_COLOR[s.band] }))}
              format={money1} selected={hot ?? band} onSelect={k => open(k as LiveBand)} />
            <ul className="mt-2 grid" aria-label="Health bands">
              {BANDS.map(s => (
                <li key={s.band} className="border-b border-hairline last:border-b-0">
                  <button type="button" aria-haspopup="dialog" onClick={() => open(s.band)}
                    onPointerEnter={() => setHot(s.band)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(s.band)} onBlur={() => setHot(null)}
                    aria-label={`${s.label}, health ${s.range}: ${plural(s.list.length, 'account')}, ${money1(s.arr)}, ${S.share(s.carr)} of ${S.name}. See accounts`}
                    className="-mx-2 grid w-[calc(100%+1rem)] cursor-pointer grid-cols-[minmax(0,1fr)_auto_2.5rem_1rem] items-center sm:grid-cols-[minmax(0,1fr)_auto_auto_2.5rem_1rem] gap-3 rounded-md px-2 py-2.5 text-left text-sm outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn('size-2 shrink-0 rounded-full', bandBg[s.band])} aria-hidden="true" />
                      <span className="font-medium">{s.label}</span>
                      <span className="truncate text-xs text-muted-foreground">Health {s.range}</span>
                    </span>
                    <span className="hidden text-right text-xs tabular-nums text-muted-foreground sm:block">{plural(s.list.length, 'account')}</span>
                    <span className="text-right font-medium tabular-nums">{money1(s.arr)}</span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">{S.share(s.carr)}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <BandSheet bands={BANDS} name={S.name} share={S.share} band={band} onPage={b => openSheet('band', b, { replace: true })} />
    </Card>
  )
}

/** The My accounts saved view that matches each band. */
const VIEW: Record<LiveBand, string> = { good: 'healthy', warn: 'watch', bad: 'risk' }

/** Every account in a band, within the page's scope. */
function BandSheet({ bands: BANDS, name, share, band: current, onPage }: {
  bands: BandInfo[]; name: string; share: (k: number) => string; band: LiveBand | null; onPage: (b: LiveBand) => void
}) {
  const band = useKept(current) // keeps the content while the sheet slides out
  const info = BANDS.find(s => s.band === band)

  return (
    <RecordSheet open={!!current} onOpenChange={sheetOpenChange} size="lg" view={band ?? ''}
      pager={listPager(BANDS, info, s => s.band, s => onPage(s.band), 'bands')}>
      {band && info && (
        <>
          <RecordSheetHeader eyebrow="Health band"
            title={<span className="flex items-center gap-2"><span className={cn('size-2.5 rounded-full', bandBg[band])} aria-hidden="true" />{info.label}</span>}
            meta={`Health ${info.range} · ${plural(info.list.length, 'account')} · ${money1(info.arr)} · ${share(info.carr)} of ${name}`} />
          <RecordSheetBody className="px-6 py-5">
            <SheetListHead list={info.list} order="largest first"
              title={`${plural(info.list.length, 'account')} with health ${info.range}`} />
            {info.list.length ? <AccountsTable key={band} list={info.list} />
              : <EmptyState title={`No ${info.label.toLowerCase()} accounts in ${name}`} />}
          </RecordSheetBody>
          <RecordSheetFooter>
            <Button variant="outline" size="sm" onClick={() => go('accounts', `view=${VIEW[band]}`)}>Open in My accounts<ArrowRight aria-hidden="true" /></Button>
          </RecordSheetFooter>
        </>
      )}
    </RecordSheet>
  )
}
