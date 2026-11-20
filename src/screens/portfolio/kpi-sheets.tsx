import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader } from '@/components/app/record-sheet'
import { go, sheetOpenChange, useSheet } from '@/lib/route'
import { EmptyState } from '../states/widget-states'
import { AccountsTable, SheetListHead } from './accounts-table'
import { BOOK, GRR, isLive, KPIS, renewal, rows, type Row } from './data'

const live = rows.filter(isLive)

/** Book-level figure in the header, the matching rows from My accounts in the body. */
function Frame({ type, eyebrow, title, meta, lead, list, col, empty, view, listTitle }: {
  type: string; eyebrow: string; title: string; meta: string; lead?: React.ReactNode
  list: Row[]; col?: 'stage' | 'grr'; empty: string
  /** the My accounts saved view to land on */
  view?: string
  listTitle: string
}) {
  const open = useSheet()?.type === type
  return (
    <RecordSheet open={open} onOpenChange={sheetOpenChange} size="lg">
      <RecordSheetHeader eyebrow={eyebrow} title={title} meta={meta} />
      <RecordSheetBody className="px-6 py-5">
        {lead}
        <SheetListHead count={list.length} of={live.length} carr={list.reduce((a, r) => a + r.carr, 0)} title={listTitle} />
        {list.length === 0
          ? <EmptyState title={empty} sub="The figure above covers the whole book." />
          : <AccountsTable list={list} col={col} />}
      </RecordSheetBody>
      <RecordSheetFooter>
        <Button variant="outline" size="sm" onClick={() => go('accounts', view && `view=${view}`)}>Open in My accounts<ArrowRight aria-hidden="true" /></Button>
      </RecordSheetFooter>
    </RecordSheet>
  )
}

/** `#portfolio?sheet=renewals` */
export function RenewalsSheet() {
  const list = live.filter(r => renewal(r).days <= 60).sort((a, b) => renewal(a).days - renewal(b).days)
  return (
    <Frame type="renewals" eyebrow="Renewals" title="Renewing in 60 days"
      meta={`${KPIS.renewing60} of ${BOOK.accounts} accounts across the book · ${KPIS.arrAtRisk} at risk or unsigned`}
      list={list} empty="None of your accounts renew in 60 days" view="renew" listTitle="Your accounts renewing in 60 days" />
  )
}

/** `#portfolio?sheet=retention` */
export function RetentionSheet() {
  const total = GRR.reduce((a, g) => a + g.accounts, 0)
  const list = live.filter(r => r.grr != null && r.grr < 100).sort((a, b) => (a.grr ?? 0) - (b.grr ?? 0))
  return (
    <Frame type="retention" eyebrow="Gross retention" title="Accounts below 100% GRR"
      meta={`${total - KPIS.grr100} of ${total} accounts with GRR data across the book`}
      lead={
        <dl className="mb-5 grid grid-cols-3 gap-3 border-b border-hairline pb-4">
          {GRR.map(g => (
            <div key={g.key}>
              <dt className="text-xs text-muted-foreground">{g.label}</dt>
              <dd className="text-lg tabular-nums">{g.accounts} <span className="text-xs text-muted-foreground">{Math.round((g.accounts / total) * 100)}%</span></dd>
            </div>
          ))}
        </dl>
      }
      list={list} col="grr" empty="All of your accounts retain 100% or more" listTitle="Your accounts below 100% GRR" />
  )
}
