import { CalendarClock, MapPin, Sparkles } from 'lucide-react'
import { useUi } from '../hooks/useUi'
import type { JobOffer } from '../types'
import { formatShortDate } from '../utils/dates'
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
          <p className="truncate text-xs font-medium text-slate-500">{companyName || 'Entreprise inconnue'}</p>
          <button className="text-left text-sm font-semibold text-brand-700 hover:underline" onClick={() => openJob(job.id)}>
            {job.title || 'Offre sans titre'}
          </button>
        </div>
        <ScoreBadge score={job.compatibilityScore} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{job.location}</span>}
        <span>Ajoutée le {formatShortDate(job.discoveredAt)}</span>
        {job.application.followUpDate && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" aria-hidden />Relance {formatShortDate(job.application.followUpDate)}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusSelect job={job} />
        <button className="btn-secondary btn-sm" onClick={() => analyzeJob(job.id)}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Analyser</button>
      </div>
    </article>
  )
}
