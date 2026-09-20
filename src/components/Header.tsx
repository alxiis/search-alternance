import { Import, Menu, Plus } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUi } from '../hooks/useUi'
import { NAV_ITEMS } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { openAddJob, openImport } = useUi()
  const current = NAV_ITEMS.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
      <button className="icon-btn -ml-1 md:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <h1 className="page-title truncate">{current?.label ?? 'Suivi Alternance'}</h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button className="btn-secondary max-sm:h-9 max-sm:w-9 max-sm:px-0" onClick={() => openImport()} title="Importer un résultat Claude (JSON)" aria-label="Importer résultat Claude">
          <Import className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Importer résultat Claude</span>
        </button>
        <button className="btn-primary max-sm:w-9 max-sm:px-0" onClick={() => openAddJob()} aria-label="Ajouter une offre" title="Ajouter une offre">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Ajouter une offre</span>
        </button>
      </div>
    </header>
  )
}
