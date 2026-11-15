import { DEFAULT_CLAUDE_URL } from '../data/constants'
import { isHttpUrl } from '../utils/url'

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Repli pour les contextes sans API Clipboard (http, permissions refusées).
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}

/** Ouvre un onglet. Une adresse enregistrée qui n'est pas http(s) (réglage vide, sauvegarde modifiée…) est remplacée par `fallback`. */
export function openExternal(url: string, fallback = DEFAULT_CLAUDE_URL): void {
  window.open(isHttpUrl(url) ? url.trim() : fallback, '_blank', 'noopener,noreferrer')
}
