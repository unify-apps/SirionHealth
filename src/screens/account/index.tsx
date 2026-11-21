import { useEffect, useRef, useState } from 'react'
import { Activity, FileText, HeartPulse, Newspaper, TrendingUp, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FULL_BLEED, StickyPageHeader } from './header'
import { cn } from '@/lib/utils'
import { setTab, useTab } from './tab'
import { OverviewTab } from './overview'
import { HealthTab } from './health'
import { AdoptionTab } from './adoption'
import { ActivityTab } from './activity'
import { StakeholdersTab } from './stakeholders'
import { IntelligenceTab } from './intelligence'
import { useFlags } from '@/lib/dev-flags'
import { HeaderSheets } from './overview/how-sheet'
import { Standing } from './layouts/tabsfirst/standing'
import { LedgerLayout } from './layouts/ledger'

export const TABS = [
  { id: 'overview', label: 'Summary', icon: FileText, C: OverviewTab },
  { id: 'health', label: 'Health', icon: HeartPulse, C: HealthTab },
  { id: 'adoption', label: 'Adoption', icon: TrendingUp, C: AdoptionTab },
  { id: 'activity', label: 'Activity', icon: Activity, C: ActivityTab },
  { id: 'stakeholders', label: 'Stakeholders', icon: Users, C: StakeholdersTab },
  { id: 'intelligence', label: 'Intelligence', icon: Newspaper, C: IntelligenceTab },
] as const

/** True while the tab strip is docked under the sticky page header. */
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

export function AccountScreen() {
  const { layout } = useFlags()
  return layout === 'ledger' ? <LedgerLayout /> : <TabsFirstLayout />
}

/** Tabs first: underline tabs right under the title; the standing (score, verdict, next step, figures) leads Summary,
 *  so the other tabs open straight on their own content. */
function TabsFirstLayout() {
  const tab = useTab()
  const [tabsRef, docked] = useDocked()
  return (
    <div data-account className="flex flex-col pb-20">
      <StickyPageHeader joined={docked} />
      <HeaderSheets />
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        {/* full-bleed sticky tab strip under the page header; its background fades in once docked, so docking never shifts layout */}
        <div ref={tabsRef} className={cn(FULL_BLEED, 'sticky top-[var(--account-hdr,0px)] z-20',
          'before:bg-background/90 before:backdrop-blur-md before:opacity-0 before:transition-opacity before:duration-300',
          docked && 'before:opacity-100')}>
          <TabsList variant="line" className="h-auto! w-full justify-start gap-7 overflow-x-auto rounded-none border-b border-hairline bg-transparent p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="relative h-11 flex-none gap-2 rounded-none border-0 bg-transparent px-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:border-transparent focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:after:opacity-60 data-active:bg-transparent data-active:text-foreground data-active:shadow-none dark:data-active:border-0 dark:data-active:bg-transparent after:absolute after:inset-x-0! after:top-auto! after:bottom-0! after:h-[1.5px]! after:w-auto! after:bg-foreground after:opacity-0 data-active:after:opacity-100">
                <t.icon />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="flex flex-col gap-6 pt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            {t.id === 'overview' && <Standing />}
            <t.C />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

