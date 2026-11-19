import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/app/app-shell'
import { useRoute } from '@/lib/route'
import { AccountsScreen } from '@/screens/accounts'
import { AccountScreen } from '@/screens/account'
import { PortfolioScreen } from '@/screens/portfolio'
import { StatesScreen } from '@/screens/states'

export default function App() {
  const route = useRoute()
  return (
    <TooltipProvider delayDuration={200}>
      <AppShell route={route}>
        {route === 'accounts' && <AccountsScreen />}
        {route === 'account' && <AccountScreen />}
        {route === 'portfolio' && <PortfolioScreen />}
        {route === 'states' && <StatesScreen />}
      </AppShell>
    </TooltipProvider>
  )
}
