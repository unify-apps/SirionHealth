import { useEffect, useState } from 'react'

export type Route = 'accounts' | 'account' | 'portfolio' | 'states'
const ROUTES: Route[] = ['accounts', 'account', 'portfolio', 'states']

// ponytail: hash routing, four screens; swap for a router if deep links with params appear
const read = (): Route => {
  const h = location.hash.slice(1) as Route
  return ROUTES.includes(h) ? h : 'accounts'
}

export function go(r: Route) {
  location.hash = r
  window.scrollTo(0, 0)
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
