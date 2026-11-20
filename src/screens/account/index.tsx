import { Activity, FileText, HeartPulse, Newspaper, TrendingUp, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountHeader } from './header'
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

export function AccountScreen() {
  const tab = useTab()
  return (
    <div className="flex flex-col pb-20">
      {/* header + score card */}
      <section className="flex flex-col gap-5 pb-6">
        <AccountHeader />
      </section>
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        {/* full-bleed sticky tab strip pinned to top; tabs sized to their label, left aligned */}
        <div className="sticky top-0 z-10 -mx-4 border-b border-hairline bg-background/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <TabsList variant="line" className="h-11 w-full justify-start gap-1 overflow-x-auto rounded-none p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-11 flex-none gap-2 rounded-none border-0 px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:bg-accent/60 data-active:text-foreground group-data-horizontal/tabs:after:bottom-0 after:h-0.5 after:rounded-full after:bg-signal">
                <t.icon />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="flex flex-col gap-6 pt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <t.C />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
