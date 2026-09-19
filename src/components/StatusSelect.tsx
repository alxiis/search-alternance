import { ALL_STATUSES, STATUS_META } from '../data/constants'
import { useStore } from '../hooks/useStore'
import type { JobOffer, JobStatus } from '../types'
import { cn } from '../utils/text'

/** Changement de statut direct, sauvegardé immédiatement. */
export function StatusSelect({ job, className }: { job: JobOffer; className?: string }) {
  const { setJobStatus } = useStore()
  return (
    <select
      value={job.status}
      onChange={(e) => void setJobStatus(job.id, e.target.value as JobStatus).catch(() => undefined)}
      aria-label={`Statut de ${job.title || 'l’offre'}`}
      className={cn('rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium focus:ring-2 focus:ring-brand-500/30', STATUS_META[job.status].badge, className)}
    >
      {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
    </select>
  )
}
