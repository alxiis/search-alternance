import { Briefcase, KanbanSquare, LayoutDashboard, Menu, Search, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../utils/text'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const BOTTOM_ITEMS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard },
  { to: '/offres', label: 'Offres', icon: Briefcase },
  { to: '/kanban', label: 'Kanban', icon: KanbanSquare },
  { to: '/recherche', label: 'Recherche', icon: Search },
]

export function Layout() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card md:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="animate-overlay fixed inset-0 z-40 bg-black/50 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <aside className="animate-drawer relative h-full w-72 max-w-[85vw] border-r border-border bg-card shadow-xl" role="dialog" aria-modal="true" aria-label="Menu">
            <button className="icon-btn absolute right-3 top-3 border-transparent" onClick={() => setDrawer(false)} aria-label="Fermer le menu">
              <X className="h-5 w-5" aria-hidden />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <Header onMenu={() => setDrawer(true)} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Navigation rapide">
        {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors', isActive ? 'text-accent-foreground' : 'text-muted-foreground')}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" aria-hidden />}
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground" aria-label="Ouvrir le menu complet">
          <Menu className="h-5 w-5" aria-hidden />
          Menu
        </button>
      </nav>
    </div>
  )
}
