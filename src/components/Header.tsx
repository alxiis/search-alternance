import { Import, Menu, Plus } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUi } from '../hooks/useUi'
import { NAV_ITEMS } from './Sidebar'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { openAddJob, openImport } = useUi()
  const current = NAV_ITEMS.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <button className="btn-ghost -ml-2 p-2 md:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="truncate text-lg font-semibold text-slate-900">{current?.label ?? 'Suivi Alternance'}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button className="btn-secondary" onClick={() => openImport()} title="Importer un résultat Claude (JSON)">
          <Import className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Importer résultat Claude</span>
        </button>
        <button className="btn-primary" onClick={() => openAddJob()}>
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Ajouter une offre</span>
          <span className="sm:hidden">Offre</span>
        </button>
      </div>
    </header>
  )
}
