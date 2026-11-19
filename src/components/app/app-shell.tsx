import { useEffect, useState } from 'react'
import { ChartColumn, PanelLeftClose, PanelLeftOpen, ChevronsUpDown, LayoutList, MessageSquareText, Moon, Search, Sun } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { HealthRing } from '@/components/health'
import { SirionLogo, SirionMark } from './logo'
import { CommandMenu } from './command-menu'
import { AskPanel } from './ask'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, useSidebar,
} from '@/components/ui/sidebar'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { go, type Route } from '@/lib/route'
import { useTheme } from '@/lib/theme'

type NavItem = { route: Route; label: string; icon: React.ElementType }
const WORKSPACE: NavItem[] = [
  { route: 'accounts', label: 'My accounts', icon: LayoutList },
  { route: 'portfolio', label: 'Portfolio', icon: ChartColumn },
]

/** Navigate and, on phones, close the sidebar sheet. */
function useNav() {
  const { isMobile, setOpenMobile } = useSidebar()
  return (r: Route) => { go(r); if (isMobile) setOpenMobile(false) }
}

function NavGroup({ label, items, active }: { label: string; items: NavItem[]; active: Route }) {
  const nav = useNav()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map(n => (
          <SidebarMenuItem key={n.route}>
            <SidebarMenuButton isActive={active === n.route} tooltip={n.label} onClick={() => nav(n.route)} className="hover:bg-sidebar-accent/50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium">
              <n.icon />
              <span>{n.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function AppSidebar({ route, theme, toggleTheme, onFind, onAsk }: {
  route: Route; theme: 'dark' | 'light'; toggleTheme: () => void; onFind: () => void; onAsk: () => void
}) {
  const nav = useNav()
  const { state, toggleSidebar, isMobile } = useSidebar()
  const active = route === 'account' ? 'accounts' : route
  // clicking empty sidebar space (not a control) toggles it, like the rail
  const onBlankClick = (e: React.MouseEvent) => {
    if (isMobile) return
    if ((e.target as HTMLElement).closest('button, a, input, [role="menuitem"], [data-sidebar="menu-button"], [data-sidebar="menu-badge"]')) return
    toggleSidebar()
  }
  return (
    <Sidebar collapsible="icon" onClick={onBlankClick}>
      <SidebarHeader className="group/hdr flex-row items-center gap-1">
        {/* expanded: logo + collapse button. collapsed: the mark, which turns into the expand button on hover */}
        <button type="button" onClick={() => nav('accounts')} aria-label="Sirion home"
          className="flex h-10 min-w-0 flex-1 items-center rounded-md px-2 outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden">
          <SirionLogo className="h-5 w-[93px] shrink-0 text-sidebar-accent-foreground" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={toggleSidebar} aria-label={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
              className="relative grid size-8 shrink-0 place-items-center rounded-md text-sidebar-foreground/70 outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:mx-auto">
              <SirionMark className="hidden h-4 w-[22px] text-sidebar-accent-foreground group-data-[collapsible=icon]:block group-data-[collapsible=icon]:group-hover/hdr:hidden" />
              <PanelLeftClose className="size-4 group-data-[collapsible=icon]:hidden" />
              <PanelLeftOpen className="hidden size-4 group-data-[collapsible=icon]:group-hover/hdr:block" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{state === 'expanded' ? 'Collapse' : 'Expand'} <Kbd className="ml-1">⌘B</Kbd></TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pb-0">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Search ⌘K" onClick={onFind} className="border border-sidebar-border bg-background text-muted-foreground shadow-xs hover:bg-background hover:text-foreground">
                <Search /><span>Search</span>
              </SidebarMenuButton>
              <SidebarMenuBadge><Kbd className="h-5 text-[10px]">⌘K</Kbd></SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavGroup label="Workspace" items={WORKSPACE} active={active} />
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={route === 'account'} tooltip="TransAmerica · 50" onClick={() => nav('account')}>
                <HealthRing value={50} size={16} stroke={2} label={false} />
                <span>TransAmerica</span>
              </SidebarMenuButton>
              <SidebarMenuBadge className="text-warn">50</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {/* States page hidden for now; route stays reachable at #states */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-accent text-xs text-sidebar-accent-foreground">RS</AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-sidebar-accent-foreground">Rahul Dev Sharma</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">Customer Success Manager</span>
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side="right" align="end" sideOffset={4}>
                <DropdownMenuLabel className="font-normal">
                  <div className="grid text-sm leading-tight">
                    <span className="font-medium">Rahul Dev Sharma</span>
                    <span className="text-xs text-muted-foreground">260 accounts · CS – NA</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={toggleTheme}>
                  {theme === 'dark' ? <Sun /> : <Moon />}{theme === 'dark' ? 'Light theme' : 'Dark theme'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onFind}><Search />Find an account<DropdownMenuShortcut>⌘K</DropdownMenuShortcut></DropdownMenuItem>
                <DropdownMenuItem onSelect={onAsk}><MessageSquareText />Ask about an account</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

const OPEN_KEY = 'sah-sidebar-open'
const WIDE = '(min-width: 1280px)'

/**
 * Sidebar open state:
 * - desktop: the user's last choice (⌘B, the trigger or the rail) is remembered;
 *   with no saved choice it is expanded on wide screens and collapsed to icons below 1280px.
 * - crossing the 1280px breakpoint re-applies that default, so a narrowing window never squeezes the content.
 * - phones (<768px, handled by shadcn) use a sheet that closes after navigating.
 */
function useSidebarOpen() {
  const saved = () => { try { const v = localStorage.getItem(OPEN_KEY); return v == null ? null : v === '1' } catch { return null } }
  const [open, setOpen] = useState<boolean>(() => saved() ?? matchMedia(WIDE).matches)
  useEffect(() => {
    const mq = matchMedia(WIDE)
    const on = () => { setOpen(mq.matches); try { localStorage.removeItem(OPEN_KEY) } catch {} }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const set = (v: boolean) => { setOpen(v); try { localStorage.setItem(OPEN_KEY, v ? '1' : '0') } catch {} }
  return [open, set] as const
}

export function AppShell({ route, children }: { route: Route; children: React.ReactNode }) {
  const [theme, toggleTheme] = useTheme()
  const [open, setOpen] = useSidebarOpen()
  const [cmd, setCmd] = useState(false)
  const [ask, setAsk] = useState(false)
  useEffect(() => { document.title = route === 'account' ? 'TransAmerica · Sirion Account Health' : 'Sirion Account Health' }, [route])
  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar route={route} theme={theme} toggleTheme={toggleTheme} onFind={() => setCmd(true)} onAsk={() => setAsk(true)} />
      <SidebarInset>
        <CommandMenu open={cmd} onOpenChange={setCmd} />
        <AskPanel open={ask} onOpenChange={setAsk} />
        <main className="mx-auto w-full max-w-[1280px] px-4 pt-6 pb-10 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
