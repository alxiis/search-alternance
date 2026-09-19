/** Toutes les dates métier sont des chaînes YYYY-MM-DD en heure locale. */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): string {
  return toIsoDate(new Date())
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()
  return Math.round(ms / 86_400_000)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseIsoDate(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseIsoDate(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function mondayOf(iso: string): string {
  const d = parseIsoDate(iso)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return toIsoDate(d)
}

/** Convertit une date libre en YYYY-MM-DD, ou null si elle est illisible. */
export function coerceIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v)
  if (fr) return `${fr[3]}-${pad(Number(fr[2]))}-${pad(Number(fr[1]))}`
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : toIsoDate(new Date(t))
}
