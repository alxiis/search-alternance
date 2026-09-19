import { ExternalLink, FileText, Import, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ALL_STATUSES, CONTRACT_TYPES, STATUS_META } from '../data/constants'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { copyText } from '../lib/clipboard'
import type { JobOffer, JobStatus } from '../types'
import { addDays, formatDate, today } from '../utils/dates'
import { cn } from '../utils/text'
import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState } from './EmptyState'
import { Modal } from './Modal'
import { ScoreBadge } from './ScoreBadge'
import { SelectField, TagInput, TextArea, TextField } from './fields'

interface Props {
  jobId: string
  onClose: () => void
  onAnalyze: () => void
  onLetter: () => void
  onImport: () => void
}

type Tab = 'offer' | 'tracking' | 'analysis' | 'letters'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'offer', label: 'Offre' },
  { id: 'tracking', label: 'Suivi' },
  { id: 'analysis', label: 'Analyse Claude' },
  { id: 'letters', label: 'Lettres' },
]

function List({ title, items, tone }: { title: string; items: string[]; tone?: string }) {
  if (!items.length) return null
  return (
    <div>
      <h4 className="mb-1.5 text-sm font-semibold text-slate-800">{title}</h4>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => <li key={i} className={cn('rounded-md px-2 py-0.5 text-xs', tone ?? 'bg-slate-100 text-slate-700')}>{i}</li>)}
      </ul>
    </div>
  )
}

function Paragraph({ title, text }: { title: string; text: string }) {
  if (!text) return null
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-800">{title}</h4>
      <p className="whitespace-pre-line text-sm text-slate-600">{text}</p>
    </div>
  )
}

export function JobDetailsModal({ jobId, onClose, onAnalyze, onLetter, onImport }: Props) {
  const { data, updateJob, setJobStatus, deleteJob } = useStore()
  const { notify } = useToast()
  const original = data.jobs.find((j) => j.id === jobId)
  const [draft, setDraft] = useState<JobOffer | null>(original ?? null)
  const [companyName, setCompanyName] = useState(() => data.companies.find((c) => c.id === original?.companyId)?.name ?? '')
  const [tab, setTab] = useState<Tab>('offer')
  const [confirm, setConfirm] = useState<'delete' | 'discard' | null>(null)

  const companyOf = (id: string | null | undefined) => data.companies.find((c) => c.id === id)?.name ?? ''

  // Un import (analyse, lettre) modifie l'offre pendant que la fiche est ouverte : on resynchronise et on montre le résultat.
  const analyzedAt = original?.analysis?.analyzedAt
  const generatedAt = original?.coverLetters?.generatedAt
  const updatedAt = original?.updatedAt
  useEffect(() => {
    if (!original) return
    setDraft(original)
    setCompanyName(companyOf(original.companyId))
  }, [updatedAt])
  const seen = useRef({ analyzedAt, generatedAt })
  useEffect(() => {
    if (analyzedAt && analyzedAt !== seen.current.analyzedAt) setTab('analysis')
    else if (generatedAt && generatedAt !== seen.current.generatedAt) setTab('letters')
    seen.current = { analyzedAt, generatedAt }
  }, [analyzedAt, generatedAt])

  if (!original || !draft) return null

  const originalCompany = data.companies.find((c) => c.id === original.companyId)?.name ?? ''
  const dirty = JSON.stringify({ ...draft, updatedAt: '' }) !== JSON.stringify({ ...original, updatedAt: '' }) || companyName !== originalCompany
  const app = draft.application
  const set = <K extends keyof JobOffer>(key: K, value: JobOffer[K]) => setDraft({ ...draft, [key]: value })
  const setApp = (patch: Partial<JobOffer['application']>) => setDraft({ ...draft, application: { ...app, ...patch } })
  const setContact = (patch: Partial<JobOffer['application']['contact']>) => setApp({ contact: { ...app.contact, ...patch } })

  const save = async () => {
    try {
      const { status, id: _id, ...rest } = draft
      await updateJob(original.id, rest, companyName)
      if (status !== original.status) await setJobStatus(original.id, status)
      notify('Offre enregistrée.')
      onClose()
    } catch {
      /* déjà signalé */
    }
  }

  const requestClose = () => (dirty ? setConfirm('discard') : onClose())
  const copyLetter = async (text: string) => {
    const ok = await copyText(text)
    notify(ok ? 'Texte copié.' : 'Copie impossible.', ok ? 'success' : 'error')
  }

  const analysis = draft.analysis
  const letters = draft.coverLetters

  return (
    <>
      <Modal
        title={draft.title || 'Offre sans titre'}
        size="xl"
        onClose={requestClose}
        footer={
          <>
            <button className="btn-ghost mr-auto text-rose-600 hover:bg-rose-50" onClick={() => setConfirm('delete')}>
              <Trash2 className="h-4 w-4" aria-hidden /> Supprimer
            </button>
            <button className="btn-secondary" onClick={requestClose}>Fermer</button>
            <button className="btn-primary" disabled={!dirty} onClick={() => void save()}>Enregistrer</button>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ScoreBadge score={draft.compatibilityScore} />
          <span className="text-sm text-slate-500">{originalCompany || 'Entreprise inconnue'}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {draft.url && (
              <a className="btn-secondary btn-sm" href={draft.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Voir l'offre
              </a>
            )}
            <button className="btn-primary btn-sm" onClick={onAnalyze}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Analyser avec Claude</button>
            <button className="btn-secondary btn-sm" onClick={onLetter}><FileText className="h-3.5 w-3.5" aria-hidden /> Générer ma lettre</button>
            <button className="btn-secondary btn-sm" onClick={onImport}><Import className="h-3.5 w-3.5" aria-hidden /> Importer résultat Claude</button>
          </div>
        </div>

        <div role="tablist" className="mb-5 flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-medium', tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'offer' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Entreprise" value={companyName} onChange={setCompanyName} list="job-company-names" />
            <datalist id="job-company-names">{data.companies.map((c) => <option key={c.id} value={c.name} />)}</datalist>
            <TextField label="Poste" value={draft.title} onChange={(v) => set('title', v)} />
            <div className="sm:col-span-2"><TextField label="URL de l'offre" type="url" value={draft.url} onChange={(v) => set('url', v)} /></div>
            <TextField label="Localisation" value={draft.location} onChange={(v) => set('location', v)} />
            <SelectField label="Type de contrat" value={draft.contractType} onChange={(v) => set('contractType', v)} options={['', ...CONTRACT_TYPES]} />
            <TextField label="Date de publication" type="date" value={draft.publishedAt ?? ''} onChange={(v) => set('publishedAt', v || null)} />
            <TextField label="Date de découverte" type="date" value={draft.discoveredAt} onChange={(v) => set('discoveredAt', v || today())} />
            <TextField label="Salaire" value={draft.salary} onChange={(v) => set('salary', v)} />
            <SelectField label="Statut" value={draft.status} onChange={(v) => set('status', v as JobStatus)} options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
            <div className="sm:col-span-2"><TextArea label="Description de l'offre" rows={5} value={draft.description} onChange={(v) => set('description', v)} hint="Collez ici le texte de l'offre : il sera inclus dans le prompt d'analyse." /></div>
            <TagInput label="Compétences demandées" value={draft.skills} onChange={(v) => set('skills', v)} />
            <TagInput label="Exigences" value={draft.requirements} onChange={(v) => set('requirements', v)} />
            <div className="sm:col-span-2"><TextArea label="Notes" rows={3} value={draft.notes} onChange={(v) => set('notes', v)} /></div>
          </div>
        )}

        {tab === 'tracking' && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Date de candidature" type="date" value={app.appliedAt ?? ''} onChange={(v) => setApp({ appliedAt: v || null })} />
              <TextField label="Dernier contact" type="date" value={app.lastContactAt ?? ''} onChange={(v) => setApp({ lastContactAt: v || null })} />
              <TextField label="Date de relance" type="date" value={app.followUpDate ?? ''} onChange={(v) => setApp({ followUpDate: v || null })} />
              <TextField label="Date d'entretien" type="date" value={app.interviewDate ?? ''} onChange={(v) => setApp({ interviewDate: v || null })} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Relance dans :</span>
              {[3, 7, 14].map((d) => (
                <button key={d} className="btn-secondary btn-sm" onClick={() => setApp({ followUpDate: addDays(today(), d) })}>{d} jours</button>
              ))}
              {app.followUpDate && <button className="btn-ghost btn-sm" onClick={() => setApp({ followUpDate: null })}>Effacer</button>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Prochaine action" value={app.nextAction} onChange={(v) => setApp({ nextAction: v })} />
              <TextField label="Réponse reçue" value={app.response} onChange={(v) => setApp({ response: v })} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Contact RH</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nom" value={app.contact.name} onChange={(v) => setContact({ name: v })} />
              <TextField label="Email" type="email" value={app.contact.email} onChange={(v) => setContact({ email: v })} />
              <TextField label="Téléphone" type="tel" value={app.contact.phone} onChange={(v) => setContact({ phone: v })} />
              <TextField label="LinkedIn du recruteur" type="url" value={app.contact.linkedin} onChange={(v) => setContact({ linkedin: v })} />
            </div>
          </div>
        )}

        {tab === 'analysis' &&
          (analysis ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <ScoreBadge score={analysis.compatibilityScore} className="!px-4 !py-1.5 !text-lg" />
                <p className="text-xs text-slate-500">Score calculé par Claude lors de l'analyse du {formatDate(analysis.analyzedAt)}. L'application ne le recalcule pas.</p>
              </div>
              <Paragraph title="Explication du score" text={analysis.scoreExplanation} />
              <List title="Correspondances" items={analysis.matchingSkills} tone="bg-emerald-50 text-emerald-800" />
              <List title="Compétences manquantes" items={analysis.missingSkills} tone="bg-rose-50 text-rose-800" />
              <List title="Points forts" items={analysis.strengths} />
              <List title="Points faibles" items={analysis.weaknesses} />
              <List title="À mettre en avant" items={analysis.keyPoints} />
              <List title="Arguments de candidature" items={analysis.applicationArguments} />
              <Paragraph title="Activités de l'entreprise" text={analysis.companyInsights.activities} />
              <Paragraph title="Produits / services" text={analysis.companyInsights.products} />
              <Paragraph title="Projets récents" text={analysis.companyInsights.recentProjects} />
              <Paragraph title="Recommandation" text={analysis.recommendation} />
              {analysis.sources.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-slate-800">Sources</h4>
                  <ul className="space-y-0.5 text-xs">
                    {analysis.sources.map((s) => (
                      <li key={s} className="truncate">
                        {/^https?:\/\//.test(s) ? <a className="text-brand-600 hover:underline" href={s} target="_blank" rel="noopener noreferrer">{s}</a> : s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="Pas encore d'analyse" description="Générez le prompt, faites-le analyser par Claude, puis importez son résultat JSON pour voir le score et les recommandations ici.">
              <button className="btn-primary" onClick={onAnalyze}>Analyser avec Claude</button>
              <button className="btn-secondary" onClick={onImport}>Importer résultat Claude</button>
            </EmptyState>
          ))}

        {tab === 'letters' &&
          (letters ? (
            <div className="space-y-5">
              {([['Lettre complète', letters.full], ['Version courte', letters.short], [`Email${letters.emailSubject ? ` — ${letters.emailSubject}` : ''}`, letters.email], ['Message LinkedIn', letters.linkedin]] as const).map(
                ([title, text]) =>
                  text && (
                    <div key={title}>
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                        <button className="btn-secondary btn-sm" onClick={() => void copyLetter(text)}>Copier</button>
                      </div>
                      <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{text}</p>
                    </div>
                  ),
              )}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Aucune lettre enregistrée" description="Générez le prompt de lettre, puis importez la réponse de Claude : elle sera conservée ici.">
              <button className="btn-primary" onClick={onLetter}>Générer ma lettre</button>
            </EmptyState>
          ))}
      </Modal>

      {confirm === 'delete' && (
        <ConfirmDialog
          title="Supprimer cette offre ?"
          message="L'offre et son suivi seront définitivement supprimés de ce navigateur."
          confirmLabel="Supprimer"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            void deleteJob(original.id).then(() => {
              notify('Offre supprimée.')
              onClose()
            })
          }}
        />
      )}
      {confirm === 'discard' && (
        <ConfirmDialog
          title="Abandonner les modifications ?"
          message="Vos changements non enregistrés seront perdus."
          confirmLabel="Abandonner"
          onCancel={() => setConfirm(null)}
          onConfirm={onClose}
        />
      )}
    </>
  )
}
