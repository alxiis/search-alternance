import { ArrowLeft, Briefcase, CalendarCheck, ExternalLink, MessagesSquare, Plus, Search, Send, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContactMessageModal, ContactsSection } from '../components/ContactsSection'
import { EmptyState } from '../components/EmptyState'
import { JobCard } from '../components/JobCard'
import { ProspectStatusSelect } from '../components/ProspectStatusSelect'
import { SaveIndicator } from '../components/SaveIndicator'
import { StatCard } from '../components/StatCard'
import { TextArea, TextField } from '../components/fields'
import { CLOSED_STATUSES, PROSPECT_WAITING, SENT_STATUSES } from '../data/constants'
import { useAutosave } from '../hooks/useAutosave'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUi } from '../hooks/useUi'
import { directoryPageUrl } from '../services/companyDirectory'
import type { Company } from '../types'
import { addDays, formatDate, today } from '../utils/dates'
import { cn } from '../utils/text'

/** Champs modifiables dans le formulaire. Le reste de la fiche (contacts, prospection, sources…) a ses propres commandes. */
const FORM_FIELDS = ['name', 'sector', 'location', 'size', 'siren', 'website', 'careersUrl', 'description', 'notes', 'usefulUrls'] as const
type Draft = Pick<Company, (typeof FORM_FIELDS)[number]>

const pickDraft = (c: Company): Draft => ({
  name: c.name, sector: c.sector, location: c.location, size: c.size, siren: c.siren,
  website: c.website, careersUrl: c.careersUrl, description: c.description, notes: c.notes, usefulUrls: c.usefulUrls,
})
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

function CompanyForm({ company }: { company: Company }) {
  const { updateCompany } = useStore()
  const [c, setC] = useState<Draft>(() => pickDraft(company))
  /** Dernier état connu du store : sert à n'enregistrer que les champs réellement modifiés ici. */
  const stored = useRef<Draft>(pickDraft(company))

  // La fiche peut changer ailleurs pendant qu'elle est ouverte (import d'un résultat Claude) :
  // les champs que l'utilisateur n'est pas en train de modifier reprennent la nouvelle valeur.
  useEffect(() => {
    const incoming = pickDraft(company)
    const previous = stored.current
    stored.current = incoming
    setC((cur) => {
      const changed = FORM_FIELDS.filter((k) => same(cur[k], previous[k]) && !same(incoming[k], cur[k]))
      return changed.length ? { ...cur, ...Object.fromEntries(changed.map((k) => [k, incoming[k]])) } : cur
    })
  }, [company])

  const state = useAutosave(c, async (draft) => {
    const patch = Object.fromEntries(FORM_FIELDS.filter((k) => !same(draft[k], stored.current[k])).map((k) => [k, draft[k]])) as Partial<Draft>
    if (patch.name !== undefined && !patch.name.trim()) delete patch.name
    if (Object.keys(patch).length) await updateCompany(company.id, patch)
  })
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setC((cur) => ({ ...cur, [key]: value }))

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
        <TextField label="Effectif" value={c.size} onChange={(v) => set('size', v)} placeholder="Ex. : 20 à 49 salariés" />
        <TextField label="Site officiel" type="url" value={c.website} onChange={(v) => set('website', v)} />
        <TextField label="SIREN" value={c.siren} onChange={(v) => set('siren', v.replace(/\D/g, '').slice(0, 9))} hint="9 chiffres : donne accès à la fiche officielle de l'entreprise." />
        <div className="sm:col-span-2"><TextField label="Page recrutement" type="url" value={c.careersUrl} onChange={(v) => set('careersUrl', v)} /></div>
        <div className="sm:col-span-2"><TextArea label="Description" rows={3} value={c.description} onChange={(v) => set('description', v)} /></div>
        <div className="sm:col-span-2"><TextArea label="Notes" rows={3} value={c.notes} onChange={(v) => set('notes', v)} hint="Par exemple la marche à suivre pour une candidature spontanée." /></div>
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

      {(company.compatibilityReasons.length > 0 || company.sources.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {company.compatibilityReasons.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Pourquoi cette entreprise (Claude)</h3>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">{company.compatibilityReasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
          {company.sources.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Sources</h3>
              <ul className="space-y-0.5 text-xs">
                {company.sources.map((s) => <li key={s} className="truncate">{/^https?:\/\//.test(s) ? <a href={s} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline">{s}</a> : s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/** Candidature spontanée : où en est-on avec cette entreprise, et quand relancer. */
function ProspectCard({ company }: { company: Company }) {
  const { updateCompany } = useStore()
  const [writing, setWriting] = useState(false)
  const waiting = PROSPECT_WAITING.includes(company.prospectStatus)
  const late = waiting && company.followUpDate !== null && company.followUpDate <= today()
  const patch = (p: Partial<Company>) => void updateCompany(company.id, p).catch(() => undefined)

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-foreground">Candidature spontanée</h2>
        <ProspectStatusSelect company={company} />
        <button className="btn-secondary btn-sm ml-auto" onClick={() => setWriting(true)}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Rédiger une candidature spontanée</button>
      </div>
      {company.prospectStatus === 'none' ? (
        <p className="mt-3 text-sm text-muted-foreground">Cette entreprise n'est suivie que pour ses offres. Passez-la en « À contacter » pour lui écrire même sans offre publiée.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Premier contact le" type="date" value={company.contactedAt ?? ''} onChange={(v) => patch({ contactedAt: v || null })} />
          <div>
            <TextField label="Relance prévue le" type="date" value={company.followUpDate ?? ''} onChange={(v) => patch({ followUpDate: v || null })} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Dans :</span>
              {[7, 14, 30].map((d) => <button key={d} className="btn-secondary btn-sm" onClick={() => patch({ followUpDate: addDays(today(), d) })}>{d} jours</button>)}
              {company.followUpDate && <button className="btn-ghost btn-sm" onClick={() => patch({ followUpDate: null })}>Effacer</button>}
            </div>
            {company.followUpDate && <p className={cn('hint', late && 'font-semibold text-danger')}>{late ? 'Relance à faire.' : waiting ? 'Elle apparaîtra sur le tableau de bord.' : 'Affichée sur le tableau de bord quand l’entreprise est « Contactée » ou « À relancer ».'}</p>}
          </div>
        </div>
      )}
      {writing && <ContactMessageModal company={company} contact={company.contacts[0]} initialKind="spontaneous" onClose={() => setWriting(false)} />}
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
        <span className="text-sm text-muted-foreground">Dernière recherche d'offres : {formatDate(company.lastSearchAt)}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {/^\d{9}$/.test(company.siren) && (
            <a className="btn-secondary" href={directoryPageUrl(company.siren)} target="_blank" rel="noopener noreferrer">Fiche officielle <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
          )}
          <button className="btn-primary" onClick={() => searchCompanyJobs(company.id)}><Search className="h-4 w-4" aria-hidden /> Rechercher ses offres</button>
          <button className="btn-ghost text-danger hover:bg-danger-soft" onClick={() => setConfirmDelete(true)} aria-label="Supprimer l'entreprise"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Statistiques de l'entreprise">
        <StatCard label="Offres" value={jobs.length} icon={Briefcase} />
        <StatCard label="Offres ouvertes" value={open.length} icon={CalendarCheck} tone="sky" />
        <StatCard label="Candidatures envoyées" value={sent.length} icon={Send} tone="violet" />
        <StatCard label="Entretiens" value={interviews.length} icon={MessagesSquare} tone="teal" />
      </section>

      <ProspectCard company={company} />

      <ContactsSection company={company} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Offres ({jobs.length})</h2>
          <button className="btn-secondary btn-sm" onClick={() => openAddJob()}><Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter une offre</button>
        </div>
        {jobs.length === 0 ? (
          <div className="card"><EmptyState icon={Briefcase} title="Aucune offre pour cette entreprise" description="Lancez la recherche d'offres avec Claude, puis importez le résultat — ou tentez une candidature spontanée." /></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">{jobs.map((j) => <JobCard key={j.id} job={j} companyName={company.name} />)}</div>
        )}
      </section>

      <CompanyForm key={company.id} company={company} />

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cette entreprise ?"
          message={`« ${company.name} » sera supprimée, avec ses ${company.contacts.length} contact(s). Ses ${jobs.length} offre(s) sont conservées, sans entreprise associée.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void deleteCompany(company.id).then(() => { notify('Entreprise supprimée.'); navigate('/entreprises') })}
        />
      )}
    </div>
  )
}
