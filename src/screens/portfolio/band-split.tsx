import { ArrowRight, ChevronRight, HeartPulse } from 'lucide-react'
import { bandBg, bandOf, type Band } from '@/components/health'
import { SplitBar } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BlockHeader } from '@/components/page'
import { go, openSheet, sheetOpenChange, useSheet } from '@/lib/route'
import { listPager, RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader, useKept } from '@/components/app/record-sheet'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingLabel, SplitSkeleton, WidgetError, type WidgetStatus } from '../states/widget-states'
import { AccountsTable, SheetListHead } from './accounts-table'
import { BANDS, BOOK, isLive, rows } from './data'

type LiveBand = Exclude<Band, 'none'>

// this split IS health, so its segments take the health colours
const BAND_COLOR: Record<LiveBand, string> = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' }

export function BandSplit({ status, onRetry }: { status: WidgetStatus; onRetry: () => void }) {
  // the open band lives in the URL (#portfolio?sheet=band:warn): reload restores it, browser Back closes it
  const sheet = useSheet()
  const band = sheet?.type === 'band' && BANDS.some(s => s.band === sheet.id) ? (sheet.id as LiveBand) : null
  const open = (b: LiveBand) => openSheet('band', b, { replace: !!band })

  return (
    <Card className="gap-0 py-0">
      <BlockHeader icon={HeartPulse} title={`Where the $${BOOK.arr}M sits by health`} />
      <div className="px-5 py-4">
        {status === 'loading' && <><LoadingLabel what="health split" /><SplitSkeleton /></>}
        {status === 'error' && (
          <WidgetError title="The health split didn't load" sub="The portfolio summary timed out. Other sections are up to date." onRetry={onRetry} />
        )}
        {status === 'ready' && (
          <>
            <SplitBar label="ARR by health band" legend={false}
              parts={BANDS.map(s => ({ key: s.band, label: s.label, value: s.arr, color: BAND_COLOR[s.band] }))}
              format={v => `$${v}M`} selected={band} onSelect={k => open(k as LiveBand)} />
            <ul className="mt-2 grid" aria-label="Health bands">
              {BANDS.map(s => (
                <li key={s.band} className="border-b border-hairline last:border-b-0">
                  <button type="button" aria-haspopup="dialog" onClick={() => open(s.band)}
                    aria-label={`${s.label}, health ${s.range}: $${s.arr}M, ${share(s.arr)} of the book. See accounts`}
                    className="-mx-2 grid w-[calc(100%+1rem)] cursor-pointer grid-cols-[minmax(0,1fr)_auto_2.5rem_1rem] items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn('size-2 shrink-0 rounded-full', bandBg[s.band])} aria-hidden="true" />
                      <span className="font-medium">{s.label}</span>
                      <span className="truncate text-xs text-muted-foreground">Health {s.range}</span>
                    </span>
                    <span className="text-right font-medium tabular-nums">${s.arr}M</span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">{share(s.arr)}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <BandSheet band={band} onPage={b => openSheet('band', b, { replace: true })} />
    </Card>
  )
}

/** The My accounts saved view that matches each band. */
const VIEW: Record<LiveBand, string> = { good: 'healthy', warn: 'watch', bad: 'risk' }
const share = (arr: number) => `${Math.round((arr / BOOK.arr) * 100)}%`
const inBand = (band: LiveBand) => rows.filter(r => isLive(r) && bandOf(r.health) === band)

/** The accounts behind a band. The book-level figures cover every account; the rows are the ones in My accounts. */
function BandSheet({ band: current, onPage }: { band: LiveBand | null; onPage: (b: LiveBand) => void }) {
  const band = useKept(current) // keeps the content while the sheet slides out
  const info = BANDS.find(s => s.band === band)
  const list = (band ? inBand(band) : []).sort((a, b) => b.carr - a.carr)
  const live = rows.filter(isLive).length

  return (
    <RecordSheet open={!!current} onOpenChange={sheetOpenChange} size="lg" view={band ?? ''}
      pager={listPager(BANDS, info, s => s.band, s => onPage(s.band), 'bands')}>
      {band && info && (
        <>
          <RecordSheetHeader eyebrow="Health band"
            title={<span className="flex items-center gap-2"><span className={cn('size-2.5 rounded-full', bandBg[band])} aria-hidden="true" />{info.label}</span>}
            meta={`Health ${info.range} · $${info.arr}M · ${share(info.arr)} of the book`} />
          <RecordSheetBody className="px-6 py-5">
            <SheetListHead count={list.length} of={live} carr={list.reduce((a, r) => a + r.carr, 0)} title={`Your ${info.label.toLowerCase()} accounts`} />
            {list.length === 0 ? (
              <EmptyState title={`None of your accounts are ${info.label.toLowerCase()}`} sub="The figure above covers the whole book." />
            ) : (
              <AccountsTable list={list} />
            )}
          </RecordSheetBody>
          <RecordSheetFooter>
            <Button variant="outline" size="sm" onClick={() => go('accounts', `view=${VIEW[band]}`)}>Open in My accounts<ArrowRight aria-hidden="true" /></Button>
          </RecordSheetFooter>
        </>
      )}
    </RecordSheet>
  )
}
