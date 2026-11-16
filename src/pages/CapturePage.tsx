import { BookmarkPlus, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookmarkletInstall } from '../components/BookmarkletInstall'
import { EmptyState } from '../components/EmptyState'
import { TONE_BADGE } from '../data/tones'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUi } from '../hooks/useUi'
import { parseCapture } from '../services/capture'
import { buildImportPlan } from '../services/claudeImport'
import { formatDate, today } from '../utils/dates'
import { DUPLICATE_REASON_LABEL } from '../utils/dedupe'
import { cn } from '../utils/text'
import { hostOf } from '../utils/url'

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

/** Arrivée du bouton de capture : l'offre lue sur la page est montrée, puis ajoutée après confirmation. */
export function CapturePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data, importResults } = useStore()
  const { notify } = useToast()
  const { openJob } = useUi()
  const [busy, setBusy] = useState(false)
  const encoded = params.get('d')

  const capture = useMemo(() => (encoded ? parseCapture(encoded) : null), [encoded])
  const items = useMemo(
    () => (capture?.ok ? buildImportPlan(capture.payload, { companies: data.companies, jobs: data.jobs }) : []),
    [capture, data.companies, data.jobs],
  )

  if (!capture) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="card">
          <EmptyState icon={BookmarkPlus} title="Bouton de capture" description="Cette page reçoit les offres envoyées par le bouton de capture. Installez-le ci-dessous, puis cliquez dessus depuis la page d'une offre." />
        </div>
        <BookmarkletInstall />
      </div>
    )
  }

  if (!capture.ok) {
    return (
      <div className="card mx-auto max-w-2xl">
        <EmptyState icon={TriangleAlert} title="Capture impossible" description={capture.error}>
          <button className="btn-primary" onClick={() => navigate('/offres', { replace: true })}>Aller aux offres</button>
        </EmptyState>
      </div>
    )
  }

  const item = items.find((i) => i.kind === 'job')
  if (!item || item.kind !== 'job') return null
  const job = item.raw
  const duplicate = item.existingId !== null
  const expired = job.expiresAt !== null && job.expiresAt < today()

  const add = async () => {
    setBusy(true)
    try {
      const result = await importResults(items)
      const saved = result?.jobs[0]
      // L'adresse contient les données capturées : on la remplace pour ne pas la garder dans l'historique.
      navigate('/offres', { replace: true })
      if (saved) {
        notify(duplicate ? 'Offre déjà suivie : ses informations ont été complétées.' : 'Offre ajoutée à votre suivi.')
        openJob(saved.id)
      }
    } catch {
      /* déjà signalé par le store */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Offre capturée sur {hostOf(job.url) || 'la page'}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-foreground">{job.title || 'Offre sans titre'}</h2>
            <p className="text-sm text-muted-foreground">{job.companyName || 'Entreprise non détectée'}</p>
          </div>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', duplicate ? TONE_BADGE.amber : TONE_BADGE.emerald)}>
            {duplicate ? `Déjà suivie${item.reason ? ` (${DUPLICATE_REASON_LABEL[item.reason]})` : ''}` : 'Nouvelle offre'}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Detail label="Lieu" value={job.location} />
          <Detail label="Type de contrat" value={job.contractType} />
          <Detail label="Rémunération" value={job.salary} />
          <Detail label="Publiée le" value={job.publishedAt ? formatDate(job.publishedAt) : ''} />
          <Detail label={expired ? 'A expiré le' : 'Expire le'} value={job.expiresAt ? formatDate(job.expiresAt) : ''} />
          <Detail label="Niveau demandé" value={job.studyLevel} />
        </dl>
        {job.skills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((s) => <li key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">{s}</li>)}
          </ul>
        )}
        {job.description && (
          <details className="mt-4 rounded-lg border border-border">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">Description ({job.description.length.toLocaleString('fr-FR')} caractères)</summary>
            <p className="max-h-72 overflow-y-auto whitespace-pre-line border-t border-border p-3 text-sm text-muted-foreground">{job.description}</p>
          </details>
        )}

        {expired && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-soft-foreground">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> La date limite annoncée par cette offre est dépassée.
          </p>
        )}
        {!capture.structured && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-soft-foreground">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Cette page ne publie pas de données d'offre exploitables : seuls son titre et son adresse ont été repris{capture.hasDescription ? ', avec le texte sélectionné' : ''}.
              {capture.hasDescription ? '' : " Pour capturer aussi la description, retournez sur la page, sélectionnez le texte de l'annonce puis cliquez à nouveau sur le bouton."} Vous pourrez corriger les champs dans la fiche.
            </span>
          </p>
        )}
        {capture.payload.warnings.length > 0 && (
          <ul className="mt-4 list-disc space-y-0.5 rounded-lg bg-warning-soft p-3 pl-7 text-xs text-warning-soft-foreground">
            {capture.payload.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" onClick={() => navigate('/offres', { replace: true })}>Annuler</button>
          <button className="btn-primary" disabled={busy} onClick={() => void add()}>
            {duplicate ? 'Compléter l’offre existante' : 'Ajouter à mon suivi'}
          </button>
        </div>
      </section>
    </div>
  )
}
