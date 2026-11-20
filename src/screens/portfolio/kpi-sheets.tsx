import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecordSheet, RecordSheetBody, RecordSheetFooter, RecordSheetHeader } from '@/components/app/record-sheet'
import { go, sheetOpenChange, useSheet } from '@/lib/route'
import { AccountsTable, SheetListHead } from './accounts-table'
import { EmptyState } from '../states/widget-states'
import { isAtRisk, isRenewalAtRisk, moneyK, plural, renewal, type Row } from './data'
import { useScope } from './scope'

/** A KPI's figure in the header, every account behind it in the body. */
function Frame({ type, eyebrow, title, meta, lead, list, listTitle, order, grr, tags, empty, view }: {
  type: string; eyebrow: string; title: string; meta: string; lead?: React.ReactNode
  list: Row[]; listTitle: string; order: string; grr?: boolean; tags?: (r: Row) => string[]; empty: string
  /** the My accounts saved view to land on */
  view?: string
}) {
  const open = useSheet()?.type === type
  return (
    <RecordSheet open={open} onOpenChange={sheetOpenChange} size="lg">
      <RecordSheetHeader eyebrow={eyebrow} title={title} meta={meta} />
      <RecordSheetBody className="px-6 py-5">
        {lead}
        {list.length ? <>
          <SheetListHead list={list} title={listTitle} order={order} />
          <AccountsTable list={list} grr={grr} tags={tags} />
        </> : <EmptyState title={empty} />}
      </RecordSheetBody>
      <RecordSheetFooter>
        <Button variant="outline" size="sm" onClick={() => go('accounts', view && `view=${view}`)}>Open in My accounts<ArrowRight aria-hidden="true" /></Button>
      </RecordSheetFooter>
    </RecordSheet>
  )
}

/** Why a renewal counts toward "at risk or unsigned". */
const renewalTags = (r: Row) => (isRenewalAtRisk(r) ? [...(isAtRisk(r) ? ['At risk'] : []), ...(r.signed ? [] : ['Unsigned'])] : [])
const scopeTail = (name: string) => (name === 'the book' ? '' : ` in ${name}`)

/** `#portfolio?sheet=renewals` */
export function RenewalsSheet() {
  const { summary: S } = useScope(), K = S.kpis
  const list = [...K.renewing].sort((a, b) => renewal(a).days - renewal(b).days || b.carr - a.carr)
  return (
    <Frame type="renewals" eyebrow="Renewals" title={`Renewing in 60 days${scopeTail(S.name)}`}
      meta={`${moneyK(K.renewingCarr)} CARR · ${plural(K.renewing60, 'account')} · ${moneyK(K.renewalAtRisk)} at risk or unsigned`}
      list={list} listTitle={`${plural(list.length, 'account')} renewing in 60 days`} order="soonest first"
      tags={renewalTags} empty={`Nothing renews in 60 days${scopeTail(S.name)}`} view="renew" />
  )
}

/** `#portfolio?sheet=retention` */
export function RetentionSheet() {
  const { summary: S } = useScope(), K = S.kpis
  const list = [...K.belowGrr].sort((a, b) => (a.grr ?? 0) - (b.grr ?? 0) || b.carr - a.carr)
  return (
    <Frame type="retention" eyebrow="Gross retention" title={`Accounts below 100% GRR${scopeTail(S.name)}`}
      meta={`Gross retention ${K.grrPct == null ? 'No data' : `${K.grrPct}%`} · ${list.length} of ${K.grrWithData} accounts below 100%${K.grrNoData ? ` · ${K.grrNoData} with no data` : ''}`}
      lead={
        <dl className="mb-5 grid grid-cols-3 gap-3 border-b border-hairline pb-4">
          {S.grr.map(g => (
            <div key={g.key}>
              <dt className="text-xs text-muted-foreground">{g.label}</dt>
              <dd className="text-lg tabular-nums">{g.accounts} <span className="text-xs text-muted-foreground">{K.grrWithData ? Math.round((g.accounts / K.grrWithData) * 100) : 0}%</span></dd>
            </div>
          ))}
        </dl>
      }
      list={list} listTitle={`${plural(list.length, 'account')} below 100% GRR`} order="lowest GRR first" grr
      empty={K.grrWithData ? `Every account${scopeTail(S.name)} retains 100% or more` : `No account${scopeTail(S.name)} has GRR data`} />
  )
}
