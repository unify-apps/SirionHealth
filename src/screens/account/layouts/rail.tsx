/* Option A, record + rail (Attio / Linear style). Left: a sticky rail with the account's identity and every fact that
   doesn't change with the tab. Right: the work area, an underline tab bar over the existing tab contents.
   Below lg the rail stacks on top and the tab bar sticks to the top of the window. */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangeMenu } from '@/components/app/date-range'
import { TABS } from '../index'
import { setTab, useTab } from '../tab'
import { HeaderSheets } from '../overview/how-sheet'
import { RecordRail } from './rail/panel'

export function RailLayout() {
  const tab = useTab()
  return (
    <div data-account className="grid items-start pb-20 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[20rem_minmax(0,1fr)]">
      {/* rail: full window height and its own scroll on lg, so the facts stay put while the work area scrolls */}
      <aside aria-label="Account facts"
        className="border-b border-hairline pb-2 lg:sticky lg:top-0 lg:-mt-6 lg:h-svh lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:border-b-0 lg:pt-6 lg:pr-8 lg:pb-10 lg:[scrollbar-width:thin]">
        <RecordRail />
      </aside>

      <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-0">
        <div className="sticky top-0 z-20 -mx-4 flex items-center gap-4 border-b border-hairline bg-background/90 px-4 backdrop-blur-md max-lg:mt-2 sm:-mx-6 sm:px-6 lg:-mt-6 lg:mx-0 lg:px-0 lg:pt-6">
          <TabsList className="h-auto! min-w-0 flex-1 justify-start gap-6 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none]">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-11 flex-none rounded-none border-0 bg-transparent px-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:ring-0 focus-visible:outline-none focus-visible:after:opacity-100 data-active:bg-transparent data-active:font-medium data-active:text-foreground data-active:shadow-none dark:data-active:border-0 dark:data-active:bg-transparent after:absolute group-data-horizontal/tabs:after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 data-active:after:opacity-100">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="shrink-0 py-2"><DateRangeMenu /></div>
        </div>
        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="flex flex-col gap-6 pt-6 animate-in fade-in-0 duration-200">
            <t.C />
          </TabsContent>
        ))}
      </Tabs>

      <HeaderSheets />
    </div>
  )
}
