import { createContext, useContext, useEffect, useState } from 'react'

/**
 * App-wide "data is loading" signal. The prototype has no backend, so each route change simulates
 * a fetch (~700ms) to exercise every widget's skeleton. Widgets read it with useIsLoading().
 * ponytail: replace with real query state when data comes from the tenant.
 */
const LoadingCtx = createContext(false)

export function LoadingProvider({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const force = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('widgets') : null
    if (force === 'loading') { setLoading(true); return }
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setLoading(false); return }
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(t)
  }, [routeKey])
  return <LoadingCtx.Provider value={loading}>{children}</LoadingCtx.Provider>
}

export const useIsLoading = () => useContext(LoadingCtx)
