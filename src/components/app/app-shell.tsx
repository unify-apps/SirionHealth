import { BarChart3, LayoutList, Moon, Search, Sun, Shapes } from 'lucide-react'
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
    <svg viewBox="0 0 32 32" className="size-6 shrink-0" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="16" cy="16" rx="13" ry="9" /><ellipse cx="16" cy="16" rx="9" ry="5.5" /><ellipse cx="16" cy="16" rx="4.5" ry="2.5" />
      </g>
    </svg>
  )
}

export function AppShell({ route, children }: { route: Route; children: React.ReactNode }) {
  const [theme, toggleTheme] = useTheme()
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
                  <span className="text-sm font-medium text-foreground">Sirion</span>
                  <span className="text-xs text-muted-foreground">Account health</span>
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
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">RS</span>
                <div className="grid leading-tight">
                  <span className="text-sm text-foreground">Rahul Dev Sharma</span>
                  <span className="text-xs text-muted-foreground">Customer Success Manager</span>
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
            <Button variant="outline" size="sm" className="hidden w-56 justify-start gap-2 text-muted-foreground sm:flex">
              <Search /> Find an account <Kbd className="ml-auto">⌘K</Kbd>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
