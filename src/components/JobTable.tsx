import { ArrowDown, ArrowUp, ExternalLink, Search, Sparkles } from 'lucide-react'
import { useUi } from '../hooks/useUi'
import type { Company, JobOffer } from '../types'
import { formatShortDate, today } from '../utils/dates'
import type { SortDir, SortKey } from '../utils/jobFilters'
import { cn } from '../utils/text'
import { offerSearchUrl } from '../utils/url'
import { ScoreBadge } from './ScoreBadge'
import { StatusSelect } from './StatusSelect'

interface Props {
  jobs: JobOffer[]
  companies: Company[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'company', label: 'Entreprise' },
  { key: 'title', label: 'Poste' },
  { key: 'location', label: 'Lieu' },
  { key: 'contractType', label: 'Type' },
  { key: 'discoveredAt', label: 'Découverte' },
  { key: 'publishedAt', label: 'Publication' },
  { key: 'score', label: 'Compatibilité' },
  { key: 'status', label: 'Statut' },
]

export function FollowUpLabel({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>
  const late = date <= today()
  return <span className={cn('whitespace-nowrap', late && 'font-semibold text-danger')}>{formatShortDate(date)}{late ? ' ⚠' : ''}</span>
}

export function JobTable({ jobs, companies, sortKey, sortDir, onSort }: Props) {
  const { openJob, analyzeJob } = useUi()
  const names = new Map(companies.map((c) => [c.id, c.name]))

  const sortable = (key: SortKey, label: string) => (
    <th key={key} scope="col" aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-3 py-2.5 text-left font-medium">
      <button className="inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground" onClick={() => onSort(key)}>
        {label}
        {sortKey === key && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)}
      </button>
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            {COLUMNS.map((c) => sortable(c.key, c.label))}
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Lien</th>
            {sortable('lastActionAt', 'Dernière action')}
            {sortable('followUp', 'Relance')}
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Notes</th>
            <th scope="col" className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((j) => (
            <tr key={j.id} className="transition-colors hover:bg-muted/50">
              <td className="px-3 py-2.5 font-medium text-foreground">{names.get(j.companyId ?? '') ?? <span className="text-muted-foreground">—</span>}</td>
              <td className="max-w-[260px] px-3 py-2.5">
                <button className="text-left font-medium text-accent-foreground hover:underline" onClick={() => openJob(j.id)}>
                  {j.title || 'Offre sans titre'}
                </button>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">{j.location || '—'}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{j.contractType || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatShortDate(j.discoveredAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatShortDate(j.publishedAt)}</td>
              <td className="px-3 py-2.5"><ScoreBadge score={j.compatibilityScore} /></td>
              <td className="px-3 py-2.5"><StatusSelect job={j} /></td>
              <td className="px-3 py-2.5">
                {j.url ? (
                  <a href={j.url} target="_blank" rel="noopener noreferrer" className="inline-flex text-muted-foreground hover:text-accent-foreground" aria-label={`Ouvrir l'offre ${j.title}`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <a
                    href={offerSearchUrl(j, names.get(j.companyId ?? '') ?? '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm whitespace-nowrap"
                    title="Pas d'URL enregistrée : lancer une recherche web pour retrouver cette offre"
                    aria-label={`Chercher l'offre ${j.title} sur le web`}
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden /> Chercher
                  </a>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatShortDate(j.lastActionAt)}</td>
              <td className="px-3 py-2.5"><FollowUpLabel date={j.application.followUpDate} /></td>
              <td className="max-w-[200px] truncate px-3 py-2.5 text-muted-foreground" title={j.notes}>{j.notes || '—'}</td>
              <td className="px-3 py-2.5 text-right">
                <button className="btn-secondary btn-sm" onClick={() => analyzeJob(j.id)} title="Générer le prompt d'analyse">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> Analyser
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
