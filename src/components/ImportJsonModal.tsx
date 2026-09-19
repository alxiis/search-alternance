import { AlertTriangle, FileUp } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { buildImportPlan, type ImportItem } from '../services/claudeImport'
import { parseClaudeText, type ParsedPayload } from '../services/claudeParser'
import { DUPLICATE_REASON_LABEL } from '../utils/dedupe'
import { cn } from '../utils/text'
import { Modal } from './Modal'
import { ScoreBadge } from './ScoreBadge'

interface Props {
  targetJobId?: string
  onClose: () => void
}

function Badge({ tone, children }: { tone: 'new' | 'dup' | 'target'; children: string }) {
  const cls = { new: 'bg-emerald-100 text-emerald-800', dup: 'bg-amber-100 text-amber-800', target: 'bg-indigo-100 text-indigo-800' }[tone]
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{children}</span>
}

function ItemRow({ item, checked, onToggle }: { item: ImportItem; checked: boolean; onToggle: () => void }) {
  const existing = item.existingId !== null
  let title: string
  let subtitle: string
  let badge: React.ReactNode
  let extras: React.ReactNode = null

  if (item.kind === 'company') {
    title = item.raw.name
    subtitle = [item.raw.sector, item.raw.location].filter(Boolean).join(' · ') || 'Entreprise'
    badge = existing ? <Badge tone="dup">Existe déjà · complétée</Badge> : <Badge tone="new">Nouvelle</Badge>
  } else {
    title = item.raw.title || item.raw.url || 'Offre'
    subtitle = [item.raw.companyName, item.raw.location, item.raw.contractType].filter(Boolean).join(' · ')
    badge = item.isTarget ? (
      <Badge tone="target">Offre analysée · mise à jour</Badge>
    ) : existing ? (
      <Badge tone="dup">{`Doublon (${item.reason ? DUPLICATE_REASON_LABEL[item.reason] : 'déjà présente'}) · complétée`}</Badge>
    ) : (
      <Badge tone="new">Nouvelle</Badge>
    )
    extras = (
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {item.raw.analysis && <ScoreBadge score={item.raw.analysis.compatibilityScore} />}
        {item.raw.analysis && <span>analyse</span>}
        {item.raw.coverLetters && <span>· lettre(s)</span>}
        {item.raw.publishedAt && <span>· publiée le {item.raw.publishedAt}</span>}
      </div>
    )
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={checked} onChange={onToggle} aria-label={`Importer ${title}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-900">{title}</span>
          {badge}
        </div>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
        {extras}
      </div>
    </li>
  )
}

export function ImportJsonModal({ targetJobId, onClose }: Props) {
  const { data, importResults } = useStore()
  const { notify } = useToast()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<ParsedPayload | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const targetJob = data.jobs.find((j) => j.id === targetJobId)
  const items = useMemo(
    () => (payload ? buildImportPlan(payload, { companies: data.companies, jobs: data.jobs, targetJobId }) : []),
    [payload, data.companies, data.jobs, targetJobId],
  )
  const chosen = items.filter((i) => selected[i.key] ?? true)

  const analyse = (source: string) => {
    setPayload(null)
    if (source.includes('"suivi-alternance-backup"')) {
      setError("Ce fichier est une sauvegarde complète. Utilisez la page « Données » pour la restaurer.")
      return
    }
    const result = parseClaudeText(source)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setSelected({})
    setPayload(result.payload)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const content = await file.text()
    setText(content)
    analyse(content)
  }

  const doImport = async () => {
    setBusy(true)
    try {
      const result = await importResults(chosen, targetJobId)
      if (!result) {
        notify('Rien à importer.', 'info')
      } else {
        const { created, updated } = result
        notify(`Import terminé : ${created.jobs} offre(s) ajoutée(s), ${updated.jobs} mise(s) à jour, ${created.companies} entreprise(s) ajoutée(s).`)
        onClose()
      }
    } catch {
      /* déjà signalé par le store */
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Importer un résultat Claude"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          {payload ? (
            <button className="btn-primary" disabled={!chosen.length || busy} onClick={() => void doImport()}>
              Importer {chosen.length} élément{chosen.length > 1 ? 's' : ''}
            </button>
          ) : (
            <button className="btn-primary" disabled={!text.trim()} onClick={() => analyse(text)}>Vérifier le contenu</button>
          )}
        </>
      }
    >
      {targetJob && (
        <p className="mb-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
          L'analyse sera rattachée à l'offre : <strong>{targetJob.title || targetJob.url}</strong>.
        </p>
      )}
      <label htmlFor="claude-json" className="label">Réponse de Claude ou bloc JSON</label>
      <textarea
        id="claude-json"
        className="input h-40 font-mono text-xs"
        placeholder={'Collez ici la réponse complète de Claude (le JSON sera détecté automatiquement) ou uniquement le bloc { "companies": [...], "jobs": [...] }'}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setPayload(null)
          setError(null)
        }}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text')
          if (pasted && !text.trim()) {
            e.preventDefault()
            setText(pasted)
            analyse(pasted)
          }
        }}
      />
      <div className="mt-2 flex items-center gap-2">
        <input ref={fileInput} type="file" accept=".json,application/json,text/plain" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
        <button className="btn-secondary btn-sm" onClick={() => fileInput.current?.click()}>
          <FileUp className="h-3.5 w-3.5" aria-hidden /> Importer un fichier .json
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {payload && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-900">Aperçu avant import</h3>
          <p className="text-xs text-slate-500">Décochez ce que vous ne voulez pas importer. Les doublons complètent l'existant sans écraser vos statuts ni vos notes.</p>
          {payload.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-0.5 rounded-lg bg-amber-50 p-3 pl-7 text-xs text-amber-800">
              {payload.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}
          <ul className="mt-2 divide-y divide-slate-100">
            {items.map((item) => (
              <ItemRow key={item.key} item={item} checked={selected[item.key] ?? true} onToggle={() => setSelected((s) => ({ ...s, [item.key]: !(s[item.key] ?? true) }))} />
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
