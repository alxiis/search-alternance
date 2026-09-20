import { Download, FileText, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import type { StoredFile } from '../types'
import { downloadBlob } from '../utils/csv'
import { formatDate } from '../utils/dates'
import { formatBytes } from '../utils/text'

const MAX_BYTES = 10 * 1024 * 1024

interface SlotProps {
  id: StoredFile['id']
  label: string
  accept: string
  validate: (file: File) => string | null
}

function FileSlot({ id, label, accept, validate }: SlotProps) {
  const { data, saveFile, deleteFile } = useStore()
  const { notify } = useToast()
  const input = useRef<HTMLInputElement>(null)
  const stored = data.files.find((f) => f.id === id)

  const onPick = async (file: File | undefined) => {
    if (!file) return
    const problem = file.size > MAX_BYTES ? 'Fichier trop volumineux (10 Mo maximum).' : validate(file)
    if (problem) return notify(problem, 'error')
    try {
      await saveFile(id, file)
      notify(`${label} enregistré localement.`)
    } catch {
      /* déjà signalé */
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-input p-4">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {stored ? (
            <p className="truncate text-xs text-muted-foreground">{stored.name} · {formatBytes(stored.size)} · ajouté le {formatDate(stored.addedAt)}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Aucun fichier</p>
          )}
        </div>
        <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => { void onPick(e.target.files?.[0]); e.target.value = '' }} />
        <div className="flex gap-1">
          <button className="btn-secondary btn-sm" onClick={() => input.current?.click()}><Upload className="h-3.5 w-3.5" aria-hidden />{stored ? 'Remplacer' : 'Importer'}</button>
          {stored && (
            <>
              <button className="btn-ghost btn-sm" onClick={() => downloadBlob(stored.blob, stored.name)} aria-label={`Télécharger ${stored.name}`}><Download className="h-4 w-4" /></button>
              <button className="btn-ghost btn-sm text-danger" onClick={() => void deleteFile(id).then(() => notify('Fichier supprimé.'))} aria-label={`Supprimer ${stored.name}`}><Trash2 className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function FileManager() {
  return (
    <section className="card p-5">
      <h2 className="mb-1 font-semibold text-foreground">Documents</h2>
      <p className="mb-4 text-sm text-muted-foreground">Conservés uniquement dans ce navigateur (IndexedDB). Ils ne sont jamais envoyés nulle part : c'est vous qui les joignez dans Claude.</p>
      <div className="grid gap-3">
        <FileSlot id="cv" label="CV (PDF)" accept="application/pdf,.pdf" validate={(f) => (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf') ? null : 'Le CV doit être un fichier PDF.')} />
        <FileSlot id="letter" label="Lettre de motivation de base" accept=".pdf,.doc,.docx,.txt,.odt" validate={() => null} />
      </div>
    </section>
  )
}
