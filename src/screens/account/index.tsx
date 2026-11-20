import { useEffect, useRef, useState } from 'react'
import { Activity, FileText, HeartPulse, Newspaper, TrendingUp, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountHeader, FULL_BLEED, StickyPageHeader } from './header'
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
import { RailLayout } from './layouts/rail'
import { BriefLayout } from './layouts/brief'
import { MastheadLayout } from './layouts/masthead'
import { RunwayLayout } from './layouts/runway'
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
  if (layout === 'rail') return <RailLayout />
  if (layout === 'brief') return <BriefLayout />
  if (layout === 'masthead') return <MastheadLayout />
  if (layout === 'runway') return <RunwayLayout />
  if (layout === 'ledger') return <LedgerLayout />
  return <CurrentLayout tabsFirst={layout === 'tabsfirst'} />
}

/** `tabsFirst` (option D): tabs sit right under the title as a segmented control, and the verdict card and
 *  KPIs move into the Summary tab, so the other tabs open straight on their own content. */
function CurrentLayout({ tabsFirst = false }: { tabsFirst?: boolean }) {
  const tab = useTab()
  const [tabsRef, docked] = useDocked()
  return (
    <div data-account className="flex flex-col pb-20">
      {/* header + score card */}
      <StickyPageHeader joined={docked} />
      {tabsFirst ? <HeaderSheets /> : (
        <section className="flex flex-col gap-5 pb-14">
          <AccountHeader />
        </section>
      )}
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        {/* full-bleed sticky tab strip pinned to top; tabs sized to their label, left aligned */}
        <div ref={tabsRef} className={cn(FULL_BLEED, 'sticky top-[var(--account-hdr,0px)] z-20', !tabsFirst && 'py-3',
          // background and rule fade in once docked, when content scrolls behind the strip; at rest the pills sit on the page.
          // Both are always rendered and only change opacity, so docking never shifts layout.
          'before:bg-background/90 before:backdrop-blur-md before:opacity-0 before:transition-opacity before:duration-300',
          !tabsFirst && 'after:pointer-events-none after:absolute after:bottom-0 after:-inset-x-[100vmax] after:h-px after:bg-hairline after:opacity-0 after:transition-opacity after:duration-300',
          docked && 'before:opacity-100 after:opacity-100')}>
          {/* pill tabs: the active one is a solid dark pill, the rest sit on a soft grey */}
          <TabsList variant={tabsFirst ? 'line' : undefined} className={cn('h-auto! justify-start overflow-x-auto [scrollbar-width:none]', tabsFirst
            // underline tabs (as in the Ledger layout), with icons: the list carries the hairline, the active tab a 1.5px rule
            ? 'w-full gap-7 rounded-none border-b border-hairline bg-transparent p-0'
            : 'w-full gap-2 rounded-none bg-transparent p-0')}>
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className={tabsFirst
                  ? 'relative h-11 flex-none gap-2 rounded-none border-0 bg-transparent px-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:border-transparent focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:after:opacity-60 data-active:bg-transparent data-active:text-foreground data-active:shadow-none dark:data-active:border-0 dark:data-active:bg-transparent after:absolute after:inset-x-0! after:top-auto! after:bottom-0! after:h-[1.5px]! after:w-auto! after:bg-foreground after:opacity-0 data-active:after:opacity-100'
                  : "h-9 flex-none gap-2 rounded-lg border-0 bg-muted/70 px-3.5 text-muted-foreground shadow-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-active:bg-foreground data-active:text-background data-active:shadow-none dark:data-active:bg-foreground dark:data-active:text-background after:hidden"}>
                <t.icon />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className={cn('flex flex-col gap-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300', tabsFirst ? 'pt-6' : 'pt-8')}>
            {tabsFirst && t.id === 'overview' && <Standing />}
            <t.C />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

