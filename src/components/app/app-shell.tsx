import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, Check, LayoutList, MessageSquareText, Moon, Search, Sun, Shapes } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CommandMenu } from './command-menu'
import { AskPanel } from './ask'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import { go, type Route } from '@/lib/route'
import { useTheme } from '@/lib/theme'

const NAV: { route: Route; label: string; icon: React.ElementType }[] = [
  { route: 'accounts', label: 'My accounts', icon: LayoutList },
  { route: 'portfolio', label: 'Portfolio', icon: BarChart3 },
  { route: 'states', label: 'States', icon: Shapes },
]

function SirionMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6 shrink-0 text-sidebar-ring" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="16" cy="16" rx="13" ry="9" /><ellipse cx="16" cy="16" rx="9" ry="5.5" /><ellipse cx="16" cy="16" rx="4.5" ry="2.5" />
      </g>
    </svg>
  )
}

export function AppShell({ route, children }: { route: Route; children: React.ReactNode }) {
  const [theme, toggleTheme] = useTheme()
  const [cmd, setCmd] = useState(false)
  const [ask, setAsk] = useState(false)
  const [range, setRange] = useState<string>('Lifetime')
  useEffect(() => { document.title = route === 'account' ? 'TransAmerica · Sirion Account Health' : 'Sirion Account Health' }, [route])
  const active = route === 'account' ? 'accounts' : route
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" onClick={() => go('accounts')} tooltip="Sirion Account Health">
                <SirionMark />
                <div className="grid leading-tight">
                  <span className="text-sm font-medium text-sidebar-accent-foreground">Sirion</span>
                  <span className="text-xs text-sidebar-foreground/70">Account health</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV.map(n => (
                <SidebarMenuItem key={n.route}>
                  <SidebarMenuButton isActive={active === n.route} tooltip={n.label} onClick={() => go(n.route)}>
                    <n.icon />
                    <span>{n.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Rahul Dev Sharma, CSM">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">RS</span>
                <div className="grid leading-tight">
                  <span className="text-sm text-sidebar-accent-foreground">Rahul Dev Sharma</span>
                  <span className="text-xs text-sidebar-foreground/70">Customer Success Manager</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-hairline bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {route === 'account' ? (
                <>
                  <BreadcrumbItem><BreadcrumbLink href="#accounts">My accounts</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>TransAmerica</BreadcrumbPage></BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem><BreadcrumbPage>{NAV.find(n => n.route === route)?.label}</BreadcrumbPage></BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden w-56 justify-start gap-2 text-muted-foreground sm:flex" onClick={() => setCmd(true)}>
              <Search /> Find an account <Kbd className="ml-auto">⌘K</Kbd>
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => setCmd(true)} aria-label="Find an account"><Search /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label={`Date range: ${range}`}><CalendarDays />{range}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Date range</DropdownMenuLabel>
                {['Last 30 days', 'Last 90 days', 'Last 180 days', 'Last 12 months', 'Lifetime'].map(r => (
                  <DropdownMenuItem key={r} onSelect={() => setRange(r)}>
                    {r}{range === r && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" size="sm" onClick={() => setAsk(true)}><MessageSquareText />Ask</Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </div>
        </header>
        <CommandMenu open={cmd} onOpenChange={setCmd} />
        <AskPanel open={ask} onOpenChange={setAsk} />
        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
