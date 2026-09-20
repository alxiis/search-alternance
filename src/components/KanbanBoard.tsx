import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { KANBAN_STATUSES, STATUS_META } from '../data/constants'
import { useStore } from '../hooks/useStore'
import { useUi } from '../hooks/useUi'
import type { Company, JobOffer, JobStatus } from '../types'
import { formatShortDate, today } from '../utils/dates'
import { cn } from '../utils/text'
import { ScoreBadge } from './ScoreBadge'

/** « Relance à faire » n'a pas de colonne : ces offres restent visibles dans « Postulé ». */
const columnOf = (status: JobStatus): JobStatus => (status === 'followup' ? 'applied' : status)

function KanbanCard({ job, companyName }: { job: JobOffer; companyName: string }) {
  const { openJob } = useUi()
  const { setJobStatus } = useStore()
  const follow = job.application.followUpDate
  const late = follow !== null && follow <= today()

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', job.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm active:cursor-grabbing"
    >
      <p className="truncate text-xs font-medium text-muted-foreground">{companyName || 'Entreprise inconnue'}</p>
      <button className="mt-0.5 text-left text-sm font-semibold text-foreground hover:text-accent-foreground" onClick={() => openJob(job.id)}>
        {job.title || 'Offre sans titre'}
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ScoreBadge score={job.compatibilityScore} />
        <span>{formatShortDate(job.application.appliedAt ?? job.discoveredAt)}</span>
      </div>
      {follow && (
        <p className={cn('mt-2 inline-flex items-center gap-1 text-xs', late ? 'font-semibold text-danger' : 'text-muted-foreground')}>
          <CalendarClock className="h-3 w-3" aria-hidden /> Relance {formatShortDate(follow)}
        </p>
      )}
      <select
        className="mt-2 w-full rounded-md border border-border bg-muted py-1 text-xs text-muted-foreground md:hidden"
        value={columnOf(job.status)}
        onChange={(e) => void setJobStatus(job.id, e.target.value as JobStatus).catch(() => undefined)}
        aria-label={`Déplacer ${job.title}`}
      >
        {KANBAN_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
      </select>
    </article>
  )
}

export function KanbanBoard({ jobs, companies }: { jobs: JobOffer[]; companies: Company[] }) {
  const { setJobStatus } = useStore()
  const [over, setOver] = useState<JobStatus | null>(null)
  const names = new Map(companies.map((c) => [c.id, c.name]))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((status) => {
        const items = jobs.filter((j) => columnOf(j.status) === status)
        return (
          <section
            key={status}
            aria-label={STATUS_META[status].label}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(status)
            }}
            onDragLeave={() => setOver((cur) => (cur === status ? null : cur))}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              const id = e.dataTransfer.getData('text/plain')
              const job = jobs.find((j) => j.id === id)
              if (job && columnOf(job.status) !== status) void setJobStatus(id, status).catch(() => undefined)
            }}
            className={cn('w-72 shrink-0 rounded-xl bg-muted p-3 transition-colors', over === status && 'bg-accent ring-2 ring-ring/40')}
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className={cn('h-2 w-2 rounded-full', STATUS_META[status].dot)} aria-hidden />
              {STATUS_META[status].label}
              <span className="ml-auto rounded-full bg-card px-2 text-xs font-medium text-muted-foreground">{items.length}</span>
            </h3>
            <div className="flex min-h-16 flex-col gap-2">
              {items.map((j) => <KanbanCard key={j.id} job={j} companyName={names.get(j.companyId ?? '') ?? ''} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
