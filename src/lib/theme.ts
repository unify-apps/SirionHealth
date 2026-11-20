import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
const KEY = 'sah-theme'

const initial = (): Theme => {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'dark' || t === 'light') return t
  } catch {}
  return 'dark' // the Default design system is dark-first
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem(KEY, theme) } catch {}
  }, [theme])
  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))] as const
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
