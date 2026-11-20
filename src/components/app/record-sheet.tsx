/* One side-sheet anatomy for every record on the account page (area, inputs, method, event, person, news):
     header  = type eyebrow · back (when nested) · close / title / one muted meta line / optional extra row (filters)
     body    = the only part that scrolls
     footer  = optional actions, pinned to the bottom
   Two widths: md (560px) for one event, person or piece of evidence; lg (800px) for areas, the method and all inputs.
   Focus goes to the sheet itself on open (never to an (i) or other tooltip trigger) and back to the trigger on close.
   When nested, Esc goes back one level; at the root it closes.
   Opened from a list, `pager` adds `‹ 3 of 62 ›` to the header and J/K or ↑/↓ to step through that list as filtered and
   sorted (never while typing in a field or with a menu open). */
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ChevronLeft, ChevronRight, LifeBuoy, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type RecordSheetSize = 'md' | 'lg'
export type RecordSheetBack = { label: string; onBack: () => void }
/** Position in the list the sheet was opened from. `onPage` gets the new index (0-based). */
export type RecordSheetPager = { index: number; total: number; noun?: string; onPage: (index: number) => void }

const WIDTH: Record<RecordSheetSize, string> = {
  md: 'data-[side=right]:sm:max-w-[35rem]',
  lg: 'data-[side=right]:sm:max-w-[50rem]',
}

const BackCtx = createContext<RecordSheetBack | undefined>(undefined)
const PagerCtx = createContext<RecordSheetPager | undefined>(undefined)

// keys that belong to whatever has focus: fields, menus, listboxes, roving-focus groups (toggle groups, tabs), charts
const OWNS_KEYS = 'input,textarea,select,[contenteditable="true"],[role="menu"],[role="menuitem"],[role="listbox"],[role="option"],[data-radix-collection-item],.recharts-surface'
const MENU_OPEN = '[data-slot="dropdown-menu-content"][data-state="open"],[data-slot="select-content"][data-state="open"],[data-slot="popover-content"][data-state="open"]'

/** J / ↓ next, K / ↑ previous. */
function pageKey(e: React.KeyboardEvent, pager?: RecordSheetPager) {
  if (!pager || pager.total < 2 || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
  const step = e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J' ? 1 : e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K' ? -1 : 0
  if (!step) return
  if ((e.target as HTMLElement).closest(OWNS_KEYS) || document.querySelector(MENU_OPEN)) return
  const next = pager.index + step
  e.preventDefault()
  if (next >= 0 && next < pager.total) pager.onPage(next)
}

/** The sheet frame. `view` identifies what is shown: when it changes inside an open sheet (drilling in or back),
 *  focus returns to the sheet so it never falls to the page. */
export function RecordSheet({ open, onOpenChange, size, back, pager, view, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; size: RecordSheetSize
  back?: RecordSheetBack; pager?: RecordSheetPager; view?: string; children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => { if (open && !opener.current) opener.current = document.activeElement as HTMLElement | null }, [open])
  useEffect(() => { if (open) ref.current?.focus({ preventScroll: true }) }, [open, view])
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={ref} side="right" showCloseButton={false}
        className={cn('w-full gap-0 overflow-hidden p-0 outline-none data-[side=right]:w-full', WIDTH[size])}
        onOpenAutoFocus={e => { e.preventDefault(); ref.current?.focus({ preventScroll: true }) }}
        onCloseAutoFocus={e => {
          const el = opener.current; opener.current = null
          if (el && el.isConnected && el !== document.body) { e.preventDefault(); el.focus({ preventScroll: true }) }
        }}
        onEscapeKeyDown={e => { if (back) { e.preventDefault(); back.onBack() } }}
        onKeyDown={e => pageKey(e, pager)}>
        <BackCtx.Provider value={back}><PagerCtx.Provider value={pager}>{children}</PagerCtx.Provider></BackCtx.Provider>
      </SheetContent>
    </Sheet>
  )
}

/** Header: eyebrow row with the controls, title, one muted meta line, then an optional extra row (filters). */
export function RecordSheetHeader({ eyebrow, title, meta, actions, children }: {
  eyebrow: React.ReactNode; title: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode
}) {
  const back = useContext(BackCtx)
  const pager = useContext(PagerCtx)
  return (
    <header className="grid shrink-0 grid-cols-[minmax(0,1fr)] gap-1 border-b border-hairline bg-popover px-6 pt-3 pb-4">
      <div className="-mr-2 flex min-h-8 items-center gap-2">
        {back && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={back.onBack}>
                <ArrowLeft />{back.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to {back.label} <Kbd className="ml-1">Esc</Kbd></TooltipContent>
          </Tooltip>
        )}
        {back && <span className="text-xs text-muted-foreground" aria-hidden="true">/</span>}
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{eyebrow}</p>
        {actions}
        {pager && pager.total > 1 && <Pager pager={pager} />}
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close"><XIcon /></Button>
            </SheetClose>
          </TooltipTrigger>
          <TooltipContent side="left">Close{!back && <Kbd className="ml-1">Esc</Kbd>}</TooltipContent>
        </Tooltip>
      </div>
      <SheetTitle className="text-lg leading-snug font-normal text-balance">{title}</SheetTitle>
      {meta != null && meta !== '' && <SheetDescription className="text-pretty">{meta}</SheetDescription>}
      {children && <div className="pt-2">{children}</div>}
    </header>
  )
}

function Pager({ pager: { index, total, noun = 'item', onPage } }: { pager: RecordSheetPager }) {
  return (
    <div role="group" aria-label={`${noun} ${index + 1} of ${total}`} className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Previous ${noun}`} disabled={index === 0} onClick={() => onPage(index - 1)}><ChevronLeft /></Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Previous {noun} <Kbd className="ml-1">K</Kbd><Kbd>↑</Kbd></TooltipContent>
      </Tooltip>
      <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">{index + 1} of {total}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Next ${noun}`} disabled={index >= total - 1} onClick={() => onPage(index + 1)}><ChevronRight /></Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Next {noun} <Kbd className="ml-1">J</Kbd><Kbd>↓</Kbd></TooltipContent>
      </Tooltip>
    </div>
  )
}

/** The last non-null value, so a URL-driven sheet keeps its content while it animates closed. `value` must keep its
 *  identity while unchanged (useSheet() does). */
export function useKept<T>(value: T | null | undefined): T | null {
  const [kept, setKept] = useState<T | null>(value ?? null)
  if (value != null && value !== kept) setKept(value)
  return value ?? kept
}

/** Pager props for a sheet opened from `list`: finds `current` by `idOf` and calls `go` with the neighbour.
 *  Undefined when the item isn't in the list (opened from a link or another list). */
export function listPager<T>(list: readonly T[], current: T | null | undefined, idOf: (t: T) => string, go: (t: T) => void, noun?: string): RecordSheetPager | undefined {
  if (!current) return undefined
  const id = idOf(current), index = list.findIndex(t => idOf(t) === id)
  if (index < 0) return undefined
  return { index, total: list.length, noun, onPage: i => go(list[i]) }
}

/** A ticket ID as a chip that copies it. There is no source-system URL in the data, so it never pretends to be a link. */
export function TicketChip({ id }: { id: string }) {
  const copy = () => navigator.clipboard?.writeText(id).then(() => toast.success(`Copied ${id}`), () => toast.error(`Couldn't copy ${id}`))
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={copy} aria-label={`Copy ${id}`}
          className="inline-flex h-5 items-center gap-1 rounded-md border border-hairline px-1.5 text-[11px] tabular-nums text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <LifeBuoy className="size-3 text-muted-foreground" aria-hidden="true" />{id}
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy {id}</TooltipContent>
    </Tooltip>
  )
}

/** The scrolling part. Children bring their own padding (SheetBody, sections). */
export function RecordSheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', className)}>{children}</div>
}

/** Pinned actions, right-aligned. Only render it when the sheet has actions. */
export function RecordSheetFooter({ children }: { children: React.ReactNode }) {
  return <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-hairline bg-popover px-6 py-3">{children}</footer>
}
