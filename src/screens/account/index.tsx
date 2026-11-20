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

const TABS = [
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
  const tab = useTab()
  const [tabsRef, docked] = useDocked()
  return (
    <div className="flex flex-col pb-20">
      {/* header + score card */}
      <StickyPageHeader joined={docked} />
      <section className="flex flex-col gap-5 pb-10">
        <AccountHeader />
      </section>
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        {/* full-bleed sticky tab strip pinned to top; tabs sized to their label, left aligned */}
        <div ref={tabsRef} className={cn(FULL_BLEED, 'sticky top-[var(--account-hdr,0px)] z-20 transition-[padding] duration-200 before:bg-background/90 before:backdrop-blur-md', docked && 'pt-2',
          'after:pointer-events-none after:absolute after:bottom-0 after:-inset-x-[100vmax] after:h-px after:bg-hairline')}>
          <TabsList variant="line" className="h-11 w-full justify-start gap-1 overflow-x-auto rounded-none p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-11 flex-none gap-2 rounded-none border-0 px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:bg-hover data-active:font-medium data-active:text-foreground data-active:[&_svg]:text-signal group-data-horizontal/tabs:after:bottom-0 after:h-0.5 after:rounded-full after:bg-signal after:opacity-0 data-active:after:opacity-100">
                <t.icon />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="flex flex-col gap-6 pt-8 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <t.C />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

