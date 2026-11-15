export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function splitList(s: string): string[] {
  return s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function unique(list: string[]): string[] {
  const seen = new Set<string>()
  return list.filter((x) => {
    const k = normalizeText(x)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Ramène un type de contrat en texte libre (« Contrat d'apprentissage », « alternance 24 mois »…)
 * à l'une des valeurs de CONTRACT_TYPES, pour que les filtres fonctionnent. Valeur inconnue : renvoyée telle quelle.
 */
export function normalizeContractType(value: string): string {
  const n = normalizeText(value)
  if (!n) return ''
  if (n.includes('alternan') || n.includes('work study')) return 'Alternance'
  if (n.includes('professionnalisation') || /\bcontrat pro\b/.test(n)) return 'Contrat de professionnalisation'
  if (n.includes('apprenti')) return 'Apprentissage'
  if (/\b(stage|stagiaire|internship)\b/.test(n)) return 'Stage'
  if (/\bcdi\b/.test(n)) return 'CDI'
  if (/\bcdd\b/.test(n)) return 'CDD'
  return value.trim()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 ** 2).toFixed(1)} Mo`
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
