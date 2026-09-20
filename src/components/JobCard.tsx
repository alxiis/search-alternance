import { CalendarClock, ExternalLink, MapPin, Search, Sparkles } from 'lucide-react'
import { useUi } from '../hooks/useUi'
import type { JobOffer } from '../types'
import { formatShortDate } from '../utils/dates'
import { offerSearchUrl } from '../utils/url'
import { ScoreBadge } from './ScoreBadge'
import { StatusSelect } from './StatusSelect'

interface Props {
  job: JobOffer
  companyName?: string
}

export function JobCard({ job, companyName }: Props) {
  const { openJob, analyzeJob } = useUi()
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{companyName || 'Entreprise inconnue'}</p>
          <button className="text-left text-sm font-semibold text-accent-foreground hover:underline" onClick={() => openJob(job.id)}>
            {job.title || 'Offre sans titre'}
          </button>
        </div>
        <ScoreBadge score={job.compatibilityScore} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{job.location}</span>}
        <span>Ajoutée le {formatShortDate(job.discoveredAt)}</span>
        {job.application.followUpDate && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" aria-hidden />Relance {formatShortDate(job.application.followUpDate)}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusSelect job={job} />
        <div className="flex gap-2">
          <a
            className="btn-secondary btn-sm"
            href={job.url || offerSearchUrl(job, companyName ?? '')}
            target="_blank"
            rel="noopener noreferrer"
            title={job.url ? "Ouvrir la page de l'offre" : "Pas d'URL enregistrée : lancer une recherche web pour retrouver cette offre"}
          >
            {job.url ? <ExternalLink className="h-3.5 w-3.5" aria-hidden /> : <Search className="h-3.5 w-3.5" aria-hidden />}
            {job.url ? 'Voir' : 'Chercher'}
          </a>
          <button className="btn-secondary btn-sm" onClick={() => analyzeJob(job.id)}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Analyser</button>
        </div>
      </div>
    </article>
  )
}
