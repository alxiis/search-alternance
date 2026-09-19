import { Briefcase, ChevronLeft, ChevronRight, FlaskConical, Import, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { JobCard } from '../components/JobCard'
import { JobTable } from '../components/JobTable'
import { SearchFilters } from '../components/SearchFilters'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUi } from '../hooks/useUi'
import { filterJobs, hasActiveFilters, NO_FILTERS, sortJobs, type JobFilters, type SortDir, type SortKey } from '../utils/jobFilters'

const PAGE_SIZE = 15

export function JobsPage() {
  const { data, loadDemo } = useStore()
  const { notify } = useToast()
  const { openAddJob, openImport } = useUi()
  const [filters, setFilters] = useState<JobFilters>(NO_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>('discoveredAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const visible = useMemo(
    () => sortJobs(filterJobs(data.jobs, data.companies, filters), data.companies, sortKey, sortDir),
    [data.jobs, data.companies, filters, sortKey, sortDir],
  )
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const pageJobs = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const names = new Map(data.companies.map((c) => [c.id, c.name]))

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'company' || key === 'title' ? 'asc' : 'desc')
    }
  }

  if (!data.jobs.length) {
    return (
      <div className="card">
        <EmptyState icon={Briefcase} title="Aucune offre pour l'instant" description="Collez l'URL d'une offre, importez le résultat d'une recherche Claude, ou chargez des données de démonstration pour tester.">
          <button className="btn-primary" onClick={() => openAddJob()}><Plus className="h-4 w-4" aria-hidden /> Ajouter une offre</button>
          <button className="btn-secondary" onClick={() => openImport()}><Import className="h-4 w-4" aria-hidden /> Importer résultat Claude</button>
          <button className="btn-secondary" onClick={() => void loadDemo().then(() => notify('Données de démonstration chargées.'))}><FlaskConical className="h-4 w-4" aria-hidden /> Données de démo</button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SearchFilters filters={filters} companies={data.companies} onChange={(f) => { setFilters(f); setPage(0) }} />
      <p className="text-sm text-slate-500" aria-live="polite">{visible.length} offre{visible.length > 1 ? 's' : ''}{hasActiveFilters(filters) ? ` sur ${data.jobs.length}` : ''}</p>

      {visible.length === 0 ? (
        <div className="card"><EmptyState icon={Briefcase} title="Aucun résultat" description="Aucune offre ne correspond à ces filtres.">
          <button className="btn-secondary" onClick={() => setFilters(NO_FILTERS)}>Réinitialiser les filtres</button>
        </EmptyState></div>
      ) : (
        <>
          <div className="card hidden md:block">
            <JobTable jobs={pageJobs} companies={data.companies} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          </div>
          <div className="grid gap-3 md:hidden">
            {pageJobs.map((j) => <JobCard key={j.id} job={j} companyName={names.get(j.companyId ?? '')} />)}
          </div>
        </>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary btn-sm" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-slate-600">Page {current + 1} / {pageCount}</span>
          <button className="btn-secondary btn-sm" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}
