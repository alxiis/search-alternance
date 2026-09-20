import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** Même clé que le script anti-clignotement de index.html. */
const STORAGE_KEY = 'suivi-alternance:theme'
const THEME_COLORS: Record<ResolvedTheme, string> = { light: '#f5f6f8', dark: '#0e131d' }

interface ThemeApi {
  /** Choix de l'utilisateur (« system » tant qu'il n'a rien choisi). */
  preference: ThemePreference
  /** Thème réellement appliqué. */
  resolved: ResolvedTheme
  setPreference: (p: ThemePreference) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeApi | null>(null)

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

const systemQuery = (): MediaQueryList | null => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null)

function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

/** Active une transition douce sur toute la page, uniquement le temps du changement. */
function animateSwitch(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const root = document.documentElement
  root.classList.add('theme-transition')
  window.setTimeout(() => root.classList.remove('theme-transition'), 250)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [systemDark, setSystemDark] = useState(() => systemQuery()?.matches ?? false)

  const resolved: ResolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const query = systemQuery()
    if (!query) return
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Synchronise plusieurs onglets ouverts en même temps.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPreferenceState(readPreference())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => applyTheme(resolved), [resolved])

  const setPreference = useCallback((next: ThemePreference) => {
    animateSwitch()
    setPreferenceState(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* stockage indisponible (navigation privée) : le choix reste valable pour la session */
    }
  }, [])

  const toggle = useCallback(() => setPreference(resolved === 'dark' ? 'light' : 'dark'), [resolved, setPreference])

  const api = useMemo(() => ({ preference, resolved, setPreference, toggle }), [preference, resolved, setPreference, toggle])
  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être utilisé dans <ThemeProvider>')
  return ctx
}
