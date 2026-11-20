/* Option E · Masthead (?layout=masthead). Quiet underline tabs under the page title, then Summary opens like a front
   page: one large score and the cap that holds it, beside the verdict sentence whose facts point at their evidence (the
   area row, the cap gauge), the next step and renewal countdown under it, the six areas as a ruled row and the key
   figures as one line. Other tabs open on a one-line verdict and their own content, un-boxed by masthead.css. */
import { useEffect, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { StickyPageHeader } from '../header'
import { TABS } from '../index'
import { setTab, useTab } from '../tab'
import { HeaderSheets } from '../overview/how-sheet'
import { CompactMast, Masthead } from './masthead/hero'
import { MastheadSummary } from './masthead/summary'
import './masthead.css'

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

export function MastheadLayout() {
  const tab = useTab()
  const [tabsRef, docked] = useDocked()
  return (
    <div data-account data-masthead className="flex min-w-0 flex-col pb-32 lg:pr-12">
      <StickyPageHeader joined={docked} />
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div ref={tabsRef} className={cn('mh-tabs sticky top-[var(--account-hdr,0px)] z-20', docked && 'is-docked')}>
          <TabsList className="h-auto! w-full justify-start gap-7 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-11 flex-none rounded-none border-0 bg-transparent px-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:ring-0 focus-visible:outline-none data-active:bg-transparent data-active:text-foreground data-active:shadow-none dark:data-active:border-0 dark:data-active:bg-transparent after:absolute group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 data-active:after:opacity-100 focus-visible:after:opacity-60 focus-visible:text-foreground">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} data-mh-panel={t.id}
            className="flex flex-col gap-6 pt-8 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
            {/* Summary opens on the full masthead; every other tab on a one-line verdict, then its own content */}
            {t.id === 'overview' ? <><Masthead /><MastheadSummary /></> : <><CompactMast /><t.C /></>}
          </TabsContent>
        ))}
      </Tabs>
      <HeaderSheets />
    </div>
  )
}
