import { Copy, ExternalLink, FileDown, Import, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { copyText, openExternal } from '../lib/clipboard'
import { downloadBlob } from '../utils/csv'

interface Props {
  text: string
  onImport?: () => void
}

/** Prompt éditable + actions Copier / Ouvrir Claude. Aucun envoi réseau : tout passe par le presse-papiers. */
export function PromptPanel({ text, onImport }: Props) {
  const { data } = useStore()
  const { notify } = useToast()
  const [edited, setEdited] = useState<{ source: string; value: string } | null>(null)
  const current = edited && edited.source === text ? edited.value : text
  const cv = data.files.find((f) => f.id === 'cv')

  const copy = async (thenOpen: boolean) => {
    const ok = await copyText(current)
    if (!ok) {
      notify('Copie impossible : sélectionnez le texte et copiez-le manuellement (Ctrl+C).', 'error')
      return
    }
    notify(thenOpen ? 'Prompt copié. Collez-le dans Claude (Ctrl+V).' : 'Prompt copié dans le presse-papiers.')
    if (thenOpen) openExternal(data.settings.claudeUrl)
  }

  return (
    <div className="space-y-3">
      <textarea
        className="input h-72 font-mono text-xs leading-relaxed"
        value={current}
        onChange={(e) => setEdited({ source: text, value: e.target.value })}
        aria-label="Prompt à copier dans Claude"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => void copy(true)}>
          <ExternalLink className="h-4 w-4" aria-hidden /> Copier et ouvrir Claude
        </button>
        <button className="btn-secondary" onClick={() => void copy(false)}>
          <Copy className="h-4 w-4" aria-hidden /> Copier le prompt
        </button>
        <button className="btn-secondary" onClick={() => openExternal(data.settings.claudeUrl)}>
          <ExternalLink className="h-4 w-4" aria-hidden /> Ouvrir Claude
        </button>
        {onImport && (
          <button className="btn-secondary ml-auto" onClick={onImport}>
            <Import className="h-4 w-4" aria-hidden /> Importer le résultat
          </button>
        )}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        <p>
          {current.length.toLocaleString('fr-FR')} caractères. Ce texte contient vos informations personnelles : il n'est envoyé nulle part tant que vous ne le collez pas vous-même dans Claude.
          {cv ? ' Pensez aussi à joindre votre CV dans la conversation.' : ''}
        </p>
        {cv && (
          <button className="btn-ghost btn-sm shrink-0" onClick={() => downloadBlob(cv.blob, cv.name)}>
            <FileDown className="h-3.5 w-3.5" aria-hidden /> CV
          </button>
        )}
      </div>
    </div>
  )
}
