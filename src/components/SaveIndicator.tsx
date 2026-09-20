import { Check, Loader2, TriangleAlert } from 'lucide-react'
import type { SaveState } from '../hooks/useAutosave'

export function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">
      {state === 'saving' && <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enregistrement…</>}
      {state === 'saved' && <><Check className="h-4 w-4 text-success" aria-hidden /> Enregistré sur cet appareil</>}
      {state === 'error' && <><TriangleAlert className="h-4 w-4 text-danger" aria-hidden /> Échec de l'enregistrement</>}
      {state === 'idle' && 'Enregistrement automatique'}
    </p>
  )
}
