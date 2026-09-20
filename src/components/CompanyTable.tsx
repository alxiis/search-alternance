import { ExternalLink, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SENT_STATUSES } from '../data/constants'
import type { Company, JobOffer } from '../types'
import { formatDate } from '../utils/dates'

function ExtLink({ url, label }: { url: string; label: string }) {
  if (!url) return <span className="text-muted-foreground">—</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-foreground hover:underline">
      {label} <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  )
}

export function CompanyTable({ companies, jobs }: { companies: Company[]; jobs: JobOffer[] }) {
  const counts = (c: Company) => {
    const own = jobs.filter((j) => j.companyId === c.id)
    return { offers: own.length, sent: own.filter((j) => SENT_STATUSES.includes(j.status)).length }
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              {['Entreprise', 'Secteur', 'Lieu', 'Site', 'Recrutement', 'Offres', 'Candidatures', 'Dernière recherche', 'Notes'].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {companies.map((c) => {
              const { offers, sent } = counts(c)
              return (
                <tr key={c.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-3 py-2.5"><Link to={`/entreprises/${c.id}`} className="font-medium text-accent-foreground hover:underline">{c.name}</Link></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.sector || '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.location || '—'}</td>
                  <td className="px-3 py-2.5"><ExtLink url={c.website} label="Site" /></td>
                  <td className="px-3 py-2.5"><ExtLink url={c.careersUrl} label="Carrières" /></td>
                  <td className="px-3 py-2.5 tabular-nums">{offers}</td>
                  <td className="px-3 py-2.5 tabular-nums">{sent}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatDate(c.lastSearchAt)}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground" title={c.notes}>{c.notes || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {companies.map((c) => {
          const { offers, sent } = counts(c)
          return (
            <li key={c.id} className="p-4">
              <Link to={`/entreprises/${c.id}`} className="font-semibold text-accent-foreground hover:underline">{c.name}</Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                {c.sector && <span>{c.sector}</span>}
                {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{c.location}</span>}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">{offers} offre{offers > 1 ? 's' : ''} · {sent} candidature{sent > 1 ? 's' : ''}</span>
                {c.website && <ExtLink url={c.website} label="Site" />}
                {c.careersUrl && <ExtLink url={c.careersUrl} label="Carrières" />}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
