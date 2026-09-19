import { Link } from 'react-router-dom'
import { KanbanBoard } from '../components/KanbanBoard'
import { useStore } from '../hooks/useStore'
import { KANBAN_STATUSES } from '../data/constants'

export function KanbanPage() {
  const { data } = useStore()
  const outside = data.jobs.filter((j) => j.status !== 'followup' && !KANBAN_STATUSES.includes(j.status)).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Glissez une carte d'une colonne à l'autre pour changer son statut (sauvegarde automatique). Sur mobile, utilisez la liste déroulante de la carte.
        {outside > 0 && (
          <> {outside} offre{outside > 1 ? 's' : ''} « À analyser » ou « Archivé » ne figure{outside > 1 ? 'nt' : ''} pas ici : <Link to="/offres" className="text-brand-600 hover:underline">voir le tableau</Link>.</>
        )}
      </p>
      <KanbanBoard jobs={data.jobs} companies={data.companies} />
    </div>
  )
}
