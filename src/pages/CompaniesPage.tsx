import { Building2, Plus, Search, Target } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CompanyTable } from '../components/CompanyTable'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { TextField } from '../components/fields'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { ALL_PROSPECT_STATUSES, PROSPECT_META } from '../data/constants'
import { emptyCompany } from '../lib/factories'
import type { ProspectStatus } from '../types'
import { findCompanyByName } from '../utils/dedupe'
import { normalizeText } from '../utils/text'

export function CompaniesPage() {
  const { data, saveCompany } = useStore()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [prospect, setProspect] = useState<ProspectStatus | ''>('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const visible = useMemo(() => {
    const q = normalizeText(query)
    return [...data.companies]
      .filter((c) => !prospect || c.prospectStatus === prospect)
      .filter((c) => !q || normalizeText(`${c.name} ${c.sector} ${c.location} ${c.notes} ${c.contacts.map((p) => `${p.name} ${p.role}`).join(' ')}`).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [data.companies, query, prospect])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const existing = findCompanyByName(name, data.companies)
    if (existing) {
      notify('Cette entreprise existe déjà.', 'info')
      return navigate(`/entreprises/${existing.id}`)
    }
    const company = emptyCompany(name.trim())
    try {
      await saveCompany(company)
      navigate(`/entreprises/${company.id}`)
    } catch {
      /* déjà signalé */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input className="input pl-9" type="search" placeholder="Rechercher une entreprise ou un contact…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher une entreprise" />
        </div>
        <select className="input w-auto" value={prospect} onChange={(e) => setProspect(e.target.value as ProspectStatus | '')} aria-label="Filtrer par état de prospection">
          <option value="">Toute la prospection</option>
          {ALL_PROSPECT_STATUSES.map((s) => <option key={s} value={s}>{PROSPECT_META[s].label}</option>)}
        </select>
        <Link to="/prospection" className="btn-secondary"><Target className="h-4 w-4" aria-hidden /> Prospecter</Link>
        <button className="btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" aria-hidden /> Ajouter une entreprise</button>
      </div>

      <div className="card">
        {visible.length === 0 ? (
          <EmptyState icon={Building2} title={data.companies.length ? 'Aucun résultat' : 'Aucune entreprise'} description={data.companies.length ? 'Aucune entreprise ne correspond à cette recherche.' : 'Les entreprises apparaissent quand vous ajoutez une offre ou importez un résultat Claude.'} />
        ) : (
          <CompanyTable companies={visible} jobs={data.jobs} />
        )}
      </div>

      {adding && (
        <Modal
          title="Ajouter une entreprise"
          size="md"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setAdding(false)}>Annuler</button>
              <button type="submit" form="add-company-form" className="btn-primary" disabled={!name.trim()}>Ajouter</button>
            </>
          }
        >
          <form id="add-company-form" onSubmit={(e) => void create(e)}>
            <TextField label="Nom de l'entreprise" required value={name} onChange={setName} />
          </form>
        </Modal>
      )}
    </div>
  )
}
