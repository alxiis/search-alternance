import { AlertTriangle, FileUp } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { TONE_BADGE } from '../data/tones'
import { buildImportPlan, type ImportItem } from '../services/claudeImport'
import { parseClaudeText, type ParsedPayload } from '../services/claudeParser'
import { DUPLICATE_REASON_LABEL } from '../utils/dedupe'
import { cn } from '../utils/text'
import { Modal } from './Modal'
import { AvailabilityBadge, ScoreBadge } from './ScoreBadge'

interface Props {
  targetJobId?: string
  onClose: () => void
}

function Badge({ tone, children }: { tone: 'new' | 'dup' | 'target'; children: string }) {
  const cls = { new: TONE_BADGE.emerald, dup: TONE_BADGE.amber, target: TONE_BADGE.indigo }[tone]
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
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {item.raw.analysis && <ScoreBadge score={item.raw.analysis.compatibilityScore} />}
        {item.raw.analysis && <span>analyse</span>}
        {!item.raw.analysis && item.raw.matchScore !== null && <ScoreBadge score={item.raw.matchScore} estimated />}
        <AvailabilityBadge availability={item.raw.availability} />
        {item.raw.coverLetters && <span>· lettre(s)</span>}
        {item.raw.publishedAt && <span>· publiée le {item.raw.publishedAt}</span>}
      </div>
    )
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-input accent-[var(--primary)]" checked={checked} onChange={onToggle} aria-label={`Importer ${title}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          {badge}
        </div>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
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
  const [pickedTargetId, setPickedTargetId] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  // Une analyse ou une lettre sans offre doit être rattachée à une offre : celle de la fiche, sinon celle choisie ici.
  const needsTarget = Boolean(payload && !targetJobId && (payload.loneAnalysis || payload.loneLetters))
  const effectiveTargetId = targetJobId ?? (pickedTargetId || undefined)
  const targetJob = data.jobs.find((j) => j.id === targetJobId)
  const names = useMemo(() => new Map(data.companies.map((c) => [c.id, c.name])), [data.companies])
  const targetChoices = useMemo(
    () =>
      data.jobs
        .map((j) => ({ id: j.id, label: [names.get(j.companyId ?? ''), j.title || j.url || 'Offre sans titre'].filter(Boolean).join(' — ') }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
    [data.jobs, names],
  )
  const items = useMemo(
    () => (payload ? buildImportPlan(payload, { companies: data.companies, jobs: data.jobs, targetJobId: effectiveTargetId }) : []),
    [payload, data.companies, data.jobs, effectiveTargetId],
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
      const result = await importResults(chosen, effectiveTargetId)
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
        <p className="mb-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
          Le résultat (analyse, vérification ou lettre) sera rattaché à l'offre : <strong>{targetJob.title || targetJob.url}</strong>.
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
        <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {payload && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">Aperçu avant import</h3>
          <p className="text-xs text-muted-foreground">Décochez ce que vous ne voulez pas importer. Les doublons complètent l'existant sans écraser vos statuts ni vos notes.</p>
          {needsTarget && (
            <div className="mt-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-soft-foreground">
              <label htmlFor="import-target" className="font-medium">Cette réponse contient une analyse ou une lettre sans offre. À quelle offre la rattacher ?</label>
              {targetChoices.length ? (
                <select id="import-target" className="input mt-2" value={pickedTargetId} onChange={(e) => setPickedTargetId(e.target.value)}>
                  <option value="">— Choisir une offre —</option>
                  {targetChoices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              ) : (
                <p className="mt-1 text-xs">Aucune offre enregistrée : ajoutez d'abord l'offre concernée, puis importez depuis sa fiche.</p>
              )}
            </div>
          )}
          {payload.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-0.5 rounded-lg bg-warning-soft p-3 pl-7 text-xs text-warning-soft-foreground">
              {payload.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}
          <ul className="mt-2 divide-y divide-border">
            {items.map((item) => (
              <ItemRow key={item.key} item={item} checked={selected[item.key] ?? true} onToggle={() => setSelected((s) => ({ ...s, [item.key]: !(s[item.key] ?? true) }))} />
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
