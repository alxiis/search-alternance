import { Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ALL_STATUSES, CONTRACT_TYPES, STATUS_META } from '../data/constants'
import { useStore, type NewJobInput } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import type { JobStatus } from '../types'
import { DUPLICATE_REASON_LABEL, type DuplicateMatch } from '../utils/dedupe'
import { ensureProtocol, isHttpUrl } from '../utils/url'
import { Modal } from './Modal'
import { SelectField, TextArea, TextField } from './fields'

interface Props {
  initialUrl?: string
  onClose: () => void
  onCreated: (jobId: string, analyze: boolean) => void
  onOpenExisting: (jobId: string) => void
}

const EMPTY: NewJobInput = {
  url: '', companyName: '', title: '', location: '', contractType: 'Alternance',
  publishedAt: null, salary: '', notes: '', status: 'to_analyze',
}

export function AddJobModal({ initialUrl = '', onClose, onCreated, onOpenExisting }: Props) {
  const { data, addJob } = useStore()
  const { notify } = useToast()
  const [form, setForm] = useState<NewJobInput>({ ...EMPTY, url: initialUrl })
  const [showMore, setShowMore] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof NewJobInput>(key: K, value: NewJobInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setDuplicate(null)
  }

  const submit = async (analyze: boolean) => {
    const url = ensureProtocol(form.url)
    if (!url) return setUrlError("L'URL de l'offre est obligatoire.")
    if (!isHttpUrl(url)) return setUrlError("Cette URL n'est pas valide (elle doit commencer par http:// ou https://).")
    setUrlError(null)
    setBusy(true)
    try {
      const result = await addJob({ ...form, url })
      if (!result.ok) {
        setDuplicate(result.duplicate)
        return
      }
      notify('Offre ajoutée.')
      onCreated(result.job.id, analyze)
    } catch {
      /* erreur déjà signalée par le store */
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit(false)
  }

  return (
    <Modal
      title="Ajouter une offre"
      size="md"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void submit(true)}>
            <Sparkles className="h-4 w-4" aria-hidden /> Ajouter et analyser
          </button>
          <button type="submit" form="add-job-form" className="btn-primary" disabled={busy}>Ajouter</button>
        </>
      }
    >
      <form id="add-job-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <TextField label="URL de l'offre" required value={form.url} onChange={(v) => { set('url', v); setUrlError(null) }} placeholder="https://…" type="url" autoFocus error={urlError} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Entreprise" value={form.companyName} onChange={(v) => set('companyName', v)} list="company-names" hint="Facultatif : Claude pourra la compléter" />
          <TextField label="Poste" value={form.title} onChange={(v) => set('title', v)} />
        </div>
        <datalist id="company-names">
          {data.companies.map((c) => <option key={c.id} value={c.name} />)}
        </datalist>

        <button type="button" className="text-sm font-medium text-accent-foreground hover:underline" onClick={() => setShowMore((s) => !s)} aria-expanded={showMore}>
          {showMore ? 'Masquer les détails' : 'Ajouter plus de détails'}
        </button>

        {showMore && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Localisation" value={form.location} onChange={(v) => set('location', v)} />
            <SelectField label="Type de contrat" value={form.contractType} onChange={(v) => set('contractType', v)} options={CONTRACT_TYPES} />
            <TextField label="Date de publication" type="date" value={form.publishedAt ?? ''} onChange={(v) => set('publishedAt', v || null)} />
            <TextField label="Salaire" value={form.salary} onChange={(v) => set('salary', v)} placeholder="Si disponible" />
            <div className="sm:col-span-2">
              <TextArea label="Notes" rows={3} value={form.notes} onChange={(v) => set('notes', v)} />
            </div>
            <SelectField
              label="Statut initial"
              value={form.status}
              onChange={(v) => set('status', v as JobStatus)}
              options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))}
            />
          </div>
        )}

        {duplicate && (
          <div role="alert" className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-soft-foreground">
            <p className="font-medium">Cette offre existe déjà ({DUPLICATE_REASON_LABEL[duplicate.reason]}).</p>
            <p className="mt-0.5 text-xs">{duplicate.job.title || duplicate.job.url}</p>
            <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => onOpenExisting(duplicate.job.id)}>Ouvrir l'offre existante</button>
          </div>
        )}
      </form>
    </Modal>
  )
}
