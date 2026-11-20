import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
// v2: light became the default; the old key was written on every load, so it can't tell a choice from the old default
const KEY = 'sah-theme-v2'

const saved = (): Theme | null => {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'dark' || t === 'light') return t
  } catch {}
  return null
}
const system = () => window.matchMedia('(prefers-color-scheme: dark)')
const systemTheme = (): Theme => (system().matches ? 'dark' : 'light')

/** The theme follows the system setting until the person picks one with the toggle; that choice is then kept. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => saved() ?? systemTheme())
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  // with no saved choice, keep following the system when it changes (e.g. auto dark at night)
  useEffect(() => {
    const mq = system()
    const on = () => { if (!saved()) setTheme(systemTheme()) }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const toggle = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(KEY, next) } catch {}
    return next
  })
  return [theme, toggle] as const
}

/** Current theme read from <html class="dark">, for components outside the shell (e.g. toasts). */
export function useHtmlTheme(): Theme {
  const read = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  const [t, setT] = useState<Theme>(read)
  useEffect(() => {
    const mo = new MutationObserver(() => setT(read()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  return t
}
