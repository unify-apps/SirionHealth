import { ChevronRight } from 'lucide-react'
import { BAND_LABEL, bandOf, HealthBar } from '@/components/health'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { money } from '@/data/legacy'
import { fmtFull } from '@/lib/dates'
import { go } from '@/lib/route'
import { cn } from '@/lib/utils'
import { Term } from '../account/overview/bits'
import { renewal, type Row } from './data'

/** Heading over a sheet's account list. The page's figures cover the whole book; the list is the signed-in
 *  person's own accounts (the ones on My accounts), so the heading says whose they are and how many. */
export function SheetListHead({ title, count, of, carr }: { title: string; count: number; of: number; carr: number }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
        {count} of the {of} accounts you manage · {money(carr)} CARR
      </p>
    </div>
  )
}

/** The account list every Portfolio drill-down sheet shows. `col` picks the second column. */
export function AccountsTable({ list, col = 'stage' }: { list: Row[]; col?: 'stage' | 'grr' }) {
  // the chevron column exists only when a row can open an account page (TransAmerica is the one built so far)
  const anyOpen = list.some(r => r.name === 'TransAmerica')
  return (
    <Table className="[&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>{col === 'grr' ? <Term>GRR</Term> : 'Stage'}</TableHead>
          <TableHead>Health</TableHead>
          <TableHead className="text-right"><Term>CARR</Term></TableHead>
          <TableHead className="text-right">Renewal</TableHead>
          {anyOpen && <TableHead className="w-6"><span className="sr-only">Open</span></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map(r => {
          const open = r.name === 'TransAmerica'
          const rr = renewal(r)
          return (
            <TableRow
              key={r.name}
              className={cn(open ? 'cursor-pointer' : 'hover:bg-transparent')}
              onClick={open ? () => go('account') : undefined}
            >
              <TableCell className="font-medium">
                {open ? (
                  <button type="button" className="rounded-sm text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={e => { e.stopPropagation(); go('account') }}>
                    {r.name}
                  </button>
                ) : r.name}
                <span className="block text-xs font-normal text-muted-foreground">{r.ind} · {r.seg}</span>
              </TableCell>
              <TableCell className={cn(col === 'grr' && 'tabular-nums')}>{col === 'grr' ? (r.grr == null ? 'No data' : `${r.grr}%`) : r.stage}</TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={open ? -1 : 0} className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><HealthBar value={r.health} /></span>
                  </TooltipTrigger>
                  <TooltipContent>Health {r.health} of 100 · {BAND_LABEL[bandOf(r.health)]}</TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-right tabular-nums">{money(r.carr)}</TableCell>
              <TableCell className={cn('text-right tabular-nums', rr.days <= 60 && 'text-bad')}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={open ? -1 : 0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{rr.t}</span>
                  </TooltipTrigger>
                  <TooltipContent>Renews {fmtFull(r.renew)}</TooltipContent>
                </Tooltip>
              </TableCell>
              {anyOpen && <TableCell>{open && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}</TableCell>}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
