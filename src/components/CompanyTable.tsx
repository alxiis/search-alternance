import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SENT_STATUSES } from '../data/constants'
import type { Company, JobOffer } from '../types'
import { formatDate } from '../utils/dates'

export function CompanyTable({ companies, jobs }: { companies: Company[]; jobs: JobOffer[] }) {
  const link = (url: string, label: string) =>
    url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
        {label} <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    ) : (
      <span className="text-slate-400">—</span>
    )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {['Entreprise', 'Secteur', 'Lieu', 'Site', 'Recrutement', 'Offres', 'Candidatures', 'Dernière recherche', 'Notes'].map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {companies.map((c) => {
            const own = jobs.filter((j) => j.companyId === c.id)
            const sent = own.filter((j) => SENT_STATUSES.includes(j.status)).length
            return (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5"><Link to={`/entreprises/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link></td>
                <td className="px-3 py-2.5 text-slate-600">{c.sector || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{c.location || '—'}</td>
                <td className="px-3 py-2.5">{link(c.website, 'Site')}</td>
                <td className="px-3 py-2.5">{link(c.careersUrl, 'Carrières')}</td>
                <td className="px-3 py-2.5 tabular-nums">{own.length}</td>
                <td className="px-3 py-2.5 tabular-nums">{sent}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDate(c.lastSearchAt)}</td>
                <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-500" title={c.notes}>{c.notes || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
