import { Briefcase, Building2, CheckCheck, Database, KanbanSquare, LayoutDashboard, Search, SlidersHorizontal, UserRound, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/text'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/profil', label: 'Profil', icon: UserRound },
  { to: '/criteres', label: 'Critères de recherche', icon: SlidersHorizontal },
  { to: '/recherche', label: 'Recherche Claude', icon: Search },
  { to: '/offres', label: 'Offres', icon: Briefcase },
  { to: '/kanban', label: 'Kanban', icon: KanbanSquare },
  { to: '/entreprises', label: 'Entreprises', icon: Building2 },
  { to: '/donnees', label: 'Données', icon: Database },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Navigation principale">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="rounded-lg bg-brand-600 p-1.5 text-white"><CheckCheck className="h-5 w-5" aria-hidden /></div>
        <span className="text-base font-semibold text-slate-900">Suivi Alternance</span>
      </div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </NavLink>
      ))}
      <p className="mt-auto px-2 pt-6 text-xs text-slate-400">Données stockées uniquement dans ce navigateur.</p>
    </nav>
  )
}
