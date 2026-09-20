import { ArrowLeft, Plus, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { JobCard } from '../components/JobCard'
import { SaveIndicator } from '../components/SaveIndicator'
import { StatCard } from '../components/StatCard'
import { TextArea, TextField } from '../components/fields'
import { CLOSED_STATUSES, SENT_STATUSES } from '../data/constants'
import { useAutosave } from '../hooks/useAutosave'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUi } from '../hooks/useUi'
import type { Company } from '../types'
import { formatDate } from '../utils/dates'
import { Briefcase, CalendarCheck, MessagesSquare, Send } from 'lucide-react'

function CompanyForm({ company }: { company: Company }) {
  const { saveCompany } = useStore()
  const [c, setC] = useState(company)
  const state = useAutosave(c, saveCompany)
  const set = <K extends keyof Company>(key: K, value: Company[K]) => setC((cur) => ({ ...cur, [key]: value }))

  const setUrl = (i: number, patch: Partial<Company['usefulUrls'][number]>) =>
    set('usefulUrls', c.usefulUrls.map((u, idx) => (idx === i ? { ...u, ...patch } : u)))

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Informations</h2>
        <SaveIndicator state={state} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nom" value={c.name} onChange={(v) => set('name', v)} />
        <TextField label="Secteur" value={c.sector} onChange={(v) => set('sector', v)} />
        <TextField label="Localisation" value={c.location} onChange={(v) => set('location', v)} />
        <TextField label="Site officiel" type="url" value={c.website} onChange={(v) => set('website', v)} />
        <div className="sm:col-span-2"><TextField label="Page recrutement" type="url" value={c.careersUrl} onChange={(v) => set('careersUrl', v)} /></div>
        <div className="sm:col-span-2"><TextArea label="Description" rows={3} value={c.description} onChange={(v) => set('description', v)} /></div>
        <div className="sm:col-span-2"><TextArea label="Notes" rows={3} value={c.notes} onChange={(v) => set('notes', v)} /></div>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-foreground">URLs utiles</h3>
      <div className="space-y-2">
        {c.usefulUrls.map((u, i) => (
          <div key={i} className="flex gap-2">
            <input className="input w-1/3" placeholder="Libellé" aria-label="Libellé de l'URL" value={u.label} onChange={(e) => setUrl(i, { label: e.target.value })} />
            <input className="input flex-1" type="url" placeholder="https://…" aria-label="URL" value={u.url} onChange={(e) => setUrl(i, { url: e.target.value })} />
            <button className="btn-ghost px-2" onClick={() => set('usefulUrls', c.usefulUrls.filter((_, idx) => idx !== i))} aria-label="Retirer cette URL"><X className="h-4 w-4" /></button>
          </div>
        ))}
        <button className="btn-secondary btn-sm" onClick={() => set('usefulUrls', [...c.usefulUrls, { label: '', url: '' }])}><Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter une URL</button>
      </div>

      {(c.compatibilityReasons.length > 0 || c.sources.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {c.compatibilityReasons.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Pourquoi cette entreprise (Claude)</h3>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">{c.compatibilityReasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
          {c.sources.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Sources</h3>
              <ul className="space-y-0.5 text-xs">
                {c.sources.map((s) => <li key={s} className="truncate">{/^https?:\/\//.test(s) ? <a href={s} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline">{s}</a> : s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, deleteCompany } = useStore()
  const { notify } = useToast()
  const { searchCompanyJobs, openAddJob } = useUi()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const company = data.companies.find((c) => c.id === id)

  if (!company) {
    return (
      <div className="card">
        <EmptyState icon={Search} title="Entreprise introuvable" description="Elle a peut-être été supprimée.">
          <Link to="/entreprises" className="btn-primary">Retour aux entreprises</Link>
        </EmptyState>
      </div>
    )
  }

  const jobs = data.jobs.filter((j) => j.companyId === company.id)
  const open = jobs.filter((j) => !CLOSED_STATUSES.includes(j.status) && !SENT_STATUSES.includes(j.status))
  const sent = jobs.filter((j) => SENT_STATUSES.includes(j.status))
  const interviews = jobs.filter((j) => j.status === 'interview' || j.status === 'second_interview')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/entreprises" className="btn-ghost -ml-2"><ArrowLeft className="h-4 w-4" aria-hidden /> Entreprises</Link>
        <h2 className="text-xl font-semibold text-foreground">{company.name}</h2>
        <span className="text-sm text-muted-foreground">Dernière recherche : {formatDate(company.lastSearchAt)}</span>
        <div className="ml-auto flex gap-2">
          <button className="btn-primary" onClick={() => searchCompanyJobs(company.id)}><Search className="h-4 w-4" aria-hidden /> Rechercher de nouvelles offres chez cette entreprise</button>
          <button className="btn-ghost text-danger hover:bg-danger-soft" onClick={() => setConfirmDelete(true)} aria-label="Supprimer l'entreprise"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Statistiques de l'entreprise">
        <StatCard label="Offres" value={jobs.length} icon={Briefcase} />
        <StatCard label="Offres ouvertes" value={open.length} icon={CalendarCheck} tone="sky" />
        <StatCard label="Candidatures envoyées" value={sent.length} icon={Send} tone="violet" />
        <StatCard label="Entretiens" value={interviews.length} icon={MessagesSquare} tone="teal" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Offres ({jobs.length})</h2>
          <button className="btn-secondary btn-sm" onClick={() => openAddJob()}><Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter une offre</button>
        </div>
        {jobs.length === 0 ? (
          <div className="card"><EmptyState icon={Briefcase} title="Aucune offre pour cette entreprise" description="Lancez la recherche d'offres avec Claude, puis importez le résultat." /></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">{jobs.map((j) => <JobCard key={j.id} job={j} companyName={company.name} />)}</div>
        )}
      </section>

      <CompanyForm key={company.id} company={company} />

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cette entreprise ?"
          message={`« ${company.name} » sera supprimée. Ses ${jobs.length} offre(s) sont conservées, sans entreprise associée.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void deleteCompany(company.id).then(() => { notify('Entreprise supprimée.'); navigate('/entreprises') })}
        />
      )}
    </div>
  )
}
