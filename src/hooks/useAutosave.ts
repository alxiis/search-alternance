import { useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Sauvegarde automatique (débouncée) d'un brouillon de formulaire.
 * Ne sauvegarde pas tant que le brouillon est identique à la valeur de départ.
 */
export function useAutosave<T>(draft: T, save: (value: T) => Promise<void>, delayMs = 700): SaveState {
  const [state, setState] = useState<SaveState>('idle')
  const lastSaved = useRef(JSON.stringify(draft))
  const saveRef = useRef(save)
  saveRef.current = save

  useEffect(() => {
    const serialized = JSON.stringify(draft)
    if (serialized === lastSaved.current) return
    const timer = setTimeout(() => {
      setState('saving')
      saveRef.current(draft).then(
        () => {
          lastSaved.current = serialized
          setState('saved')
        },
        () => setState('error'),
      )
    }, delayMs)
    return () => clearTimeout(timer)
  }, [draft, delayMs])

  return state
}
