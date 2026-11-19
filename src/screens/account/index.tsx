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
    <div className="flex flex-col gap-6">
      <AccountHeader />
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList variant="line" className="sticky top-14 z-10 w-full justify-start overflow-x-auto bg-background/80 backdrop-blur-md">
          {TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id}><t.icon />{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <t.C />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
