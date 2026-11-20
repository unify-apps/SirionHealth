import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { bandOf, bandText, isMissing } from '@/components/health'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { money } from '@/data/legacy'
import { fmtFull } from '@/lib/dates'
import { hasPage, openAccount } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Term } from '../account/overview/bits'
import { carrK, isLive, moneyK, plural, renewal, type Row } from './data'

/** A health score as a number in its band colour; "No data" when unscored. */
export function HealthValue({ value }: { value: number | null }) {
  if (isMissing(value)) return <span className="text-muted-foreground">No data</span>
  return <span className={cn('font-medium tabular-nums', bandText[bandOf(value)])}>{value}</span>
}

/** Heading over a sheet's account list: what is listed, how many, their CARR and how many are the signed-in person's. */
export function SheetListHead({ title, list, order }: { title: string; list: Row[]; order: string }) {
  const mine = list.filter(r => r.mine).length
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
        {moneyK(carrK(list))} CARR · {mine ? `${mine} ${mine === 1 ? 'is' : 'are'} yours` : 'none are yours'} · {order}
      </p>
    </div>
  )
}

/** Neutral tag next to an account name. */
const tag = 'shrink-0 rounded-sm border border-hairline px-1 text-[10px] leading-4 font-normal text-muted-foreground'

const PAGE = 25

/** The muted line under an account name: whatever the sheet doesn't already say. */
export const META = {
  podStage: (r: Row) => `${r.pod} · ${r.stage}`,
  industryStage: (r: Row) => `${r.ind} · ${r.stage}`,
  podIndustry: (r: Row) => `${r.pod} · ${r.ind}`,
}

/** The account list every Portfolio drill-down sheet shows, 25 at a time. `grr` adds the GRR column (retention sheet).
 *  Give it a `key` per slice so paging resets. */
export function AccountsTable({ list, meta = META.podStage, grr = false, tags }: {
  list: Row[]; meta?: (r: Row) => string; grr?: boolean
  /** small neutral tags after the name, e.g. why a renewal counts as at risk */
  tags?: (r: Row) => string[]
}) {
  const [shown, setShown] = useState(PAGE)
  const rows = list.slice(0, shown)
  const more = Math.min(PAGE, list.length - shown)
  // the chevron column exists only when a row can open an account page (TransAmerica plus the mock accounts)
  const anyOpen = rows.some(r => hasPage(r.name))
  return (
    <>
      <Table className="[&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            {grr && <TableHead className="text-right"><Term>GRR</Term></TableHead>}
            <TableHead className="text-right">Health</TableHead>
            <TableHead className="text-right"><Term>CARR</Term></TableHead>
            <TableHead className="text-right">Renews</TableHead>
            {anyOpen && <TableHead className="w-6"><span className="sr-only">Open</span></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => {
            const open = hasPage(r.name)
            const rr = renewal(r)
            return (
              <TableRow key={r.name} className={cn(open ? 'cursor-pointer' : 'hover:bg-transparent')} onClick={open ? () => openAccount(r.name) : undefined}>
                <TableCell className="max-w-72 font-medium">
                  <span className="flex min-w-0 items-center gap-2">
                    {open ? (
                      <button type="button" className="truncate rounded-sm text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={e => { e.stopPropagation(); openAccount(r.name) }}>
                        {r.name}
                      </button>
                    ) : <span className="truncate">{r.name}</span>}
                    {[...(r.mine ? ['Yours'] : []), ...(tags?.(r) ?? [])].map(t => <span key={t} className={tag}>{t}</span>)}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{meta(r)}</span>
                </TableCell>
                {grr && <TableCell className="text-right tabular-nums">{r.grr == null ? <span className="text-muted-foreground">No data</span> : `${r.grr}%`}</TableCell>}
                <TableCell className="text-right"><HealthValue value={r.health} /></TableCell>
                <TableCell className="text-right tabular-nums">{money(r.carr)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {!isLive(r) ? <span className="text-muted-foreground">Churned</span> : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={open ? -1 : 0} className={cn('rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring', rr.days <= 60 && 'text-bad')}>{rr.t}</span>
                      </TooltipTrigger>
                      <TooltipContent>Renews {fmtFull(r.renew)}</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                {anyOpen && <TableCell>{open && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}</TableCell>}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {more > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-muted-foreground">Showing {shown} of {plural(list.length, 'account')}</span>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShown(s => s + PAGE)}>Show {more} more</Button>
        </div>
      )}
    </>
  )
}
