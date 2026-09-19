import { Search, X } from 'lucide-react'
import { ALL_STATUSES, CONTRACT_TYPES, STATUS_META } from '../data/constants'
import type { Company, JobStatus } from '../types'
import { hasActiveFilters, NO_FILTERS, type JobFilters } from '../utils/jobFilters'

interface Props {
  filters: JobFilters
  companies: Company[]
  onChange: (f: JobFilters) => void
}

export function SearchFilters({ filters, companies, onChange }: Props) {
  const set = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => onChange({ ...filters, [key]: value })
  const sorted = [...companies].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[14rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input className="input pl-9" type="search" placeholder="Rechercher (entreprise, poste, lieu, notes…)" value={filters.query} onChange={(e) => set('query', e.target.value)} aria-label="Rechercher dans les offres" />
      </div>
      <select className="input w-auto" value={filters.status} onChange={(e) => set('status', e.target.value as JobStatus | '')} aria-label="Filtrer par statut">
        <option value="">Tous les statuts</option>
        {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
      </select>
      <select className="input w-auto" value={filters.contractType} onChange={(e) => set('contractType', e.target.value)} aria-label="Filtrer par type de contrat">
        <option value="">Tous les contrats</option>
        {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <select className="input w-auto" value={filters.companyId} onChange={(e) => set('companyId', e.target.value)} aria-label="Filtrer par entreprise">
        <option value="">Toutes les entreprises</option>
        {sorted.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className="input w-auto" value={filters.minScore} onChange={(e) => set('minScore', Number(e.target.value))} aria-label="Score minimum">
        <option value={0}>Tout score</option>
        {[50, 60, 70, 80, 90].map((n) => <option key={n} value={n}>Score ≥ {n}</option>)}
      </select>
      <label className="flex items-center gap-2 px-1 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={filters.followUpDue} onChange={(e) => set('followUpDue', e.target.checked)} />
        Relances dues
      </label>
      {hasActiveFilters(filters) && (
        <button className="btn-ghost btn-sm" onClick={() => onChange(NO_FILTERS)}><X className="h-3.5 w-3.5" aria-hidden /> Réinitialiser</button>
      )}
    </div>
  )
}
