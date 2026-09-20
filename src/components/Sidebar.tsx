import { Briefcase, Building2, CheckCheck, Database, KanbanSquare, LayoutDashboard, Lock, Search, SlidersHorizontal, UserRound, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/text'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  { title: 'Vue d’ensemble', items: [{ to: '/', label: 'Tableau de bord', icon: LayoutDashboard }] },
  {
    title: 'Candidatures',
    items: [
      { to: '/offres', label: 'Offres', icon: Briefcase },
      { to: '/kanban', label: 'Kanban', icon: KanbanSquare },
      { to: '/entreprises', label: 'Entreprises', icon: Building2 },
    ],
  },
  {
    title: 'Recherche',
    items: [
      { to: '/recherche', label: 'Recherche Claude', icon: Search },
      { to: '/criteres', label: 'Critères de recherche', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      { to: '/profil', label: 'Profil', icon: UserRound },
      { to: '/donnees', label: 'Données', icon: Database },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto p-4" aria-label="Navigation principale">
      <div className="mb-7 flex items-center gap-3 px-2 pt-1">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground shadow-sm">
          <CheckCheck className="h-5 w-5" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">Suivi Alternance</p>
          <p className="text-xs text-muted-foreground">Espace personnel</p>
        </div>
      </div>

      <div className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" aria-hidden />}
                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-auto flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Données stockées uniquement dans ce navigateur.
      </p>
    </nav>
  )
}
