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

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <div className="absolute inset-0 bg-slate-900/40" aria-hidden />
          <aside className="relative h-full w-72 bg-white shadow-xl">
            <button className="btn-ghost absolute right-2 top-2 p-2" onClick={() => setDrawer(false)} aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <Header onMenu={() => setDrawer(true)} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 md:px-8 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden" aria-label="Navigation rapide">
        {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-brand-700' : 'text-slate-500')}>
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500">
          <Menu className="h-5 w-5" aria-hidden />
          Menu
        </button>
      </nav>
    </div>
  )
}
