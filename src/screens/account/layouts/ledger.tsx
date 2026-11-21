/* Option G · Ledger (?layout=ledger). The account reads like a typeset statement: a compact header and quiet
   underline tabs, then on Summary one continuous read: the verdict, the renewal (led by its next step), and why the
   score is what it is (the six health areas on one shared 0-100 scale, then its history). Context sits below, quieter.
   Other tabs open on a one-line standing, then their own content, set on the open page (ledger.css). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useRange } from '@/lib/range'
import { buildVerdict, FULL_BLEED, StickyPageHeader } from '../header'
import { TABS } from '../index'
import { setTab, useTab } from '../tab'
import { HeaderSheets } from '../overview/how-sheet'
import { LedgerSummary } from './ledger/summary'
import { LedgerAdoption } from './ledger/adoption'
import { LedgerActivity } from './ledger/activity'
import { CompactStrip, VerdictStrip } from './ledger/strip'
import './ledger.css'

/** True while the tab strip is stuck under the sticky page header. */
function useDocked() {
  const ref = useRef<HTMLDivElement>(null)
  const [docked, setDocked] = useState(false)
  useEffect(() => {
    const on = () => {
      const el = ref.current
      if (!el) return
      const top = parseFloat(getComputedStyle(el).top) || 0
      setDocked(el.getBoundingClientRect().top <= top + 0.5)
    }
    on()
    window.addEventListener('scroll', on, { passive: true, capture: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on, { capture: true }); window.removeEventListener('resize', on) }
  }, [])
  return [ref, docked] as const
}

export function LedgerLayout() {
  const tab = useTab()
  const [tabsRef, docked] = useDocked()
  const range = useRange()
  const d = useMemo(() => buildVerdict(range), [range])
  return (
    <div data-account data-ledger className="flex min-w-0 flex-col pb-32">
      <StickyPageHeader joined={docked} />
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div ref={tabsRef} className={cn(FULL_BLEED, 'sticky top-[var(--account-hdr,0px)] z-20',
          'before:bg-background/90 before:backdrop-blur-md before:opacity-0 before:transition-opacity before:duration-300',
          docked && 'before:opacity-100')}>
          <TabsList variant="line" className="h-auto! w-full justify-start gap-7 overflow-x-auto rounded-none border-b border-hairline bg-transparent p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="relative h-11 flex-none rounded-sm border-0 bg-transparent px-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-transparent data-active:text-foreground data-active:shadow-none dark:data-active:border-0 dark:data-active:bg-transparent after:absolute after:inset-x-0! after:top-auto! after:bottom-0! after:h-[1.5px]! after:w-auto! after:bg-foreground after:opacity-0 data-active:after:opacity-100">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {/* the account's standing leads Summary; the other tabs get it as one line and open on their own content */}
        {tab === 'overview' ? <VerdictStrip d={d} /> : <CompactStrip d={d} />}
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} data-ledger-panel={t.id}
            className={cn('flex flex-col gap-6 animate-in', t.id === 'overview' ? 'pt-12' : 'pt-7',
              'fade-in-0 duration-200 motion-reduce:animate-none')}>
            {t.id === 'overview' ? <LedgerSummary /> : t.id === 'adoption' ? <LedgerAdoption /> : t.id === 'activity' ? <LedgerActivity /> : <t.C />}
          </TabsContent>
        ))}
      </Tabs>
      <HeaderSheets />
    </div>
  )
}
